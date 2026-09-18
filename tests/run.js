/**
 * Regression test suite for the heuristic scoring pipeline.
 *
 * Runs the *exact* files the extension ships (content/collector.js +
 * lib/scoring.js) against a small set of known sites in real headless
 * Chrome, and asserts the resulting score/tier lands where expected.
 * This exists because past scoring bugs (see git history) were only
 * caught by manually testing against a live site — this locks those
 * fixes in so future heuristic tweaks can't silently regress them.
 *
 * Usage:
 *   npm test
 *   CHROME_PATH=/path/to/chrome npm test   # override browser location
 *
 * Add more cases to tests/sites.json as you find them (see brainstorm
 * step 2: gather more AI-generated + hand-crafted sites to calibrate).
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = path.join(__dirname, "..");
const DEFAULT_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
  "/usr/bin/google-chrome", // Linux
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
];

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = DEFAULT_CHROME_PATHS.find((p) => fs.existsSync(p));
  if (!found) {
    console.error(
      "Couldn't find a local Chrome install. Set CHROME_PATH to your Chrome executable and re-run."
    );
    process.exit(1);
  }
  return found;
}

async function scoreUrl(browser, url) {
  const collectorSrc = fs.readFileSync(path.join(ROOT, "content/collector.js"), "utf8");
  const scoringSrc = fs.readFileSync(path.join(ROOT, "lib/scoring.js"), "utf8");

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await page.evaluate(collectorSrc);
    const raw = await page.evaluate(() => window.__AI_SLOP_RAW__);
    await page.evaluate(scoringSrc);
    return await page.evaluate((raw) => window.AISlopScoring.computeScore(raw), raw);
  } finally {
    await page.close();
  }
}

function checkExpectations(testCase, result) {
  const failures = [];
  if (testCase.expectTier && !testCase.expectTier.includes(result.tier.id)) {
    failures.push(
      `expected tier in [${testCase.expectTier.join(", ")}], got "${result.tier.id}" (score ${result.score})`
    );
  }
  if (typeof testCase.expectMinScore === "number" && result.score < testCase.expectMinScore) {
    failures.push(`expected score >= ${testCase.expectMinScore}, got ${result.score}`);
  }
  if (typeof testCase.expectMaxScore === "number" && result.score > testCase.expectMaxScore) {
    failures.push(`expected score <= ${testCase.expectMaxScore}, got ${result.score}`);
  }
  return failures;
}

async function main() {
  const sites = JSON.parse(fs.readFileSync(path.join(__dirname, "sites.json"), "utf8"));
  const browser = await puppeteer.launch({ executablePath: resolveChromePath(), headless: "new" });

  let failCount = 0;
  for (const testCase of sites) {
    process.stdout.write(`- ${testCase.label}\n  ${testCase.url}\n`);
    try {
      const result = await scoreUrl(browser, testCase.url);
      const failures = checkExpectations(testCase, result);
      if (failures.length === 0) {
        console.log(`  PASS (score ${result.score}, tier "${result.tier.id}")\n`);
      } else {
        failCount++;
        console.log(`  FAIL (score ${result.score}, tier "${result.tier.id}")`);
        for (const f of failures) console.log(`    - ${f}`);
        console.log("");
      }
    } catch (err) {
      failCount++;
      console.log(`  ERROR: ${err.message}\n`);
    }
  }

  await browser.close();

  const total = sites.length;
  console.log(`${total - failCount}/${total} passed`);
  process.exit(failCount > 0 ? 1 : 0);
}

main();
