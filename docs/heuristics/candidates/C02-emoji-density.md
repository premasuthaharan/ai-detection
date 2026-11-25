---
id: C02
name: Emoji density
status: probe-implemented
evidence_tier: T0
sources: S1a, S1b
---

# C02 — Emoji density

**Reported tell:** "Overuse of ... emojis" (S1a); emojis mentioned alongside icons (S1b).

**Proposed mechanism (hypothesis):** LLM text habit of emoji bullets, headings and button labels.

**Measurement:** Emoji (emoji-presentation or variation-selector sequences) per 1,000 visible words, anywhere in body text, plus how many headings, buttons and list items start with an emoji. The shipping `emojiHeadings` signal only looks at h1-h3.

**Known failure modes:** Consumer, kids, food, social and community sites use emoji legitimately. User-generated content.

**Open questions:** Whether this should replace `emojiHeadings` or sit beside it.
