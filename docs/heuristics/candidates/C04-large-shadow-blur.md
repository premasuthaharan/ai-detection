---
id: C04
name: Large shadow blur radius
status: probe-implemented
evidence_tier: T0
sources: S1a, S2
---

# C04 — Large shadow blur radius

**Reported tell:** "Huge drop shadow radii" (S1a); "soft shadows and glow effects" (S2).

**Proposed mechanism (hypothesis):** Generators reach for large soft shadows (for example Tailwind `shadow-xl`/`shadow-2xl`) to suggest depth.

**Measurement:** Count of elements (at least 40x40px) with an outer box-shadow blur of 30px or more, and the maximum blur seen.

**Known failure modes:** Material-style human designs, modals and popovers legitimately use large blurs.

**Open questions:** Count versus share of boxed elements.
