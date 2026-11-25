---
id: C29
name: Cross-screen flow and consistency problems
status: infeasible-locally
evidence_tier: T0
sources: S1b, S2
---

# C29 — Cross-screen flow and consistency problems

**Reported tell:** S2: unrealistic user flows, missing edge states, inconsistent interaction patterns, "navigation that looks good but breaks usability"; and "missing product constraints" (truncated in the excerpt). S1b: inconsistent layouts throughout the site.

**Proposed mechanism (hypothesis):** Generators produce individual screens well but handle systems poorly.

**Measurement:** Requires crawling or comparing multiple pages, which the click-to-run `activeTab` model cannot do. Only partial single-page proxies exist (C23, C24).

**Known failure modes:** n/a

**Open questions:** Whether a multi-page mode is worth the permission cost.
