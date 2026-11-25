# Roadmap

Work happens on the `epistemic-v2` branch. The published v1.0 listing and
`master` are untouched until a phase is ready to ship.

## Standing rule (every phase)

- Every heuristic has a written entry: what it detects, why it indicates the
  thing, the source or evidence behind it, known failure modes, and its
  expected precision. See [`docs/heuristics/`](docs/heuristics/README.md).
- Every reason shown in the popup traces back to that entry.
- No signal ships without an entry, and no weight changes without a recorded
  rationale.
- Weights come from measured evidence (T1 or better), never from anecdote.

## Phases

1. **Foundations** — *partly done*
   - Heuristic documentation standard and registry of candidate signals (done)
   - Research corpus with provenance, derived dev/holdout split, local snapshots (done)
   - Prevalence harness with probe/registry consistency checks (done)
   - Main-article text extractor (not started)
   - Text test harness and labeled text corpus scaffolding (not started)

2. **UI rubric research (design score)** — *in progress*
   - Probes for 25 candidate UI tells and a first dev-split report (done)
   - Hard-negative and wider corpus: modern human-built sites, more AI generators (needs approval of candidates)
   - Audit the 15 shipping signals against the standard: evidence, failure modes, measured precision
   - Choose thresholds from dev data; record rationale
   - Revised rubric: re-justified weights, retired or merged weak signals
   - New signals implemented one at a time, each with its registry entry and regression tests
   - Holdout check, logged in the holdout ledger

3. **Rhetoric highlighter**
   - Detectors for loaded language, absolutes, urgency, false dichotomy, vague attribution and clickbait
   - Lexicons with cited sources
   - In-page highlights with explanatory tooltips
   - Labeled snippet set with per-category precision targets

4. **AI-text stylometry**
   - Features grounded in published stylometry research
   - Low / Medium / High bucket output, never a percentage
   - Calibration corpus including human-text edge cases
   - Ship gate: at most 5% false positives on the human holdout

5. **Scam and link hygiene**
   - Link and href mismatch, lookalike and punycode domains, urgency plus payment patterns
   - Bundled top-domains list

6. **Citation hygiene**
   - Unsourced statistics, homepage-only citations, vague attribution
   - `ClaimReview` parsing to surface existing fact-checks

7. **UI and release**
   - Design / Writing tabs in the popup
   - "Highlight in page" toggle and sensitivity setting
   - Updated README, store listing and screenshots
   - Version 1.1.0

8. **Gated, later: opt-in claim verification**
   - Claim extraction and evidence retrieval, snippet-only, per-page opt-in
   - Bring-your-own key or on-device model first
   - Updated privacy policy and store disclosures

## Parked

- Source-reliability list (needs a permissively licensed source)
- Corpus for text phases (AI-text half generated, human half supplied; to be revisited)
