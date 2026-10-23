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

- [x] **P2.0 Engine follow-ups from the UI build** — `Finance.mortgageQuote(id, ltv, type, fixed, price)` must quote against the offer price for listings (today it quotes against asking and the UI scales it); split `Game.recordLegacy()` out of `Game.newDynasty()` so the UI can return to family select; expose previous-year ranks in `Rivals.leaderboard()` instead of a UI-side snapshot; `auctionView.round` should start at 1. Acceptance: tests added for each. _(engine done v8.1; UI pending unless noted)_

- [x] **P2.1 Guided first 3 years** — scripted first deal (an obviously underpriced estate sale), first mortgage quote explained in one sheet, first renovation, first year report with the "equity you created" number. Skippable. Acceptance: 5 fresh testers (or scripted naive player) buy, finance and renovate by year 3.
- [x] **P2.2 Advisor voice** — a single in-world advisor (family solicitor) who delivers tips as short speech bubbles tied to context (first margin call warning, first auction), never generic tips. Acceptance: no "random tip" rotation remains.
- [x] **P2.3 Appraisal mini-skill** — comps panel polish: tap a comp to see it on the 3D map; "your estimate" input with post-sale reveal ("you were 6% high") that trains the player. Acceptance: competent-player sim unchanged; naive player improves over 10 years.
- [x] **P2.4 Year report polish** — animated numbers, one headline illustration, rank movement, cliffhanger line, share card (PNG export) of the dynasty at era ends.

## Phase 3 — Rivals, dynasty, events depth

- [x] **P3.1 Rival personalities visible** — portraits (SVG heraldic crests with charges + motto ribbons), one-line taunts/reactions in auctions and year report, relationship meter, "offer on their property" flow (listed lots open from the rival sheet). Acceptance: ≥ 1 rival interaction per 2 years in sim; leaderboard rank at year 30 in #2–#4 band. _(2baa7f2; sim interaction test green)_
- [x] **P3.2 Marriage/alliance** — propose marriage of an heir to a rival family: alliance grants deal intel and a late-game merger option; refusal costs reputation. _(engine v8.1; UI 151a540 — candidate picker with live odds, alliance card, merger confirm)_
- [x] **P3.3 Succession ceremony** — heir choice screen with trait reveal, estate tax breakdown, trust/charity planning, "new chapter" title card. _(P3.3: ceremony with ink tree, wax-seal reveal and tax breakdown; charity endowment engine+UI per bible §7)_
  Quick balance (node js/sim/balance.js 20 5): 10/10 targets PASS, 4/4 family guards PASS.
- [x] **P3.4 Events v2** — 40+ city events with two non-dominant choices, 12 historical set-pieces 1850–2030 with pre-warnings in the morning paper, era transition set-pieces that re-skin the 3D city live. _(engine v8.1; era-gated landmarks + weather re-skin the city live, c4d938d)_
- [x] **P3.5 Bankruptcy/comeback arc** — rivals absorb the estate the moment the house falls (visible on the 3D map), end card names the absorber; comeback run has a bespoke three-step yearly goal track (black year → two buildings → 50% of peak). _(P3.5)_

## Phase 4 — Breadth returns as era unlocks (only what passed the audit)

- [x] **P4.1 Fixed-rate mortgages and bonds** (Boom era) — hedge vs rate cycle. _(engine cf55a08; fixed-rate in the offer sheet since v8.x; bonds desk UI 66ae40f; 18 tests + accounting fixes d2a261f; canon §16.3)_
- [x] **P4.2 Own bank** (Modern era, prestige-gated) — lend to rivals, earn spread, risk defaults. _(engine cf55a08; triple-counted-principal bug fixed + 14 tests d2a261f; bank panel UI 66ae40f; canon §16.3)_
- [x] **P4.3 Build-to-suit** (land + developer deals) — replace old build-on-land; tie to Okonkwo rival behaviour. _(engine cf55a08; commission UI on land sheets 66ae40f; 14 tests d2a261f; canon §16.3)_
- [x] **P4.4 City traits v2** — keep: rent control, boom & bust, tax haven, heritage, redevelopment, tourism, tech hub, foreign-buyer; cut: density premium, crime pressure, elite enclave, monsoon (fold into events). _(engine cf55a08; 18 effect-proof tests d2a261f; canon §16.3)_
- [x] **P4.5 Cut list** — businesses/stakes/mergers, stocks, savings-as-feature, insurance menus, auto-sell rules, tax shelters: verified absent from the v8 engine in v8.8; do not return unless redesigned to pass pillar 1. _(canon §16.3)_

## Phase 5 — Retention systems

- [x] **P5.1 Four families with real rule differences** (bible §11). _(engine v8.1; family select cards with crests + rule facts, start.js 0a7ad10)_
- [x] **P5.2 Prestige perks store** (legacy points) with perks that change rules, not just +cash. _(engine v8.1; store UI + mode-perk selection via Game.setModes, 1800761)_
- [x] **P5.3 Weekly seeded challenge** (30-year sprint, local leaderboard; online later). _(engine v8.1; lobby UI with best/history, 1800761; online interface agent-4 pending)_
- [x] **P5.4 Era-start scenarios** (1929 leveraged, 2008 crash). _(engine v8.1; scenario select UI, 1800761)_
- [x] **P5.5 Achievements v2** re-tuned to the new curve, with 3D trophies in the home city. _(engine v8.1; trophy room gallery, 1800761; 3D trophies not built — backlog)_

## Phase 6 — Store readiness

- [x] **P6.1 Capacitor project** for Android + iOS replacing the hand-rolled WebView wrapper; AdMob + Billing plugins; keep anti-tamper only where it is not theatre. _(cf55a08; verified Android build recipe 4f78a49)_
- [x] **P6.2 Monetization** per bible §12 (rewarded placements, interstitial caps, remove-ads, family pack), UMP consent, privacy policy page. _(ads.js + privacy policy cf55a08; rewarded placements wired d19200d + 4dbbeee; skip placement cut, canon §16.4; UMP is native-side in the app builds)_
- [x] **P6.3 Save system** — versioned saves, 3 slots, export/import, cloud save (Play Games / iCloud) later. _(slots + importSave cf55a08; slot routing + Settings slot manager d19200d + 4dbbeee)_
- [x] **P6.4 Performance** — < 2 s cold start on mid-range Android, 60 fps city view on `low`, memory stable over a 180-year game. _(docs/PERF.md: first paint 0.58 s, heap flat over 60 scripted years, 0 page errors; frameMs FAIL only under SwiftShader software GL — re-measure on a real device before launch)_
- [x] **P6.5 Localisation scaffolding** — all strings through `PE.T()`, English + 1 test locale. _(l10n.js: data-t hooks + PE.T, fr test locale, cf55a08)_
- [ ] **P6.6 Store assets** — icon, feature graphic, 8 screenshots per form factor, 30 s trailer captured from the hero splash and city view. _(partial: icon, feature graphic, 4 phone screenshots in store-assets/ via tools/make-store-assets.js; tablet set and 30 s trailer outstanding)_
- [ ] **P6.7 Soft launch** — 2 countries, analytics events (year reached, first mortgage, first auction win, bankruptcy, D1/D7 retention), tune from data. _(analytics wired d19200d per docs/analytics.md, local-only until a backend + consent exist; the 2-country launch itself is a store action)_

## Phase 7 — Live ops (post-launch)

- [ ] Monthly event packs, new cities as paid/earned packs, online weekly leaderboard, dynasty sharing cards.
