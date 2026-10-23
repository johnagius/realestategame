# The Visitor Economy — location slice design contract (v8.10, Phase 9)

Owner brief: make the city a place to discover opportunities, decide, and see
consequences. This is the smallest slice that proves it: **one city (London),
district identity, landmarks as demand sources, and a per-property choice
between long-term and short-term letting.** Everything outside this slice is
deferred (§10). Design inputs: docs/ENGAGEMENT-AUDIT.md, docs/REDESIGN.md
(§3, §6, §13, §14), and the inspiration synthesis (research notes below §11).

## 1. Player decisions and intended trade-offs

One new standing decision per eligible property: **letting strategy**.

- **Long let** (default, current behaviour): predictable occupancy, lower
  turnover, tenant continuity (sticky tenants, ENG-B6), lower wear.
- **Short let** (visitor letting; "seasonal lodgings" in early eras): higher
  gross in visitor districts, but income swings hard with the market cycle,
  running costs are higher, the building wears faster, and reputation-sensitive
  neighbours notice.

Neither dominates: short let wins in visitor districts during growth/boom and
loses badly in recession/depression; long let is steadier everywhere and wins
outright in purely residential districts. Switching is a commitment, not a
toggle (§4).

## 2. Authoritative data and location representation

- **Districts are the spatial unit of truth** (as they already are in the
  engine: `property.district` → `district.ppsqm/mult/trend`). No tile
  distances, no coordinates, no walking-time claims.
- Each city district gains one data field: `visitor: 0|1|2` (none / some /
  strong visitor appeal). Authored as `D.districtVisitor[cityId][districtName]`
  in `js/engine/data.js` (a side map — the 20 `dd()` city defs stay untouched);
  London first, other cities deferred (§10) with a **defined neutral fallback:
  district absent from the map → 0 → short let simply is not offered there**.
- Existing 3D landmarks become **demand sources** via their district:
  `D.landmarkDistrict[cityId][landmarkToken] = districtName` (London: Big Ben →
  Mayfair side of the river... authored explicitly, see data). A present (not
  era-gated-out) landmark adds +1 to its district's effective visitor rating
  (cap 2). Nothing is computed from rendered positions.
- **3D honesty for the slice city only**: London's city def gains a
  `districtZones` map (tile → district name) and slot assignment prefers slots
  in the property's own district (stable across reloads: assignment is a
  deterministic function of property id + district, not array order). Other
  cities keep index assignment — a defined, documented fallback, not silently
  wrong economics: no economic effect ever reads a rendered position.
- Rivers/crossings: irrelevant to economics by construction (district-level
  model). The 3D geography fixes (bridges/water) land independently first.

## 3. What the engine computes (all economics engine-side; UI never re-derives)

Per property per year, `PE.Property.rentAnnual` gains a mode factor:

- `long`: current formula, unchanged.
- `short`: `gross × shortLetBase (1.30) × visitorFactor × cycleFactor ×
  saturationFactor`, where:
  - `visitorFactor` = 0.85 / 1.0 / 1.15 for district visitor 0/1/2 (0 → short
    let not eligible at all; eligibility is visitor ≥ 1 AND rentable type:
    terrace, townhouse, lodging, tenement, apartment, house, studio, villa,
    penthouse — not land/warehouse/shop/office/tower);
  - `cycleFactor` (short let only): boom 1.25, growth 1.10, stagnation 1.00,
    recession 0.80, depression 0.60 — visitor demand vanishes in a crash;
  - `saturationFactor`: player's short-let share of a district above 25% of
    their properties there decays returns (`1 − 0.5 × max(0, share − 0.25)`),
    so converting a whole district is self-defeating; rivals' short lets count
    at half weight (you compete for the same visitors);
  - short-let operating cost +1.5% of value/yr (linen, agents, voids between
    guests) and condition decay +2/yr (turnover wear), folded into the
    existing cost/decay lines so reports stay coherent;
  - sticky-tenant systems (ENG-B6) apply to long let only; short let has no
    named tenant and no lease lock.

**No double-counting**: the Miami `tourism` city trait keeps its existing
whole-rent cycle multiplier (city identity); the short-let cycle factor is a
separate, mode-specific exposure. Choosing short let in Miami deliberately
stacks the two — that is a strategy, disclosed in the UI estimate, not a bug.
The `short_let` random event (digital era) stays as a one-off lease offer and
is unaffected.

## 4. Eligibility, costs, timing, switching

- Switch cost: 2% of property value (furnishing/refit), immediate.
- Cooldown: after switching, the mode is locked for 3 years ("the agent
  contract runs"), shown on the sheet. Switching a flagship or a property
  under renovation is refused (engine `PE.fail`, UI hides the action).
- Short let cannot hold a fixed lease; switching to short with an active lease
  is refused until the lease expires (shown, with years left).
- One switch per property per year max (switch + lock implies this).

## 5. Exploit boundaries (designed out before coding)

- Switch-spam: cooldown + conversion cost make cycling loss-making; a test
  asserts switching twice within the lock fails and costs apply once.
- Crash dodging: you cannot switch mid-year; the cycle applies for the whole
  year. Switching after the paper warns of a crash is allowed (a decision!),
  but the 3-year lock means you ride the crash you dodged into.
- Save/reload: mode, lock year, and costs live in property state; migration
  sets `letMode:'long'` when absent — deterministic, idempotent, no income
  duplication on reload (year resolution is unchanged in structure).
- Rivals: rival portfolios in visitor districts short-let a minority share
  (archetype-flavoured: Trader/Slumlord most, Hoarder never), feeding the
  saturation factor and the report's district lines. Same rules, same costs.

## 6. Information before commitment / after resolution

- Property sheet, "Letting strategy" block: current mode; for each mode an
  engine estimate payload — **gross range, cycle sensitivity label ("swings
  with the cycle" / "steady"), extra costs, expected net this year as a range
  (±comps noise, no false precision), and the saturation warning when near
  the cap**. Locked state shows years remaining.
- District identity surfaces: city screen district list gains the visitor
  rating (icon + word, not colour alone); the deals board listing sheet shows
  the district's visitor rating and the letting estimate for the listing's
  type (so the discovery loop — Diablo-style package evaluation — happens
  BEFORE purchase).
- City view: optional district overlay (toggle in the legend area) tinting
  district zones by visitor appeal with a text legend; short-let buildings
  show livelier window activity at dusk (RCT legibility). Normal view stays
  clean; overlay defaults off. All overlay info has a text equivalent in the
  district list (accessibility); everything degrades to the fallback list when
  WebGL is unavailable.
- Year report: per-property rent line shows the mode; a district note explains
  swing years ("Visitors vanished from Mayfair in the crash — your short lets
  earned £410 against £1,150 last year").

## 7. Caps, diminishing returns, rounding

- visitorFactor cap 2 (landmark boost cannot exceed it), saturation factor
  floor 0.75, cycleFactor as tabled. All money integer-rounded at the same
  points as existing rent lines; estimates are ranges, never point promises.

## 8. Save migration and fallbacks

- `letMode` absent → `'long'`; `letLockUntil` absent → 0. Migration is a
  versioned, idempotent step in the save loader (P6.3 versioning). Old saves
  gain nothing and lose nothing; London district zones are cosmetic for old
  saves (slot preference applies to new placements only — existing renders
  stay put; no property is ever relocated on load).
- Non-London cities: no zones → index assignment (status quo); no visitor
  rating → short let not offered (until §10 rollout proves the slice).

## 9. Acceptance criteria (measurable)

- Engine tests: eligibility matrix (type × visitor rating × lease/renovation/
  flagship states), switch cost charged once, lock enforced, saturation curve
  monotonic decreasing past 25%, cycle table applied, migration idempotent,
  no income duplication across save/reload mid-year.
- Determinism: same seed + same actions → identical state (existing test
  harness pattern).
- Balance: with a short-let-aware competent bot, full table stays 10/10 +
  4/4; short-let share among bot visitor-district properties lands 20–60%
  (neither ignored nor dominant); naive bot unchanged.
- UI: play.js green; slice flow exercised through the real UI (buy in a
  visitor district → compare modes → switch → see report line next year) at
  412×915 and 1280×800, screenshots reviewed; axe pass on the new controls.
- Phase 8 gate applies in full (goals inventory impact, victory paths, contest
  metrics) before the release is called complete.

## 10. Explicitly deferred (not in this slice)

Visitor ratings for the other 19 cities; transport/amenity proximity beyond
landmark-district boost (airports/stations — needs evidence the district-level
model earns it); commercial short-stay (apart-hotel offices); district
rezoning or player-driven district change; rival telegraphing of district
ambitions (research-backed, but a separate slice); per-tile 3D honesty for
non-London cities.

## 11. Inspirations used (synthesis of researched principles)

RCT/Theme Hospital visual legibility (the map explains the systems);
Diablo property-as-package discovery without rarity labels; Civilization
conditional location value (cycle/era revalue districts); XCOM consequential
commitment (3-year lock); Ultima Online place attachment (your building,
visibly working, in a named district). Rejected: rarity signalling, zoning
bureaucracy, per-night pricing micro, extra currencies.
