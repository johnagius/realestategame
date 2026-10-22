# Live-ops guide — event packs, city packs, the leaderboard

How content ships without an app update. Everything here is data-driven and
validated at load; nothing below adds a mechanic, so pillar 1 (every choice a
real trade-off) and the engine contract (`{ok,message,...}`, no throws) hold
for packs exactly as for built-ins.

---

## 1. Event packs

### 1.1 Format

A pack is one JSON file:

```json
{
  "id": "winter-1890",
  "name": "A Hard Winter",
  "events": [
    {
      "id": "winter-1890:burst_pipes",
      "kind": "random",
      "weight": 2,
      "minProps": 1,
      "minYear": 1850,
      "maxYear": 2030,
      "title": "The pipes burst",
      "text": "The frost splits the pipes at {prop}. Water is coming through the ceiling.",
      "choices": [
        { "label": "Repair properly (pay 4% of its value)", "fx": { "propCostPct": 0.04 } },
        { "label": "Let the tenants cope (−1 reputation; condition −8)", "fx": { "reputation": -1, "propCondition": -8 } }
      ]
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | 2–32 chars `a-z 0-9 - _`; namespacing events as `packid:eventid` is required in practice |
| `name` | yes | Shown to no player; used in logs and review |
| `events[].id` | yes | 2–64 chars, unique across **all** packs and built-ins |
| `kind` | no | Only `"random"` allowed; omit it |
| `weight` | no | Relative frequency, > 0 (default 1) |
| `minProps`, `minMembers` | no | Portfolio gates, same as built-ins |
| `minYear`, `maxYear` | no | Calendar-year window (1850–2030), inclusive |
| `title`, `text` | yes | Placeholders `{prop} {district} {city} {member} {rival} {type}` are filled like built-ins |
| `choices` | yes | 2–4; each `{label, fx}` |

`fx` is **the built-in vocabulary only** — the exact set `applyFx` in
`js/engine/events.js` implements (`PE.Events.FX_VOCABULARY`). Unknown keys or
wrong shapes are rejected with `{ok:false}`. If a design needs an effect the
vocabulary can't express, the mechanic goes into the engine first (with a
balance-table run), and only then into packs. Compound shapes in use:
`gamble {p,win,lose}`, `gambleNW {p,win?,lose?,loseWin?,loseRep?}`,
`propGamble {p,winCond?,loseCostPct?,loseCond?,loseRep?}`,
`districtShockChance {p,shock}`, `districtMomentumChance {p,years}`,
`petition {p,shock,factor}`, `lease {years,setting}`,
`inheritProperty {ltv}`, `namedRelation {id,delta}`,
`cityMomentum {city,years}`, `giftProperty {pct,city?,type?,condition?}`,
`absorbRival {rivalId,by,price}`.

### 1.2 Runtime behaviour

`PE.Events.registerPack(pack)` validates and merges the pack into the yearly
random pool. Pack events:

- roll with the same cadence as built-in random events (`randomEventChance`,
  25% chance of a second try);
- are capped at **2 per game-year** (`PE.Events.PACK_PER_YEAR`) and never push
  a year past `balance.maxEventsPerYear`;
- are pushed with `kind: 'pack'`, pended and resolved through the same code as
  built-ins — pending blocks end-year, choices apply through the same `applyFx`.

Registration is session-lifetime and applies to every new game; it is not
stored in saves.

### 1.3 Shipping a pack without an app update

Packs are static JSON, so ops ships one by hosting the file and having the app
fetch it. The helper is already in the engine (nothing calls it at runtime
yet — wire it behind your own gate):

```js
PE.Events.fetchPack('https://static.example.com/pe-packs/winter-1890.json', {
  maxBytes: 65536,   // default 64 KiB; oversize packs are rejected
  timeoutMs: 5000    // default 5 s; slow hosts are rejected
}).then(function (r) {
  if (r.ok) console.log(r.message); else console.warn('pack rejected:', r.message);
});
```

`fetchPack` never rejects: it always resolves to `{ok,message,...}` and runs
the fetched JSON through the same `registerPack` validation. The demo pack in
`js/engine/pack-demo.js` shows the exact shape and is the reference
implementation; it registers only when the meta flag `packsEnabled`
(`PE.Storage.loadMeta().flags.packsEnabled`) or the URL param `?packs=1` is
set.

### 1.4 Submission & review checklist

Every pack, in-house or community, passes all of these before it ships:

1. **Validates.** `PE.Events.registerPack(pack)` returns `{ok:true}` — unknown
   fx keys, bad shapes, duplicate ids and calendar-window mistakes are all
   caught here.
2. **Pillar 1.** Every event has **two or more choices that are a real
   trade-off**: no choice may dominate another on both expected value *and*
   variance (bible §2, §16.1 events v2). Money-equivalent EVs must sit within
   ±20% of each other, floored at 3% of net worth.
3. **Monte-Carlo green.** The pillar-1 check is enforced, not eyeballed:

   ```bash
   # per-pack check (same machinery as the built-in gate)
   node -e "var mc=require('./js/sim/eventsmc.js'),load=require('./js/sim/load.js');\
     var pack=require('fs').readFileSync(process.argv[1],'utf8');\
     var PE=load(),p=JSON.parse(pack),f=[];\
     PE.Events.registerPack(p);\
     p.events.forEach(function(ev){var pr=mc.judge(mc.evaluate(load,ev,40));if(pr.length)f.push(ev.id+': '+pr.join('; '));});\
     console.log(f.length?('FAIL '+f.join(' | ')):'pack MC-clean');" path/to/pack.json
   ```

   The demo pack is covered by this check in `js/sim/tests.js`.
4. **Era voice.** Text reads like the year it fires: gaslight before 1910,
   trams and omnibuses before 1930, wiring and motor cars after 1880/1900,
   platforms and screens in the Digital era. Use `minYear`/`maxYear` to keep
   anachronisms out, and placeholders (`{prop}`, `{district}`, …) so the event
   lands on the player's actual holdings. Read the built-in events in
   `js/engine/data.js` (`D.randomEvents`) for tone.
5. **No satisfaction at start.** An event must never fire to zero effect for
   the target player (e.g. portfolio-wide fx behind `minProps` gates the event
   is meant to tax).
6. **Size & speed.** One pack ≤ 50 events and ≤ 64 KiB; fetch guards enforce
   both ceilings in production.

---

## 2. Weekly leaderboard (`PE.LB`, `js/engine/lb.js`)

Local-first today: `PE.LB.submit({name?, score, year?, gens?, week?})` and
`PE.LB.board(week?)` against a `localStorage` ring (`pe_v8_lb`, top 100 per
week, 12 newest weeks). `Game.recordChallenge` is wrapped at load time, so
every finished weekly challenge lands on the board with no game.js change.

**Backend swap contract.** Replace exactly two functions — `PE.LB.submit` and
`PE.LB.board` — keeping names, signatures and return shapes:

- `submit(entry)` → `{ok, message, week, entry:{name,score,year,gens,ts}, rank}`
- `board(week?)` → `{ok, week, board:[{rank,name,score,year,gens}], top, you}`

`PE.LB.hook(fn)` observers and the `recordChallenge` wrapper only touch those
two functions, so the server version drops in without UI changes. UI
integration point (one line, owned by the challenge-lobby screen):
`PE.LB.board().board` wherever the weekly lobby renders standings.

---

## 3. City packs (`PE.Cities.registerPack`, `js/engine/cities.js`)

A city is two halves:

1. **The engine def** — mirrors a `D.cities` entry (see `city()` in
   `js/engine/data.js`): `{id, name, country, trait, tier (0–3), availableFrom
   (year 1800–2100), basePpsqm, grossYield, taxRate, growth, districts:
   [{name, mult (0.2–3), trend (-1|0|1|2)}]}` with ≥ 4 districts. `trait` must
   be one of the eight in `D.cityTraits`; the whole set drives expansion cost,
   reputation gates, yields and the unlock flow — no new mechanics needed.
2. **The 3D def** — a `CityDef_<Name>` global (`js/cities/*.js`): a `layout`
   grid of tile letters (`RD` road, `W` water, `CP` park, plus building slots
   from `City3D.BLDG_TYPES`: `HO ST AP PH TH VI MN CM WR SK`), `landmarks`
   (factory functions returning `THREE.Group`s keyed by their layout letter),
   `landmarkNames`, optional `landmarkGround`/`landmarkEras`. `js/ui/city.js`
   maps `cityId → CityDef_*` global name.

Loader sketch for a pack city:

```js
function loadCityPack(url, def) {              // def = the engine half (JSON)
  var s = document.createElement('script');
  s.src = url;                                  // sets window.CityDef_<Name>
  s.onload = function () {
    var r = PE.Cities.registerPack(def);
    if (!r.ok) console.warn('city pack rejected:', r.message);
    // else: available from the next new game; the 3D layer renders when the city unlocks
  };
  s.onerror = function () { console.warn('city pack script failed to load'); };
  document.head.appendChild(s);
}
```

Validation (duplicate ids, bad trait/tier/years, district shape) happens in
`registerPack`; registration mutates `D.cities`/`D.cityById`, so it takes
effect from the **next** new game — registering mid-run does not rewrite the
current save's map.
