#!/usr/bin/env node
/* Contest harness (P8.4–P8.6): competitive-balance and contest-dynamics measurement.
   4 families × 3 strategies (naive / competent / expert) × N seeds on a 60-year horizon,
   a smaller set of full-length (181y) confirmation runs, a 3-scenario × 2-strategy matrix
   and a weekly-challenge determinism check. Prints distributions (min/p25/median/p75/max),
   explicit outliers, guard PASS/FAIL rows (balance.js idiom) and a plain-text assessment.
   Read-only against the engine: only public PE.* calls, one reusable instance (like balance.js).
   Usage: node js/sim/contest.js [seeds] [fullSeeds]   (defaults 30 and 3) */
var load = require('./load.js');
var args = process.argv.slice(2).filter(function (a) { return /^\d+$/.test(a); });
var SEEDS = +args[0] || 30, FULL_SEEDS = +args[1] || 3;
var FAMILIES = ['silva', 'chen', 'armstrong', 'vanderbilt'];
var STRATS = ['naive', 'competent', 'expert'];
var SCENARIOS = ['crash1929', 'oilshock1973', 'gfc2008'];
var MATRIX_HORIZON = 60;   // full instrumented campaigns measure ~1.5–2s/run (181 years): 360 full runs
                           // ≈ 10–12 min, over the 5-minute budget. 60y (1850–1910) covers two eras;
                           // full-length confirmation runs below verify late-game dynamics.

/* expert: competent's full turn, then four extra layers on a thinner reserve —
   (1) one more acquisition per year, chasing auctions up to the estimate (competent caps at 97%);
   (2) earlier city expansion (2 properties and 1.1× the unlock cost in cash);
   (3) saturation-aware short-let push: convert only while the district share is below the
       dilution threshold, own-portfolio cap 65% (competent stops at 50%);
   (4) trust timing (set up when the head is ≥58 and the house is rich, dissolved for a young
       heir) and an endgame rank-1 push: in the last 12 years the reserve shrinks and
       full-estimate buys are allowed. */
function makeExpert(PE, players) {
  var St = PE.State, B = PE.Data.balance, D = PE.Data;
  function reserve(mult) {
    var s = PE.S();
    return Math.max(St.annualDebtService('player') * 1.0, St.debt('player') * 0.04, 15 * s.priceIndex) * mult;
  }
  return {
    name: 'expert',
    play: function () {
      var s = PE.S(), i, p;
      players.competent.play();
      if (s.status !== 'playing') return;
      var endgame = s.endYear - s.year <= 12;
      var trouble = s.cycle.phase === 'depression';
      for (i = 0; i < s.paper.length; i++) if (/trouble/.test(s.paper[i].text)) { trouble = true; break; }
      var res = reserve(endgame ? 0.4 : 1);
      // (1) extra acquisition pass (never into a forecast crash — competent already deleveraged —
      //     and never onto a stretched portfolio: piling leverage on LTV > 50% is how houses fall)
      var stretched = St.ltv('player') > 0.5 || s.cash < St.annualDebtService('player') * 2;
      if (!trouble && !stretched) {
      var ls = PE.Market.listingArray(null).filter(function (l) { return s.cities[l.cityId].unlocked; })
        .map(function (l) { var e = PE.Market.estimate(l); return { l: l, est: e.mid, ratio: l.askingPrice / e.mid }; });
      ls.sort(function (a, b) { return a.ratio - b.ratio; });
      var fin = { ltv: PE.Finance.maxLtv('player'), type: 'io' };
      for (i = 0; i < ls.length; i++) {
        var c = ls[i], l = c.l; if (!s.listings[l.id]) continue;
        var isAuction = l.seller === 'auction';
        if (!isAuction && c.ratio > (endgame ? 1.0 : 0.95)) continue;
        if (l.type === 'land' && s.cash < c.est * 3) continue;
        var maxPay = Math.round(c.est * (isAuction || endgame ? 1.0 : 0.95));
        var offer = isAuction ? l.askingPrice : Math.min(l.askingPrice, Math.round(c.est * 0.9));
        if (s.cash - PE.Market.cashNeeded(l, maxPay, fin).cash < res) continue;
        var r = PE.Market.makeOffer(l.id, offer, fin);
        if (!r.ok) continue;
        if (r.outcome === 'countered' && r.counterPrice <= maxPay) r = PE.Market.makeOffer(l.id, r.counterPrice, fin);
        var g = 0;
        while (r.ok && (r.outcome === 'auction' || r.outcome === 'continue') && g++ < 8) {
          var cur = r.auction ? r.auction.currentBid : r.currentBid, next = Math.min(Math.round(cur * 1.06), maxPay);
          if (next <= cur) { PE.Market.withdraw(s.auction ? s.auction.id : null); break; }
          r = PE.Market.bid(s.auction.id, next);
        }
        break; // at most one extra purchase per year
      }
      } // !trouble && !stretched
      // (2) earlier city expansion
      var cheapest = PE.Cities.cheapestLocked();
      if (cheapest && St.propertyCount('player') >= 2 && s.cash - cheapest.cost >= res && s.reputation >= cheapest.repRequired) PE.Cities.unlock(cheapest.id);
      // (3) saturation-aware short-let push
      var lp = St.playerProps(), slTotal = 0, slNow = 0;
      for (i = 0; i < lp.length; i++) {
        p = lp[i];
        if (D.shortLetTypes.indexOf(p.type) >= 0 && PE.Property.visitorRating(p.cityId, p.district) >= 1) { slTotal++; if ((p.letMode || 'long') === 'short') slNow++; }
      }
      var g2 = 0;
      while (g2++ < 3 && slTotal > 0 && slNow / slTotal < 0.65) {
        var best = null, bestGain = 0;
        for (i = 0; i < lp.length; i++) {
          p = lp[i]; if ((p.letMode || 'long') !== 'long' || p.forSale || p.lease || p.renovation || p.flagship) continue;
          var info = PE.Property.lettingInfo(p.id);
          if (!info.ok || !info.canSwitch || !info.eligible) continue;
          if (info.short.saturation && info.short.saturation.share >= B.shortLetSaturationStart) continue; // district already diluted
          var longMid = (info.long.net[0] + info.long.net[1]) / 2, shortMid = (info.short.net[0] + info.short.net[1]) / 2;
          if (shortMid > longMid * 1.10 && shortMid - longMid > bestGain) { best = p.id; bestGain = shortMid - longMid; }
        }
        if (!best) break;
        if (s.cash - PE.Property.lettingInfo(best).switchCost < res) break;
        if (!PE.Property.setLetMode(best, 'short').ok) break;
        slNow++;
      }
      // (4) trust timing: estate tax (20–40%) dwarfs the 2%/yr cost only when succession is near
      if (!s.dynasty.trust && s.dynasty.head.age >= 58 && St.netWorth('player') > 25 * s.startCash * s.priceIndex) PE.Dynasty.setupTrust();
      if (s.dynasty.trust && s.dynasty.head.age < 40) PE.Dynasty.dissolveTrust();
    }
  };
}

/* Cheap state fingerprint for dead-turn detection: a year where play() changed none of
   cash, portfolio size, any action counter, letting modes, rent settings, managers, cities,
   trust or reputation counts as dead (only endYear advanced time). Approximate by design:
   a deliberately inert event choice also reads as dead. */
function stateHash(PE) {
  var s = PE.S(), St = PE.State, t = s.stats;
  var managers = 0; for (var cid in s.cities) if (s.cities[cid].managerId) managers++;
  var shortLets = 0, rentLo = 0, props = St.playerProps();
  for (var i = 0; i < props.length; i++) { if ((props[i].letMode || 'long') === 'short') shortLets++; if (props[i].rentSetting && props[i].rentSetting < 1) rentLo++; }
  return [Math.round(s.cash), props.length, t.bought, t.sold, t.renovations, t.rebuilds, t.refinances, t.brrrr, t.flips,
    t.auctionsWon, t.builds, t.buildsDone, t.educated, t.marriages, t.mergers, shortLets, rentLo, managers,
    St.unlockedCities().length, s.dynasty.trust ? 1 : 0, s.reputation].join('|');
}

function runCampaign(PE, ctx, familyId, seed, stratName, horizon) {
  var players = ctx.players, strats = ctx.strats;
  var r = PE.Game.newGame({ familyId: familyId, seed: seed });
  if (!r.ok) throw new Error(r.message + ' ' + r.error);
  var s = PE.S(), St = PE.State, strat = strats[stratName];
  var rec = { family: familyId, seed: seed, strategy: stratName, horizon: horizon, startNW: s.startNetWorth, startYear: s.year,
    years: 0, deadYears: 0, nwEnd: null, nwMult: null, rankEnd: null, statusEnd: null, endReason: null,
    bankruptcies: [], year2ndProp: null, yearFirstGoal: null, leadChanges: 0, rank1Years: 0, everRank1: false, rank1FinalStreak: 0,
    maxLeadRatio: 0, finalLeadRatio: null, goalsDone: 0, goalsOffered: 0, eraGoalsDone: 0, erasCompleted: 0, campaignTier: 0,
    bestRivalNW: null, bestRivalId: null, errors: 0 };
  var prevLeader = null, streak = 0, i;
  for (var y = 0; y < horizon && s.status === 'playing'; y++) {
    var before = stateHash(PE);
    strat.play();
    if (stateHash(PE) === before) rec.deadYears++;
    var rep = PE.Game.endYear();
    if (!rep.ok) {
      if (rep.error) rec.errors++;
      players.resolveEvents(stratName === 'naive' ? 'naive' : 'competent');
      rep = PE.Game.endYear();
      if (!rep.ok) { rec.errors++; break; }
    }
    rec.years++;
    var yIdx = rec.years;
    if (rec.year2ndProp === null && St.propertyCount('player') >= 2) rec.year2ndProp = yIdx;
    if (rec.yearFirstGoal === null) { var h = s.goals.history; for (i = 0; i < h.length; i++) if (h[i].done) { rec.yearFirstGoal = yIdx; break; } }
    var lb = PE.Rivals.leaderboard().leaderboard, leader = lb[0], runner = lb[1];
    if (prevLeader !== null && leader.id !== prevLeader) rec.leadChanges++;
    prevLeader = leader.id;
    if (leader.id === 'player') { rec.everRank1 = true; rec.rank1Years++; streak++; } else streak = 0;
    if (runner && runner.netWorth > 0 && leader.netWorth > 0) {
      var lr = leader.netWorth / runner.netWorth;
      if (lr > rec.maxLeadRatio) rec.maxLeadRatio = lr;
      rec.finalLeadRatio = lr;
    }
    for (i = 0; i < rec.bankruptcies.length; i++) {
      var bk = rec.bankruptcies[i];
      if (bk.recoveredIn === undefined && bk.yIdx < yIdx && St.netWorth('player') >= Math.max(1, bk.peak)) bk.recoveredIn = yIdx - bk.yIdx;
    }
    if (rep.bankrupt) {
      rec.bankruptcies.push({ yIdx: yIdx, calYear: rep.year, peak: s.stats.peakNetWorth });
      if (!PE.Game.continueAsHeir().ok) break;
    }
  }
  rec.rank1FinalStreak = streak;
  rec.nwEnd = St.netWorth('player');
  rec.nwMult = rec.nwEnd / rec.startNW;
  rec.rankEnd = St.rank();
  rec.statusEnd = s.status; rec.endReason = s.endReason;
  var lbEnd = PE.Rivals.leaderboard().leaderboard;
  for (i = 0; i < lbEnd.length; i++) {
    var row = lbEnd[i];
    if (row.isPlayer) rec.rankEnd = row.rank;
    else if (rec.bestRivalNW === null || row.netWorth > rec.bestRivalNW) { rec.bestRivalNW = row.netWorth; rec.bestRivalId = row.id; }
  }
  rec.goalsOffered = s.goals.history.length;
  rec.goalsDone = s.goals.history.filter(function (e) { return e.done; }).length;
  rec.eraGoalsDone = Object.keys(s.goals.eraDone).length;
  var lastYear = s.year - 1, eras = PE.Data.eras;
  for (i = 0; i < eras.length; i++) if (eras[i].from <= lastYear) rec.erasCompleted++; // eras entered (goals complete mid-era)
  rec.campaignTier = s.goals.campaignTier;
  return rec;
}

function runScenario(PE, ctx, scenarioId, stratName, seed) {
  var players = ctx.players, strats = ctx.strats;
  var r = PE.Game.newGame({ familyId: 'chen', seed: seed, scenario: scenarioId });
  if (!r.ok) throw new Error(r.message + ' ' + r.error);
  var s = PE.S(), St = PE.State;
  var rec = { scenario: scenarioId, strategy: stratName, seed: seed, result: null, nw: null, target: s.scenario.targetNetWorth, bankrupt: false, years: 0, errors: 0 };
  while (s.status === 'playing') {
    strats[stratName].play();
    var rep = PE.Game.endYear();
    if (!rep.ok) {
      if (rep.error) rec.errors++;
      players.resolveEvents('competent');
      rep = PE.Game.endYear();
      if (!rep.ok) { rec.errors++; break; }
    }
    rec.years++;
    if (rep.bankrupt) { rec.bankrupt = true; break; } // a scenario bankruptcy loss sticks (P8.1 f11)
  }
  rec.result = s.scenario ? s.scenario.result : null;
  rec.nw = St.netWorth('player');
  return rec;
}

function challengeRun(week) {
  var PE = load(), players = require('./players.js')(PE);
  PE.Game.newChallenge({ week: week });
  var s = PE.S();
  while (s.status === 'playing') {
    players.competent.play();
    var rep = PE.Game.endYear();
    if (!rep.ok) { players.resolveEvents('competent'); rep = PE.Game.endYear(); if (!rep.ok) break; }
    if (rep.bankrupt && !PE.Game.continueAsHeir().ok) break;
  }
  return { nw: PE.State.netWorth('player'), score: s.challenge ? s.challenge.score : null, years: s.year - PE.Data.startYear, seed: PE.Game.challengeSeed(week) };
}

/* ---------- statistics helpers ---------- */
function sorted(a) { return a.slice().sort(function (x, y) { return x - y; }); }
function pct(a, p) { if (!a.length) return null; var i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }
function dist(a) { var b = sorted(a); return { n: b.length, min: pct(b, 0), p25: pct(b, 0.25), med: pct(b, 0.5), p75: pct(b, 0.75), max: pct(b, 1) }; }
function mean(a) { if (!a.length) return null; var t = 0; for (var i = 0; i < a.length; i++) t += a[i]; return t / a.length; }
function fmt(v, d) { return v === null || v === undefined ? 'n/a' : (typeof v === 'number' ? v.toFixed(d === undefined ? 1 : d) : String(v)); }
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function distRow(label, a, d) {
  var q = dist(a);
  if (!q.n) return pad(label, 34) + 'no data';
  return pad(label, 34) + pad(fmt(q.min, d), 9) + pad(fmt(q.p25, d), 9) + pad(fmt(q.med, d), 9) + pad(fmt(q.p75, d), 9) + pad(fmt(q.max, d), 9) + 'n=' + q.n;
}
function replay(r) { return r.family + '/seed ' + r.seed + '/' + r.strategy + ' (horizon ' + r.horizon + ')'; }

function main() {
  var t0 = Date.now();
  var PE = load(), players = require('./players.js')(PE);
  var ctx = { players: players, strats: { naive: players.naive, competent: players.competent, expert: makeExpert(PE, players) } };

  /* ---------- 1. campaign matrix, 60-year horizon ---------- */
  var tm = Date.now(), matrix = [];
  for (var f = 0; f < FAMILIES.length; f++)
    for (var st = 0; st < STRATS.length; st++)
      for (var sd = 1; sd <= SEEDS; sd++)
        matrix.push(runCampaign(PE, ctx, FAMILIES[f], sd, STRATS[st], MATRIX_HORIZON));
  var matrixMs = Date.now() - tm;

  /* ---------- 2. full-length confirmations (181y) ---------- */
  var tf = Date.now(), full = [];
  for (f = 0; f < FAMILIES.length; f++)
    for (st = 0; st < STRATS.length; st++)
      for (sd = 1; sd <= FULL_SEEDS; sd++)
        full.push(runCampaign(PE, ctx, FAMILIES[f], 1000 + sd, STRATS[st], 200));
  var fullMs = Date.now() - tf;

  /* ---------- 3. scenario matrix ---------- */
  var ts = Date.now(), scen = [];
  for (var sc = 0; sc < SCENARIOS.length; sc++)
    for (st = 0; st < 2; st++) // competent + expert only
      for (sd = 1; sd <= SEEDS; sd++)
        scen.push(runScenario(PE, ctx, SCENARIOS[sc], STRATS[st + 1], sd));
  var scenMs = Date.now() - ts;

  /* ---------- 4. challenge determinism (two fresh engine instances, same week) ---------- */
  var chA = challengeRun('contest-W01'), chB = challengeRun('contest-W01');

  var totalMs = Date.now() - t0;
  function sel(rows, fam, strat) { return rows.filter(function (r) { return (!fam || r.family === fam) && (!strat || r.strategy === strat); }); }

  console.log('Property Empire v8 contest harness (P8.4–P8.6) — ' + SEEDS + ' seeds × ' + FAMILIES.length + ' families × ' + STRATS.length + ' strategies × ' + MATRIX_HORIZON + 'y horizon, '
    + full.length + ' full-length runs, ' + scen.length + ' scenario runs (' + (totalMs / 1000).toFixed(1) + 's total: matrix ' + (matrixMs / 1000).toFixed(1) + 's, full ' + (fullMs / 1000).toFixed(1) + 's, scenarios ' + (scenMs / 1000).toFixed(1) + 's)');
  console.log('Horizon choice: a full 181-year instrumented campaign measures ~1.5–2s per run, so 360 full matrix runs would take 10–12 min — over the ~5 min budget. The matrix runs a 60-year horizon (1850–1910, Victorian + Gilded); ' + full.length + ' full-length confirmation runs cover the late game. Scenario runs are naturally 15 years.');

  /* ---------- matrix distributions per strategy ---------- */
  console.log('\n== CAMPAIGN MATRIX (' + MATRIX_HORIZON + 'y, 1850–1910) — distributions per strategy (all families pooled) ==');
  console.log(pad('metric', 34) + pad('min', 9) + pad('p25', 9) + pad('median', 9) + pad('p75', 9) + pad('max', 9));
  var medNW = {}, medDead = {};
  for (st = 0; st < STRATS.length; st++) {
    var rows = sel(matrix, null, STRATS[st]);
    medNW[STRATS[st]] = dist(rows.map(function (r) { return r.nwMult; })).med;
    medDead[STRATS[st]] = dist(rows.map(function (r) { return r.deadYears / r.years * 100; })).med;
    var bkRuns = rows.filter(function (r) { return r.bankruptcies.length; });
    var recovered = bkRuns.filter(function (r) { return r.bankruptcies.some(function (b) { return b.recoveredIn !== undefined; }); });
    var recYears = [];
    bkRuns.forEach(function (r) { r.bankruptcies.forEach(function (b) { if (b.recoveredIn !== undefined) recYears.push(b.recoveredIn); }); });
    console.log('\n-- ' + STRATS[st] + ' (' + rows.length + ' runs; bankrupt in ' + bkRuns.length + ', recovered to pre-bankruptcy peak in ' + recovered.length + ') --');
    console.log(distRow('final NW multiple (×start)', rows.map(function (r) { return r.nwMult; })));
    console.log(distRow('final rank', rows.map(function (r) { return r.rankEnd; }), 0));
    console.log(distRow('bankruptcies per run', rows.map(function (r) { return r.bankruptcies.length; }), 0));
    console.log(distRow('recovery time (years, recovered)', recYears, 0));
    console.log(distRow('year of 2nd property', rows.map(function (r) { return r.year2ndProp === null ? MATRIX_HORIZON + 1 : r.year2ndProp; }), 0));
    console.log(distRow('year of first yearly goal done', rows.map(function (r) { return r.yearFirstGoal === null ? MATRIX_HORIZON + 1 : r.yearFirstGoal; }), 0));
    console.log(distRow('lead changes (rank-1 holder)', rows.map(function (r) { return r.leadChanges; }), 0));
    console.log(distRow('years at rank 1', rows.map(function (r) { return r.rank1Years; }), 0));
    console.log(distRow('max leader lead ratio', rows.map(function (r) { return r.maxLeadRatio; }), 2));
    console.log(distRow('final leader lead ratio', rows.map(function (r) { return r.finalLeadRatio || 1; }), 2));
    console.log(distRow('dead-year share (%)', rows.map(function (r) { return r.deadYears / r.years * 100; }), 0));
    console.log(distRow('yearly goals done/offered (%)', rows.map(function (r) { return r.goalsOffered ? r.goalsDone / r.goalsOffered * 100 : 0; }), 0));
    console.log(distRow('campaign tiers reached', rows.map(function (r) { return r.campaignTier; }), 0));
    console.log(pad('era goals done / eras entered', 34) + rows.reduce(function (t, r) { return t + r.eraGoalsDone; }, 0) + ' / ' + rows.reduce(function (t, r) { return t + r.erasCompleted; }, 0));
  }

  console.log('\n-- family × strategy (median NW×, bankruptcy %, median rank, median dead-year %, median lead changes) --');
  for (f = 0; f < FAMILIES.length; f++) {
    var line = pad(FAMILIES[f], 12);
    for (st = 0; st < STRATS.length; st++) {
      var rs = sel(matrix, FAMILIES[f], STRATS[st]);
      line += pad(STRATS[st].slice(0, 4) + ': ' + fmt(dist(rs.map(function (r) { return r.nwMult; })).med, 1) + '× bk ' + fmt(rs.filter(function (r) { return r.bankruptcies.length; }).length / rs.length * 100, 0) + '% rk #' + fmt(dist(rs.map(function (r) { return r.rankEnd; })).med, 0)
        + ' dead ' + fmt(dist(rs.map(function (r) { return r.deadYears / r.years * 100; })).med, 0) + '% lc ' + fmt(dist(rs.map(function (r) { return r.leadChanges; })).med, 0), 52);
    }
    console.log(line);
  }

  /* ---------- full-length confirmations ---------- */
  console.log('\n== FULL-LENGTH CONFIRMATIONS (181y, seeds 1001–' + (1000 + FULL_SEEDS) + ') ==');
  var medFull = {};
  for (st = 0; st < STRATS.length; st++) {
    var rf = sel(full, null, STRATS[st]);
    medFull[STRATS[st]] = dist(rf.map(function (r) { return r.nwMult; })).med;
    console.log(pad(STRATS[st], 11) + 'median NW× ' + fmt(dist(rf.map(function (r) { return r.nwMult; })).med, 0)
      + '  median rank #' + fmt(dist(rf.map(function (r) { return r.rankEnd; })).med, 0)
      + '  bk ' + fmt(rf.filter(function (r) { return r.bankruptcies.length; }).length / rf.length * 100, 0) + '%'
      + '  median tier ' + fmt(dist(rf.map(function (r) { return r.campaignTier; })).med, 0) + '/6'
      + '  rank-1 final-20y streak in ' + rf.filter(function (r) { return r.rank1FinalStreak >= 20; }).length + '/' + rf.length
      + '  median lead changes ' + fmt(dist(rf.map(function (r) { return r.leadChanges; })).med, 0)
      + '  median dead ' + fmt(dist(rf.map(function (r) { return r.deadYears / r.years * 100; })).med, 0) + '%');
  }

  /* ---------- scenarios ---------- */
  console.log('\n== SCENARIO MATRIX (' + SEEDS + ' seeds each) ==');
  console.log(pad('scenario', 16) + pad('strategy', 12) + pad('won', 8) + pad('lost', 8) + pad('win %', 8) + 'median NW/target');
  var scenRates = {};
  for (sc = 0; sc < SCENARIOS.length; sc++) {
    for (var st2 = 1; st2 < STRATS.length; st2++) {
      var rs2 = scen.filter(function (r) { return r.scenario === SCENARIOS[sc] && r.strategy === STRATS[st2]; });
      var won = rs2.filter(function (r) { return r.result === 'won'; }).length;
      var rate = won / rs2.length * 100;
      scenRates[SCENARIOS[sc] + '/' + STRATS[st2]] = rate;
      console.log(pad(SCENARIOS[sc], 16) + pad(STRATS[st2], 12) + pad(won, 8) + pad(rs2.length - won, 8) + pad(fmt(rate, 0) + '%', 8) + fmt(dist(rs2.map(function (r) { return r.nw / r.target; })).med, 2));
    }
  }

  /* ---------- challenge determinism ---------- */
  console.log('\n== WEEKLY CHALLENGE DETERMINISM (week contest-W01, two fresh engine instances) ==');
  console.log('run A: NW ' + chA.nw + ' score ' + chA.score + ' (seed ' + chA.seed + '); run B: NW ' + chB.nw + ' score ' + chB.score);
  var detOk = chA.nw === chB.nw && chA.score === chB.score;
  console.log(detOk ? 'identical — deterministic' : 'MISMATCH — challenge is not deterministic');

  /* ---------- outliers ---------- */
  console.log('\n== OUTLIERS ==');
  var nOut = 0;
  for (st = 0; st < STRATS.length; st++) {
    var rg = sel(matrix, null, STRATS[st]), p75 = dist(rg.map(function (r) { return r.nwMult; })).p75;
    rg.forEach(function (r) {
      if (r.nwMult > 2 * p75) { console.log('NW outlier (>2× p75 ' + fmt(p75, 1) + '×): ' + replay(r) + ' ended ' + fmt(r.nwMult, 1) + '× rank #' + r.rankEnd); nOut++; }
    });
  }
  matrix.concat(full).forEach(function (r) {
    r.bankruptcies.forEach(function (b) {
      if (b.yIdx <= 10) { console.log('crushing defeat (bankruptcy year ' + b.yIdx + ', ' + b.calYear + '): ' + replay(r) + ' endReason ' + (r.endReason || '—') + ' final rank #' + r.rankEnd); nOut++; }
    });
    if (r.maxLeadRatio > 5) { console.log('runaway leader (peak lead ratio ' + fmt(r.maxLeadRatio, 1) + '×): ' + replay(r) + ' final ratio ' + fmt(r.finalLeadRatio, 2) + ' player rank #' + r.rankEnd); nOut++; }
    if (r.rank1FinalStreak >= 20) { console.log('effortless win (rank 1 held final ' + r.rank1FinalStreak + 'y): ' + replay(r) + ' ended ' + fmt(r.nwMult, 1) + '×'); nOut++; }
  });
  var errTotal = matrix.concat(full).reduce(function (t, r) { return t + r.errors; }, 0) + scen.reduce(function (t, r) { return t + r.errors; }, 0);
  if (!nOut) console.log('none flagged');
  if (errTotal) console.log('INTERNAL ERRORS across runs: ' + errTotal);

  /* ---------- P8.6 sampling: classify every matrix run vs the best rival's final NW ---------- */
  console.log('\n== P8.6 RUN CLASSIFICATION (player final NW / best rival final NW; close = within 25%, easy = ≥1.25×) ==');
  var classes = { 'easy win': [], 'close win': [], 'recoverable loss': [], 'crushing loss': [] };
  matrix.forEach(function (r) {
    var ratio = r.bestRivalNW > 0 ? r.nwEnd / r.bestRivalNW : Infinity;
    var unrecovered = r.bankruptcies.some(function (b) { return b.recoveredIn === undefined; });
    var cls;
    if (r.rankEnd === 1) cls = ratio >= 1.25 ? 'easy win' : 'close win';
    else if (ratio >= 0.5 && !unrecovered) cls = 'recoverable loss';
    else cls = 'crushing loss';
    r._class = cls; r._ratio = ratio;
    classes[cls].push(r);
  });
  Object.keys(classes).forEach(function (cls) {
    var rows = classes[cls];
    console.log('\n' + cls + ' — ' + rows.length + ' runs (' + fmt(rows.length / matrix.length * 100, 0) + '%)');
    rows.slice(0, 3).forEach(function (r) {
      console.log('  replay: ' + replay(r) + ' → NW ratio vs best rival (' + r.bestRivalId + ') ' + fmt(r._ratio, 2)
        + ', rank #' + r.rankEnd + ', bk ' + r.bankruptcies.length + ', lead changes ' + r.leadChanges + ', dead ' + fmt(r.deadYears / r.years * 100, 0) + '%');
    });
  });

  /* ---------- guards ---------- */
  console.log('\n== GUARDS ==');
  var allBk = matrix.filter(function (r) { return r.bankruptcies.length; });
  var allRec = allBk.filter(function (r) { return r.bankruptcies.some(function (b) { return b.recoveredIn !== undefined; }); });
  var lcShare = matrix.filter(function (r) { return r.leadChanges > 0; }).length / matrix.length * 100;
  var deadCE = dist(matrix.filter(function (r) { return r.strategy !== 'naive'; }).map(function (r) { return r.deadYears / r.years * 100; })).med;
  var effortlessShare = matrix.filter(function (r) { return r.rank1FinalStreak >= 20; }).length / matrix.length * 100;
  var guards = [
    ['expert median NW× beats competent but < 2× it', fmt(medNW.expert, 1) + '× vs ' + fmt(medNW.competent, 1) + '×', medNW.expert > medNW.competent && medNW.expert < 2 * medNW.competent],
    ['competent median NW× beats naive', fmt(medNW.competent, 1) + '× vs ' + fmt(medNW.naive, 1) + '×', medNW.competent > medNW.naive],
    ['bankruptcy recovery observed in some runs', allRec.length + '/' + allBk.length + ' bankrupt runs recovered', allBk.length > 0 && allRec.length > 0],
    ['lead changes in ≥ 70% of runs', fmt(lcShare, 0) + '%', lcShare >= 70],
    ['median dead-year share (competent+expert) < 30%', fmt(deadCE, 0) + '%', deadCE < 30],
    ['scenario win rates all within 5–95%', Object.keys(scenRates).map(function (k) { return k + ' ' + fmt(scenRates[k], 0) + '%'; }).join(', '), Object.keys(scenRates).every(function (k) { return scenRates[k] >= 5 && scenRates[k] <= 95; })],
    ['weekly challenge deterministic across engine instances', detOk ? 'identical' : 'MISMATCH', detOk],
    ['effortless wins (rank 1 final 20y+) < 25% of runs', fmt(effortlessShare, 0) + '%', effortlessShare < 25]
  ];
  var gFails = 0;
  for (var gi = 0; gi < guards.length; gi++) { var gv = String(guards[gi][1]); if (gv.length > 74) gv = gv.slice(0, 71) + '...'; console.log(pad(guards[gi][0], 56) + pad(gv, 76) + (guards[gi][2] ? 'PASS' : 'FAIL')); if (!guards[gi][2]) gFails++; }
  console.log((guards.length - gFails) + '/' + guards.length + ' guards pass.');

  /* ---------- assessment ---------- */
  console.log('\n== CONTEST ASSESSMENT ==');
  var lcMed = dist(matrix.map(function (r) { return r.leadChanges; })).med;
  var flrMed = dist(matrix.map(function (r) { return r.finalLeadRatio || 1; })).med;
  var mlrMed = dist(matrix.map(function (r) { return r.maxLeadRatio; })).med;
  var r1Med = dist(matrix.map(function (r) { return r.rank1Years; })).med;
  console.log('Sustained uncertainty: median ' + fmt(lcMed, 0) + ' lead changes per 60y run (' + fmt(lcShare, 0) + '% of runs see at least one); '
    + 'median years at rank 1 is ' + fmt(r1Med, 0) + ' and effortless rank-1 locks cover ' + fmt(effortlessShare, 0) + '% of runs. '
    + (lcShare >= 70 && effortlessShare < 25 ? 'The top spot changes hands regularly and no strategy camps on it — uncertainty is sustained.' : 'The top spot is stickier than a healthy contest wants — investigate.'));
  console.log('Readable competition: the leader/runner-up NW ratio has median ' + fmt(flrMed, 2) + ' at run end and median peak ' + fmt(mlrMed, 2)
    + (mlrMed < 3 ? ' — gaps stay within one good deal of overturning, so the leaderboard is readable.' : ' — peaks above ~3× mean the leader can look uncatchable for stretches; check the runaway outliers.'));
  var bkShare = allBk.length / matrix.length * 100, recShare = allBk.length ? allRec.length / allBk.length * 100 : 0;
  var recMed = [];
  allBk.forEach(function (r) { r.bankruptcies.forEach(function (b) { if (b.recoveredIn !== undefined) recMed.push(b.recoveredIn); }); });
  console.log('Recovery: ' + fmt(bkShare, 0) + '% of runs see a bankruptcy; ' + fmt(recShare, 0) + '% of those recover to the pre-bankruptcy peak'
    + (recMed.length ? ' in a median of ' + fmt(dist(recMed).med, 0) + ' years' : '') + '. '
    + (allRec.length > 0 ? 'Comeback is real but costly — the heir path works.' : 'No recovery observed — the comeback path is decorative, not competitive.'));
  console.log('Strategy spread (does location/letting skill pay): median NW× naive ' + fmt(medNW.naive, 1) + ' / competent ' + fmt(medNW.competent, 1) + ' / expert ' + fmt(medNW.expert, 1)
    + ' at 60y; at full 181y length naive ' + fmt(medFull.naive, 0) + ' / competent ' + fmt(medFull.competent, 0) + ' / expert ' + fmt(medFull.expert, 0)
    + '; median dead-year share naive ' + fmt(medDead.naive, 0) + '% / competent ' + fmt(medDead.competent, 0) + '% / expert ' + fmt(medDead.expert, 0) + '%. '
    + (medNW.expert > medNW.competent && medNW.competent > medNW.naive ? 'Each skill layer (leverage, letting, timing) converts into outcome — different approaches are viable and rewarded in order.'
      : 'Skill layers do not convert cleanly into outcomes at 60y — see guards above (check the 181y numbers before judging: aggressive leverage pays late).'));
  process.exitCode = gFails ? 1 : 0;
}
main();
