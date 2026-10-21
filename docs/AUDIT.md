# Property Empire v7.3 — Full Audit

Date: 2026-10-21. Method: code reading of all 17.9K lines, two committed play recordings with timestamps, the headless simulator plus purpose-built seeded measurement scripts, and Playwright screenshots of every screen at 412×915 and 1280×800.

Sections:
1. `docs/audit/01-economy.md` — core loop, every secondary system, exploits, verdicts.
2. `docs/audit/02-presentation.md` — UI/UX per screen, CSS architecture, performance, accessibility.
3. `docs/audit/03-engineering.md` — architecture, save system, Android wrapper, store readiness.

The redesign that answers this audit is `docs/REDESIGN.md`; the plan is `docs/TASKS.md`.

## Executive summary

**The game is watched, not played.** The owner's own recordings show the full 1750–1812 run as one 42-minute session on auto-advance at 18 game-months per minute. The reason is structural: a studio pays itself back in 17 years, so the player's input is irrelevant for the first 300 turns, and after that nothing pushes back, so a Normal run reaches €2 billion with zero loans while managers resolve every decision. There is no deal to find (price = value), no reason to borrow (leverage is net negative), no rival that is more than a number, no way to lose, and no decision with a non-obvious answer.

**Most of the breadth is dominated, exploitable or dead.** Of 13 secondary systems, 2 should be cut outright, 1 rebuilt, 9 fixed, and 1 kept. Ten exploits were confirmed in-engine, including an infinite-money investment loop and a merger arbitrage. Goal fountains paid out 87% of net worth over a run. City challenges are pre-satisfied at month zero for every family.

**The presentation is the strongest part, and it still reads as cheap.** The 3D isometric city and the D3 world map are real assets. But the HUD clips, modals do not block, toasts stack five deep with duplicates, the campaign pill overlaps every header, emoji serve as icons in three competing visual languages, type runs 8–11px, and there is no design-token discipline (208 inline styles, 16 distinct type sizes, undefined tokens). The splash collapses from a cinematic canvas into a translucent form the moment family select appears.

**It is not shippable to either store as is.** Runtime CDN dependence (three.js, d3, map data, fonts) with no offline path; interstitials every 4–20 seconds of auto-play; no GDPR consent; billing that grants without acknowledging on restore; placeholder keys that disable every integrity check; targetSdk below Play's minimum; 23 MB of debug recordings committed and served; a debug recorder that fills localStorage to quota for every player; no iOS path at all.

**What to keep:** the 3D city engine and 20 city layouts, the era arc and historical set-pieces as a concept, the city-trait idea (5 of 12 traits), the four-family framing, the headless-simulator discipline, and the vanilla-JS + WebView approach (moved to Capacitor).

**What the rebuild does:** replaces the economy with deal appraisal under uncertainty, per-property mortgages with covenants, rivals with real portfolios, yearly turns from 1850, a dynasty that ends runs, counterforces that scale, and a 3D city that displays progress. See `docs/REDESIGN.md`.

## The twelve numbers that matter

| Finding | Value |
|---|---|
| Owner's playtest, 62 game-years | 41.6 min, one session, 18 months/min |
| Studio payback at start | ~17 years |
| Year of 5th property (recording) | 1764 (month 167) |
| Net worth 1851, zero loans | €1.96 B, 250 properties |
| Rent / expenses ratio late game | 17 : 1 |
| 50-year Chen, borrow vs never | €28.5K vs €58.8K |
| City challenges pre-satisfied at start (Vanderbilt) | 7 of 20 |
| Decade-goal payouts over a run | 87% of NW |
| Investment exploit per click (yr 5) | +€1.44 M |
| Interstitial cadence at fastest speed | every ~4 s |
| Debug log per player | up to 50K entries, ~6–9 MB |
| Inline styles in ui.js / type sizes in CSS | 208 / 16 |
