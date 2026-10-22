# Property Empire v8 — Task Plan

Branch for all work: `claude/peaceful-bohr-aksms0` (one PR per phase).
Rules in `docs/REDESIGN.md` §15 apply to every task. Each task has an ID,
an owner file set, and acceptance criteria. Mark done with `[x]` and the
commit hash.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase 0 — Foundations (this session)

- [x] **P0.1 Audit** — `docs/AUDIT.md` with evidence from recordings, simulator and screenshots.
- [x] **P0.2 Design bible** — `docs/REDESIGN.md` (pillars, numbers, engine contract, balance targets, master prompt).
- [x] **P0.3 Task plan** — this file.
- [x] **P0.4 Vendor runtime libs** — `js/vendor/three.min.js`; drop d3/topojson/world-atlas runtime fetch (world map becomes a static SVG asset). Acceptance: game loads with network disabled.
- [x] **P0.5 Repo hygiene** — move `property-empire-recording-*.json`, `world_hi_res_v4_palette.html`, `chatgpt realestate/` out of the deployable root (into `archive/`, excluded from sw.js and Android copy script). Acceptance: deploy folder < 3 MB.

## Phase 1 — New core (vertical slice; this session)

- [x] **P1.1 Engine** — `js/engine/*` per bible §13: RNG, storage, data, state, market (listings/comps/appraisal/offers/counters/auctions/sell), finance (mortgages/refinance/covenants/margin calls/rate cycle), property (condition/renovation/rent/managers), rivals (6 archetypes with real portfolios), dynasty (aging/heirs/traits/succession/estate tax), events (morning paper, choices, historical 1850+), goals (yearly/era/campaign/achievements/legacy), cities (unlock by cost + reputation), turn (endYear → YearReport, skipQuietYears, bankruptcy/comeback). Acceptance: `node js/sim/tests.js` green (≥40 assertions incl. "no goal pre-satisfied for any family"), `node js/sim/balance.js` prints the §14 table with PASS on every row or a written justification.
- [x] **P1.2 3D city v2 + hero splash** — ownership colours, FOR SALE signs, scaffolding/crane, condition states, era skins, selection/focus/update API, mobile quality mode, leak-free destroy; `Splash.mount()` live 3D London with era cycle and non-WebGL fallback. Acceptance: Playwright screenshots at 412×915 and 1280×800 reviewed; 60 fps on `quality:'low'` in a desktop profile.
- [x] **P1.3 New UI shell** — new `index.html` + `js/ui/*` against the engine contract: start screen (hero + dynasty card), family select with trait pick, year loop (morning paper → deal board → portfolio → end year → year report), listing detail with appraisal panel (comps, cues, estimate band) and offer/finance sheet (price slider, LTV slider, payment preview, acceptance odds), auction sheet, property detail (renovate/rent/refinance/sell), portfolio (grouped by city, LTV and cash-flow per property, covenant warnings), leaderboard with "what they did this year", dynasty panel, events/historical cards, bankruptcy/comeback screen, settings. No auto-advance; "Skip quiet years" only. Acceptance: a full 30-year game can be played by hand in the browser; every screen screenshotted at 412×915 and 1280×800; no toast stacking; all tap targets ≥ 44px.
- [x] **P1.4 Design system** — `css/tokens.css` (spacing 4/8, 5 type sizes, colour tokens light+dark, radius, shadows, motion), `css/components.css` (buttons, cards, sheets, chips, tables, bars), SVG icon sprite replacing emoji-as-icons, safe-area insets, 360px and tablet layouts. Acceptance: Lighthouse accessibility ≥ 90 on the deal board.
- [x] **P1.5 Remove legacy** — delete `js/game.js`, `js/data.js`, `js/ui.js`, `js/app.js`, `js/graphics.js` (keep world map SVG as an asset), `js/mosaic.js`, `js/simulate.js` once P1.3 is playable; update `CLAUDE.md`, `DEBUGGING.md`, `sw.js` precache list, `android/copy-web-assets.sh`. Acceptance: no references to `GameEngine`/`GameUI` remain.
- [x] **P1.6 Version + ship** — bump version in 3 places to v8.0, service-worker cache name, push branch, open PR with the balance table and screenshots.

## Phase 2 — First 30 minutes (onboarding, tutorial, pacing)

- [ ] **P2.0 Engine follow-ups from the UI build** — `Finance.mortgageQuote(id, ltv, type, fixed, price)` must quote against the offer price for listings (today it quotes against asking and the UI scales it); split `Game.recordLegacy()` out of `Game.newDynasty()` so the UI can return to family select; expose previous-year ranks in `Rivals.leaderboard()` instead of a UI-side snapshot; `auctionView.round` should start at 1. Acceptance: tests added for each.

- [ ] **P2.1 Guided first 3 years** — scripted first deal (an obviously underpriced estate sale), first mortgage quote explained in one sheet, first renovation, first year report with the "equity you created" number. Skippable. Acceptance: 5 fresh testers (or scripted naive player) buy, finance and renovate by year 3.
- [ ] **P2.2 Advisor voice** — a single in-world advisor (family solicitor) who delivers tips as short speech bubbles tied to context (first margin call warning, first auction), never generic tips. Acceptance: no "random tip" rotation remains.
- [ ] **P2.3 Appraisal mini-skill** — comps panel polish: tap a comp to see it on the 3D map; "your estimate" input with post-sale reveal ("you were 6% high") that trains the player. Acceptance: competent-player sim unchanged; naive player improves over 10 years.
- [ ] **P2.4 Year report polish** — animated numbers, one headline illustration, rank movement, cliffhanger line, share card (PNG export) of the dynasty at era ends.

## Phase 3 — Rivals, dynasty, events depth

- [ ] **P3.1 Rival personalities visible** — portraits (SVG), one-line taunts/reactions in auctions and year report, relationship meter, "offer on their property" flow. Acceptance: ≥ 1 rival interaction per 2 years in sim; leaderboard rank at year 30 in #2–#4 band.
- [ ] **P3.2 Marriage/alliance** — propose marriage of an heir to a rival family: alliance grants deal intel and a late-game merger option; refusal costs reputation.
- [ ] **P3.3 Succession ceremony** — heir choice screen with trait reveal, estate tax breakdown, trust/charity planning, "new chapter" title card.
- [ ] **P3.4 Events v2** — 40+ city events with two non-dominant choices, 12 historical set-pieces 1850–2030 with pre-warnings in the morning paper, era transition set-pieces that re-skin the 3D city live.
- [ ] **P3.5 Bankruptcy/comeback arc** — rivals absorb your buildings visibly on the 3D map; comeback run has a bespoke yearly goal track.

## Phase 4 — Breadth returns as era unlocks (only what passed the audit)

- [ ] **P4.1 Fixed-rate mortgages and bonds** (Boom era) — hedge vs rate cycle.
- [ ] **P4.2 Own bank** (Modern era, prestige-gated) — lend to rivals, earn spread, risk defaults.
- [ ] **P4.3 Build-to-suit** (land + developer deals) — replace old build-on-land; tie to Okonkwo rival behaviour.
- [ ] **P4.4 City traits v2** — keep: rent control, boom & bust, tax haven, heritage, redevelopment, tourism, tech hub, foreign-buyer; cut: density premium, crime pressure, elite enclave, monsoon (fold into events).
- [ ] **P4.5 Cut list** — businesses/stakes/mergers, stocks, savings-as-feature, insurance menus, auto-sell rules, tax shelters: do not return unless redesigned to pass pillar 1.

## Phase 5 — Retention systems

- [ ] **P5.1 Four families with real rule differences** (bible §11).
- [ ] **P5.2 Prestige perks store** (legacy points) with perks that change rules, not just +cash.
- [ ] **P5.3 Weekly seeded challenge** (30-year sprint, local leaderboard; online later).
- [ ] **P5.4 Era-start scenarios** (1929 leveraged, 2008 crash).
- [ ] **P5.5 Achievements v2** re-tuned to the new curve, with 3D trophies in the home city.

## Phase 6 — Store readiness

- [ ] **P6.1 Capacitor project** for Android + iOS replacing the hand-rolled WebView wrapper; AdMob + Billing plugins; keep anti-tamper only where it is not theatre.
- [ ] **P6.2 Monetization** per bible §12 (rewarded placements, interstitial caps, remove-ads, family pack), UMP consent, privacy policy page.
- [ ] **P6.3 Save system** — versioned saves, 3 slots, export/import, cloud save (Play Games / iCloud) later.
- [ ] **P6.4 Performance** — < 2 s cold start on mid-range Android, 60 fps city view on `low`, memory stable over a 180-year game.
- [ ] **P6.5 Localisation scaffolding** — all strings through `PE.T()`, English + 1 test locale.
- [ ] **P6.6 Store assets** — icon, feature graphic, 8 screenshots per form factor, 30 s trailer captured from the hero splash and city view.
- [ ] **P6.7 Soft launch** — 2 countries, analytics events (year reached, first mortgage, first auction win, bankruptcy, D1/D7 retention), tune from data.

## Phase 7 — Live ops (post-launch)

- [ ] Monthly event packs, new cities as paid/earned packs, online weekly leaderboard, dynasty sharing cards.
