# Audit part 3 — Engineering, performance and store readiness

Headline numbers: ~17.9K lines of JS (`js/*.js` 15,220 + `js/cities/*.js` 1,585), 2,813 lines CSS, 1,104 lines Android. No build step, no modules, no CI, 32 `<script>` tags. Working tree 26 MB, of which 23 MB is two committed recording JSON files.

## 1. Architecture

**Globals.** Six singletons wired by load order in `index.html:304-337`: `GameData`, `GameEngine`, `GameUI`, `App`, `AdManager`, `City3D`, `GameGraphics`, `Mosaic`, `GameAudio`, `IntroScene`, `ImageLoader`, plus 20 `CityDef_*` globals. Zero `class`, zero ES modules.

**Coupling.** `ui.js` → `GameEngine.` 116×, `GameData.` 137×, `App.` 55×. `app.js` → `GameUI.` 195×, `GameEngine.` 78×. `ads.js` reaches into `GameEngine.state.monthsSinceAd` and `GameUI.autoTimer`. The engine is nearly UI-free (only `document` use is the download trick at `game.js:64-69`); that is the one clean boundary and why `simulate.js` works.

**Business logic leaking into UI:**
- Investment-score formula exists only in ui.js, three times (`ui.js:231-232`, `358-361`, `2226-2228`). Nothing in game.js computes it.
- Portfolio synergy recomputed in `ui.js:1352-1356`; savings interest hard-codes 2%/12 at `ui.js:1256` although `state.savingsRate` exists; loan remaining-interest at `ui.js:2033`; purchase tax at `ui.js:764`.
- Purchase cost duplicated in `simulate.js:74-76`, `115-117` vs `game.js:397-405`.
- UI mutates state directly via inline handlers (`ui.js:1311`, `app.js:303`, `1166`, `409`, `ui.js:2407`).

**File sizes.** game.js 4,563 / 205 KB; graphics.js 3,494 / 183 KB (hand-written SVG builders); ui.js 2,433 / 141 KB; data.js 1,356; app.js 1,174; city3d-engine.js 817; simulate.js 540.

**10 longest functions:**

| Lines | Location | Function |
|---|---|---|
| 631 | `game.js:1050-1680` | `advanceMonth` |
| 365 | `ui.js:1335-1699` | `showMonthResults` |
| 267 | `graphics.js:3144-3410` | `propertyThumb` |
| 248 | `game.js:4305-4552` | `resolveDecision` |
| 233 | `game.js:4011-4243` | `generateDecision` |
| 232 | `intro.js:10-241` | `start` |
| 219 | `ui.js:1903-2121` | `renderBank` |
| 215 | `graphics.js:1553-1767` | `_city_london` |
| 215 | `graphics.js:1836-2050` | `_city_new_york` |
| 206 | `graphics.js:1345-1550` | `_city_paris` |

**Dead / duplicate code:**
- `js/imageloader.js` (143 lines) never referenced: dead module shipped to every player.
- Unreferenced: `getTraitBonus`, `getUnlockedCities`, `startTutorial`, `City3D.makeLabel`, `Mosaic.lonLatToPercent`.
- `graphics.js _city_*` (20 SVG city scenes, ~2,000 lines) is a second renderer for the city screen used only when 3D is unavailable. Two renderers for one screen.
- `chatgpt realestate/` is a stale v4.5 snapshot (9,679 lines, one commit, never touched since), served publicly by GitHub Pages as a second playable copy.
- `world_hi_res_v4_palette.html` (3.5 MB) is a standalone map prototype referenced by nothing, served by Pages.

**ES5/ES6 mix.** game.js `var` 453 / `const` 217 / `let` 20 / arrows 122; ui.js `var` 480 / `const` 6. `simulate.js:25-26` regex-rewrites top-level `const`→`var` to load the engine, a fragile hack.

**IDs.** `loan_`+`Date.now()` (`game.js:2142`) and `pbank_`+`Date.now()` (`:2432`) have no random component and collide within a millisecond. No seeded RNG anywhere, so no replay or determinism.

## 2. Save system

- Single key `propertyEmpire_save` (`game.js:328`) + `propertyEmpire_log` (`:331`, written every 12th month) + `pe_ads_removed`.
- **Size.** Initial state 144 KB, of which 132 KB is `marketProperties` for all 20 cities including 19 locked ones. Growth: 172 KB @1y, 195 KB @10y, 213 KB @50y, 245 KB @100y; a 250-property save is ~300 KB+. Uncapped arrays: `disasterHistory`, `mergerHistory`, `prestigeHistory`.
- **The recording log is the real problem.** `recording: true` is hard-coded (`game.js:9`); every player accumulates up to 50,000 entries (~6–9 MB JSON). Every 12th month `save()` stringifies that whole array into localStorage. Chrome/WebView quota is ~5M chars per origin, so this throws `QuotaExceededError` on long games, caught and only logged (`:333`). Memory: ~50K live objects (~15–20 MB) per player for a debug feature.
- **Frequency.** 48 `save()` call sites in game.js, plus `app.js:527` saves again after every month (two full serialisations per tick), plus `ui.js:2416` on speed change. Measured 1,365 saves per 1,200 months headless.
- **No versioning.** No `state.version`; `exportRecording` hard-codes `'v5.3'`. Migration is 30 ad-hoc `if (!state.x)` lines in `loadGame`; `if (!reputation) reputation = 50` resets a legitimately-zero reputation.
- **Static data mutated at runtime and not saved:** `city.inflationRate`, `city.taxRate`, `city.growthRate` live on `GameData.cities` (`game.js:1384`, `1858`, `1876`), so every reload silently resets the economy.
- No cloud save, no export/import. `hasSavedGame()` touches localStorage without try/catch: in Safari with storage blocked, `App.init` throws before `bindEvents` and the splash buttons are dead.

## 3. Performance

- **Engine.** 6 loops over cities and ~10 over properties per month; linear `GameData.cities.find` inside per-property loops at 27 sites. Measured 1.1–2.9 ms/month in Node; cheap. The hidden cost is `_log`: every entry calls `getNetWorth()` (`game.js:15`); the 1851 recording has ~733 entries/month for 250 properties, i.e. ~180K reductions per month just for logging.
- **UI.** Current screen re-rendered via innerHTML each tick (`app.js:517-523`; 41 innerHTML sites). When the market count changes, `City3D.renderCity` → `destroy()` → `initScene()` creates a new canvas and `WebGLRenderer` (`city3d-engine.js:380-397`) instead of updating meshes.
- **Auto-advance** 4000/2000/800 ms (`ui.js:2408`), no `visibilitychange` handling.
- **3D.** Every mesh casts and receives shadows, PCFSoft 1024², antialias, DPR up to 2, 1,200-point starfield; per frame `_grid.flat()` allocation, `Math.random()`, new `Box3/Vector3`. `destroy()` is reasonably thorough.
- **CDN dependence.** d3, topojson, three r128 (2021) from cdnjs; world-atlas JSON from jsdelivr at runtime; Google Fonts. `sw.js:63` bails on cross-origin, so none is cached: offline web has no 3D and no map. Android loads `file:///android_asset/web/index.html` where the service worker cannot register, so every launch needs network. Precache also misses `js/ads.js` and `assets/*.svg`.
- **Version string mismatch.** index.html v7.3; sw.js v7.3; `css/style.css?v=7.2`; CLAUDE.md v5.6; DEBUGGING.md v5.2; `exportRecording` v5.3; Android `versionName "7.3"` / `versionCode 1`.

## 4. Android wrapper

- **WebView** (`MainActivity.java:60-81`): `setAllowFileAccess(true)` with `file://` loading (should be `WebViewAssetLoader`; `androidx.webkit` is already a dependency), no `onReceivedError`/`onRenderProcessGone`, no `webView.destroy()`, deprecated fullscreen flags, `extends Activity`, back button never exits, portrait-locked.
- **AdMob**: initialised on the main thread in `onCreate`; real IDs committed; **no UMP consent flow** (required for EEA/UK since Jan 2024).
- **Billing**: ack-before-grant correct in `onPurchasesUpdated` (`NativeBillingManager.java:245-263`), but `verifyPurchaseWithGoogle` (`:128-155`) grants on any PURCHASED state without acknowledging, so a failed first ack is refunded after 3 days. `BASE64_PUBLIC_KEY = "PLACEHOLDER"` makes signature verification return true for everything. `purchaseRemoveAds` returns silently when the product is not loaded, no failure callback to JS. Billing 7.0.0 will be rejected under the 2026 library-version policy.
- **IntegrityChecker**: `RELEASE_SIGNATURE_SHA256 = "PLACEHOLDER"`, so only `checkDebuggable` runs. Both checks run inside the APK the attacker repackages: theatre. The JS layer defeats the native gate anyway: `ads.js:37` trusts `localStorage.pe_ads_removed` first and only ever sets it true.
- **Play policy risks**: interstitial every 5 game months = every 20 s / 10 s / 4 s of auto-play. `targetSdk 34` (Play requires 35+). `allowBackup="true"` exposes the save. `play-services-ads 23.1.0` is old (16 KB page-size compliance needs a current SDK). `AD_ID` must be declared in Data safety.
- **iOS**: nothing exists. Needs a WKWebView host (Capacitor), Mobile Ads iOS SDK + UMP + ATT, StoreKit 2 with mandatory restore flow, 1024 icon, App Privacy labels, and a replacement for the Android-only `PropertyEmpireBridge`. Apple 4.2 "minimum functionality" is passable for a web game only if fully offline-capable.

## 5. Error handling

- `advanceMonth` wraps 620 lines in one try/catch; month/year are incremented and rent/market changes applied before any throw; on error it returns an empty result so the UI shows a quiet month and the partial state is persisted by the next save. Silent corruption by design.
- No `window.onerror`/`unhandledrejection`, no crash reporter, no analytics.
- `[ENGINE] advanceMonth START/END` logged on every tick in production.
- Two recording JSON files (10 MB and 13 MB) committed at repo root and served by Pages; each covers only the last ~60 months.

## 6. Testing

`node js/simulate.js`: 16 suites, 103 assertions, 2.1 s, 102 pass / 1 fail (the long-run growth assertion). No seed, so flaky; the opening-objective suite passes if any of 3 runs win (`:214`). Tautological asserts (`types['studio'] || true`, `disasters >= 0`). Stale deadline table at `:211` is the inverse of the engine. `save` is stubbed so save/load is never exercised. No UI, ads, billing, decision, dynasty, manager or prestige tests; no CI.

## 7. Security / abuse

- The whole game is one localStorage key; editing cash is a one-liner. Irrelevant today, fatal the day a leaderboard goes online.
- Ad-removal gate is `localStorage.pe_ads_removed`, and the web fallback grants it via `confirm()` for free (`ads.js:198-203`).
- 41 innerHTML sites with 86 inline `onclick=` handlers; low XSS exposure today, but the pattern will bite once user text (family name) is rendered.

## 8. Store readiness checklist

| Item | Status |
|---|---|
| Icons | `manifest.json` icon is an emoji data-URI (invalid for install prompts/Play); no 512 PNG, feature graphic, screenshots, iOS 1024 icon |
| Splash | Android has no SplashScreen theme: white flash while WebView + CDN load |
| Privacy policy | None (required with AdMob/AD_ID) |
| Age rating / Data safety / App Privacy | Not prepared |
| GDPR consent | No UMP SDK; no ATT on iOS |
| Offline | Web: libs/fonts/map data uncached; Android: CDN at runtime |
| Crash reporting / analytics | None |
| Localisation | None; ~900 English literals; currency hard-coded `€` with `en-US` formatting |
| Landscape / tablet | Portrait-locked; 3 media queries ≥768px |
| Accessibility | 0 aria/role, `user-scalable=no`, no reduced-motion |

## Prioritised engineering task list

| # | Task | Effort |
|---|---|---|
| 1 | Remove the 23 MB recordings, the map prototype and `chatgpt realestate/` from the deployable tree; gitignore recordings | S |
| 2 | Make recording opt-in, cap at ~5K entries, stop the 12-month log write | S |
| 3 | Fix ad cadence (wall-clock gate ≥3 min, natural breaks only); add UMP consent and ATT | M |
| 4 | Billing: real RSA key or Play Integrity; acknowledge in restore path; failure callbacks; native state authoritative | M |
| 5 | Android platform bump: targetSdk 35/36, Billing 8.x, latest ads SDK, edge-to-edge, `WebViewAssetLoader`, `allowBackup=false`, error handlers, `webView.destroy()` | S |
| 6 | Vendor three/d3/topojson/world-atlas/fonts; precache them; delete CDN tags | M |
| 7 | Save versioning + ordered migrations; persist runtime city mutations; export/import | M |
| 8 | Save throttling: remove the double save, debounce, IndexedDB with fallback, guard `hasSavedGame` | M |
| 9 | Error handling: snapshot/restore around the turn, `window.onerror`, crash reporting, strip console noise | M |
| 10 | Single `VERSION` constant stamped by a build script | S |
| 11 | Split the 631-line turn function into phases | M |
| 12 | Move UI-only formulas into the engine; delete copies | M |
| 13 | Delete dead code; keep one city renderer | S |
| 14 | Test hardening: seeded RNG, fix stale tables, real asserts, save fixtures, CI | M |
| 15 | Engine perf: city index, net worth once per month for logs, collision-free IDs | S |
| 16 | 3D perf: in-place updates, DPR cap 1.5, 512² shadows, no per-frame allocations, pause on hidden | M |
| 17 | Store assets: PNG/maskable icons, feature graphic, screenshots, Android 12 SplashScreen, iOS icon | S |
| 18 | Privacy policy, Data safety, App Privacy, IARC | M |
| 19 | Capacitor for both platforms with a `Platform` adapter (ads, IAP, restore); retire `PropertyEmpireBridge` | L |
| 20 | i18n dictionary + `Intl.NumberFormat`; landscape/tablet + accessibility pass | L |

## Recommended tech direction

Keep vanilla JS; do not migrate to Phaser or a game engine. Add a light build (Vite, ES modules) later and ship both stores through Capacitor. This is a DOM-driven management game with one optional Three.js scene; a canvas engine would mean rewriting all UI as canvas widgets for no gameplay benefit and would worsen accessibility and localisation. The engine with a headless simulator is the asset; its problems are structural, not language-level. Capacitor replaces the hand-rolled WebView wrapper with the same shell on both platforms, gives maintained AdMob (with UMP/ATT) and IAP plugins, removes the `file://` and bridge-divergence problems, and is the only realistic route to the App Store without a second native codebase.
