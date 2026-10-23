/* PE.Turn — the year loop. endYear resolves rent, costs, debt, taxes, sales,
   covenants, price drift and the cycle, rivals, dynasty, events, goals and
   bankruptcy, then advances the year and builds the YearReport exactly as the
   bible §13 contract. skipQuietYears advances until something needs a decision. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var T = {};

  T.newReport = function () {
    var s = PE.S();
    return { year: s.year, era: St.era().id, eraName: St.era().name, cashFlow: { rent: 0, costs: 0, debtService: 0, taxes: 0, interest: 0, net: 0 }, equityChange: 0, netWorthBefore: 0, netWorthAfter: 0, cashBefore: s.cash, cashAfter: 0,
      valuesByCity: {}, deals: [], rivalsMoves: [], events: [], dynasty: [], lines: [], goals: { achieved: [], progress: [] }, rank: { before: 0, after: 0 }, warnings: [], cliffhanger: '', headline: '', needsDecision: false, decisions: [],
      cycle: s.cycle.phase, cycleAfter: '', baseRate: s.baseRate, baseRateAfter: 0, eraChanged: false, eraSetPiece: null, succession: false, bankrupt: false, ended: false, paper: [], scenario: null, challenge: null };
  };

  T.advanceCycle = function () {
    var s = PE.S(), c = s.cycle, scripted = St.scriptedCycles()[s.year + 1];
    c.prev = c.phase;
    if (scripted) { c.phase = scripted; c.yearsLeft = scripted === 'depression' ? 1 : R.int(1, 2); return; }
    c.yearsLeft--;
    if (c.yearsLeft > 0) return;
    var nx = D.cycles[c.phase].next, ids = Object.keys(nx), ws = ids.map(function (k) { return nx[k]; });
    c.phase = R.weighted(ids, ws);
    c.yearsLeft = R.int(D.cycles[c.phase].len[0], D.cycles[c.phase].len[1]);
  };

  T.wealthTax = function () {
    var s = PE.S(), era = St.era(), nw = St.netWorth('player'), threshold = s.startCash * B.wealthTaxThresholdMult * s.priceIndex;
    if (era.wealthTax <= 0 || nw <= threshold) return 0;
    var excess = nw - threshold, tax = excess * era.wealthTax;
    if (excess > threshold * 4) tax += (excess - threshold * 4) * era.wealthTax * 0.5; // top bracket
    return Math.round(tax);
  };

  T.endYear = function () {
    var s = PE.S();
    if (s.status === 'ended') return PE.fail('The campaign is over', { ended: true });
    if (s.status === 'bankrupt') return PE.fail('The house has fallen; start a new dynasty or continue as the heir', { bankrupt: true });
    if (s.events.pending.length) return PE.fail('Resolve the pending event first', { needsDecision: true, pending: PE.Events.pending().event });
    if (s.auction) PE.Market.withdraw(s.auction.id);
    var rep = T.newReport(), i, p;
    rep.netWorthBefore = St.netWorth('player'); rep.rank.before = St.rank();
    var cf = rep.cashFlow, wasDepression = s.cycle.phase === 'depression', debtAtStart = St.debt('player');

    // 1. Operate the portfolio
    var mgmt = PE.Property.assignManagement(), props = St.playerProps().slice(), rent = 0, costs = 0;
    for (i = 0; i < props.length; i++) {
      p = props[i];
      var line = PE.Property.progressRenovation(p); if (line) rep.lines.push(line.text);
      var r = PE.Property.operate(p, mgmt[p.id]);
      if (r.line) rep.lines.push(r.line);
      rent += r.rent; costs += r.costs;
    }
    cf.rent = rent; cf.costs = costs; s.cash += rent - costs;
    s.lastRent = s.thisRent || 0; s.thisRent = rent;
    s.stats.rentTotal += rent; s.stats.costTotal += costs;
    // 2. Debt service, savings, bonds, the family bank, wealth tax
    cf.debtService = PE.Finance.service('player'); s.cash -= cf.debtService;
    cf.interest = PE.Finance.savingsInterest();
    cf.interest += PE.Finance.bondYearly(rep);        // coupons + maturing face (P4.1)
    var bankY = PE.Finance.bankYearly(rep); if (bankY) cf.interest += bankY.income; // loan interest (P4.2)
    var wt = T.wealthTax(); s.cash -= wt; cf.taxes += wt;
    // 3. Sales on the market, covenants
    PE.Market.resolveSales(rep);
    // 4. Prices: drift this year's values, then set next year's cycle and rate
    PE.Market.driftPrices(rep);
    T.advanceCycle();
    s.baseRate = PE.Finance.nextBaseRate();
    rep.cycleAfter = s.cycle.phase; rep.baseRateAfter = s.baseRate;
    for (var id in s.properties) PE.Property.revalue(s.properties[id]);
    for (var lid in s.listings) PE.Property.revalue(s.listings[lid]);
    // Covenants are tested on the new values, so the shortfall the player sees next year is exact.
    rep.warnings = PE.Finance.covenants(rep);
    // 5. Rivals, dynasty
    PE.Rivals.yearly(rep);
    PE.Finance.bankWriteOffs(rep); // a borrower that just went bankrupt defaults on its loan (P4.2)
    var dl = PE.Dynasty.yearly(rep); for (i = 0; i < dl.length; i++) rep.lines.push(dl[i]);
    rep.succession = rep.dynasty.some(function (d) { return d.kind === 'succession'; });
    // 6. Goals (evaluated on the year just played)
    PE.Goals.evaluate(rep);
    if (wasDepression && s.cycle.phase !== 'depression' && debtAtStart > 0 && s.stats.forcedSalesThisEra === 0) s.stats.depressionsSurvived++;
    if (wasDepression && s.cash >= 0.3 * Math.max(1, St.netWorth('player'))) s.stats.cashKingYears++;
    // achievement counters (P5.5): leverage carried without a forced sale, years at #1
    if (St.ltv('player') > 0.65 && !rep.deals.some(function (d) { return d.kind === 'forced_sale'; })) s.stats.highLtvYears++; else s.stats.highLtvYears = 0;
    if (St.rank() === 1) s.stats.rank1Years++; else s.stats.rank1Years = 0;
    // 7. Bankruptcy (bible §9)
    cf.net = rent - costs - cf.debtService - cf.taxes + cf.interest;
    if (s.cash < 0) { s.stats.negativeCashYears++; rep.warnings.push('negative_cash'); } else s.stats.negativeCashYears = 0;
    s.stats.lastNetCashFlow = rep.cashFlow.net;
    var nw = St.netWorth('player');
    var sellable = St.playerProps().some(function (x) { return !x.renovation && PE.Market.saleQuote(x, PE.Market.quickSaleFactor()).cashGained > 0; });
    var missedRecent = (s.stats.forcedSaleYears || []).filter(function (y) { return s.year - y < B.marginCallWindowYears; }).length;
    if (nw < 0 || (s.stats.negativeCashYears >= B.bankruptcyNegativeCashYears && !sellable) || missedRecent >= B.bankruptcyMissedCalls) {
      s.status = 'bankrupt'; s.endReason = nw < 0 ? 'Net worth below zero' : (missedRecent >= B.bankruptcyMissedCalls ? 'Two missed margin calls' : 'Two years without cash');
      rep.bankrupt = true; rep.headline = 'The House of ' + s.dynasty.surname + ' has fallen.'; rep.cliffhanger = s.endReason + '.';
      // P3.5: rivals absorb the estate NOW (all but the best equity), so the map tells the story
      // the moment the house falls. The heir keeps the best building if they continue.
      var props2 = St.playerProps().slice().sort(function (a, b) { return (b.trueValue - (b.mortgage ? b.mortgage.principal : 0)) - (a.trueValue - (a.mortgage ? a.mortgage.principal : 0)); });
      var rivals2 = Object.keys(s.rivals).filter(function (id) { return !s.rivals[id].bankrupt && !s.rivals[id].merged; }).sort(function (a, b) { return St.netWorth('rival:' + b) - St.netWorth('rival:' + a); });
      var absorbCount = 0, absorbRival = null;
      for (var ai = 1; ai < props2.length; ai++) {
        var ap = props2[ai], target = rivals2.length ? rivals2[(ai - 1) % rivals2.length] : null;
        St.setOwner(ap, target ? 'rival:' + target : null);
        if (target) { if (ap.mortgage) ap.mortgage.lender = 'Private bank'; if (!absorbRival) absorbRival = target; absorbCount++; }
      }
      if (absorbCount && absorbRival) {
        rep.absorbed = { rivalId: absorbRival, rivalName: PE.Rivals.def(absorbRival).name, count: absorbCount };
        rep.cliffhanger += ' ' + rep.absorbed.rivalName + ' take ' + absorbCount + ' building' + (absorbCount > 1 ? 's' : '') + '.';
        var abRv = s.rivals[absorbRival]; if (abRv) abRv.lastAction = 'Absorbed ' + absorbCount + ' of your buildings.';
      }
      s.comeback = { from: Math.max(1, s.stats.peakNetWorth), year: s.year, stage: 0 };
    }
    s.stats.peakNetWorth = Math.max(s.stats.peakNetWorth, nw);
    // 8. Advance the year
    var oldEra = St.era().id;
    s.year++;
    var newEra = St.era();
    if (newEra.id !== oldEra) { rep.eraChanged = true; s.eraId = newEra.id; s.stats.forcedSalesThisEra = 0; PE.Goals.assignEra(); rep.lines.push('A new era: ' + newEra.name + '.'); }
    if (s.year > s.endYear) { s.status = s.status === 'bankrupt' ? 'bankrupt' : 'ended'; rep.ended = true; }
    // Scenario (P5.4) and weekly challenge (P5.3) outcomes
    if (s.scenario) {
      if (s.status === 'bankrupt') s.scenario.result = 'lost';
      else if (rep.ended) s.scenario.result = St.netWorth('player') >= s.scenario.targetNetWorth ? 'won' : 'lost';
      rep.scenario = U.clone(s.scenario);
      if (s.scenario.result) { rep.headline = s.scenario.result === 'won' ? 'You came through the ' + s.scenario.name + ' with the house intact.' : 'The ' + s.scenario.name + ' beat the House of ' + s.dynasty.surname + '.'; }
    }
    if (s.challenge) { s.challenge.score = PE.Goals.challengeScore(); if (rep.ended || rep.bankrupt) PE.Game.recordChallenge(); rep.challenge = U.clone(s.challenge); }
    // the end-of-year leaderboard snapshot feeds prevRank / rankDelta next year
    PE.Rivals.snapshotRanks();
    // 9. New year: board, events, goal, paper
    if (s.status === 'playing') {
      PE.Market.refreshBoard();
      PE.Events.rollYearly(rep, rep.eraChanged);
      PE.Goals.assignYearly();
      rep.paper = PE.Events.makePaper();
    } else if (rep.ended && !rep.bankrupt) PE.Goals.checkAchievements(rep); // 'The Long Game' is checked on the final report
    // 10. Report
    s.cash = Math.round(s.cash);
    rep.netWorthAfter = St.netWorth('player'); rep.equityChange = rep.netWorthAfter - rep.netWorthBefore; rep.cashAfter = s.cash; rep.rank.after = St.rank();
    s.history.push({ year: s.year, netWorth: rep.netWorthAfter, cash: s.cash, debt: St.debt('player'), rank: rep.rank.after, props: St.propertyCount('player') });
    T.decorate(rep);
    s.lastReport = { headline: rep.headline, cliffhanger: rep.cliffhanger, year: rep.year, equityChange: rep.equityChange, rank: rep.rank, absorbed: rep.absorbed || null };
    return PE.ok(rep);
  };

  /* Headline, cliffhanger and needsDecision. */
  T.decorate = function (rep) {
    var s = PE.S(), dec = rep.decisions;
    if (s.events.pending.length) dec.push('event');
    if (rep.warnings.some(function (w) { return w.indexOf('margin_call') === 0; })) dec.push('margin_call');
    if (s.cash < 0) dec.push('negative_cash');
    if (s.offers.length) dec.push('offer');
    if (rep.succession) dec.push('succession');
    if (rep.eraChanged) dec.push('era');
    if (rep.goals.achieved.length) dec.push('goal');
    if (rep.bankrupt || rep.ended) dec.push('end');
    if (rep.rank.after < rep.rank.before) dec.push('rank_up');
    // a deal worth bidding on that the player can afford
    var ls = PE.Market.listingArray(null), bp = Math.max(0, s.cash) / B.buyingPowerDivisor;
    for (var i = 0; i < ls.length; i++) { var e = PE.Market.estimate(ls[i]); if (ls[i].askingPrice <= e.mid * 0.95 && ls[i].askingPrice <= bp) { dec.push('deal'); break; } }
    // portfolio actions with a real trade-off: a renovation you can pay for, or equity you could release
    var pp = St.playerProps(), nw = Math.max(1, St.netWorth('player'));
    for (var j = 0; j < pp.length; j++) {
      var q = pp[j]; if (q.renovation) continue;
      if (q.condition < 65 && q.type !== 'land' && s.cash >= PE.Property.renovationCost(q, 'patch') * 2) { dec.push('renovation'); break; }
      if (!q.mortgage || (q.mortgage.principal / q.trueValue < 0.5 && s.year - q.mortgage.lastRefi >= B.refinanceEveryYears)) { if (s.cash < nw * 0.1 && q.trueValue > nw * 0.05) { dec.push('refinance'); break; } }
    }
    rep.needsDecision = dec.length > 0;
    if (!rep.headline) {
      var ch = rep.equityChange, pct = rep.netWorthBefore > 0 ? Math.round(ch / rep.netWorthBefore * 100) : 0;
      if (rep.eraSetPiece) rep.headline = rep.eraSetPiece.title + ': a new era begins.';
      else if (rep.succession) rep.headline = 'A new head of the family.';
      else if (rep.deals.some(function (d) { return d.kind === 'forced_sale'; })) rep.headline = 'The bank came calling.';
      else if (rep.cycle === 'depression') rep.headline = 'Depression: values fell across the board.';
      else if (rep.goals.achieved.some(function (g) { return g.kind === 'campaign'; })) rep.headline = rep.goals.achieved.filter(function (g) { return g.kind === 'campaign'; })[0].desc;
      else if (pct >= 15) rep.headline = 'A fine year: net worth up ' + pct + '%.';
      else if (pct <= -10) rep.headline = 'A hard year: net worth down ' + Math.abs(pct) + '%.';
      else if (rep.rank.after < rep.rank.before) rep.headline = 'You climb to #' + rep.rank.after + '.';
      else rep.headline = 'A quiet year. Net worth ' + (ch >= 0 ? 'up ' : 'down ') + U.fmt(Math.abs(ch)) + '.';
    }
    if (!rep.cliffhanger) {
      var next = St.scriptedCycles()[s.year + 1], hist = D.historicalEvents.filter(function (h) { return PE.Events.histYear(h) === s.year + 1; })[0];
      var mort = PE.Dynasty.mortality(s.dynasty.head.age);
      if (rep.warnings.length) rep.cliffhanger = 'The lender wants an answer by year end.';
      else if (s.events.pending.length) rep.cliffhanger = s.events.pending[0].title + '.';
      else if (hist) rep.cliffhanger = 'Next year: ' + hist.title.toLowerCase() + '.';
      else if (next === 'depression' || next === 'recession') rep.cliffhanger = 'Bankers whisper of trouble ahead.';
      else if (mort > 0.08) rep.cliffhanger = s.dynasty.head.name + ' is ' + s.dynasty.head.age + '. Who inherits?';
      else if (s.offers.length) rep.cliffhanger = 'A rival wants one of your buildings.';
      else if (s.cycle.phase === 'boom') rep.cliffhanger = 'Prices are running. Booms end.';
      else rep.cliffhanger = 'Continue to ' + s.year + ' →';
    }
  };

  T.skipQuietYears = function (max) {
    var s = PE.S(), reports = [], n = U.clamp(max | 0 || 5, 1, 5);
    for (var i = 0; i < n; i++) {
      var r = T.endYear();
      if (!r.ok) return PE.ok({ reports: reports, stopped: r.message, needsDecision: true });
      reports.push(r);
      if (r.needsDecision) break;
    }
    return PE.ok({ reports: reports, stopped: reports.length && reports[reports.length - 1].needsDecision ? reports[reports.length - 1].decisions.join(',') : null, needsDecision: reports.length ? reports[reports.length - 1].needsDecision : false });
  };

  /* Comeback (bible §9): keep 1 property + 10% cash, reputation 40, rivals absorb the rest. */
  T.continueAsHeir = function () {
    var s = PE.S();
    if (s.status !== 'bankrupt') return PE.fail('The house has not fallen');
    // The estate was absorbed when the house fell (P3.5); the heir keeps the best building.
    var props = St.playerProps().slice().sort(function (a, b) { return (b.trueValue - (b.mortgage ? b.mortgage.principal : 0)) - (a.trueValue - (a.mortgage ? a.mortgage.principal : 0)); });
    var keep = props[0] || null;
    if (keep && keep.mortgage && keep.mortgage.principal > keep.trueValue * 0.7) keep.mortgage.principal = Math.round(keep.trueValue * 0.7);
    if (keep) keep.marginCall = null;
    s.stats.comebackFrom = s.stats.peakNetWorth; s.stats.bankruptcies++;
    s.cash = Math.max(Math.round(20 * s.priceIndex), Math.round(Math.max(0, s.cash) * B.comebackCashPct));
    s.reputation = B.comebackReputation; s.status = 'playing'; s.endReason = null;
    s.stats.negativeCashYears = 0; s.stats.marginCallsMissed = 0; s.stats.forcedSalesThisEra = 0;
    s.events.pending = []; s.offers = []; s.auction = null;
    for (var k = 0; k < St.playerProps().length; k++) St.playerProps()[k].forSale = null;
    // the heir takes over without estate tax
    var kids = PE.Dynasty.children().filter(function (c) { return c.age >= B.adultAge; });
    if (kids.length) { var old = s.dynasty.head; old.alive = false; s.dynasty.deaths.push({ year: s.year, name: old.name, age: old.age, generation: s.dynasty.generation, disgraced: true }); kids[0].relation = 'head'; s.dynasty.head = kids[0]; s.dynasty.generation++; }
    s.dynasty.trust = false;
    PE.Market.refreshBoard(); PE.Goals.assignYearly(); PE.Goals.assignEra(); PE.Events.makePaper();
    return PE.ok({ message: 'The heir keeps ' + (keep ? keep.name : 'nothing but the name') + ' and ' + U.fmt(s.cash) + '. The rest is gone.', kept: keep ? keep.id : null, cash: s.cash });
  };

  PE.Turn = T;
})(typeof window !== 'undefined' ? window : global);
