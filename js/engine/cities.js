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
    PE.Market.topUpCity(cityId);
    return PE.ok({ message: 'An office opens in ' + c.name + '.', cost: cost, city: C.info(cityId) });
  };
  PE.Cities = C;
})(typeof window !== 'undefined' ? window : global);
