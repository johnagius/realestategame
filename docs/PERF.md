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
