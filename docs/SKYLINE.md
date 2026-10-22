# Project Skyline — high-end 3D city, unique per city

Working doc for the priority mission in `docs/HANDOVER-KIMI.md` §4. The owner:
current graphics "are not that great… this is high end graphics." This doc holds
the mandated process output (references → directions → critique → per-city verify)
plus the perf record. `docs/DESIGN-DIRECTION.md` §4 remains the 3D law.

Renderer under work: `js/city3d-engine.js` (plain object `City3D`, vendored
three.js r128, no CDN, no new runtime deps).

---

## 1. Six references and what we steal (step 1 of the process)

### R1 — Anno 1800 (Victorian era grounding)
Victorian city-build done at AAA. Confirmed techniques: dense atmospheric
perspective (distance haze blending rooftops into sky — the Victoria 3/Anno
community calls out the "haze" trick explicitly, and Thomas Poulet's frame
analysis shows it runs a forward+-style light pipeline with up to ~2048
registered light slots — authored light placement, not accident).
**Steal:** per-era fog ramp matched to sky colour (haze = sky-coloured fog,
tighter at dusk), warm key light (~4300K) with cool ambient fill, and
era-true materials (Victorian brick matte). Our fog already exists per era;
make it palette-aware per city.

### R2 — Cities: Skylines 2 (grounding & AO)
Across every settings guide, one constant: ambient occlusion "contributes
meaningfully to street-level visual quality" while DoF and motion blur are
the first things to disable. CS2 players fixed "flat" screenshots by turning
broken AO *on*.
**Steal:** cheap contact grounding — a radial-gradient shadow plane under
every building + boosted AO-style darkening at street canyons — and a hard
rule: no DoF, no motion blur, no heavy post. Grounded beats glossy.

### R3 — Monument Valley (palette discipline)
Ustwo's process: draft prints of **every level**, pin them to a wall, tune the
palettes as one system until they all hold together ([design analysis](https://nabauer.com/archive/monument-valley-design-analysis), [palette wall method](https://addc402spring2019.wordpress.com/2019/02/16/mobile-game-design-monument-valley/)). Flat shapes + gradient skies, hue-tinted shadows (never grey).
**Steal:** CITY_PROFILES palettes are authored as triads (sky/fog/ground/water/
sun) per city×era, all 126 pinned in one contact sheet and reviewed together.
Shadows tinted toward the sky hue, not black.

### R4 — Frostpunk (weather as art direction)
Xbox Wire on the DLC visual identity: bleakness carried by a **single dominant
light source** (the generator glow) spilling across the skyline, weather doing
narrative work, one warm accent in a desaturated scene.
**Steal:** we already have era-driven weather (`setWeather`); push it further —
rain-darkened sky ramp + cool desaturation during recessions, Victorian smog
as warm-grey fog (Boom-era LA gets smog tint), and exactly one warm accent
(window glow / landmark accent light) per dusk scene.

### R5 — Neon HK/Tokyo (Digital-era night)
The canonical cyberpunk skyline formula across references: bold silhouettes,
heavy contrast, cyan/magenta neon split, wet-surface reflections ([Clip Studio
tutorial](https://tips.clip-studio.com/en-us/articles/11843), [Shutterstock HK
cyberpunk set](https://www.shutterstock.com/search/cyberpunk-city-skyline)).
**Steal:** Digital-era dusk: cyan-vs-magenta emissive window split by district,
neon landmark accent lights, rain-slick ground via a specular streak on the
ground material, night sky ramp deep blue-purple not black.

### R6 — Townscaper (guaranteed-harmony colour)
Oskar Stålberg ships **16 hand-picked colours** that work with each other in any
combination; pastel buildings against saturated water is the whole look
([palette guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2585484672)).
**Steal:** each city's palette is a small closed ramp (5–8 hues) so any
building×era×vegetation combination stays harmonious; wall tints vary within
the ramp (the `_skinColors` hook), never outside it.

---

## 2. Direction variants for London (step 2 — fill in)

Three renderer variants to be built and screenshotted at victorian/modern/
digital × day/dusk. One city (London) first; the chosen pattern rolls to all
cities afterwards.

| # | Direction | One line | Verdict |
|---|---|---|---|
| A | *Ledger Craft* | Warm matte Victorian etching brought to 3D: tight haze, ink-blue shadows, brass accents, gaslight lamps | **Steal, don't adopt.** Warm gas-lit dusk is the best Victorian-evening treatment of the three; at day the warm fog fights listing readability. Its dusk treatment is merged into the winner as the victorian/gilded evening grade. |
| B | *Glass Commonwealth* | Crisp modern toy-model clarity: bright graded sky, saturated water, clean specular, neon night signage | **WINNER.** Photographs best in every cell of the grid: blue→peach sky against saturated water gives instant depth (R6 Townscaper principle), dark ambient makes the sun read, contact shadows ground every building without murk. Only credible look at the tiny in-game viewport. Preset lives in `tools/3d-testpages/city.html`; to be rolled into `js/cities/london.js` as its profile. |
| C | *Living Weather* | Atmosphere-first: fog banks, rain sheen, drifting cloud shadow tint, light that changes with the economy | **Steal, don't adopt.** At haze 0.7+ the scene collapses into one grey-milk mass; buildings lose contrast. Its neon lamp idea and rain-slick night water are merged into the winner for the Digital era. |

Evidence: `tools/playwright/out/skyline/dirs/{a,b,c}-{victorian,modern,digital}-{day,dusk}.png`
(18 shots, reviewed). Commit `d4fc0bd` (SKYLINE-2). Worst cell: 253 draw calls,
13 592 tris — inside budget.

**Chosen direction: B "Glass Commonwealth", with A's warm dusk for
victorian/gilded evenings and C's neon lamps + mirror-water for Digital night.**

## 3. Side-by-side critique (step 3)

Chosen direction B, reviewed against the R1–R6 steal list and a top-tycoon
reference frame (Anno 1800 docklands at dusk). Top 3 gaps found, with fixes
rolled into the build-out:

1. **Night windows under-sell.** At dusk the lit-window rate reads sparse and
   flat; Anno's streets glow. Fix: raise `_updateWindows` lit ratio at
   night≥0.6, warm player windows more, add the emissive boost from
   HANDOVER-KIMI §4.1 (no per-window sprites — intensity only).
2. **Sky is a gradient and nothing else.** Cloud sprites sit at 0.07–0.13
   opacity — invisible in day shots. Fix: cloud opacity ×2 day, tint toward
   the profile's sky mid colour (R3: hue-tinted, never grey-white).
3. **Ground plane is dead space.** Reference games put colour variance into
   ground/parks. Fix: per-profile `ground`/`park` overrides already exist —
   author them per city (R6 ramps) and add the signature set-piece per city
   so each skyline has one authored focal object (mission §4.2).

## 4. Roll-out & verification (steps 4–7)

### SKYLINE-4 — direction B shipped into the game (2026-10-22, Claude, while Kimi was rate-limited)

- `js/cities/london.js` gained `profile`: B base + A's warm gas-lit dusk for victorian/gilded
  (`sunDusk`/`ambDusk`, `lamps:'gas'`) + C's neon lamps and mirror water for digital, and
  authored `ground/road/side/park` per era. `City3D.renderCity` already reads
  `cityDef.profile`, so the City screen **and** the splash pick it up with no UI change.
- Critique fixes from §3: lit-window threshold range 0.08–0.78 (≈75% lit at night 0.6,
  ≈90% at 0.72); clouds at 0.16–0.23 opacity when a profile is set and tinted to the
  profile's sky mid colour in `_paintSky`; ground/park per era in the profile.
- Victorian `fog` weather capped when a profile is set: fog bank = profile haze − 160 units
  (floor 560/980) and the milk-white lerp drops 0.55 → 0.28, so 1850 London reads instead
  of washing out. Non-profile cities keep the old behaviour until they get profiles.
- Version bumped to v8.2 in `sw.js`, `js/engine/game.js`, `js/ui/core.js`, `CLAUDE.md`.
- Verified: `node js/sim/tests.js` 445/445; no page errors; screenshots at 412×915 and
  1280×800 of splash, family select, deal board and City at 1850/1965/2025 reviewed.
  Stats unchanged: City screen (`low`) 185–189 calls / 10.7k tris; test page (`high`)
  220–251 calls / 12.8–13.3k tris. No balance-affecting change, balance table not re-run.
- Not done here: rolling the pattern to the other 20 cities (SKYLINE-8), surroundings
  slab (SKYLINE-5, spec + prototype in `docs/SKYLINE-TARGET.md`).

### SKYLINE-8 — CITY_PROFILES roll-out + contact sheet (2026-10-22, Kimi swarm) — DONE

- All 20 cities carry `profile` (base + era overrides; victorian/gilded gas-lit dusk,
  digital neon + mirror water) — commits bc76033, c8cce4b, 934ccff, 07219a6, all in
  push 5b83db4. One signature set-piece per city (café row, arcade, Victory Column,
  aqueduct, Gaudí spire, yacht marina, Peak Ridge, Frozen Quay, Bund lamps, Twelve
  Apostles ridge, cherry lane, supertrees (digital+), Hollywood hills, mural terrace,
  deco row (crisis+), fountain (digital+), brownstone row; Sydney/Mumbai already had
  HBR/GWI). CN Tower era-gated to `modern` (was rendering in 1850).
- Contact sheet: `tools/playwright/city-tour.js` → 120 desktop + 6 mobile shots in
  `tools/playwright/out/skyline/tour/` + `tour-stats.csv`; 20 cells reviewed across
  integrator + director passes; fixes landed (Sydney Opera House shape/placement,
  Amsterdam Canal Houses moved into view, Cape Town mountain contrast).
  `tools/check-citydefs.js` validates all 20 defs (20/20 OK); `tools/playwright/shot.js`
  re-shoots single cells.
- Perf: `docs/PERF.md` Skyline + Fleet sections — real GPU (RTX 5070, ANGLE-GL):
  1.36 ms avg / 3.4 ms p95, vsync-locked 60 fps, London 228 calls / 12.9k tris PASS.
  Fleet worst NYC digital dusk 264 calls (+5.6% over the 250 guideline, signature-driven;
  engine batching is the fix if wanted). Tris max 13.6k of 25k.
- Known-weak for the next wave: Sydney Opera House shells, Victoria Peak shape,
  Table Mountain day-side washout, NYC signature crowding, Notre-Dame camera-facing.

### SKYLINE-5 — surroundings slab + skyline edge (2026-10-22, Kimi) — DONE
- `_buildSurroundings()` in `js/city3d-engine.js`: view-aligned slab (ground + packed
  filler mass + 14-silhouette skyline edge) parented to `_pivot`, rotation-compensated
  per frame so the skyline stays behind on orbit. Profile fields `skyline` (tint) and
  `surroundings` (`hills|flat|desert|dense`) set in all 20 city profiles. ≤4 calls /
  ≤5.5k tris; low quality = ground + skyline only. Night response: surround darkens and
  desaturates with night, silhouette luminance clamped ≤85% of the sky bottom.
- Verified: sk5-* shots (London day/dusk, HK dusk, Amsterdam, Dubai, mobile); London
  high 232 calls / 18.3k tris, low 227 / 13.1k.

### SKYLINE-6 — streets and water alive (2026-10-22, Kimi) — DONE
- `_buildStreetLife()`: 11 parked cars merged to 1 mesh + 2 crawlers on road lanes
  (profile `carColors`, NYC taxi yellow), 2 boats drifting W/HB tiles with one shared
  2-quad wake mesh (vertices follow in RAF), one additive lamp-pool mesh under every
  lamp (opacity ∝ night), water specular sheen pulsing around each profile's base.
  +7 calls / +~400 tris high (≤5 without water), parked+pools only on low. London
  modern-day 237–239 calls / 18.7k tris; engine cost 1.36 → 1.49 ms avg (noise-level).
  Motion verified: mover + boat positions sampled 3 s apart — both moved.

### SKYLINE-7 — silhouette variety (2026-10-22, Kimi) — DONE
- `_roofline()` adds era/type roof furniture, seeded per building: victorian/gilded
  chimneys (1–4, shared brick batch), gilded cornices + bays, water tanks (modern +
  always NYC: cylinder + cone, one shared wood material), modern plant rooms/AC,
  digital antenna + tip light and ONE helipad per city (first tall tower claims it),
  seeded 2–3 setback tiers on skyscrapers (total height unchanged, every tier
  windowed), awning supports under the existing commercial awnings. Shared-material
  parts batch into one mesh per material city-wide via `_detail`/`_flushDetails`;
  `_rebuildDetails()` re-derives everything on era change / renovation / demolition.
  Mansion porticos and the commercial awning slabs already existed (P6) — not doubled.
  +5–7 calls / +0.5k tris high; low keeps chimneys + setbacks only. London high
  244 calls / 19.2k tris, low 232 / 13.4k, engine cost unchanged (1.49 → 1.39 ms avg).
  Verified by zoomed crops (chimneys/cornice/bays/tank/setbacks/antenna) + probes
  (detail batches survive setEra and updateProperty rebuilds).

### SKYLINE-10 — labels + landmark night lights (2026-10-22, Kimi) — DONE
- Label canvas doubled (640x144, same 30x6.75 world sprite) — crisp at 1280x800;
  plus a system-serif fallback when the webfont is still loading (fixes the empty-pill
  race that made labels render as black blobs). Each landmark now gets one additive
  crown glow fading in with night (cyan in the Digital era, warm floodlight otherwise)
  and the first two landmarks carry a real point light (the per-city cap).

### SKYLINE-11 — perspective rig for splash + photo mode (2026-10-22, Kimi) — DONE
- 'opts.camera: 'perspective'' (FOV 28 deg, 20 deg elevation) gives a true horizon;
  gameplay stays ortho. Splash.mount uses it via opts.camera (default perspective) and
  City3D.photo() renders through a temporary perspective rig even from an ortho game.
  Verified: splash before/after + mobile (horizon, skyline edge, surroundings depth),
  london/hong_kong test-page shots, photo() PNG; perspective high 247 calls / 19.2k tris.
### SKYLINE-12a — quality spike steps 1+2: composer + PBR (2026-10-23, Kimi) — DONE
- Vendored three.js r128 example files (EffectComposer, RenderPass, ShaderPass,
  UnrealBloomPass, SSAOPass + shader deps + THREE-LICENSE.md) into js/vendor/.
  Quality high gets RenderPass -> SSAO (kernelRadius 12, ortho define cleared — the
  stock shader defaults to perspective depth math) -> UnrealBloom (0.55 day / 0.9
  night, threshold 0.82; lit windows boosted to 2.0 so they bite) -> custom grade
  ShaderPass (vignette, S-curve, shadow lift toward the era fog hue, grain, exact
  sRGB output). Skins are MeshStandardMaterial with per-era roughness/metalness
  (Victorian brick 0.92/0 -> Modern glass 0.15/0.6 -> Digital 0.08/0.8), roughness/
  metalness ride the era fade loop; water is Standard 0.12/0.5 with a PMREM sky
  env map rebuilt per era from the profile palette (roughness pulse = old sheen).
  Quality low: no composer, no env, unchanged path. Version v8.3.
- GPU (RTX 5070): 60 fps vsync-locked with the composer; engine frame cost
  1.65 -> 4.37 ms (headroom to 16.6); scene 248 calls / 19.3k tris. Low unchanged
  (224 calls / 13.5k, no passes). A/B shots sk12-* (post=0 before pairs) reviewed:
  night bloom on windows/accents only, SSAO grounds buildings, day graded, 0 errors.
### Remaining (audit §2 order)

SKYLINE-7 silhouette variety (largest gap) → SKYLINE-9 mobile hero →
SKYLINE-10 labels + landmark lights → SKYLINE-11 perspective rig for splash/photo.

Perf budget (this machine has a GPU — measure, don't assume):
`getStats()` ≤ ~250 draw calls, ≤ ~25k triangles, frameMs ≤ 16 on
`quality:'high'` desktop, ≤ 33ms on `quality:'low'`.

### Review after SKYLINE-8 (2026-10-22 evening, Claude, fresh render of `6930352`)

Rendered: City screen 1850/1965/2025 at 412×915 and 1280×800 (quality `low`, which is
what mid-range phones get), splash, and `city.html?city=` for tokyo/paris/dubai/new_york
at `high`. Tests 445/445, no page errors. Per-city identity now reads (Tokyo Tower +
cherry lane, Paris café row + Eiffel, NYC Empire/Chrysler, Dubai palms), cars/boats/
lamp pools and chimneys all visible. Good wave. Three things to fix before SKYLINE-9,
in order:

1. **Skyline silhouettes read as pale ghost pillars, not a skyline.** In
   `_buildSurroundings` the edge material `L` is `MeshLambertMaterial({ color: pal.sky })`
   and sits at the fog's far end, so it renders *lighter* than the sky behind it, as
   translucent light rectangles. On `low` the filler mass is skipped, so the in-game
   phone view shows only these pillars floating in the sky (see City screen 1850/2025),
   and on the splash they stand behind the title. They are also too tall: `h2 = 35 +
   rng() * 60` reaches the top of the frame and dwarfs Big Ben.
   Fix: colour = sky-mid × 0.55–0.7 (always darker than the sky at that height), set
   `fog: false` on that material or lerp its colour toward sky-top yourself; heights
   18–55; on `low` either draw the cheap filler too (it is one merged mesh) or drop the
   skyline edge as well, never pillars alone; on the splash (`hero: true`) halve their
   height or skip them so the title stays clean.
2. **Day clouds are hard-edged grey polygons** (Dubai modern day, also visible at the
   top of New York). They look like untextured geometry. Clouds must stay soft sprites
   with the radial canvas texture; if these are the new mesh clouds, give them the
   sprite texture + additive soft edges or revert to sprites.
3. **NYC signature crowding** (already on your known-weak list): Statue of Liberty is
   planted inside a city lot between brownstones; move it onto a water/harbour tile at
   the island's edge, and stagger the four tall labels so they do not stack.

Also: eleven pushes to `main` since v8.2 with no bump — `CACHE_NAME` is unchanged, so
returning players keep stale files. Bump to v8.3 with the next code push (CLAUDE.md rule).
Draw-call overages (13 of 120 cells, worst +14) are acceptable; triangles are fine.
