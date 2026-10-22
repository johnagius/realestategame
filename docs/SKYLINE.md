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
| A | *Ledger Craft* | Warm matte Victorian etching brought to 3D: tight haze, ink-blue shadows, brass accents, gaslight lamps | TBD |
| B | *Glass Commonwealth* | Crisp modern toy-model clarity: bright graded sky, saturated water, clean specular, neon night signage | TBD |
| C | *Living Weather* | Atmosphere-first: fog banks, rain sheen, drifting cloud shadow tint, light that changes with the economy | TBD |

## 3. Side-by-side critique (step 3 — fill in)

Chosen direction vs a top-tycoon reference screenshot; top 3 gaps and fixes.

## 4. Roll-out & verification (steps 4–7 — fill in)

CITY_PROFILES matrix, city-tour.js contact sheet (126 images), perf numbers
in `docs/PERF.md`.

Perf budget (this machine has a GPU — measure, don't assume):
`getStats()` ≤ ~250 draw calls, ≤ ~25k triangles, frameMs ≤ 16 on
`quality:'high'` desktop, ≤ 33ms on `quality:'low'`.
