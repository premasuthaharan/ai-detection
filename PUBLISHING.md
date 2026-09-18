# Publishing checklist

Everything here is drafted and ready to copy in. The steps requiring your
Google account / payment / actual submission are marked **(you)**.

## 1. Package the extension

```
./scripts/package.sh
```

Produces `dist/ai-slop-detector-v1.0.0.zip` containing only the runtime
files (manifest, background, content, lib, popup, icons) — no tests,
node_modules, or dev tooling.

## 2. Chrome Web Store Developer account **(you)**

- Sign up at https://chrome.google.com/webstore/devconsole (one-time $5 fee, Google account required)
- This is a real account + payment step — I can't do this on your behalf

## 3. Store listing copy (draft, adjust to taste)

**Category:** Developer Tools (or Productivity)

**Short description** (132 char max, same as manifest):
> Scores how AI-generated a webpage's UI looks using local design heuristics. No network calls, nothing leaves your browser.

**Detailed description:**
> AI Slop Detector scores how "AI-generated" a webpage's UI looks — the purple gradients, shadcn/ui defaults, generic icon sets, and templated feature-grid layouts that AI coding tools (v0, Lovable, Bolt, Claude/ChatGPT-generated apps) tend to converge on.
>
> Click the toolbar icon on any page to get a 0–100 score with a full breakdown of exactly which signals fired and why. Everything runs locally in your browser — no API calls, no network requests, no data collected or transmitted anywhere.
>
> This is a heuristic estimate based on common design patterns, not a definitive test of AI authorship — hand-built sites that use the same component libraries or design trends can also score high.
>
> Signals checked include: shadcn/ui CSS variable fingerprints, gradient color clustering, font fingerprinting, generic icon library detection, repeating feature-grid layouts, glassmorphism, gradient text, scroll-reveal animation setups, testimonial avatar stacks, marketing buzzword density, and more.

**Permissions justification** (Chrome Web Store will ask why each permission is needed):
- `activeTab`: reads the DOM of the current tab only when you click the extension icon — never runs automatically or in the background
- `scripting`: injects the local analysis script into the current tab to read its DOM/CSS

## 4. Privacy practices tab

Chrome Web Store requires an explicit data-use disclosure. Since this
extension collects nothing:

- **Does this extension collect user data?** No
- **Justification:** All analysis runs locally in the browser via `content/collector.js` and `lib/scoring.js`. No network requests are made (verify: the extension makes zero `fetch`/`XMLHttpRequest` calls — grep the codebase to confirm before submitting). No data is stored, transmitted, or shared with any third party.

You likely won't need a hosted privacy policy URL given no data collection,
but if the form requires one, a single sentence page stating "this
extension collects no data" satisfies it.

## 5. Screenshots **(you, or ask me to help)**

Chrome Web Store requires at least one screenshot (1280x800 or 640x400).
Load the unpacked extension, run it on a page that scores high (e.g. one
of the sites in `tests/sites.json`) and one that scores low, and capture
the popup showing the gauge + why-list. I can help capture these via
browser automation if you grant access, or you can screenshot it yourself
— whichever you prefer.

## 6. Submit **(you)**

Upload `dist/ai-slop-detector-v1.0.0.zip` in the Developer Console, paste
in the listing copy above, fill in the privacy tab, attach screenshots,
and submit for review. Review typically takes a few hours to a few days.
