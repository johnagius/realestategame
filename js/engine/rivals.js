/* PE.Rivals — six rival families as real agents: actual portfolios, cash and
   mortgages, archetype-driven yearly decisions (appraise with their own noise,
   buy, renovate, sell, expand), contesting the player's deals at auction,
   offers on the player's buildings, bankruptcy/absorption and rubber-banding. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var Rv = {};
  Rv.owner = function (id) { return 'rival:' + id; };
  Rv.def = function (id) { return D.rivalById(id); };

  /* ---------- Relations (P3.2): s.relations[id] runs −100..100; rv.relation (0..100) is the view the UI shows ---------- */
  Rv.relationView = function (rel) { return Math.round(U.clamp(50 + rel / 2, 0, 100)); };
  Rv.adjustRelation = function (id, delta, why) {
    var s = PE.S(), rv = s.rivals[id]; if (!rv || !delta) return 0;
    var before = s.relations[id] || 0;
    s.relations[id] = Math.round(U.clamp(before + delta, -100, 100));
    rv.relation = Rv.relationView(s.relations[id]);
    if (why) {
      rv.lastRelationChange = { year: s.year, delta: delta, why: why };
      rv.relationLog = rv.relationLog || [];
      rv.relationLog.push({ year: s.year, delta: delta, why: why });
      if (rv.relationLog.length > 6) rv.relationLog.shift();
    }
    return s.relations[id] - before;
  };
  /* A voiced line for a rival. kind: outbidYou/outbidAny/win/lose/ally/jab/greet/idle.
     Picked by hash, not PE.RNG: voice lines must never shift the gameplay stream. */
  Rv.taunt = function (id, kind) {
    var rd = Rv.def(id), T = rd && D.taunts[rd.archetype];
    if (!T) return '';
    var pool = T[kind] || T.idle || [];
    if (!pool.length) return '';
    var s = PE.S(), rv = s.rivals[id];
    var n = rv ? (rv.tauntCount = (rv.tauntCount || 0) + 1) : 1;
    var h = PE.RNG.hashSeed(id + ':' + kind + ':' + (s.year || 0) + ':' + n);
    return pool[Math.abs(h) % pool.length];
  };
  /* The year's line when the rival did nothing notable: persona by relation tier. */
  Rv.idleLine = function (rv, rd) {
    var s = PE.S(), rel = s.relations[rv.id] || 0, T = D.taunts[rd.archetype];
    if (rv.allied && T.ally) return R.pick(T.ally);
    if (rel <= -30 && T.jab) return R.pick(T.jab);
    if (rel >= 60 && T.greet) return R.pick(T.greet);
    return R.pick(T.idle);
  };
  Rv.setRelation = function (id, value) { var s = PE.S(); return Rv.adjustRelation(id, value - (s.relations[id] || 0)); };
  Rv.allies = function () { var s = PE.S(), out = []; for (var id in s.rivals) if (s.rivals[id].allied && !s.rivals[id].bankrupt) out.push(id); return out; };
  /* The city where a rival holds the most buildings (its first office when it holds none). */
  Rv.favouriteCity = function (id) {
    var s = PE.S(), rv = s.rivals[id], props = St.ownedProps(Rv.owner(id)), counts = {}, best = null;
    for (var i = 0; i < props.length; i++) { counts[props[i].cityId] = (counts[props[i].cityId] || 0) + 1; if (!best || counts[props[i].cityId] > counts[best]) best = props[i].cityId; }
    return best || (rv && rv.cities[0]) || 'london';
  };
  /* Rivals holding buildings in a city resent evictions there (relation driver). */
  Rv.evictionIn = function (cityId, district) {
    var s = PE.S(), hit = [];
    for (var id in s.rivals) { if (s.rivals[id].bankrupt) continue; if (St.ownedProps(Rv.owner(id)).some(function (p) { return p.cityId === cityId && (!district || p.district === district); })) { Rv.adjustRelation(id, B.relationEviction, 'evictions'); hit.push(id); } }
    s.stats.evictions++;
    return hit;
  };
  /* Rank history for the leaderboard (P2.0): called at the end of every year and at newGame. */
  Rv.snapshotRanks = function () {
    var s = PE.S(), rows = Rv._leaderboardRaw(), byId = {};
    for (var i = 0; i < rows.length; i++) byId[rows[i].id] = rows[i].rank;
    if (s.ranks.year !== s.year || !s.ranks.byId.player) { s.ranks.prevYear = s.ranks.byId.player ? s.ranks.year : null; s.ranks.prevById = s.ranks.byId.player ? s.ranks.byId : {}; }
    s.ranks.year = s.year; s.ranks.byId = byId;
  };

  Rv.create = function (fam) {
    var s = PE.S(), defs = D.rivals.slice();
    for (var x = 0; x < D.extraRivals.length; x++) if (St.hasPerk(D.extraRivals[x].perk)) defs.push(D.extraRivals[x]);
    var home = St.unlockedCities();
    for (var i = 0; i < defs.length; i++) {
      var rd = defs[i], wealth = s.startCash * rd.wealthMult * B.rivalStartWealthMult;
      var rv = { id: rd.id, cash: Math.round(wealth * 0.45), relation: 50, cities: home.slice(), bankrupt: false, bankruptYear: null, merged: false, mergedYear: null, allied: false, lastAction: 'Watching the market.', mistakeYear: 0, stats: { bought: 0, sold: 0 }, windfalls: 0 };
      s.rivals[rd.id] = rv;
      s.relations[rd.id] = 0; Rv.adjustRelation(rd.id, St.hasTrait('charmer') ? 20 : 0);
      var budget = wealth * 0.55, n = R.int(1, 3);
      for (var k = 0; k < n; k++) {
        var p = PE.Market.genProperty(home[k % home.length], { condition: R.int(35, 80) });
        var target = budget / n, scale = target / p.trueValue;
        p.sqm = Math.round(U.clamp(p.sqm * scale, D.propertyTypes[p.type].sqm[0], D.propertyTypes[p.type].sqm[1]));
        PE.Property.revalue(p); PE.Property.initTenancy(p);
        p.purchasePrice = p.trueValue; p.purchaseYear = s.year - R.int(1, 15);
        if (rd.leverage > 0.25) p.mortgage = PE.Finance.makeMortgage(Rv.owner(rd.id), p.trueValue * rd.leverage * 0.8, 'io', false);
        St.setOwner(p, Rv.owner(rd.id));
      }
    }
  };

  Rv.districtMult = function (p) {
    var ds = D.cityById[p.cityId].districts;
    for (var i = 0; i < ds.length; i++) if (ds[i].name === p.district) return ds[i].mult;
    return 1;
  };
  /* Preference weight (0 = not interested) by archetype. */
  Rv.wants = function (rv, l) {
    var rd = Rv.def(rv.id), mult = Rv.districtMult(l), d = St.district(l.cityId, l.district), s = PE.S();
    var lux = l.type === 'mansion' || l.type === 'villa' || l.type === 'penthouse' || l.type === 'townhouse';
    if (l.type === 'land' && rd.prefers !== 'derelict') return 0;
    switch (rd.prefers) {
      case 'bluechip': return mult >= 1.3 ? 1.2 : 0;
      case 'prestige': return (mult >= 1.6 || lux) ? 1.3 : 0;
      case 'momentum': return d.momentum > 0.008 ? 1.2 : (s.cycle.phase === 'boom' ? 1.0 : (d.momentum > 0 ? 0.4 : 0));
      case 'cheap': return (l.condition < 50 || mult < 0.8) ? 1.2 : 0;
      case 'derelict': return (l.type === 'land' || l.condition < 30) ? 1.3 : (d.momentum > 0.01 ? 1.0 : 0);
      default: return (l.askingPrice && l.askingPrice / l.trueValue < 0.9) ? 1.2 : 1.0;
    }
  };
  Rv.appraise = function (rv, l) { return Math.round(l.trueValue * (1 + R.normal(0, Rv.def(rv.id).noise))); };
  Rv.canPay = function (rv, price, l) {
    var rd = Rv.def(rv.id), duty = PE.Market.stampDuty(l, price);
    return rv.cash - (price * (1 - rd.leverage) + duty) >= rv.cash * 0.08;
  };

  /* Which rivals contest the player's deal (bible §3.3). Returns [{id, maxBid}] sorted desc. */
  Rv.contest = function (l, price, forcedChance) {
    var s = PE.S(), out = [];
    for (var id in s.rivals) {
      var rv = s.rivals[id], rd = Rv.def(id);
      if (rv.bankrupt || rv.allied || rv.cities.indexOf(l.cityId) < 0 || l.sellerRivalId === id) continue; // an ally never bids against you
      if (St.propertyCount(Rv.owner(id)) >= B.rivalMaxProperties) continue;
      var pref = Rv.wants(rv, l); if (!pref) continue;
      var ap = Rv.appraise(rv, l), maxBid = Math.round(ap * rd.bidMult * (pref > 1 ? 1.02 : 1));
      if (St.hasTrait('gambler')) maxBid = Math.round(maxBid * 0.97);
      if (maxBid < price * 1.02 || !Rv.canPay(rv, maxBid, l)) continue;
      var bargainness = l.askingPrice / ap, mult = bargainness < 0.85 ? 1 : (bargainness < 0.95 ? 0.5 : 0.2);
      var chance = forcedChance !== null && forcedChance !== undefined ? forcedChance : B.rivalContestChance * rd.aggression * mult;
      if (R.chance(chance)) out.push({ id: id, maxBid: maxBid });
    }
    out.sort(function (a, b) { return b.maxBid - a.maxBid; });
    return out;
  };

  /* Property bought by a rival (from the board, an auction, or the player). */
  Rv.acquire = function (id, p, price) {
    var s = PE.S(), rv = s.rivals[id], rd = Rv.def(id);
    var duty = PE.Market.stampDuty(p, price), principal = Math.round(price * rd.leverage);
    rv.cash -= (price - principal + duty);
    p.mortgage = principal > 0 ? PE.Finance.makeMortgage(Rv.owner(id), principal, 'io', false) : null;
    p.purchasePrice = price; p.purchaseYear = s.year; p.forSale = null; p.marginCall = null;
    St.setOwner(p, Rv.owner(id));
    PE.Property.initTenancy(p);
    rv.stats.bought++;
  };
  /* The player accepted a rival's offer. */
  Rv.paid = function (id, price, p) {
    var s = PE.S(), rv = s.rivals[id], rd = Rv.def(id), principal = Math.round(price * rd.leverage);
    rv.cash -= (price - principal);
    p.mortgage = principal > 0 ? PE.Finance.makeMortgage(Rv.owner(id), principal, 'io', false) : null;
    rv.stats.bought++; rv.lastAction = 'Bought ' + p.name + ' from you.';
  };
  /* A rival's listing sold (to anyone) or expired (sold to the open market at 95%). */
  Rv.listingSold = function (id, l, price) { var rv = PE.S().rivals[id]; if (!rv) return; var debt = l.mortgage ? l.mortgage.principal : 0; rv.cash += Math.round(price * (1 - B.agentFee)) - debt; l.mortgage = null; rv.stats.sold++; };
  Rv.listingExpired = function (l) { var s = PE.S(), rv = s.rivals[l.sellerRivalId]; if (!rv) return; var debt = l.mortgage ? l.mortgage.principal : 0; rv.cash += Math.round(l.trueValue * 0.95 * (1 - B.agentFee)) - debt; rv.stats.sold++; };

  Rv.listForSale = function (rv, p, m) {
    St.setOwner(p, null); // leaves the portfolio; mortgage rides along until sold
    p.ownerId = null;
    PE.Market.list(p, 'rival', rv.id, m);
    rv.stats.sold++;
  };
  Rv.quickSell = function (rv, p) {
    var debt = p.mortgage ? p.mortgage.principal : 0, price = Math.round(p.trueValue * B.quickSaleFactor);
    rv.cash += Math.round(price * (1 - B.agentFee)) - debt;
    St.setOwner(p, null); rv.stats.sold++;
    return price;
  };
  Rv.renoCost = function (p, tier) { var t = D.renovation[tier]; return Math.round(p.trueValue * (p.type === 'land' && tier === 'rebuild' ? 1.6 : t.cost)); };

  Rv.yearly = function (report) {
    var s = PE.S();
    s.offers = []; // last year's offers expire
    var ids = Object.keys(s.rivals);
    for (var i = 0; i < ids.length; i++) Rv.runRival(s.rivals[ids[i]], report);
    Rv.rubberBand(report);
    // relations drift back toward neutral (allies stay warm)
    for (var k = 0; k < ids.length; k++) {
      var rel = s.relations[ids[k]] || 0, floor = s.rivals[ids[k]].allied ? 30 : -100;
      if (rel > floor) Rv.adjustRelation(ids[k], rel > 0 ? -Math.min(B.relationDrift, rel - floor) : Math.min(B.relationDrift, -rel));
    }
  };

  Rv.runRival = function (rv, report) {
    var s = PE.S(); if (rv.bankrupt) return;
    var rd = Rv.def(rv.id), owner = Rv.owner(rv.id), props = St.ownedProps(owner), ctx = { mgmt: 'manager', quality: 0.7, fee: B.managerFeeDefault };
    var income = 0, action = null, i, p;
    for (i = 0; i < props.length; i++) {
      p = props[i];
      if (p.renovation) PE.Property.progressRenovation(p);
      income += PE.Property.operate(p, ctx).net;
    }
    var debtService = PE.Finance.service(owner);
    rv.cash += income - debtService;
    if (rv.cash > 0) rv.cash += Math.round(rv.cash * Math.max(0, s.baseRate - B.savingsRateBelowBase));
    // Margin calls: pay down or dump
    props = St.ownedProps(owner).slice();
    for (i = 0; i < props.length; i++) {
      p = props[i]; if (!p.mortgage) continue;
      var ltv = p.mortgage.principal / Math.max(1, p.trueValue);
      if (ltv > B.covenantLtv) {
        var need = Math.round(p.mortgage.principal - p.trueValue * B.covenantLtv);
        if (rv.cash > need * 1.5) { rv.cash -= need; p.mortgage.principal -= need; }
        else { Rv.quickSell(rv, p); action = 'Forced to dump ' + p.name + ' by the bank.'; }
      }
    }
    // Cash below zero: sell until solvent
    props = St.ownedProps(owner).slice().sort(function (a, b) { return (a.trueValue - (a.mortgage ? a.mortgage.principal : 0)) - (b.trueValue - (b.mortgage ? b.mortgage.principal : 0)); });
    while (rv.cash < 0 && props.length) { Rv.quickSell(rv, props.shift()); action = action || 'Selling to stay afloat.'; }
    if (rv.cash < 0 || St.netWorth(owner) < 0) { Rv.goBankrupt(rv, report); return; }
    // Renovate
    props = St.ownedProps(owner);
    for (i = 0; i < props.length; i++) {
      p = props[i]; if (p.renovation) continue;
      if (rd.prefers === 'derelict' && (p.type === 'land' || p.condition < 30)) {
        var rc = Rv.renoCost(p, 'rebuild');
        if (rv.cash > rc * 1.5) { rv.cash -= rc; p.renovation = { tier: 'rebuild', yearsLeft: 2, cost: rc, overrun: 0, delay: 0, started: s.year }; action = 'Rebuilding ' + p.name + '.'; break; }
      } else if (rd.renovates && p.condition < 45 && p.type !== 'land') {
        var pc = Rv.renoCost(p, 'patch');
        if (rv.cash > pc * 3) { rv.cash -= pc; PE.Property.applyRenovation(p, 'patch'); }
      }
    }
    // Sell by archetype
    props = St.ownedProps(owner).slice();
    var sold = 0;
    for (i = 0; i < props.length && sold < 2; i++) {
      p = props[i]; if (p.renovation) continue;
      var gain = p.purchasePrice ? p.trueValue / p.purchasePrice : 1;
      if (rd.sells === 'boom' && s.cycle.phase === 'boom' && gain >= 1.25) { Rv.listForSale(rv, p, R.range(1.0, 1.25)); sold++; action = 'Cashing in ' + p.name + ' at the top.'; }
      else if (rd.sells === 'rebuilt' && p.lastRenovated && s.year - p.lastRenovated >= 2 && p.condition >= 85 && R.chance(0.5)) { Rv.listForSale(rv, p, R.range(1.05, 1.2)); sold++; action = 'Selling the rebuilt ' + p.name + '.'; }
      else if (rd.sells === 'rarely' && R.chance(0.04)) { Rv.listForSale(rv, p, R.range(1.0, 1.15)); sold++; action = 'Quietly selling ' + p.name + '.'; }
    }
    // Portfolio cap: upgrade by selling the smallest
    props = St.ownedProps(owner);
    if (props.length >= B.rivalMaxProperties - 1) {
      var small = props.slice().sort(function (a, b) { return a.trueValue - b.trueValue; })[0];
      var debt0 = small.mortgage ? small.mortgage.principal : 0; rv.cash += Math.round(small.trueValue * 0.97) - debt0; St.setOwner(small, null); rv.stats.sold++;
    }
    // Buy
    var bought = Rv.buyFromBoard(rv, report);
    if (bought) action = bought;
    // Expand
    if (R.chance(B.rivalExpansionChance)) {
      var nw = St.netWorth(owner), cand = [];
      for (var ci = 0; ci < D.cities.length; ci++) {
        var c = D.cities[ci];
        if (c.availableFrom > s.year || rv.cities.indexOf(c.id) >= 0) continue;
        if ((rd.prefers === 'bluechip' || rd.prefers === 'prestige') && c.tier > 2) continue;
        cand.push(c);
      }
      if (cand.length && nw > D.cityById[rv.cities[0]].basePpsqm * s.priceIndex * 400 * rv.cities.length) {
        var nc = R.pick(cand); rv.cities.push(nc.id); action = action || ('Opened an office in ' + nc.name + '.');
      }
    }
    // Offer on a player property
    if (R.chance(B.rivalOfferChance * rd.aggression)) Rv.offerToPlayer(rv);
    rv.lastAction = action || Rv.idleLine(rv, rd);
    if (report) report.rivalsMoves.push({ id: rv.id, name: rd.name, text: rv.lastAction, netWorth: St.netWorth(owner) });
  };

  Rv.buyFromBoard = function (rv, report) {
    var s = PE.S(), rd = Rv.def(rv.id), owner = Rv.owner(rv.id), cands = [], nw = St.netWorth(owner), n = St.propertyCount(owner);
    if (n >= B.rivalMaxProperties) return null;
    var listings = PE.Market.listingArray(null);
    for (var i = 0; i < listings.length; i++) {
      var l = listings[i];
      if (rv.cities.indexOf(l.cityId) < 0 || l.sellerRivalId === rv.id) continue;
      if (s.auction && s.auction.listingId === l.id) continue;
      if (n >= 5 && l.askingPrice < nw * 0.015) continue; // too small to bother
      var pref = Rv.wants(rv, l); if (!pref) continue;
      var ap = Rv.appraise(rv, l), ratio = l.askingPrice / ap;
      if (ratio > rd.floor * (pref > 1 ? 1.05 : 1)) continue;
      var price = Math.max(Math.round(l.askingPrice * 0.88), Math.min(l.askingPrice, Math.round(ap * rd.bidMult)));
      if (!Rv.canPay(rv, price, l)) continue;
      cands.push({ l: l, price: price, score: pref * ap / l.askingPrice });
    }
    cands.sort(function (a, b) { return b.score - a.score; });
    var bought = 0, text = null;
    for (var k = 0; k < cands.length && bought < B.rivalMaxBuysPerYear; k++) {
      var c = cands[k]; if (!s.listings[c.l.id] || !Rv.canPay(rv, c.price, c.l)) continue;
      PE.Market.buy(c.l, c.price, null, owner); bought++;
      text = 'Bought ' + c.l.name + ' for ' + U.fmt(c.price) + '.';
    }
    return text;
  };

  /* A fresh bargain may be bought by a rival before the player ever sees it (bible: rivals grow with you). */
  Rv.preempt = function (l) {
    var s = PE.S(), best = null, bestScore = 0;
    for (var id in s.rivals) {
      var rv = s.rivals[id], rd = Rv.def(id);
      if (rv.bankrupt || rv.cities.indexOf(l.cityId) < 0) continue;
      if (St.propertyCount(Rv.owner(id)) >= B.rivalMaxProperties) continue;
      var pref = Rv.wants(rv, l); if (!pref) continue;
      var ap = Rv.appraise(rv, l); if (l.askingPrice / ap > rd.floor) continue;
      if (!Rv.canPay(rv, l.askingPrice, l)) continue;
      var score = pref * rd.aggression * ap / l.askingPrice;
      if (score > bestScore) { bestScore = score; best = rv; }
    }
    if (!best) return false;
    if (!s.snappedUp) s.snappedUp = [];
    s.snappedUp.push({ id: l.id, name: l.name, cityId: l.cityId, district: l.district, type: l.type, askingPrice: l.askingPrice, rivalId: best.id, year: s.year });
    while (s.snappedUp.length > 4) s.snappedUp.shift();
    PE.Market.buy(l, l.askingPrice, null, Rv.owner(best.id));
    best.lastAction = 'Snapped up ' + l.name + ' before it was advertised.';
    return true;
  };

  Rv.offerToPlayer = function (rv) {
    var s = PE.S(), rd = Rv.def(rv.id), props = St.playerProps(), cands = [];
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      if (rv.cities.indexOf(p.cityId) < 0 || p.renovation || p.type === 'land') continue;
      if (Rv.wants(rv, p) > 0) cands.push(p);
    }
    if (!cands.length) return;
    var p2 = R.pick(cands), prem = R.range(B.rivalOfferPremium[0], rd.prefers === 'prestige' ? B.rivalOfferPremium[1] : 1.25);
    var price = Math.round(p2.trueValue * prem);
    if (!Rv.canPay(rv, price, p2)) return;
    s.offers.push({ id: St.nextId('o'), propertyId: p2.id, rivalId: rv.id, price: price, year: s.year });
    rv.lastAction = 'Made an offer on your ' + p2.name + '.';
  };

  Rv.goBankrupt = function (rv, report) {
    var s = PE.S(), rd = Rv.def(rv.id), owner = Rv.owner(rv.id), props = St.ownedProps(owner).slice();
    rv.bankrupt = true; rv.bankruptYear = s.year; rv.lastAction = 'Bankrupt.';
    var value = 0, debt = 0;
    for (var i = 0; i < props.length; i++) { value += props[i].trueValue; debt += props[i].mortgage ? props[i].mortgage.principal : 0; }
    var price = Math.max(0, Math.round((value - debt) * 0.8));
    var strongest = Rv.strongest(rv.id);
    if (report) report.rivalsMoves.push({ id: rv.id, name: rd.name, text: 'The ' + rd.name.replace('The ', '') + ' are bankrupt.', netWorth: 0 });
    if (props.length && s.cash >= price) {
      PE.Events.push({ id: 'rival_bankrupt', title: rd.name + ' are bankrupt', text: 'Their ' + props.length + ' building(s) are worth ' + U.fmt(value) + ' with ' + U.fmt(debt) + ' of debt. The receiver offers you the lot for ' + U.fmt(price) + ', debt included.',
        choices: [{ label: 'Buy the portfolio for ' + U.fmt(price), fx: { absorbRival: { rivalId: rv.id, price: price, by: 'player' } } }, { label: 'Let ' + (strongest ? Rv.def(strongest).name : 'the banks') + ' have it', fx: { absorbRival: { rivalId: rv.id, price: 0, by: strongest } } }] });
    } else Rv.absorb(rv.id, strongest, 0, 'rival');
  };
  Rv.strongest = function (excludeId) {
    var s = PE.S(), best = null, bestNw = -Infinity;
    for (var id in s.rivals) { if (id === excludeId || s.rivals[id].bankrupt) continue; var nw = St.netWorth(Rv.owner(id)); if (nw > bestNw) { bestNw = nw; best = id; } }
    return best;
  };
  /* Transfer a bankrupt rival's portfolio to 'player' or another rival id. */
  Rv.absorb = function (rivalId, by, price) {
    var s = PE.S(), props = St.ownedProps(Rv.owner(rivalId)).slice(), rv = s.rivals[rivalId];
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      if (by === 'player') { St.setOwner(p, 'player'); p.purchasePrice = Math.round(p.trueValue * 0.8); p.purchaseYear = s.year; if (p.mortgage) p.mortgage = PE.Finance.makeMortgage('player', p.mortgage.principal, 'io', false); PE.Property.initTenancy(p); }
      else if (by) { St.setOwner(p, Rv.owner(by)); if (p.mortgage) p.mortgage.lender = 'Private bank'; }
      else St.setOwner(p, null);
    }
    if (by === 'player') { s.cash -= price; s.stats.bought += props.length; }
    rv.cash = 0;
    return props.length;
  };

  /* Rubber-banding (bible §5). */
  Rv.rubberBand = function (report) {
    var s = PE.S(), player = St.netWorth('player'), leaderId = Rv.strongest(null);
    if (!leaderId) return;
    var leader = s.rivals[leaderId], lnw = St.netWorth(Rv.owner(leaderId));
    if (player > 0 && lnw > 0 && player > B.rubberBandLead * lnw) {
      var w = Math.round(lnw * 0.25); leader.cash += w; leader.windfalls++;
      leader.lastAction = 'Inherited a fortune from a distant uncle.';
      if (report) report.rivalsMoves.push({ id: leaderId, name: Rv.def(leaderId).name, text: leader.lastAction, netWorth: lnw + w });
    } else if (player > 0 && player < B.rubberBandTrail * lnw && s.year - leader.mistakeYear > 5) {
      var props = St.ownedProps(Rv.owner(leaderId)).filter(function (p) { return !p.renovation && p.cityId && s.cities[p.cityId].unlocked; });
      if (props.length) {
        props.sort(function (a, b) { return b.trueValue - a.trueValue; });
        var p = props[Math.min(1, props.length - 1)];
        Rv.listForSale(leader, p, 0.82);
        leader.cash = Math.round(leader.cash * 0.9); leader.mistakeYear = s.year;
        leader.lastAction = 'Overextended; dumping ' + p.name + ' cheaply.';
        if (report) report.rivalsMoves.push({ id: leaderId, name: Rv.def(leaderId).name, text: leader.lastAction, netWorth: lnw });
      }
    }
  };

  /* Leaderboard rows. prevRank/rankDelta come from the engine's end-of-year snapshot (P2.0): rankDelta > 0 means climbed.
     A rival merged into the player's house (P3.2) is dropped from the table. */
  Rv._leaderboardRaw = function () {
    var s = PE.S(), rows = [{ id: 'player', name: s.familyName, netWorth: St.netWorth('player'), properties: St.propertyCount('player'), cities: St.citiesWithProps('player'), lastAction: s.lastReport ? s.lastReport.headline : 'A new dynasty begins.', color: s.color, isPlayer: true, bankrupt: s.status === 'bankrupt', allied: false, relation: undefined, relationScore: undefined }];
    for (var id in s.rivals) {
      var rv = s.rivals[id], rd = Rv.def(id);
      if (rv.merged) continue;
      var owner = Rv.owner(id);
      var owned = St.ownedProps(owner).slice().sort(function (a, b) { return b.trueValue - a.trueValue; }).slice(0, 5)
        .map(function (p) { return { id: p.id, name: p.name, cityId: p.cityId, district: p.district, value: p.trueValue, conditionLabel: PE.Property.view(p).conditionLabel, listed: false }; });
      for (var lid in s.listings) {
        var l = s.listings[lid];
        if (l.sellerRivalId !== id || owned.length >= 7) continue;
        owned.push({ id: lid, name: l.name, cityId: l.cityId, district: l.district, value: l.trueValue, conditionLabel: l.conditionLabel || '', listed: true });
      }
      rows.push({ id: id, name: rd.name, archetype: rd.archetype, color: rd.color, netWorth: rv.bankrupt ? 0 : St.netWorth(owner), properties: St.propertyCount(owner), cities: rv.cities.length, lastAction: rv.lastAction, relation: rv.relation, relationScore: s.relations[id] || 0, allied: !!rv.allied, bankrupt: rv.bankrupt, isPlayer: false, holdings: owned, relationLog: (rv.relationLog || []).slice(-5) });
    }
    rows.sort(function (a, b) { return b.netWorth - a.netWorth; });
    var prev = (s.ranks && s.ranks.prevById) || {};
    for (var i = 0; i < rows.length; i++) { rows[i].rank = i + 1; rows[i].prevRank = prev[rows[i].id] || null; rows[i].rankDelta = rows[i].prevRank ? rows[i].prevRank - rows[i].rank : 0; }
    return rows;
  };

  PE.Rivals = Rv;
})(typeof window !== 'undefined' ? window : global);
