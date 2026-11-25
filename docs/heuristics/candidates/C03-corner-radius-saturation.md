---
id: C03
name: Corner-radius saturation
status: probe-implemented
evidence_tier: T0
sources: S1a, S2
---

# C03 — Corner-radius saturation

**Reported tell:** "Overly rounded corners everywhere" (S1a); "oversized rounded corners" (S2).

**Proposed mechanism (hypothesis):** Generators default to large radii (for example Tailwind `rounded-2xl`) on every container.

**Measurement:** Among boxed elements (visible background, border or shadow; at least 40x40px), the share with a border radius of 16px or more. The shipping `radiusShadow` signal only fires when rounding and shadow co-occur.

**Known failure modes:** Modern human-designed brands also use large radii. Pill-shaped buttons are common everywhere.

**Open questions:** Is the share, or the uniformity of radius (see C24), the better discriminator?
