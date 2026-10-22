# Performance (P6.4)

Harness: `node tools/playwright/perf.js` (needs the local server on port 8790
and Playwright Chromium). It measures cold load, city frame time and JS heap
growth, and writes `tools/playwright/out/perf.json`.

Budgets: cold start < 2 s (desktop profile) · city frameMs < 33 (30 fps floor;
60 fps = 16.7) · heap growth < 2× over a long run.

## Measured — 2026-10-22, this dev container

Environment: Windows, Chromium headless through **SwiftShader (software GL —
no GPU in this container)**, viewport 1280×800, seed 42, URL
`http://127.0.0.1:8790/index.html?seed=42`. Two runs agreed except where noted.

| Metric | Budget | Measured | Verdict |
|---|---|---|---|
| First paint (cold navigation) | < 2 s | **0.58 s** (both runs) | PASS |
| Full `load` event (cold navigation) | — | 3.7–9.3 s, **noisy** | see note |
| City draw calls | ~< 200 | 188–190 | within budget |
| City triangles | ~< 13 k | 10.6 k | within budget |
| City frameMs — warm single frame | < 33 | 9.5–14.4 | PASS |
| City frameMs — mean over 15 s (30 samples) | < 33 | **44.3** | FAIL *in software GL only* |
| City frameMs — p95 over 15 s | < 33 | 103.8–237 | FAIL *in software GL only* |
| JS heap after 60 scripted years vs before | < 2× | **1.0×** (10 MB → 10 MB, VJS heap quantized) | PASS |
| Page errors during the whole run | 0 | 0 | PASS |

### Reading the frameMs numbers

This container renders WebGL on the CPU (SwiftShader), so the 15 s sampling
window is dominated by software-raster spikes; the warm frame time (9.5–14 ms)
is the more honest signal and it passes. **Real-device numbers are still
unmeasured** — same caveat as `docs/HANDOVER.md` §7. On any machine with a GPU
(integrated is enough for 190 calls / 10.6 k triangles), expect the mean to sit
near the warm number. Re-run `perf.js` on the target device before drawing
conclusions; do not "fix" the engine based on SwiftShader spikes.

### Cold-load noise

`load` includes the deferred script fleet and the Google Fonts stylesheet
(HANDOVER §7: fonts are not precached). Measured 3.7 s on an idle machine and
9.3 s while a second Chromium was rendering store assets concurrently — the
number is contention-sensitive, first paint (0.58 s) is not. If cold `load`
matters for store submission, vendor + precache the fonts and re-measure.

### Heap

60 scripted in-game years (1850→1910, buys + endYear each year, all decisions
resolved) grew the used JS heap by **≤ the V8 quantization step (10 MB)** —
growth ratio 1.0× against a 2× budget. `window.gc()` was forced before both
readings (the harness launches Chromium with `--js-flags=--expose-gc`).

## Regressions found

None that are provable in this environment. The two FAIL rows above are
software-GL artefacts, not engine regressions (draw calls and triangles are
inside the 3D budget). Follow-up: run `perf.js` on a real GPU and on a
mid-range Android device (budget there: < 2 s cold start, 60 fps city on
`quality:'low'` — TASKS P6.4).


## Skyline city (SKYLINE-4) — measured 2026-10-22, this machine (has a GPU)

Harness: `node tools/playwright/skyline-perf.js` (add `PW_FORCE_SW=1` for a
software-GL comparison run). Subject: London 3D test page with the shipped
city profile (Glass Commonwealth + steals), era modern, day (night 0.12),
viewport 1280×800. Engine cost is measured as wall time of `renderer.render`
over ~350 frames (avg + p95); frame pacing as the RAF interval average.
JSON dump: `tools/playwright/out/skyline/perf.json`.

Two GL backends, labelled — do not mix them:

- **GPU**: NVIDIA GeForce RTX 5070 via ANGLE OpenGL. Caveat: Playwright's
  default headless launch still lands on SwiftShader here; the GPU needs
  `--use-gl=angle --use-angle=gl --ignore-gpu-blocklist`. Headless + GPU also
  only produces frames on demand, so the harness forces BeginFrames through a
  CDP screencast during sampling.
- **SW**: SwiftShader (software Vulkan), the old `ARGS` from config.js.

| Metric | Budget | GPU (RTX 5070) | SwiftShader | Verdict |
|---|---|---|---|---|
| Draw calls (modern-day, high) | ~≤250 | 228 | 227 | PASS |
| Triangles (modern-day, high) | ~≤25k | 12 926 | 12 924 | PASS |
| Engine frame cost avg (`renderer.render`) | ≤16 ms | **1.36 ms** | 1.51 ms | PASS |
| Engine frame cost p95 | ≤16 ms | 3.4 ms | 2.0 ms | PASS |
| Frame pacing (RAF interval avg) | 60 fps | **16.6 ms** (vsync-locked) | 38.4 ms | PASS on GPU; SW artefact |
| Low quality (`quality:'low'`): contact shadows skipped | yes | yes | yes | PASS |
| Low quality engine frame cost avg | ≤33 ms | 1.16 ms | 1.26 ms | PASS |

Reading: on the GPU the city runs at the display's 60 fps cap with ~1.3 ms of
engine work per frame — an order of magnitude under the 16 ms budget, and the
low-quality path is the same story under the 33 ms budget. The SwiftShader
`renderer.render` number only measures JS + command submit (rasterisation is
async in the GPU process), which is why it looks deceptively fast; the honest
software-GL signal is the 38.4 ms RAF interval, and it fails only on that
backend. Note the P6.4 SwiftShader FAIL rows above are the same artefact, now
contradicted by real-GPU numbers.

Peak load: the Digital era's neon lamps add two material batches, so the
skyline grid peaks at 249–251 calls (`{a,b,c}-digital-{day,dusk}` and
`london-profile-digital-dusk`) — 1 call over the ~250 guideline. Within
rounding of the budget; revisit only if the guideline becomes a hard cap.
Triangles never exceed 13.6k.

### Fleet (SKYLINE-6 city tour, 2026-10-22)

`node tools/playwright/city-tour.js` screenshots all 20 cities x
{victorian, modern, digital} x {day, dusk} at 1280x800 high quality and
records per-shot stats in `tools/playwright/out/skyline/tour-stats.csv`.
The frame-cost rows above (London, modern-day) are representative for the
whole fleet — every cell measured 1.2–4.6 ms engine frame cost under
SwiftShader; on the GPU that is comfortably inside the 16 ms budget.

Fleet worst cells (draw calls, budget ~≤250):

| Cell | Calls | Triangles | Note |
|---|---|---|---|
| new_york-digital-dusk | 264 | 10 246 | skyline cluster + neon batches |
| new_york-digital-day | 263 | 10 244 | same |
| cape_town-digital-day | 262 | 8 900 | 3-cell Table Mountain range |
| cape_town-victorian-day | 256 | 8 188 | same |
| barcelona-digital-day | 256 | 10 545 | Sagrada + neon |
| london-digital-day | 251 | 13 588 | neon batches; fleet tri peak |

Triangles stay under 13.6k everywhere (budget 25k) — headroom is ample.
The calls guideline is exceeded in 13 of 120 cells, all in cities whose
signatures add several unmergeable material batches (Table Mountain's
3-cell range, NYC's tower cluster, neon-lamp eras). Worst overage is +14
calls (5.6%); revisit with per-city batch merging only if a hard cap
appears. Full data: `tour-stats.csv`.

SKYLINE-5 (surroundings slab + skyline edge) adds ≤4 draw calls and ≤5.5k
triangles per city (quality high; on low it is ground + skyline edge only,
+2 calls). London modern-day high measures 232 calls / 18.3k tris, low
227 calls / 13.1k tris; the fleet worst moves to ≈268 calls
(new_york-digital-dusk) — still calls-only, triangles ≤ 19k fleet-wide.
SKYLINE-6 (cars/boats/pools/ripple) adds ≤7 calls / ≤0.4k tris high, ≤2 on
low; London high 239 calls / 18.7k tris, engine cost 1.36 → 1.49 ms avg
(GPU, within run-to-run noise; vsync-locked 60 fps unchanged).
SKYLINE-7 (silhouette variety) adds ≤7 calls / ≤0.5k tris high (≤3 on low —
chimneys + setbacks only): London high 244 calls / 19.2k tris, low 232 / 13.4k;
engine cost 1.49 → 1.39 ms avg.
