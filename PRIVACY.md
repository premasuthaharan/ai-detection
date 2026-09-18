# Privacy Policy — AI Slop Detector

**Last updated: 2026-09-18**

AI Slop Detector is a Chrome extension that scores how "AI-generated" a
webpage's UI looks. This policy explains exactly what the extension does
and does not do with your data.

## What the extension accesses

When you click the toolbar icon, the extension reads the current tab's
DOM, computed CSS styles, and visible text (including content inside open
shadow roots) to check for design patterns commonly produced by AI coding
tools (gradient color usage, font choices, icon styles, layout structure,
etc.).

This happens only when you actively click the extension icon. It never
runs automatically, in the background, or on pages you haven't explicitly
asked it to analyze.

## What the extension does with that data

All analysis happens **entirely on your device**, inside your browser.
The extension:

- Makes **no network requests** of any kind (no `fetch`, no
  `XMLHttpRequest`, no analytics, no telemetry)
- Does **not** store the page content it reads, beyond the current popup
  session
- Does **not** transmit anything to a server, developer, or any third
  party
- Does **not** collect personally identifiable information, browsing
  history, location, authentication data, or any other category of user
  data

The only thing persisted anywhere is your light/dark theme preference for
the popup UI, saved locally via `localStorage` in your browser — this
never leaves your device either.

## Third parties

None. This extension does not integrate with, or share data with, any
third-party service, analytics provider, or advertiser.

## Changes to this policy

If this extension's data practices ever change, this document will be
updated accordingly before any such change ships.

## Contact

Questions about this policy can be raised via the project's GitHub
repository: https://github.com/premasuthaharan/ai-detection
