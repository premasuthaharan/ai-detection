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
    shadcnVars: 20,
    icons: 12,
    gradients: 12,
    fonts: 10,
    layout: 10,
    gradientText: 8,
    radiusShadow: 8,
    glass: 6,
    framework: 6,
    buzzwords: 5,
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

    reasons.sort((a, b) => b.contribution - a.contribution);
    const score = Math.round(Math.max(0, Math.min(100, total)));
    const tier = tierFor(score);

    return { score, tier, reasons };
  }

  window.AISlopScoring = { computeScore, WEIGHTS, TIERS };
})();
