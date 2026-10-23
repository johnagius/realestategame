# Analytics — soft-launch scaffolding (P6.7)

Goal: learn where players stall, churn or bounce back **without collecting
personal data**. Local-first: events buffer on the device; nothing is
transmitted until a backend exists and the app build's consent flow (UMP/ATT,
see `docs/monetization.md`) has run.

## What exists now

`PE.Analytics` (`js/engine/storage.js`, so it loads with the engine and works
headless in the simulator):

```js
PE.Analytics.track(event, props?)   // append { e, p, t } to the ring buffer (cap 200, drops oldest)
PE.Analytics.events()                // copy of the buffer
PE.Analytics.count() / .clear()
PE.Analytics.flush()                 // delivers via PE.Analytics.onFlush(events) → boolean;
                                     // clears the buffer only on success (at-least-once)
PE.Analytics.onFlush = null          // the future backend hook — assign a sender, e.g.
                                     // (events) => postToCollector(events) === true
```

Storage: `localStorage` key `pe_v8_analytics`, a plain JSON array — survives
restarts, trivially inspectable, capped at 200 events (~25 KB worst case).

Engine call-sites fire the gameplay events at the source moments (see table):
`PE.Game.newGame`/`newChallenge` (`game_started`), `PE.Turn.endYear`
(`year_reached`, `bankruptcy`), `PE.Turn.continueAsHeir` (`comeback`),
`PE.Finance.takeMortgage` (`first_mortgage`), the `PE.Market` auction-win paths
(`first_auction_win`), `PE.Property.renovate`/`commissionBuild`
(`first_renovation`), `PE.Cities.unlock` (`city_unlocked`),
`PE.Dynasty.proposeMarriage`/`mergeWithAlly` (`heir_married`/`dynasty_merged`)
and `PE.Goals.evaluate` (`goal_achieved`, yearly/era/family/campaign kinds).
The `first_*` events are deduped once per run via flags in `s.flags`.
The two monetisation events (`remove_ads_purchased`, `rewarded_watched`) are
UI/ads.js moments, wired by the UI owner.

Everything stays in the local ring buffer: nothing is transmitted until a
backend assigns `onFlush` and the app build's consent flow has run
(`docs/privacy-policy.md`).

## Event taxonomy

All events: `{ e: string, p: flat object, t: ISO string }`.

| event | props | fired when |
|---|---|---|
| `game_started` | `{ family, mode, scenario? }` | first year of a run |
| `year_reached` | `{ year, era, netWorth, rank }` | every year end (cheap: one per year) |
| `first_mortgage` | `{ ltv, type }` | the player's first mortgage taken |
| `first_auction_win` | `{ premium }` | first auction won above asking |
| `first_renovation` | `{ tier }` | first renovation started |
| `bankruptcy` | `{ year, netWorth }` | the house falls |
| `comeback` | `{ yearsToComeback? }` | continue-as-heir succeeds |
| `dynasty_merged` / `heir_married` | `{ rival }` | alliance milestones |
| `city_unlocked` | `{ city }` | expansion |
| `goal_achieved` | `{ kind, id }` | yearly/era/campaign goals |
| `remove_ads_purchased` | `{}` | IAP confirmation |
| `rewarded_watched` | `{ placement }` | a rewarded ad completes |

## Retention definitions (soft launch: 2 countries, bible §12/TASKS P6.7)

- **D1 / D7**: the share of installers whose `game_started` day is followed by
  a `year_reached` event on day +1 / day +7 (local device dates — no cross-app
  identifiers needed).
- **Session depth**: years per session = `year_reached` count between two
  `game_started` events on different local days.
- **Funnel**: started → first_mortgage (year ≤ 3 target) → first_auction_win →
  year 10 reached. Bankruptcy rate by year band. Drop-off after the first
  estate-tax succession is the key dynasty-loop question.

## Future backend contract

`PE.Analytics.onFlush = function (events) { … return true; }` is the entire
integration surface: batch-send `events` to the collector over HTTPS, return
`true` only after the server acks (buffer is cleared then), `false` to retry
next launch. A backend should accept the events verbatim and stamp
`install_id` server-side from the auth token — the client never adds
identifiers. Until that ships, `flush()` is a no-op and **zero bytes leave the
device**.

## Privacy

See `docs/privacy-policy.md`: no personal data, no ad IDs, no precise
timestamps beyond ISO ordering, ring buffer deleted with the app, consent gate
before any transmission in app builds.
