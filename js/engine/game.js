/* PE.Game — the facade the UI and the simulator call. Wires every module,
   wraps all public calls so they never throw ({ok,message,...} always),
   and owns save/load/new dynasty/legacy meta. Load order: see ORDER.txt. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, U = PE.util, St = PE.State, g = PE.guard;

  var Game = {};
  Game.version = '8.0.0';

  Game.newGame = g('newGame', function (opts) {
    opts = opts || {};
    var meta = PE.Storage.loadMeta();
    if (!opts.perks) opts.perks = meta.perks || [];
    var s = St.newGame(opts);
    return PE.ok({ state: s, message: 'The ' + s.dynasty.surname + ' dynasty begins in London, ' + s.year + '.' });
  });
  Game.state = function () { return PE.S(); };
  Game.save = g('save', function () { PE.Storage.save(PE.S()); return PE.ok({ message: 'Saved.' }); });
  Game.load = g('load', function () {
    var s = PE.Storage.load(); if (!s) return PE.fail('No save');
    PE._state = s; PE.RNG.bind(s);
    return PE.ok({ state: s, message: 'Loaded ' + s.familyName + ', ' + s.year + '.' });
  });
  Game.hasSave = g('hasSave', function () { return PE.ok({ hasSave: PE.Storage.has() }); });
  Game.deleteSave = g('deleteSave', function () { PE.Storage.remove(); return PE.ok({ message: 'Save deleted.' }); });
  Game.endYear = g('endYear', PE.Turn.endYear);
  Game.skipQuietYears = g('skipQuietYears', PE.Turn.skipQuietYears);
  Game.continueAsHeir = g('continueAsHeir', PE.Turn.continueAsHeir);
  /* Finish the run: record legacy, then start a fresh dynasty with prestige perks. */
  Game.newDynasty = g('newDynasty', function (opts) {
    var s = PE.S(), meta = PE.Storage.loadMeta(), score = PE.Goals.legacyScore();
    meta.legacyPoints = (meta.legacyPoints || 0) + score;
    meta.runs = meta.runs || []; meta.runs.push({ familyId: s.familyId, year: s.year, netWorth: St.netWorth('player'), generation: s.dynasty.generation, score: score, status: s.status });
    if (meta.runs.length > 20) meta.runs.shift();
    PE.Storage.saveMeta(meta);
    var r = Game.newGame(opts || {});
    if (r.ok) r.legacyScore = score;
    return r;
  });
  Game.legacy = g('legacy', function () { var s = PE.S(); return PE.ok({ score: PE.Goals.legacyScore(), generation: s.dynasty.generation, netWorth: St.netWorth('player'), cities: St.unlockedCities().length, reputation: s.reputation, achievements: s.goals.achievements.length, timeline: s.history.filter(function (h, i) { return i % 5 === 0 || i === s.history.length - 1; }), deaths: s.dynasty.deaths, status: s.status, endReason: s.endReason, meta: PE.Storage.loadMeta() }); });
  /* A compact overview for the HUD. */
  Game.summary = g('summary', function () {
    var s = PE.S();
    return PE.ok({ year: s.year, era: St.era().name, eraId: St.era().id, status: s.status, family: s.familyName, color: s.color, cash: s.cash, netWorth: St.netWorth('player'), debt: St.debt('player'), ltv: St.ltv('player'),
      reputation: s.reputation, rank: St.rank(), properties: St.propertyCount('player'), cities: St.unlockedCities(), cycle: s.cycle.phase, cycleName: D.cycles[s.cycle.phase].name, baseRate: s.baseRate,
      head: s.dynasty.head.name, headAge: s.dynasty.head.age, generation: s.dynasty.generation, pendingEvents: s.events.pending.length, offers: s.offers.length, auction: s.auction ? PE.Market.auctionView(s.auction) : null,
      paper: s.paper, lastReport: s.lastReport, capacity: PE.Property.capacitySummary(), currency: D.currency });
  });
  Game.portfolio = g('portfolio', function () { return PE.ok({ properties: St.playerProps().map(PE.Property.view), management: PE.Property.assignManagement() }); });
  Game.property = g('property', function (id) { var p = PE.S().properties[id] || PE.S().listings[id]; if (!p) return PE.fail('No such property'); return PE.ok({ property: p.listing ? PE.Market.listingView(p) : PE.Property.view(p) }); });
  Game.history = g('history', function () { return PE.ok({ history: PE.S().history, events: PE.S().events.log }); });
  Game.families = function () { return PE.ok({ families: U.clone(D.families), traits: U.clone(D.traits) }); };
  PE.Game = Game;

  /* Public, guarded API per bible §13 (modules keep their raw functions for internal use). */
  function wrap(mod, names) { for (var i = 0; i < names.length; i++) (function (n) { var raw = mod[n]; mod[n] = g(n, raw); mod['_' + n] = raw; })(names[i]); }
  wrap(PE.Market, ['listings', 'appraise', 'makeOffer', 'bid', 'withdraw', 'sell', 'offersOnMyProperties', 'respondToOffer', 'insiderTip']);
  wrap(PE.Finance, ['mortgageQuote', 'takeMortgage', 'refinance', 'repay', 'summary']);
  wrap(PE.Property, ['renovate', 'setRent', 'hireManager', 'fireManager']);
  wrap(PE.Dynasty, ['summary', 'chooseHeir', 'educate', 'setupTrust', 'dissolveTrust', 'proposeMarriage']);
  wrap(PE.Goals, ['current']);
  wrap(PE.Events, ['pending', 'resolve']);
  wrap(PE.Cities, ['list', 'unlock']);
  PE.Rivals.leaderboard = g('leaderboard', function () { return PE.ok({ leaderboard: PE.Rivals._leaderboardRaw() }); });
  PE.Property.availableManagers = g('availableManagers', function () { return PE.ok({ managers: PE.Property._availableManagersRaw() }); });
})(typeof window !== 'undefined' ? window : global);
