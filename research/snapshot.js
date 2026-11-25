/**
 * Saves an MHTML snapshot of each corpus site so research runs are
 * reproducible even if the live site changes or disappears.
 *
 * Snapshots are other people's pages, so they stay LOCAL: research/snapshots/
 * is gitignored. Only the manifest (URL + label + provenance) is committed.
 *
 * Usage:
 *   node research/snapshot.js              # snapshot sites that have none yet
 *   node research/snapshot.js --force      # re-snapshot everything
 *   node research/snapshot.js --only id1,id2
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const { loadCorpus, sha256 } = require("./lib/corpus");
const { resolveChromePath } = require("./lib/browser");

const SNAP_DIR = path.join(__dirname, "snapshots");
const INDEX = path.join(SNAP_DIR, "index.json");

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyArg = args.find((a) => a.startsWith("--only"));
  const only = onlyArg ? (args[args.indexOf(onlyArg) + 1] || onlyArg.split("=")[1] || "").split(",") : null;

  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const index = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, "utf8")) : {};
  const sites = loadCorpus().filter((s) => !only || only.includes(s.id));

  const browser = await puppeteer.launch({ executablePath: resolveChromePath(), headless: "new" });
  for (const s of sites) {
    const file = path.join(SNAP_DIR, `${s.id}.mhtml`);
    if (fs.existsSync(file) && !force) {
      console.log(`skip   ${s.id} (already snapshotted)`);
      continue;
    }
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(s.url, { waitUntil: "networkidle2", timeout: 45000 });
      const client = await page.createCDPSession();
      const { data } = await client.send("Page.captureSnapshot", { format: "mhtml" });
      fs.writeFileSync(file, data);
      index[s.id] = { url: s.url, capturedAt: new Date().toISOString(), sha256: sha256(data), bytes: data.length };
      console.log(`saved  ${s.id} (${Math.round(data.length / 1024)} KB)`);
    } catch (err) {
      console.log(`FAILED ${s.id}: ${err.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
  fs.writeFileSync(INDEX, JSON.stringify(index, null, 2));
}

main();
