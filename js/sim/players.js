/* Scripted players for the balance harness (bible §14).
   competent: buys best-value deals it can finance with a safety reserve, renovates
   when the uplift beats the cost, refinances when LTV < 50% (BRRRR), sells in booms,
   hires managers, expands cities, answers margin calls.
   naive: buys the cheapest listing at asking with cash only, never borrows, never
   sells, patches only what has become unrentable. */
module.exports = function (PE) {
  var D = PE.Data, St = PE.State, B = PE.Data.balance;

  function resolveEvents(mode) {
    var s = PE.S(), guard = 0;
    while (s.events.pending.length && guard++ < 10) {
      var ev = PE.Events.pending().event, idx = 0;
      if (mode === 'naive') idx = ev.choices.length - 1;
      else {
        // competent: prefer safety when thin, otherwise take the active option; never the gamble when cash < 20% NW
        var nw = Math.max(1, St.netWorth('player')), thin = s.cash < 0.15 * nw;
        var labels = ev.choices.map(function (c) { return c.label.toLowerCase(); });
        idx = 0;
        for (var i = 0; i < labels.length; i++) {
          var l = labels[i];
          if (thin && (l.indexOf('pay') >= 0 || l.indexOf('invest') >= 0 || l.indexOf('buy') >= 0 || l.indexOf('give') >= 0 || l.indexOf('donate') >= 0)) continue;
          if (l.indexOf('gamble') >= 0 && s.cash < 0.3 * nw) continue;
          if (ev.id === 'rival_bankrupt' && i === 0 && s.cash < 0.5 * nw) continue;
          idx = i; break;
        }
      }
      PE.Events.resolve(ev.uid, idx);
    }
  }

  function reserve() {
    var s = PE.S();
    return Math.max(St.annualDebtService('player') * 1.2, St.debt('player') * 0.06, 15 * s.priceIndex);
  }

  function handleDanger() {
    var s = PE.S(), props = St.playerProps().slice(), i;
    // margin calls: raise cash (sell the called building if possible, else others), then repay
    var called = props.filter(function (x) { return x.marginCall; });
    for (i = 0; i < called.length; i++) {
      var p = called[i], need = p.marginCall.shortfall + 5;
      if (s.cash < need && !p.renovation && PE.Market.saleQuote(p, B.quickSaleFactor).cashGained >= 0) { PE.Market.sell(p.id, 'quick'); continue; }
      var guard2 = 0;
      while (s.cash < need && guard2++ < 10) {
        var others = St.playerProps().filter(function (x) { return !x.marginCall && !x.renovation && PE.Market.saleQuote(x, B.quickSaleFactor).cashGained > 0; }).sort(function (a, b) { return PE.Market.saleQuote(b, B.quickSaleFactor).cashGained - PE.Market.saleQuote(a, B.quickSaleFactor).cashGained; });
        if (!others.length) break;
        PE.Market.sell(others[0].id, 'quick');
      }
      if (s.cash >= need) PE.Finance.repay(p.id, need);
    }
    // negative cash: sell the lowest-equity building(s)
    var guard = 0;
    while (s.cash < 0 && St.propertyCount('player') > 0 && guard++ < 20) {
      var ps = St.playerProps().filter(function (x) { return !x.renovation; }).sort(function (a, b) { return (a.trueValue - (a.mortgage ? a.mortgage.principal : 0)) - (b.trueValue - (b.mortgage ? b.mortgage.principal : 0)); });
      if (!ps.length) break;
      var best = ps.filter(function (x) { return PE.Market.saleQuote(x, B.quickSaleFactor).cashGained > 0; });
      if (!best.length) break;
      PE.Market.sell(best[best.length - 1].id, 'quick');
    }
  }

  function upliftFor(p, tier) {
    var t = D.renovation[tier], cur = D.conditionBand(p.condition).valueFactor;
    var after = tier === 'rebuild' ? 1.12 : D.conditionBand(Math.min(100, p.condition + t.gain)).valueFactor;
    return (after / cur - 1 + t.uplift * PE.Property.UPLIFT_TO_QUALITY) * p.trueValue;
  }

  var competent = {
    name: 'competent',
    play: function () {
      var s = PE.S(), i, p;
      resolveEvents('competent');
      handleDanger();
      // rival offers
      var offers = PE.Market.offersOnMyProperties().offers;
      for (i = 0; i < offers.length; i++) if (offers[i].premium >= 25) PE.Market.respondToOffer(offers[i].id, true);
      // sell in booms
      if (s.cycle.phase === 'boom') {
        var sold = 0, ps = St.playerProps().slice();
        for (i = 0; i < ps.length && sold < 2; i++) { p = ps[i]; if (!p.renovation && p.purchasePrice && s.year - p.purchaseYear >= 3 && p.trueValue >= p.purchasePrice * 1.4) { PE.Market.sell(p.id, 'market'); sold++; } }
      }
      // renovate
      var props = St.playerProps().slice().sort(function (a, b) { return a.condition - b.condition; });
      for (i = 0; i < props.length; i++) {
        p = props[i]; if (p.renovation || p.forSale) continue;
        var tiers = p.type === 'land' ? ['rebuild'] : ['refurbish', 'patch'];
        for (var k = 0; k < tiers.length; k++) {
          var tier = tiers[k], cost = PE.Property.renovationCost(p, tier), up = upliftFor(p, tier);
          var lostRent = D.renovation[tier].years * p.rentAnnual * p.occupancy;
          if (up > (cost + lostRent) * 1.3 && s.cash - cost >= reserve()) { if (PE.Property.renovate(p.id, tier).ok) break; }
        }
      }
      // refinance when LTV < 50% (BRRRR)
      props = St.playerProps();
      for (i = 0; i < props.length; i++) {
        p = props[i]; if (p.renovation) continue;
        var ltv = p.mortgage ? p.mortgage.principal / p.trueValue : 0;
        if (ltv < 0.5 && (!p.mortgage || s.year - p.mortgage.lastRefi >= B.refinanceEveryYears) && s.cycle.phase !== 'depression') {
          var target = Math.min(0.62, PE.Finance.maxLtv('player') - 0.06);
          if (p.mortgage) PE.Finance.refinance(p.id, target); else PE.Finance.takeMortgage(p.id, target, 'io');
        }
      }
      // managers
      var cap = PE.Property.capacitySummary();
      if (cap.none > 0) {
        var counts = {}, bestC = null, pp = St.playerProps();
        for (i = 0; i < pp.length; i++) { if (s.cities[pp[i].cityId].managerId) continue; counts[pp[i].cityId] = (counts[pp[i].cityId] || 0) + 1; if (!bestC || counts[pp[i].cityId] > counts[bestC]) bestC = pp[i].cityId; }
        if (bestC) { var ms = PE.Property.availableManagers().managers; if (ms.length) PE.Property.hireManager(bestC, ms[ms.length - 1].id); }
      }
      // expand
      var cheapest = PE.Cities.cheapestLocked();
      if (cheapest && St.propertyCount('player') >= 3 && s.cash >= cheapest.cost * 2.5 && s.reputation >= cheapest.repRequired) PE.Cities.unlock(cheapest.id);
      // buy
      var bought = 0, ls = PE.Market.listingArray(null).filter(function (l) { return s.cities[l.cityId].unlocked; }).map(function (l) { var e = PE.Market.estimate(l); return { l: l, est: e.mid, ratio: l.askingPrice / e.mid }; });
      ls.sort(function (a, b) { return a.ratio - b.ratio; });
      var maxLtv = PE.Finance.maxLtv('player'), fin = { ltv: Math.max(0, maxLtv - 0.05), type: 'io' };
      for (i = 0; i < ls.length && bought < 2; i++) {
        var c = ls[i], l = c.l; if (!s.listings[l.id]) continue;
        if (l.type === 'land' && s.cash < c.est * 3) continue;
        if (c.ratio > 0.93 && l.seller !== 'auction') continue;
        var maxPay = Math.round(c.est * 0.92), offer = Math.min(l.askingPrice, Math.round(c.est * 0.86));
        if (l.seller === 'auction') offer = l.askingPrice;
        var need = PE.Market.cashNeeded(l, maxPay, fin).cash;
        if (s.cash - need < reserve()) continue;
        var r = PE.Market.makeOffer(l.id, offer, fin);
        if (!r.ok) continue;
        if (r.outcome === 'countered' && r.counterPrice <= maxPay) r = PE.Market.makeOffer(l.id, r.counterPrice, fin);
        if (r.outcome === 'auction' || r.outcome === 'continue') {
          var guard = 0;
          while (r.ok && (r.outcome === 'auction' || r.outcome === 'continue') && guard++ < 5) {
            var cur = r.auction ? r.auction.currentBid : r.currentBid, next = Math.round(cur * 1.04);
            if (next > maxPay) { PE.Market.withdraw(s.auction ? s.auction.id : null); break; }
            r = PE.Market.bid(s.auction.id, next);
          }
        }
        if (r.ok && (r.outcome === 'accepted' || r.outcome === 'won')) bought++;
      }
      // trust when wealthy
      if (!s.dynasty.trust && St.netWorth('player') > 40 * s.startCash * s.priceIndex) PE.Dynasty.setupTrust();
      // rent: lean into booms, protect tenants in slumps
      props = St.playerProps();
      var setting = s.cycle.phase === 'boom' ? 1.1 : (s.cycle.phase === 'depression' || s.cycle.phase === 'recession') ? 0.95 : 1.0;
      for (i = 0; i < props.length; i++) if (props[i].rentSetting !== setting && !props[i].lease) PE.Property.setRent(props[i].id, setting);
    }
  };

  var naive = {
    name: 'naive',
    play: function () {
      var s = PE.S(), i;
      resolveEvents('naive');
      handleDanger();
      // patch only what has become unrentable
      var props = St.playerProps();
      for (i = 0; i < props.length; i++) { var p = props[i]; if (!p.renovation && p.type !== 'land' && p.condition < 25) { var cost = PE.Property.renovationCost(p, 'patch'); if (s.cash > cost * 2) PE.Property.renovate(p.id, 'patch'); } }
      // buy the cheapest listing with cash
      var ls = PE.Market.listingArray(null).filter(function (l) { return s.cities[l.cityId].unlocked && l.seller !== 'auction'; }).sort(function (a, b) { return a.askingPrice - b.askingPrice; });
      if (ls.length) {
        var l = ls[0], need = PE.Market.cashNeeded(l, l.askingPrice, null).cash;
        if (s.cash - need >= 10 * s.priceIndex) PE.Market.makeOffer(l.id, l.askingPrice, null);
      }
      var cap = PE.Property.capacitySummary();
      if (cap.none > 0) { var ms = PE.Property.availableManagers().managers; if (ms.length) PE.Property.hireManager('london', ms[0].id); }
    }
  };

  return { competent: competent, naive: naive, resolveEvents: resolveEvents };
};
