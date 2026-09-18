# AI Slop Detector

A Chrome extension that scores how "AI-generated" a webpage's UI looks,
based entirely on local DOM/CSS heuristics — no API calls, no network
requests, nothing leaves the browser.

## Why

AI coding tools (v0, Lovable, Bolt, Claude/ChatGPT-generated React apps)
converge on a recognizable visual template: purple/indigo gradients, the
same handful of fonts (Inter, Geist, Poppins...), shadcn/ui component
defaults, generic outline icon sets, and the same page skeleton (hero →
3-column feature grid → testimonials → pricing → FAQ). This extension
fingerprints those tells.

## How it works

1. Click the toolbar icon. The popup injects [`content/collector.js`](content/collector.js)
   into the active tab, which scans the live DOM/CSSOM (including open
   shadow roots) for 15 signals (see table below).
2. [`lib/scoring.js`](lib/scoring.js) combines each signal's confidence
   with a fixed weight into a single 0–100 score.
3. The popup renders the score as a circular, color-coded gauge (green →
   yellow → red) plus a ranked "here's why" list, and sets the toolbar
   badge to match. A "Copy result" button copies a one-line shareable
   summary (e.g. `example.com scores 78/100 ...`) to the clipboard.
4. Navigating to a new page clears the badge ([`background.js`](background.js))
   so a stale score never lingers.

| Signal | Weight | What it checks |
|---|---|---|
| `shadcnVars` | 18 | shadcn/ui CSS custom properties on `:root` (`--primary`, `--radius`, ...) |
| `icons` | 11 | SVGs matching Lucide/Feather (outline) or Heroicons (solid) signatures |
| `gradients` | 11 | Blue/indigo/violet/purple gradient backgrounds |
| `fonts` | 9 | Primary font is Inter/Geist/Poppins/DM Sans/Manrope/etc. |
| `layout` | 9 | Repeating icon+title+description feature grid |
| `gradientText` | 7 | Gradient-filled headings (`background-clip: text`) |
| `radiusShadow` | 7 | Large border-radius combined with soft box-shadow |
| `scrollReveal` | 6 | Scroll-reveal fade-in setup (AOS markers, Tailwind opacity-0+translate-y, Framer Motion inline pre-reveal state) |
| `testimonialAvatars` | 5 | Row of 3+ small circular elements sharing a parent (the "trusted by" avatar-stack pattern) |
| `placeholderAssets` | 4 | Unreplaced placeholder images (picsum.photos, placehold.co, ...) or the default Vite favicon |
| `loremIpsum` | 4 | Unedited lorem-ipsum copy or starter-template boilerplate text ("Welcome to Next.js!", "Vite + React", ...) |
| `glass` | 3 | Glassmorphism (backdrop-blur + translucent background) |
| `framework` | 3 | Next.js/Vite build fingerprints (correlational, low weight) |
| `emojiHeadings` | 2 | Emoji-decorated headings (🚀✨) |
| `buzzwords` | 1 | Marketing copy density ("supercharge", "elevate", "seamless"...) |

Score tiers: **0–30** looks hand-crafted, **31–60** mixed signals, **61–100** AI slop detected.

**Shadow DOM:** all DOM-querying detectors walk into *open* shadow roots
so sites built with web components aren't invisible to the collector.
Closed shadow roots are intentionally inaccessible from outside — that's
a real browser security boundary, not a gap in this extension.

**Score floor:** a near-complete shadcn/ui CSS-variable match (≥90% confidence)
guarantees a score of at least 35, regardless of other signals — that
fingerprint is close to unfakeable by coincidence and shouldn't get
diluted away on a sparse/minimal page. See [`lib/scoring.js`](lib/scoring.js).

## Load it locally

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this directory
4. Visit any page and click the toolbar icon

## Regenerating icons

Icons are generated with Pillow, not hand-drawn — rerun after changing the design:

```
python3 icons/generate_icons.py
```

## Testing

```
npm install
npm test
```

[`tests/run.js`](tests/run.js) runs the exact shipped `content/collector.js`
+ `lib/scoring.js` against the sites listed in [`tests/sites.json`](tests/sites.json)
in real headless Chrome, and asserts the resulting score/tier lands within
the expected range. This is what caught the icon/gradient/shadcn scoring
bugs found while testing against a real AI-generated site — it exists so
future heuristic/weight tweaks can't silently regress those fixes.

To calibrate further, add more entries to `tests/sites.json` — a mix of
known Lovable/v0/Bolt-generated sites and hand-crafted/older sites — and
adjust `WEIGHTS` in [`lib/scoring.js`](lib/scoring.js) until the suite
reflects reality. Uses your local Chrome install (set `CHROME_PATH` if
it's not auto-detected).

For signals where no real, stable, publicly-hosted example is practical
to pin a test to (e.g. a site caught mid-unedited with picsum.photos
images and lorem ipsum copy — these get fixed quickly in practice), use a
synthetic fixture instead: add an HTML file to `tests/fixtures/` and
reference it from `sites.json` as `"fixture:<filename>"`.
