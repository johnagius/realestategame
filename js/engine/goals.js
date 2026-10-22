/* PE.Goals — a yearly micro-goal chosen so it is never already satisfied, an
   era goal, sequential campaign tiers, achievements and the legacy score.
   Goals are checked at endYear and rewarded with small cash/reputation. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var G = {};

  G.yearlyTemplates = [
    { id: 'buy_below', desc: 'Buy a property below its asking price this year.', available: function (s) { return PE.Market.listingArray(null).length > 0; }, baseline: function (s) { return s.stats.belowAsk; }, check: function (s, g) { return s.stats.belowAsk > g.baseline; } },
    { id: 'renovate', desc: 'Start or finish a renovation this year.', available: function (s) { return St.playerProps().some(function (p) { return p.condition < 85 || p.type === 'land'; }); }, baseline: function (s) { return s.stats.renovations; }, check: function (s, g) { return s.stats.renovations > g.baseline; } },
    { id: 'nw_up', desc: 'Grow net worth by 8% this year.', available: function (s) { return St.netWorth('player') > 0; }, baseline: function (s) { return St.netWorth('player'); }, check: function (s, g) { return St.netWorth('player') >= g.baseline * 1.08; } },
    { id: 'cash_cushion', desc: 'End the year with cash of at least 15% of your debt.', available: function (s) { return St.debt('player') > 0 && s.cash < 0.15 * St.debt('player'); }, baseline: function (s) { return 0; }, check: function (s, g) { return St.debt('player') === 0 || s.cash >= 0.15 * St.debt('player'); } },
    { id: 'fix_condition', desc: 'Bring every building you own above Poor condition.', available: function (s) { return St.playerProps().some(function (p) { return p.condition < 40 && p.type !== 'land'; }); }, baseline: function (s) { return 0; }, check: function (s, g) { return St.playerProps().every(function (p) { return p.condition >= 40 || p.type === 'land' || p.renovation; }); } },
    { id: 'rent_up', desc: 'Collect 15% more rent than last year.', available: function (s) { return s.lastRent > 0; }, baseline: function (s) { return s.lastRent; }, check: function (s, g) { return s.thisRent >= g.baseline * 1.15; } },
    { id: 'unlock_city', desc: 'Open an office in a new city this year.', available: function (s) { var c = PE.Cities.cheapestLocked(); return c && c.cost <= s.cash * 1.5 && c.repRequired <= s.reputation + 3; }, baseline: function (s) { return St.unlockedCities().length; }, check: function (s, g) { return St.unlockedCities().length > g.baseline; } },
    { id: 'reduce_ltv', desc: 'Cut your portfolio LTV by 5 points this year.', available: function (s) { return St.ltv('player') > 0.5; }, baseline: function (s) { return St.ltv('player'); }, check: function (s, g) { return St.ltv('player') <= g.baseline - 0.05; } },
    { id: 'sell_profit', desc: 'Sell a building for more than you paid.', available: function (s) { return St.playerProps().some(function (p) { return p.purchasePrice && p.trueValue > p.purchasePrice * 1.2 && !p.renovation; }); }, baseline: function (s) { return s.stats.sold; }, check: function (s, g) { return s.stats.sold > g.baseline; } },
    { id: 'reputation_up', desc: 'Raise reputation by 3 points this year.', available: function (s) { return s.reputation < 90; }, baseline: function (s) { return s.reputation; }, check: function (s, g) { return s.reputation >= g.baseline + 3; } }
  ];
  G.rewardFor = function () { var s = PE.S(); return Math.max(Math.round(10 * s.priceIndex), Math.round(Math.max(0, St.netWorth('player')) * 0.01)) * (St.hasPerk('purist') ? B.perkPuristGoalMult : 1); };
  G.assignYearly = function () {
    var s = PE.S(), cands = G.yearlyTemplates.filter(function (t) { return t.available(s) && !(s.goals.yearly && s.goals.yearly.id === t.id); });
    if (!cands.length) cands = G.yearlyTemplates.filter(function (t) { return t.id === 'nw_up' || t.id === 'buy_below'; });
    // Armstrong's deleveraging track (P5.1) leans the yearly goals toward cutting LTV until it is done
    var fam = s.goals.family;
    if (fam && !fam.done && !fam.failed) { var rl = cands.filter(function (t) { return t.id === 'reduce_ltv'; }); if (rl.length) cands = cands.concat(rl, rl); }
    var t = R.pick(cands);
    var g = { id: t.id, desc: t.desc, baseline: t.baseline(s), year: s.year, reward: G.rewardFor() };
    if (t.check(s, g)) { var alt = G.yearlyTemplates.filter(function (x) { return x.id !== t.id && x.available(s); })[0] || G.yearlyTemplates[0]; g = { id: alt.id, desc: alt.desc, baseline: alt.baseline(s), year: s.year, reward: G.rewardFor() }; }
    s.goals.yearly = g;
    return g;
  };
  G.yearlySatisfied = function (g) { var s = PE.S(); for (var i = 0; i < G.yearlyTemplates.length; i++) if (G.yearlyTemplates[i].id === g.id) return G.yearlyTemplates[i].check(s, g); return false; };

  /* Family goal track (P5.1): Armstrong must bring portfolio LTV below 50% by 1860. */
  G.familyTracks = {
    armstrong: { id: 'armstrong_deleverage', desc: 'Deleverage: bring portfolio LTV below 50% by 1860.', deadline: 1860, kind: 'ltv_below', target: 0.5 }
  };
  G.assignFamily = function () {
    var s = PE.S(), def = G.familyTracks[s.familyId]; if (!def) { s.goals.family = null; return null; }
    s.goals.family = { id: def.id, desc: def.desc, deadline: def.deadline, kind: def.kind, target: def.target, done: false, doneYear: null, failed: false };
    return s.goals.family;
  };
  G.familySatisfied = function (g) { if (!g) return false; if (g.kind === 'ltv_below') return St.playerProps().length > 0 && St.ltv('player') < g.target; return false; };
  G.familyProgress = function (g) { if (!g) return ''; if (g.kind === 'ltv_below') return 'LTV ' + Math.round(St.ltv('player') * 100) + '% (target below ' + Math.round(g.target * 100) + '%)'; return ''; };
  G.assignEra = function () {
    var s = PE.S(), era = St.era(), def = D.eraGoals[era.id];
    s.goals.era = { id: era.id, desc: def.desc, deadline: era.to, kind: def.kind, def: def, done: false, failed: false };
    return s.goals.era;
  };
  G.eraSatisfied = function (g) {
    var s = PE.S(), def = g.def, props = St.playerProps();
    switch (def.kind) {
      case 'district_count': { var counts = {}; for (var i = 0; i < props.length; i++) if (props[i].cityId === def.city) { counts[props[i].district] = (counts[props[i].district] || 0) + 1; if (counts[props[i].district] >= def.count) return true; } return false; }
      case 'cities': return St.citiesWithProps('player') >= def.count;
      case 'survive': return s.stats.forcedSalesThisEra === 0 && s.cash >= def.cashPct * Math.max(1, St.netWorth('player')) && s.year >= g.deadline;
      case 'props': return props.length >= def.count;
      case 'type': return props.some(function (p) { return p.type === def.type; });
      case 'rank': return St.rank() === def.rank;
    }
    return false;
  };
  G.eraProgress = function (g) {
    var s = PE.S(), def = g.def, props = St.playerProps();
    switch (def.kind) {
      case 'district_count': { var best = 0, counts = {}; for (var i = 0; i < props.length; i++) if (props[i].cityId === def.city) { counts[props[i].district] = (counts[props[i].district] || 0) + 1; best = Math.max(best, counts[props[i].district]); } return best + '/' + def.count; }
      case 'cities': return St.citiesWithProps('player') + '/' + def.count;
      case 'survive': return s.stats.forcedSalesThisEra === 0 ? 'No forced sales so far' : 'Failed: a forced sale happened';
      case 'props': return props.length + '/' + def.count;
      case 'type': return props.some(function (p) { return p.type === def.type; }) ? 'Done' : 'Not yet';
      case 'rank': return '#' + St.rank();
    }
    return '';
  };

  G.tierSatisfied = function (t) {
    var s = PE.S(), nw = St.netWorth('player');
    if (t.props && St.propertyCount('player') < t.props) return false;
    if (t.nwMult && nw < s.startNetWorth * t.nwMult) return false;
    if (t.cities && St.unlockedCities().length < t.cities) return false;
    if (t.generation && s.dynasty.generation < t.generation) return false;
    if (t.rank && St.rank() > t.rank) return false;
    return true;
  };
  /* Cities opened by the player after the start (scenario starts open some cities on day one). */
  G.citiesUnlockedSinceStart = function () { var s = PE.S(), n = 0; for (var c in s.stats.cityUnlockYear) if (s.stats.cityUnlockYear[c] > s.startYear) n++; return n; };
  G.achievementSatisfied = function (id) {
    var s = PE.S(), st = s.stats, props = St.playerProps();
    switch (id) {
      case 'first_deal': return st.belowAsk >= 1;
      case 'auction_winner': return st.auctionsWon >= 1;
      case 'flipper': return st.flips >= 1;
      case 'brrrr': return st.brrrr >= 1;
      case 'portfolio_5': return props.length >= 5 && st.bought >= 1;
      case 'portfolio_15': return props.length >= 15 && st.bought >= 1;
      case 'portfolio_40': return props.length >= 40 && st.bought >= 1;
      case 'second_city': return St.unlockedCities().length >= 2 && G.citiesUnlockedSinceStart() >= 1;
      case 'five_cities': return St.unlockedCities().length >= 5;
      case 'all_cities': return St.unlockedCities().length >= D.cities.length;
      case 'survivor': return st.depressionsSurvived >= 1;
      case 'generation_2': return s.dynasty.generation >= 2;
      case 'generation_4': return s.dynasty.generation >= 4;
      case 'rank_1': return St.rank() === 1 && s.year > s.startYear;
      case 'rebuilder': return st.rebuilds >= 1;
      case 'tower': return props.some(function (p) { return p.type === 'tower'; });
      case 'wealth_100x': return St.netWorth('player') >= s.startCash * 100;
      case 'reputation_90': return s.reputation >= 90;
      case 'comeback': return st.bankruptcies >= 1 && st.comebackFrom > 0 && St.netWorth('player') >= st.comebackFrom;
      // v2 (P5.5)
      case 'bargain_hunter': return st.steals >= 1;
      case 'ten_deals': return st.bought >= 10;
      case 'fifty_deals': return st.bought >= 50;
      case 'counter_closer': return st.countersClosed >= 5;
      case 'refinancer': return st.refinances >= 10;
      case 'debt_free': return props.length >= 5 && props.every(function (p) { return !p.mortgage; }) && s.year > s.startYear;
      case 'high_wire': return st.highLtvYears >= 3;
      case 'covenant_kept': return st.marginCallsCleared >= 1;
      case 'two_depressions': return st.depressionsSurvived >= 2;
      case 'cash_king': return st.cashKingYears >= 1;
      case 'centenarian': return s.year - s.startYear >= 100;
      case 'the_long_game': return s.status === 'ended' && s.year > s.endYear;
      case 'wealth_1000x': return St.netWorth('player') >= s.startCash * 1000;
      case 'generation_6': return s.dynasty.generation >= 6;
      case 'scholar': return st.educated >= 3;
      case 'matchmaker': return st.marriages >= 1;
      case 'merger': return st.mergers >= 1;
      case 'trust_fund': return st.trustSuccessions >= 1;
      case 'ten_cities': return St.unlockedCities().length >= 10;
      case 'world_citizen': return St.citiesWithProps('player') >= 5;
      case 'district_king': { for (var i = 0; i < props.length; i++) { var d = St.district(props[i].cityId, props[i].district); if (d && d.playerCount / d.stock >= 0.3 && d.playerCount >= 3) return true; } return false; }
      case 'top_dog_decade': return st.rank1Years >= 10;
      case 'nemesis': { for (var k in st.outbidRivals) if (st.outbidRivals[k] >= 5) return true; return false; }
      case 'vulture': return st.vultures >= 1;
      case 'friend_of_banks': return st.rothschildLoans >= 1;
      case 'peacemaker': { var n = 0; for (var rid in s.rivals) if (!s.rivals[rid].bankrupt && s.rivals[rid].relation >= 70) n++; return n >= 4; }
    }
    return false;
  };

  /* Called at endYear before the year advances. */
  G.evaluate = function (report) {
    var s = PE.S(), g = s.goals, i;
    if (g.yearly && G.yearlySatisfied(g.yearly)) {
      s.cash += g.yearly.reward; s.reputation = U.clamp(s.reputation + 1, 0, 100); s.stats.yearlyGoalsDone++;
      report.goals.achieved.push({ kind: 'yearly', id: g.yearly.id, desc: g.yearly.desc, reward: g.yearly.reward });
      g.history.push({ year: s.year, id: g.yearly.id, done: true });
    } else if (g.yearly) { g.history.push({ year: s.year, id: g.yearly.id, done: false }); report.goals.progress.push({ kind: 'yearly', id: g.yearly.id, desc: g.yearly.desc, done: false }); }
    if (g.era && !g.era.done) {
      if (G.eraSatisfied(g.era)) { g.era.done = true; var rw = Math.round(Math.max(0, St.netWorth('player')) * 0.03); s.cash += rw; s.reputation = U.clamp(s.reputation + 5, 0, 100); report.goals.achieved.push({ kind: 'era', id: g.era.id, desc: g.era.desc, reward: rw }); g.eraDone[g.era.id] = true; }
      else if (s.year >= g.era.deadline) { g.era.failed = true; report.goals.progress.push({ kind: 'era', id: g.era.id, desc: g.era.desc, done: false, failed: true }); }
      else report.goals.progress.push({ kind: 'era', id: g.era.id, desc: g.era.desc, progress: G.eraProgress(g.era) });
    }
    if (g.family && !g.family.done && !g.family.failed) {
      if (G.familySatisfied(g.family)) { g.family.done = true; g.family.doneYear = s.year; var rw3 = Math.round(Math.max(0, St.netWorth('player')) * 0.03); s.cash += rw3; s.reputation = U.clamp(s.reputation + 5, 0, 100); report.goals.achieved.push({ kind: 'family', id: g.family.id, desc: g.family.desc, reward: rw3 }); }
      else if (s.year >= g.family.deadline) { g.family.failed = true; St.rep(-5); report.goals.progress.push({ kind: 'family', id: g.family.id, desc: g.family.desc, done: false, failed: true }); }
      else report.goals.progress.push({ kind: 'family', id: g.family.id, desc: g.family.desc, progress: G.familyProgress(g.family) });
    }
    while (g.campaignTier < D.campaignTiers.length && G.tierSatisfied(D.campaignTiers[g.campaignTier])) {
      var t = D.campaignTiers[g.campaignTier]; g.campaignTier++;
      var rw2 = Math.round(Math.max(0, St.netWorth('player')) * 0.02); s.cash += rw2; s.reputation = U.clamp(s.reputation + 3, 0, 100);
      report.goals.achieved.push({ kind: 'campaign', id: t.id, desc: t.name + ': ' + t.desc, reward: rw2 });
    }
    G.checkAchievements(report);
  };
  G.checkAchievements = function (report) {
    var g = PE.S().goals;
    for (var i = 0; i < D.achievements.length; i++) {
      var a = D.achievements[i]; if (g.achievements.indexOf(a.id) >= 0) continue;
      if (G.achievementSatisfied(a.id)) { g.achievements.push(a.id); if (report) report.goals.achieved.push({ kind: 'achievement', id: a.id, desc: a.name + ': ' + a.desc, category: a.category, rare: !!a.rare }); }
    }
  };

  G.current = function () {
    var s = PE.S(), g = s.goals, tier = D.campaignTiers[g.campaignTier] || null;
    return PE.ok({
      yearly: g.yearly ? { id: g.yearly.id, desc: g.yearly.desc, reward: g.yearly.reward, satisfied: G.yearlySatisfied(g.yearly) } : null,
      era: g.era ? { id: g.era.id, desc: g.era.desc, deadline: g.era.deadline, progress: G.eraProgress(g.era), done: g.era.done, failed: g.era.failed } : null,
      family: g.family ? { id: g.family.id, desc: g.family.desc, deadline: g.family.deadline, progress: G.familyProgress(g.family), done: g.family.done, failed: g.family.failed } : null,
      campaign: { tier: g.campaignTier, completed: D.campaignTiers.slice(0, g.campaignTier).map(function (t) { return t.name; }), next: tier ? { id: tier.id, name: tier.name, desc: tier.desc } : null },
      achievements: D.achievements.map(function (a) { return { id: a.id, name: a.name, desc: a.desc, category: a.category, rare: !!a.rare, earned: g.achievements.indexOf(a.id) >= 0 }; }),
      legacyScore: G.legacyScore(),
      scenario: s.scenario ? U.clone(s.scenario) : null,
      challenge: s.challenge ? { week: s.challenge.week, endYear: s.challenge.endYear, yearsLeft: Math.max(0, s.challenge.endYear - s.year + 1), score: G.challengeScore() } : null
    });
  };

  /* Legacy score (bible §8): generations × wealth × cities × reputation × achievements (× mergers, P3.2). */
  G.legacyScore = function () {
    var s = PE.S(), nw = Math.max(1, St.netWorth('player')), wealth = 1 + Math.log(nw / Math.max(1, s.startNetWorth)) / Math.LN10;
    var mergers = 1 + B.mergerLegacyMult * ((s.dynasty && s.dynasty.mergers) || 0);
    return Math.round(s.dynasty.generation * Math.max(0.1, wealth) * St.unlockedCities().length * (s.reputation / 50) * (1 + s.goals.achievements.length / 10) * mergers * 100);
  };
  /* Weekly challenge score (P5.3): growth multiple, reputation and achievements; comparable across players. */
  G.challengeScore = function () {
    var s = PE.S();
    if (s.status === 'bankrupt') return 0;
    var mult = Math.max(0, St.netWorth('player')) / Math.max(1, s.startNetWorth);
    return Math.round(mult * 100 + s.reputation + 25 * s.goals.achievements.length + 50 * (s.dynasty.generation - 1));
  };

  PE.Goals = G;
})(typeof window !== 'undefined' ? window : global);
