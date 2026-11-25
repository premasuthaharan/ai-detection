# Research harness

Tools for measuring heuristics against a labeled corpus before any of them
gets a weight. The rules here exist to keep the rubric honest and legible;
see [`docs/heuristics/`](../docs/heuristics/README.md) for the entry standard
and evidence tiers.

## Corpus

[`corpus/manifest.json`](corpus/manifest.json) lists each site with its
label (`ai` or `human`), generator, and **provenance** (the claim that
justifies the label). Labels are claims, not ground truth: a "vendor
example" may have been edited by a person.

Page snapshots (MHTML) are saved by `npm run research:snapshot` into
`research/snapshots/`, which is **gitignored**. They are other people's
pages, so only the manifest is committed. Snapshots replay close to, but not
exactly like, the live page (we saw differences of up to four points in the
shipping score), so all research runs use snapshots for repeatability.

## Splits and holdout

The goal is to avoid fitting heuristics to a handful of pages.

- **dev** — free to inspect. Used to look at pages, choose thresholds and
  decide what to keep.
- **holdout** — not inspected while designing. Used only to check a decision
  already made.

The split is derived, not hand-picked ([`lib/corpus.js`](lib/corpus.js)):

1. A site marked `calibrationBurned` (already used to tune the shipping
   weights) is always dev.
2. Every other site is grouped by label and source, sorted by
   `sha256(url)`, and every third one is holdout.

Evaluating the holdout is gated: it needs `--holdout --reason "<why>"` and
appends an entry to [`holdout-ledger.md`](holdout-ledger.md). A holdout set
that has been used to make a decision is "burned" for that decision and
needs fresh sites before it can be trusted again.

## Known limits (be skeptical of results)

- **Tiny sample.** Three AI holdout sites can catch a bad idea but cannot
  establish an effect. Reports show Wilson 95% intervals so this stays
  visible.
- **One generator.** The nine TeleportHQ examples share a generator, so a
  heuristic tuned on them mostly learns that generator. The Lovable/Bolt
  sites were used for the existing weights.
- **Holdout composition.** Two of the three AI holdout sites are vendor demos
  (`.dev` hosts), one is user-created.
- **No human holdout, and no hard negatives.** Every human site so far was
  used to calibrate the shipping weights and is plain, old-school HTML.
  Heuristics measured against only those would learn "modern vs. dated", not
  "AI vs. human". We need modern, polished, human-built sites, split into
  dev and holdout, before any false-positive claim is trustworthy.
- **Exposure disclosure.** Before this harness existed, the shipping score
  was run on all nine TeleportHQ sites (aggregate numbers only). No holdout
  page has been viewed and no probe has been run on a holdout site.

## Commands

```
npm run research:snapshot                 # save missing snapshots
npm run research:check                    # validate manifest, splits, probe<->registry links
npm run research:test-probes              # each probe must fire on a positive-control page
npm run research:prevalence               # dev-split report
npm run research:prevalence -- --holdout --reason "why"   # gated
```

## Probes

[`probes.js`](probes.js) holds one measurement per registry entry (C01 ...).
A probe reports a number plus detail, and has a *provisional* threshold used
only to compute a fire rate. Thresholds are replaced by values chosen from
dev data. Every probe must have a registry entry and vice versa
(`research:check` enforces this).

`research:test-probes` runs every probe against
[`fixtures/probe-controls.html`](fixtures/probe-controls.html), a page built to
trigger each one, and against a plain page. A probe that reads zero on real
sites is only meaningful as "absent" if it fires on its control.
