/**
 * Sanity test for the research probes: each one must fire on a page built to
 * trigger it, so a zero on real pages means "absent", not "broken probe".
 * Also checks that a plain page triggers almost nothing.
 *
 *   node research/test-probes.js
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const { resolveChromePath } = require("./lib/browser");
const { PROBE_THRESHOLDS } = require("./probes");

const src = fs.readFileSync(path.join(__dirname, "probes.js"), "utf8");
// C24 (few distinct radii) and C23/C14 need their own conditions; the control
// page is built to satisfy every probe's threshold except those listed here.
const EXPECT_QUIET_ON_CONTROL = new Set(["C24"]);

function fired(id, v) {
  if (v === null || v === undefined) return false;
  const t = PROBE_THRESHOLDS[id];
  return t.direction === "low" ? v <= t.fireAt : v >= t.fireAt;
}

async function runOn(browser, file) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("file://" + file, { waitUntil: "load" });
  await page.evaluate(src);
  const r = await page.evaluate("runProbes()");
  await page.close();
  return r.probes;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: resolveChromePath(), headless: "new" });
  const control = await runOn(browser, path.join(__dirname, "fixtures", "probe-controls.html"));
  const plain = await runOn(browser, path.join(__dirname, "..", "scripts", "fixtures", "handcrafted.html"));
  await browser.close();

  let bad = 0;
  for (const id of Object.keys(PROBE_THRESHOLDS)) {
    const onControl = fired(id, control[id].value);
    const onPlain = fired(id, plain[id].value);
    const wantControl = !EXPECT_QUIET_ON_CONTROL.has(id);
    const okControl = onControl === wantControl;
    // C14 (serif h1 + sans body) is deliberately false on the control (sans h1).
    const okPlain = !onPlain || id === "C24";
    const status = okControl && okPlain ? "ok  " : "FAIL";
    if (!(okControl && okPlain)) bad++;
    console.log(`${status} ${id} control=${control[id].value} (${onControl ? "fired" : "quiet"}) plain=${plain[id].value} ${JSON.stringify(control[id].detail).slice(0, 80)}`);
  }
  console.log(bad ? `\n${bad} probe(s) need attention` : "\nall probes behave on controls");
  process.exit(bad ? 1 : 0);
})();
