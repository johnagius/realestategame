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
| Per-goal deterministic completion: 10/10 yearly templates, 6/6 era kinds, campaign tier chain, reward-once, era deadline boundary | tests.js §34 | ✅ 673/673 |
| "Possible under suitable conditions" vs "achievable whenever offered" | inventory + f5/f6/f7 | ✅ yearly goals fall back to null when infeasible; scenario-era goals clamped; assignment-honesty invariant over 16 runs × 12 years |
| Achievements | tests.js §22 + §33 | ⚠️ stat-driven and mode-gated ones covered; not every one of 30+ has a dedicated completion test |

## 4. Balance across players and seeds (P8.4)

| Harness | Coverage | Result |
|---|---|---|
| `js/sim/balance.js` | 100 seeds × 4 families × naive/competent × 30y + 20 × 180y | ✅ 11/11 + 4/4 (table pasted in 38a30de) |
| `js/sim/contest.js` | families × naive/competent/expert × seeds, distributions + outliers | ⬜ |

## 5. Contest measurement (P8.5)

⬜ `js/sim/contest.js` — time to first success, lead changes, runaway ratio,
recovery after bankruptcy, dead-turn share. Results pending.

## 6. Losses and victories (P8.6)

⬜ contest.js run classification (easy/close/recoverable/crushing) with
deterministic replay seeds. Pending.

## 7. Human playtest (P8.7)

⬜ Instrument ready: `docs/audit/05-playtest.md`. Awaiting owner sessions
(opening + developed save) and any fresh-player observation.

## 8. Bugs found during the gate

| Bug | Where | Status |
|---|---|---|
| End screen showed campaign victory framing (confetti, "endures", 1850/2030) for lost scenarios and challenges; raw score mislabeled as points | js/ui/year.js showEnd | ✅ fixed 2f33f58, all three mode variants screenshot-verified |
| (populated as found) | | |

## 9. Unresolved balance concerns

(populated as found)

## 10. Visual defects sweep (owner-mandated pre-feature work)

| Defect | Result |
|---|---|
| City-tab contrast (≥4.5:1 on nav labels) | ✅ db4f5d8, screenshots reviewed both viewports |
| Buildings in rivers / bridge connectivity | ✅ c3c53a5, 49 water screenshots reviewed (`tools/playwright/out/water/`) |
