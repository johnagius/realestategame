/* PE.Game — the facade the UI and the simulator call. Wires every module,
   wraps all public calls so they never throw ({ok,message,...} always),
   and owns save/load/new dynasty/legacy meta. Load order: see ORDER.txt. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, U = PE.util, St = PE.State, g = PE.guard;

  var Game = {};
  Game.version = '8.10.0';

  /* newGame({ familyId, seed, traitId, perks?, modes?, scenario? }). Perks default to the owned 'passive' perks in meta
     plus the selected 'mode' perks (opts.modes, else the selection stored in meta.modes via Game.setModes).
     'mode' perks apply only through that selection. Perks not owned are ignored. */
  Game.newGame = g('newGame', function (opts) {
    opts = opts || {};
    var meta = PE.Storage.loadMeta(), owned = meta.perks || [];
    if (!opts.perks) {
      var sel = opts.modes || meta.modes || [];
      opts.perks = owned.filter(function (id) { var p = D.perkById(id); return p && p.kind === 'passive'; })
        .concat(sel.filter(function (id) { var p = D.perkById(id); return p && p.kind === 'mode' && (owned.indexOf(id) >= 0 || opts.unlockedPerks === true); }));
    } else opts.perks = opts.perks.filter(function (id) { return owned.indexOf(id) >= 0 || opts.unlockedPerks === true; });
    var s = St.newGame(opts);
    if (PE.Analytics) { var gp = { family: s.familyId, mode: s.mode || 'campaign' }; if (s.scenario) gp.scenario = s.scenario.id; PE.Analytics.track('game_started', gp); }
    var where = s.scenario ? D.cityById[St.unlockedCities()[0]].name + ', ' + s.year + ' (' + s.scenario.name + ')' : 'London, ' + s.year;
    return PE.ok({ state: s, message: 'The ' + s.dynasty.surname + ' dynasty begins in ' + where + '.', scenario: s.scenario ? U.clone(s.scenario) : null, perks: s.perks.slice() });
  });
  Game.state = function () { return PE.S(); };
  /* P6.3: saves go to the run's slot (s.saveSlot, default 1); the slot the player
     last played is remembered in meta.activeSlot so a relaunch continues there. */
  Game.save = g('save', function () {
    var s = PE.S(), slot = s.saveSlot || 1;
    PE.Storage.save(s, slot);
    var meta = PE.Storage.loadMeta(); meta.activeSlot = slot; PE.Storage.saveMeta(meta);
    return PE.ok({ message: 'Saved.', slot: slot });
  });
  Game.load = g('load', function (slot) {
    var meta = PE.Storage.loadMeta();
    var n = (slot === undefined || slot === null) ? (meta.activeSlot || PE.Storage.DEFAULT_SLOT) : slot;
    var s = PE.Storage.load(n); if (!s) return PE.fail('No save');
    s.saveSlot = PE.Storage.slotOf(n) || PE.Storage.DEFAULT_SLOT; // old saves without the field behave as slot 1
    meta.activeSlot = s.saveSlot; PE.Storage.saveMeta(meta);
    PE._state = s; PE.RNG.bind(s);
    return PE.ok({ state: s, slot: s.saveSlot, message: 'Loaded ' + s.familyName + ', ' + s.year + '.' });
  });
  Game.hasSave = g('hasSave', function (slot) { return PE.ok({ hasSave: PE.Storage.has(slot) }); });
  Game.deleteSave = g('deleteSave', function (slot) { PE.Storage.remove(slot); return PE.ok({ message: 'Save deleted.' }); });
  Game.endYear = g('endYear', PE.Turn.endYear);
  Game.skipQuietYears = g('skipQuietYears', PE.Turn.skipQuietYears);
  Game.continueAsHeir = g('continueAsHeir', PE.Turn.continueAsHeir);
  /* Record the current run into meta (legacy points + run history). Idempotent per run: a second call returns the same score
     without adding points again. The UI can call this and then return to family select; newDynasty does both. */
  Game.recordLegacy = g('recordLegacy', function () {
    var s = PE.S(), meta = PE.Storage.loadMeta(), score = PE.Goals.legacyScore();
    if (s.legacyRecorded) return PE.ok({ legacyScore: score, legacyPoints: meta.legacyPoints, alreadyRecorded: true, meta: meta, message: 'Legacy already recorded.' });
    var pts = Game.legacyPointsFor(score);
    meta.legacyPoints = (meta.legacyPoints || 0) + pts;
    meta.runs = meta.runs || []; meta.runs.push({ familyId: s.familyId, mode: s.mode || 'campaign', scenario: s.scenario ? s.scenario.id : null, year: s.year, netWorth: St.netWorth('player'), generation: s.dynasty.generation, score: score, points: pts, status: s.status, mergers: (s.dynasty.mergers || 0) });
    if (meta.runs.length > 20) meta.runs.shift();
    PE.Storage.saveMeta(meta);
    s.legacyRecorded = true;
    return PE.ok({ legacyScore: score, legacyPointsEarned: pts, legacyPoints: meta.legacyPoints, alreadyRecorded: false, meta: meta, message: 'Legacy recorded: ' + score + ' (' + pts + ' prestige point' + (pts === 1 ? '' : 's') + ').' });
  });
  /* Prestige points per run: 1 per 500 legacy score, at least 1 for a run that lasted 10 years (so the perk store is reachable). */
  Game.legacyPointsFor = function (score) { var s = PE.S(); return Math.max(s.year - s.startYear >= 10 ? 1 : 0, Math.floor(score / 500)); };
  /* Finish the run: record legacy (once), then start a fresh dynasty with prestige perks. */
  Game.newDynasty = g('newDynasty', function (opts) {
    var rec = Game.recordLegacy(); if (!rec.ok) return rec;
    var r = Game.newGame(opts || {});
    if (r.ok) { r.legacyScore = rec.legacyScore; r.legacyPointsEarned = rec.legacyPointsEarned || 0; }
    return r;
  });
  Game.legacy = g('legacy', function () { var s = PE.S(); return PE.ok({ score: PE.Goals.legacyScore(), generation: s.dynasty.generation, netWorth: St.netWorth('player'), cities: St.unlockedCities().length, reputation: s.reputation, achievements: s.goals.achievements.length, timeline: s.history.filter(function (h, i) { return i % 5 === 0 || i === s.history.length - 1; }), deaths: s.dynasty.deaths, status: s.status, endReason: s.endReason, meta: PE.Storage.loadMeta(), mergers: s.dynasty.mergers || 0, mode: s.mode || 'campaign', scenario: s.scenario ? U.clone(s.scenario) : null, challenge: s.challenge ? U.clone(s.challenge) : null, recorded: !!s.legacyRecorded, pointsIfRecorded: Game.legacyPointsFor(PE.Goals.legacyScore()) }); });

  /* ---------- Prestige perks store (P5.2) ---------- */
  Game.perks = function () {
    var meta = PE.Storage.loadMeta(), owned = meta.perks || [], sel = meta.modes || [], s = PE.S();
    return PE.ok({ legacyPoints: meta.legacyPoints || 0, perks: D.perks.map(function (p) { return { id: p.id, name: p.name, desc: p.desc, cost: p.cost, kind: p.kind, owned: owned.indexOf(p.id) >= 0, affordable: owned.indexOf(p.id) < 0 && (meta.legacyPoints || 0) >= p.cost, active: !!(s && s.perks && s.perks.indexOf(p.id) >= 0), selected: sel.indexOf(p.id) >= 0 }; }) });
  };
  Game.buyPerk = function (id) {
    var p = D.perkById(id); if (!p) return PE.fail('Unknown perk');
    var meta = PE.Storage.loadMeta(); meta.perks = meta.perks || [];
    if (meta.perks.indexOf(id) >= 0) return PE.fail('Already owned');
    if ((meta.legacyPoints || 0) < p.cost) return PE.fail('Needs ' + p.cost + ' legacy points (you have ' + (meta.legacyPoints || 0) + ')');
    meta.legacyPoints -= p.cost; meta.perks.push(id); PE.Storage.saveMeta(meta);
    return PE.ok({ message: p.name + ' bought for ' + p.cost + ' point' + (p.cost === 1 ? '' : 's') + '.', legacyPoints: meta.legacyPoints, perks: meta.perks.slice() });
  };
  /* Which owned 'mode' perks apply to the next new game. Stored in meta so the choice survives
     across dynasties; the perk store toggles these. Unknown or unowned ids are dropped. Stateless. */
  Game.setModes = function (ids) {
    var meta = PE.Storage.loadMeta(); meta.perks = meta.perks || [];
    meta.modes = (Array.isArray(ids) ? ids : []).filter(function (id) { var p = D.perkById(id); return p && p.kind === 'mode' && meta.perks.indexOf(id) >= 0; });
    PE.Storage.saveMeta(meta);
    return PE.ok({ modes: meta.modes.slice(), message: 'Ways to play updated.' });
  };

  /* ---------- Weekly seeded challenge (P5.3) ---------- */
  /* ISO week key 'YYYY-Www' for a date (UTC). */
  Game.isoWeek = function (date) {
    var d = date ? new Date(date.getTime()) : new Date();
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    var day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)), wk = Math.ceil(((d - y0) / 86400000 + 1) / 7);
    return d.getUTCFullYear() + '-W' + (wk < 10 ? '0' : '') + wk;
  };
  Game.challengeSeed = function (week) { return PE.RNG.hashSeed('pe-challenge-' + week); };
  /* newChallenge({ week? }): the same seed, family, trait and board for everyone that week; a 30-year sprint. */
  Game.newChallenge = g('newChallenge', function (opts) {
    opts = opts || {};
    var week = opts.week ? String(opts.week) : Game.isoWeek(), seed = Game.challengeSeed(week);
    var traits = D.traitIds.filter(function (t) { return D.traits[t].positive; }), traitId = traits[seed % traits.length];
    var r = Game.newGame({ familyId: 'chen', seed: seed, traitId: traitId, perks: [], challenge: { week: week }, endYear: D.startYear + PE.Data.balance.challengeYears - 1 });
    if (r.ok) { r.challenge = U.clone(PE.S().challenge); r.message = 'Weekly challenge ' + week + ': 30 years from ' + D.startYear + ' as the Chens. Seed ' + seed + '.'; }
    return r;
  });
  Game.recordChallenge = function () {
    var s = PE.S(); if (!s || !s.challenge) return null;
    if (s.challenge.recordedEnd) return null; // final result already recorded
    if (s.challenge.recorded && s.status !== 'ended') return null; // mid-run record already taken; only a finished run records again
    var meta = PE.Storage.loadMeta(), score = PE.Goals.challengeScore(), c = meta.challenges[s.challenge.week] || { best: 0, runs: 0, lastYear: null };
    if (!s.challenge.recorded) c.runs++; // one run counted once; best keeps tracking even across a mid-run bankruptcy + heir comeback (P8.1 f10)
    c.lastYear = s.year; c.best = Math.max(c.best, score); meta.challenges[s.challenge.week] = c;
    PE.Storage.saveMeta(meta); s.challenge.recorded = true; s.challenge.score = score;
    if (s.status === 'ended') s.challenge.recordedEnd = true;
    return c;
  };
  Game.challengeInfo = function (opts) {
    var s = PE.S(), meta = PE.Storage.loadMeta(), week = (opts && opts.week) ? String(opts.week) : (s && s.challenge ? s.challenge.week : Game.isoWeek());
    var best = meta.challenges[week] || null, active = !!(s && s.challenge && s.challenge.week === week);
    return PE.ok({ week: week, seed: Game.challengeSeed(week), years: PE.Data.balance.challengeYears, startYear: D.startYear, endYear: D.startYear + PE.Data.balance.challengeYears - 1, familyId: 'chen',
      best: best ? best.best : 0, runs: best ? best.runs : 0, active: active, current: active ? { year: s.year, yearsLeft: Math.max(0, s.challenge.endYear - s.year + 1), score: PE.Goals.challengeScore(), status: s.status } : null, history: meta.challenges });
  };
  Game.scenarios = function () { var out = []; for (var k in D.scenarios) { var sc = D.scenarios[k]; out.push({ id: sc.id, name: sc.name, startYear: sc.startYear, years: PE.Data.balance.scenarioYears, intro: sc.intro, props: sc.props, ltv: sc.ltv }); } return PE.ok({ scenarios: out }); };
  /* A compact overview for the HUD. */
  Game.summary = g('summary', function () {
    var s = PE.S();
    return PE.ok({ year: s.year, era: St.era().name, eraId: St.era().id, status: s.status, family: s.familyName, color: s.color, cash: s.cash, netWorth: St.netWorth('player'), debt: St.debt('player'), ltv: St.ltv('player'),
      reputation: s.reputation, rank: St.rank(), properties: St.propertyCount('player'), cities: St.unlockedCities(), cycle: s.cycle.phase, cycleName: D.cycles[s.cycle.phase].name, baseRate: s.baseRate,
      head: s.dynasty.head.name, headAge: s.dynasty.head.age, generation: s.dynasty.generation, pendingEvents: s.events.pending.length, offers: s.offers.length, auction: s.auction ? PE.Market.auctionView(s.auction) : null,
      paper: s.paper, lastReport: s.lastReport, capacity: PE.Property.capacitySummary(), currency: D.currency,
      mode: s.mode || 'campaign', endYear: s.endYear, scenario: s.scenario ? U.clone(s.scenario) : null, challenge: s.challenge ? { week: s.challenge.week, endYear: s.challenge.endYear, score: PE.Goals.challengeScore() } : null, perks: s.perks.slice(), allies: PE.Rivals.allies() });
  });
  Game.portfolio = g('portfolio', function () { return PE.ok({ properties: St.playerProps().map(PE.Property.view), management: PE.Property.assignManagement() }); });
  Game.property = g('property', function (id) { var p = PE.S().properties[id] || PE.S().listings[id]; if (!p) return PE.fail('No such property'); return PE.ok({ property: p.listing ? PE.Market.listingView(p) : PE.Property.view(p) }); });
  Game.history = g('history', function () { return PE.ok({ history: PE.S().history, events: PE.S().events.log }); });
  Game.families = function () { return PE.ok({ families: U.clone(D.families), traits: U.clone(D.traits), perks: U.clone(D.perks), scenarios: Game.scenarios().scenarios }); };
  PE.Game = Game;

  /* Public, guarded API per bible §13 (modules keep their raw functions for internal use). */
  function wrap(mod, names) { for (var i = 0; i < names.length; i++) (function (n) { var raw = mod[n]; mod[n] = g(n, raw); mod['_' + n] = raw; })(names[i]); }
  wrap(PE.Market, ['listings', 'appraise', 'makeOffer', 'bid', 'withdraw', 'sell', 'offersOnMyProperties', 'respondToOffer', 'insiderTip', 'rerollBoard']);
  wrap(PE.Finance, ['mortgageQuote', 'takeMortgage', 'refinance', 'repay', 'summary']);
  wrap(PE.Property, ['renovate', 'setRent', 'setFlagship', 'releaseFlagship', 'hireManager', 'fireManager']);
  wrap(PE.Dynasty, ['summary', 'chooseHeir', 'educate', 'setupTrust', 'dissolveTrust', 'toggleCharity', 'proposeMarriage', 'mergeWithAlly']);
  wrap(PE.Goals, ['current']);
  wrap(PE.Events, ['pending', 'resolve']);
  wrap(PE.Cities, ['list', 'unlock']);
  PE.Rivals.leaderboard = g('leaderboard', function () { return PE.ok({ leaderboard: PE.Rivals._leaderboardRaw() }); });
  PE.Property.availableManagers = g('availableManagers', function () { return PE.ok({ managers: PE.Property._availableManagersRaw() }); });
})(typeof window !== 'undefined' ? window : global);
