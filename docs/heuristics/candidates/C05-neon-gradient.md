---
id: C05
name: Neon gradients
status: probe-implemented
evidence_tier: T0
sources: S1a, S2
---

# C05 — Neon gradients

**Reported tell:** "Elements with neon gradients" (S1a); "heavy use of gradients (especially neon if you aim to design innovative product ...)" (S2).

**Proposed mechanism (hypothesis):** Prompts for an innovative or modern product bias generators toward saturated blue/purple/pink gradients.

**Measurement:** Count of elements (at least 40x40px) whose background gradient has two or more stops, at least one of them highly saturated at mid lightness. The shipping `gradients` signal uses a hue band only and ignores saturation.

**Known failure modes:** Brand gradients on human-built marketing sites; gaming and crypto sites.

**Open questions:** Definition of neon (saturation and lightness cutoffs) must be chosen from dev data.
