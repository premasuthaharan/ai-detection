/**
 * Generates Chrome Web Store listing screenshots (1280x800) by driving the
 * real, unpacked extension in a real Chrome instance via Puppeteer.
 *
 * The tricky bit: popup.js resolves "the page to analyze" via
 * chrome.tabs.query({ active: true, currentWindow: true }). When the popup
 * is opened as a normal Puppeteer page (chrome-extension://.../popup.html)
 * rather than a real toolbar popup, IT becomes the active tab, so the
 * unmodified query would resolve to itself and get rejected by
 * isScannableUrl(). To work around that (without touching shipped code),
 * we patch chrome.tabs.query on the popup page only, via
 * evaluateOnNewDocument, so it resolves to the real target-site tab. Every
 * other code path (collector injection, scoring, rendering) runs exactly
 * as shipped.
 *
 * Usage:
 *   node scripts/screenshots.js
 *   CHROME_PATH=/path/to/chrome node scripts/screenshots.js
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist", "screenshots");
const STAGE_DIR = path.join(ROOT, "dist", "screenshot-extension-stage");

/**
 * The shipped manifest only requests "activeTab" (least privilege) — it
 * intentionally can't see tab URLs except during a real toolbar-icon click.
 * That means our automation, which resolves the target tab from the
 * service worker rather than via a real click, can't match tabs by URL.
 * We work around this by loading a throwaway copy of the extension with
 * "tabs" added, purely so this script can find the right tabId. The
 * shipped manifest.json in ROOT is never modified.
 */
function stageExtensionWithTabsPermission() {
  fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  fs.mkdirSync(STAGE_DIR, { recursive: true });
  for (const entry of ["manifest.json", "background.js", "content", "lib", "popup", "icons"]) {
    fs.cpSync(path.join(ROOT, entry), path.join(STAGE_DIR, entry), { recursive: true });
  }
  const manifestPath = path.join(STAGE_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.permissions = Array.from(new Set([...manifest.permissions, "tabs"]));
  // activeTab only grants scripting access when the popup is opened via a
  // real toolbar-icon click on the frontmost tab; our automation opens the
  // popup as a plain new tab, so it never gets that ephemeral grant. Add
  // blanket host permissions here (staged copy only) so
  // chrome.scripting.executeScript still works against the target tab.
  manifest.host_permissions = ["http://*/*", "https://*/*"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return STAGE_DIR;
}

const DEFAULT_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = DEFAULT_CHROME_PATHS.find((p) => fs.existsSync(p));
  if (!found) {
    console.error("Couldn't find a local Chrome install. Set CHROME_PATH and re-run.");
    process.exit(1);
  }
  return found;
}

async function findExtensionId(browser) {
  for (let i = 0; i < 40; i++) {
    const targets = await browser.targets();
    const sw = targets.find((t) => t.type() === "service_worker" && t.url().includes("background.js"));
    if (sw) return sw.url().split("/")[2];
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Timed out waiting for the extension's service worker to register.");
}

async function resolveTabId(browser, extId, tabUrl) {
  const targets = await browser.targets();
  const sw = targets.find((t) => t.type() === "service_worker" && t.url().includes(extId));
  const worker = await sw.worker();
  const tabId = await worker.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    const match = tabs.find((t) => t.url === url);
    return match ? match.id : null;
  }, tabUrl);
  if (tabId == null) throw new Error(`Could not resolve tabId for ${tabUrl}`);
  return tabId;
}

async function captureOne(browser, extId, { url, caption, outFile }) {
  const targetPage = await browser.newPage();
  await targetPage.setViewport({ width: 1280, height: 800 });
  await targetPage.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  const siteBuf = await targetPage.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 800 } });

  const tabId = await resolveTabId(browser, extId, targetPage.url());

  const popupPage = await browser.newPage();
  popupPage.on("console", (msg) => console.log("[popup console]", msg.text()));
  popupPage.on("pageerror", (err) => console.log("[popup pageerror]", err));
  await popupPage.evaluateOnNewDocument(
    (fakeTabId, fakeTabUrl) => {
      const fakeTab = { id: fakeTabId, url: fakeTabUrl, active: true, currentWindow: true };
      // Only the popup's own tabs.query call is patched; collectRawSignals
      // still calls the real chrome.scripting.executeScript against the
      // real tabId, so the actual collector/scoring code runs for real.
      chrome.tabs.query = (_queryInfo, callback) => {
        if (typeof callback === "function") {
          callback([fakeTab]);
          return undefined;
        }
        return Promise.resolve([fakeTab]);
      };
    },
    tabId,
    targetPage.url()
  );
  await popupPage.goto(`chrome-extension://${extId}/popup/popup.html`, { waitUntil: "load" });
  try {
    await popupPage.waitForSelector("#state-result:not(.hidden)", { timeout: 15000 });
  } catch (err) {
    await popupPage.screenshot({ path: path.join(OUT_DIR, "debug-popup-state.png") });
    throw err;
  }
  await new Promise((r) => setTimeout(r, 900)); // let the gauge animation settle

  const bodyHeight = await popupPage.evaluate(() => document.body.scrollHeight);
  await popupPage.setViewport({ width: 320, height: bodyHeight });
  const popupBuf = await popupPage.screenshot();

  const compositeHtml = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;width:1280px;height:800px;overflow:hidden;background:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
    .bg{position:absolute;top:0;left:0;width:1280px;height:800px;object-fit:cover;filter:brightness(0.5) saturate(0.9) blur(1.5px);}
    .scrim{position:absolute;inset:0;background:linear-gradient(135deg, rgba(17,24,39,0.55), rgba(17,24,39,0.25));}
    .popup{position:absolute;top:64px;right:64px;border-radius:14px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.18);}
    .popup img{display:block;width:320px;}
    .caption{position:absolute;bottom:56px;left:64px;max-width:620px;color:#fff;font-size:36px;font-weight:700;line-height:1.25;text-shadow:0 2px 16px rgba(0,0,0,0.5);}
  </style></head><body>
    <img class="bg" src="data:image/png;base64,${siteBuf.toString("base64")}" />
    <div class="scrim"></div>
    <div class="popup"><img src="data:image/png;base64,${popupBuf.toString("base64")}" /></div>
    <div class="caption">${caption}</div>
  </body></html>`;

  const compositePage = await browser.newPage();
  await compositePage.setViewport({ width: 1280, height: 800 });
  await compositePage.setContent(compositeHtml);
  await compositePage.screenshot({ path: outFile });

  await targetPage.close();
  await popupPage.close();
  await compositePage.close();
  console.log(`Wrote ${outFile}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stagedExtDir = stageExtensionWithTabsPermission();

  const browser = await puppeteer.launch({
    executablePath: resolveChromePath(),
    headless: false,
    // Puppeteer's default args include --disable-extensions, which would
    // silently cancel out --load-extension below.
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [`--disable-extensions-except=${stagedExtDir}`, `--load-extension=${stagedExtDir}`],
  });

  try {
    const extId = await findExtensionId(browser);
    console.log(`Loaded extension: ${extId}`);

    await captureOne(browser, extId, {
      url: "https://archive-shop-store.lovable.app/",
      caption: "Instantly see how \u201cAI-generated\u201d a page\u2019s UI looks",
      outFile: path.join(OUT_DIR, "screenshot-1-ai-generated.png"),
    });

    await captureOne(browser, extId, {
      url: "https://motherfuckingwebsite.com/",
      caption: "Works entirely locally \u2014 no false positives on hand-built pages",
      outFile: path.join(OUT_DIR, "screenshot-2-hand-built.png"),
    });
  } finally {
    await browser.close();
    fs.rmSync(stagedExtDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
