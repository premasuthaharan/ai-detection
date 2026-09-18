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
   into the active tab, which scans the live DOM/CSSOM for 11 signals
   (see table below).
2. [`lib/scoring.js`](lib/scoring.js) combines each signal's confidence
   with a fixed weight into a single 0–100 score.
3. The popup renders the score as a circular, color-coded gauge (green →
   yellow → red) plus a ranked "here's why" list, and sets the toolbar
   badge to match.
4. Navigating to a new page clears the badge ([`background.js`](background.js))
   so a stale score never lingers.

| Signal | Weight | What it checks |
|---|---|---|
| `shadcnVars` | 20 | shadcn/ui CSS custom properties on `:root` (`--primary`, `--radius`, ...) |
| `icons` | 12 | SVGs matching the default Lucide/Feather/Heroicons outline signature |
| `gradients` | 12 | Indigo/violet/purple gradient backgrounds |
| `fonts` | 10 | Primary font is Inter/Geist/Poppins/DM Sans/Manrope/etc. |
| `layout` | 10 | Repeating icon+title+description feature grid |
| `gradientText` | 8 | Gradient-filled headings (`background-clip: text`) |
| `radiusShadow` | 8 | Large border-radius combined with soft box-shadow |
| `glass` | 6 | Glassmorphism (backdrop-blur + translucent background) |
| `framework` | 6 | Next.js/Vite build fingerprints (correlational, low weight) |
| `buzzwords` | 5 | Marketing copy density ("supercharge", "elevate", "seamless"...) |
| `emojiHeadings` | 3 | Emoji-decorated headings (🚀✨) |

Score tiers: **0–30** looks hand-crafted, **31–60** mixed signals, **61–100** AI slop detected.

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
