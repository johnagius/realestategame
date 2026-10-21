# Audit part 1 — Economy and game design

## A. Core loop (evidence from the committed recordings and the simulator)

**The player's own playtest proves nobody plays by hand.** `property-empire-recording-1812.json` covers months 0–750 (1750–1812) with timestamps: it is **one 41.6-minute session at 18 game-months per minute**, i.e. auto-advance nearly the whole time. `property-empire-recording-1851.json` covers months 1155–1214 in **2.5 minutes at 23.6 months per minute**. The game is designed to be watched, not played.

**Dead early game.** A Chen start buys two €6,000 studios on day one and then waits. Each studio pays €45 gross, about €29 net per month (payback ≈ 17 years). Recording milestones:

| Milestone | Game month | Game year |
|---|---|---|
| 2nd property | 0 | 1750 |
| 3rd property | 49 | 1754 |
| 4th property | 93 | 1758 |
| 5th property | 167 | 1764 |
| 10th property | 318 | 1776 |

Nothing the player does in those 300 turns changes the outcome. The clock is the only thing that happens.

**Runaway late game with no counterforce.** Same save, 1812 → 1851: 53 properties / €3.4M → **250 properties / €1.96B, zero loans ever taken**, rent €12M/month vs expenses €5M. Every counterforce in the code is capped or absent: portfolio synergy rewards size with up to +60% rent (`game.js:1092-1099`), property tax caps at 2.5% (`:1222`), rivals only buy what costs < 30% of their small net worth (`:1703`), market pressure rewards owning every slot (`:1399`), and managers auto-rent, auto-refurbish, auto-insure and auto-resolve decision cards (`:2839-2920`, `:4246-4303`). A scripted non-exploiting player reaches €15.8B by 1850; the real player was on the slow side.

**Rivals are a facade.** Each AI family is a net-worth scalar plus a property counter growing ~5%/yr (`game.js:1683-1760`). Starting wealth €5K–€60K. The opening objective "surpass the Okonkwos (€5,000)" is satisfied before the first click for a €14,000 Chen start (`game.js:143-153`). Toronto and Singapore unlock campaigns show "Ready · 100% there" at month zero; Vanderbilt pre-satisfies 7 of 20 city challenges at start. Armstrong is #2 on the leaderboard in year one.

**Every property is the same asset.** Price equals value; rent equals value × city yield × type multiplier (`data.js:930-940`, `game.js:1024-1047`). No mispriced deals, no information to discover, no reason to prefer one listing over another beyond condition. Negotiation (`game.js:379-392`) is a coin flip, and because `currentValue` is set to the accepted offer, a "discount" just buys a proportionally smaller asset: a no-op dressed as a mechanic.

**Leverage is a trap.** Net yield ≈ 6%; loan rates 3.8–6.5% + variance (`data.js` banks), repayments capped by tiny early income. 50-year Chen simulation: never borrow → €58,756; borrow at every opportunity → €28,536. The loan nudge fired six times in the first 34 months of the recording and the player passed every time. Correct instinct; the whole bank is dead weight.

**No fail state.** Foreclosure sells one property at 70% and the game continues (`game.js:1350-1368`). Decisions are two-button cards from eight templates for 280 years (`generateDecision`, `:4011-4243`); historical events are 17 cards across 3,360 turns.

**Breadth without depth.** 20 cities, 10 property types, 22 business types, stocks, bonds, player banks, mergers, managers, insurance, tax shelters, dynasty, prestige. Almost none is reachable in the first 30 minutes and, per section B, most of it is dominated, exploitable or dead.

**Ads.** Interstitial every 5 game months with no decision pending (`ads.js:15`, `app.js:508`): at speed 3 that is an ad every ~4–8 seconds of play.

## B. Secondary systems (measured with seeded scripts; reference curve = non-exploiting "smart" Chen player)

| Year | NW | Props | Cities | Tier | Rent/mo |
|---|---|---|---|---|---|
| 1755 | €20K | 4 | 2 | 0 | €80 |
| 1775 | €136K | 28 | 9 | 1 | €1.2K |
| 1800 | €8.0M | 226 | 20 | 2 | €92K |
| 1825 | €635M | 270 (all slots) | 20 | 4 | €4.6M |
| 1850 | €15.8B | 270 | 20 | 5 | €118M |

### 1. Businesses & stakes — CUT
Annualised return 2.8–5.1% for every type in every era (tech 7.0%, nightclub 6.1% only in the Information Age) vs 6.2–7.4% net cash yield plus appreciation for property. Dividends round to €0–€1/mo in 1750. `getControlLevel` is never consulted by any mechanic except enabling the merge button. **Merger exploit** (`game.js:2523`): acquisition costs 85% of the target's available stake value but the acquirer gains 100% of the target: with a €50K acquirer and a €1M target, +€118,500 instantly, repeatable on every spawned business from 1870.

### 2. Stocks / bonds / commodities — FIX (worst exploit in the game)
- Prices are integer euros updated by `Math.round(price*(1+Δ))` (`game.js:2777`) with `eraScale` floored at 0.15 (`:2611`): all four commodities return exactly 0% in 1750; silver, cotton, tea and coal stay frozen through 1980.
- From 1870 price drift and coupon both use the yield: gov bond 6.3–7.9%/yr (nominal 4%), tech stocks 25%/yr (min path 13.6%). All beat property with no slots, tax or maintenance.
- **Infinite money**: `buyInvestment` charges the fixed era `unitPrice` (`:2712`); `sellInvestment` pays `currentUnitPrice` (`:2748`); adding to a holding leaves the current price untouched (`:2721`). After 5 years of tech stocks one buy-then-sell of 1,000 units = +€1,436,000, repeatable.

### 3. Savings and player banks — CUT
Savings 2%/yr vs 6–7% property. `openBank` moves capital out of cash and `getNetWorth()` (`:4555`) does not count bank capital or reserves: opening a €1M bank drops NW by €1M. Over 240 months the bank paid 2.67%/yr to cash and there is no withdraw/close function. Interest is double-booked (`:2470` and `:2492`).

### 4. Managers — FIX or CUT
Expected tenant-problem loss is 2.93% of rent/month; a manager removes `quality×50%` of it (0.9–1.3% of rent) while charging 5–12% (`:2912`). Every manager reduces final cash in a 120-month test (−€395K to −€1.10M). Auto-mitigation buys every −EV option; auto-refurb picks the dominated budget tier for quality < 0.8 (`:2864`); `tryManagerAutoDecision` auto-accepts `city_dominance` (recording: "James O'Brien invested €32.35M" for ≈€3M of value), emergency repair at 15% of value, security at 2%. Manager settings have no UI. The feature removes agency and charges for it.

### 5. Disasters, mitigations, insurance — FIX
Expected annual loss 2.0–3.6% of value per city, of which only the cash-damage component (0.7–1.2%/yr) is insurable; condition drops and the permanent value hit (`:1003`) are never covered. Basic insurance: net −0.33% to −0.66%/yr in every city; premium −0.66% to −1.29%/yr. Only fire alarm (+0.10%/yr) and São Paulo security (+1.0%/yr, the one trait that creates a decision) are rational. Upkeep rounds to €0 below €333–€2,500 value.

### 6. Tenants — FIX
`adjustRent` checks tolerance only against the current tenant (`:512`): set 120% while vacant, then rent out; the multiplier persists forever. Problem chance is independent of the multiplier, so 120% is always correct. Tenant type is random, satisfaction is display-only. `evictTenant` costs `max(500, rent)` (`:528`) while "Stop Renting" does the same for €0. `premiumRent` is never cleared (`:1030`, `:4454`): a 1846 premium lease froze rent at €999 while market rent recomputed to €48.

### 7. Refurbishment tiers and build-on-land — FIX
Standard refurb costs 4–15% of value and adds +12% with zero fail (`:558`): NW +6 to +8 per 100 instantly, so every degradation roll pays the player. Budget (no value boost, 20% fail) and luxury (2× cost, 10% fail) are strictly dominated. Build-on-land (`:607-644`) yields the full midpoint value at Excellent for 35–70% of it: 1.9× value per euro on warehouses; a flip loop (buy land, build, sell at 97%) returns +87% per 5 months in 1750. Demolish burns 80% of value and is never rational.

### 8. Random and historical events — FIX
City events hit an owned city 60% of the time, one city at a time (`:1552-1560`): expected value drift **+6.3%/yr with one city vs +0.7% with twenty**. Concentration nearly doubles appreciation while every goal pushes expansion. Historical choices: every gamble is +EV, every boost is free money, every "sell/flee/panic" option just crashes your own holdings without selling anything (`data.js:808`, `:826`); 2008 has no non-negative choice except buying. `cycleEffect.disaster` and `newProps` multipliers are computed and never used.

### 9. Dynasty — CUT or merge into run-ending prestige
`getTraitBonus` (`:3096`) is never called. Succession tax is 10% of cash, not NW: 0–4% of NW per generation. `noHeir` sets a flag and nothing changes; the game continues with zero family members. Educate/marry/scandal resolvers exist but nothing generates them.

### 10. Prestige — FIX
`cashBonus = 1 + score×0.02 + level×0.15` with an uncapped score (`:2984`): the 1850 state already scores 982 → ×20.6 starting cash (Chen begins NG+ with €289K when a studio costs €6K). Offered only at year 2030, which nobody reaches.

### 11. Achievements, goals, tiers, city challenges — FIX all
Achievement rewards are era-scaled (first purchase €25 in 1750); era achievements are free for waiting. Monthly goals persist until done: "Buy in a new city" sat uncompleted for the last 600 months of a run; "Earn €X in rent" is satisfied by taking a loan. Decade goals re-roll into pre-satisfied targets (`min(5, cityCount+3)`, "rank #1" when already #1) and pay 2% of NW each: 26 instant completions, **87% of NW paid out over a run** (€482M by 1850) plus +10 reputation each. Campaign tiers 1–5 are reached 1772/1788/1800/1813/1830, i.e. the whole arc fits in the first era and a half. City challenges: Rome and Toronto pre-satisfied for Chen; Armstrong adds Sydney and Singapore; Vanderbilt passes 7 of 20 at start. Paris "flip for profit" is any sale, including a loss.

### 12. Auto-sell, shelters, cycle, inflation, pressure, spawns, traits
Auto-sell harmless. Tax shelter floor €300 / cap €8,000 is era-unaware (50–250-year payback in 1750, 0.3-year payback late). Cycle long-run rent multiplier 0.957 (a flat tax with no counter-play). Inflation drift is dead code economically. Market pressure (+0.8%/month when a city is fully owned) is what turns 226 properties in 1800 into ×50 rent by 1825. "Affordable studio" spawn threshold is hard-coded at €10,000 (`:1521`), so late markets are empty (recording 1851: London market count 1). Traits that change a decision: elite_enclave, density_premium, crime_pressure, tech_hub, redevelopment. Passive or negative: rent_control, tourism_boom, heritage_city, boom_bust, foreign_buyer, tax_haven, monsoon_market (net −1.25%/yr, pure penalty).

### 13. Exploits and rounding (all confirmed in-engine)
1. Investment buy-at-base / sell-at-current: +€1.44M per click.
2. Merger 85%-for-100%: +€118.5K per business.
3. Rent 120% pre-set while vacant: permanent +20%.
4. Standard refurb NW-positive on every degradation.
5. Build-on-land 1.4–1.9× value per euro; +87% flip loop.
6. AI buyout offers at 130–170% with no fee; accept, rebuy at 107%.
7. Lowball negotiation is free to retry and the "discount" is a no-op.
8. Goal fountains: 87% of NW over a run.
9. Pre-industrial rounding (era ×0.05): investments frozen, dividends €0, upkeep €0, license `max(1,…)` makes a €1,000 plot pay 1.2%/yr, eviction floor €500 = 10–100 months' rent; starter studios use a 1% license instead of 0.3% (`data.js:1018`), which is where the 18-year payback comes from.
10. Stranded assets: era transitions only relabel; owned properties are never re-based while spawns jump ×2–2.4. Recording 1851: 43 of 250 properties are worth under €5,000 (min €256), earning €3–€46/mo and generating "emergency repair (€45)" cards.

## C. Verdict table

| # | System | Verdict | Reason |
|---|---|---|---|
| 0 | Core rent-compounding loop | **REPLACE** | Dead early game, runaway late game, no decisions, no fail state |
| 1 | Businesses & stakes | CUT | Dominated; merger arbitrage |
| 2 | Investments | FIX (later era unlock) | Frozen prices, double-counted yield, infinite money |
| 3 | Savings & player banks | CUT | Negative value, no withdrawal |
| 4 | Managers | FIX | Fee ≫ benefit; removes agency |
| 5 | Disasters & insurance | FIX | Insurance never rational |
| 6 | Tenants | FIX | One dominant setting |
| 7 | Refurb tiers & build | FIX | Standard is a money printer; others dominated |
| 8 | Events | FIX | Anti-diversification subsidy; trap choices |
| 9 | Dynasty | REBUILD | Currently cosmetic |
| 10 | Prestige | FIX | ×20 cash; unreachable |
| 11 | Goals/tiers/challenges | FIX | Pre-satisfied; goal fountains |
| 12 | Cycle/traits/spawns | KEEP core, FIX details | 5 of 12 traits matter |
| 13 | Exploits & rounding | FIX | Ten confirmed |
