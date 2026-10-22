# HANDOVER — P7 live-ops + home-PC bootstrap + 3D quality directive

Date: 2026-10-26 · branch `main` · repo `https://github.com/johnagius/realestategame.git`

---

## 1. What this session shipped (TASKS Phase 7)

| File | Change |
|---|---|
| `js/engine/events.js` | **Additive only.** `PE.Events.registerPack(pack)` (validation against `PE.Events.FX_VOCABULARY`, which mirrors every `fx.*` key `applyFx` implements — unknown keys → `{ok:false}`), `PE.Events.fetchPack(url,{maxBytes,timeoutMs})` (never rejects; size/time guards; nothing calls it at runtime yet), `E.packs`/`E.PACK_PER_YEAR = 2`, and a pack branch in `rollYearly` that merges pack events into the yearly pool (kind `'pack'`, same cadence as built-ins, **max 2 pack events per game-year**, never beyond `maxEventsPerYear`). Built-in event resolution semantics untouched. |
| `js/engine/pack-demo.js` | **New.** "The Surveyor's Notebook": 5 era-aware events (1850–2030 compatible, `{prop}/{district}/{city}` placeholders), every choice set a proven MC-passing mirror of a built-in shape. Exposed as `PE.Events.DEMO_PACK`; **registers only** when meta flag `packsEnabled` or `?packs=1`. Off by default. |
| `js/engine/lb.js` | **New.** `PE.LB.submit(entry)` / `PE.LB.board(week)` — local-first weekly leaderboard (`localStorage pe_v8_lb`, top 100/week, 12 newest weeks, in-memory fallback for Node). Self-contained integration: wraps `PE.Game.recordChallenge` at load (idempotent, one submission per finished challenge run). Backend-swap contract: replace the two functions, keep names/signatures/return shapes; `PE.LB.hook(fn)` observes submissions. |
| `js/engine/cities.js` | **Additive only.** `PE.Cities.registerPack(def)` — validates the engine-half of a city pack (id/name/country/trait ∈ `D.cityTraits`/tier 0–3/availableFrom 1800–2100/economy numbers/≥4 districts with mult 0.2–3 and trend −1..2), then appends to `D.cities`/`D.cityById`. Effective from the next `newGame`. |
| `js/ui/share.js` | Share card is now **async** (`PEUI.shareCard(r)` → `Promise<canvas>`): draws the real family crest (`PEUI.crest` → XMLSerializer → data URL → `drawImage`) top-centre, the house motto in italic serif under it, era name, dynasty stats (net worth / rank / generation); PNG export unchanged. Falls back to the old disc-letter crest on any image failure. Only caller (`openShareCard`) updated. |
| `js/sim/tests.js` | **Appended before the Summary marker** (no existing test touched): a `loadWith()` harness for out-of-ORDER engine files + P7 blocks — fx-vocabulary two-way sync, registerPack accept/reject matrix, 180-year pool/cap drive through `rollYearly` + real resolve, fetchPack guards (child process, mock fetch), LB submit/rank/sort/top-100/week-pruning/persistence + recordChallenge wrapper incl. no-double-submit, city-pack validation matrix + state init, and the events-MC check over every demo-pack event. |
| `docs/live-ops.md` | **New.** Pack JSON format + field table, runtime behaviour, submission/review checklist (pillar 1, era voice, the exact MC command), ship-without-app-update flow via `fetchPack`, the LB backend-swap contract, and the city-pack format (engine def + `CityDef_*` 3D def) with a loader sketch. |
| `tools/playwright/p7-shots.js` | **New.** Opens the share card in-game at 412×915 and 1280×800, screenshots the sheet, validates the exported PNG from its IHDR header (1080×1080, sane size) and via the download event. |

### Verification (all run on this machine; rerun on the home PC with the commands below)

- `node --check` on every touched JS file — clean.
- `node js/sim/eventsmc.js` — **0 of 43 events fail** (built-ins unaffected).
- `node js/sim/balance.js 20 5` — **10/10 targets pass; 4/4 family guards pass**
  (nw30 17.0× competent / 3.3× naive, bk 6.3/1.3 per 100, rank #3, 100% decision years).
- Same balance harness **with the demo pack force-registered** — **10/10 §14 targets pass**,
  but the Vanderbilt *family guard* dips under its 6× floor (6.0×, 3/4 guards). Packs are
  off by default, so stock balance is unaffected; if ops enables packs, the demo pack's
  cadence should be re-tuned first (options: half-rate pack tries in `rollYearly`,
  gentler demo-pack EVs, or a bigger seed run to confirm it's 20-seed noise — stock
  Vanderbilt at the same sample size is 10.5×). This belongs on the pack-review
  checklist either way.
- `node tools/playwright/p7-shots.js` — share card sheet at 412×915 and 1280×800;
  exported PNG verified 1080×1080 from its IHDR header (248,156 bytes) and through the
  real download event. Crest + italic motto confirmed on the rendered card.
- `node js/sim/tests.js` — **444 passed, 1 failed**; the single failure is pre-existing
  and belongs to another workstream (see §4).

### Integration points for whoever commits this

1. **index.html — two script tags** (both `defer`, inserted **after** `js/engine/game.js?v=8.0`, line ~88):
   ```html
   <script src="js/engine/lb.js?v=8.0" defer></script>
   <script src="js/engine/pack-demo.js?v=8.0" defer></script>
   ```
2. **`recordChallenge` hook — already done** from inside lb.js (the wrapper installs itself at load). No game.js line needed. If you prefer explicit wiring, `PE.LB.hook(fn)` is the observer point.
3. **Challenge-lobby board (extras.js, not mine)** — one-line integration when wanted:
   `PE.LB.board().board` → rows `{rank, name, score, year, gens}`.
4. **Do not add lb.js/pack-demo.js to `js/engine/ORDER.txt`** — test 1 asserts 14 files with game.js last; the sim harness loads them via `loadWith` when needed.
5. Releasing: bump `PEUI.VERSION`, `Game.version`, `CACHE_NAME`, precache list (AGENTS.md → Releasing).

---

## 2. Home-PC bootstrap (PowerShell, full script)

Prereqs: Windows 10/11, any admin rights for the first block only.

```powershell
# ============================================================
# Property Empire v8 — home PC setup (run in Windows PowerShell 5.1+ or pwsh)
# ============================================================

# --- 1. Prereqs (admin) — safe to skip if already installed; re-run check below ---
# Install Git and Node LTS via winget (open an ELEVATED shell for this block):
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
# Python is optional (only used for the local static server); install if missing:
winget install --id Python.Python.3.12 -e --source winget
# Refresh PATH after installing:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# --- 2. Sanity check ---
git --version; node --version; npm --version; python --version

# --- 3. Clone (or pull) the repo ---
$dev = "$env:USERPROFILE\Projects"          # change to taste
New-Item -ItemType Directory -Force $dev | Out-Null
if (Test-Path "$dev\realestategame\.git") {
  cd "$dev\realestategame"
  git pull origin main                       # IMPORTANT: see note below about uncommitted work
} else {
  cd $dev
  git clone https://github.com/johnagius/realestategame.git
  cd realestategame
}
git log --oneline -3

# --- 4. Dev tooling (Playwright + axe for the verification scripts) ---
npm ci
npx playwright install chromium

# --- 5. Verify the engine (no browser needed) ---
node js/sim/tests.js
node js/sim/eventsmc.js
node js/sim/balance.js 20 5

# --- 6. Run the game ---
Start-Process python -ArgumentList "-m","http.server","8790","--bind","127.0.0.1" -WorkingDirectory (Get-Location)
Start-Process "http://127.0.0.1:8790/index.html?seed=42"

# --- 7. Browser verification (share card etc.; server must be running) ---
node tools/playwright/p7-shots.js            # writes tools/playwright/out/ui/p7-*.png
```

**Notes**

- **Commit before cloning/pulling on the other PC.** This working copy has uncommitted
  work from several parallel agents; `git clone`/`git pull` only transfers commits.
  On THIS machine: review `git status`, let each agent's owner commit, `git push origin main`.
  GitHub Pages deploys from `main`, so pushing also updates the live game.
- If the repo is private on the new PC, use a PAT: `git clone https://<TOKEN>@github.com/johnagius/realestategame.git`.
- The Playwright scripts assume the game is served at `http://127.0.0.1:8790` (env `PW_URL` overrides).
- No build step — plain `<script>` tags; Node is only for the sim harness and Playwright.

---

## 3. DIRECTIVE — drastically raise the bar on the 3D city (top priority next)

Owner instruction: push the city view from "stylised diorama" to **top-tier tycoon-game
visuals**, and make **every city unmistakably itself**. Current state: vendored
**three.js r128** (`js/vendor/three.min.js`, no CDN allowed), one shared renderer in
`js/city3d-engine.js` (1614 lines: `WebGLRenderer` + ACES tone mapping + PCFSoft
shadows, per-era sky/fog palettes, weather tint, `low` tier at pixelRatio ≤ 1.5 with
shadows off), and 21 per-city `js/cities/*.js` `CityDef_*` globals (layout grid of
`RD/W/CP` + building letters from `City3D.BLDG_TYPES` (`HO ST AP PH TH VI MN CM WR SK`),
authored landmark `THREE.Group` factories, `landmarkEras`/`landmarkGround`). Constraint:
**plain scripts, no modules/build** — upgrades must stay vendored-file compatible.

Concrete upgrade axes (in priority order; each independently shippable, each verified
with the existing `tools/3d-testpages` + `tools/playwright/p3d-shots.js` + per-era shots):

1. **Per-city art direction file.** Give every city a palette (wall/roof/trim/accent
   colours per era), signature materials (London soot-washed brick + slate, Paris zinc
   roofs + limestone, Dubai glass+steel, Hong Kong neon), and a landmark *set* that no
   other city has. Landmarks already exist per city — multiply their count and detail,
   and let `landmarkEras` drive a visibly evolving skyline across the 6 eras.
2. **Post-processing pass.** three r128 supports `EffectComposer`/UnrealBloom/
   SSAO in examples — vendor the needed example files (no CDN), add a quality tier:
   bloom + SSAO + vignette on high, off on low. Biggest single "high-end" win.
3. **Street-level richness.** Instanced meshes (`InstancedMesh`, r128 has it) for
   trees, lamps, benches, carts/cars per era, scaffolding, awnings, window dressing
   (lit windows at dusk). Cheap on draw calls, huge on perceived density.
4. **Water, sky and light.** Animated water shader for `W` tiles (Thames, Seine,
   Victoria Harbour), gradient sky dome per era (palettes exist — promote them to a
   proper sky + sun/moon), soft shadows tuned per era mood, optional rain/snow
   particle layer (weather state already exists).
5. **Life and motion.** Era-appropriate ambient motion: horse-drawn → motor traffic
   on `RD`, ships on water, construction cranes while a district builds, flags/banners.
6. **Photo mode** already exists (commit dba5650) — extend it with era/weather controls
   for marketing shots.
7. **Perf budget per device tier** (the `low` flag path already exists): cap pixel
   ratio, shadow map size, post FX and instance counts; measure with the Playwright
   harness at 412×915 (mid-range Android target) — keep 30 fps.

Rules that still bind: no modules/build, no CDN (vendor everything into `js/vendor/`),
the 3D layer must stay a pure view (never recompute engine numbers), screenshot every
change at 412×915 and 1280×800 and *look* at the images, and keep `tools/3d-testpages`
green. Suggested task IDs: P8.1 palette/materials, P8.2 post FX, P8.3 street props,
P8.4 water/sky/light, P8.5 motion.

---

## 4. Known issues / caveats

- **Pre-existing test failure, not from P7:** `≥ 8 perks costing 1–5 points` fails
  because another workstream added perk `own_bank` at cost 6 (`js/engine/data.js`,
  uncommitted). Either that agent adjusts the cost or the test; P7 code is unaffected.
- `git status` shows files owned by other parallel agents (`data.js`, `state.js`,
  `storage.js`, `ads.js`, `l10n.js`, monetization/capacitor docs). Review and commit
  per-owner; do not sweep them into the P7 commit.
- `PEUI.shareCard` is now promise-based; the only in-repo caller was updated. Any
  out-of-tree caller must `await` it.
- `PE.Events.fetchPack` is intentionally uncalled at runtime; ops wires it behind
  their own gate (see `docs/live-ops.md` §1.3).
