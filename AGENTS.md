# AGENTS.md — instructions for any AI coding agent (Kimi Code, Codex, Cursor, Claude) working on Property Empire v8

Start here, in this order:
1. `docs/HANDOVER.md` — current state, how to run and verify, known gaps, the suggested order of work.
2. `docs/REDESIGN.md` — the design bible. It is the law. Section 13 is the engine contract, section 14 the balance targets, section 16 the decisions already made.
3. `docs/TASKS.md` — phased plan with acceptance criteria. Mark tasks `[x]` with the commit hash.
4. `docs/AUDIT.md` — why the previous game failed; do not reintroduce what it cut.

## Layout
- `js/engine/` — game engine (`PE.*` globals, load order in `ORDER.txt`). Pure, seeded, headless. All tunables in `js/engine/data.js` (`PE.Data.balance`).
- `js/sim/` — Node harness: `tests.js`, `balance.js`, `players.js`.
- `js/ui/` — player UI (`PEUI`). `css/tokens.css`, `css/components.css`, `css/app.css` design system. `assets/icons.svg` icon sprite (no emoji as icons).
- `js/city3d-engine.js`, `js/cities/*.js` — 3D city; `js/intro.js` + `css/splash.css` — start screen.
- `js/vendor/` — vendored libs (three.js). No CDN at runtime.
- `tools/playwright/` — browser verification scripts. `tools/3d-testpages/` — renderer test pages.
- `archive/` — old material, not deployed.

## Working mode
The owner's instruction: go full blast. Finish every phase in `docs/TASKS.md`, verify with the full balance table and real-UI playthroughs after every feature, look at every screenshot, and raise content, art and polish until it stands next to top-grossing tycoon games. See `docs/HANDOVER.md` §10. Full effort never means looser rules.

## Commands
```
node js/sim/tests.js            # must stay green
node js/sim/balance.js 20 5     # quick balance table; full: node js/sim/balance.js
python3 -m http.server 8790 --bind 127.0.0.1   # then open http://127.0.0.1:8790/index.html?seed=42
node tools/playwright/play.js   # 30-year scripted playthrough through the real UI (needs Playwright + Chromium; edit paths at top)
```

## Rules (non-negotiable)
- Never add auto-advance back. "Skip quiet years" (max 5, stops on any decision) is the only time skip.
- Never add a mechanic that makes a player choice irrelevant.
- Never ship a goal that is satisfied at game start (a test enforces this; keep it).
- Never tune a number without running the balance table and pasting it into the commit/PR.
- The UI never recomputes an engine formula; every number comes from an engine payload.
- Every public engine call returns `{ ok, message, ...payload }` and never throws. Randomness only through `PE.RNG`.
- Screenshot every screen you touch at 412×915 and 1280×800 and look at the images before pushing.
- When the bible and the code disagree, the bible wins; when the bible is silent, choose the option that gives the player a decision with a non-obvious answer and write it into bible §16.

## Releasing
Bump `PEUI.VERSION` (`js/ui/core.js`), `Game.version` (`js/engine/game.js`) and `CACHE_NAME` (`sw.js`); add new files to the `ASSETS` precache in `sw.js`; run the commands above; push to `main` (GitHub Pages deploys from `main`).

## Commit style
`type(scope): summary (TASK-ID)` e.g. `feat(engine): marriage alliances (P3.2)`. One task per commit where possible.
