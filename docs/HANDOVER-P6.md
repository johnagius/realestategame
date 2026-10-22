# HANDOVER — Phase 6 state + home-PC setup + the 3D city directive

Written 2026-10-22 by the P6 subagent. Read `docs/HANDOVER.md` first (project
bible intro), then this file for where Phase 6 stands and what the owner wants
next.

---

## 1. Set up this project (and the agent) on the home PC — one PowerShell

Everything needed is in **`docs/setup-home-pc.ps1`** (committed with this
handover). On the home PC, open PowerShell and either:

```powershell
# Option A — save the file from the repo, then:
powershell -ExecutionPolicy Bypass -File .\setup-home-pc.ps1

# Option B — pipe it straight from GitHub (only works once this file is on main):
irm https://raw.githubusercontent.com/johnagius/realestategame/main/docs/setup-home-pc.ps1 | iex
```

The script installs, in order:

1. **Git for Windows** — required *before* Kimi Code: the CLI runs its shell
   commands through Git Bash. Custom install location → set `KIMI_SHELL_PATH`
   to your `bash.exe`.
2. **Node.js LTS** — runs the game tooling/tests (Kimi Code itself ships its
   own runtime via the official installer; the npm fallback
   `npm install -g @moonshot-ai/kimi-code` needs Node ≥ 22.19.0).
3. **Python 3.12** — for `python -m http.server 8790` (playtesting).
4. **Kimi Code CLI** — official installer `irm https://code.kimi.com/kimi-code/install.ps1 | iex`
   (npm fallback included). Docs: <https://www.kimi.com/code/docs/en/kimi-code-cli/guides/getting-started.html>.
5. **The repo** — clone to `%USERPROFILE%\Projects\realestategame` or `git pull`
   if already there (edit `$ProjectDir` at the top of the script to move it).
6. **Dependencies** — `npm install` (Playwright, axe-core, Capacitor 8) +
   `npx playwright install chromium`.
7. **Verification** — runs `node js/sim/tests.js` and the quick balance table so
   the machine is proven green before any work starts.

Then: `kimi` → `/login` (OAuth device flow or API key). **Agent sessions live
in `~/.kimi-code` on one machine** — this handover file is the bridge to a fresh
session on the home PC; paste its path first.

## 2. Where Phase 6 stands (all verified 2026-10-22)

| Task | State | Evidence |
|---|---|---|
| P6.1 Capacitor scaffold | **Done** | `capacitor.config.json` (appId `com.sandstone.propertyempire`, webDir `capacitor-web`, android path `android-capacitor` — the legacy v7 wrapper keeps `android/`), platforms generated: `npx cap sync android` and `cap copy ios` both succeed; `npx cap doctor android` all green. iOS: generated on Windows; `pod install`/builds need a Mac (see `android/README.md` §iOS). No builds attempted (no SDKs). `capacitor-web/` is a generated staging dir — regenerate per README, don't hand-edit. |
| P6.2 Monetization | **Done (JS+docs)** | `js/ads.js` rewritten: `requestRemoveAds()` (web = explanatory sheet with privacy link; native = billing bridge), `rewarded(placement, onReward)` with 4 placements + web fallback, interstitial surface kept for `year.js`. `docs/monetization.md` (placements, caps — caps owned/unchanged in `js/ui/year.js`), `docs/privacy-policy.md`. |
| P6.3 Save slots + import | **Done (engine+tests)** | `js/engine/storage.js`: 3 slots (`pe_v8_save_1/2/3`), legacy-key migration, `listSaves()`, `importSave(json, slot)`; default (no slot) = slot 1, fully back-compat. |
| P6.4 Performance | **Done (harness+doc)** | `tools/playwright/perf.js`, results in `docs/PERF.md`: first paint 0.58 s, heap 1.0×/60 yrs, 0 errors; frameMs mean 44 is a SwiftShader software-GL artefact — **re-measure on the home PC's GPU**. |
| P6.5 l10n scaffolding | **Done (engine+tests+doc)** | `js/engine/l10n.js`: `PE.T`, `PE.setLocale` (`pe_v8_locale`), fr dictionary (40 keys), `PE.L10N.apply([data-t])`, `PEUI.t`. **Needs the integrator to add the script tag after `data.js` in `index.html`** (one line, listed in `docs/l10n.md`). |
| P6.6 Store assets | **Done (generated+viewed)** | `tools/make-store-assets.js` → `store-assets/`: icon 512/192, feature graphic 1024×500, 4 phone frames 1290×2796. A second layout-iteration was declined by the owner mid-flight — the frames are solid v1; polish later if desired. |
| P6.7 Analytics scaffolding | **Done (engine+tests+doc)** | `PE.Analytics` in `js/engine/storage.js`: local ring buffer (cap 200), `onFlush` hook, taxonomy + retention defs in `docs/analytics.md`. Web build tracks nothing. |

**Suite status:** the P6 test blocks (slots/import, l10n, analytics — 14 new
assertions) are green. Two reds are a *concurrent* agent's in-flight work, not
P6: `own_bank` perk costs 6 breaking the 1–5 assertion, and P7 live-ops tests
crash while their engine edits land. Re-run `node js/sim/tests.js` on the home
PC after their work settles.

**Wiring owed by the integrator (engine APIs ready):**
`index.html` l10n script tag · `Game.save(slot?)/load(slot?)/hasSave(slot?)/deleteSave(slot?)`
pass-through to `PE.Storage` (trivial, keeps no-slot = slot 1) · start-screen
slot picker via `PE.Storage.listSaves()` + import via `PE.Storage.importSave` ·
rewarded placements into `deals.js`/`year.js` · privacy-policy + locale picker
in the settings sheet (`dynasty.js`) · rewarded bridge methods when the AdMob
plugin lands.

---

## 3. THE NEXT MISSION — 3D city, drastically higher-end, per-city unique

**Owner directive (2026-10-22), top priority on the home PC:** *drastically
improve the 3D section of the city — much higher-end 3D graphics with
uniqueness to each city.*

Why this is right: design is the project's weak axis (`HANDOVER.md` §10), the
city screen is the signature surface the whole loop feeds (every purchase
shows up on it), and the audit already named its sins: era-static landmarks
(The Shard rises in 1850 — `docs/audit/03-engineering.md` §7/`HANDOVER.md` §7),
one palette for twenty cities, and unmeasured real-device performance. The art
direction is binding: *a Victorian ledger that grows into a glass skyline*
(`docs/DESIGN-DIRECTION.md`) — the city must tell that story in one glance.

### Current renderer (know before touching)

`js/city3d-engine.js` + `js/cities/*.js`, vendored **three.js r128**
(`js/vendor/three.min.js`, no CDN, no build step, plain `<script>` globals).
Measured on seed 42: **~190 draw calls, ~10.6 k triangles**, quality modes
`auto/low/high`, `City3D.getStats()` returns `{frameMs, calls, triangles,
quality}`, warm frame 9.5–14 ms. Ownership: these files belong to the renderer
workstream — coordinate with the parent before editing.

### Workstream A — renderer core (high-end look)

1. **Lighting & colour:** ACES tone mapping + sRGB output; per-era light rig
   (gaslight-amber Victorian → hard midday modern → neon-digital night);
   `scene.fog` for aerial depth; PMREM environment generated from a small
   procedural sky gradient (no external assets); soft shadows 2048² desktop /
   1024² mobile, off on `low`.
2. **Materials:** flat Lambert → `MeshStandardMaterial` with per-era palettes;
   glass towers with env reflections; **emissive windows at night**; roughness
   variation by district age (Mayfair stone vs Shoreditch brick).
3. **Sky & weather:** gradient skydome per era, day/night cycle (backlog item),
   drifting cloud layer, rain/snow states (backlog); stars after dusk.
4. **Post (desktop only):** subtle `UnrealBloomPass` + vignette — vendor the
   r128 example scripts into `js/vendor/`; strictly off on `quality:'low'`.
5. **Life:** chimney smoke (Victorian), rotating cranes, water shimmer on
   rivers/harbour, traffic/boats/birds as cheap sprites. **No per-frame
   allocations** (the audit flagged this pattern) — pool and reuse.

### Workstream B — twenty unique cities

1. **Identity card per city** in `js/cities/*.js`: palette, skyline signature
   (rooflines, materials, height distribution), vegetation (plane trees Paris,
   palms Miami/Dubai), water, street furniture, signature props (red buses
   London, trams Hong Kong, neon Shanghai, townhouses Boston-ish Toronto...).
2. **Era-correct landmarks:** replace the static landmark list with
   era-ranged sets per city (Spire 1850 → Gherkin 2000 for London; wooden
   water tanks → supertalls for New York). Fixes the audit finding directly.
   Build a small parametric landmark kit (spire, dome, pagoda, art-deco crown,
   twisted tower, clock tower) — procedural low-poly meshes in code, matching
   the current hand-built style.
3. **District variety inside a city** — the existing district data gets visual
   signatures (docks/warehouses, terraces, mansion blocks, office core).

### Workstream C — verification discipline (the bar)

- Budgets hold: ~< 250 calls / < 20 k tris on `high`, < 150 calls on `low`,
  60 fps city view on `low` on a mid-range phone (TASKS P6.4). The gate is
  `node tools/playwright/perf.js` on the home PC **GPU** — record before/after
  in `docs/PERF.md`.
- Screenshot **every city** (and both eras of at least London/New York) at
  412×915 and 1280×800; look at the images; nothing ships that looks like a
  tech demo next to top-grossing tycoons.
- `node js/sim/tests.js` green (engine untouched — if a city data change
  affects the engine contract, tests tell you), `node tools/playwright/play.js`
  0 errors, axe 0 violations (mind contrast with the new night scenes).
- The UI never recomputes engine formulas; all randomness through `PE.RNG`;
  renderer stays leak-free (`destroy()` thorough — test page switches).

### Suggested order

1. A (lighting/materials/sky) on London only → screenshot critique vs the
   design direction. 2. B for London (era landmarks + districts). 3. Roll B
   across the other 19 cities in batches of 5, screenshots each. 4. Post + life
   on `high`. 5. Perf pass on device + `PERF.md` update. Keep `low` honest
   throughout — the phone experience is the product.

Optional, decide early: upgrading three.js past r128 (modern examples are ESM
only; would need vendoring a bundling step — heavy). **Recommendation: stay on
r128**; it is sufficient for A–D.

## 4. Rules that still bind (bible + `AGENTS.md`)

No auto-advance; no player-irrelevant mechanics; no pre-satisfied goals; no
number tuning without the balance table pasted into the commit; every UI
number from an engine payload; engine calls never throw; screenshots at
412×915 + 1280×800 for every touched screen; version bumps in the three
release places + `sw.js` precache for new files. Full release checklist in
`docs/HANDOVER.md` §5.
