# Prevalence report — dev split

Generated 2026-11-25 at commit ab37bc9, from local snapshots.
Sites measured: 10 AI, 6 human.

## Read this first
- Thresholds are provisional initial guesses, not tuned values. A rate here says how often a guess fires, not how good the heuristic is.
- With 10 AI and 6 human sites, intervals are wide. Do not set weights from this alone.
- The corpus has no hard negatives (modern, polished, human-built sites). Human results only show how plain old-school pages score.

## Probes, sorted by gap between AI and human fire rates

### C09 — Rounded icon boxes
Fires when >= 3 (rounded icon boxes); provisional.
- AI: 8/10 (80%, 95% CI 49%-94%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=5, archive-shop-store=15, liquid-log-glow=1, sell-me-this-pen=1, tq-muted-octopus=15, tq-colorful-horse=5, tq-useful-elephant=28, tq-fragrant-mink=15, tq-mobile-app=14, tq-farmhouse-restaurant=10
- Human values: wikipedia=1, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C10 — Teaser cards with icon at top left
Fires when >= 3 (cards in the largest icon-top-left group); provisional.
- AI: 8/10 (80%, 95% CI 49%-94%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=3, archive-shop-store=5, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=3, tq-colorful-horse=3, tq-useful-elephant=3, tq-fragrant-mink=4, tq-mobile-app=5, tq-farmhouse-restaurant=5
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C01 — Icon density
Fires when >= 25 (small icons per 1,000 words); provisional.
- AI: 7/9 (78%, 95% CI 45%-94%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=92.72, archive-shop-store=178.57, liquid-log-glow=n/a, sell-me-this-pen=21.28, tq-muted-octopus=45.93, tq-colorful-horse=29.77, tq-useful-elephant=47.23, tq-fragrant-mink=41.02, tq-mobile-app=51.75, tq-farmhouse-restaurant=23.07
- Human values: wikipedia=4.78, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=1.46, suckless=0.66

### C24 — Number of distinct corner radii
Fires when <= 3 (distinct corner radii (fires when this few)); provisional.
- AI: 0/9 (0%, 95% CI 0%-30%)
- Human: 1/2 (50%, 95% CI 9%-91%)
- AI values: care-binder=6, archive-shop-store=4, liquid-log-glow=n/a, sell-me-this-pen=4, tq-muted-octopus=4, tq-colorful-horse=5, tq-useful-elephant=5, tq-fragrant-mink=5, tq-mobile-app=7, tq-farmhouse-restaurant=7
- Human values: wikipedia=7, craigslist=1, motherfuckingwebsite=n/a, danluu=n/a, hacker-news=n/a, suckless=n/a

### C03 — Corner-radius saturation
Fires when >= 0.4 (share of boxed elements with radius >= 16px); provisional.
- AI: 4/10 (40%, 95% CI 17%-69%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0.43, archive-shop-store=0.31, liquid-log-glow=0, sell-me-this-pen=0.41, tq-muted-octopus=0.06, tq-colorful-horse=0.21, tq-useful-elephant=0.04, tq-fragrant-mink=0.31, tq-mobile-app=0.80, tq-farmhouse-restaurant=0.59
- Human values: wikipedia=0.13, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C04 — Large shadow blur radius
Fires when >= 3 (elements with shadow blur >= 30px); provisional.
- AI: 3/10 (30%, 95% CI 11%-60%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=1, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=1, tq-colorful-horse=0, tq-useful-elephant=4, tq-fragrant-mink=1, tq-mobile-app=5, tq-farmhouse-restaurant=9
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C05 — Neon gradients
Fires when >= 1 (elements with a neon gradient); provisional.
- AI: 3/10 (30%, 95% CI 11%-60%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=1, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=6, tq-fragrant-mink=0, tq-mobile-app=7, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C17 — Row of big-number metrics
Fires when >= 3 (siblings in the largest metrics row); provisional.
- AI: 3/10 (30%, 95% CI 11%-60%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=4, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=3, tq-colorful-horse=0, tq-useful-elephant=4, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C14 — Serif headline with sans-serif body
Fires when >= 1 (serif h1 with sans body (0/1)); provisional.
- AI: 4/10 (40%, 95% CI 17%-69%)
- Human: 1/6 (17%, 95% CI 3%-56%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=1, tq-muted-octopus=0, tq-colorful-horse=1, tq-useful-elephant=0, tq-fragrant-mink=1, tq-mobile-app=0, tq-farmhouse-restaurant=1
- Human values: wikipedia=1, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C06 — Pastel gradients
Fires when >= 1 (elements with a pastel gradient); provisional.
- AI: 2/10 (20%, 95% CI 6%-51%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=2, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=3, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C13 — Giant, bold, centered hero h1
Fires when >= 3 (of 3 hero-h1 conditions met); provisional.
- AI: 2/10 (20%, 95% CI 6%-51%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=2, archive-shop-store=1, liquid-log-glow=2, sell-me-this-pen=3, tq-muted-octopus=1, tq-colorful-horse=2, tq-useful-elephant=2, tq-fragrant-mink=2, tq-mobile-app=2, tq-farmhouse-restaurant=3
- Human values: wikipedia=2, craigslist=1, motherfuckingwebsite=1, danluu=0, hacker-news=0, suckless=1

### C16 — One-sided colored border (left accent)
Fires when >= 1 (left-accent bordered boxes (excl. blockquote)); provisional.
- AI: 2/10 (20%, 95% CI 6%-51%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=8, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=1
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C15 — Boxes inside boxes inside boxes
Fires when >= 3 (max nesting depth of boxed elements); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 1/6 (17%, 95% CI 3%-56%)
- AI values: care-binder=1, archive-shop-store=2, liquid-log-glow=2, sell-me-this-pen=2, tq-muted-octopus=2, tq-colorful-horse=2, tq-useful-elephant=2, tq-fragrant-mink=2, tq-mobile-app=2, tq-farmhouse-restaurant=2
- Human values: wikipedia=3, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C08 — Glow effects
Fires when >= 1 (elements with a colored glow shadow); provisional.
- AI: 1/10 (10%, 95% CI 2%-40%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=1, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C11 — Eyebrow label above headings
Fires when >= 1 (headings with an eyebrow label); provisional.
- AI: 1/10 (10%, 95% CI 2%-40%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=1, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C19 — Testimonial card grid
Fires when >= 3 (siblings in the largest testimonial group); provisional.
- AI: 1/10 (10%, 95% CI 2%-40%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=4, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C02 — Emoji density
Fires when >= 3 (emoji per 1,000 words); provisional.
- AI: 1/9 (11%, 95% CI 2%-44%)
- Human: 1/6 (17%, 95% CI 3%-56%)
- AI values: care-binder=0, archive-shop-store=52.52, liquid-log-glow=n/a, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=11.44, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C07 — Gradient borders
Fires when >= 1 (elements with a gradient border); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C12 — Pill-shaped badge near the hero
Fires when >= 1 (headings with a pill eyebrow); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C18 — Three-card pricing layout
Fires when >= 3 (siblings in the largest pricing group); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C20 — Whole-page section skeleton
Fires when >= 3 (of 5 section archetypes present); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=1, archive-shop-store=2, liquid-log-glow=0, sell-me-this-pen=1, tq-muted-octopus=2, tq-colorful-horse=1, tq-useful-elephant=2, tq-fragrant-mink=2, tq-mobile-app=1, tq-farmhouse-restaurant=1
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C21 — Faint monospaced descriptors
Fires when >= 2 (faint monospace descriptors); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C22 — Oldstyle figures
Fires when >= 1 (elements with oldstyle numerals); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0

### C23 — Dead calls to action
Fires when >= 0.3 (share of button-like links that are dead); provisional.
- AI: 0/2 (0%, 95% CI 0%-66%)
- Human: n/a
- AI values: care-binder=n/a, archive-shop-store=0, liquid-log-glow=n/a, sell-me-this-pen=0, tq-muted-octopus=n/a, tq-colorful-horse=n/a, tq-useful-elephant=n/a, tq-fragrant-mink=n/a, tq-mobile-app=n/a, tq-farmhouse-restaurant=n/a
- Human values: wikipedia=n/a, craigslist=n/a, motherfuckingwebsite=n/a, danluu=n/a, hacker-news=n/a, suckless=n/a

### C25 — Generic imperative microcopy
Fires when >= 1 (generic imperative headings/CTAs); provisional.
- AI: 0/10 (0%, 95% CI 0%-28%)
- Human: 0/6 (0%, 95% CI 0%-39%)
- AI values: care-binder=0, archive-shop-store=0, liquid-log-glow=0, sell-me-this-pen=0, tq-muted-octopus=0, tq-colorful-horse=0, tq-useful-elephant=0, tq-fragrant-mink=0, tq-mobile-app=0, tq-farmhouse-restaurant=0
- Human values: wikipedia=0, craigslist=0, motherfuckingwebsite=0, danluu=0, hacker-news=0, suckless=0
