/**
 * Loads the research corpus and derives each site's split (dev | holdout).
 *
 * The split is a pure function of the manifest, so nobody (including us)
 * chooses holdout sites by hand after seeing results:
 *
 *   1. A site with calibrationBurned: true was already used to tune the
 *      shipping weights, so it is never eligible for holdout -> "dev".
 *   2. Every other site is grouped by (label, group), sorted by
 *      sha256(url), and every third one (ranks 0, 3, 6, ...) is
 *      "holdout". The rest are "dev".
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = path.join(__dirname, "..", "corpus", "manifest.json");

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function loadCorpus() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const sites = manifest.sites.map((s) => ({ ...s }));

  const eligible = sites.filter((s) => !s.calibrationBurned);
  const groups = new Map();
  for (const s of eligible) {
    const key = `${s.label}::${s.group}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  for (const members of groups.values()) {
    members.sort((a, b) => sha256(a.url).localeCompare(sha256(b.url)));
    members.forEach((s, i) => {
      s.split = i % 3 === 0 ? "holdout" : "dev";
      s.splitReason = `rank ${i} by sha256(url) within ${s.label}/${s.group}`;
    });
  }
  for (const s of sites) {
    if (s.calibrationBurned) {
      s.split = "dev";
      s.splitReason = "calibrationBurned: used to tune shipping weights";
    }
  }
  return sites;
}

function validateCorpus(sites) {
  const errors = [];
  const ids = new Set();
  for (const s of sites) {
    if (!s.id || !s.url || !["ai", "human"].includes(s.label)) {
      errors.push(`bad entry: ${JSON.stringify(s)}`);
    }
    if (ids.has(s.id)) errors.push(`duplicate id: ${s.id}`);
    ids.add(s.id);
    if (!s.claim) errors.push(`${s.id}: missing claim (provenance)`);
  }
  return errors;
}

module.exports = { loadCorpus, validateCorpus, sha256 };
