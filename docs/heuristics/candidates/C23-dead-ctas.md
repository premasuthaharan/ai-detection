---
id: C23
name: Dead calls to action
status: probe-implemented
evidence_tier: T0
sources: S1b, S2
---

# C23 — Dead calls to action

**Reported tell:** "Dead ctas and similar" (S1b); "missing edge states ... some buttons might not have any logical next steps" (S2).

**Proposed mechanism (hypothesis):** Generators emit buttons with placeholder links because nothing exists behind them.

**Measurement:** Among button-like links, the share with an empty, `#`, or `javascript:` href. Buttons with JS handlers cannot be inspected from the DOM.

**Known failure modes:** Single-page apps using `#` with real handlers; anchors used as buttons by human developers.

**Open questions:** Only a partial proxy. A true check would need clicking, which is out of scope.
