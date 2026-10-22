/* PE.State — the single game state: construction (newGame), ownership
   bookkeeping and derived getters (net worth, debt, LTV, rank). Every other
   module reads/writes PE.S() and never keeps private state of its own. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance;

  PE._state = null;
  PE.S = function () { return PE._state; };
  PE.ok = function (payload) { var r = { ok: true }; if (payload) for (var k in payload) r[k] = payload[k]; if (!r.message) r.message = ''; return r; };
  PE.fail = function (message, payload) { var r = { ok: false, message: message }; if (payload) for (var k in payload) r[k] = payload[k]; return r; };
  /* Wrap a public call: never throw to the caller. */
  PE.guard = function (name, fn) {
    return function () {
      try {
        if (!PE._state && PE.guard.statelessCalls.indexOf(name) < 0) return PE.fail('No game in progress');
        var r = fn.apply(null, arguments);
        return r === undefined ? PE.ok() : r;
      } catch (e) {
        return { ok: false, message: 'Internal error in ' + name + ': ' + (e && e.message), error: String(e && e.stack || e) };
      }
    };
  };

  /* Public calls that work before a game exists (start screen, perk store, challenge lobby). */
  PE.guard.statelessCalls = ['newGame', 'newChallenge', 'load', 'hasSave', 'deleteSave', 'perks', 'buyPerk', 'challengeInfo', 'scenarios', 'families'];

  var U = PE.util = {
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    round: function (v) { return Math.round(v); },
    money: function (v) { return Math.round(v); },
    fmt: function (v) {
      var neg = v < 0; v = Math.abs(Math.round(v));
      var s = v >= 1e9 ? (v / 1e9).toFixed(2) + 'bn' : v >= 1e6 ? (v / 1e6).toFixed(2) + 'm' : v >= 1e4 ? (v / 1e3).toFixed(1) + 'k' : String(v);
      return (neg ? '-' : '') + D.currency + s;
    },
    clone: function (o) { return JSON.parse(JSON.stringify(o)); },
    sum: function (arr, f) { var t = 0; for (var i = 0; i < arr.length; i++) t += f ? f(arr[i]) : arr[i]; return t; },
    keys: function (o) { return Object.keys(o); }
  };

  var State = {};

  State.nextId = function (prefix) { var s = PE.S(); s.nextId++; return prefix + s.nextId; };

  State.ownedIds = function (ownerId) { var s = PE.S(); return s.owned[ownerId] || (s.owned[ownerId] = []); };
  State.ownedProps = function (ownerId) {
    var s = PE.S(), ids = State.ownedIds(ownerId), out = [];
    for (var i = 0; i < ids.length; i++) if (s.properties[ids[i]]) out.push(s.properties[ids[i]]);
    return out;
  };
  State.playerProps = function () { return State.ownedProps('player'); };

  /* Move a property between owners (or in/out of the world). */
  State.setOwner = function (p, ownerId) {
    var s = PE.S();
    if (p.ownerId) {
      var list = State.ownedIds(p.ownerId), idx = list.indexOf(p.id);
      if (idx >= 0) list.splice(idx, 1);
      State.districtCount(p, p.ownerId, -1);
    }
    p.ownerId = ownerId;
    if (ownerId) { State.ownedIds(ownerId).push(p.id); s.properties[p.id] = p; State.districtCount(p, ownerId, +1); }
    else delete s.properties[p.id];
  };
  State.districtCount = function (p, ownerId, delta) {
    var d = State.district(p.cityId, p.district); if (!d) return;
    if (ownerId === 'player') d.playerCount = Math.max(0, (d.playerCount || 0) + delta);
  };
  State.district = function (cityId, name) { var c = PE.S().cities[cityId]; return c ? c.districts[name] : null; };
  State.era = function () { return D.eraFor(PE.S().year); };
  State.eraIdx = function () { return D.eraIndex(State.era().id); };
  State.unlockedCities = function () { var s = PE.S(), out = []; for (var k in s.cities) if (s.cities[k].unlocked) out.push(k); return out; };
  State.tier = function () { return U.clamp(1 + Math.floor((State.unlockedCities().length - 1) / 3), 1, 4); };

  State.debt = function (ownerId) { return U.sum(State.ownedProps(ownerId || 'player'), function (p) { return p.mortgage ? p.mortgage.principal : 0; }); };
  State.assets = function (ownerId) { return U.sum(State.ownedProps(ownerId || 'player'), function (p) { return p.trueValue; }); };
  State.netWorth = function (ownerId) {
    var s = PE.S(); ownerId = ownerId || 'player';
    var cash = ownerId === 'player' ? s.cash : (s.rivals[ownerId.replace('rival:', '')] || { cash: 0 }).cash;
    var nw = cash + State.assets(ownerId) - State.debt(ownerId);
    if (ownerId === 'player') {
      if (PE.Finance && PE.Finance._bondMarketTotal) nw += PE.Finance._bondMarketTotal(); // bonds count at market value (P4.1)
      if (s.bank) nw += s.bank.capital; // the bank pool: vault + loans out (P4.2)
    }
    return Math.round(nw);
  };
  State.equity = function () { return State.assets('player') - State.debt('player'); };
  State.ltv = function (ownerId) { var a = State.assets(ownerId || 'player'); return a > 0 ? State.debt(ownerId || 'player') / a : 0; };
  State.annualDebtService = function (ownerId) {
    return U.sum(State.ownedProps(ownerId || 'player'), function (p) { return p.mortgage ? PE.Finance.annualPayment(p.mortgage) : 0; });
  };
  State.hasTrait = function (t) { var h = PE.S().dynasty.head; return h && h.traits.indexOf(t) >= 0; };
  State.hasPerk = function (id) { var s = PE.S(); return !!(s && s.perks && s.perks.indexOf(id) >= 0); };
  /* Every reputation change goes through here: 'Thick skin' halves losses; clamps 0..100. Returns the applied delta. */
  State.rep = function (delta) {
    var s = PE.S(); if (!delta) return 0;
    if (delta < 0 && State.hasPerk('thick_skin')) delta = delta / 2;
    var before = s.reputation; s.reputation = U.clamp(s.reputation + delta, 0, 100);
    return s.reputation - before;
  };
  State.rank = function () {
    var s = PE.S(), nw = State.netWorth('player'), rank = 1;
    for (var id in s.rivals) if (!s.rivals[id].bankrupt && State.netWorth('rival:' + id) > nw) rank++;
    return rank;
  };
  State.propertyCount = function (ownerId) { return State.ownedIds(ownerId || 'player').length; };
  State.citiesWithProps = function (ownerId) {
    var seen = {}, n = 0, ps = State.ownedProps(ownerId || 'player');
    for (var i = 0; i < ps.length; i++) if (!seen[ps[i].cityId]) { seen[ps[i].cityId] = 1; n++; }
    return n;
  };

  /* ---------- New game ---------- */
  State.newGame = function (opts) {
    opts = opts || {};
    var fam = D.familyById(opts.familyId || 'chen');
    if (!fam) throw new Error('Unknown family ' + opts.familyId);
    var seed = opts.seed === undefined ? 12345 : opts.seed;
    var perks = (opts.perks || []).filter(function (id) { return !!D.perkById(id); });
    var scenario = opts.scenario ? D.scenarioById(opts.scenario) : null;
    if (opts.scenario && !scenario) throw new Error('Unknown scenario ' + opts.scenario);
    if (!scenario && perks.indexOf('crisis_start') >= 0) scenario = D.scenarios.crash1929;
    var startYear = scenario ? scenario.startYear : D.startYear;
    var endYear = scenario ? Math.min(D.endYear, startYear + B.scenarioYears) : (opts.endYear || D.endYear);
    var s = {
      saveVersion: PE.Storage.SAVE_VERSION,
      seed: seed, rng: PE.RNG.hashSeed(seed),
      year: D.startYear, startYear: startYear, endYear: endYear,
      mode: scenario ? 'scenario' : (opts.challenge ? 'challenge' : 'campaign'),
      scenario: scenario ? { id: scenario.id, name: scenario.name, startYear: startYear, winYear: endYear, targetNetWorth: 0, result: null } : null,
      challenge: opts.challenge ? { week: opts.challenge.week, seed: seed, endYear: endYear, score: 0, recorded: false } : null,
      legacyRecorded: false,
      eraId: 'victorian', status: 'playing', endReason: null,
      familyId: fam.id, familyName: fam.name, color: fam.color,
      cash: fam.startCash, startCash: fam.startCash, startNetWorth: 0,
      reputation: fam.reputation,
      nextId: 0,
      cycle: { phase: 'growth', yearsLeft: 3, prev: 'growth', hint: null },
      baseRate: D.eras[0].baseRate, nextRateHint: null,
      priceIndex: 1,
      cities: {}, properties: {}, owned: { player: [] },
      listings: {}, auction: null, offers: [], boardYear: D.startYear,
      bonds: [], bank: null,
      rivals: {}, relations: {},
      ranks: { year: D.startYear, byId: {}, prevYear: null, prevById: {} },
      dynasty: null,
      events: { pending: [], thisYear: 0, log: [], modifiers: {} },
      paper: [],
      goals: { yearly: null, era: null, eraDone: {}, campaignTier: 0, achievements: [], history: [], family: null },
      stats: { bought: 0, sold: 0, belowAsk: 0, auctionsWon: 0, renovations: 0, rebuilds: 0, refinances: 0, forcedSales: 0, forcedSalesThisEra: 0,
               marginCallsMissed: 0, forcedSaleYears: [], negativeCashYears: 0, peakNetWorth: 0, bankruptcies: 0, comebackFrom: 0, flips: 0, brrrr: 0,
               rentTotal: 0, costTotal: 0, firstBuyYear: {}, cityUnlockYear: {}, depressionsSurvived: 0,
               steals: 0, countersClosed: 0, marginCallsCleared: 0, highLtvYears: 0, rank1Years: 0, educated: 0, marriages: 0, mergers: 0, vultures: 0, cashKingYears: 0, trustSuccessions: 0, evictions: 0, yearlyGoalsDone: 0, rothschildLoans: 0, outbidRivals: {},
               builds: 0, buildsDone: 0, bondIncome: 0, bankIncome: 0, bankWriteOffs: 0 },
      history: [],
      lastReport: null,
      perks: perks,
      flags: { insiderUsedYear: 0, chenRevealId: null, allyRevealId: null, warLeaseUntil: 0, vacancyUntil: 0, renoDiscountUntil: 0, surveyorUntil: 0, bombInsured: false, insuredUntil: 0, extraDistressed: 0, extraLand: 0 }
    };
    PE._state = s;
    PE.RNG.bind(s);

    // Cities & districts
    for (var i = 0; i < D.cities.length; i++) {
      var c = D.cities[i], cs = { unlocked: c.id === 'london', unlockedYear: c.id === 'london' ? s.year : null, managerId: null, managerSince: 0, districts: {} };
      for (var j = 0; j < c.districts.length; j++) {
        var dd = c.districts[j];
        cs.districts[dd.name] = { ppsqm: c.basePpsqm * dd.mult * PE.RNG.range(0.92, 1.08), momentum: dd.trend * 0.012 + PE.RNG.range(-0.004, 0.004),
          trendShown: 3, stock: PE.RNG.int(B.districtStock[0], B.districtStock[1]), playerCount: 0, buysThisYear: 0, sat: 0, momentumUntil: 0 };
      }
      s.cities[c.id] = cs;
    }
    State.refreshTrends();
    // Scenario: move the world forward to the start year (prices, rates, era) before anything is bought
    if (scenario) State.fastForward(startYear, scenario);
    s.ranks.year = s.year;

    // Dynasty
    s.dynasty = PE.Dynasty.create(fam, opts.traitId);
    if (fam.id === 'armstrong' && !scenario) PE.Goals.assignFamily();

    // Family perks
    if (fam.perk === 'free_derelict') {
      var p0 = PE.Market.genProperty('london', { type: 'terrace', condition: 12, district: 'Shoreditch' });
      p0.name = 'The Old Silva House'; State.setOwner(p0, 'player'); p0.purchasePrice = 0; p0.purchaseYear = s.year;
    }
    if (fam.perk === 'aristocrat') {
      var a1 = PE.Market.genProperty('london', { type: 'townhouse', condition: 72, district: 'Kensington', sqm: 170 });
      a1.name = 'Armstrong House'; State.setOwner(a1, 'player'); a1.purchasePrice = a1.trueValue; a1.purchaseYear = s.year - 20;
      a1.mortgage = { principal: Math.round(a1.trueValue * 0.68), rate: 0.045, type: 'io', yearsLeft: 0, lender: 'Coutts & Co', fixed: false, since: s.year - 5 };
      var a2 = PE.Market.genProperty('london', { type: 'terrace', condition: 45, district: 'Camden', sqm: 80 });
      a2.name = 'Camden Row Cottage'; State.setOwner(a2, 'player'); a2.purchasePrice = a2.trueValue; a2.purchaseYear = s.year - 8;
      a2.mortgage = { principal: Math.round(a2.trueValue * 0.55), rate: 0.045, type: 'io', yearsLeft: 0, lender: 'Coutts & Co', fixed: false, since: s.year - 3 };
    }
    if (scenario) State.scenarioPortfolio(fam, scenario);
    if (State.hasPerk('second_city') && !s.cities.paris.unlocked) { s.cities.paris.unlocked = true; s.cities.paris.unlockedYear = s.year; s.stats.cityUnlockYear.paris = s.year; }
    if (State.hasPerk('purist')) { var pur = State.playerProps(); for (var qi = 0; qi < pur.length; qi++) pur[qi].mortgage = null; }
    for (var pi = 0, pp = State.playerProps(); pi < pp.length; pi++) PE.Property.initTenancy(pp[pi]);

    // Rivals
    PE.Rivals.create(fam);
    PE.Rivals.snapshotRanks();

    // Market board, goals, paper
    PE.Market.refreshBoard();
    s.startNetWorth = State.netWorth('player');
    s.stats.peakNetWorth = s.startNetWorth;
    if (s.scenario) s.scenario.targetNetWorth = s.startNetWorth;
    PE.Goals.assignYearly();
    PE.Goals.assignEra();
    PE.Events.makePaper();
    if (scenario) {
      // the set-piece of the start year is pending on day one, and the paper tells the story
      var h0 = null; for (var hi = 0; hi < D.historicalEvents.length; hi++) if (D.historicalEvents[hi].year === startYear) h0 = D.historicalEvents[hi];
      if (h0) PE.Events.push({ id: 'hist_' + h0.year, title: h0.title, text: h0.text, choices: h0.choices, kind: 'historical' });
      s.paper.unshift({ kind: 'headline', text: scenario.intro });
    }
    s.history.push({ year: s.year, netWorth: s.startNetWorth, cash: s.cash, debt: State.debt('player'), rank: State.rank(), props: State.propertyCount('player') });
    return s;
  };

  /* Scenario support (P5.4): advance the world deterministically to a later start year.
     Prices and the index grow at each era's mean rate (no cycles), rates sit at the era centre. */
  State.fastForward = function (toYear, scenario) {
    var s = PE.S();
    while (s.year < toYear) {
      var era = D.eraFor(s.year);
      for (var cid in s.cities) {
        var c = D.cityById[cid], ds = s.cities[cid].districts;
        for (var dn in ds) ds[dn].ppsqm *= 1 + c.growth + era.drift + 0.012;
      }
      s.priceIndex *= 1 + 0.028 + era.drift + 0.008;
      s.year++;
    }
    s.eraId = D.eraFor(s.year).id;
    s.baseRate = scenario && scenario.baseRate ? scenario.baseRate : D.eraFor(s.year).baseRate;
    s.boardYear = s.year; s.ranks.year = s.year;
    s.cycle = { phase: scenario ? scenario.cycle : 'growth', yearsLeft: 1, prev: 'boom', hint: null };
    if (scenario && scenario.cities) for (var i = 0; i < scenario.cities.length; i++) { var cs = s.cities[scenario.cities[i]]; if (cs && !cs.unlocked && D.cityById[scenario.cities[i]].availableFrom <= s.year) { cs.unlocked = true; cs.unlockedYear = s.year; s.stats.cityUnlockYear[scenario.cities[i]] = s.year; } }
    for (var k in s.cities) if (s.cities[k].unlocked) s.cities[k].unlockedYear = s.year;
    State.refreshTrends();
  };
  /* A pre-built leveraged portfolio for a scenario start: cash and buildings scaled to the price level. */
  State.scenarioPortfolio = function (fam, sc) {
    var s = PE.S(), cities = State.unlockedCities(), cashBase = fam.startCash * s.priceIndex;
    s.cash = Math.round(cashBase * sc.cashMult); s.startCash = Math.round(cashBase);
    for (var i = 0; i < sc.props; i++) {
      var cid = cities[i % cities.length];
      var p = PE.Market.genProperty(cid, { condition: PE.RNG.int(45, 80) });
      var target = cashBase * PE.RNG.range(0.5, 0.9), scale = target / p.trueValue, t = D.propertyTypes[p.type];
      p.sqm = Math.round(U.clamp(p.sqm * scale, t.sqm[0], t.sqm[1])); PE.Property.revalue(p);
      p.purchasePrice = p.trueValue; p.purchaseYear = s.year - PE.RNG.int(2, 12);
      p.mortgage = PE.Finance.makeMortgage('player', Math.round(p.trueValue * sc.ltv), 'io', false);
      p.mortgage.since = s.year - 3; p.mortgage.lastRefi = s.year - 3;
      State.setOwner(p, 'player');
    }
  };

  /* Trend arrows 1..5 are a noisy view of momentum (bible §3.2). */
  State.refreshTrends = function () {
    var s = PE.S();
    for (var cid in s.cities) {
      var ds = s.cities[cid].districts;
      for (var dn in ds) {
        var d = ds[dn], v = d.momentum + PE.RNG.range(-0.006, 0.006);
        d.trendShown = v < -0.01 ? 1 : v < 0.0 ? 2 : v < 0.012 ? 3 : v < 0.025 ? 4 : 5;
      }
    }
  };

  PE.State = State;
})(typeof window !== 'undefined' ? window : global);
