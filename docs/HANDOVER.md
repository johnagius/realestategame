# Property Empire v8 — Handover

Written 2026-10-22 for the next AI/engineer taking over this project. Read this
first, then `docs/REDESIGN.md` (the design bible, which is the law), then
`docs/TASKS.md` (the plan), then `docs/AUDIT.md` (why the old game failed).

---

## 1. One-paragraph state

The old v7.3 game (a 280-year monthly rent-compounding tycoon that players
only ever auto-advanced) was audited and replaced. v8 is a new game on the same
repo: yearly turns from 1850 to 2030, a deal board with mispriced listings you
appraise from comps, offers/counters/auctions against six rivals with real
portfolios, per-property mortgages with covenants and margin calls, three
renovation tiers with risk, a dynasty with succession and estate tax, scripted
historical crashes, bankruptcy with a comeback, a 3D city that shows ownership,
and a design-system UI with zero accessibility violations. Phases 0, 1 and 2 of
the plan are done and deployed to `main`. Phases 3–7 remain.

## 2. Where everything is

| Path | What |
|---|---|
| `docs/REDESIGN.md` | Design bible: pillars, rules, numbers, engine contract (§13), balance targets (§14), master prompt (§15), implementation decisions (§16) |
| `docs/TASKS.md` | Phased task list with acceptance criteria and status |
| `docs/AUDIT.md` + `docs/audit/*.md` | The full audit of v7 (economy, presentation, engineering) with evidence |
| `js/engine/` | The game engine. `PE.*` globals, load order in `ORDER.txt`. Pure, seeded, no DOM. All tunables in `data.js` (`PE.Data.balance`) |
| `js/sim/` | Node harness: `tests.js` (unit tests), `balance.js` (bible §14 table), `players.js` (scripted competent/naive players), `load.js` |
| `js/ui/` | Player UI (`PEUI`): `core.js` (render/sheets/toast/money), `start.js`, `hud.js`, `deals.js`, `city.js`, `portfolio.js`, `dynasty.js`, `rivals.js`, `year.js`, `guide.js` (first-3-years guide), `advisor.js` (solicitor voice), `appraisal.js` (estimate skill), `share.js` (share card), `app.js` (boot) |
| `css/tokens.css`, `css/components.css`, `css/app.css`, `css/splash.css` | Design system (light+dark, 4/8 spacing, 6 type sizes, 44px targets, safe areas) |
| `assets/icons.svg` | SVG icon sprite (no emoji in UI). `assets/report/*.svg` year-report scenes, `assets/advisor.svg` |
| `js/city3d-engine.js`, `js/cities/*.js` | Three.js isometric city renderer v2 and 20 city layouts |
| `js/intro.js` | `Splash.mount()` live 3D hero start screen |
| `js/vendor/three.min.js` | Vendored three.js r128 (no CDN at runtime) |
| `js/ads.js`, `js/audio.js` | Ad manager (web placeholder + Android bridge) and sound. Ads are only requested from the year report with wall-clock caps in `js/ui/year.js` |
| `sw.js`, `manifest.json`, `index.html` | PWA shell. Service worker is network-first; `CACHE_NAME` must change every release |
| `android/` | Hand-rolled Android WebView wrapper (AdMob + Play Billing). Not updated for v8 beyond copying web assets; see §7 |
| `tools/playwright/` | Verification scripts (see §4) |
| `tools/3d-testpages/` | Stand-alone pages to exercise the 3D renderer and splash |
| `archive/` | Old recordings, old prototype, v4.5 snapshot. Not deployed |

## 3. How to run

```bash
# Engine tests (must stay green)
node js/sim/tests.js
# Balance table (bible §14). Full run ~50 s; quick pass:
node js/sim/balance.js 20 5
# Play in a browser (must be served, not opened as a file)
python3 -m http.server 8790 --bind 127.0.0.1
# then open http://127.0.0.1:8790/index.html?seed=42
```

Console helpers while playing: `PE.Game.summary()`, `PE.Game.portfolio()`,
`PE.Market.listings('london')`, `PE.Finance.summary()`, `PE.Rivals.leaderboard()`,
`PE.Goals.current()`, `PE.Events.pending()`, `PE.Game.endYear()`.

`?seed=N` fixes the RNG; the same seed and actions reproduce the same game in
the browser and in Node.

## 4. How to verify a change (the bar every push must meet)

1. `node js/sim/tests.js` green.
2. `node js/sim/balance.js` all 10 targets PASS (paste the table into the commit or PR).
3. Scripted UI playthrough: `node tools/playwright/play.js` with the server on
   port 8790. It plays 1850–1880 as Chen through the real DOM (offers, counters,
   auctions, renovations, refinance, margin call, skip-years, reload + continue)
   and must end with `page errors: 0 console errors: 0`.
4. `node tools/playwright/phase2-flow.js` (guide stages year 1–4) and
   `node tools/playwright/axe.js` / `axe-phase2.js` (axe-core, expect 0 violations).
5. Screenshots at 412×915 and 1280×800 of every screen you touched. Look at them.

The scripts assume Playwright at `/opt/node22/lib/node_modules/playwright` and
Chromium at `/opt/pw-browsers/chromium` with SwiftShader flags; edit the
`require` path and `executablePath` for another machine (`npm i playwright`,
`npx playwright install chromium`). The scripts write screenshots to absolute
`/tmp/...` paths; change `OUT` at the top.

## 5. Branches and deployment

- The owner wants every completed step on `main`. GitHub Pages serves `main`.
- Work was done on `claude/peaceful-bohr-aksms0` and fast-forwarded to `main`.
  Both point at the same commit at handover (see §9).
- Release checklist: bump `PEUI.VERSION` (`js/ui/core.js`), `Game.version`
  (`js/engine/game.js`) and `CACHE_NAME` (`sw.js`), add any new files to the
  `ASSETS` precache list in `sw.js`, run §4, push.

## 6. What is done (with evidence)

- **Phase 0**: audit, bible, plan, vendored libs, repo hygiene (deploy tree 2 MB).
- **Phase 1**: engine (14 files; 194 tests at the time, now more), 3D v2 +
  hero splash, UI shell + design system, legacy deleted. Balance: 10/10 targets.
  Playthrough: 0 errors. axe: 0 violations.
- **Phase 2** (first 30 minutes): guided first three years (`guide.js`), advisor
  voice (`advisor.js`), appraisal mini-skill (`appraisal.js`), year-report
  polish with count-ups, six SVG scenes and a share card (`share.js`,
  `year.js`). Engine follow-ups (P2.0) and the Phase 3/5 engine systems were
  being built by a second agent at handover; see §9 for their exact state.

## 7. Known gaps and caveats (be honest with the owner)

- **Real-device performance is unmeasured.** The container has no GPU. The 3D
  budget (~200 draw calls, ~13k triangles, shadows off on `quality:'low'`) is
  sensible, but nobody has run it on a phone.
- **Android wrapper is v7-era.** `android/copy-web-assets.sh` copies the web
  tree so it will package v8, but: no UMP consent, billing restore path grants
  without acknowledging, `IntegrityChecker` and billing RSA key are
  placeholders (checks are off), `targetSdk 34` is below Play's minimum,
  `allowBackup=true`, interstitial cadence is now gated in the web layer only.
  Real AdMob IDs are committed in `AndroidManifest.xml` and
  `NativeAdManager.java`. No iOS path exists. Plan: Capacitor for both stores
  (TASKS Phase 6, and `docs/audit/03-engineering.md` §4).
- **Ads in web builds** are a placeholder overlay (`js/ads.js`). The "remove
  ads" flag lives in localStorage and the web fallback grants it via
  `confirm()`; this must be replaced before any monetised release.
- **Fonts** load from Google Fonts with `display=swap`; offline falls back to
  Georgia/system-ui without layout shift. They are not precached.
- **Landmarks are era-static** in the 3D city (The Shard appears in 1850).
  A per-landmark era list in `js/cities/*.js` would fix it.
- **"Three days of play" is not yet earned.** The loop now has real decisions
  (bible pillar 1 verified by the sim: 99% of years contain a non-dominant
  decision), but depth and retention systems (Phases 3 and 5) are what make
  people return. Playtest with real people before adding more systems.
- Cut from v7 on purpose (audit §B): businesses/stakes/mergers, stocks, savings
  as a feature, player banks, insurance menus, auto-sell, tax shelters. Do not
  bring them back unless redesigned to pass pillar 1 (TASKS Phase 4).

## 8. Non-negotiable rules (from the bible and CLAUDE.md)

- Never add auto-advance back. "Skip quiet years" (max 5, stops on any decision) is the only time skip.
- Never add a mechanic that makes a player choice irrelevant (the v7 managers did this).
- Never ship a goal that is satisfied at game start (there is a test for it; keep it).
- Never tune a number without running the balance table.
- The UI never recomputes an engine formula; every number comes from an engine payload.
- When the bible and the code disagree, the bible wins; when the bible is silent, pick the option that gives the player a decision with a non-obvious answer and write it into bible §16.

## 9. Exact state at handover

See the final section of this file (appended at the last commit) for the
commit hash, test count and the state of the Phase 2 engine work.

## 10. Suggested order of work for the next AI

1. Finish/verify anything listed as unverified in §9, then run §4 and push.
2. **Playtest by hand for ten years** (seed 42) and write down what felt flat. That list should drive priorities more than TASKS.md.
3. Phase 3 UI (rival portraits and taunts, succession ceremony, bankruptcy arc on the 3D map) on top of the engine systems that exist.
4. Phase 5 UI (prestige perks store, weekly challenge screen, scenario select) on top of the engine systems that exist.
5. Phase 6 store readiness (Capacitor, consent, billing, store assets, privacy policy) before any public release.

## 11. Prompt for the next AI (paste this)

> You are taking over **Property Empire v8**, an HTML5 real-estate dynasty
> tycoon for Google Play and the App Store, in this repo. Read
> `docs/HANDOVER.md`, then `docs/REDESIGN.md` (design bible; it is the law),
> `docs/TASKS.md` (phased plan with acceptance criteria) and `CLAUDE.md`
> (project rules). Verify the repo state first by running `node js/sim/tests.js`,
> `node js/sim/balance.js 20 5`, and the Playwright playthrough in
> `tools/playwright/play.js` against a local server on port 8790. Then work
> through `docs/TASKS.md` in the order given in `docs/HANDOVER.md` §10: for
> each task, implement, add tests in `js/sim/tests.js`, keep the balance table
> green, screenshot every screen you touch at 412×915 and 1280×800 and look at
> the images, bump the version in the three places listed in `CLAUDE.md`,
> commit with the task ID in the message, and push to `main`. Never add
> auto-advance, never add a mechanic that makes a player choice irrelevant,
> never ship a goal that is already satisfied at game start, never tune a
> number without the balance table, and never let the UI recompute an engine
> formula. When the bible is silent, choose the option that gives the player a
> decision with a non-obvious answer and write that decision into bible §16.
