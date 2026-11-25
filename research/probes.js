/**
 * Research probes: one measurement per registry entry (docs/heuristics/candidates).
 *
 * These are NOT shipping detectors. Each probe returns { value, detail }
 * where value is a number (or null when the page has too little to
 * measure) so we can look at distributions before choosing any threshold.
 *
 * PROBE_THRESHOLDS are provisional initial guesses, used only to compute a
 * "fire rate" in reports. They are replaced by values chosen from the dev
 * split. They are the single source of truth: registry entries do not
 * repeat them.
 *
 * Evaluated inside the page by research/prevalence.js (runProbes()), and
 * required from Node for the thresholds.
 */
const PROBE_THRESHOLDS = {
  C01: { fireAt: 25, unit: "small icons per 1,000 words" },
  C02: { fireAt: 3, unit: "emoji per 1,000 words" },
  C03: { fireAt: 0.4, unit: "share of boxed elements with radius >= 16px" },
  C04: { fireAt: 3, unit: "elements with shadow blur >= 30px" },
  C05: { fireAt: 1, unit: "elements with a neon gradient" },
  C06: { fireAt: 1, unit: "elements with a pastel gradient" },
  C07: { fireAt: 1, unit: "elements with a gradient border" },
  C08: { fireAt: 1, unit: "elements with a colored glow shadow" },
  C09: { fireAt: 3, unit: "rounded icon boxes" },
  C10: { fireAt: 3, unit: "cards in the largest icon-top-left group" },
  C11: { fireAt: 1, unit: "headings with an eyebrow label" },
  C12: { fireAt: 1, unit: "headings with a pill eyebrow" },
  C13: { fireAt: 3, unit: "of 3 hero-h1 conditions met" },
  C14: { fireAt: 1, unit: "serif h1 with sans body (0/1)" },
  C15: { fireAt: 3, unit: "max nesting depth of boxed elements" },
  C16: { fireAt: 1, unit: "left-accent bordered boxes (excl. blockquote)" },
  C17: { fireAt: 3, unit: "siblings in the largest metrics row" },
  C18: { fireAt: 3, unit: "siblings in the largest pricing group" },
  C19: { fireAt: 3, unit: "siblings in the largest testimonial group" },
  C20: { fireAt: 3, unit: "of 5 section archetypes present" },
  C21: { fireAt: 2, unit: "faint monospace descriptors" },
  C22: { fireAt: 1, unit: "elements with oldstyle numerals" },
  C23: { fireAt: 0.3, unit: "share of button-like links that are dead" },
  C24: { fireAt: 3, direction: "low", unit: "distinct corner radii (fires when this few)" },
  C25: { fireAt: 1, unit: "generic imperative headings/CTAs" },
};

function runProbes() {
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "TEMPLATE", "HEAD", "TITLE"]);
  const all = Array.from(document.body.querySelectorAll("*")).filter((el) => !SKIP.has(el.tagName));

  const styleCache = new Map();
  const style = (el) => {
    let s = styleCache.get(el);
    if (!s) { s = getComputedStyle(el); styleCache.set(el, s); }
    return s;
  };
  const rectCache = new Map();
  const rect = (el) => {
    let r = rectCache.get(el);
    if (!r) { r = el.getBoundingClientRect(); rectCache.set(el, r); }
    return r;
  };
  // Layout-based: opacity-0 "scroll reveal" pre-states still occupy space and
  // are real design, so only display:none / visibility:hidden / zero-size are skipped.
  const visible = (el) => {
    const s = style(el);
    const r = rect(el);
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
  };

  // ---- color helpers (computed colors can be rgb() or oklch()/lab()/color()) ----
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const colorCache = new Map();
  function toRGBA(str) {
    if (!str) return null;
    if (colorCache.has(str)) return colorCache.get(str);
    let out = null;
    const m = str.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?\s*\)$/);
    if (m) {
      let a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      out = { r: +m[1], g: +m[2], b: +m[3], a };
    } else if (str === "transparent") {
      out = { r: 0, g: 0, b: 0, a: 0 };
    } else {
      ctx.canvas.width = 1; ctx.canvas.height = 1;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "rgb(1,2,3)";
      const before = ctx.fillStyle;
      ctx.fillStyle = str;
      if (ctx.fillStyle !== before) {
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
      }
    }
    colorCache.set(str, out);
    return out;
  }
  function hsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
    return { h, s, l };
  }
  const COLOR_RE = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\((?:[^()]|\([^()]*\))*\)/g;
  const colorsIn = (str) => (str.match(COLOR_RE) || []).map(toRGBA).filter(Boolean);
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  // ---- shadow parsing ----
  function splitTopLevel(str) {
    const parts = []; let depth = 0, cur = "";
    for (const ch of str) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    return parts;
  }
  function parseShadows(str) {
    if (!str || str === "none") return [];
    return splitTopLevel(str).map((part) => {
      const color = (part.match(COLOR_RE) || [])[0];
      const rest = part.replace(COLOR_RE, " ");
      const inset = /\binset\b/.test(rest);
      const nums = (rest.match(/-?[\d.]+px/g) || []).map(parseFloat);
      return { color: color ? toRGBA(color) : null, inset, blur: nums[2] || 0 };
    });
  }

  // ---- geometry / box helpers ----
  const radiusPx = (el) => {
    const v = style(el).borderTopLeftRadius || "0px";
    const r = rect(el);
    if (v.endsWith("%")) return (parseFloat(v) / 100) * Math.min(r.width, r.height);
    return parseFloat(v) || 0;
  };
  const bgAlpha = (el) => { const c = toRGBA(style(el).backgroundColor); return c ? c.a : 0; };
  const hasBgImage = (el) => style(el).backgroundImage !== "none";
  const borderVisible = (el) => {
    const s = style(el);
    return ["Top", "Right", "Bottom", "Left"].some((side) => {
      const w = parseFloat(s["border" + side + "Width"]) || 0;
      const st = s["border" + side + "Style"];
      const c = toRGBA(s["border" + side + "Color"]);
      return w > 0 && st !== "none" && st !== "hidden" && c && c.a > 0.05;
    });
  };
  const hasOuterShadow = (el) => parseShadows(style(el).boxShadow).some((s) => !s.inset);
  const bigEnough = (el, w, h) => { const r = rect(el); return r.width >= w && r.height >= h; };

  const isBoxed = (el) =>
    el !== document.body && visible(el) && bigEnough(el, 40, 40) &&
    (bgAlpha(el) > 0.02 || hasBgImage(el) || borderVisible(el) || hasOuterShadow(el));

  const boxed = all.filter(isBoxed);
  const bodyText = document.body.innerText || "";
  const words = (bodyText.match(/\S+/g) || []).length;

  const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu;
  const EMOJI_LEAD_RE = /^\s*(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️)/u;
  const ICON_FONT_RE = /(^|\s)(fa|fas|far|fab|fal|bi|ti|mdi|lucide|material-icons|icon)([\s-]|$)/i;

  const isIconEl = (el) => {
    const tag = el.tagName.toLowerCase();
    const r = rect(el);
    if (r.width <= 0 || r.height <= 0) return false;
    if (tag === "svg") return r.width <= 64 && r.height <= 64 && r.width >= 8 && !el.parentElement.closest("svg");
    if (tag === "i") return ICON_FONT_RE.test(el.getAttribute("class") || "") && r.width <= 64;
    if (tag === "img") return r.width <= 48 && r.height <= 48 && /\.svg(\?|$)/i.test(el.getAttribute("src") || "");
    return false;
  };

  const containers = all.filter((el) => ["DIV", "SECTION", "UL", "OL", "ARTICLE"].includes(el.tagName) && el.children.length >= 3 && visible(el));
  const maxGroup = (pred) => {
    let best = 0;
    for (const c of containers) {
      let n = 0;
      for (const ch of c.children) if (pred(ch)) n++;
      if (n >= 3) best = Math.max(best, n);
    }
    return best;
  };
  const shortText = (el) => (el.innerText || "").trim();

  const probes = {};
  const run = (id, fn) => { try { probes[id] = fn(); } catch (e) { probes[id] = { value: null, detail: { error: String(e.message || e) } }; } };

  // C01 icon density
  run("C01", () => {
    const icons = all.filter(isIconEl).length;
    return { value: words >= 50 ? (icons / words) * 1000 : null, detail: { icons, words } };
  });

  // C02 emoji density
  run("C02", () => {
    const emoji = (bodyText.match(EMOJI_RE) || []).length;
    const leading = all.filter((el) => /^(H[1-6]|BUTTON|LI|A)$/.test(el.tagName) && visible(el) && EMOJI_LEAD_RE.test(el.innerText || "")).length;
    return { value: words >= 50 ? (emoji / words) * 1000 : null, detail: { emoji, leadingEmojiElements: leading, words } };
  });

  // C03 corner-radius saturation
  run("C03", () => {
    const big = boxed.filter((el) => radiusPx(el) >= 16).length;
    return { value: boxed.length >= 5 ? big / boxed.length : 0, detail: { boxed: boxed.length, radius16plus: big } };
  });

  // C04 large shadow blur
  run("C04", () => {
    let count = 0, max = 0;
    for (const el of all) {
      if (!visible(el) || !bigEnough(el, 40, 40)) continue;
      const blurs = parseShadows(style(el).boxShadow).filter((s) => !s.inset).map((s) => s.blur);
      const m = Math.max(0, ...blurs);
      if (m >= 30) count++;
      max = Math.max(max, m);
    }
    return { value: count, detail: { maxBlur: max } };
  });

  // C05 / C06 gradients
  const gradientEls = all.filter((el) => visible(el) && bigEnough(el, 40, 40) && style(el).backgroundImage.includes("gradient"));
  run("C05", () => {
    let n = 0;
    for (const el of gradientEls) {
      const stops = colorsIn(style(el).backgroundImage).filter((c) => c.a >= 0.3);
      if (stops.length >= 2 && stops.some((c) => { const h = hsl(c); return h.s >= 0.85 && h.l >= 0.4 && h.l <= 0.65; })) n++;
    }
    return { value: n, detail: { gradientElements: gradientEls.length } };
  });
  run("C06", () => {
    let n = 0;
    for (const el of gradientEls) {
      const stops = colorsIn(style(el).backgroundImage).filter((c) => c.a >= 0.3);
      const light = stops.filter((c) => { const h = hsl(c); return h.l >= 0.82 && h.s >= 0.25; });
      if (stops.length >= 2 && light.length >= 2) n++;
    }
    return { value: n, detail: { gradientElements: gradientEls.length } };
  });

  // C07 gradient borders
  run("C07", () => {
    let n = 0;
    for (const el of all) {
      if (!visible(el) || !bigEnough(el, 40, 40)) continue;
      const s = style(el);
      const bi = s.borderImageSource || "";
      const clipTrick = (s.backgroundImage.match(/gradient\(/g) || []).length >= 2 &&
        (parseFloat(s.borderTopWidth) || 0) >= 1 && (toRGBA(s.borderTopColor) || { a: 1 }).a === 0;
      if (bi.includes("gradient") || clipTrick) n++;
    }
    return { value: n, detail: {} };
  });

  // C08 glow
  run("C08", () => {
    let n = 0;
    for (const el of all) {
      if (!visible(el)) continue;
      const s = style(el);
      const shadows = [...parseShadows(s.boxShadow).filter((x) => !x.inset), ...parseShadows(s.textShadow)];
      if (shadows.some((x) => x.blur >= 12 && x.color && x.color.a >= 0.1 && hsl(x.color).s >= 0.4 && hsl(x.color).l > 0.15 && hsl(x.color).l < 0.9)) n++;
    }
    return { value: n, detail: {} };
  });

  // C09 rounded icon boxes
  const isEmojiOnly = (t) => { const s = t.trim(); return s.length > 0 && s.replace(EMOJI_RE, "").trim() === ""; };
  run("C09", () => {
    let n = 0;
    for (const el of all) {
      if (!visible(el)) continue;
      const r = rect(el);
      if (r.width < 28 || r.width > 72 || r.height < 28 || r.height > 72 || Math.abs(r.width - r.height) > 4) continue;
      if (radiusPx(el) < 6 || !(bgAlpha(el) >= 0.02 || hasBgImage(el))) continue;
      const iconKids = el.querySelectorAll("svg, img, i").length;
      const text = (el.textContent || "").trim();
      if ((iconKids === 1 && text === "") || (iconKids === 0 && isEmojiOnly(text))) n++;
    }
    return { value: n, detail: {} };
  });

  // C10 icon top-left cards; shared feature-grid predicate for C20
  const hasIconText = (ch) => !!ch.querySelector("svg, img, i") && !!ch.querySelector("h1,h2,h3,h4,h5,h6") && !!ch.querySelector("p, span");
  run("C10", () => {
    const pred = (ch) => {
      if (!hasIconText(ch)) return false;
      const icon = ch.querySelector("svg, img, i");
      const head = ch.querySelector("h1,h2,h3,h4,h5,h6");
      // Use the icon's wrapper (e.g. a rounded square) when it is small, else the icon itself.
      const wrap = icon.parentElement;
      const box = wrap && wrap !== ch && rect(wrap).width <= 80 && rect(wrap).height <= 80 ? wrap : icon;
      const cr = rect(ch), ir = rect(box), hr = rect(head);
      return ir.top - cr.top <= 40 && ir.left - cr.left <= 40 && hr.top >= ir.bottom - 4;
    };
    return { value: maxGroup(pred), detail: {} };
  });

  // C11 / C12 eyebrow and pill badge
  const headings = all.filter((el) => /^H[12]$/.test(el.tagName) && visible(el));
  const eyebrowFor = (h) => {
    let c = h.previousElementSibling;
    if (!c && h.parentElement && h.parentElement.firstElementChild === h) c = h.parentElement.previousElementSibling;
    if (!c || !visible(c)) return null;
    const t = shortText(c);
    if (!t || t.length > 40 || t.split(/\s+/).length > 5) return null;
    const hf = parseFloat(style(h).fontSize), cf = parseFloat(style(c).fontSize);
    if (!(cf <= hf * 0.6)) return null;
    const ls = parseFloat(style(c).letterSpacing) || 0;
    const upper = style(c).textTransform === "uppercase" || (t === t.toUpperCase() && /[A-Z]/.test(t)) || ls >= cf * 0.05;
    return upper ? c : null;
  };
  const isPill = (el) => {
    const r = rect(el);
    return r.height > 0 && radiusPx(el) >= r.height / 2 - 1 && (bgAlpha(el) > 0.02 || borderVisible(el));
  };
  run("C11", () => ({ value: headings.filter((h) => eyebrowFor(h)).length, detail: { headings: headings.length } }));
  run("C12", () => {
    let n = 0;
    for (const h of headings) {
      const e = eyebrowFor(h);
      if (e && (isPill(e) || (e.firstElementChild && isPill(e.firstElementChild)))) n++;
    }
    return { value: n, detail: {} };
  });
  const firstH1 = all.find((el) => el.tagName === "H1" && visible(el));

  // C13 hero h1
  run("C13", () => {
    if (!firstH1 || rect(firstH1).top > window.innerHeight) return { value: 0, detail: { note: "no h1 in first viewport" } };
    const s = style(firstH1), r = rect(firstH1);
    const size = parseFloat(s.fontSize), weight = parseInt(s.fontWeight, 10) || 400;
    const centered = s.textAlign === "center" || (Math.abs(r.left + r.width / 2 - window.innerWidth / 2) <= window.innerWidth * 0.06 && r.width <= window.innerWidth * 0.9);
    const conds = [size >= 48, weight >= 700, centered];
    return { value: conds.filter(Boolean).length, detail: { size, weight, centered } };
  });

  // C14 serif heading + sans body
  const SERIF = ["georgia", "times new roman", "times", "playfair display", "merriweather", "lora", "fraunces", "instrument serif", "newsreader", "cormorant", "cormorant garamond", "dm serif display", "eb garamond", "libre baskerville", "source serif pro", "source serif 4", "crimson text", "crimson pro", "spectral", "bodoni moda", "noto serif"];
  const MONO = ["jetbrains mono", "fira code", "fira mono", "ibm plex mono", "space mono", "geist mono", "sf mono", "ui-monospace", "menlo", "monaco", "courier", "courier new", "consolas", "roboto mono", "dm mono", "source code pro", "inconsolata"];
  const fontKind = (family) => {
    const parts = (family || "").split(",").map((p) => p.replace(/["']/g, "").trim().toLowerCase());
    const first = parts[0];
    if (SERIF.includes(first)) return "serif";
    if (MONO.includes(first)) return "mono";
    const last = parts[parts.length - 1];
    if (last === "serif") return "serif";
    if (last === "monospace") return "mono";
    if (last === "sans-serif" || last === "system-ui" || last === "ui-sans-serif") return "sans";
    return "unknown";
  };
  run("C14", () => {
    const h = firstH1 || headings[0];
    const p = all.find((el) => el.tagName === "P" && visible(el) && shortText(el).length >= 40);
    if (!h || !p) return { value: 0, detail: { note: "no heading or paragraph" } };
    const hk = fontKind(style(h).fontFamily), pk = fontKind(style(p).fontFamily);
    return { value: hk === "serif" && pk === "sans" ? 1 : 0, detail: { heading: hk, body: pk } };
  });

  // C15 nested boxes
  run("C15", () => {
    const parentBg = (el) => (el.parentElement ? style(el.parentElement).backgroundColor : "");
    const boxed3 = all.filter((el) =>
      el !== document.body && visible(el) && bigEnough(el, 60, 40) && radiusPx(el) >= 8 &&
      (borderVisible(el) || hasOuterShadow(el) || (bgAlpha(el) >= 0.05 && style(el).backgroundColor !== parentBg(el))));
    const set = new Set(boxed3);
    const depth = new Map();
    let max = 0;
    for (const el of boxed3) {
      let p = el.parentElement, d = 1;
      while (p && p !== document.body) { if (set.has(p)) { d = depth.get(p) + 1; break; } p = p.parentElement; }
      depth.set(el, d);
      max = Math.max(max, d);
    }
    return { value: max, detail: { boxed: boxed3.length } };
  });

  // C16 one-sided accent border
  run("C16", () => {
    let left = 0, other = 0, quote = 0;
    for (const el of all) {
      if (!visible(el) || !bigEnough(el, 60, 24) || el.closest("nav")) continue;
      if (/^(LI|A|BUTTON)$/.test(el.tagName)) continue;
      const s = style(el);
      const w = { top: parseFloat(s.borderTopWidth) || 0, right: parseFloat(s.borderRightWidth) || 0, bottom: parseFloat(s.borderBottomWidth) || 0, left: parseFloat(s.borderLeftWidth) || 0 };
      const sides = Object.keys(w).filter((k) => w[k] >= 2);
      if (sides.length !== 1 || Object.values(w).filter((v) => v > 0).length !== 1) continue;
      const side = sides[0];
      const col = toRGBA(s["border" + side[0].toUpperCase() + side.slice(1) + "Color"]);
      if (!col || col.a < 0.3 || hsl(col).s < 0.25) continue;
      if (el.tagName === "BLOCKQUOTE") quote++;
      else if (side === "left") left++;
      else other++;
    }
    return { value: left, detail: { left, otherSide: other, blockquote: quote } };
  });

  // C17 metrics row
  const NUM_RE = /^[\s$€£]*\d[\d.,]*\s*(?:[kKmMbB]|\+|%|x|×|\/\d+)?\+?\s*$/;
  const metricChild = (ch) => {
    const els = [ch, ...ch.querySelectorAll("*")];
    const num = els.find((e) => visible(e) && e.children.length === 0 && NUM_RE.test(shortText(e)) && parseFloat(style(e).fontSize) >= 28);
    if (!num) return false;
    const nf = parseFloat(style(num).fontSize);
    return els.some((e) => e !== num && visible(e) && e.children.length === 0 && shortText(e).length > 0 && parseFloat(style(e).fontSize) < nf);
  };
  run("C17", () => ({ value: maxGroup(metricChild), detail: {} }));

  // C18 pricing
  run("C18", () => ({
    value: maxGroup((ch) => {
      const t = ch.innerText || "";
      return /[$€£]\s?\d/.test(t) && /\/\s?(mo|month|yr|year)|per\s+(month|year|user|seat)|monthly|annually/i.test(t) && !!ch.querySelector("a, button");
    }),
    detail: {},
  }));

  // C19 testimonial grid
  const isAvatar = (e) => {
    const r = rect(e);
    if (r.width < 24 || r.width > 72 || Math.abs(r.width - r.height) > 6) return false;
    const v = style(e).borderTopLeftRadius || "0px";
    return v.endsWith("%") ? parseFloat(v) >= 40 : (parseFloat(v) || 0) >= Math.min(r.width, r.height) / 2 - 2;
  };
  run("C19", () => ({
    value: maxGroup((ch) => {
      const quote = Array.from(ch.querySelectorAll("p, blockquote, div")).some((e) => e.children.length === 0 && shortText(e).length >= 50 && shortText(e).length <= 400);
      return quote && Array.from(ch.querySelectorAll("img, div, span")).some((e) => visible(e) && isAvatar(e));
    }),
    detail: {},
  }));

  // C20 composite skeleton
  run("C20", () => {
    const features = maxGroup(hasIconText) >= 3;
    const metrics = probes.C17 && probes.C17.value >= 3;
    const pricing = probes.C18 && probes.C18.value >= 3;
    const testimonials = probes.C19 && probes.C19.value >= 3;
    const faq = document.querySelectorAll("details").length >= 3 || headings.some((h) => /\b(faq|frequently asked)/i.test(h.innerText || ""));
    const present = { features, metrics, pricing, testimonials, faq };
    return { value: Object.values(present).filter(Boolean).length, detail: present };
  });

  // C21 faint monospace descriptors
  const effectiveBg = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const c = toRGBA(style(p).backgroundColor);
      if (c && c.a >= 0.95) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  run("C21", () => {
    let n = 0;
    for (const el of all) {
      if (!visible(el) || el.closest("pre, code, kbd, samp, textarea")) continue;
      const own = Array.from(el.childNodes).filter((x) => x.nodeType === 3).map((x) => x.textContent).join("").trim();
      if (own.length < 1 || own.length > 80) continue;
      const s = style(el);
      if (fontKind(s.fontFamily) !== "mono" || parseFloat(s.fontSize) > 14) continue;
      const fg = toRGBA(s.color);
      if (!fg) continue;
      if (fg.a < 0.75 || contrast(fg, effectiveBg(el)) < 4.5) n++;
    }
    return { value: n, detail: {} };
  });

  // C22 oldstyle numerals
  run("C22", () => {
    let n = 0;
    for (const el of all) {
      if (!visible(el)) continue;
      const s = style(el);
      if ((s.fontVariantNumeric || "").includes("oldstyle") || /["']onum["']/.test(s.fontFeatureSettings || "")) {
        const own = Array.from(el.childNodes).some((x) => x.nodeType === 3 && /\d/.test(x.textContent));
        if (own) n++;
      }
    }
    return { value: n, detail: {} };
  });

  // C23 dead CTAs
  run("C23", () => {
    const ctas = all.filter((el) => {
      if (el.tagName !== "A" || !visible(el)) return false;
      const t = shortText(el);
      if (t.length < 1 || t.length > 30) return false;
      const s = style(el);
      const looksBtn = bgAlpha(el) >= 0.05 || borderVisible(el);
      return looksBtn && (parseFloat(s.paddingLeft) || 0) >= 8 && (parseFloat(s.paddingTop) || 0) >= 4;
    });
    const dead = ctas.filter((a) => {
      const h = (a.getAttribute("href") || "").trim();
      return h === "" || h === "#" || h === "#!" || h.toLowerCase().startsWith("javascript:");
    });
    return { value: ctas.length >= 2 ? dead.length / ctas.length : null, detail: { ctas: ctas.length, dead: dead.length } };
  });

  // C24 radius distinctness
  run("C24", () => {
    const set = new Set(boxed.map((el) => { const r = radiusPx(el); return r >= 999 ? "pill" : Math.round(r / 2) * 2; }));
    return { value: boxed.length >= 5 ? set.size : null, detail: { boxed: boxed.length, radii: Array.from(set).slice(0, 12) } };
  });

  // C25 generic imperative microcopy
  run("C25", () => {
    const VERB = /^(boost|streamline|unlock|elevate|supercharge|transform|revolutionize|empower|unleash|accelerate|simplify|reimagine|discover|experience|redefine)\b/i;
    const NOUN = /\b(workflow|workflows|experience|productivity|potential|business|team|teams|journey|growth|success|performance|efficiency|creativity|future|possibilities)\b/i;
    const STOCK = /\b(next[- ]gen(?:eration)?|cutting[- ]edge|all[- ]in[- ]one (?:platform|solution)|game[- ]chang(?:ing|er)|seamless(?:ly)?)\b/i;
    const texts = new Set();
    const els = all.filter((el) => /^(H1|H2|H3|BUTTON|A)$/.test(el.tagName) && visible(el));
    for (const el of els) {
      const t = shortText(el).replace(/\s+/g, " ");
      if (!t || t.length > 90) continue;
      if ((VERB.test(t) && NOUN.test(t)) || STOCK.test(t)) texts.add(t);
    }
    return { value: texts.size, detail: { examples: Array.from(texts).slice(0, 5) } };
  });

  return { probes, meta: { elements: all.length, words, boxed: boxed.length } };
}

if (typeof module !== "undefined") module.exports = { PROBE_THRESHOLDS };
