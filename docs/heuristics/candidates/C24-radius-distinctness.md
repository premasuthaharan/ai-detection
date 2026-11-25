---
id: C24
name: Number of distinct corner radii
status: probe-implemented
evidence_tier: T0
sources: S1b, S2
---

# C24 — Number of distinct corner radii

**Reported tell:** "inconsistent layouts throughout the site" (S1b); "inconsistent interaction patterns across screens" (S2).

**Proposed mechanism (hypothesis):** Both sources describe inconsistency across screens or pages. Within a single page, generator output tends to be uniform from shared design tokens, so this probe may point the opposite way. Included to test that.

**Measurement:** Number of distinct border-radius values (rounded to 2px) among boxed elements.

**Known failure modes:** Large human sites have many radii; small ones have few.

**Open questions:** Real cross-page inconsistency needs multi-page analysis (see C29).
