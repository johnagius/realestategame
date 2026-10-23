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
      baseRate: s.baseRate, quoteRate: F.rateFor('player', 'io', false), maxLtv: F.maxLtv('player'), savingsRate: Math.max(0, s.baseRate - (St.hasPerk('patient_capital') ? 0 : B.savingsRateBelowBase)), covenantWarnings: warnings, trust: s.dynasty.trust, purist: St.hasPerk('purist'),
      bonds: F._bonds().length, bondMarketValue: F._bondMarketTotal(), bank: s.bank ? F.bank().bank : null });
  };

  /* ---------- Government bonds (P4.1, bible §4: Boom era unlock) ----------
     5-year fixed coupon set at base rate + 0.5% when bought. Coupons pay yearly;
     at maturity the face is repaid. Before maturity a bond sells at its market
     value, which moves INVERSELY to the base rate (rates up -> value down): the
     rate-risk tension is the decision. Total face is capped at 30% of net worth. */
  function bondsArr() { var s = PE.S(); return s.bonds || (s.bonds = []); }
  F._bonds = bondsArr;
  F._bondYears = function (b) { return Math.max(0, b.matures - PE.S().year); };
  F._bondMV = function (b) {
    var s = PE.S(), yl = F._bondYears(b);
    if (yl <= 0) return b.face;
    return Math.round(b.face * U.clamp(1 + (b.coupon - s.baseRate) * yl, 0.5, 1.5));
  };
  F._bondMarketTotal = function () { var bs = bondsArr(), t = 0; for (var i = 0; i < bs.length; i++) t += F._bondMV(bs[i]); return t; };
  F.bonds = function () {
    var s = PE.S(), era = St.era(), avail = era.fixedRate; // the Boom-era gate, same as fixed-rate mortgages
    var bs = bondsArr(), face = 0, out = [];
    for (var i = 0; i < bs.length; i++) { face += bs[i].face; out.push({ id: bs[i].id, face: bs[i].face, coupon: bs[i].coupon, couponPct: Math.round(bs[i].coupon * 10000) / 100, bought: bs[i].bought, matures: bs[i].matures, yearsLeft: F._bondYears(bs[i]), marketValue: F._bondMV(bs[i]) }); }
    var cap = Math.round(St.netWorth('player') * B.bondCapPct), headroom = Math.max(0, cap - face);
    return PE.ok({ available: avail, eraName: era.name, holdings: out, totalFace: face, totalMarketValue: F._bondMarketTotal(), cap: cap, headroom: headroom, maxBuy: headroom,
      baseRate: s.baseRate, couponNow: Math.round((s.baseRate + B.bondCouponAboveBase) * 10000) / 10000, minBuy: Math.max(B.bondMinBuy, Math.round(B.bondMinBuy * s.priceIndex)),
      message: avail ? '' : 'The Exchequer does not sell bonds to private investors before 1950.' });
  };
  F.buyBond = function (amount) {
    var s = PE.S();
    if (!St.era().fixedRate) return PE.fail('Government bonds are not issued to private investors before 1950 (the Boom era).');
    amount = Math.round(+amount || 0);
    if (amount < Math.max(B.bondMinBuy, Math.round(B.bondMinBuy * s.priceIndex))) return PE.fail('The clerk refuses a subscription under ' + U.fmt(Math.max(B.bondMinBuy, Math.round(B.bondMinBuy * s.priceIndex))) + '.');
    var bs = bondsArr(), face = 0; for (var i = 0; i < bs.length; i++) face += bs[i].face;
    var cap = Math.round(St.netWorth('player') * B.bondCapPct);
    if (face + amount > cap) return PE.fail('Bond holdings are capped at 30% of net worth (' + U.fmt(cap) + '); at most ' + U.fmt(Math.max(0, cap - face)) + ' more.');
    if (s.cash < amount) return PE.fail('Not enough cash (need ' + U.fmt(amount) + ')');
    s.cash -= amount;
    var b = { id: St.nextId('b'), face: amount, coupon: Math.round((s.baseRate + B.bondCouponAboveBase) * 10000) / 10000, bought: s.year, matures: s.year + B.bondTermYears };
    bs.push(b);
    s.stats.bondIncome = s.stats.bondIncome || 0;
    return PE.ok({ message: 'Subscribed ' + U.fmt(amount) + ' of 5-year stock at ' + (b.coupon * 100).toFixed(2) + '%. Coupons pay yearly; the face returns in ' + B.bondTermYears + ' years.', bond: { id: b.id, face: b.face, coupon: b.coupon, matures: b.matures }, cash: s.cash });
  };
  F.sellBond = function (id) {
    var s = PE.S(), bs = bondsArr(), b = null;
    for (var i = 0; i < bs.length; i++) if (bs[i].id === id) b = bs[i];
    if (!b) return PE.fail('No such bond');
    var mv = F._bondMV(b);
    bs.splice(bs.indexOf(b), 1); s.cash += mv;
    return PE.ok({ message: 'Sold ' + U.fmt(b.face) + ' of stock for ' + U.fmt(mv) + ' — ' + (mv >= b.face ? 'above' : 'below') + ' face because the bank rate moved against it.', proceeds: mv, marketValue: mv, cash: s.cash });
  };
  /* endYear: coupons on every holding; face repaid (with a final coupon) at maturity. Returns the cash paid. */
  F.bondYearly = function (report) {
    var s = PE.S(), bs = bondsArr(), income = 0;
    for (var i = bs.length - 1; i >= 0; i--) {
      var b = bs[i];
      if (s.year < b.matures) income += Math.round(b.face * b.coupon);
      else { income += b.face + Math.round(b.face * b.coupon); bs.splice(i, 1); if (report) report.lines.push('A bond matures: ' + U.fmt(b.face) + ' of government stock is repaid with its last coupon.'); }
    }
    s.cash += income; s.stats.bondIncome = (s.stats.bondIncome || 0) + income;
    return income;
  };

  /* ---------- Own bank (P4.2): lend to rivals, earn the spread, risk the defaults ----------
     Modern era + the 'own_bank' prestige perk. One-time capital (>= £25k x price index)
     leaves your cash; each year the engine lends the idle pool to solvent rivals at
     base rate + 2.5-4% (aggressive families borrow more and pay more). Interest lands
     in your cash; when a borrower goes bankrupt its loan is written off against your
     capital. Recall stops new lending and pulls every loan back over 2 years. */
  F.bankEraOk = function () { return St.eraIdx() >= 4; }; // Modern, 1980+
  F.bankMinCapital = function () { return Math.round(B.bankMinCapital * PE.S().priceIndex); };
  function loansOut(bk) { var t = 0; for (var i = 0; i < bk.loans.length; i++) t += bk.loans[i].principal; return t; }
  F._loansOut = loansOut;
  F.bank = function () {
    var s = PE.S(), eraOk = F.bankEraOk(), perkOk = St.hasPerk('own_bank'), bk = s.bank || null;
    var view = { eraOk: eraOk, perkOk: perkOk, modernFrom: D.eras[4].from, minCapital: F.bankMinCapital(), open: !!bk,
      perkName: (D.perkById('own_bank') || { name: 'Own bank' }).name,
      gate: eraOk ? (perkOk ? '' : 'Buy the “' + (D.perkById('own_bank') || { name: 'Own bank' }).name + '” prestige perk with legacy points to unlock.') : 'Banking licences are not granted to private houses before ' + D.eras[4].from + ' (the Modern era).' };
    if (bk) {
      view.capital = bk.capital; view.out = loansOut(bk); view.vault = Math.max(0, bk.capital - view.out);
      view.lastIncome = bk.lastIncome; view.incomeTotal = bk.incomeTotal || 0; view.writtenOff = bk.writtenOff || 0;
      view.recalling = !!bk.recalling; view.opened = bk.opened;
      view.loans = bk.loans.map(function (L) { var rd = D.rivalById(L.rivalId); return { rivalId: L.rivalId, rivalName: rd ? rd.name : L.rivalId, principal: L.principal, rate: L.rate, yearsLeft: L.yearsLeft }; });
    }
    return PE.ok({ bank: view });
  };
  F.openBank = function (amount) {
    var s = PE.S();
    if (!F.bankEraOk()) return PE.fail('Banking licences are not granted to private houses before ' + D.eras[4].from + ' (the Modern era).');
    if (!St.hasPerk('own_bank')) return PE.fail('The “' + (D.perkById('own_bank') || { name: 'Own bank' }).name + '” prestige perk is required.');
    if (s.bank) return PE.fail('The bank is already open');
    var min = F.bankMinCapital();
    amount = Math.round(+amount || 0);
    if (amount < min) return PE.fail('The regulators require capital of at least ' + U.fmt(min) + '.');
    if (s.cash < amount) return PE.fail('Not enough cash (need ' + U.fmt(amount) + ')');
    s.cash -= amount;
    s.bank = { capital: amount, loans: [], recalling: false, lastIncome: 0, incomeTotal: 0, writtenOff: 0, opened: s.year };
    return PE.ok({ message: 'The ' + s.dynasty.surname + ' Bank opens its doors with ' + U.fmt(amount) + ' of capital. It will lend the pool to solvent rival families above the bank rate.', capital: amount, cash: s.cash });
  };
  F.bankRecall = function () {
    var s = PE.S(), bk = s.bank;
    if (!bk) return PE.fail('No bank to recall');
    if (bk.recalling) return PE.fail('The recall is already in progress');
    bk.recalling = true;
    for (var i = 0; i < bk.loans.length; i++) bk.loans[i].recallLeft = B.bankRecallYears;
    return PE.ok({ message: 'Recall begun: no new loans, and every outstanding loan repays over ' + B.bankRecallYears + ' years. The remaining vault returns as the loans clear.' });
  };
  /* endYear: collect interest and instalments, lend the idle pool, then (caller) write off bankrupt borrowers. */
  F.bankYearly = function (report) {
    var s = PE.S(), bk = s.bank; if (!bk) return null;
    var income = 0, repaid = 0, i;
    for (i = bk.loans.length - 1; i >= 0; i--) {
      var L = bk.loans[i], rv = s.rivals[L.rivalId];
      var alive = rv && !rv.bankrupt;
      var due = 0;
      if (bk.recalling) { L.recallLeft = Math.max(1, L.recallLeft || B.bankRecallYears); due = Math.ceil(L.principal / L.recallLeft); L.recallLeft--; }
      else if (L.yearsLeft <= 1) due = L.principal;
      var interest = Math.round(L.principal * L.rate);
      if (alive) rv.cash -= interest + due; // paying the bank can push a stretched rival under: that is the risk
      income += interest; repaid += Math.min(due, L.principal); L.principal -= due; L.yearsLeft--;
      if (L.principal <= 0) bk.loans.splice(i, 1);
    }
    s.cash += income; // repayments stay in the vault (capital = vault + loans out); only interest leaves the bank
    bk.lastIncome = income; bk.incomeTotal = (bk.incomeTotal || 0) + income;
    s.stats.bankIncome = (s.stats.bankIncome || 0) + income;
    if (income > 0 && report) report.lines.push('The family bank collects ' + U.fmt(income) + ' in interest' + (bk.recalling ? ' while the recall runs.' : '.'));
    // lend the idle pool
    var granted = 0;
    var out = loansOut(bk), deployable = bk.capital - out;
    var minLoan = Math.max(1, Math.round(B.bankMinLoanMult * s.priceIndex));
    if (!bk.recalling && deployable >= Math.max(Math.round(bk.capital * B.bankMinDeployPct), minLoan)) {
      var cands = [];
      for (var id in s.rivals) { var r2 = s.rivals[id]; if (r2.bankrupt || r2.merged) continue; var rd = D.rivalById(id); if (rd) cands.push({ id: id, ag: rd.aggression || 0.5 }); }
      cands.sort(function (a, b) { return b.ag - a.ag; });
      var wsum = 0; for (i = 0; i < cands.length; i++) wsum += 0.25 + cands[i].ag;
      for (i = 0; i < cands.length && wsum > 0; i++) {
        var c = cands[i], share = Math.round(deployable * (0.25 + c.ag) / wsum);
        if (share < minLoan) continue;
        var rate = Math.round((s.baseRate + B.bankSpreadMin + (B.bankSpreadMax - B.bankSpreadMin) * c.ag) * 10000) / 10000;
        bk.loans.push({ id: St.nextId('l'), rivalId: c.id, principal: share, rate: rate, yearsLeft: B.bankLoanYears });
        s.rivals[c.id].cash += share; granted += share;
      }
      if (granted > 0 && report) report.lines.push('The family bank lends ' + U.fmt(granted) + ' of its capital to ' + cands.filter(function (c) { return true; }).length + ' solvent rival famil' + (cands.length === 1 ? 'y' : 'ies') + ' at ' + (B.bankSpreadMin * 100).toFixed(1) + '–' + (B.bankSpreadMax * 100).toFixed(1) + '% over the bank rate.');
    }
    // wind-up
    if (bk.recalling && bk.loans.length === 0) {
      s.cash += bk.capital;
      if (report) report.lines.push('The private bank is wound up: ' + U.fmt(bk.capital) + ' of capital returns to the family.');
      s.bank = null;
    } else if (bk.capital <= 0) {
      if (report) report.lines.push('The private bank is ruined: every loan went bad.');
      s.bank = null;
    }
    return { income: income, repaid: repaid, granted: granted };
  };
  /* After rivals move: a borrower that went bankrupt this year defaults on its loan. */
  F.bankWriteOffs = function (report) {
    var s = PE.S(), bk = s.bank; if (!bk) return 0;
    var written = 0;
    for (var i = bk.loans.length - 1; i >= 0; i--) {
      var L = bk.loans[i], rv = s.rivals[L.rivalId];
      if (rv && !rv.bankrupt) continue;
      written += L.principal; bk.capital -= L.principal; bk.loans.splice(i, 1);
      s.stats.bankWriteOffs = (s.stats.bankWriteOffs || 0) + L.principal;
      if (report) report.lines.push('The bank writes off ' + U.fmt(L.principal) + ' lent to ' + (rv ? PE.Rivals.def(L.rivalId).name : 'a vanished house') + ' — bankruptcy takes the loan with it.');
    }
    if (written > 0 && bk.capital <= 0) { if (report) report.lines.push('The private bank is ruined: every loan went bad.'); s.bank = null; }
    return written;
  };

  PE.Finance = F;
  /* P4 public calls, guarded with the same wrap pattern as game.js (its wrap list predates Phase 4). */
  (function (mod, names) {
    for (var i = 0; i < names.length; i++) (function (n) {
      var raw = mod[n]; if (typeof raw !== 'function') return;
      mod[n] = PE.guard(n, raw); if (!mod['_' + n]) mod['_' + n] = raw; // never clobber an internal helper (F._bonds is the holdings accessor)
    })(names[i]);
  })(F, ['bonds', 'buyBond', 'sellBond', 'bank', 'openBank', 'bankRecall']);
})(typeof window !== 'undefined' ? window : global);
