# Swap-Smart

**When a dark store item is out of stock, the picker gets the best substitute in one tap —
explainable, hard-rule-guarded, proven by reproducible numbers.**

**Live:** swap-smart.ricothen.com *(fully offline-capable: no API key, no database — the whole
engine runs in your browser)*

## Why

Q-commerce promises 15-minute delivery from dark stores. But the system's inventory and the
physical shelf disagree constantly — roughly **8% of lines** are missing at pick time
(industry range 5–10%). When a picker hits an empty slot, today's default on many platforms is
an automatic refund:

| | Auto-refund (status quo) | Naive bot (popularity pick) |
|---|---|---|
| Basket | loses the item — often the **whole order** (hero items: milk, eggs, bread, bananas) | sometimes absurd or unsafe swaps |
| Customer | refund email, dinner plan dead | "we replaced your butter with…” |
| Support | ticket + payment reversal | complaint + ticket + waste |

The decision happens in ~5 seconds, in a hallway, with no decision support. That is the
problem Swap-Smart solves.

## What you get — three views, one engine

1. **Picker** — the mobile flow inside a device frame: the picker reports every item from the
   slot — **✓ Found it** packs the line, **✗ Can't find it** stamps `OUT OF STOCK` (or
   `PHANTOM STOCK` when the system still calls it in-stock) → the engine ranks safe substitutes
   with **reason chips** (`40% match`, `€0.20 cheaper`, `Fits vegan basket`) and an acceptance
   estimate → picker confirms → the customer gets an honest note in EN/DE/ID. Blocked candidates
   are counted, not hidden.
2. **Ops Deck** — the proof: same orders, same shelf, **three policies compete**
   (auto-refund vs naive bot vs Swap-Smart). Impact strip, twin replay of 140 shelf moments,
   a score→acceptance histogram, and a live **substitution explorer** where you can switch the
   household (vegan, lactose-free, nut-allergy) and watch the hard rules bite.
3. **Story** — problem → solution → proof table → **honesty section**: every assumption,
   its value, and its anchor. Plus a **Golden Demo**: a 60-second narrated tour over the real
   simulation.
4. **Q&A** — the questions reviewers actually ask, answered from two seats: a store-operations
   manager's and an engineer's. Every number quoted there is computed by the engine and locked
   by tests.

## The numbers (seed 2026, 1,000 orders — reproducible)

Same 1,000 generated baskets, same shelf (1,095 missing lines) for all policies:

| KPI | Auto-refund | Naive bot | **Swap-Smart** |
|---|---|---|---|
| Swap acceptance | — (no offers) | 50.0% | **77.9%** |
| Missing items refunded | 100.0% | 0.0% | 0.0% |
| Basket retained (of €31,234) | €24,545 | €26,731 | **€29,602** |
| Orders cancelled (hero lost) | 80 | 45 | **16** |
| Complaint events / 1k orders | 278 | 373 | **96** |
| Rejected swaps → waste items | 0 | 770 | **322** |
| Picker time for 1,095 decisions | 730 min | 548 min | **110 min** |

**Business impact** (vs auto-refund, projected at 350 orders/day per store):
**+€5,057 basket value per 1,000 orders** → **€81,843 net per month/store**
(incl. €2.50 saved per avoided refund), 109 picker-hours saved per month.

Swap-Smart also cuts the naive bot's rejected-swap waste by **58%** — substitution done right
reduces food waste, done wrong it doubles it.

**Reproduce:** open the Ops Deck → seed `2026`, orders `1000` → same numbers, byte-identical
KPIs → **Export JSON**. Or `npm test` — determinism is asserted in CI.

## How it works

```
hard rules (non-negotiable, non-AI)      explainable score (0–100)              human confirms
─────────────────────────────────        ────────────────────────────────       ──────────────────
in stock · allergen-safe · diet-safe  →  semantic 38 · price 20 · diet 14  →  picker taps one card
≤25% price uplift · same category        popularity 12 · subcategory 8 ·        customer gets an honest
                                         rating 8 — every chip is a reason      multilingual note
```

- **Semantic matching**: synonym-aware TF-IDF cosine over product names + attribute Jaccard
  ("whole milk" meets "full-cream", "oat drink" meets "Haferdrink") — deterministic, in-browser.
- **Basket inference**: diet constraints and price sensitivity are inferred from the rest of
  the basket — a vegan basket is never offered dairy, ever.
- **Acceptance model**: a transparent formula of score & price uplift — quoted in the README,
  visible in the histogram, no black box.
- **Where the AI is (and isn't)**: hard rules and ranking are deterministic; the optional LLM
  (serverless, key-gated) only polishes the customer message. No key? Templates carry the demo —
  the product never depends on the model.

## Honest constraints

- All data is **synthetic** — fictional Berlin brands (Alpenhof, Kornwerk, Grünhof…), no real
  products, no platform brands.
- Numbers are **simulated and reproducible**, not claimed from production data. The assumptions
  (OOS rate 8% popularity-weighted, 20% hero-loss cancellation, €2.50 refund handling,
  350 orders/day) are listed in the app's honesty section and adjustable in
  `src/engine/simulate.ts`.
- Inventory mismatch is modeled lightly and one-directional: the picker reports found / not-found
  at the slot, and a not-found on a system in-stock item is flagged as a **phantom stock** event
  (cycle-count territory) before the substitution flow starts. Hidden stock (system says OOS,
  picker finds it anyway) and full inventory reconciliation stay out of scope.
- The acceptance model is calibrated to published online-grocery substitution research
  (~50% acceptance for anonymous naive swaps; in-person, explainable swaps do better).

## Stack

Vite · React 18 · TypeScript strict · Tailwind (design tokens, dual theme) · framer-motion ·
hand-written SVG charts · Vitest (18 engine tests) · Playwright (7 e2e) ·
optional Vercel serverless function for the AI writer.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 — replay mode, no API key needed
npm test             # engine determinism + guardrail invariants
npm run e2e          # golden-path e2e (builds first)
```

## Android app

The picker handheld is also a **real, installable Android app** — a Capacitor wrapper around the
exact same web build: same engine, same numbers, no separate codebase.

- **Scope:** the Picker flow fullscreen (the phone *is* the device frame — no mockup chrome) plus
  an About screen with the proof KPIs, hard rules and honesty section.
- **Native touches:** haptic feedback (found / out-of-stock stamp / swap confirmed), status bar
  themed to the design tokens, splash screen & adaptive icons, safe-area layout, edge-to-edge.
- **Build:** `npm run cap:sync` (builds web + syncs into `android/`), then `npm run apk`
  → `android/app/build/outputs/apk/debug/app-debug.apk` (copied to `swap-smart-debug.apk` at the
  repo root). Needs JDK 21 + Android SDK 36 — build env notes in `AGENTS.md`.
- **Install on a phone:** transfer the APK and allow install-from-unknown-sources. It is
  debug-signed — fine for demos and interviews, not for the Play Store.
- **Download page:** `swap-smart.ricothen.com/apk` — a standalone page (QR code, 3-step install
  guide, honesty notes) serving the APK straight from the site. The binary lives at
  `public/swap-smart.apk`; refresh it after a rebuild with `npm run apk:copy`. Header and footer
  of the main site link to it, and `vercel.json` rewrites `/apk` to the SPA.
- The web app is untouched: `App.tsx` gates on `Capacitor.isNativePlatform()` and renders the
  mobile shell (`src/mobile/`) only inside the native wrapper.

---

*Portfolio engineering for a **Delivery Hero (Berlin)** application — the vendor-operations
companion to [prep-truth](https://github.com/ricothenfx/prep-truth) (prep-time settings),
[lastmile-lab](https://github.com/ricothenfx/lastmile-lab) (dispatch simulation) and
[hungry](https://github.com/ricothenfx/hungry) (consumer AI companion).*
