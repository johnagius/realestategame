/* PE.Cities — unlocking cities: an expansion cost (travel + office) that
   scales with price level, city tier and how many cities you already hold,
   gated by a reputation threshold and the city's historical availability.
   Pacing target (bible §8): 2nd city ~year 10, 5 by ~50, all by ~120. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, St = PE.State;

  var C = {};
  C.expansionCost = function (cityId) {
    var s = PE.S(), c = D.cityById[cityId], n = St.unlockedCities().length;
    return Math.round(B.expansionBase * s.priceIndex * B.expansionTierMult[c.tier] * (1 + B.expansionCountMult * (n - 1)) * (c.basePpsqm / 14 * 0.5 + 0.5));
  };
  C.repRequired = function (cityId) {
    var c = D.cityById[cityId], n = St.unlockedCities().length;
    return Math.min(90, B.expansionRepBase + B.expansionRepStep * (n - 1) + c.tier * 3);
  };
  C.info = function (cityId) {
    var s = PE.S(), c = D.cityById[cityId], cs = s.cities[cityId], avg = 0, n = 0;
    for (var dn in cs.districts) { avg += cs.districts[dn].ppsqm; n++; }
    var cost = C.expansionCost(cityId), rep = C.repRequired(cityId), avail = c.availableFrom <= s.year;
    return { id: c.id, name: c.name, country: c.country, trait: c.trait, traitName: D.cityTraits[c.trait].name, traitDesc: D.cityTraits[c.trait].desc, tier: c.tier, unlocked: cs.unlocked, unlockedYear: cs.unlockedYear,
      available: avail, availableFrom: c.availableFrom, cost: cost, repRequired: rep, canUnlock: !cs.unlocked && avail && s.cash >= cost && s.reputation >= rep,
      avgPricePerSqm: Math.round(avg / n * 100) / 100, grossYield: c.grossYield, taxRate: c.taxRate, growth: c.growth, managerId: cs.managerId, properties: St.playerProps().filter(function (p) { return p.cityId === c.id; }).length,
      districts: Object.keys(cs.districts).map(function (k) { return { name: k, pricePerSqm: Math.round(cs.districts[k].ppsqm * 100) / 100, trend: cs.districts[k].trendShown, playerShare: Math.round(cs.districts[k].playerCount / cs.districts[k].stock * 100) }; }) };
  };
  C.list = function () { var out = []; for (var i = 0; i < D.cities.length; i++) out.push(C.info(D.cities[i].id)); return PE.ok({ cities: out }); };
  C.cheapestLocked = function () {
    var s = PE.S(), best = null;
    for (var i = 0; i < D.cities.length; i++) { var c = D.cities[i]; if (s.cities[c.id].unlocked || c.availableFrom > s.year) continue; var inf = C.info(c.id); if (!best || inf.cost < best.cost) best = inf; }
    return best;
  };
  C.unlock = function (cityId) {
    var s = PE.S(), c = D.cityById[cityId], cs = s.cities[cityId];
    if (!c) return PE.fail('Unknown city');
    if (cs.unlocked) return PE.fail(c.name + ' is already open');
    if (c.availableFrom > s.year) return PE.fail(c.name + ' is not a market yet (from ' + c.availableFrom + ')');
    var cost = C.expansionCost(cityId), rep = C.repRequired(cityId);
    if (s.reputation < rep) return PE.fail('Reputation ' + rep + ' needed to be received in ' + c.name);
    if (s.cash < cost) return PE.fail('Expansion costs ' + U.fmt(cost));
    s.cash -= cost; cs.unlocked = true; cs.unlockedYear = s.year; s.stats.cityUnlockYear[cityId] = s.year;
    if (PE.Analytics) PE.Analytics.track('city_unlocked', { city: cityId });
    PE.Market.topUpCity(cityId);
    return PE.ok({ message: 'An office opens in ' + c.name + '.', cost: cost, city: C.info(cityId) });
  };
  /* P7 live-ops: register a city from a pack (docs/live-ops.md §city-packs).
     The def mirrors a D.cities entry (see data.js city()): economy, trait,
     availability and districts; the 3D layer is a separate CityDef_* global
     loaded via <script> before the city first renders. Registration mutates
     D.cities/D.cityById, so it takes effect from the next new game on. */
  C.registerPack = function (def) {
    if (!def || typeof def !== 'object' || Array.isArray(def)) return PE.fail('City pack must be an object');
    if (typeof def.id !== 'string' || !/^[a-z][a-z0-9_]{1,23}$/.test(def.id)) return PE.fail('City id must be 2–24 chars: lowercase letters, digits, underscore, starting with a letter');
    if (D.cityById[def.id]) return PE.fail('A city with id "' + def.id + '" already exists');
    if (typeof def.name !== 'string' || !def.name.trim()) return PE.fail('City needs a name');
    if (typeof def.country !== 'string' || !def.country.trim()) return PE.fail('City needs a country');
    if (!D.cityTraits[def.trait]) return PE.fail('Unknown city trait "' + def.trait + '" (one of: ' + Object.keys(D.cityTraits).join(', ') + ')');
    if (!(def.tier === 0 || def.tier === 1 || def.tier === 2 || def.tier === 3)) return PE.fail('City tier must be an integer 0–3');
    if (!(isFinite(def.availableFrom) && Math.round(def.availableFrom) === def.availableFrom && def.availableFrom >= 1800 && def.availableFrom <= 2100)) return PE.fail('availableFrom must be an integer year 1800–2100');
    var nums = ['basePpsqm', 'grossYield', 'taxRate', 'growth'];
    for (var ni = 0; ni < nums.length; ni++) {
      var k = nums[ni];
      if (!(isFinite(def[k]) && def[k] >= 0)) return PE.fail(k + ' must be a non-negative number');
    }
    if (!Array.isArray(def.districts) || def.districts.length < 4) return PE.fail('City needs at least 4 districts ([{name, mult, trend}])');
    var seen = {};
    for (var di = 0; di < def.districts.length; di++) {
      var dd = def.districts[di];
      if (!dd || typeof dd !== 'object') return PE.fail('District ' + (di + 1) + ' must be an object');
      if (typeof dd.name !== 'string' || !dd.name.trim()) return PE.fail('District ' + (di + 1) + ' needs a name');
      if (seen[dd.name]) return PE.fail('Duplicate district "' + dd.name + '"');
      seen[dd.name] = 1;
      if (!(isFinite(dd.mult) && dd.mult >= 0.2 && dd.mult <= 3)) return PE.fail('District "' + dd.name + '": mult must be a number 0.2–3');
      if ([-1, 0, 1, 2].indexOf(dd.trend) < 0) return PE.fail('District "' + dd.name + '": trend must be -1 (declining), 0 (stable), 1 (up-and-coming) or 2 (hot)');
    }
    D.cities.push(def); D.cityById[def.id] = def;
    return PE.ok({ message: def.name + ' joins the map (from ' + def.availableFrom + '). Starts with the next new game.', city: def });
  };
  PE.Cities = C;
})(typeof window !== 'undefined' ? window : global);
