# Privacy Policy — Property Empire

_Last updated: 2026-10-22_

Property Empire ("the game") is a single-player real-estate dynasty game. This
policy covers the web build (played in a browser) and the mobile app builds
(Android via Google Play, iOS via the App Store).

## What the game stores, and where

- **Game saves live on your device only.** The game uses browser/app local
  storage (localStorage in the web build, the app's WebView storage on mobile).
  Saves contain your dynasty's state: properties, cash, family, achievements.
  They never leave the device.
- **Preferences** (sound, theme, 3D quality, ad-removal cache) are also stored
  locally.
- **There is no account, no server, no sync.** Deleting the app or the site's
  data deletes everything. Settings → Export produces a save file you can keep
  or move between devices yourself.

## Analytics

- **Web build: no analytics.** No trackers, no cookies, no fingerprinting, no
  third-party requests beyond the Google Fonts stylesheet (and only if your
  browser allows it; the game works fully offline).
- **App builds (soft launch):** lightweight, privacy-preserving game events
  (e.g. the year reached, the first mortgage taken, a bankruptcy) are buffered
  **locally** (a ring buffer capped at 200 events) and only sent when an
  analytics backend is configured for the build. Events contain no personal
  data, no device identifiers, no precise timestamps beyond coarse ordering —
  and nothing is transmitted without the consent flow described below.
  Retention ("came back after 1 day / 7 days") is computed from the install
  date and last-play date only.

## Advertising (app builds only)

- The **web build shows no third-party ads** (its interstitial is a visible
  placeholder/test overlay).
- **Android and iOS builds show ads through Google AdMob** (interstitials and
  rewarded ads, both heavily capped and opt-in respectively — see
  `docs/monetization.md`).
- **Consent:** before any ad is requested, the Google **UMP** consent flow
  (Android) and Apple's **App Tracking Transparency** prompt (iOS, where
  applicable) ask for your choices. In the EEA/UK you can decline or withdraw
  consent at any time; ads then stop or switch to non-personalised forms as the
  law and Google's policies provide.
- The **Remove Ads** in-app purchase removes all advertising permanently.
- AdMob may process device identifiers and coarse IP data to serve and measure
  ads; Google's policies govern that processing. We do not receive or keep any
  of it.

## Purchases

Purchases (Remove Ads, future packs) are processed by **Google Play** or the
**Apple App Store**. We never see your payment details; we receive only the
purchase token/receipt state needed to unlock the content. Purchase receipts
are verified with the store where a backend check is in place.

## What we never do

- No selling or sharing of personal data — we hold none.
- No email lists, no marketing, no push notifications.
- No tracking across apps or websites.
- No children's data targeting: the game is rated 12+.

## Your rights (GDPR / CCPA)

Because the game stores everything locally and we operate no backend for the
web build, "access" and "deletion" are literally the game's **Delete save**
button (Settings) or clearing the app's storage / uninstalling it. For app
builds, any analytics data in the buffered queue is deleted with the app, and
you may withdraw ad consent at any time via the store-provided consent forms
(AdMob consent dialog on Android; iOS tracking settings).

## Changes

If analytics or a backend are added later, this file is updated before the
build that enables them ships, and the in-app link points at the new text.

## Contact

Questions about this policy: raise an issue at
https://github.com/johnagius/realestategame/issues (or the support address
listed on the store listing).
