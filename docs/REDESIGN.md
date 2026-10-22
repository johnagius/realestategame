# Property Empire — Redesign Bible (v8)

This document is the single source of truth for the rebuild. It replaces the
"watch rent compound for 280 years" economy with a **deal-making, leverage and
dynasty** game. Everything below is a design decision, not a suggestion; change
it here first if you change it in code.

Related: `docs/AUDIT.md` (why the v7 game fails), `docs/TASKS.md` (phased plan).

---

## 1. Core fantasy and pillars

**Fantasy:** "I started with one shabby room in 1850 London. By 2030 my family's
name is on the skyline." You are an appraiser, a negotiator, a risk-taker and the
head of a family. You win by seeing value other people miss, borrowing bravely
but not stupidly, surviving the crash everyone else is caught in, and handing a
bigger empire to your heir than you inherited.

**Pillars** (every feature must serve at least one; if it serves none, cut it):

1. **Every turn has a decision with a non-obvious answer.** Deals are mispriced
   and you must appraise them under uncertainty. There is never a button that is
   always right.
2. **Growth has a price.** Leverage can kill you. Size costs management, tax and
   attention. Rivals grow with you. The late game is harder, not easier.
3. **The city shows your story.** The 3D map is the save file made visible:
   your buildings, your colour, your era, your scaffolding, your tower.
4. **One more year.** A turn is a year. Each year ends with a report that closes
   a story and opens a cliffhanger.
5. **Dynasties are fragile.** People age, die, inherit, marry and disgrace
   themselves. Succession is the natural chapter break and the main long-term
   counterforce.

**Anti-goals:** no auto-advance as the primary way to play; no feature that
makes the player's choices irrelevant (managers that decide for you); no
pre-satisfied objectives; no rivals that are only a number.

---

## 2. Time and session structure

- **Turn = 1 year.** Start **1850**, end **2030** → 180 turns. A turn takes a
  motivated player 30–90 seconds. A campaign is 2–4 hours. Replayability comes
  from families, dynasty outcomes, prestige and challenge seeds (section 11).
- Internally the engine may still track months for refurbishment/build timers
  (e.g. "ready in 8 months" = ready next year), but **the only clock the player
  sees is the year**.
- **Eras** (visual + mechanical chapters): Victorian 1850–1899, Gilded 1900–1929,
  Crisis & War 1930–1949, Boom 1950–1979, Modern 1980–2007, Digital 2008–2030.
  Era change = new property types, finance tools, building styles in 3D, a
  scripted event.
- **Year flow (the loop):**
  1. **Morning paper** (0–1 cards): macro news (rates, cycle), city news,
     dynasty news. Foreshadowing: "Bankers whisper of trouble next year".
  2. **Deal board:** 4–8 listings per unlocked city. Appraise, offer, bid.
  3. **Portfolio actions:** renovate, set rent, refinance, sell, hire/fire.
  4. **End year** → the engine resolves rent, costs, mortgages, appreciation,
     rivals, events with choices (max 2 per year), dynasty.
  5. **Year report:** cash flow, equity change, headline, rank move, goal
     progress, and the cliffhanger line. "Continue to 1867 →".
- **No free-running auto-advance.** Replace the speed buttons with
  "**Skip quiet years**" that advances until something needs a decision
  (deal worth bidding on, event, goal, danger) and never more than 5 years.
- Natural stopping points: year report, era transition, succession. These are
  also where ads (if any) and save-sync happen.

---

## 3. Properties and the market

### 3.1 Property model
```
{
  id, cityId, district, type, era, name,
  sqm, condition: 0..100 (continuous, shown as Derelict/Poor/Fair/Good/Prime),
  trueValue,        // what a fair buyer pays today (hidden, drifts)
  askingPrice,      // only on listings
  seller: 'estate'|'distressed'|'developer'|'landlord'|'rival:<id>'|'auction',
  yearsListed,      // listings only
  ownerId: 'player'|'rival:<id>'|null,
  rentAnnual, rentSetting: 0.8..1.2, occupancy: 0..1, tenantClass,
  mortgage: { principal, rate, type:'io'|'amort', yearsLeft, lender } | null,
  renovation: { tier, yearsLeft } | null,
  purchasePrice, purchaseYear, history: [{year, value}]
}
```

### 3.2 Value, rent, costs (annual, all in year-of-play money)
- `trueValue = sqm × districtPricePerSqm × typeFactor × conditionFactor`
  - `conditionFactor`: Derelict 0.55, Poor 0.75, Fair 0.9, Good 1.0, Prime 1.12
- `districtPricePerSqm` drifts yearly: `city.growth + cycle + gentrification + noise`.
  Districts have a **trend** (declining / stable / up-and-coming / hot) that is
  visible as a 1–5 arrow indicator but noisy; up-and-coming districts are the
  speculator's edge.
- **Gross yield** by city/type: 5–11%. `rentAnnual = trueValue × yield × conditionRentFactor × rentSetting`.
  Rent setting above 1.0 raises vacancy risk; below 1.0 attracts long tenants.
- **Operating costs** per year: maintenance 1–2% of value (higher when condition
  is low), property tax 0.3–1.2% by city, management (section 6), insurance
  optional.
- **Net yield** lands at 4–8%. Appreciation 1–5% by city/era. Unleveraged total
  return ≈ 7–12%/yr, leveraged ROE ≈ 15–25%/yr. This is the intended power curve.

### 3.3 Deals (the heart)
Every listing has an asking price that is **mispriced** relative to true value:
`askingPrice = trueValue × m`, with `m` drawn by seller type:

| Seller | m range | Cues shown |
|---|---|---|
| Estate sale | 0.70–0.95 | "Heirs want a quick sale", long listing |
| Distressed | 0.65–0.90 | "Bank repossession", poor condition |
| Developer | 1.00–1.25 | New build, Prime condition |
| Landlord | 0.90–1.15 | Tenanted, rent history visible |
| Rival family | 0.95–1.30 | Rival wants out of a district |
| Auction | starts 0.60 | open bidding vs rivals |

**What the player sees** to appraise: price per m², the district's average
price per m² and 3 recent **comparable sales** (noisy ±10%), condition, yield,
seller type, years listed, district trend arrow. **Appraisal skill** (dynasty
trait or hired surveyor) narrows the comps noise. A rewarded ad / "insider tip"
reveals the true value of one listing per year.

**Offers:** player chooses an offer price. Acceptance probability is a smooth
function of `offer / askingPrice`, seller type and reputation; sellers
**counter** rather than just reject. If ≥1 rival is interested (good deal in a
district they want), it becomes a 3-round **auction**: highest bid wins; rivals
bid up to their own appraisal × their aggressiveness.

**Transaction costs** make flipping a skill, not a loop: stamp duty 2–8% by
city/era on purchase, 3% agent fee on sale, capital gains tax on sales within
3 years of purchase (era-dependent 0–25%). A flip must beat ~10% round trip.

**Market depth:** each city has a finite stock; the deal board refreshes yearly
with `4 + unlockedTier` listings, biased toward what the player can plausibly
afford (one stretch deal always present). Buying a lot in one district raises
that district's prices (pressure), so dominance has diminishing returns.

### 3.4 Renovation (the "fix" in fix-and-flip)
Three tiers, each a real trade-off:

| Tier | Cost (% of value) | Time | Condition gain | Value uplift | Risk |
|---|---|---|---|---|---|
| Patch | 4% | same year | +15 | +5% | none |
| Refurbish | 10% | 1 year | +35 | +18% | 10% overrun (+50% cost) |
| Rebuild | 25% | 2 years | → Prime, +1 era style | +45% | 20% delay +1 year |

Condition decays 3–6 points per year (more for old buildings, tenants with low
care). Below 40 → vacancy risk doubles; below 20 → unrentable.

### 3.5 Tenants and rent
Keep tenant classes but reduce them to one visible decision per property:
**rent setting** (80–120%). Higher rent: more income, more vacancy and turnover.
Lower rent: stable, long tenants, lower maintenance. Occasional tenant cards
(max 1/year across the portfolio) with real trade-offs (long lease at a fixed
rent during a boom vs flexible rent).

---

## 4. Finance (the engine of growth and the fail state)

- **Mortgages are per property.** Max LTV 70% (75% with Banker trait/rep > 70;
  60% in Crisis era). Interest-only by default (payment = rate × principal), or
  25-year amortising (cheaper rate −0.5%).
- **Base rate** moves with era and cycle: Victorian 3–4%, Gilded 4–5%, Crisis
  2–7% (spiky), Boom 5–8%, Modern 4–10%, Digital 1–5%. Lender adds 1–2% risk
  premium depending on your debt ratio.
- **Refinance:** once per property per 3 years, re-borrow to 70% of current
  value (cash-out). This is the BRRRR loop: Buy under value → Renovate → Rent →
  Refinance → Repeat. It is the intended way to grow fast.
- **Covenants:** if a property's LTV exceeds 85% (value fell) the lender issues
  a **margin call**: inject cash within the year or the property is force-sold
  at 85% of value. Two consecutive years of negative cash and no sellable equity
  → **bankruptcy** (section 9).
- **Rate cycles** are announced in the morning paper one year ahead (noisy).
  Fixed-rate mortgages (available from Boom era) cost +1% but protect you.
- Savings pay base rate −2% (never negative). Bonds/stocks/own bank return in
  later phases as era unlocks (see TASKS Phase 4).

---

## 5. Rivals (real agents)

Six families with **real portfolios**, cash, debt and strategy archetypes:

| Family | Archetype | Behaviour |
|---|---|---|
| Rothschild | Banker | Low leverage, buys blue-chip districts, lends to you at better rates if friendly |
| Wong | Trader | Flips aggressively, bids hard in auctions, sells in booms |
| Al-Rashid | Hoarder | Rarely sells, deep pockets, overpays for prestige districts |
| Petrov | Speculator | Max leverage, wins booms, goes bankrupt in busts (and can be bought out) |
| Martinez | Slumlord | Buys cheap/poor condition, never renovates, high yield, reputation hits |
| Okonkwo | Builder | Buys land/derelict, rebuilds, strong in up-and-coming districts |

Each year each rival: appraises the board (with its own noise), bids/offers,
renovates, sells on its rules, pays its mortgages, suffers the same cycles.
They start **scaled to the player's family tier** and are **rubber-banded**:
if the player leads by >3× the leader gets a windfall; if trailing badly the
top rival makes a mistake. Rivals make **offers on your properties** (10–40%
over value when they want a district) and you can **offer on theirs**. A rival
that goes bankrupt is absorbed by the strongest rival or can be bought by you.
The leaderboard shows net worth, properties, cities and a one-line "what they
did this year".

---

## 6. Counterforces (why the late game stays hard)

1. **Management capacity.** You personally manage 5 properties. Beyond that
   hire managers (each covers 10, costs 8% of rent, quality affects vacancy and
   decay). Unmanaged properties: +vacancy, +decay, random fines.
2. **Progressive taxes.** Wealth/property tax brackets by era; **estate tax
   20–40% on succession**, reducible by trusts (cost 2%/yr) or charity
   (reputation). Planning for death is a real mid-game strategy.
3. **District saturation.** Owning >30% of a district raises its prices for you
   (you are the market) and lowers yield (you compete with yourself).
4. **Cycles with teeth.** Boom (+8%/yr values, rates up), Growth, Stagnation,
   Recession (−10%), Depression (−25–35%, vacancies ×2, rates spike then fall).
   Historical scripted crashes (1873, 1929, 1973, 2008) are guaranteed.
5. **Rivals scale** with your tier and era.
6. **Dynasty risk** scales with wealth: lawsuits, scandals, spendthrift heirs.

---

## 7. Dynasty

- Head of family has **age**, **traits** (pick 1 at start; heirs roll 1–2):
  Negotiator (−5% accepted prices), Surveyor (comps noise −50%), Builder
  (renovation −15% cost), Banker (−0.5% rates, +5% LTV), Charmer (+reputation,
  better rival relations), Gambler (auction bids +, random windfalls/losses),
  Spendthrift (negative: −2% cash/yr).
- Children are born (events), can be **educated** (cost, improves traits),
  **married** into rival families (alliance: shared deal info, merger option at
  end of game), or disgraced.
- **Succession** at death: choose heir (traits change your play), pay estate
  tax, inherit reputation partially. Generation counter is a core score.
- Reputation 0–100 affects: seller acceptance, lender terms, rival relations,
  city unlocks. Slumlording, evictions and failed deals lower it.

---

## 8. Progression and goals

- **Cities:** start London. A new city unlocks by paying an **expansion cost**
  (travel + office) once a **reputation threshold** is met; both scale by tier.
  Target pacing: 2nd city by ~year 10, 5 cities by ~year 50, all by ~year 120.
  Each city has a trait (keep the best 8 of the current 12; see AUDIT).
- **Goals:** 1 yearly micro-goal (reward: small cash/rep), 1 era goal
  (e.g. "Own 3 buildings in Mayfair before 1900"), campaign tiers rewritten so
  none is pre-satisfied and each needs a strategy, not just time.
- **Achievements**: keep, re-tune to the new curve.
- **Legacy score** at 2030 or bankruptcy: generations × wealth × cities ×
  reputation × achievements. Legacy points buy **prestige perks**.

---

## 9. Fail state and comeback

- **Bankruptcy** when: net worth < 0, or 2 consecutive years of negative cash
  with no property that can be sold to cover it, or 2 missed margin calls.
- Screen: "The House of X has fallen" with legacy score, timeline of the run,
  and two options: **Start a new dynasty** (prestige perks apply) or
  **Continue as the heir** (keep 1 property + 10% cash, reputation reset to 40;
  rivals absorb the rest). The comeback is a feature: losing is a chapter.

---

## 10. Presentation

- **3D city is the hero.** Owned buildings carry your family colour banner and
  lit windows; rivals' buildings carry theirs; listings show "For sale" signs;
  renovation shows scaffolding; derelict buildings are dark; era change
  re-skins the skyline (Victorian brick → glass towers). Tap a building to open
  the property. The city grows on a fixed grid as the era and your holdings grow.
- **Start screen:** live 3D London at dusk slowly orbiting, the era advancing
  as you watch; title in a refined serif; "Continue" shows the dynasty card
  (family crest, year, net worth, rank). No SVG mansion.
- **Design system:** one 4/8px spacing scale, 5 type sizes, SVG icon set (no
  emoji as icons), token colours with dark mode, 44px minimum targets,
  safe-area insets, motion only for feedback (money, rank, deals).
- **Feedback:** one animated year report instead of toast stacks; floating
  money numbers only for things the player caused.

---

## 11. Retention beyond one campaign ("3 days")

Nobody plays one tycoon campaign for three days; they play **many short runs
that differ**. The retention stack:

1. **Four families with genuinely different starts and rules** (not just cash):
   - Silva: poorest, but Builder trait and a free derelict; wins by renovation.
   - Chen: merchant network: sees one true value per year for free.
   - Armstrong: aristocrats: start with 2 properties and debt; must deleverage.
   - Vanderbilt: sandbox: rich but with a 20% estate tax every generation.
2. **Prestige perks** that change the next run (not just +cash): new seller
   types, a 7th rival, hard mode (Crisis-era start), "no mortgages" purist mode.
3. **Weekly seeded challenge:** same deal RNG for everyone, 30-year sprint,
   local high score (online later).
4. **Era-start scenarios:** start in 1929 with 60% leverage, or 2008.
5. **Daily return hook without timers:** "Morning paper" headlines are
   generated for the next session; the save card shows the cliffhanger.

---

## 12. Monetization (store-safe)

- **Rewarded ads** (opt-in): re-roll the deal board, insider tip (true value of
  one listing), one free renovation speed-up per year, skip quiet years instantly.
- **IAP:** Remove ads €3.99; Dynasty Pack (2 new families) €2.99; city art
  packs; no pay-to-win beyond what a rewarded ad already gives.
- **Interstitials:** only at year report, at most 1 per 6 years and 1 per 4
  minutes, never on the first 15 minutes of a new player. Never during a deal.
- **Consent:** UMP SDK for GDPR, age rating 12+ (simulated gambling? no;
  "mild"), privacy policy URL.

---

## 13. Engine contract (what the UI can rely on)

All engine code lives in `js/engine/` as plain objects attached to
`window.PE` (no modules, to stay compatible with the file:// Android WebView
and the Node simulator). One state object; all mutation through engine calls;
every call returns `{ ok, message, ...payload }` and never throws to the UI.

```
PE.Game.newGame({ familyId, seed, traitId })      → state
PE.Game.load() / save() / hasSave() / deleteSave()
PE.Game.endYear()                                  → YearReport
PE.Game.skipQuietYears(max=5)                      → YearReport[] (stops early on decision)

PE.Market.listings(cityId)                         → Listing[] (with comps, cues, estimate band)
PE.Market.appraise(listingId)                      → { lowEstimate, highEstimate, cues[] }
PE.Market.makeOffer(listingId, price, financing)   → { ok, outcome:'accepted'|'countered'|'rejected'|'auction', counterPrice?, auction? }
PE.Market.bid(auctionId, price)                    → { ok, outcome:'won'|'outbid'|'continue', currentBid, round }
PE.Market.sell(propertyId, mode:'market'|'quick')  → { ok, price, fees, tax, cashGained }
PE.Market.offersOnMyProperties()                   → Offer[]
PE.Market.respondToOffer(offerId, accept)

PE.Finance.mortgageQuote(propertyId|listingId, ltv, type) → { principal, rate, annualPayment, lender }
PE.Finance.takeMortgage(propertyId, ltv, type)
PE.Finance.refinance(propertyId, ltv)
PE.Finance.repay(propertyId, amount)
PE.Finance.summary()                               → { cash, debt, ltv, annualDebtService, covenantWarnings[] }

PE.Property.renovate(propertyId, tier)
PE.Property.setRent(propertyId, setting)
PE.Property.hireManager(cityId, managerId) / fireManager(cityId)

PE.Dynasty.summary() / chooseHeir(memberId) / educate(memberId) / setupTrust() / toggleCharity()
PE.Rivals.leaderboard()                            → [{ id, name, netWorth, properties, cities, lastAction }]
PE.Goals.current()                                 → { yearly, era, campaign }
PE.Events.pending()                                → Event|null ; PE.Events.resolve(eventId, choiceIndex)
```

`YearReport`:
```
{ year, era, cashFlow:{ rent, costs, debtService, taxes, net }, equityChange,
  valuesByCity, deals:[...], rivalsMoves:[...], events:[...], dynasty:[...],
  goals:{ achieved:[], progress:[] }, rank:{ before, after },
  warnings:[ 'margin_call:<propId>', 'negative_cash' ], cliffhanger:'...' ,
  needsDecision: boolean }
```

Determinism: all randomness through `PE.RNG` seeded from `state.seed` so
simulations and weekly challenges reproduce.

---

## 14. Balance targets (what the simulator must prove before shipping a phase)

Simulated with a competent scripted player (buys best-value deals it can
finance, renovates when uplift > cost, refinances when LTV < 50%, sells
in booms) and a naive one (buys the cheapest, never borrows):

| Metric | Target |
|---|---|
| Year of 2nd property (competent, Chen) | ≤ 3 |
| Year of 5th property | 8–12 |
| Year of 2nd city | 8–15 |
| Net worth at year 30 (competent / naive) | ~15× / ~3× start |
| Bankruptcies per 100 competent runs | 5–15 (leverage should bite) |
| Bankruptcies per 100 naive runs | 0–3 |
| Player rank at year 30 | #2–#4 (contested, not solved) |
| Decisions per year with non-dominant options | ≥ 1 |
| Late game (year 150) rent / costs ratio | ≤ 2.5 (v7 was 17) |

---

## 15. Master prompt (paste into a fresh Claude Code session)

> You are rebuilding **Property Empire**, an HTML5 real-estate dynasty tycoon
> for Google Play and the App Store, in this repo. Read `docs/REDESIGN.md`
> (design bible: pillars, numbers, engine contract), `docs/AUDIT.md` (what is
> wrong with the current game, with evidence) and `docs/TASKS.md` (phased plan
> with acceptance criteria). Work through `docs/TASKS.md` in order, one phase
> per PR, on the branch named in the task. For each task: implement, add or
> update a test in `js/simulate.js` (or the engine test file the task names),
> run `node js/simulate.js`, take Playwright screenshots of every screen you
> touched at 412×915 and 1280×800, fix what you see, bump the version in the 3
> places listed in `CLAUDE.md`, commit with a message that names the task ID.
> Never add auto-advance back, never add a mechanic that makes a player
> choice irrelevant, never ship a goal that is already satisfied at game
> start, and never tune a number without running the balance simulation in
> section 14 of the bible and pasting its table into the PR. When the bible
> and the code disagree, the bible wins; when the bible is silent, choose the
> option that gives the player a decision with a non-obvious answer, and write
> that decision into the bible.

---

## 16. Decisions made during implementation (engine v8.0.0, folded back into the bible)

These were open in the sections above; the engine settled them and the
simulator was tuned against them. They are now canon.

- **Price scale.** 1850 London £14/m² × district factor 0.5–2.4 × type factor.
  Starting cash: Chen £2,000 (≈4× the cheapest listing), Silva £900 plus a free
  derelict terrace, Armstrong £1,200 plus a townhouse and a terrace carrying
  68% and 55% mortgages, Vanderbilt £12,000 with +20% estate tax.
- **Traits.** The head carries the family trait (Silva Builder, Armstrong
  Charmer, Vanderbilt Banker, Chen none) plus the one trait picked at start, max
  two. Chen's merchant network (and later a marriage alliance) reveals one
  random listing's true value per year.
- **Covenants** are evaluated on post-drift values. Bankruptcy by missed
  margin calls = two forced sales within a two-year window.
- **Depression** is a single −35% year (the top of the §4 band; random
  recession → depression 12%); scripted crash years are guaranteed (1866,
  1873, 1890, 1907, 1920, 1929, 1931, 1973–74, 1987, 1990, 2000, 2008–09,
  2020).
- **Hidden defects.** Estate, distressed and auction purchases have a 50%
  chance of −5..20 condition after purchase; the Surveyor trait halves it.
  Rivals pre-empt 20% of fresh bargains before the board opens.
- **Rivals** cap at 30 buildings and upgrade instead; start at 3× family cash ×
  archetype multiplier; contest bargains with 0.45 × aggression scaled by how
  good the deal looks to them; bid caps 0.86–1.06 × their own noisy appraisal.
- **Progressive taxes.** Property-tax era multipliers 1.0 → 1.6; compulsory
  insurance from the Boom era; wealth tax above 60× start cash × price index;
  +0.3% maintenance for buildings older than 40 years.
- **Cities** become available on historical dates (Singapore 1900, Dubai 1970,
  …). Expansion cost £1,200 × price index × tier (1 / 2.2 / 4.5 / 8) × (1 + 0.35
  per city held). Reputation gate 44 + 4 per city held + 3 × tier.
- **Management.** Five self-managed buildings; one manager per city covers ten;
  unmanaged = +8% vacancy, +2 decay per year, 20% chance of a 1%-of-value fine.
- **Selling.** `market` sale is pending until year end and completes with a
  cycle-dependent probability at the cycle "mood" price; `quick` is immediate
  at 85%. Quick vs market is a real decision.
- **Era-boundary set-pieces** at 1900, 1950 and 1980 in addition to the crash
  years.
- **API wrapping.** Every public call returns `{ ok, message, ...payload }`
  with payloads wrapped (`{ok, listings}`, `{ok, reports}`), the leaderboard
  includes the player row, `endYear` refuses with `needsDecision` while an
  event is pending, and an open auction is auto-withdrawn at year end.
- **Balance result (100 seeds × 4 families × 2 players × 30 y + 20 × 180 y):**
  all ten §14 targets pass; "~15×" is read as a 10–22× band; competent
  bankruptcy sits at 7.8%, mid-band, with the depression at −35%; the scripted
  player still deleverages when the morning paper foreshadows trouble. The
  Black Tuesday scenario start cash (cashMult 0.34) is calibrated so the
  deeper depression keeps it winnable in ≥ 40% of seeds and lost in ≥ 20%.

### 16.1 Decisions added with engine v8.1.0 (Phase 2 engine work)

- **Relations** with each rival are a −100..100 scale (`s.relations`): outbidding them at auction −8, being outbid −2, accepting their offer +8, declining −4, evictions in their city or district −5, marriage +30, refused proposal −20; drift 1/yr toward 0, allies never fall below 30.
- **Charity endowment** (bible §7, engine v8.2): `Dynasty.toggleCharity()` endows 1% of net worth per year, +2 reputation per year, and cuts 5 points off the estate-tax rate (applied after the trust halving).
- **Marriage**: an unmarried non-head aged 18–40 may be proposed to a rival with relation ≥ 0 when reputation ≥ 50; acceptance 35% + 0.4%/relation ± wealth ratio (+8% Charmer), 5-year cooldown per rival after refusal. An ally never contests your deals and reveals one listing a year in its favourite city.
- **Merger** with an ally is allowed in the last 20 years or when the head is 65+, costs 15% of the ally's net worth, folds its portfolio and cash into yours, removes it from the leaderboard, and multiplies legacy score by 1 + 0.25 per merger.
- **Events v2**: 43 random events, ≤ 2 per year; a Monte-Carlo check (`js/sim/eventsmc.js`) enforces that no choice dominates on both expected value and variance. Twelve historical set-pieces are pre-warned a year ahead in the morning paper with the standard 45% foreshadow noise (95% with the Town Crier perk). Each era change queues a two-choice set-piece.
- **Perks** are bought with legacy points (floor(score/500), min 1 after ten years). Passive perks apply to every new game once owned; mode perks (seventh rival, purist, crisis start, second city) only when selected.
- **Weekly challenge**: seed = hash of the ISO week, Chen family, 30-year sprint ending 1879, score = NW multiple × 100 + reputation + 25 per achievement + 50 per generation; best score per week stored in meta.
- **Scenarios** (1929, 1973, 2008) fast-forward prices and era deterministically, give five buildings at 55–64% LTV in two cities, and are won by holding net worth ≥ start fifteen years later. Competent win rate 47–77% by scenario.
- **Armstrong** carries a family goal track: LTV below 50% by 1860 for 3% NW and +5 reputation, −5 reputation if missed.
- **Save version 2** with a migration from version 1.
