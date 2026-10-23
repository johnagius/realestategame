# P8.1 Winning Inventory — complete audit backbone

All paths verified in code at engine v8.9.0 / `Game.version` 8.9.0 (`js/engine/game.js:9`). Citations are `file:line`.

---

## 1. Victory conditions — what happens at 2030

**There is no numeric win threshold for the campaign.** Reaching `endYear` is the victory.

- `D.endYear = 2030` (`js/engine/data.js:11`); campaign `s.endYear = opts.endYear || D.endYear` (`js/engine/state.js:159`).
- End-of-run trigger: `js/engine/turn.js:124` — after the year increments past `endYear`, `s.status = 'ended'` (or stays `'bankrupt'` if the final year also bankrupted), `rep.ended = true`. Further `endYear` calls fail: `turn.js:39`.
- Final achievements check: `turn.js:141` — on the last report (`rep.ended && !rep.bankrupt`) `PE.Goals.checkAchievements` runs once more, which is where **`the_long_game`** ("Reach the end of the campaign with the house standing", rare) is awarded; its check is `s.status === 'ended' && s.year > s.endYear` (`js/engine/goals.js:141`).
- End screen: `js/ui/year.js:353-377` `showEnd()` — titlecard "The year 2030 / The House of X endures" (or "has fallen"), showing: generations, cities, net worth, **rank #n** (from `Game.summary`), net-worth sparkline (`Game.legacy().timeline`), **legacy score**, achievement count, and legacy-point balance. Buttons: **Continue as the heir** (only when bankrupt, `year.js:372`) and **Start a new dynasty** (`end-new`, `year.js:384-390`). No "league"/"tier" verdict beyond the raw rank number and the score; no explicit "you won/lost" verdict for the campaign — surviving to 2030 *is* the win, and bankruptcy before it is the loss (bible §8/§9, `docs/REDESIGN.md:251`).
- Legacy recording: `Game.recordLegacy` (`game.js:52-62`) — idempotent per run via `s.legacyRecorded`; prestige points = `max(run ≥ 10 years ? 1 : 0, floor(score/500))` (`game.js:64`). `Game.newDynasty` (`game.js:66-71`) records then starts fresh.

## 2. Campaign tiers (structured dynasty objectives)

`D.campaignTiers` (`js/engine/data.js:949-956`), sequential, state `s.goals.campaignTier`:

| Tier | Requirements | State fields checked (`goals.js:96-104`) |
|---|---|---|
| foundation | 3 props + NW ≥ 1.5× start | `propertyCount`, `startNetWorth` |
| landlord | 6 props + 2 cities unlocked | `unlockedCities` |
| dynast | generation 2 + NW ≥ 10× start | `dynasty.generation` |
| magnate | 5 cities + rank ≤ 3 | `St.rank()` |
| empire | 25 props + NW ≥ 100× start | — |
| legend | rank 1 + 10 cities + generation 4 | — |

- No deadline. Detection: `G.evaluate` while-loop (`goals.js:183-188`) — multiple tiers can complete in one year (catch-up by design). Reward per tier: cash `2% of NW` + `+3 rep`, applied immediately. Recorded: `campaignTier++`, report entry, analytics.
- Displayed in the deals goals strip (`js/ui/deals.js:37`).

## 3. Era goals

`D.eraGoals` (`data.js:959-966`), one per era, assigned at new game and each era change (`goals.js:66-70`, `turn.js:123`); deadline = `era.to`; state `s.goals.era {done, failed}`, `s.goals.eraDone{}`:

| Era (years) | Goal | Kind | Check (`goals.js:71-82`) |
|---|---|---|---|
| victorian (–1899) | 3 buildings in one London district | district_count | district `playerCount`-derived count per district |
| gilded (–1929) | property in 3 cities | cities | `citiesWithProps ≥ 3` |
| crisis (–1949) | no forced sales this era + cash ≥ 10% NW, **only satisfiable at the deadline year** | survive | `forcedSalesThisEra === 0 && cash ≥ 0.10·NW && year ≥ deadline` |
| boom (–1979) | 15 properties | props | — |
| modern (–2007) | own a tower | type | tower exists from era 4 (1980) — matches |
| digital (–2030) | top the leaderboard | rank | `St.rank() === 1` |

- Reward: cash `3% of NW` + `+5 rep` (`goals.js:174`). Failure at deadline: `failed = true` (`goals.js:175`) — **no penalty**, just missed. `survive` failure mode: a single forced sale in the era makes it uncompletable for the rest of the era while still displayed (progress reads "Failed: a forced sale happened", `goals.js:88`).
- Era transitions also fire a **title card** (`js/ui/year.js:119,126-143` with `assets/era/*.svg` plates) and an **era set-piece event** (`D.eraSetPieces`, `data.js:672-683`, pushed at `events.js:45-48`) — 2-choice decision events, presented as ceremonies, not scored goals.

## 4. Yearly goals

`G.yearlyTemplates` — 10 templates (`goals.js:10-21`). One assigned per year at `endYear` (`turn.js:139`) and at new game (`state.js:249`). Reward: `max(10·priceIndex, 1% of NW)`, ×2 with `purist` perk (`goals.js:22`); plus `+1 rep` (`goals.js:167`). State: `s.goals.yearly {id, baseline, year, reward}`, history in `s.goals.history`, counter `s.stats.yearlyGoalsDone`.

Selection logic (`goals.js:30-47`): candidates must pass `available(s)` and not repeat last year's id; a chosen goal already satisfied at assignment is swapped once (`goals.js:44`). Templates: `buy_below, renovate, nw_up (+8% NW), cash_cushion (cash ≥ 15% of debt), fix_condition (all > Poor), rent_up (+15%), unlock_city, reduce_ltv (−5 pts), sell_profit, reputation_up (+3)`.

**Comeback track (P3.5)** — replaces yearly goals after bankruptcy while `s.comeback` lives (`goals.js:25-29,32-37`): `comeback_black` (net cash flow > 0) → `comeback_rebuild` (own 2 buildings) → `comeback_recover` (NW ≥ 50% of pre-fall peak `s.comeback.from`). Reward 1.5× normal; completing stage 3 clears `s.comeback` (`goals.js:171`).

**Family-track leaning (P5.1)**: while Armstrong's family goal is open, `reduce_ltv` is triple-weighted (`goals.js:41`).

## 5. Family goal track (P5.1)

`G.familyTracks` (`goals.js:56-58`): only **armstrong** — "LTV below 50% by 1860", `deadline 1860, kind ltv_below, target 0.5`. Assigned at new game only for `armstrong` and never in scenarios (`state.js:220`). Check `goals.js:64`: requires ≥1 property (selling everything does not satisfy it). Reward 3% NW + 5 rep (`goals.js:179`); **failure: `failed=true` and −5 rep** (`goals.js:180`). State `s.goals.family`.

## 6. Achievements (45, P5.5)

`D.achievements` (`data.js:869-915`), checks `goals.js:107-158`, recorded in `s.goals.achievements[]` (per-save, not meta — "each dynasty polishes the cabinet afresh", `js/ui/extras.js:206`). No cash reward; they feed legacy score (×(1+n/10), `goals.js:217`) and challenge score (+25 each, `goals.js:224`). Detection: swept every `endYear` in `G.checkAchievements` (`goals.js:191-197`). Categories: deals / finance / survival / dynasty / cities / rivals; six flagged `rare` (`portfolio_40, the_long_game, wealth_1000x, generation_6, merger, all_cities`). No deadlines. All counters verified to exist (`stats.*` increments in market.js/property.js/turn.js/dynasty.js/events.js). Start-state invariant enforced by tests (`js/sim/tests.js:240-259` — all 4 families, 3 scenarios, 1 challenge).

## 7. Legacy score & prestige perks

- Legacy score (`goals.js:214-218`): `generation × log10(NW/startNetWorth) × cities × rep/50 × (1+achievements/10) × (1+0.25·mergers) × 100`.
- Prestige store (`game.js:75-94`, UI `js/ui/extras.js:42-75`): 12 perks (`data.js:920-932`), passive vs mode; bought with legacy points from meta (`pe_v8_meta`); mode perks toggled via `meta.modes`. Perks change rules (LTV caps, purist no-mortgages, crisis start → forces scenario `crash1929` at `state.js:157`, second city → Paris unlocked at start `state.js:236`, own bank → P4.2 banking from 1980).

## 8. Weekly challenge (P5.3)

- `Game.newChallenge` (`game.js:107-114`): ISO-week seed `hashSeed('pe-challenge-'+week)` (`game.js:98-105`), fixed family `chen`, random positive trait derived from seed, `endYear = 1850+30−1 = 1879` (`balance.challengeYears = 30`, `data.js:573`).
- **Win condition: none — it is a score sprint.** `challengeScore` (`goals.js:220-225`): `NW multiple ×100 + rep + 25×achievements + 50×(generation−1)`; **0 if bankrupt**.
- Recording: `Game.recordChallenge` (`game.js:115-121`) called from `turn.js:132` when the run ends **or bankrupts**; idempotent via `s.challenge.recorded`; best/runs in `meta.challenges[week]`. Local leaderboard `js/engine/lb.js` wraps `recordChallenge` (submit on finish, `lb.js:87-106`).
- UI lobby: `js/ui/extras.js:78-137`. Reward: none besides the recorded best. Deadline: implicit (week rolls over; old weeks' history kept).

## 9. Era-start scenarios (P5.4)

`D.scenarios` (`data.js:938-945`): **crash1929** (depression, 5 props @64% LTV, cash ×0.34, london+new_york), **oilshock1973** (recession, 60% LTV, london+paris), **gfc2008** (depression, 55% LTV, london+new_york). 15-year runs (`balance.scenarioYears=15`), `endYear = min(2030, start+15)` (`state.js:159`). World fast-forwarded deterministically (`state.js:264-282`), pre-built leveraged portfolio (`state.js:284-297`).

- **Win condition** (`turn.js:126-131`): at `rep.ended`, `result = NW ≥ s.scenario.targetNetWorth ? 'won' : 'lost'`; target = the scenario's start NW (`state.js:248`). Bankruptcy at any point sets `result='lost'`. Headline differs per outcome. No numeric reward; result shown on the end screen via `Game.legacy().scenario`.
- UI: `js/ui/extras.js:140-169` ("Win: hold net worth at or above your starting line for 15 years").

## 10. Bankruptcy, margin calls, comeback — how losing works

- **Margin call** (`finance.js:170-191`): property LTV > 85% (`covenantLtv`) → `p.marginCall {year, shortfall}`; unanswered next year → forced sale at 85% (`forcedSaleFactor`), `+3 rep loss`, counters `forcedSales/forcedSalesThisEra/marginCallsMissed/forcedSaleYears`. Clearing paths: `repay` (`finance.js:146`) or `refinance` down (`finance.js:132`) — only `repay` increments `marginCallsCleared` (achievement `covenant_kept`).
- **Bankruptcy** (`turn.js:91-117`): NW < 0, **or** 2 consecutive negative-cash years with nothing sellable, **or** 2 forced sales within `marginCallWindowYears = 2`. Sets `status='bankrupt'`, `endReason`, rivals immediately absorb all but the best-equity building (P3.5), `s.comeback = {from: peakNW, year, stage: 0}`.
- **Continue as heir** (`turn.js:221-242`): keep best building (mortgage capped at 70% of value, margin call cleared), cash = max(20·priceIndex, 10% of cash), rep reset to 40, board refreshed, yearly + era goals reassigned, comeback track starts. New head from adult children (or nothing changes generation-wise if none — head dies only if adult kids exist, `turn.js:236-237`).
- Alternative: `end-new` → `Game.newDynasty` — legacy recorded once, fresh run with prestige perks.
- Bankruptcy on the final year: status stays `'bankrupt'` (turn.js:124); a 1-year comeback window exists (next `endYear` re-triggers `ended`).

## 11. Random/generated goals & offers

- **Yearly goals** are the only procedurally drawn goals: `R.pick` over feasibility-filtered templates (`goals.js:31-44`). Fallback pool (`nw_up`, `buy_below`) is used **without re-checking `available()`** when no candidate qualifies (`goals.js:38`).
- **Weekly challenge**: seed-derived, fully deterministic (RNG state lives in the save, `rng.js:16-22`); feasibility of the board is whatever the seed deals — no feasibility guarantee beyond the no-goal-at-start test for one week (`tests.js:259`).
- **Rival offers** (`rivals.js:274,327-342`): yearly, chance `0.25 × aggression`, premium 110–140% of true value, expire each year (`rivals.js:191`). Advisor flags the first one (`advisor.js:94`).
- **Rival bankruptcy receivership offer** (`rivals.js:344-356`): pushed as an event only if player cash ≥ price — feasibility-checked at generation.
- **Advisor "firsts"** (`js/ui/advisor.js`): 8 one-time-per-device bubbles (margin call, auction, rival offer, forced sale, succession, negative cash, era, stretch) — presentation, not goals.
- **Guide** (`js/ui/guide.js`): first-3-years tutorial state machine derived from engine facts.
- **Era set-pieces / historical events / random events**: decision events with fixed choice sets (`data.js:602-649`, `672-683`, `689+`), not tracked as goals.

## 12. Save/reload persistence

- `SAVE_VERSION = 2`, one migration 1→2 (`js/engine/storage.js:23-54`) covering: `mode, scenario, challenge, legacyRecorded, perks, relations, ranks, goals.family, dynasty.alliances/proposals/mergers`, new v2 stats defaults, flags. Three slots + legacy-key migration (`storage.js:58-76`).
- All goal state lives in `s.goals` / `s.comeback` / `s.stats` / `s.challenge` / `s.scenario` — persisted. RNG counter `s.rng` persisted (deterministic across reload). `bhvLog` lazily created for old saves (`turn.js:146`); `scriptedCycles/histShift` fall back to data tables for old saves (`state.js:101-102`).
- Meta (`legacyPoints, runs, perks, modes, challenges`) is separate from run saves (`storage.js:149-159`) — survives dynasty resets by design.

---

# Findings

## A. Contradictions / rule-violating combinations

1. **Armstrong × `purist` perk: family goal satisfied at game start.** `assignFamily` runs for any non-scenario Armstrong game (`state.js:220`); `purist` strips all starting mortgages (`state.js:237`) → LTV 0 < 0.5 → `familySatisfied` true from day one → auto-rewarded (3% NW + 5 rep) at the first `endYear`. This violates the non-negotiable "never ship a goal satisfied at game start", and the test suite does **not** cover it: the all-families loop checks yearly/era/campaign/achievements but not family (`tests.js:245-248`); the scenario loop that does check family uses only `chen` (`tests.js:252-256`). No test combines perks with families.
2. **`the_long_game` (rare, "Reach the end of the campaign") fires for scenarios and challenges.** Check is `status==='ended' && year > endYear` (`goals.js:141`) with no mode gate; `turn.js:124,141` set/call this for every mode. A 15-year scenario or 30-year challenge awards the campaign's rarest survival trophy.
3. **`survivor`/`two_depressions` vs description.** Counter increments only if `forcedSalesThisEra === 0` (`turn.js:85`) — a forced sale in the same era but *years before* the depression blocks "come through a depression without a forced sale". Desc says nothing about era scope.
4. **Yearly `sell_profit` desc ≠ check.** Desc "Sell a building for more than you paid"; check is only `stats.sold > baseline` (`goals.js:19`) — any sale (even at a loss, even a forced-adjacent or rival-offer sale) completes it.

## B. Goals impossible or near-impossible while displayed as active

5. **crash1929 gilded era goal is effectively impossible.** Scenario starts 1929 with london+new_york; era goal "property in 3 cities before 1930" is evaluated once, at `endYear` 1929 (deadline = era end). Unlocking a third city requires `repRequired = min(90, 44 + 4·(n−1) + tier·3)` = 51 for the cheapest tier-1 cities with n=2 (`cities.js:14-17`), but Chen starts at reputation 50 (`data.js:172`) — one point short, with no during-year rep source guaranteed (the day-one 1929 historical event offers no rep; random events arrive only at year-end, too late). The goal is offered and failed in the same breath. Same one-year-deadline pattern applies to any scenario starting in an era's final year.
6. **gfc2008 digital era goal outlives the run.** Deadline 2030, but the scenario ends 2023; if rank #1 isn't reached in run time, the goal shows "in progress" forever (never marked failed). Cosmetic but displayed-as-active past the point of no return.
7. **Yearly fallback pool bypasses feasibility.** When no template passes `available()`, `nw_up`/`buy_below` are offered unchecked (`goals.js:38`) — `buy_below` can be offered with an empty/again-empty board; `nw_up` with NW ≤ 0 becomes trivially satisfied (baseline negative → target = 1.08 × negative). Also the one-shot swap at `goals.js:44` picks the first *other* available template without re-running its `check` — `fix_condition` can be assigned already satisfied if the only sub-40 building is mid-renovation (its `check` exempts `p.renovation`, its `available` doesn't).
8. **`crisis` survive goal fails silently-early.** One forced sale any time 1930-1949 makes the era goal uncompletable for up to 20 years while still listed (progress text does say "Failed", but `failed` is only set at the deadline, `goals.js:175`).

## C. Rewards that can apply twice

9. **Era goal re-armed by bankruptcy comeback — double reward.** `continueAsHeir` calls `assignEra()` (`turn.js:239`), replacing `goals.era` with a fresh `{done:false}` object even if the era goal was already completed that era. `eraDone[era.id]` is written (`goals.js:174`) but **never read anywhere**. A mid-era bankruptcy → continue-as-heir lets the same era goal pay out 3% NW + 5 rep a second time. Compounding: `continueAsHeir` also resets `stats.forcedSalesThisEra = 0` (`turn.js:232`), un-failing the crisis `survive` goal.
10. **Challenge score locked at 0 by a mid-run bankruptcy.** `recordChallenge` runs at *bankruptcy* as well as at end (`turn.js:132`) and sets `s.challenge.recorded = true`; if the player continues as heir and finishes strongly, the final `recordChallenge` no-ops — `meta.challenges[week].best` keeps the bankruptcy score (0) and `runs` is already counted. The live HUD score (`Goals.current().challenge`) keeps climbing, disagreeing with the recorded best.
11. **Scenario loss is not sticky.** Bankruptcy sets `scenario.result='lost'` (`turn.js:127`), but a comeback run that reaches the scenario end overwrites it with `'won'` if NW ≥ target (`turn.js:128`). Intent unclear; either is defensible but the intermediate UI (`Goals.current().scenario`) shows "lost" for a run that can still win.

## D. Completion state vs save/reload

12. Persistence itself is sound (all goal state serialised; RNG seeded in save; migration covers the v2 goal fields; `legacyRecorded`/`challenge.recorded` idempotency flags persist). Two gaps:
    - **`Game.deleteSave()` with no slot always deletes slot 1** (`game.js:46` → `storage.js:58-63` default slot), but the UI calls it slot-less from `end-new` (`js/ui/year.js:387`) and settings delete (`js/ui/dynasty.js:202`). If the ended/current run lives in slot 2 or 3, the wrong save is deleted: the ended run's save survives (re-continuable into a permanent end screen via `app.js:13`), and an unrelated slot-1 game is destroyed. Severe data-loss-adjacent bug on the P6.3 slot feature.
    - Old (v1) saves get no `scriptedCycles` migration — they silently revert to the *unjittered* historical crash calendar (`state.js:101`), changing mid-run world behaviour across an upgrade. Acceptable if intentional; undocumented.

## E. Visibility gaps (goals the player cannot see)

13. **The Armstrong family goal is never displayed.** No UI surface reads `Goals.current().family`: the deals strip shows yearly/era/campaign only (`deals.js:33-37`), the year report's "in progress" section filters to `kind==='era'` (`js/ui/year.js:247`), and the dynasty screen shows only achievements (`js/ui/dynasty.js:72-79`). A goal with a hard 1860 deadline and a −5 rep failure penalty is invisible until the year it completes or fails — and even its failure line is filtered out of the report (the penalty applies silently). This matches HANDOVER's note that Phase-3/5 UI was lagging (`docs/HANDOVER.md:235`).
14. **Failed yearly goals are invisible too** — yearly `progress` entries (`done:false`, `goals.js:172`) are dropped by the same `kind==='era'` filter (`year.js:247`); the player never learns a yearly goal was missed.

## F. Non-issues verified (for the record)

- Campaign tiers: no deadlines, multi-completion in one year is intentional catch-up; none pre-satisfied (tested across families/scenarios/challenge).
- Bankruptcy/comeback can't soft-lock: `endYear` blocked while bankrupt (`turn.js:40`), heir path always available; comeback goals replace yearly goals deterministically; second bankruptcy re-seeds `s.comeback` cleanly (`turn.js:115`).
- `cash_cushion`/`reduce_ltv` correctly excluded for `purist` runs by `available()`; only the family track escapes (finding 1).
- `second_city`/`five_cities` achievements can't be pre-satisfied by scenario or perk city unlocks (`citiesUnlockedSinceStart` uses `cityUnlockYear > startYear`, `goals.js:106`; perk/scenario unlocks are stamped `= startYear`).
- Era-goal deadline years are inclusive and consistent with desc text ("before 1900" ⇔ deadline 1899), except digital's "before 2030" actually includes endYear-2030 evaluation (off-by-one wording at most).

---

# Disposition (tracking the fixes; commit hashes as they land)

| # | Finding | Status |
|---|---|---|
| 1 | Armstrong × purist → family goal satisfied at start | pending (state.js, after slice engine lands) |
| 2 | `the_long_game` fires in scenarios/challenges | pending (goals.js mode gate) |
| 3 | `survivor`/`two_depressions` era scope vs desc | pending (desc or counter) |
| 4 | yearly `sell_profit` desc ≠ check | pending (real profit check) |
| 5 | crash1929 gilded era goal impossible (rep 50 < 51) | pending (scenario/goal data) |
| 6 | gfc2008 digital era goal outlives the run | pending (goal assignment) |
| 7 | yearly fallback pool bypasses `available()` | pending (goals.js) |
| 8 | crisis `survive` fails silently-early | pending (set `failed` on the forced sale) |
| 9 | era goal re-armed by comeback → double reward | pending (read `eraDone` in `assignEra`) |
| 10 | challenge score locked at 0 by mid-run bankruptcy | pending (recordChallenge re-record at end) |
| 11 | scenario `lost` not sticky after comeback | pending (first terminal result sticks) |
| 12 | slot-less `deleteSave` wipes slot 1 | **fixed df14e39** (UI passes the run's `saveSlot`) |
| 13 | Armstrong family goal never displayed | **fixed 5907c58** (deals strip family row) |
| 14 | failed yearly goals invisible in the report | **fixed 5907c58** (report progress section) |