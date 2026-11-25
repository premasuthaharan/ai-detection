# Heuristics registry

Every signal this extension uses (or is considering) gets a written entry
here. The goal is that a user, a reviewer, or future-us can answer
"why does this fire, and why should anyone believe it?" from the entry
alone. **No signal ships without an entry. No weight changes without a
recorded rationale.**

## Entry standard

Each entry in [`candidates/`](candidates/) has a stable ID (`C01`, ...)
and these parts:

- **Reported tell** — what the sources actually say, in their words as
  closely as we can. Kept separate from our interpretation.
- **Proposed mechanism** — our *hypothesis* for why generators produce
  this. Labeled as a hypothesis until evidence supports it.
- **Measurement** — exactly what is computed from the DOM/CSS.
- **Known failure modes** — realistic ways a human-built page triggers it.
- **Open questions** — what we don't know yet.

Front matter: `id`, `name`, `status`, `evidence_tier`, `sources`.

Thresholds are **not** written in entries. Provisional thresholds live in
[`research/probes.js`](../../research/probes.js) so there is one source of
truth, and are replaced by values chosen from data.

## Evidence tiers

- **T0 — reported.** Someone said so (crowd comment, article). Anecdote.
  Not enough to add weight.
- **T1 — measured.** We measured how often it fires on labeled AI pages
  versus human pages in our corpus (dev split), with uncertainty. Minimum
  bar for any weight.
- **T2 — corroborated.** T1 plus an effect that held on the untouched
  holdout split, and/or independent sources.

Weights only come from T1 or better. Everything below starts at T0.

## Status values

- `candidate` — documented, no measurement yet
- `probe-implemented` — a research probe measures it; no weight
- `parked` — plausible but low value or too weak for now
- `infeasible-locally` — can't be measured from one page's DOM/CSS with
  the extension's current permissions

## Sources

- **S1a, S1b, S1c** — a crowd-sourced list of "AI-generated UI" tells from
  a community of developers, pasted by the project owner on 2026-11-20.
  The original venue and authors are unknown. The list arrived with three
  different bullet styles, which suggests three separate commenters (S1a:
  first block; S1b: `*` bullets; S1c: `•` bullets). That is an inference,
  not verified. Treat as opinion.
- **S2** — Nick Babich, "How To Spot AI-Generated Design", UX Planet,
  2026-05-19. Opinion/observation piece with no stated data. The article is
  member-only; the first section was read directly and the remaining
  sections came from an excerpt the project owner pasted. Section 5
  ("missing product constraints") was truncated in that excerpt.

## Corpus and holdout

How we measure (and avoid overfitting to a few examples) is described in
[`research/README.md`](../../research/README.md).

## Existing signals

The 15 signals already shipping in `content/collector.js` have not yet been
audited against this standard. That audit comes after the prevalence
harness produces data, and each will get an entry then.

## Index

See [`candidates/`](candidates/). Entries are named `C<number>-<slug>.md`.
