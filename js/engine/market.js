/* PE.Market — the deal board. Mispriced listings by seller type, noisy comps
   and an estimate band for appraisal, offers that get accepted/countered/
   rejected, 3-round auctions against rivals, selling (market or quick), rival
   offers on your buildings, and yearly district price drift with pressure and
   saturation. Every purchase and sale in the game goes through buy()/sell(). */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var M = {};

  /* ---------- Generation ---------- */
  M.makeName = function (type, district) {
    var tpl = R.pick(D.nameTemplates[type] || ['{adj} Property, {district}']);
    return tpl.replace('{adj}', R.pick(D.adjectives)).replace('{district}', district).replace('{street}', R.pick(D.streetNames) + ' ' + R.pick(D.streetWords)).replace(/\{n\}/g, String(R.int(1, 120)));
  };

  /* Generate a property (not owned, not listed). opts: type, district, condition, sqm, era */
  M.genProperty = function (cityId, opts) {
    opts = opts || {};
    var s = PE.S(), c = D.cityById[cityId], eraIdx = St.eraIdx();
    var types = D.typesForEra(eraIdx), t = opts.type ? D.propertyTypes[opts.type] : null;
    if (!t) { var ws = []; for (var i = 0; i < types.length; i++) ws.push(types[i].weight); t = R.weighted(types, ws); }
    var dist = opts.district ? c.districts.filter(function (d) { return d.name === opts.district; })[0] : R.pick(c.districts);
    var p = {
      id: St.nextId('p'), cityId: cityId, district: dist.name, type: t.id, model3d: t.model3d, era: opts.era || St.era().id, name: '',
      sqm: opts.sqm || R.int(t.sqm[0], t.sqm[1]), condition: opts.condition !== undefined ? opts.condition : R.int(30, 85),
      quality: opts.quality || R.range(0.9, 1.1), trueValue: 0, ownerId: null,
      rentAnnual: 0, rentSetting: 1.0, occupancy: 0, tenantClass: 'clerks', lease: null,
      mortgage: null, renovation: null, buildJob: null, marginCall: null, forSale: null,
      purchasePrice: null, purchaseYear: null, builtYear: opts.builtYear || (s.year - R.int(0, 60)), lastRenovated: 0, history: []
    };
    if (t.id === 'land') p.condition = 50;
    p.name = M.makeName(t.id, dist.name);
    PE.Property.revalue(p);
    PE.Property.initTenancy(p);
    return p;
  };

  M.sellerFor = function () {
    var s = PE.S(), ids = [], ws = [], c = s.cycle.phase;
    for (var k in D.sellers) {
      var w = D.sellers[k].weight;
      if (k === 'developer' && (c === 'recession' || c === 'depression')) w *= 0.3;
      if (k === 'distressed' && (c === 'recession' || c === 'depression')) w *= 3;
      if (k === 'rival') w = 0; // rival listings come from actual rival sales
      ids.push(k); ws.push(w);
    }
    return R.weighted(ids, ws);
  };

  M.buyingPower = function () {
    var s = PE.S(), cash = Math.max(0, s.cash);
    var c = D.cityById['london'], minPrice = c.basePpsqm * s.priceIndex * 0.6 * 0.85 * 45 * 0.75; // a poor lodging house, roughly
    return Math.max(cash / B.buyingPowerDivisor, minPrice * 1.5);
  };

  /* Pick a (type, district, sqm) whose price lands near the desired value. */
  M.fitProperty = function (cityId, desired, seller) {
    var s = PE.S(), c = D.cityById[cityId], cs = s.cities[cityId], types = D.typesForEra(St.eraIdx());
    var condRange = { estate: [25, 70], distressed: [8, 50], developer: [92, 100], landlord: [45, 85], auction: [15, 60], rival: [30, 80] }[seller];
    var best = null;
    if (s.flags.extraLand > 0 && seller !== 'developer') { types = [D.propertyTypes.land]; }
    for (var k = 0; k < 2; k++) {
      var ws = []; for (var i = 0; i < types.length; i++) ws.push(types[i].weight);
      var t = R.weighted(types, ws), d = R.pick(c.districts), cond = R.int(condRange[0], condRange[1]);
      if (t.id === 'land') cond = 50;
      var cf = t.id === 'land' ? 1 : D.conditionBand(cond).valueFactor;
      var sqm = desired / (cs.districts[d.name].ppsqm * t.factor * cf);
      sqm = Math.round(U.clamp(sqm, t.sqm[0], t.sqm[1]));
      var price = sqm * cs.districts[d.name].ppsqm * t.factor * cf;
      var err = Math.abs(Math.log(price / desired));
      if (!best || err < best.err) best = { type: t.id, district: d.name, sqm: sqm, condition: cond, err: err };
    }
    return best;
  };

  M.genListing = function (cityId, desired, seller) {
    var s = PE.S(), c = D.cityById[cityId];
    seller = seller || M.sellerFor();
    var fit = M.fitProperty(cityId, desired, seller);
    var p = M.genProperty(cityId, { type: fit.type, district: fit.district, sqm: fit.sqm, condition: fit.condition, builtYear: seller === 'developer' ? s.year : undefined });
    if (fit.type === 'land') s.flags.extraLand = Math.max(0, s.flags.extraLand - 1);
    return M.list(p, seller, null);
  };

  /* Turn a property into a listing on the board. */
  M.list = function (p, seller, rivalId, mOverride) {
    var s = PE.S(), sd = D.sellers[seller], c = D.cityById[p.cityId];
    var m = mOverride || R.range(sd.m[0], sd.m[1]);
    if (c.trait === 'tax_haven') m *= 1.12;
    p.listing = true; p.seller = seller; p.sellerRivalId = rivalId || null; p.m = m;
    p.askingPrice = Math.max(1, Math.round(p.trueValue * m));
    p.yearsListed = 0; p.listedYear = s.year; p.offersThisYear = 0; p.counterPrice = null; p.revealed = false;
    p.comps = M.genComps(p);
    p.cues = M.cuesFor(p);
    s.listings[p.id] = p;
    return p;
  };

  M.compsNoise = function () {
    var s = PE.S(), n = B.compsNoise;
    if (St.hasTrait('surveyor') || (s.flags.surveyorUntil && s.year < s.flags.surveyorUntil)) n *= 0.5;
    if (St.hasPerk('family_solicitor')) n *= 0.5;
    return n;
  };
  M.genComps = function (p) {
    var out = [], c = D.cityById[p.cityId], noise = M.compsNoise(), ppsqm = p.trueValue / p.sqm;
    for (var i = 0; i < 3; i++) {
      var d = i === 0 ? p.district : R.pick(c.districts).name, cs = St.district(p.cityId, d);
      var rel = cs.ppsqm / St.district(p.cityId, p.district).ppsqm;
      var sqm = Math.round(p.sqm * R.range(0.8, 1.2));
      out.push({ district: d, type: p.type, sqm: sqm, pricePerSqm: Math.round(ppsqm * rel * R.range(1 - noise, 1 + noise) * 100) / 100, year: PE.S().year - R.int(0, 2) });
    }
    return out;
  };
  M.cuesFor = function (p) {
    var cues = [D.sellers[p.seller].cue], band = PE.Property.band(p);
    cues.push(band.name + ' condition');
    if (p.seller === 'landlord') cues.push('Tenanted; last year\'s rent ' + U.fmt(p.rentAnnual) + ' (' + (p.rentAnnual / p.askingPrice * 100).toFixed(1) + '% gross)');
    if (p.seller === 'developer') cues.push('Brand new');
    if (p.type === 'land') cues.push('Building plot: no rent until built on');
    return cues;
  };

  /* Refresh the board for the new year: age listings, drop stale ones, top up. */
  M.refreshBoard = function () {
    var s = PE.S(), tier = St.tier(), target = B.listingsBase + tier, bp = M.buyingPower();
    s.snappedUp = []; // pre-emptions are this year's news; the record is rebuilt as the board is topped up
    var byCity = {};
    for (var id in s.listings) {
      var l = s.listings[id];
      l.yearsListed++; l.offersThisYear = 0; l.counterPrice = null;
      PE.Property.revalue(l);
      var gone = l.yearsListed > B.listingMaxYears;
      if (!gone) {
        var bargain = l.askingPrice / l.trueValue;
        var pSold = B.listingSoldElsewhereBase + (bargain < 0.9 ? 0.35 : 0) + (bargain > 1.1 ? -0.15 : 0);
        if (s.cycle.phase === 'boom') pSold += 0.2;
        if (R.chance(pSold)) gone = true;
      }
      if (gone) {
        if (l.sellerRivalId) PE.Rivals.listingExpired(l);
        delete s.listings[id];
        continue;
      }
      l.askingPrice = Math.round(l.askingPrice * (1 - B.listingPriceDropPerYear));
      l.comps = M.genComps(l); l.cues = M.cuesFor(l);
      byCity[l.cityId] = (byCity[l.cityId] || 0) + 1;
    }
    var cities = St.unlockedCities();
    for (var i = 0; i < cities.length; i++) M.topUpCity(cities[i], byCity[cities[i]] || 0, target, bp);
    s.flags.extraDistressed = 0;
    // Chen merchant network: one true value revealed per year for free
    var all = M.listingArray(null);
    s.flags.chenRevealId = null; s.flags.allyRevealId = null;
    if (all.length && s.familyId === 'chen') { var pick = R.pick(all); pick.revealed = true; s.flags.chenRevealId = pick.id; }
    // Marriage alliance (P3.2): the ally's agents reveal one listing a year in that family's favourite city
    var allies = PE.Rivals.allies();
    if (all.length && allies.length) {
      var ally = R.pick(allies), fav = PE.Rivals.favouriteCity(ally), pool = all.filter(function (l) { return l.cityId === fav && !l.revealed; });
      if (!pool.length) pool = all.filter(function (l) { return !l.revealed; });
      if (pool.length) { var pick2 = R.pick(pool); pick2.revealed = true; s.flags.allyRevealId = pick2.id; }
    }
    s.boardYear = s.year;
  };

  /* Fill a city's board up to the target count (used on refresh and on unlock). */
  M.topUpCity = function (cid, n, target, bp) {
    var s = PE.S();
    if (n === undefined) { n = M.listingArray(cid).length; }
    if (!target) target = B.listingsBase + St.tier();
    if (!bp) bp = M.buyingPower();
    var extraD = s.flags.extraDistressed, stretchDone = false;
    while (n < target) {
      var seller = null, desired;
      if (extraD > 0) { seller = 'distressed'; extraD--; }
      if (!stretchDone && n === target - 1) { desired = bp * R.range(B.stretchDealMult[0], B.stretchDealMult[1]); stretchDone = true; }
      else if (n === 0) desired = bp * B.listingCheapMult; // one genuinely cheap way in
      else desired = bp * Math.exp(R.range(Math.log(B.listingAffordLow), Math.log(B.listingAffordHigh)));
      var nl = M.genListing(cid, desired, seller);
      if (nl.m < 0.9 && n > 0 && R.chance(B.rivalPreemptChance) && PE.Rivals.preempt(nl)) continue; // the cheap way in (n === 0) is never sniped
      n++;
    }
    s.flags.extraDistressed = extraD;
  };

  M.listingArray = function (cityId) {
    var s = PE.S(), out = [];
    for (var id in s.listings) if (!cityId || s.listings[id].cityId === cityId) out.push(s.listings[id]);
    return out;
  };

  /* ---------- Appraisal ---------- */
  M.estimate = function (l) {
    if (l.revealed) return { low: l.trueValue, high: l.trueValue, mid: l.trueValue };
    var s = PE.S(), ppsqm = 0;
    for (var i = 0; i < l.comps.length; i++) {
      var rel = St.district(l.cityId, l.district).ppsqm / St.district(l.cityId, l.comps[i].district).ppsqm;
      ppsqm += l.comps[i].pricePerSqm * rel;
    }
    ppsqm /= l.comps.length;
    var mid = Math.round(ppsqm * l.sqm), band = B.estimateBand * (M.compsNoise() / B.compsNoise);
    return { low: Math.round(mid * (1 - band)), high: Math.round(mid * (1 + band)), mid: mid };
  };
  M.appraise = function (listingId) {
    var s = PE.S(), l = s.listings[listingId];
    if (!l) return PE.fail('No such listing');
    var e = M.estimate(l), d = St.district(l.cityId, l.district);
    return PE.ok({ listingId: l.id, lowEstimate: e.low, highEstimate: e.high, estimate: e.mid, askingPrice: l.askingPrice, pricePerSqm: Math.round(l.askingPrice / l.sqm * 100) / 100,
      districtPricePerSqm: Math.round(d.ppsqm * 100) / 100, districtTrend: d.trendShown, comps: l.comps, cues: l.cues, revealed: l.revealed,
      grossYield: l.rentAnnual ? Math.round(l.rentAnnual / l.askingPrice * 1000) / 10 : 0, yearsListed: l.yearsListed, seller: l.seller, sellerName: D.sellers[l.seller].name });
  };
  M.listingView = function (l) {
    var v = PE.Property.view(l), e = M.estimate(l), d = St.district(l.cityId, l.district);
    v.lowEstimate = e.low; v.highEstimate = e.high; v.sellerName = D.sellers[l.seller].name;
    v.pricePerSqm = Math.round(l.askingPrice / l.sqm * 100) / 100; v.districtPricePerSqm = Math.round(d.ppsqm * 100) / 100; v.districtTrend = d.trendShown;
    v.stampDuty = M.stampDuty(l, l.askingPrice); v.maxLtv = PE.Finance.maxLtv('player');
    delete v.trueValue; delete v.m; delete v.equity; delete v.ltv; v.history = []; // hidden from the UI (equity/ltv/history would leak true value)
    if (l.revealed) v.trueValue = l.trueValue;
    return v;
  };
  M.listings = function (cityId) {
    var s = PE.S();
    if (cityId && !(s.cities[cityId] && s.cities[cityId].unlocked)) return PE.fail('City not unlocked');
    var arr = M.listingArray(cityId), out = [];
    for (var i = 0; i < arr.length; i++) out.push(M.listingView(arr[i]));
    out.sort(function (a, b) { return a.askingPrice - b.askingPrice; });
    var snapped = [];
    for (var j = 0; j < (s.snappedUp || []).length; j++) {
      var sp = s.snappedUp[j], rd = D.rivalById(sp.rivalId);
      if (sp.year !== s.year) continue;
      snapped.push({ id: sp.id, name: sp.name, cityId: sp.cityId, district: sp.district, typeName: (D.propertyTypes[sp.type] || {}).name || sp.type, askingPrice: sp.askingPrice, rivalId: sp.rivalId, rivalName: rd ? rd.name : 'a rival family' });
    }
    return PE.ok({ listings: out, snappedUp: snapped, boardYear: s.boardYear, revealedId: s.flags.chenRevealId, allyRevealedId: s.flags.allyRevealId || null });
  };
  M.insiderTip = function (listingId) {
    var s = PE.S(), l = s.listings[listingId];
    if (!l) return PE.fail('No such listing');
    if (s.flags.insiderUsedYear === s.year) return PE.fail('One insider tip per year');
    s.flags.insiderUsedYear = s.year; l.revealed = true;
    return PE.ok({ trueValue: l.trueValue, listingId: l.id });
  };

  /* ---------- Buying ---------- */
  M.stampDuty = function (p, price) {
    var rate = St.era().stampDuty;
    if (D.cityById[p.cityId].trait === 'foreign_buyer') rate += 0.06;
    return Math.round(price * rate);
  };
  M.cashNeeded = function (l, price, financing) {
    var principal = 0;
    if (financing && financing.ltv > 0 && !St.hasPerk('purist')) principal = Math.round(Math.min(price, l.trueValue) * U.clamp(financing.ltv, 0, PE.Finance.maxLtv('player')));
    return { duty: M.stampDuty(l, price), principal: principal, cash: price + M.stampDuty(l, price) - principal };
  };
  M.acceptFloor = function (l) {
    var s = PE.S(), f = D.sellers[l.seller].floor;
    if (St.hasTrait('negotiator')) f -= 0.05;
    f -= 0.04 * (s.reputation - 50) / 50;
    f -= 0.03 * l.yearsListed;
    var d = St.district(l.cityId, l.district);
    if (d.playerCount / d.stock > B.saturationShare) f += B.saturationPricePenalty;
    if (s.cycle.phase === 'boom') f += 0.03;
    if (s.cycle.phase === 'depression') f -= 0.05;
    return f;
  };

  M.buy = function (l, price, financing, buyerId) {
    var s = PE.S();
    delete s.listings[l.id];
    var wasRival = l.sellerRivalId, asking = l.askingPrice, seller = l.seller;
    var fields = ['listing', 'seller', 'sellerRivalId', 'm', 'askingPrice', 'yearsListed', 'listedYear', 'offersThisYear', 'counterPrice', 'revealed', 'comps', 'cues'];
    for (var i = 0; i < fields.length; i++) l[fields[i]] = undefined; // keep the object shape stable (JSON drops undefined)
    if (wasRival) PE.Rivals.listingSold(wasRival, l, price);
    l.purchasePrice = price; l.purchaseYear = s.year; l.forSale = null; l.marginCall = null;
    // Hidden defects: cheap sellers hide problems; a Surveyor halves the chance.
    var defect = null;
    if ((seller === 'estate' || seller === 'distressed' || seller === 'auction') && l.type !== 'land') {
      var pd = B.hiddenDefectChance * ((buyerId === 'player' && St.hasTrait('surveyor')) ? 0.5 : 1);
      if (R.chance(pd)) { defect = R.int(B.hiddenDefectRange[0], B.hiddenDefectRange[1]); l.condition = U.clamp(l.condition - defect, 0, 100); PE.Property.revalue(l); }
    }
    if (buyerId === 'player') {
      var need = M.cashNeeded(l, price, financing);
      s.cash -= need.cash;
      l.mortgage = need.principal > 0 ? PE.Finance.makeMortgage('player', need.principal, financing.type, financing.fixed && St.era().fixedRate) : null;
      St.setOwner(l, 'player');
      s.stats.bought++;
      if (price < asking) s.stats.belowAsk++;
      if (price <= l.trueValue * 0.75) s.stats.steals++;
      if (!s.stats.firstBuyYear[s.stats.bought]) s.stats.firstBuyYear[s.stats.bought] = s.year;
      s.reputation = U.clamp(s.reputation + (St.hasTrait('charmer') ? 0.6 : 0.3), 0, 100);
    } else {
      PE.Rivals.acquire(buyerId.replace('rival:', ''), l, price);
    }
    var d = St.district(l.cityId, l.district); d.buysThisYear++;
    if (l.ownerId === 'player') PE.Property.initTenancy(l);
    return { property: l, price: price, seller: seller, defect: defect };
  };

  M.makeOffer = function (listingId, price, financing) {
    var s = PE.S(), l = s.listings[listingId];
    if (!l) return PE.fail('No such listing');
    if (!s.cities[l.cityId].unlocked) return PE.fail('City not unlocked');
    if (s.auction) return PE.fail('Finish the current auction first');
    price = Math.round(+price || 0);
    if (price <= 0) return PE.fail('Offer must be positive');
    financing = financing && financing.ltv ? { ltv: +financing.ltv, type: financing.type || 'io', fixed: !!financing.fixed } : null;
    var need = M.cashNeeded(l, price, financing);
    if (s.cash < need.cash) return PE.fail('You need ' + U.fmt(need.cash) + ' in cash for this offer (have ' + U.fmt(s.cash) + ')', { cashNeeded: need.cash });
    if (l.seller === 'auction') return M.startAuction(l, Math.max(price, l.askingPrice), financing, true);
    var accepting = l.counterPrice && price >= l.counterPrice;
    if (!accepting && l.offersThisYear >= B.offersPerListingPerYear) return PE.fail('The seller will not entertain another offer this year');
    l.offersThisYear++;
    var r = price / l.askingPrice, floor = M.acceptFloor(l), accepted = accepting;
    if (!accepted) {
      if (r >= floor + 0.04) accepted = true;
      else if (r >= floor - 0.06) accepted = R.chance((r - (floor - 0.06)) / 0.10);
    }
    if (accepted) {
      var bidders = PE.Rivals.contest(l, price);
      if (bidders.length) return M.startAuction(l, price, financing, false, bidders);
      var res = M.buy(l, price, financing, 'player');
      if (accepting) s.stats.countersClosed++;
      return PE.ok({ outcome: 'accepted', price: price, property: PE.Property.view(res.property), defect: res.defect, message: 'Offer of ' + U.fmt(price) + ' accepted for ' + res.property.name + '.' + (res.defect ? ' The survey finds rot: condition −' + res.defect + '.' : '') });
    }
    if (r >= floor - B.counterWindow) {
      var counter = Math.round(l.askingPrice * U.clamp((floor + r) / 2 + 0.02, r + 0.03, 1.0));
      l.counterPrice = counter;
      return PE.ok({ outcome: 'countered', counterPrice: counter, message: 'The seller counters at ' + U.fmt(counter) + '.' });
    }
    St.rep(-B.lowballRepHit);
    return PE.ok({ outcome: 'rejected', message: 'The seller is insulted by ' + U.fmt(price) + ' and shows you the door.' });
  };

  /* ---------- Auctions ---------- */
  M.startAuction = function (l, openingBid, financing, isAuctionSale, bidders) {
    var s = PE.S();
    if (!bidders) bidders = PE.Rivals.contest(l, openingBid, isAuctionSale ? 0.85 : null);
    var a = { id: St.nextId('a'), listingId: l.id, round: 0, currentBid: openingBid, leader: 'player', playerBid: openingBid, financing: financing, bidders: bidders, startedYear: s.year, log: [] };
    s.auction = a;
    if (!bidders.length) {
      // nobody turned up
      var res = M.buy(l, openingBid, financing, 'player'); s.auction = null; s.stats.auctionsWon++;
      return PE.ok({ outcome: 'accepted', price: openingBid, property: PE.Property.view(res.property), message: 'No rival bid. ' + res.property.name + ' is yours for ' + U.fmt(openingBid) + '.' });
    }
    // rivals open against the player's price
    var resp = M.rivalResponse(a, openingBid);
    if (!resp) { var r2 = M.buy(l, openingBid, financing, 'player'); s.auction = null; s.stats.auctionsWon++; return PE.ok({ outcome: 'accepted', price: openingBid, property: PE.Property.view(r2.property), message: 'Rivals looked, but none bid. Yours for ' + U.fmt(openingBid) + '.' }); }
    return PE.ok({ outcome: 'auction', auction: M.auctionView(a), taunt: resp.taunt, message: D.rivalById(resp.rivalId).name + ' bid ' + U.fmt(resp.bid) + ' against you. Bid again or withdraw.' });
  };
  M.rivalResponse = function (a, playerBid) {
    var best = null;
    for (var i = 0; i < a.bidders.length; i++) if (a.bidders[i].maxBid >= playerBid * 1.02 && (!best || a.bidders[i].maxBid > best.maxBid)) best = a.bidders[i];
    if (!best) return null;
    var bid = Math.min(best.maxBid, Math.round(playerBid * B.auctionRivalStep));
    a.currentBid = bid; a.leader = 'rival:' + best.id; a.log.push({ who: best.id, bid: bid, taunt: PE.Rivals.taunt(best.id, 'outbidAny') });
    return { rivalId: best.id, bid: bid, taunt: a.log[a.log.length - 1].taunt };
  };
  /* round is 1-based: the round the player is about to bid in (1..maxRounds); bidsMade counts bids already placed. */
  M.auctionView = function (a) {
    var s = PE.S(), l = s.listings[a.listingId];
    return { id: a.id, listingId: a.listingId, name: l ? l.name : '', round: Math.min(a.round + 1, B.auctionRounds), bidsMade: a.round, maxRounds: B.auctionRounds, currentBid: a.currentBid, leader: a.leader, leaderName: a.leader === 'player' ? 'You' : D.rivalById(a.leader.replace('rival:', '')).name, bidders: a.bidders.map(function (b) { return D.rivalById(b.id).name; }), log: a.log };
  };
  M.bid = function (auctionId, price) {
    var s = PE.S(), a = s.auction;
    if (!a || a.id !== auctionId) return PE.fail('No such auction');
    var l = s.listings[a.listingId]; if (!l) { s.auction = null; return PE.fail('Listing gone'); }
    price = Math.round(+price || 0);
    if (price <= a.currentBid) return PE.fail('Bid must beat the current bid of ' + U.fmt(a.currentBid));
    var need = M.cashNeeded(l, price, a.financing);
    if (s.cash < need.cash) return PE.fail('You need ' + U.fmt(need.cash) + ' in cash to bid that');
    a.round++; a.playerBid = price; a.currentBid = price; a.leader = 'player'; a.log.push({ who: 'player', bid: price });
    var resp = M.rivalResponse(a, price);
    if (!resp) {
      var res = M.buy(l, price, a.financing, 'player'); s.auction = null; s.stats.auctionsWon++;
      M.outbidRivals(a);
      return PE.ok({ outcome: 'won', price: price, round: a.round, currentBid: price, property: PE.Property.view(res.property), taunt: a.bidders && a.bidders.length ? PE.Rivals.taunt(a.bidders[0].id, 'lose') : '', message: 'Going, going, gone. ' + res.property.name + ' for ' + U.fmt(price) + '.' });
    }
    if (a.round >= B.auctionRounds) {
      M.buy(l, resp.bid, null, 'rival:' + resp.rivalId); s.auction = null;
      var rv = s.rivals[resp.rivalId]; rv.lastAction = 'Outbid you at auction for ' + l.name;
      PE.Rivals.adjustRelation(resp.rivalId, B.relationOutbidBy);
      return PE.ok({ outcome: 'outbid', round: a.round, currentBid: resp.bid, winner: resp.rivalId, taunt: PE.Rivals.taunt(resp.rivalId, 'win'), message: D.rivalById(resp.rivalId).name + ' takes it at ' + U.fmt(resp.bid) + '.' });
    }
    return PE.ok({ outcome: 'continue', round: a.round, currentBid: resp.bid, auction: M.auctionView(a), taunt: PE.Rivals.taunt(resp.rivalId, 'outbidYou'), message: D.rivalById(resp.rivalId).name + ' raises to ' + U.fmt(resp.bid) + '.' });
  };
  /* The player won against these bidders: they resent it (P3.2 relation driver). */
  M.outbidRivals = function (a) {
    var s = PE.S();
    for (var i = 0; i < a.bidders.length; i++) {
      var id = a.bidders[i].id; if (!s.rivals[id]) continue;
      PE.Rivals.adjustRelation(id, B.relationOutbid);
      s.stats.outbidRivals[id] = (s.stats.outbidRivals[id] || 0) + 1;
    }
  };
  M.withdraw = function (auctionId) {
    var s = PE.S(), a = s.auction;
    if (!a || (auctionId && a.id !== auctionId)) return PE.fail('No such auction');
    var l = s.listings[a.listingId];
    s.auction = null;
    if (l && a.leader !== 'player') { M.buy(l, a.currentBid, null, a.leader); var wid = a.leader.replace('rival:', ''); return PE.ok({ outcome: 'withdrawn', winner: a.leader, taunt: PE.Rivals.taunt(wid, 'win'), message: 'You withdraw; ' + D.rivalById(wid).name + ' takes ' + l.name + '.' }); }
    return PE.ok({ outcome: 'withdrawn', message: 'You withdraw.' });
  };

  /* ---------- Selling ---------- */
  M.saleMood = function () { return B.cycleSaleMood[PE.S().cycle.phase]; };
  /* Quick-sale factor moves with the cycle (ENG-B3): dumping a building in a crash hurts. */
  M.quickSaleFactor = function () { var s = PE.S(), t = B.quickSaleFactorByPhase; return (t && t[s.cycle.phase]) || B.quickSaleFactor; };
  M.saleQuote = function (p, factor) {
    var s = PE.S(), era = St.era(), price = Math.round(p.trueValue * M.saleMood() * (factor || 1));
    var fees = Math.round(price * B.agentFee), gain = price - (p.purchasePrice || 0);
    var tax = (p.purchaseYear !== null && s.year - p.purchaseYear < B.cgtYears && gain > 0) ? Math.round(gain * era.cgt) : 0;
    var debt = p.mortgage ? p.mortgage.principal : 0;
    return { price: price, fees: fees, tax: tax, debtRepaid: debt, cashGained: price - fees - tax - debt };
  };
  M.completeSale = function (p, q, toOwner, report) {
    var s = PE.S();
    s.cash += q.cashGained; s.stats.sold++;
    if (p.purchasePrice && q.price >= p.purchasePrice * 1.3) s.stats.flips++;
    for (var i = s.offers.length - 1; i >= 0; i--) if (s.offers[i].propertyId === p.id) s.offers.splice(i, 1);
    if (toOwner) { St.setOwner(p, toOwner); p.mortgage = null; p.purchasePrice = q.price; p.purchaseYear = s.year; p.forSale = null; }
    else St.setOwner(p, null);
    if (report) report.deals.push({ kind: 'sale', propertyId: p.id, name: p.name, price: q.price, cashGained: q.cashGained, text: 'Sold ' + p.name + ' for ' + U.fmt(q.price) + '.' });
  };
  M.sell = function (propertyId, mode) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (p.renovation) return PE.fail('Finish the works first');
    mode = mode || 'market';
    if (mode === 'cancel') { p.forSale = null; return PE.ok({ message: 'Withdrawn from sale.' }); }
    if (mode === 'quick') {
      var q = M.saleQuote(p, M.quickSaleFactor());
      M.completeSale(p, q, null, null);
      return PE.ok({ price: q.price, fees: q.fees, tax: q.tax, debtRepaid: q.debtRepaid, cashGained: q.cashGained, sold: true, message: 'Quick sale: ' + p.name + ' gone for ' + U.fmt(q.price) + '.' });
    }
    var q2 = M.saleQuote(p, 1);
    p.forSale = { year: s.year };
    return PE.ok({ price: q2.price, fees: q2.fees, tax: q2.tax, debtRepaid: q2.debtRepaid, cashGained: q2.cashGained, sold: false, pending: true, message: p.name + ' is on the market at about ' + U.fmt(q2.price) + '; expect a buyer by year end.' });
  };
  /* At endYear: market sales complete with a probability that depends on the cycle. */
  M.resolveSales = function (report) {
    var s = PE.S(), props = St.playerProps().slice();
    for (var i = 0; i < props.length; i++) {
      var p = props[i]; if (!p.forSale) continue;
      var pSell = { boom: 0.95, growth: 0.85, stagnation: 0.75, recession: 0.6, depression: 0.45 }[s.cycle.phase];
      if (R.chance(pSell)) { var q = M.saleQuote(p, R.range(0.97, 1.03)); M.completeSale(p, q, null, report); }
      else report.deals.push({ kind: 'unsold', propertyId: p.id, name: p.name, text: 'No buyer for ' + p.name + ' this year.' });
    }
  };

  /* ---------- Offers on the player's properties ---------- */
  M.offersOnMyProperties = function () {
    var s = PE.S(), out = [];
    for (var i = 0; i < s.offers.length; i++) {
      var o = s.offers[i], p = s.properties[o.propertyId]; if (!p) continue;
      out.push({ id: o.id, propertyId: o.propertyId, name: p.name, rivalId: o.rivalId, rivalName: D.rivalById(o.rivalId).name, price: o.price, premium: Math.round((o.price / p.trueValue - 1) * 100), year: o.year, quote: M.saleQuote(p, o.price / (p.trueValue * M.saleMood())) });
    }
    return PE.ok({ offers: out });
  };
  M.respondToOffer = function (offerId, accept) {
    var s = PE.S(), idx = -1;
    for (var i = 0; i < s.offers.length; i++) if (s.offers[i].id === offerId) idx = i;
    if (idx < 0) return PE.fail('No such offer');
    var o = s.offers[idx], p = s.properties[o.propertyId], rv = s.rivals[o.rivalId];
    s.offers.splice(idx, 1);
    if (!accept) { PE.Rivals.adjustRelation(o.rivalId, B.relationDeclined, 'declined offer'); return PE.ok({ accepted: false, message: 'Offer declined.' }); }
    if (!p || p.ownerId !== 'player') return PE.fail('Property no longer yours');
    if (p.renovation) return PE.fail('Finish the works first');
    var q = M.saleQuote(p, o.price / (p.trueValue * M.saleMood()));
    q.price = o.price;
    M.completeSale(p, q, 'rival:' + o.rivalId, null);
    PE.Rivals.paid(o.rivalId, o.price, p);
    PE.Rivals.adjustRelation(o.rivalId, B.relationSoldTo, 'accepted offer');
    return PE.ok({ accepted: true, price: q.price, fees: q.fees, tax: q.tax, cashGained: q.cashGained, message: 'Sold ' + p.name + ' to ' + D.rivalById(o.rivalId).name + ' for ' + U.fmt(q.price) + '.' });
  };

  /* ---------- District price drift (bible §3.2, §6.3, §6.4) ---------- */
  M.driftPrices = function (report) {
    var s = PE.S(), era = St.era(), cyc = D.cycles[s.cycle.phase];
    for (var cid in s.cities) {
      var c = D.cityById[cid], ds = s.cities[cid].districts, cityMult = c.trait === 'boom_bust' ? 2 : 1, sumG = 0, n = 0;
      var avgP = 0, dn0, nD = 0;
      if (c.trait === 'redevelopment') { for (dn0 in ds) { avgP += ds[dn0].ppsqm; nD++; } avgP = nD ? avgP / nD : 0; } // the city's average: below it is the "derelict/poor" stock
      for (var dn in ds) {
        var d = ds[dn];
        var g = c.growth + era.drift + cyc.value * cityMult + d.momentum + R.range(-B.districtNoise, B.districtNoise) + B.pressurePerBuy * d.buysThisYear;
        if (c.trait === 'foreign_buyer') g += B.foreignBuyerDrift;
        if (c.trait === 'tech_hub' && St.eraIdx() >= 4) g += B.techHubDrift;
        if (c.trait === 'redevelopment' && d.ppsqm < avgP) g += B.redevelopmentDrift;
        d.ppsqm = Math.max(0.5, d.ppsqm * (1 + g));
        d.buysThisYear = 0;
        d.momentum += R.normal(0, B.momentumNoise) - B.momentumMeanReversion * d.momentum;
        if (d.momentumUntil && s.year < d.momentumUntil) d.momentum = Math.max(d.momentum, 0.02);
        d.momentum = U.clamp(d.momentum, -0.025, 0.03);
        sumG += g; n++;
      }
      if (report && s.cities[cid].unlocked) report.valuesByCity[cid] = Math.round(sumG / n * 1000) / 10;
    }
    s.priceIndex *= 1 + 0.028 + era.drift + cyc.value * 0.5;
    St.refreshTrends();
  };

  PE.Market = M;
})(typeof window !== 'undefined' ? window : global);
