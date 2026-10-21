# Property Empire v8 — Debugging & Testing

```bash
node js/sim/tests.js          # unit tests (engine contract, determinism, finance, goals never pre-satisfied, save round trip)
node js/sim/balance.js        # full bible §14 table (~50 s)
node js/sim/balance.js 20 5   # quick pass (20 seeds × 30 y, 5 seeds × 180 y)
python3 -m http.server 8790 --bind 127.0.0.1   # then open http://127.0.0.1:8790/index.html?seed=42
```

## In the browser console
```js
PE.Game.summary()                 // HUD-level overview
PE.Game.portfolio()               // owned properties (view objects)
PE.Market.listings('london')      // the deal board
PE.Finance.summary()              // cash, debt, LTV, covenant warnings
PE.Rivals.leaderboard()
PE.Goals.current()
PE.Events.pending()
PE.Game.state()                   // raw state (do not mutate)
PE.Game.endYear()                 // advance one year; returns the YearReport
```

Determinism: `?seed=N` on the URL fixes the RNG; the same seed and the same actions reproduce the same game, in the browser and in Node.

## Conventions
- Every engine call returns `{ ok, message, ...payload }` and never throws.
- Money is integer pounds; years are integers; state is JSON-serialisable.
- When the bible and the code disagree, the bible wins; when the bible is silent, write the decision into the bible (section 16).
