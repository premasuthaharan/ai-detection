/**
 * Pure scoring logic — no DOM access. Runs in the popup context and
 * combines the raw per-signal confidences from content/collector.js
 * into a single weighted 0-100 score plus a ranked "why" list.
 *
 * Loaded as a classic script in popup.html, exposes window.AISlopScoring.
 */
(function () {
  // Weights sum to 100. Higher-precision signals (near-unique to AI
  // scaffolds) are weighted heavier than correlational/stylistic ones.
  const WEIGHTS = {
    shadcnVars: 18,
    icons: 11,
    gradients: 11,
    fonts: 9,
    layout: 9,
    scrollReveal: 6,
    gradientText: 7,
    radiusShadow: 7,
    testimonialAvatars: 5,
    glass: 5,
    framework: 5,
    buzzwords: 4,
    emojiHeadings: 3,
  };

  const TIERS = [
    { max: 30, id: "human", label: "Looks hand-crafted", color: "#22c55e" },
    { max: 60, id: "mixed", label: "Mixed signals", color: "#eab308" },
    { max: 101, id: "ai", label: "AI slop detected", color: "#ef4444" },
  ];

  function tierFor(score) {
    return TIERS.find((t) => score <= t.max) || TIERS[TIERS.length - 1];
  }

  function computeScore(raw) {
    let total = 0;
    const reasons = [];

    for (const key of Object.keys(WEIGHTS)) {
      const signal = raw && raw[key];
      if (!signal) continue;
      const weight = WEIGHTS[key];
      const confidence = Math.max(0, Math.min(1, signal.confidence || 0));
      const contribution = confidence * weight;
      total += contribution;
      if (confidence > 0 && signal.reason) {
        reasons.push({ text: signal.reason, contribution: Math.round(contribution * 10) / 10 });
      }
    }

    let score = Math.round(Math.max(0, Math.min(100, total)));

    // shadcn/ui's CSS-variable naming convention (14 specific names) is a
    // near-unique fingerprint -- vanishingly unlikely to appear by
    // coincidence on a hand-built site. A near-complete match is strong
    // enough evidence on its own that a sparse/minimal page shouldn't be
    // able to dilute it away into a "human" verdict just because it lacks
    // the usual marketing-page trimmings (gradients, buzzwords, etc).
    const FLOOR_SCORE = 35;
    if (raw && raw.shadcnVars && raw.shadcnVars.confidence >= 0.9 && score < FLOOR_SCORE) {
      reasons.push({
        text: 'Near-complete shadcn/ui CSS variable set is a strong enough fingerprint on its own to guarantee at least a "mixed" rating',
        contribution: Math.round((FLOOR_SCORE - score) * 10) / 10,
      });
      score = FLOOR_SCORE;
    }

    reasons.sort((a, b) => b.contribution - a.contribution);
    const tier = tierFor(score);

    return { score, tier, reasons };
  }

  window.AISlopScoring = { computeScore, WEIGHTS, TIERS };
})();
