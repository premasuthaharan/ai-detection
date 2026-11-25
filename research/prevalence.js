/**
 * Prevalence harness: how often does each candidate heuristic fire on AI
 * pages versus human pages in the corpus?
 *
 * This reports evidence; it does not choose weights. See research/README.md
 * for the dev/holdout rules and known limits.
 *
 * Usage:
 *   npm run research:check
 *   npm run research:prevalence                      # dev split, from snapshots
 *   npm run research:prevalence -- --live            # use live URLs instead
 *   npm run research:prevalence -- --holdout --reason "why"
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const puppeteer = require("puppeteer-core");
const { loadCorpus, validateCorpus } = require("./lib/corpus");
const { resolveChromePath } = require("./lib/browser");
const { PROBE_THRESHOLDS } = require("./probes");

const ROOT = path.join(__dirname, "..");
const SNAP_DIR = path.join(__dirname, "snapshots");
const REPORT_DIR = path.join(__dirname, "reports");
const LEDGER = path.join(__dirname, "holdout-ledger.md");
const REGISTRY_DIR = path.join(ROOT, "docs", "heuristics", "candidates");

function loadRegistry() {
  const entries = {};
  for (const f of fs.readdirSync(REGISTRY_DIR).filter((x) => x.endsWith(".md"))) {
    const src = fs.readFileSync(path.join(REGISTRY_DIR, f), "utf8");
    const m = src.match(/^---\n([\s\S]*?)\n---/);
    if (!m) throw new Error(`${f}: missing front matter`);
    const fm = {};
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    entries[fm.id] = { ...fm, file: f };
  }
  return entries;
}

function check(registry, sites) {
  const errors = [...validateCorpus(sites)];
  const probeIds = Object.keys(PROBE_THRESHOLDS);
  for (const id of probeIds) {
    if (!registry[id]) errors.push(`probe ${id} has no registry entry`);
    else if (registry[id].status !== "probe-implemented") errors.push(`probe ${id} exists but registry status is "${registry[id].status}"`);
  }
  for (const [id, e] of Object.entries(registry)) {
    if (e.status === "probe-implemented" && !PROBE_THRESHOLDS[id]) errors.push(`registry ${id} says probe-implemented but no probe exists`);
    for (const k of ["id", "name", "status", "evidence_tier", "sources"]) if (!e[k]) errors.push(`registry ${id}: missing "${k}"`);
  }
  return errors;
}

function wilson(k, n, z = 1.96) {
  if (n === 0) return [0, 1];
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const w = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - w) / d), Math.min(1, (c + w) / d)];
}
const pct = (x) => `${Math.round(x * 100)}%`;
const fmtRate = (k, n) => {
  if (n === 0) return "n/a";
  const [lo, hi] = wilson(k, n);
  return `${k}/${n} (${pct(k / n)}, 95% CI ${pct(lo)}-${pct(hi)})`;
};
const fmtVal = (v) => (v === null || v === undefined ? "n/a" : Number.isInteger(v) ? String(v) : v.toFixed(2));

function fired(id, value) {
  if (value === null || value === undefined) return false;
  const t = PROBE_THRESHOLDS[id];
  return t.direction === "low" ? value <= t.fireAt : value >= t.fireAt;
}

async function measure(browser, site, live) {
  const probesSrc = fs.readFileSync(path.join(__dirname, "probes.js"), "utf8");
  const snap = path.join(SNAP_DIR, `${site.id}.mhtml`);
  const useSnap = !live && fs.existsSync(snap);
  if (!live && !useSnap) throw new Error(`no snapshot for ${site.id}; run npm run research:snapshot`);
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(useSnap ? "file://" + snap : site.url, { waitUntil: "networkidle2", timeout: 45000 });
    await page.evaluate(probesSrc);
    return await page.evaluate("runProbes()");
  } finally {
    await page.close();
  }
}

function gitShort() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  } catch {
    return "unknown";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

  const registry = loadRegistry();
  const sites = loadCorpus();

  const errors = check(registry, sites);
  if (flag("--check")) {
    const dev = sites.filter((s) => s.split === "dev");
    const hold = sites.filter((s) => s.split === "holdout");
    console.log(`corpus: ${sites.length} sites (${dev.length} dev, ${hold.length} holdout)`);
    console.log(`registry: ${Object.keys(registry).length} entries, ${Object.keys(PROBE_THRESHOLDS).length} probes`);
    if (errors.length) { console.log("\nERRORS:\n" + errors.map((e) => "  - " + e).join("\n")); process.exit(1); }
    console.log("OK");
    return;
  }
  if (errors.length) { console.error("Fix these first (npm run research:check):\n" + errors.map((e) => "  - " + e).join("\n")); process.exit(1); }

  const holdout = flag("--holdout");
  const reason = val("--reason");
  if (holdout && (!reason || reason.startsWith("--"))) {
    console.error('Holdout evaluation needs --reason "<why>". It is recorded in research/holdout-ledger.md.');
    process.exit(1);
  }
  const split = holdout ? "holdout" : "dev";
  const target = sites.filter((s) => s.split === split);
  const live = flag("--live");

  if (holdout) {
    fs.appendFileSync(LEDGER, `| ${new Date().toISOString().slice(0, 10)} | ${gitShort()} | ${reason.replace(/\|/g, "/")} |\n`);
    console.log("Holdout evaluation recorded in research/holdout-ledger.md\n");
  }

  const browser = await puppeteer.launch({ executablePath: resolveChromePath(), headless: "new" });
  const results = [];
  for (const s of target) {
    process.stderr.write(`measuring ${s.id}...\n`);
    try {
      const r = await measure(browser, s, live);
      results.push({ site: s, ...r });
    } catch (err) {
      console.error(`FAILED ${s.id}: ${err.message}`);
      results.push({ site: s, probes: null, error: err.message });
    }
  }
  await browser.close();

  const ok = results.filter((r) => r.probes);
  const ai = ok.filter((r) => r.site.label === "ai");
  const human = ok.filter((r) => r.site.label === "human");

  const lines = [];
  lines.push(`# Prevalence report — ${split} split`);
  lines.push("");
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)} at commit ${gitShort()}, from ${live ? "live pages" : "local snapshots"}.`);
  lines.push(`Sites measured: ${ai.length} AI, ${human.length} human.`);
  lines.push("");
  lines.push("## Read this first");
  lines.push("- Thresholds are provisional initial guesses, not tuned values. A rate here says how often a guess fires, not how good the heuristic is.");
  lines.push(`- With ${ai.length} AI and ${human.length} human sites, intervals are wide. Do not set weights from this alone.`);
  if (!sites.some((s) => s.kind === "hard-negative")) lines.push("- The corpus has no hard negatives (modern, polished, human-built sites). Human results only show how plain old-school pages score.");
  if (new Set(ai.map((r) => r.site.generator)).size < 3) lines.push(`- AI sites come from ${new Set(ai.map((r) => r.site.generator)).size} generator families, so results partly describe those generators.`);
  if (holdout) lines.push("- Holdout run: per-site values are intentionally omitted.");
  lines.push("");

  const rows = Object.keys(PROBE_THRESHOLDS).map((id) => {
    const counted = (group) => {
      const withValue = group.filter((r) => r.probes[id] && r.probes[id].value !== null);
      return { n: withValue.length, k: withValue.filter((r) => fired(id, r.probes[id].value)).length };
    };
    const a = counted(ai), h = counted(human);
    const sep = (a.n ? a.k / a.n : 0) - (h.n ? h.k / h.n : 0);
    return { id, a, h, sep };
  }).sort((x, y) => Math.abs(y.sep) - Math.abs(x.sep));

  lines.push("## Probes, sorted by gap between AI and human fire rates");
  for (const row of rows) {
    const t = PROBE_THRESHOLDS[row.id];
    const name = registry[row.id].name;
    lines.push("");
    lines.push(`### ${row.id} — ${name}`);
    lines.push(`Fires when ${t.direction === "low" ? "<=" : ">="} ${t.fireAt} (${t.unit}); provisional.`);
    lines.push(`- AI: ${fmtRate(row.a.k, row.a.n)}`);
    lines.push(`- Human: ${fmtRate(row.h.k, row.h.n)}`);
    if (!holdout) {
      const vals = (group) => group.map((r) => `${r.site.id}=${fmtVal(r.probes[row.id] && r.probes[row.id].value)}`).join(", ");
      lines.push(`- AI values: ${vals(ai)}`);
      lines.push(`- Human values: ${vals(human)}`);
    }
  }

  const failed = results.filter((r) => !r.probes);
  if (failed.length) {
    lines.push("");
    lines.push("## Failed sites");
    for (const f of failed) lines.push(`- ${f.site.id}: ${f.error}`);
  }

  const report = lines.join("\n") + "\n";
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const reportPath = path.join(REPORT_DIR, `prevalence-${split}-${stamp}.md`);
  fs.writeFileSync(reportPath, report);
  if (!holdout) {
    const raw = ok.map((r) => ({ id: r.site.id, label: r.site.label, generator: r.site.generator || null, meta: r.meta, probes: r.probes }));
    fs.writeFileSync(path.join(REPORT_DIR, `prevalence-dev-raw-${stamp}.json`), JSON.stringify(raw, null, 2) + "\n");
  }
  console.log(report);
  console.error(`wrote ${path.relative(ROOT, reportPath)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
