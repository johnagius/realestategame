/* PE.Finance — per-property mortgages (IO or 25-year amortising, fixed from the
   Boom era), rate quotes from base rate + lender premium, refinance (the BRRRR
   loop), repayment, covenants/margin calls, savings interest and the base-rate
   path by era and cycle. The fail state starts here. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var F = {};

  F.lenderName = function () {
    var e = St.era().id, s = PE.S();
    var rs = s.rivals.rothschild;
    if (rs && !rs.bankrupt && rs.relation >= 65) return 'N M Rothschild & Sons';
    return { victorian: 'Coutts & Co', gilded: 'Barings Bank', crisis: 'Midland Bank', boom: 'Abbey National', modern: 'Halifax', digital: 'HSBC' }[e];
  };

  /* Max LTV: 70%, 75% with Banker trait or reputation > 70, 60% in the Crisis era (bible §4). */
  F.maxLtv = function (ownerId) {
    var s = PE.S(), era = St.era(), ltv = era.maxLtv, cap = 0.75;
    if (ownerId === 'player' || !ownerId) {
      if (St.hasPerk('purist')) return 0;
      if (St.hasTrait('banker') || s.reputation > B.repLtvThreshold) ltv += B.bankerLtvBonus;
      if (St.hasPerk('old_money')) { ltv += B.perkOldMoneyLtv; cap += B.perkOldMoneyLtv; }
    }
    return Math.min(cap, ltv);
  };

  /* Lender premium 1–2% rises with the borrower's portfolio LTV. */
  F.premium = function (ownerId) {
    var ltv = St.ltv(ownerId || 'player');
    return B.lenderPremiumMin + (B.lenderPremiumMax - B.lenderPremiumMin) * U.clamp(ltv / B.maxLtv, 0, 1);
  };

  F.rateFor = function (ownerId, type, fixed) {
    var s = PE.S(), r = s.baseRate + F.premium(ownerId);
    if (type === 'amort') r -= B.amortDiscount;
    if (fixed) r += B.fixedPremium;
    if ((ownerId === 'player' || !ownerId)) {
      if (St.hasTrait('banker')) r -= 0.005;
      if (F.lenderName() === 'N M Rothschild & Sons') r -= 0.0025;
      if (s.reputation < 30) r += 0.01;
    }
    return Math.round(Math.max(0.005, r) * 10000) / 10000;
  };

  F.annualPayment = function (m) {
    if (!m || m.principal <= 0) return 0;
    if (m.type === 'amort') {
      var n = Math.max(1, m.yearsLeft), r = m.rate;
      if (r <= 0) return Math.round(m.principal / n);
      return Math.round(m.principal * r / (1 - Math.pow(1 + r, -n)));
    }
    return Math.round(m.principal * m.rate);
  };

  F.resolveAsset = function (id) {
    var s = PE.S();
    if (s.properties[id]) return { prop: s.properties[id], value: s.properties[id].trueValue, isListing: false };
    if (s.listings[id]) return { prop: s.listings[id], value: s.listings[id].askingPrice, isListing: true };
    return null;
  };

  /* Quote on a property you own (against value) or a listing (against asking price, or against `price` when given).
     With a price on a listing the payload is exact for that offer: the lender advances ltv × min(price, value) just as
     makeOffer does, and `duty` / `cashNeeded` are what the offer will cost. The value itself is never revealed: when the
     lender caps the advance the message quotes a figure derived from the estimate band midpoint, rounded to £10. */
  F.mortgageQuote = function (id, ltv, type, fixed, price) {
    var a = F.resolveAsset(id);
    if (!a) return PE.fail('Unknown property');
    type = type === 'amort' ? 'amort' : 'io';
    fixed = !!fixed && St.era().fixedRate;
    var max = F.maxLtv('player'), purist = St.hasPerk('purist');
    ltv = U.clamp(+ltv || max, 0, max);
    var basis = a.value, priced = false, capped = false, message = '';
    price = Math.round(+price || 0);
    if (a.isListing && price > 0) {
      priced = true; basis = Math.min(price, a.prop.trueValue);
      if (basis < price && ltv > 0) {
        capped = true;
        var est = PE.Market.estimate(a.prop), advance = Math.round(est.mid * ltv / 10) * 10;
        message = 'Lender will only advance ' + U.fmt(advance) + ' on this property';
      }
    }
    var principal = Math.round(basis * ltv);
    var m = { principal: principal, rate: F.rateFor('player', type, fixed), type: type, yearsLeft: type === 'amort' ? B.amortYears : 0, fixed: fixed, lender: F.lenderName() };
    var out = { principal: principal, rate: m.rate, annualPayment: F.annualPayment(m), lender: m.lender, type: type, fixed: fixed, ltv: ltv, maxLtv: max, fixedAvailable: St.era().fixedRate, purist: purist, message: purist ? 'Purist: no mortgages this run' : message };
    if (priced) { out.price = price; out.duty = PE.Market.stampDuty(a.prop, price); out.cashNeeded = price + out.duty - principal; out.lenderCapped = capped; }
    else if (a.isListing) { out.price = a.prop.askingPrice; out.duty = PE.Market.stampDuty(a.prop, a.prop.askingPrice); out.cashNeeded = a.prop.askingPrice + out.duty - principal; out.lenderCapped = false; }
    return PE.ok(out);
  };

  F.makeMortgage = function (ownerId, principal, type, fixed) {
    var s = PE.S();
    type = type === 'amort' ? 'amort' : 'io';
    return { principal: Math.round(principal), rate: F.rateFor(ownerId, type, fixed), type: type, yearsLeft: type === 'amort' ? B.amortYears : 0, fixed: !!fixed, lender: ownerId === 'player' ? F.lenderName() : 'Private bank', since: s.year, lastRefi: s.year };
  };

  F.takeMortgage = function (propertyId, ltv, type, fixed) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (p.mortgage && p.mortgage.principal > 0) return PE.fail('Already mortgaged; use refinance');
    if (St.hasPerk('purist')) return PE.fail('Purist: this dynasty does not borrow');
    var q = F.mortgageQuote(propertyId, ltv, type, fixed);
    if (!q.ok) return q;
    if (q.principal <= 0) return PE.fail('Nothing to borrow');
    p.mortgage = F.makeMortgage('player', q.principal, q.type, q.fixed);
    s.cash += q.principal;
    if (p.mortgage.lender === 'N M Rothschild & Sons') s.stats.rothschildLoans++;
    return PE.ok({ message: 'Borrowed ' + U.fmt(q.principal) + ' at ' + (q.rate * 100).toFixed(2) + '%.', mortgage: p.mortgage, cash: s.cash });
  };

  /* Refinance: once per property per 3 years, re-borrow up to 70% of current value (cash-out). */
  F.refinance = function (propertyId, ltv, type, fixed) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (p.renovation) return PE.fail('Lenders will not refinance a building site');
    if (St.hasPerk('purist') && (+ltv || 0) > 0) return PE.fail('Purist: this dynasty does not borrow');
    if (p.mortgage && s.year - (p.mortgage.lastRefi || p.mortgage.since) < B.refinanceEveryYears) return PE.fail('Refinance possible again in ' + (B.refinanceEveryYears - (s.year - (p.mortgage.lastRefi || p.mortgage.since))) + ' year(s)');
    var max = Math.min(B.refinanceLtv, F.maxLtv('player'));
    ltv = U.clamp(+ltv || max, 0, max);
    var newPrincipal = Math.round(p.trueValue * ltv), old = p.mortgage ? p.mortgage.principal : 0, delta = newPrincipal - old;
    if (delta < 0 && s.cash < -delta) return PE.fail('Not enough cash to reduce the loan');
    type = type || (p.mortgage ? p.mortgage.type : 'io');
    p.mortgage = F.makeMortgage('player', newPrincipal, type, fixed);
    if (p.mortgage.principal <= 0) p.mortgage = null;
    s.cash += delta;
    s.stats.refinances++;
    if (p.mortgage && p.mortgage.lender === 'N M Rothschild & Sons' && delta > 0) s.stats.rothschildLoans++;
    if (delta > 0 && p.purchasePrice && p.lastRenovated && newPrincipal >= p.purchasePrice * 0.95) s.stats.brrrr++;
    if (p.marginCall && (p.mortgage ? p.mortgage.principal / p.trueValue : 0) <= B.covenantLtv) p.marginCall = null;
    return PE.ok({ message: (delta >= 0 ? 'Cash out ' + U.fmt(delta) : 'Loan reduced by ' + U.fmt(-delta)) + ' at ' + (p.mortgage ? (p.mortgage.rate * 100).toFixed(2) : '0') + '%.', mortgage: p.mortgage, cashDelta: delta, cash: s.cash });
  };

  F.repay = function (propertyId, amount) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (!p.mortgage) return PE.fail('No mortgage on this property');
    amount = Math.min(Math.round(+amount || 0), p.mortgage.principal);
    if (amount <= 0) return PE.fail('Nothing to repay');
    if (s.cash < amount) return PE.fail('Not enough cash');
    s.cash -= amount; p.mortgage.principal -= amount;
    if (p.mortgage.principal <= 0) p.mortgage = null;
    var cleared = false;
    if (p.marginCall && (p.mortgage ? p.mortgage.principal / p.trueValue : 0) <= B.covenantLtv) { p.marginCall = null; cleared = true; s.stats.marginCallsCleared++; }
    return PE.ok({ message: 'Repaid ' + U.fmt(amount) + (cleared ? '. Covenant restored.' : '.'), mortgage: p.mortgage, marginCallCleared: cleared, cash: s.cash });
  };

  /* Yearly debt service for an owner; returns the cash paid. Variable loans re-price yearly. */
  F.service = function (ownerId) {
    var props = St.ownedProps(ownerId), total = 0, rates = null;
    for (var i = 0; i < props.length; i++) {
      var m = props[i].mortgage; if (!m || m.principal <= 0) continue;
      if (!rates) rates = { io: F.rateFor(ownerId, 'io', false), amort: F.rateFor(ownerId, 'amort', false) };
      if (!m.fixed) m.rate = rates[m.type] || rates.io;
      var pay = F.annualPayment(m);
      if (m.type === 'amort') {
        var interest = Math.round(m.principal * m.rate);
        m.principal = Math.max(0, m.principal - (pay - interest));
        m.yearsLeft = Math.max(0, m.yearsLeft - 1);
        if (m.yearsLeft === 0) m.principal = 0;
      }
      total += pay;
      if (m.principal <= 0) props[i].mortgage = null;
    }
    return total;
  };

  /* Covenants (bible §4): LTV > 85% -> margin call; a second year unanswered -> forced sale at 85%. */
  F.covenants = function (report) {
    var s = PE.S(), props = St.playerProps().slice(), warnings = [];
    for (var i = 0; i < props.length; i++) {
      var p = props[i], m = p.mortgage; if (!m || m.principal <= 0) { p.marginCall = null; continue; }
      var ltv = m.principal / Math.max(1, p.trueValue);
      if (ltv <= B.covenantLtv) { p.marginCall = null; continue; }
      if (p.marginCall && p.marginCall.year < s.year) {
        // missed: forced sale
        var price = Math.round(p.trueValue * B.forcedSaleFactor), net = price - m.principal;
        s.cash += net; s.stats.forcedSales++; s.stats.forcedSalesThisEra++; s.stats.marginCallsMissed++; (s.stats.forcedSaleYears = s.stats.forcedSaleYears || []).push(s.year);
        report.deals.push({ kind: 'forced_sale', propertyId: p.id, name: p.name, price: price, net: net, text: 'The bank force-sold ' + p.name + ' for ' + U.fmt(price) + '.' });
        St.setOwner(p, null);
        St.rep(-3);
      } else {
        if (!p.marginCall) p.marginCall = { year: s.year, shortfall: 0 };
        p.marginCall.shortfall = Math.round(m.principal - p.trueValue * B.covenantLtv);
        warnings.push('margin_call:' + p.id);
      }
    }
    return warnings;
  };

  F.savingsInterest = function () {
    var s = PE.S();
    if (s.cash <= 0) return 0;
    var r = Math.max(0, s.baseRate - (St.hasPerk('patient_capital') ? 0 : B.savingsRateBelowBase)), i = Math.round(s.cash * r);
    s.cash += i; return i;
  };

  /* Base-rate path: era centre + cycle effect + noise (bible §4). Called at endYear for the coming year. */
  F.nextBaseRate = function () {
    var s = PE.S(), era = D.eraFor(s.year + 1), c = D.cycles[s.cycle.phase];
    var target = era.baseRate + c.rate + R.range(-era.rateSpread, era.rateSpread);
    if (s.cycle.phase === 'depression' && s.cycle.yearsLeft <= 1) target = era.baseRate - era.rateSpread; // spike then fall
    var r = s.baseRate + (target - s.baseRate) * 0.6;
    return Math.round(U.clamp(r, 0.005, 0.15) * 10000) / 10000;
  };

  F.summary = function () {
    var s = PE.S(), props = St.playerProps(), warnings = [];
    for (var i = 0; i < props.length; i++) {
      var p = props[i]; if (!p.mortgage) continue;
      var ltv = p.mortgage.principal / Math.max(1, p.trueValue);
      if (p.marginCall) p.marginCall.shortfall = Math.max(1, Math.round(p.mortgage.principal - p.trueValue * B.covenantLtv));
      if (p.marginCall) warnings.push({ propertyId: p.id, name: p.name, kind: 'margin_call', ltv: ltv, shortfall: p.marginCall.shortfall, text: 'Margin call on ' + p.name + ': repay ' + U.fmt(p.marginCall.shortfall) + ' this year or it is force-sold.' });
      else if (ltv > 0.78) warnings.push({ propertyId: p.id, name: p.name, kind: 'ltv_high', ltv: ltv, text: p.name + ' is at ' + Math.round(ltv * 100) + '% LTV; a dip would trigger a covenant.' });
    }
    return PE.ok({ cash: s.cash, debt: St.debt('player'), assets: St.assets('player'), ltv: St.ltv('player'), netWorth: St.netWorth('player'), annualDebtService: St.annualDebtService('player'),
      baseRate: s.baseRate, quoteRate: F.rateFor('player', 'io', false), maxLtv: F.maxLtv('player'), savingsRate: Math.max(0, s.baseRate - (St.hasPerk('patient_capital') ? 0 : B.savingsRateBelowBase)), covenantWarnings: warnings, trust: s.dynasty.trust, purist: St.hasPerk('purist') });
  };

  PE.Finance = F;
})(typeof window !== 'undefined' ? window : global);
