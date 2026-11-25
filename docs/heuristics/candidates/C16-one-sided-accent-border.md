---
id: C16
name: One-sided colored border (left accent)
status: probe-implemented
evidence_tier: T0
sources: S1b, S1c
---

# C16 — One-sided colored border (left accent)

**Reported tell:** "Text boxes with a colored border on the left" (S1b); "vertical colored borders on 1 side of boxes" (S1c).

**Proposed mechanism (hypothesis):** Generators use a colored left border to turn a box into a callout.

**Measurement:** Count of elements with exactly one border side of 2px or more in a non-gray color, reported separately for left borders and for blockquotes.

**Known failure modes:** Blockquotes and callouts in documentation; active-tab and sidebar indicators.

**Open questions:** Excluding navigation indicators. Mentioned by two sources.
