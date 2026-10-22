# Project Skyline — the target frame (what "best possible" looks like here)

Written 2026-10-22 by Claude at the owner's request: "a sketch of how the graphics
should look if I aim for the best possible." The sketch is not a painting; it was
photographed with the real engine. `tools/3d-testpages/city.html?dir=b&sketch=1`
layers `tools/3d-testpages/sketch-layer.js` (a throwaway prototype, never shipped)
over direction B. `docs/skyline/target-sheet.png` is the before/after sheet:
today's game → direction B → target sketch, desktop and mobile.

Constraints that define "best possible" for this project: three.js r128 vendored,
no new runtime deps, a WebView on mid-range Android, ≤ ~250 draw calls and
≤ ~25k triangles on `high`, orthographic isometric camera for gameplay
readability, 7×8 tile cities. Inside those, the target is **a Monument Valley /
Townscaper toy-model clarity for the player's district, sitting inside a living
city, under a sky that tells the era.** Not photoreal. Never glossy.

---

## 1. The frame, layer by layer (back to front)

| # | Layer | Target | Today | Sketch proves |
|---|---|---|---|---|
| 1 | **Sky** | Three-stop gradient per city×era (profile), 3–5 soft hue-tinted cloud sprites at 0.2–0.3 opacity, stars + moon at night. The top 20–25% of the frame is always sky. | Gradient only; clouds invisible (0.07). | Yes (clouds ×2.4, tinted to fog) |
| 2 | **Skyline edge** | A line of 12–16 tall silhouettes **behind** the city, 35–95 units, cool and desaturated (never lighter than the sky), standing against the sky. This is the horizon. | Nothing. | Yes (`buckets`, spires) |
| 3 | **Surroundings** | A slab of low filler blocks (3–10 units, taller toward the back) that fills the void beside and in front of the island; ground plane tinted from the profile's `ground` toward the fog; fades into haze at the back edge. 3–4 merged meshes total. | Void. | Yes (`slab`) |
| 4 | **The island** | Direction B exactly: bright graded sky, saturated water, clean specular, dark ambient so the sun reads, contact shadows under every building, wall-tint jitter within the city's ramp. | Old renderer, Victorian fog milk. | Yes (B) |
| 5 | **Streets** | Kerbs + pavements (exist), lane markings (exist), **cars** (12–18, instanced/merged per colour, parked and moving), lamp posts per era (exist) and **light pools** at night (one additive merged plane mesh). | Static grey. | Yes (cars, pools) |
| 6 | **Water** | Saturated, specular streak from the sun, 2–3 **boats** with a wake, slow ripple (scrolling normal or vertex wave). Night: mirror of neon. | Flat plane. | Boats + wake yes; ripple not yet |
| 7 | **Buildings** | Silhouette variety by era: chimneys (Victorian), cornices and bays (Gilded), water tanks (NY), plant rooms/AC (Modern), antennae/helipads (Digital), skyscraper setbacks, shopfront awnings. Seeded per building, merged into the skin batches. | Box + roof. | **Not in sketch** — biggest remaining gap |
| 8 | **Ownership** | Family colour on roofline banner + lit windows warm for the player, cool for rivals (exists); a soft rim light on prime buildings. | Ground ring + flag. | — |
| 9 | **Landmarks** | Era-gated (exists), each with one accent light at night, crisp DOM/hi-res labels. | Blurry sprite labels. | — |
| 10 | **Grade** | ACES, exposure 1.1 (B), sun ×1.12 / ambient ×0.9 for shadow contact; dusk by default in game (`ERA_NIGHT` 0.3→0.45). No DoF, no bloom pass, no motion blur. | Exposure 1.0, flat. | Yes |

Cost of the whole sketch layer on top of B: **+10 draw calls, +17k triangles** (43.7k
total, over the 25k budget as written — the filler must be thinned ×2 and LOD'd
by distance in the real implementation; it was generated at 2600 candidates for
the photo). Frame time unchanged in SwiftShader.

## 2. The finding that changes the plan: an orthographic camera has no horizon

The first sketch pass put a ground plane to infinity under the city. Under the
ortho camera that plane climbs the screen and **covers the whole sky**: there is
no horizon line in an orthographic projection. A fading disc fails the same way
(the fade rim is outside the frame). The only ways to have both a world and a
sky are:

- **(chosen for gameplay)** surroundings as a *view-aligned slab* that stops at a
  skyline edge `BACK_D ≈ 250` units behind the centre, with the tallest
  silhouettes on that edge and the ground alpha-fading there. The sketch does
  this (`slab.rotation.y = π/4`). The slab must rotate with the pivot when the
  user orbits, so the skyline is always behind. On orbit, rebuild or rotate the
  slab to the new camera azimuth (cheap: it is 4 meshes).
- **(recommended for the hero splash and photo mode)** a *perspective* camera,
  FOV ~28°, elevation 18–22°, which gives a true horizon, sky and atmospheric
  depth — the Anno/Cities:Skylines frame. Gameplay keeps ortho for readability;
  `Splash.mount()` and `City3D.photo()` should get the perspective rig. This is a
  separate step (SKYLINE-11) and the single biggest upgrade for the start screen.

## 3. What this changes in the SKYLINE backlog (`docs/HANDOVER-SKYLINE-AUDIT.md` §2)

- **SKYLINE-5** is now specified: port `sketch-layer.js` §1+2 into the engine as
  `_buildSurroundings()` with the slab geometry, thinned to ≤ 8k triangles, LOD
  by `quality`, colours from the profile (`ground`, `fog`, new `skyline` tint),
  rotating with orbit, disposed in `destroy()`.
- **SKYLINE-6** gets its reference: cars/boats/pools as in §5 of the layer, plus
  the water ripple that a still cannot show.
- **SKYLINE-7** (silhouette variety) is the largest gap the sketch does not cover
  and should move up to right after SKYLINE-5.
- **New SKYLINE-11**: perspective rig for splash + photo mode.

## 4. Per-city, in one line each (so the slab and sky differ per city)

London plane trees, brick skyline, Thames boats · Paris Haussmann cream, zinc
roofs, Seine barges · New York water tanks, dense tall skyline edge, yellow cabs ·
Tokyo cherry, neon, trains · Hong Kong hillside skyline edge (tall, layered),
harbour junks · Dubai desert ground, glass spires, palms · Sydney bright, harbour,
ferries · Amsterdam flat, gables, canal boats, bikes · Rome ochre, domes, pines ·
Toronto conifers, snow in Digital winters · Mumbai monsoon haze, dense low skyline ·
Cape Town Table-Mountain slab silhouette · Miami pastel, palms, water on two sides.

## 5. How to reproduce the sketch

```
python -m http.server 8790
# open http://127.0.0.1:8790/tools/3d-testpages/city.html?dir=b&sketch=1
# era/night buttons re-render; the layer re-applies on each render()
```
