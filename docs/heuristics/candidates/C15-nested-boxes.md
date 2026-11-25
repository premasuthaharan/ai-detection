---
id: C15
name: Boxes inside boxes inside boxes
status: probe-implemented
evidence_tier: T0
sources: S1b
---

# C15 — Boxes inside boxes inside boxes

**Reported tell:** "Boxes in boxes in boxes (colored, with outline)" (S1b).

**Proposed mechanism (hypothesis):** Generators wrap content in card within card within card, each with its own border and fill.

**Measurement:** Maximum nesting depth of boxed elements (rounded, with a border or distinct fill) along any ancestor chain.

**Known failure modes:** Dashboards, app UIs, forms and docs with legitimately nested panels.

**Open questions:** Depth threshold.
