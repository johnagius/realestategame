# Monetization — Property Empire v8 (P6.2)

Everything here follows bible §12 ("Monetization (store-safe)"). The web build
never charges: purchases are store IAPs inside the app builds, and the web
"remove ads" affordance only explains that (the v7 `confirm()` free-grant is
gone — it was trivially exploitable, see `docs/audit/03-engineering.md` §4/§7).

## Surfaces in `js/ads.js`

| API | Purpose |
|---|---|
| `AdManager.init()` | Reads cached purchase state; native bridge wins when present. Called once at boot (`js/ui/app.js`). |
| `AdManager.countMonth()` / `tryShowAd()` / `MONTHS_BETWEEN_ADS` / `_monthsSinceAd` | Interstitial counter. Driven by `js/ui/year.js` only. |
| `AdManager.rewarded(placement, onReward)` | Rewarded ads (below). Returns false if busy/removed/unknown placement. `onReward({placement, rewarded, reason})`. |
| `AdManager.requestRemoveAds()` (alias `purchaseRemoveAds()`) | Purchase intent. App → billing bridge; web → explanatory sheet with the privacy-policy link. |
| `AdManager.restorePurchase()` | Settings restore; bridge only. |
| `AdManager.isAdsRemoved()` | Gate for hiding ad entry points. |
| Native bridge | `window.PropertyEmpireBridge.showInterstitial/showRewarded/isAdsRemoved/purchaseRemoveAds/restorePurchase`; JS callbacks `AdManager._onAdDismissed/_onRewardEarned/_onRewardClosed/_onAdsRemoved`. Same surface a Capacitor plugin can implement. |

## Rewarded ads — the four placements (bible §12)

Opt-in only; the reward is exactly what the placement says, nothing more (no
pay-to-win beyond this). When ads are removed, placements are hidden and
`rewarded()` refuses (`{rewarded:false, reason:'ads removed'}`).

| placement | Grant | UI integration (parent) |
|---|---|---|
| `reroll_board` | A fresh deal board for the current year | Deals screen — a "Re-roll board" affordance beside the board; grant = engine board refresh for the year |
| `insider_tip` | True value of one listing revealed | Listing sheet — wires the existing `PE.Market.insiderTip` |
| `renovation_speedup` | One renovation completes a year early (max 1/year) | Property sheet — on an active renovation |
| `skip_quiet_years` | Instant quiet-year skip without the wait | Year menu — grants an immediate `skipQuietYears` pass |

Web fallback: `js/ads.js` plays a visible simulated ad (`REWARDED_SECONDS = 4`),
then the player claims the reward. App builds: the bridge shows a real AdMob
rewarded ad; the reward fires only on the SDK's earned callback.

## Interstitials — caps (owned by `js/ui/year.js`, documented here, not changed)

- Natural break only: the year report, never during a deal or decision.
- At most **1 per 6 in-game years** (`AD.everyYears = 6`).
- At most **1 per 4 wall-clock minutes** (`AD.everyMinutes = 4`).
- **Never in the first 15 minutes** of a new player (`AD.firstMinutes = 15`).
- Plus `MONTHS_BETWEEN_ADS = 5` raw year counter in `js/ads.js` (all caps must pass).

## IAP

| Product | Price | Notes |
|---|---|---|
| Remove Ads | €3.99 | Removes interstitials **and** rewarded placements, permanently, restore-able. |
| Dynasty Pack (2 families) | €2.99 | Bible §12; not built yet. |
| City art packs | TBD | Bible §12; not built yet. |

Purchase state is **native-authoritative**: the bridge's `isAdsRemoved()`
(billing receipt) decides; localStorage is a display cache. The only real
receipt verification is server-side (Play Developer API / App Store Server
API) and lands with the future backend — we do not fake it locally (anti-tamper
theatre was explicitly cut, bible + audit §4).

## Consent & policy

- **UMP (Android) / ATT (iOS)** consent flow ships with the AdMob plugin
  install (P6.1 follow-up); EEA/UK requires it before any ad request.
- Privacy policy: `docs/privacy-policy.md` (linked from the remove-ads sheet;
  parent: also link it in Settings).
- Age rating 12+ ("mild"), gambling: none.

## Release checklist for the app builds

1. `@capacitor-community/admob` + billing plugin installed; real ad unit IDs in
   place of the placeholders; UMP flow verified on an EEA test device.
2. Remove Ads product created in Play Console / App Store Connect with the
   exact sku the bridge expects; restore path tested.
3. Ad cadence re-verified in a release build (the caps live in the web layer —
   confirm they survive the WebView).
4. Data-safety form (Play) / App Privacy labels (Apple) filled from
   `docs/privacy-policy.md`.
