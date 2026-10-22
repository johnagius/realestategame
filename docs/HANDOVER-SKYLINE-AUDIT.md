# Audit note for Kimi — 2026-10-22, before Skyline step 4

Written by a second AI (Claude) at the owner's request while Kimi waited on its
rate limit. Purpose: confirm the direction, rank what the 3D city needs next,
and tell the owner which Kimi model/thinking setting to use for each step.
Read this after `docs/HANDOVER-KIMI.md` §4 and `docs/SKYLINE.md`. Nothing in
here overrides `docs/REDESIGN.md` or `docs/DESIGN-DIRECTION.md`.

---

## 1. Verdict

**On the right track. Direction B ("Glass Commonwealth") is the correct pick
and the process (references → variants → critique) is the one the brief
mandates. But after SKYLINE-1..3 the shipped game is unchanged: the B profile
exists only in `tools/3d-testpages/city.html`. Players still see the old
renderer, and in 1850 the Victorian fog preset washes the city into a
grey-beige mass.** The next commit must put pixels in the game.

Evidence (rendered fresh from `main` @ `50b9c17`, SwiftShader, seed 42):

| Check | Result |
|---|---|
| `node js/sim/tests.js` | 445 passed, 0 failed |
| `node js/sim/balance.js` (full) | 9/10 targets; competent bankruptcies 4.8/100 vs 5–15 (boundary, not broken); 4/4 family guards |
| Page errors, all screens at 412×915 and 1280×800 | 0 |
| Direction B worst cell (digital/dusk, high) | 251 calls, 13 266 tris — inside budget |
| In-game city (low) | 185 calls, 10 596 tris |

Housekeeping found on the way:

- **Version not bumped.** 20+ pushes to `main` since v8.1 and `sw.js`
  `CACHE_NAME`, `Game.version` and `PEUI.VERSION` all still say v8.1 while
  `docs/HANDOVER.md` §11 calls the work v8.2. Returning players can be served
  stale files. Bump all three to v8.2 on the next code push (CLAUDE.md rule).
- **Dead branches.** `codex/create-chatgpt-realestate-folder-and-enhance-graphics`
  and `claude/improve-game-engagement-05PQ9` are v6-era with no merge base to
  `main`. Delete them; do not merge. `claude/peaceful-bohr-aksms0` and
  `claude/fix-button-overflow-mobile-ImQl0` are fully merged.
- **P6/P7 landed in one "parallel agent wave" commit** (`cf55a08`). Before the
  release gate, spot-check three claims by running them, not by reading the
  handover: Capacitor build, UMP consent flow, save export/import.

## 2. What the 3D city needs, ranked by payoff

Each item is one commit (`SKYLINE-n`), screenshotted at 412×915 and 1280×800,
LOOKED at, stats recorded in `docs/SKYLINE.md` §4.

1. **SKYLINE-4 — Ship direction B into the game.** ✅ DONE by Claude 2026-10-22 (see `docs/SKYLINE.md` §4); version is v8.2. Kimi's interrupted local attempt lives on branch `kimi/skyline-4-wip` (41 lines, unpushed at the time) — diff it against main and drop whatever is now redundant. Move the B preset from
   `city.html` into `CityDef_London.profile` (with A's warm dusk for
   victorian/gilded evenings and C's neon lamps + mirror water for digital,
   as the critique decided). Cap Victorian `fog` weather so haze ≤ 0.3: 1850
   must still read. Apply the same profile to the splash (`js/intro.js`).
   Acceptance: the in-game London at 1850, 1965 and 2025 is visibly the B
   look; the three critique fixes (night windows, clouds, ground) are in.
2. **SKYLINE-5 — A world beyond the island.** Today the grid floats in a void.
   Add a ground plane to the horizon tinted from the profile, and a ring of
   low-poly silhouette blocks/hills beyond the grid that fade into the fog
   (one merged mesh, ≤ 10 draw calls). This is the single biggest
   toy-versus-world gap. Per-city later (hills for Hong Kong, flat for
   Amsterdam, desert for Dubai).
3. **SKYLINE-6 — Streets and water alive.** Kerbs/pavement strip and lane
   markings on `RD` tiles, lamp light pools at night (one additive sprite per
   lamp, capped), animated water (scrolling normal/specular or vertex ripple),
   2–3 boats on river/harbour tiles and a few cars on roads (instanced, ≤ 2
   draw calls). Acceptance: a 10 s recording shows motion other than the orbit.
4. **SKYLINE-7 — Silhouette variety.** Every type is box + roof. Add rooftop
   furniture (chimneys Victorian, water tanks NY, plant rooms/AC modern,
   antennae/helipad digital), setbacks on skyscrapers, bays/porticos on
   mansions, shopfront awnings on commercial. Seeded per building through
   `buildByType`. Trees: 3 species per profile (`trees` kind already exists).
5. **SKYLINE-8 — CITY_PROFILES roll-out + contact sheet.** The planned matrix
   (palette triads, vegetation, lamps, weather bias, signature set-piece) for
   all 21 cities, plus `tools/playwright/city-tour.js` producing the 126
   images. Review the sheet as one wall (Monument Valley method); fix any
   city that does not hold next to its neighbours.
6. **SKYLINE-9 — Mobile hero layout.** At 412×915 the city gets ~40% of the
   height. Make the city full-bleed on the City screen with the district panel
   as a pull-up sheet; keep the legend and the photo/reset buttons.
7. **SKYLINE-10 — Labels and landmark lights.** Landmark name sprites render
   blurry; raise canvas resolution ×2 or move to DOM labels. Add the
   per-landmark night accent lights from HANDOVER-KIMI §4.2.

Then `docs/PERF.md` on the GPU machine, and the release gate in
`docs/HANDOVER-KIMI.md` §5.

## 3. Which Kimi model and thinking level to use (for the owner)

Default for Project Skyline: **K3-256k, thinking High.** The work is
judgement-heavy (1 780-line renderer, long design docs, screenshot critique)
and needs the context window more than it needs speed.

| Step | Model | Thinking | Why |
|---|---|---|---|
| Design decisions and critiques (SKYLINE-5 backdrop design, SKYLINE-8 contact-sheet review, any "pick one of three") | K3-256k | **Max** | Taste and comparison across many images; this is where extra thinking pays |
| Renderer feature work (SKYLINE-4, 5, 6, 7, 9, 10) | K3-256k | **High** | Needs the whole engine in context; Max burns the limit for little gain |
| Mechanical roll-out (SKYLINE-8 copying the profile pattern across 20 city files, version bumps, branch cleanup) | K2.7 Code Highspeed | Low or High | Pattern-following, cheap and fast |
| Balance/engine work (Phase 4) | K3-256k | High | Numeric reasoning plus the sim tables |

Switching model or thinking level invalidates the prompt cache, so **switch
only at a step boundary, in a new chat**, never mid-step.

**Instruction to Kimi (binding):** at the start of every SKYLINE step, and
whenever the next step changes row in the table above, tell the owner in one
line which model and thinking level to use for that step and whether to open
a new chat, e.g. "SKYLINE-5: K3-256k, thinking Max, new chat." Also say when a
step is done so the owner knows a switch is safe. If the limit is close, say
which remaining sub-steps can drop to K2.7 Code Highspeed without loss.

## 4. Prompt for Kimi (owner: paste this into the new chat)

> Read `docs/HANDOVER-SKYLINE-AUDIT.md`, then `docs/SKYLINE.md` and
> `docs/HANDOVER-KIMI.md` §4. Continue Project Skyline from SKYLINE-4 in the
> order the audit note ranks, one commit per step, screenshots at 412×915 and
> 1280×800 looked at before each push, stats in `docs/SKYLINE.md` §4. Bump the
> version to v8.2 in all three places on the first code push. Delete the two
> dead branches named in the note. At the start of each step tell me which
> Kimi model and thinking level to use and whether to open a new chat, per the
> note's §3 table. Full effort per `docs/HANDOVER.md` §10.
