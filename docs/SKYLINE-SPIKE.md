# SKYLINE-12 — the quality spike (do this before any more polish)

Owner's verdict on the build after SKYLINE-8: "really not much change, still looks low
quality, 4–5/10." He is right. SKYLINE-4..11 are polish inside a ceiling: procedural
box buildings, flat Lambert/Phong materials, no textures, orthographic camera, no
post-processing. No amount of chimneys, cars or labels changes what that ceiling looks
like. This spike raises the ceiling on ONE city (London), photographs it next to the
current build, and the owner decides with his eyes whether to roll it out.

Rules: one branch, one city, no balance change, tests stay green, no CDN (vendor the
three.js r128 example files into `js/vendor/`), every step screenshotted at 412×915 and
1280×800 and LOOKED at. Keep a `quality:'low'` path that skips every new pass so phones
still run. Bump the version on every push to `main`.

## Step 1 — Post-processing (biggest single jump; ~1 day)

Vendor from three.js r128 `examples/js`: `postprocessing/EffectComposer.js`,
`RenderPass.js`, `ShaderPass.js`, `UnrealBloomPass.js`, `SSAOPass.js`, and the shaders
they need (`CopyShader`, `LuminosityHighPassShader`, `SSAOShader`, `SimplexNoise` in
`math/`). In `City3D`:

- `_composer = RenderPass → SSAOPass (kernelRadius ~12, minDistance 0.002, maxDistance
  0.08, output Default) → UnrealBloomPass (strength 0.55 day / 0.9 night, radius 0.4,
  threshold 0.82) → final ShaderPass` with a vignette + colour grade (lift shadows toward
  the era's fog hue, slight S-curve, 2–3% grain). Replace `renderer.render` in the RAF
  with `_composer.render()` when `quality:'high'`; `resize` updates the composer.
- Bloom only bites on emissive: raise `WIN_LIT_*` emissive intensity, neon lamps and
  landmark accent lights so they bloom; keep walls under the threshold.
- Budget: one SSAO + one bloom is fine on any discrete/integrated desktop GPU; measure
  with `tools/playwright/skyline-perf.js` on the GPU machine. On `low`: no composer.
- Done when: London dusk/night has glowing windows and soft occlusion under every
  building, and the day shot has a graded, vignetted frame.

## Step 2 — Physically based materials + environment map (~½ day)

- Switch skins from `MeshPhongMaterial` to `MeshStandardMaterial` (roughness per era:
  Victorian brick 0.9/metalness 0, Gilded stone 0.8, Modern glass roughness 0.15 +
  metalness 0.6 + `envMapIntensity` 1.2, Digital glass 0.08/0.8). Water: roughness
  0.12, metalness 0.5, env map on.
- Environment: build a `PMREMGenerator` map from the sky gradient canvas (equirect) per
  era/night, assign `scene.environment`. Rebuild on era change only (cached per era).
- Done when: glass towers reflect the sky, brick stops looking like plastic.

## Step 3 — Authored building assets instead of procedural boxes (~1 day for London)

- Vendor `loaders/GLTFLoader.js` (r128 examples/js) and a CC0 low-poly city kit
  (Kenney "City Kit (Suburban)" + "City Kit (Commercial)" or equivalent; keep the
  licence file in `assets/models/LICENSE`). Export to binary `.glb`, Draco off.
- Map `PROP_TO_3D` types to kit models per era (townhouse → Victorian terrace model,
  skyscraper → commercial tower model, etc.). Keep the procedural builders as the
  fallback for types without a model and for `quality:'low'` if load fails.
- Windows: the kit's materials carry window geometry; feed `_dressWindows` from a
  per-model emissive mask so lit windows still work at night.
- Done when: a London street at 1900 and at 2025 has recognisable facades, doors,
  balconies and roof detail without any new procedural code.

## Step 4 — Perspective rig for splash + photo mode (~½ day)

- `Splash.mount()` and `City3D.photo()` get a `PerspectiveCamera` (fov 28, elevation
  18–22°, slow dolly) in place of the ortho rig; gameplay keeps ortho. With the
  surroundings slab and fog this gives a true horizon and sky.
- Done when: the start screen looks like a game trailer frame, not a diorama.

## Step 5 — Verdict

`tools/playwright/shot.js` London at 1850 dusk, 1965 day, 2025 night, before vs after,
desktop + mobile, side by side in `docs/skyline/spike-sheet.png`. Owner looks. If it is
not clearly 8/10, stop and say so; if it is, roll steps 1–2 to all cities (engine-only,
free), then step 3 city by city.

## What this is NOT
Not more chimneys, labels, cars, layouts or mobile tweaks. Those wait until the owner
has seen the spike.
