# Claude Code Instructions for Property Empire (v8)

Read `docs/REDESIGN.md` (design bible, the law), `docs/AUDIT.md` (why v7 failed) and `docs/TASKS.md` (phased plan) before changing anything. The master prompt is in the bible, section 15.

## Layout
- `js/engine/` — the game engine (`PE.*` namespace, load order in `ORDER.txt`). Pure, seeded, headless-testable. All rules and numbers live in `js/engine/data.js` (`PE.Data.balance`).
- `js/sim/` — Node harness: `tests.js` (unit tests), `balance.js` (bible §14 table), `players.js` (scripted players).
- `js/ui/` — player-facing UI (`PEUI`), `css/tokens.css` + `css/components.css` + `css/app.css` design system, `assets/icons.svg` sprite.
- `js/city3d-engine.js`, `js/cities/*.js` — 3D city renderer and layouts; `js/intro.js` + `css/splash.css` — hero start screen.
- `js/vendor/` — vendored runtime libraries (three.js). No CDN at runtime.
- `archive/` — old recordings, prototypes and the v4.5 snapshot. Not deployed.

## Rules
- Never add auto-advance back. Never add a mechanic that makes a player choice irrelevant. Never ship a goal that is satisfied at game start.
- Never tune a number without running `node js/sim/balance.js` and pasting the table into the PR. `node js/sim/tests.js` must stay green.
- UI never recomputes engine formulas; every number comes from an engine payload.
- Screenshot every screen you touch at 412×915 and 1280×800 with Playwright and look at the result before pushing.

## Version bumping
Bump with every push to `main`: `sw.js` (`CACHE_NAME`), `js/engine/game.js` (`Game.version`) and `PEUI.VERSION` in `js/ui/core.js` (shown on the start screen). Current: v8.2.

## Branching
The owner wants every completed step on `main`. Work on `claude/peaceful-bohr-aksms0`, then fast-forward `main` to it and push both.

## Deployment
- Push to `main` deploys to GitHub Pages; service worker is network-first.
- Save key is `pe_v8_save` in localStorage (versioned via `PE.Storage.SAVE_VERSION` + migrations).
