# HANDOVER — Kimi Code CLI session on a fresh PC (home machine)

This document lets a fresh Kimi Code install on another Windows PC pick up Property
Empire v8 exactly where the office session left off, with the owner's stated priority:
**drastically improve the 3D city to high-end graphics with per-city uniqueness.**

Read order on the new machine:
1. This file (setup + mission).
2. `AGENTS.md` (project rules — binding).
3. `docs/HANDOVER.md` §10 (working mode: full blast) + §11 (v8.2 commit map).
4. `docs/REDESIGN.md` (design bible — the law; §13 engine contract, §16 decisions).
5. `docs/DESIGN-DIRECTION.md` (art direction — binding; §4 is the 3D law).

---

## 1. Machine setup (Windows PowerShell, run as Administrator)

```powershell
# ── 1. Prerequisites (winget ships with Windows 10/11) ──
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
winget install --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements

# Close and reopen the shell AFTER these so PATH refreshes, then:

# ── 2. Kimi Code CLI (official installer; needs Git Bash — installed with Git above) ──
irm https://code.kimi.com/kimi-code/install.ps1 | iex
kimi --version

# ── 3. Repo ──
mkdir ~\Projects -Force | Out-Null
cd ~\Projects
git clone https://github.com/johnagius/realestategame.git
cd realestategame

# ── 4. Dev dependencies (Playwright + axe-core) ──
npm ci
npx playwright install chromium

# ── 5. Repo-local git identity for the AI's commits ──
git config user.name "Kimi"
git config user.email "noreply@moonshot.ai"
```

Login once: run `kimi`, then `/login` (OAuth device flow — same Kimi account as anywhere
else; Remote Control from the phone works too: `kimi rc`).

## 2. Verify the install (all must pass before touching anything)

```bash
node js/sim/tests.js                 # expect 379+ passed, 0 failed
node js/sim/balance.js 20 5          # expect 10/10 targets + 4/4 family guards PASS
python -m http.server 8790 --bind 127.0.0.1   # serve (keep running)
node tools/playwright/axe.js         # expect 0 serious/critical violations
node tools/playwright/era-shots.js   # screenshots all 6 eras into tools/playwright/out/ui
```

Open `http://127.0.0.1:8790/index.html?seed=42` and play a few years by hand.
The Playwright harness is portable (`tools/playwright/config.js`, `PW_*` env overrides).

## 3. State at handover (office session, 2026-10-22)

Pushed to `origin/main` through commit `1643440` (`git log --oneline` for the map;
`docs/HANDOVER.md` §11 has the annotated version). Done and verified there:
Phase 2 UI note, era colour script, heraldic crests, P3.1 rival personalities,
P3.2 marriage/merger UI, P3.3 succession ceremony + charity, P3.5 bankruptcy
absorption + comeback track, 3D era landmarks + weather + day/night, Phase 5
retention UI, signature moments, photo mode, high-end CSS polish layer.

**In flight at the original push — NOW LANDED (commit `cf55a08`, 113 files):** the three
subagents' work was committed and pushed before the machine switch. State:
- **Phase 6 — COMPLETE** (14 tests): Capacitor 8 scaffold (`android-capacitor/`, `ios/`,
  `cap sync` green), save slots + `importSave`, l10n (`PE.T`, fr locale), analytics ring
  buffer, store assets in `store-assets/`, perf numbers in `docs/PERF.md`, monetization
  plumbing in `js/ads.js` + `docs/monetization.md` + `docs/privacy-policy.md`.
  Left for UI wiring: save-slot picker (start.js), settings import button + locale picker
  + privacy link (dynasty.js), rewarded placements in deals.js/year.js.
- **Phase 7 — COMPLETE** (27 tests): event packs (`PE.Events.registerPack/fetchPack` +
  `pack-demo.js`, off by default), leaderboard interface (`PE.LB`, self-hooks
  recordChallenge), share card with crest + motto, city pack registration.
- **Phase 4 — ENGINE ONLY, WIP (no tests, no UI yet)**: bonds, own bank, build-to-suit,
  city-trait drift effects are in `js/engine/{finance,property,turn,market,state,data}.js`,
  self-guarded. The new UI (portfolio bonds section, bank sheet, build-to-suit sheet) and
  the P4 test section still need building; wrap-list canonicalisation in game.js optional.
  Full balance run required after P4 UI lands (quick table is green).

Suite: 445 passed, 0 failed. eventsmc 0/43. If any of this is missing on the new machine,
`git log --oneline | head` should show `cf55a08`.

## 4. THE PRIORITY MISSION — "Project Skyline": high-end 3D, unique cities

The owner: current graphics "are not that great… this is high end graphics."
The 2D UI has had its polish pass; the 3D city is now the weak axis. Design
direction §4 is the law. Concretely:

### 4.1 Renderer quality (js/city3d-engine.js — ~1550 lines, plain object `City3D`)
- **Light & grade:** raise `renderer.toneMappingExposure` (~1.0→1.08); per-era,
  per-city sun colour temperature; deepen dusk contrast so lit windows read.
- **Grounding:** soft contact shadows — a radial-gradient dark plane under every
  building (canvas texture, registered in `_textures` for disposal; skip on
  `quality:'low'` or cap count). Buildings currently float; AO sells realism.
- **Emissive windows:** add a cheap glow pass — a second additive-blended plane
  per lit window is too heavy; instead raise emissive intensity + a subtle
  bloom-like sprite only on prime/player buildings at night.
- **Materials:** `MeshPhongMaterial` everywhere is flat-ish; add specular variation
  per era (Victorian brick matte, Digital glass shiny `shininess:120, specular`),
  and per-city wall tint variance via the existing `_skinColors` hook.
- **Sky & water:** per-city sky palettes and water colours (see matrix); thicker
  atmosphere at dawn (night 0.25→0.35 currently per era in js/ui/city.js `ERA_NIGHT`).
- **Weather already exists** (`setWeather` rain/fog, era-driven) — extend: snow for
  Toronto/Moscow-like climates in Digital winters is optional; smog tint for
  Boom-era Los Angeles is cheap via fog colour.

### 4.2 Per-city identity matrix (all 21 cities in js/cities/*.js)
Today every city shares one palette/trees/streetscape. Give each city a profile
data block (new `CITY_PROFILES` in each city def or a shared table) with:
- **palette**: sky[3], fog, ground, water, sun tint (extend the existing `ERAS`
  mechanism — city×era resolution, city wins ties).
- **vegetation**: tree builder variants — palms (Dubai, Miami, LA, Mumbai),
  conifers (Toronto), plane trees (London, Paris), acacias (Cape Town), cherry
  (Tokyo), sparse desert scrub; reuse the existing tree helper with a `kind` param.
- **streetscape**: lamp-post style (gaslight Victorian / neon Modern), street
  colour, harbour vs river water, landmark accent lighting colours.
- **weather bias**: London fog-prone, Dubai clear-hot (shimmer), Hong Kong/Tokyo
  Digital rain-neon, Sydney bright.
- **signature**: one unique set-piece per city beyond landmarks (e.g. Paris café
  awnings row, Venice-style waterfront arcade where water tiles meet lots,
  Hong Kong hillside backdrop silhouette plane, Dubai fountain animation).
- **Landmarks** keep their `landmarkEras` gating (already built) — add per-landmark
  accent lights for night.

### 4.3 Process (mandatory per DESIGN-DIRECTION §7)
1. Reference before pixels: write the 6 references to steal from (in the doc).
2. Three directions for ONE city (London) as renderer variants/screenshots; pick one
   with reasons; then roll the pattern across all cities.
3. Side-by-side critique: screenshot next to a top-tycoon reference; fix top 3 gaps.
4. Verify per city: `tools/3d-testpages/city.html` + a new `tools/playwright/city-tour.js`
   that screenshots every city at victorian/modern/digital × day/dusk at
   412×915 and 1280×800. LOOK at all 126 images.
5. **Performance budget (this machine has a GPU — measure it):** `getStats()` must
   stay ≤ ~250 draw calls, ≤ ~25k triangles, frameMs ≤ 16 on `quality:'high'` desktop;
   ≤ 33ms on `quality:'low'`. Record numbers in docs/PERF.md (handover §7's
   "unmeasured on real hardware" gap gets closed here).

### 4.4 Rules that do not bend
- The engine contract stands: every public call `{ok, message, ...}`, never throws;
  randomness only via `PE.RNG`; UI never recomputes engine math.
- Leak-free: everything new registers into `_textures` / `_disposeObj` / `destroy()`.
- No CDN, no new runtime deps; three.js stays the vendored r128.
- After any balance-affecting change: full `node js/sim/balance.js` (paste the table).
- Screenshot every screen touched at 412×915 and 1280×800 and LOOK at the images.

## 5. After Skyline: the release gate

1. Finish/verify Phase 4, 6, 7 (per §3) — mark TASKS.md `[x]` with hashes.
2. Full gates: tests green; FULL `node js/sim/balance.js` 10/10 (paste table);
   `node tools/playwright/play.js` + `phase2-flow.js` end 0 page/console errors;
   axe 0 violations.
3. Version bump in the three places: `PEUI.VERSION` (js/ui/core.js),
   `Game.version` (js/engine/game.js), `CACHE_NAME` + `ASSETS` (sw.js) → **v8.2**.
4. Push `main` (GitHub Pages deploys). Playtest with the owner; hand them three
   things to try.

## 6. Quick command card

```bash
node js/sim/tests.js            # engine suite — must stay green
node js/sim/balance.js 20 5     # quick balance; full: node js/sim/balance.js
node js/sim/eventsmc.js         # event Monte-Carlo (after touching events)
python -m http.server 8790 --bind 127.0.0.1
node tools/playwright/play.js   # 30-year scripted UI playthrough
node tools/playwright/axe.js    # accessibility pass
node tools/playwright/era-shots.js   # era palettes
kimi vis                        # session visualizer in the browser
```
