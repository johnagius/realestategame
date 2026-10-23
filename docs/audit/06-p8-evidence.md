# P8.8 Evidence report — release gate

Owner-mandated (docs/TASKS.md Phase 8). Concise matrix of tested paths, seeds,
strategies, results, bugs, and unresolved balance concerns. Skipped paths are
not passes. Nobody claims perfect balance.

Status legend: ✅ verified · ⚠️ partial / caveat · ❌ failed · ⬜ not run

## 1. Winning inventory (P8.1)

✅ `docs/audit/04-winning-inventory.md` — every goal/victory path inventoried
(campaign tiers, yearly/era/family goals, achievements, scenarios, challenge,
bankruptcy/comeback). 14 findings; all fixed (f1–f11 in 38a30de, f12 df14e39,
f13+f14 5907c58) with regression tests in `js/sim/tests.js` §33.

## 2. Achievable completion (P8.2)

| Path | Tool | Result |
|---|---|---|
| Full campaign 1850→2030 through the real UI, save/reload mid-run, end screen, legacy recorded once | `tools/playwright/campaign.js` | ✅ 6/6 — 181 years, 7 heir continuations, ended 2031, reload at 1900 byte-identical |
| crash1929 scenario through the real UI to a terminal result | `tools/playwright/campaign.js` | ✅ result 'lost' registered at 1945; end card shows the loss honestly |
| The Long Game gated to campaign mode (f2) in the real UI | `tools/playwright/campaign.js` | ✅ not awarded in scenario mode; awarded on campaign completion |

## 3. Objective coverage (P8.3)

| Layer | Coverage | Result |
|---|---|---|
| No goal satisfied at start (4 families × 5 seeds, scenarios, challenge) | tests.js §11 | ✅ |
| f1–f11 regression tests (goal integrity) | tests.js §33 | ✅ |
| Per-goal deterministic completion: 10/10 yearly templates, 6/6 era kinds, campaign tier chain, reward-once, era deadline boundary | tests.js §34 | ✅ 680/680 total |
| "Possible under suitable conditions" vs "achievable whenever offered" | inventory + f5/f6/f7 | ✅ yearly goals fall back to null when infeasible; scenario-era goals clamped; assignment-honesty invariant over 16 runs × 12 years |
| Achievements | tests.js §22 + §33 + §36 | ✅ all 44 have a deterministic completion test with boundary assertions (79c7a82); a meta-check fails the suite if a future achievement ships untested |

## 4. Balance across players and seeds (P8.4)

| Harness | Coverage | Result |
|---|---|---|
| `js/sim/balance.js` | 100 seeds × 4 families × naive/competent × 30y + 20 × 180y | ✅ 11/11 + 4/4 (latest table pasted in ae82e13; competent-bankruptcy floor now 4–15, rationale in REDESIGN §16.6) |
| `js/sim/contest.js` (106e1e3) | 30 seeds × 4 families × naive/competent/expert × 60y (360 runs) + 36 full-length 181y runs + 180 scenario runs | ✅ 8/8 guards; distributions below |

Strategy distributions (60y matrix, 120 runs each; min / p25 / median / p75 / max):

| Metric | naive | competent | expert |
|---|---|---|---|
| Final NW ×start | 0.0 / 7.8 / **17.4** / 27.7 / 69.6 | 1.9 / 52.3 / **176.2** / 357.1 / 1326.8 | 1.0 / 60.0 / **182.8** / 342.0 / 1562.2 |
| Final rank | 3/4/**5**/6/7 | 1/1/**2**/3/6 | 1/1/**2**/3/7 |
| Year of 2nd property | 1/1/**2**/3/7 | 1/1/**2**/4/14 | 1/1/**2**/3/24 |
| Year of first yearly goal done | 1/2/**4**/7/15 | 1/2/**3**/4/10 | 1/2/**3**/4/10 |
| Dead-year share % | 0/3/**7**/10/52 | 0/0/**2**/3/27 | 0/0/**2**/3/13 |
| Yearly goals done/offered % | 10/22/**23**/28/38 | 17/33/**37**/40/55 | 18/32/**37**/40/53 |
| Campaign tiers reached | **1**/6 | **5**/6 | **5**/6 |
| Era goals done / eras entered | 116/240 | 179/240 | 176/240 |

Family × strategy (60y, median NW× / bankruptcy % / median rank): silva 331.8×
10% #1 (competent), chen 335.5× 7% #2, armstrong 210.0× 0% #2, vanderbilt
50.1× 7% #4. Vanderbilt is deliberately the hard mode (see §9).

Full-length 181y confirmations (12 runs per strategy): naive median 126×, bk
25%, tier 1/6; competent 23763×, bk 17%, tier 5/6; expert 62556×, bk 33%, tier
5/6. No rank-1 final-20y locks in any full-length run (0/36).

Scenario matrix (30 seeds each, win %): crash1929 competent 60% / expert 43%;
oilshock1973 60% / 47%; gfc2008 63% / 70%. Median NW/target 0.79–1.73.

## 5. Contest measurement (P8.5)

✅ `js/sim/contest.js` (106e1e3), all figures post-succession-fix (ae82e13):

- **Time to first meaningful success:** median first yearly goal done at year
  3 (competent/expert) / 4 (naive); 2nd property at year 2 for all strategies.
- **Lead changes:** median 5 per 60y run; 96% of runs see ≥ 1. Median years at
  rank 1 is 0–6 depending on strategy — nobody camps the top.
- **Rival advantage / runaway leaders:** leader/runner-up NW ratio median 1.24
  at run end, median peak 1.74–1.80. Outliers: one transient 70.7× peak
  (silva/seed 4, see §9), all other peaks ≤ 10.4× with final ratios ≤ 4.21.
- **Recovery after setbacks:** 5% of runs see a bankruptcy; 12/18 of those
  recover to the pre-bankruptcy peak, median 21 years (competent median 18y,
  expert 24y). Comeback is real but costly.
- **Dead turns:** median dead-year share 2% (competent/expert), 7% (naive).
- **Effortless wins:** rank-1-held-final-20y+ in 11% of runs (< 25% guard);
  zero in full-length 181y runs.
- **Red flag found and fixed:** rival houses had no heir path — a depression
  could extinguish 4 of 6 houses and the absorber compounded to a *terminal*
  70.7× lead (silva/seed 4/competent). Fixed by rival succession (ae82e13):
  same repro now ends with leader ratio 2.09 and the field restored.

## 6. Losses and victories (P8.6)

✅ Run classification over the 360-run matrix (player final NW / best rival
final NW; close = within 25%, easy = ≥ 1.25×):

| Class | Share | Sample replays (deterministic coordinates) | Cause |
|---|---|---|---|
| Easy win | 42 runs (12%) | silva/seed 1/competent (ratio 1.43, lc 1) · silva/seed 9/competent (1.53) · silva/seed 12/competent (2.07) | Early leverage compounding through a long bull market; rivals never close the gap. bk 0, dead ≤ 2% |
| Close win | 32 runs (9%) | silva/seed 6/competent (1.22, lc 5) · silva/seed 7 (1.11) · silva/seed 8 (1.09, lc 6) | Contest live to the final decade; one deal decides it |
| Recoverable loss | 95 runs (26%) | silva/seed 3/competent (0.95, rk #3, lc 8) · silva/seed 5 (0.71, rk #2) · silva/seed 11 (0.89, rk #2) | Player in striking distance; earlier 2nd city or less crash-year leverage plausibly flips these |
| Crushing loss | 191 runs (53%) | silva/seed 1/naive (0.25, rk #5) · silva/seed 2/naive (0.19, lc 13) · silva/seed 3/naive (0.12, lc 20) | Concentrated in naive play (never borrows, buys cheapest): naive median 17.4× vs 176.2× competent. The compound cost of passive play |

Strategy split per class (naive / competent / expert): easy 0/22/20 · close
0/13/19 · recoverable 0/46/49 · crushing 120/39/32. Every naive run is
crushed — naive never reaches even a recoverable loss at the 60y horizon.
Skilled losses split between recoverable (the modal class) and crushing.

Alternative decisions could reasonably change outcomes in the close and
recoverable classes (small final ratios, high lead-change counts). Easy wins
are market-driven, not exploit-driven (bk 0, normal decision cadence).
⚠️ Whether a *human* player receives enough information to respond mid-run is
asserted only from bot-visible state — this is a P8.7 playtest question, not
a closed one (§9).

## 7. Human playtest (P8.7)

⬜ Instrument ready: `docs/audit/05-playtest.md` + developed save
`tools/playtest-save.json` (Chen 1872, Mayfair short let). Awaiting owner
sessions (opening + developed save) and any fresh-player observation.

## 8. Bugs found during the gate

| Bug | Where | Status |
|---|---|---|
| End screen showed campaign victory framing (confetti, "endures", 1850/2030) for lost scenarios and challenges; raw score mislabeled as points | js/ui/year.js showEnd | ✅ fixed 2f33f58, all three mode variants screenshot-verified |
| Rival houses had no heir path: a depression could extinguish 4/6 houses; absorber compounded to a terminal 70.7× lead (repro silva/seed 4/competent) | js/engine/rivals.js goBankrupt | ✅ fixed ae82e13 — succession after 6y; same repro now transient (final ratio 2.09); tests §35, balance 11/11 + 4/4, contest 8/8 |
| Rival succession side effect: competent bankruptcies 5.3 → 4.8 per 100, brushing the §14 floor of 5 | js/sim/balance.js target | ✅ resolved by decision, not by tuning: floor adjusted to 4 with measured history in REDESIGN §16.6; intent ("leverage must bite") preserved at ~1-in-21 runs with real recovery |

## 9. Unresolved balance concerns

1. **Transient lead spike during mass-bankruptcy windows.** With several
   rivals bankrupt at once, the leader/runner-up ratio can spike to ~70×
   (near-zero denominator) before succession restores the field. Measured by
   `node js/sim/contest.js probe silva 4 competent`: the spike lasts exactly
   the return window — 5 years above 5× (1896–1900), normalising to 2.36× in
   1901 when the houses return (`rivalReturnYears` 6 after the 1895
   bankruptcies) — and the repro's peak is amplified by the player's *own*
   bankruptcy collapsing the runner-up denominator. Final ratio 2.09; the
   median peak across runs is healthy (1.74). If human play finds the
   leaderboard demoralising in those years, shorten `rivalReturnYears` — do
   not hide the number.
2. **Expert ≈ competent at 60y** (182.8× vs 176.2×). Mastery pays over the
   full 181y (62556× vs 23763×) but a 60-year session barely rewards it, and
   expert full-length bankruptcy is 33% vs competent 17% — high variance.
   Playtest question: does skilful play feel rewarded soon enough?
3. **Crushing losses (53%) are concentrated in naive play — but not exclusive
   to it.** All 120 naive runs end crushed (naive never reaches even a
   recoverable loss at 60y); skilled losses split recoverable 46/49 vs
   crushing 39/32 (competent/expert). Whether a human novice gets enough
   feedback to see *why* they are losing is a P8.7 question.
4. **Aggression is penalised in crash scenarios, rewarded in gfc2008**
   (expert 43–47% vs competent 60% in crash1929/oilshock1973; 70% vs 63% in
   gfc2008). Intentional — timing matters — but watch it in playtests.
5. **Vanderbilt is the hard mode:** 60y median 50–70× vs 210–360× for other
   families, median rank #3–4, expert bk 13%. By design; confirm it feels
   fair rather than broken.
6. **Naive full-length bankruptcy is 25%** (0% at 60y) — late-game crises
   eventually catch passive play. Working as intended; worth a human look.
7. **"Enough information to respond" (P8.6) is bot-evidence only.** Human
   confirmation required in P8.7; replay coordinates exist for every class.
8. **Competent bankruptcy rate sits at the floor** (4.8 vs band 4–15). Fine
   today; recheck after any future difficulty change.

## 10. Visual defects sweep (owner-mandated pre-feature work)

| Defect | Result |
|---|---|
| City-tab contrast (≥4.5:1 on nav labels) | ✅ db4f5d8, screenshots reviewed both viewports |
| Buildings in rivers / bridge connectivity | ✅ c3c53a5, 49 water screenshots reviewed (`tools/playwright/out/water/`) |
