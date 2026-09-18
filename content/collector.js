/**
 * Injected into the inspected page (isolated world) via chrome.scripting.executeScript.
 * Scans the live DOM/CSSOM for design signals correlated with AI-coding-tool output
 * (v0, Lovable, Bolt, Claude/ChatGPT-generated React+Tailwind+shadcn apps, etc).
 *
 * Each detector returns { confidence: 0..1, reason: string | null }.
 * The final object is stashed on window so a follow-up executeScript call
 * (with a plain function) can read it back into the extension context.
 */
(function () {
  // Sample a bounded number of elements for perf on huge pages.
  const ALL_ELEMENTS = Array.from(document.querySelectorAll("*"));
  const SAMPLE = ALL_ELEMENTS.length > 800
    ? ALL_ELEMENTS.filter((_, i) => i % Math.ceil(ALL_ELEMENTS.length / 800) === 0)
    : ALL_ELEMENTS;

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  // ---- 1. shadcn/ui + Radix CSS custom property fingerprint ----
  function detectShadcnCssVars() {
    const root = getComputedStyle(document.documentElement);
    const knownVars = [
      "--radius", "--background", "--foreground", "--primary",
      "--primary-foreground", "--secondary", "--muted", "--muted-foreground",
      "--accent", "--card", "--popover", "--border", "--input", "--ring",
    ];
    const found = knownVars.filter((v) => root.getPropertyValue(v).trim() !== "");
    const confidence = clamp01(found.length / 8);
    return {
      confidence,
      reason: found.length >= 1
        ? `Found ${found.length} CSS variable${found.length > 1 ? "s" : ""} matching shadcn/ui naming on :root (${found.slice(0, 4).join(", ")})${found.length < 3 ? " — weak signal alone" : ""}`
        : null,
    };
  }

  // ---- 2. Indigo/violet/purple gradient clustering ----
  function rgbToHue(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h;
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    return h < 0 ? h + 360 : h;
  }

  function detectGradientHues() {
    // AI-generated sites overwhelmingly favor gradients somewhere in the
    // cyan/blue -> indigo -> violet -> purple -> magenta band (Tailwind's
    // indigo-500/purple-500/blue-500 defaults). Widened from purple-only
    // after finding real sites use blue-to-cyan hero/section washes just
    // as often as the stereotypical purple hero.
    let bandGradients = 0;
    for (const el of SAMPLE) {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === "none" || !bg.includes("gradient")) continue;
      const rgbMatches = [...bg.matchAll(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/g)];
      const inBand = rgbMatches.some(([, r, g, b]) => {
        const hue = rgbToHue(+r, +g, +b);
        return hue >= 185 && hue <= 305;
      });
      if (inBand) bandGradients++;
    }
    const confidence = clamp01(bandGradients / 3);
    return {
      confidence,
      reason: bandGradients > 0
        ? `Found ${bandGradients} blue/indigo/violet/purple gradient${bandGradients > 1 ? "s" : ""} (the classic AI-hero color band)`
        : null,
    };
  }

  // ---- 3. Font fingerprint ----
  function detectFontFingerprint() {
    const AI_FONTS = ["inter", "geist", "poppins", "dm sans", "manrope", "space grotesk", "plus jakarta sans", "sora"];
    let matches = 0;
    let total = 0;
    let matchedName = null;
    for (const el of SAMPLE) {
      const family = getComputedStyle(el).fontFamily;
      if (!family) continue;
      total++;
      const first = family.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
      if (AI_FONTS.includes(first)) {
        matches++;
        matchedName = matchedName || first;
      }
    }
    const confidence = total ? clamp01((matches / total) * 2) : 0;
    return {
      confidence,
      reason: matches > 0
        ? `Primary font is "${matchedName}", one of the handful of fonts AI tools default to`
        : null,
    };
  }

  // ---- 4. Rounded-corner + soft-shadow saturation ----
  function detectRadiusShadowSaturation() {
    let both = 0;
    for (const el of SAMPLE) {
      const cs = getComputedStyle(el);
      const radius = parseFloat(cs.borderRadius) || 0;
      const hasShadow = cs.boxShadow && cs.boxShadow !== "none";
      if (radius >= 12 && hasShadow) both++;
    }
    const confidence = clamp01(both / 15);
    return {
      confidence,
      reason: both >= 4
        ? `${both} elements combine large rounded corners with soft shadows ("everything is a rounded card")`
        : null,
    };
  }

  // ---- 5. Glassmorphism ----
  function detectGlassmorphism() {
    let count = 0;
    for (const el of SAMPLE) {
      const cs = getComputedStyle(el);
      const blur = (cs.backdropFilter || cs.webkitBackdropFilter || "");
      if (!blur.includes("blur")) continue;
      const bg = cs.backgroundColor;
      const alphaMatch = bg.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
      const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
      if (alpha < 1) count++;
    }
    const confidence = clamp01(count / 3);
    return {
      confidence,
      reason: count > 0
        ? `${count} glassmorphism element${count > 1 ? "s" : ""} (backdrop-blur + translucent background)`
        : null,
    };
  }

  // ---- 6. Generic icon library fingerprint (Lucide/Feather/Heroicons outline + solid) ----
  function parseViewBoxDims(viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
    return { w: parts[2], h: parts[3] };
  }

  function detectIconLibraries() {
    const allSvgs = Array.from(document.querySelectorAll("svg"));
    // Exclude large decorative/illustration SVGs (hero waves, blobs, etc.) —
    // they aren't icons and would dilute the ratio.
    const svgs = allSvgs.filter((svg) => {
      const dims = parseViewBoxDims(svg.getAttribute("viewBox") || "");
      return !dims || (dims.w <= 60 && dims.h <= 60);
    });
    if (svgs.length === 0) return { confidence: 0, reason: null };

    let matches = 0;
    for (const svg of svgs) {
      const viewBox = svg.getAttribute("viewBox") || "";
      const strokeAttr = svg.getAttribute("stroke-width");
      const strokeNum = parseFloat(strokeAttr ?? getComputedStyle(svg).strokeWidth);
      const fillAttr = svg.getAttribute("fill");
      const computedFill = getComputedStyle(svg).fill;
      const cls = svg.getAttribute("class") || "";

      const looksLikeLucideClass = /lucide/i.test(cls);
      // Outline family (Lucide/Feather/Heroicons Outline): 24x24, fill=none,
      // stroke width commonly customized between 1.5 and 2.5.
      const looksLikeOutline = viewBox === "0 0 24 24" && fillAttr === "none" && strokeNum >= 1 && strokeNum <= 3;
      // Heroicons Solid family: 20x20, filled (not "none"), no explicit stroke.
      const looksLikeHeroSolid = viewBox === "0 0 20 20" && fillAttr !== "none" && computedFill !== "none" && !strokeAttr;

      if (looksLikeLucideClass || looksLikeOutline || looksLikeHeroSolid) matches++;
    }
    const ratio = matches / svgs.length;
    const confidence = clamp01(ratio * (matches >= 3 ? 1 : 0.5));
    return {
      confidence,
      reason: matches >= 3
        ? `${matches}/${svgs.length} icons match a generic icon library signature (Lucide/Feather/Heroicons)`
        : null,
    };
  }

  // ---- 7. Repeating icon+title+description feature-grid skeleton ----
  function detectLayoutSkeleton() {
    const containers = Array.from(document.querySelectorAll("div, section, ul"));
    let bestMatch = 0;
    for (const container of containers) {
      const children = Array.from(container.children);
      if (children.length < 3) continue;
      let matchingChildren = 0;
      for (const child of children) {
        const hasIcon = !!child.querySelector("svg, img");
        const hasHeading = !!child.querySelector("h1, h2, h3, h4, h5, h6");
        const hasText = !!child.querySelector("p, span");
        if (hasIcon && hasHeading && hasText) matchingChildren++;
      }
      if (matchingChildren >= 3) bestMatch = Math.max(bestMatch, matchingChildren);
    }
    const confidence = clamp01(bestMatch / 4);
    return {
      confidence,
      reason: bestMatch >= 3
        ? `Detected a repeating icon+title+description grid (${bestMatch} columns), the canonical AI "feature section"`
        : null,
    };
  }

  // ---- 8. Framework/build fingerprint (low weight, correlational) ----
  function detectFrameworkFingerprint() {
    const hasNext = !!document.getElementById("__next") || !!document.querySelector('script[src*="_next/static"]');
    const hasVite = !!document.querySelector('script[type="module"][src*="/src/main"]');
    const generatorMeta = document.querySelector('meta[name="generator"]');
    const generatorHints = generatorMeta && /v0|lovable|bolt|next\.js/i.test(generatorMeta.content || "");
    const hits = [hasNext, hasVite, !!generatorHints].filter(Boolean).length;
    const confidence = clamp01(hits / 2);
    return {
      confidence,
      reason: hits > 0 ? "Framework fingerprint suggests a Next.js/Vite AI-scaffolded build" : null,
    };
  }

  // ---- 9. Marketing buzzword density ----
  function detectBuzzwords() {
    const BUZZWORDS = [
      "supercharge", "elevate", "seamless", "unlock", "effortless", "revolutionize",
      "empower", "unleash", "cutting-edge", "game-changing", "next-level", "streamline",
    ];
    const text = (document.body.innerText || "").slice(0, 20000).toLowerCase();
    const found = BUZZWORDS.filter((w) => text.includes(w));
    const confidence = clamp01(found.length / 5);
    return {
      confidence,
      reason: found.length > 0
        ? `Marketing copy contains AI-favorite buzzwords: ${found.slice(0, 4).join(", ")}`
        : null,
    };
  }

  // ---- 10. Gradient hero text (background-clip: text) ----
  function detectGradientText() {
    let count = 0;
    for (const el of SAMPLE) {
      const cs = getComputedStyle(el);
      const clip = cs.backgroundClip || cs.webkitBackgroundClip;
      if (clip === "text" && cs.backgroundImage && cs.backgroundImage.includes("gradient")) {
        count++;
      }
    }
    const confidence = clamp01(count / 2);
    return {
      confidence,
      reason: count > 0 ? `${count} gradient-filled heading${count > 1 ? "s" : ""} (background-clip: text)` : null,
    };
  }

  // ---- 11. Emoji-decorated headings ----
  function detectEmojiHeadings() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    if (headings.length === 0) return { confidence: 0, reason: null };
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    const withEmoji = headings.filter((h) => emojiRegex.test(h.textContent || "")).length;
    const confidence = clamp01(withEmoji / 2);
    return {
      confidence,
      reason: withEmoji > 0 ? `${withEmoji} heading${withEmoji > 1 ? "s" : ""} decorated with emoji (🚀✨ style)` : null,
    };
  }

  // ---- 12. Scroll-reveal fade-in animation setup ----
  function detectScrollReveal() {
    // AOS (Animate On Scroll) library leaves an explicit, unambiguous marker.
    const aosCount = document.querySelectorAll("[data-aos]").length;

    // Generic reveal-on-scroll class-naming conventions.
    const classPattern = /(^|[\s"'])(fade-in-up|fade-up|fade-in|slide-up|reveal-on-scroll|animate-in|aos-init)([\s"']|$)/i;
    let classMatches = 0;
    for (const el of SAMPLE) {
      if (classPattern.test(el.getAttribute("class") || "")) classMatches++;
    }

    // Tailwind-utility-driven reveal: an element sitting in its "pre-reveal"
    // state (opacity-0 + translate-y, waiting for an IntersectionObserver to
    // flip the classes) is one of the most common React+Tailwind AI patterns.
    let tailwindReveal = 0;
    for (const el of SAMPLE) {
      const cls = el.getAttribute("class") || "";
      if (/\bopacity-0\b/.test(cls) && /\btranslate-y-/.test(cls) && /\btransition\b/.test(cls)) {
        tailwindReveal++;
      }
    }

    // Framer Motion-style inline pre-reveal state (opacity:0 + transform: translateY(...)).
    let inlineReveal = 0;
    for (const el of SAMPLE) {
      const style = el.getAttribute("style") || "";
      if (/opacity:\s*0/.test(style) && /translateY?\(/i.test(style)) {
        inlineReveal++;
      }
    }

    const total = (aosCount > 0 ? 2 : 0) + Math.min(classMatches, 3) + Math.min(tailwindReveal, 3) + Math.min(inlineReveal, 3);
    const confidence = clamp01(total / 6);

    const parts = [];
    if (aosCount > 0) parts.push(`${aosCount} AOS data-aos element${aosCount > 1 ? "s" : ""}`);
    if (classMatches > 0) parts.push(`${classMatches} fade/reveal class name${classMatches > 1 ? "s" : ""}`);
    if (tailwindReveal > 0) parts.push(`${tailwindReveal} Tailwind opacity-0+translate-y reveal utilit${tailwindReveal > 1 ? "ies" : "y"}`);
    if (inlineReveal > 0) parts.push(`${inlineReveal} inline pre-reveal style${inlineReveal > 1 ? "s" : ""}`);

    return {
      confidence,
      reason: parts.length > 0 ? `Scroll-reveal animation setup detected (${parts.join(", ")})` : null,
    };
  }

  // ---- 13. "Trusted by" testimonial avatar-stack pattern ----
  function detectTestimonialAvatars() {
    const candidates = Array.from(
      document.querySelectorAll('img, [class*="avatar" i], [class*="rounded-full"]')
    );
    const circularSmall = candidates.filter((el) => {
      const w = el.offsetWidth, h = el.offsetHeight;
      if (w < 20 || w > 90 || h < 20 || h > 90 || Math.abs(w - h) > 8) return false;
      const cs = getComputedStyle(el);
      const radius = parseFloat(cs.borderRadius) || 0;
      return cs.borderRadius.includes("%") || radius >= Math.min(w, h) / 2 - 2;
    });

    // Group by parent to find a contiguous "row" of avatars, not scattered ones.
    const byParent = new Map();
    for (const el of circularSmall) {
      const parent = el.parentElement;
      if (!parent) continue;
      byParent.set(parent, (byParent.get(parent) || 0) + 1);
    }
    const bestGroupSize = byParent.size ? Math.max(...byParent.values()) : 0;
    const confidence = clamp01((bestGroupSize - 2) / 3);

    return {
      confidence,
      reason: bestGroupSize >= 3
        ? `Found a row of ${bestGroupSize} circular avatar-style elements (the "trusted by" avatar-stack pattern)`
        : null,
    };
  }

  window.__AI_SLOP_RAW__ = {
    shadcnVars: detectShadcnCssVars(),
    gradients: detectGradientHues(),
    fonts: detectFontFingerprint(),
    radiusShadow: detectRadiusShadowSaturation(),
    glass: detectGlassmorphism(),
    icons: detectIconLibraries(),
    layout: detectLayoutSkeleton(),
    framework: detectFrameworkFingerprint(),
    buzzwords: detectBuzzwords(),
    gradientText: detectGradientText(),
    emojiHeadings: detectEmojiHeadings(),
    scrollReveal: detectScrollReveal(),
    testimonialAvatars: detectTestimonialAvatars(),
  };
})();
