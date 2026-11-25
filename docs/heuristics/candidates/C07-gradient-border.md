---
id: C07
name: Gradient borders
status: probe-implemented
evidence_tier: T0
sources: S1a
---

# C07 — Gradient borders

**Reported tell:** "Elements with neon gradient borders" (S1a).

**Proposed mechanism (hypothesis):** Generators produce gradient outlines on cards and buttons as a flourish.

**Measurement:** Count of elements with a gradient `border-image`, or a transparent border plus multiple stacked gradient backgrounds (the clip trick). Mask-composite pseudo-element borders are not detected.

**Known failure modes:** Undetected variants (pseudo-elements) will be missed; human-built sites use the same techniques.

**Open questions:** Whether the detectable variants cover enough of what people mean.
