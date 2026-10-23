# Engagement Audit — from functional simulation to compelling game

Commissioned by the owner's change-of-direction brief. Method: code audit of engine/UI/render
(js/engine, js/ui, js/city3d-engine.js, css, assets), a 295-year instrumented competent-bot run,
and real screenshots of every major screen at 412×915 and 1280×800 (tools/playwright/out/ui).
Findings below are directly observed unless marked [hypothesis — needs human playtesting].

## The one-paragraph diagnosis

v8 fixed the *numbers* from the v7 failure (all 10 balance targets pass), but it fixed them so
cleanly that the game is now *solved*: the competent bot plays 295 years with ~10 fixed rules and
zero exceptions. A bargain worth buying exists in 87% of years; renovate, refinance and rent are
cron jobs. Meanwhile the most emotion-producing mechanic in the engine — rivals snatching bargains
before you see them — is completely invisible, crashes are telegraphed chores, and the juice
machinery that exists (11 sounds, confetti, stamps, count-ups, a genuinely good succession
ceremony) is muted by an opt-in sound default the design bible explicitly forbids. Visually, the
token/era/motion *system* is strong (~7/10); what the player sees is 4–5/10 because the
illustration layer was never produced and the 3D city is washed-out at day.

## Five biggest weaknesses in player engagement

1. **The dominant strategy is fully solved.** Buy = sort by ask/estimate, offer 86% (players.js:159-174).
   Renovate iff uplift > 1.3× cost (707 times, zero judgment). Refinance iff LTV < 50% (a cron job).
   Rent = one portfolio-wide cycle switch. There are no quiet years: a buyable bargain exists 87% of
   years (turn.js:161). The right move is almost always "buy more, now".
2. **The best dramatic mechanic is invisible.** Rivals pre-empt bargains *before the board opens*
   (rivals.js:290-306) and the player never learns what they lost. Loss aversion and rivalry — the
   cheapest emotions in the genre — are thrown away.
3. **Crashes are choreographed, not feared.** Scripted crashes on fixed historical dates, announced
   a year ahead at 45% reliability (data.js:553-566). Deleverage-on-whisper is always correct
   (players.js:77 proves it), so the paper turns disaster into a formality.
4. **Events don't matter.** 43 events were deliberately EV-flattened to within ±20% of each other
   (§16.1, enforced by js/sim/eventsmc.js). Every choice is "pick a flavour of ±0.3% net worth".
5. **The late game is the early game with more zeros.** Median 180-year net worth is 32,827× start;
   nothing at year 120 requires a decision year 12 didn't. Every building is literally a formula
   (sqm × ppsqm, property.js:18-24) — no attachment, no flagship, nothing memorable to own.

## Five biggest weaknesses in visual presentation

1. **The illustration layer does not exist.** One advisor portrait (advisor.svg — good, lonely),
   six small report vignettes, 40 generic Feather-style icons. DESIGN-DIRECTION §5's "engravings,
   portraits, crests, vignettes" pillar is ~10% built. Screens read as a tasteful ledger dashboard.
2. **The 3D city is washed-out at day** (city-1280.png: flat pastel boxes, lollipop trees, low
   contrast). The post/PBR chain helps at dusk/night; day grade still lacks drama. Non-landmark
   buildings are box+roof everywhere; the authored kit is London-only, high-quality-only
   (city3d-engine.js:714-715); the auto-low tier (most phones) strips the post chain entirely.
3. **The desktop city screen is half dashboard.** A 400px beige data panel crowds the hero render;
   the city — the thing you *own* — is the smaller half of the screen.
4. **The recurring ceremonial moments have no artwork.** The year report (the #1 screen) is
   typography + one small vignette; era-change cards are type on a flat panel; rivals are a coloured
   shield with an initial — auction drama plays out against a circle with a letter in it.
5. **Dead and off-palette assets.** worldmap.svg unreferenced anywhere; splash-bg.svg (a real
   illustrated dusk panorama) used only by a store-asset tool, not in-game; fonts load from Google
   CDN at runtime (index.html:19-20) against the vendoring rule; landmark names carry emoji in all
   20 city defs (engine strips them for 3D, raw defs leak elsewhere).

## Player actions lacking satisfying feedback (observed)

- **Renovate**: list button → toast + generic `coin`. No before/after, no transformation
  (portfolio.js:212-215). The most form-like action in the game.
- **Rent collection**: the genre's core payoff is one table row; `coin` fires only if *total equity*
  rose, so a good rent year in a falling market sounds like failure (year.js:70, 192, 230).
- **Event resolution**: the year's big decision ends in a silent toast (year.js:25-32).
- **Insider tip reveal**: spending the 1/year reveal yields a toast containing a number (deals.js:296-300).
- **Bankruptcy**: campaign-ending moment = text card + the same `negative` beep as a minor loss;
  the bible's tilt-down and the existing `alarm` sound (dead code, audio.js) are unimplemented.
- **Sound is off by default** (core.js:113 `sound:false`, audio.js:8 `muted:true`) — directly
  contradicting DESIGN-DIRECTION §6 "Default on for new players". Most players never hear anything.
- **The 3D city reacts to success only when you're looking at it** — buy from the deals screen and
  the camera push-in waits silently for a city-tab visit (city.js:58-68, 205-206).

## Complexity that earns little (cut or hide)

- Per-property rent slider: solved by one rule; 911 calls per 295 bot-years of pure taps.
- Tenant classes: fully derived, recomputed yearly, never chosen (property.js:130).
- 8 managers × quality/fee: bot always hires best affordable; invisible differences.
- Own bank: ~100 lines behind a 6-point perk + 1980 gate; most players never see it.
- `elite_enclave` trait: dormant, still shipped (data.js:101).
- Rival voice/traunt lines: zero mechanical hook; relations drift to 0 regardless (rivals.js:180-183).

## Prioritised plan (impact ÷ effort)

### Phase A — make actions feel (UI-only, no balance impact)
A1. Sound default-on + one-time first-run prompt (bible-mandated). [XS]
A2. Wire dead `alarm` to bankruptcy / margin call / forced sale; `decision` on event resolve. [XS]
A3. Renovation before/after: delta line + animated condition bar + `stamp` sound. [S]
A4. Rent payoff: staggered money-floats + `coin` per property row in the report, decoupled from
    total equity direction. [S]
A5. "See it in the city" button after purchase (existing focusNewPurchase push-in); era titlecard
    confetti + immediate setEra on dismiss. [XS]
A6. HUD cash/net-worth pulse on change. [S]

### Phase B — make decisions matter (engine/data; each ships with full balance table)
B1. **Visible pre-emption**: greyed "Snapped up by the Wongs" cards on the deal board. The mechanic
    exists; this is the highest feel-per-line change in the game. [S]
B2. **Starve the board**: fewer guaranteed bargains (listingAffordHigh, listingSoldElsewhereBase
    0.25→~0.4) so some years the right move is nothing. [data-only, balance-sensitive]
B3. **Cycle-dependent quick-sale**: quickSaleFactor 0.85 → table (0.60 depression … 0.85 growth).
    Selling in a crash becomes a wound. [data-only, balance-sensitive]
B4. **Rival grudges with teeth**: relations modulate contest chance/bidMult (rivals.js:119-135). [S]
B5. Unreliable foreshadowing: jitter scripted crash years ±1 per seed + false alarms. [balance-sensitive]
B6. Sticky named tenants with memory (rent rises risk losing *that* tenant). [M]
B7. Heir traits weighted by the player's last-decade behaviour. [M]
B8. One nameable flagship per city; rivals bid on it, events target it. [M]

### Phase C — illustration layer (artwork pipeline; the road from 5/10 to recognisable)
C1. Engraving portrait set: advisor poses + 8 rival portraits, two-ink cross-hatched SVGs,
    era-recolourable; integration point is crest.js / Rivals screen / auctions. [M, highest identity gain]
C2. Year-report front-page engravings: expand assets/report/*.svg into real cuts per event class. [M]
C3. Era title-card plates (6 images). [S-M]
C4. Ship splash-bg.svg in-game (WebGL fallback + share card). [XS]
C5. Period-voice icon pass on the 40-icon sprite. [S]
C6. Low-quality 3D uplift (grade-only pass + warm windows) + user quality toggle in settings. [M]
C7. Vendor fonts into assets/ + precache; strip emoji from landmark names at source. [XS]

### §9 deliverable — the exceptional first 10–15 minutes
Phases A + B1–B3 converge on the opening: first bargain hunt on a *starved* board, first win with
stamp + push-in to *your* building, first renovation with a visible transformation, first rent
payoff with money floats, first "Snapped up by the Wongs" loss, first crash whisper that might be a
lie. That sequence is the acceptance test for this programme.

## Verification split
Automatable: engine contract, balance band, play.js green, axe, screenshots at both viewports.
Needs the owner's judgement: whether the first 10 minutes *feel* compelling; whether the engraving
art direction (C1-C3) is the right look. Per HANDOVER-SKYLINE-AUDIT §3: design/verdict steps run on
K3-256k Max; renderer feature work on High; mechanical roll-outs on K2.7 Highspeed; balance on High.
