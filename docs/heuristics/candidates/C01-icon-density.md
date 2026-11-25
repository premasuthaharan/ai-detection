---
id: C01
name: Icon density
status: probe-implemented
evidence_tier: T0
sources: S1a, S1b
---

# C01 — Icon density

**Reported tell:** "Overuse of icons" (S1a); "lots of icons in general" (S1b).

**Proposed mechanism (hypothesis):** Generators decorate every heading, card and list item with an icon as a default polish move.

**Measurement:** Count of small icons (SVGs and icon-font nodes rendered at 64px or less) per 1,000 visible words. Differs from the shipping `icons` signal, which looks for a specific icon-library signature regardless of how many there are.

**Known failure modes:** Icon-heavy human UIs (dashboards, docs, app-like sites, nav-heavy sites). Text-light pages inflate the ratio.

**Open questions:** Does page-level or per-section density separate the classes better?
