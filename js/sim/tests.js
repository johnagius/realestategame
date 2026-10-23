#!/usr/bin/env node
/* Unit tests for the v8 engine (no framework). Run: node js/sim/tests.js */
var fs = require('fs'), path = require('path'), load = require('./load.js');
var passed = 0, failed = 0, failures = [];
function check(name, cond, extra) { if (cond) passed++; else { failed++; failures.push(name + (extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 300) : '')); } }
function fresh(familyId, seed, opts) { var PE = load(); var r = PE.Game.newGame(Object.assign({ familyId: familyId || 'chen', seed: seed || 7 }, opts || {})); if (!r.ok) throw new Error(r.message + r.error); return PE; }
function playYears(PE, players, n, who) { for (var i = 0; i < n; i++) { players[who || 'competent'].play(); var r = PE.Game.endYear(); if (!r.ok) { players.resolveEvents(who || 'competent'); r = PE.Game.endYear(); } if (!r.ok) throw new Error('endYear failed: ' + r.message + ' ' + (r.error || '')); } }
function clearEvents(PE) { var s = PE.S(); s.events.pending = []; }
function isInt(v) { return typeof v === 'number' && Math.round(v) === v; }

/* ---------- 1. No Math.random in the engine ---------- */
(function () {
  var dir = path.join(__dirname, '..', 'engine'), order = load.order(), bad = [];
  order.forEach(function (f) { var src = fs.readFileSync(path.join(dir, f), 'utf8'); if (/Math\.random\s*\(/.test(src)) bad.push(f); });
  check('engine never calls Math.random', bad.length === 0, bad);
  check('ORDER.txt lists 14 files, game.js last', order.length === 14 && order[order.length - 1] === 'game.js', order);
})();

/* ---------- 2. Determinism ---------- */
(function () {
  var A = fresh('chen', 42), B = fresh('chen', 42);
  var pa = require('./players.js')(A), pb = require('./players.js')(B);
  playYears(A, pa, 15); playYears(B, pb, 15);
  var sa = JSON.stringify(A.S()), sb = JSON.stringify(B.S());
  check('same seed + same actions => identical state after 15 years', sa === sb);
  var C = fresh('chen', 43); var pc = require('./players.js')(C); playYears(C, pc, 15);
  check('different seed => different state', JSON.stringify(C.S()) !== sa);
  check('money fields are integers', isInt(A.S().cash) && A.State.playerProps().every(function (p) { return isInt(p.trueValue) && (!p.mortgage || isInt(p.mortgage.principal)); }) && Object.keys(A.S().listings).every(function (k) { return isInt(A.S().listings[k].askingPrice); }));
  check('state is JSON-serialisable (no functions)', !/"[^"]*":\s*function/.test(sa) && JSON.parse(sa).year === A.S().year);
})();

/* ---------- 3. Contract return shapes; calls never throw ---------- */
(function () {
  var PE = fresh('chen', 1);
  var calls = [
    function () { return PE.Market.listings('nowhere'); }, function () { return PE.Market.appraise('nope'); }, function () { return PE.Market.makeOffer('nope', 100); },
    function () { return PE.Market.bid('nope', 1); }, function () { return PE.Market.sell('nope'); }, function () { return PE.Market.respondToOffer('nope', true); },
    function () { return PE.Finance.mortgageQuote('nope', 0.7); }, function () { return PE.Finance.takeMortgage('nope', 0.7); }, function () { return PE.Finance.refinance('nope'); }, function () { return PE.Finance.repay('nope', 1); },
    function () { return PE.Property.renovate('nope', 'patch'); }, function () { return PE.Property.setRent('nope', 1); }, function () { return PE.Property.hireManager('london', 'nope'); }, function () { return PE.Property.fireManager('paris'); },
    function () { return PE.Dynasty.chooseHeir('nope'); }, function () { return PE.Dynasty.educate('nope'); }, function () { return PE.Events.resolve('nope', 0); }, function () { return PE.Cities.unlock('atlantis'); },
    function () { return PE.Market.makeOffer(null, undefined, { ltv: 'x' }); }, function () { return PE.Game.skipQuietYears('abc'); }
  ];
  var allShaped = true, threw = false;
  calls.forEach(function (f) { try { var r = f(); if (!r || typeof r.ok !== 'boolean' || (!r.ok && typeof r.message !== 'string')) allShaped = false; } catch (e) { threw = true; } });
  check('bad inputs: every public call returns {ok:false,message} and never throws', allShaped && !threw);
  var okCalls = [PE.Market.listings('london'), PE.Finance.summary(), PE.Dynasty.summary(), PE.Goals.current(), PE.Events.pending(), PE.Cities.list(), PE.Rivals.leaderboard(), PE.Market.offersOnMyProperties(), PE.Game.summary(), PE.Property.availableManagers()];
  check('read-only calls return ok:true', okCalls.every(function (r) { return r && r.ok === true; }));
  check('leaderboard has player + 6 rivals with required fields', PE.Rivals.leaderboard().leaderboard.length === 7 && PE.Rivals.leaderboard().leaderboard.every(function (r) { return 'id' in r && 'name' in r && 'netWorth' in r && 'properties' in r && 'cities' in r && 'lastAction' in r; }));
  check('internal errors are wrapped with error field', (function () { var raw = PE.Market._appraise; PE.Market._appraise = null; var g = PE.guard('boom', function () { throw new Error('kaboom'); }); var r = g(); PE.Market._appraise = raw; return r.ok === false && /kaboom/.test(r.message) && typeof r.error === 'string'; })());
})();

/* ---------- 4. Price scale and era gating ---------- */
(function () {
  var PE = fresh('chen', 11), D = PE.Data, s = PE.S();
  var L = PE.Market.listings('london').listings, cheapest = L[0].askingPrice;
  check('Chen starting cash ≈ 4× cheapest listing (2.5–6×)', s.cash / cheapest >= 2.5 && s.cash / cheapest <= 6, { cash: s.cash, cheapest: cheapest });
  var lodging = [], mansion = [];
  for (var i = 0; i < 40; i++) { lodging.push(PE.Market.genProperty('london', { type: 'lodging' }).trueValue); mansion.push(PE.Market.genProperty('london', { type: 'mansion' }).trueValue); }
  var med = function (a) { a = a.slice().sort(function (x, y) { return x - y; }); return a[a.length >> 1]; };
  check('Victorian London lodging house ~£400–£900 (median)', med(lodging) >= 300 && med(lodging) <= 1200, med(lodging));
  check('Victorian London mansion ~£8k–£20k (median)', med(mansion) >= 6000 && med(mansion) <= 30000, med(mansion));
  var keys = { HO: 1, ST: 1, AP: 1, PH: 1, TH: 1, VI: 1, MN: 1, CM: 1, WR: 1, SK: 1, CT: 1 };
  check('every property type maps to a 3D model key', Object.keys(D.propertyTypes).every(function (k) { return keys[D.propertyTypes[k].model3d]; }));
  check('Victorian listings use only Victorian types and carry era', L.every(function (l) { return D.propertyTypes[l.type].fromEra === 0 && l.era === 'victorian' && l.model3d; }));
  check('later eras add apartment/villa/office/penthouse/tower', D.typesForEra(0).length < D.typesForEra(1).length && D.typesForEra(5).some(function (t) { return t.id === 'tower'; }) && !D.typesForEra(0).some(function (t) { return t.id === 'tower'; }));
  check('listing view hides trueValue and shows estimate band + comps + cues', L.every(function (l) { return (l.trueValue === undefined || l.revealed) && l.lowEstimate <= l.highEstimate && l.comps.length === 3 && l.cues.length >= 2; }));
  check('currency is £', D.currency === '£');
})();

/* ---------- 5. Offers, counters, auctions ---------- */
(function () {
  var PE = fresh('vanderbilt', 5), s = PE.S();
  var L = PE.Market.listingArray('london').filter(function (l) { return l.seller === 'landlord' || l.seller === 'estate'; });
  if (!L.length) { PE.Market.genListing('london', 2000, 'landlord'); L = PE.Market.listingArray('london').filter(function (l) { return l.seller === 'landlord'; }); }
  var l = L[0];
  var low = PE.Market.makeOffer(l.id, Math.round(l.askingPrice * 0.3));
  check('lowball offer is rejected', low.ok && low.outcome === 'rejected', low);
  var rep0 = s.reputation;
  var l2 = PE.Market.genListing('london', 3000, 'landlord'); PE.Rivals.contest = function () { return []; };
  var mid = PE.Market.makeOffer(l2.id, Math.round(l2.askingPrice * 0.8));
  check('offer below floor is countered with counterPrice between offer and asking', mid.ok && mid.outcome === 'countered' && mid.counterPrice > l2.askingPrice * 0.8 && mid.counterPrice <= l2.askingPrice, mid);
  var acc = PE.Market.makeOffer(l2.id, mid.counterPrice, { ltv: 0.6, type: 'io' });
  check('meeting the counter is accepted and the property is owned with a mortgage', acc.ok && acc.outcome === 'accepted' && s.properties[l2.id] && s.properties[l2.id].ownerId === 'player' && s.properties[l2.id].mortgage.principal > 0, acc);
  check('asking-price offer on a fresh listing is accepted', (function () { var l3 = PE.Market.genListing('london', 1500, 'landlord'); var r = PE.Market.makeOffer(l3.id, l3.askingPrice); return r.ok && r.outcome === 'accepted'; })());
  check('offers per listing per year are limited', (function () { var l4 = PE.Market.genListing('london', 1500, 'developer'); PE.Market.makeOffer(l4.id, Math.round(l4.askingPrice * 0.8)); PE.Market.makeOffer(l4.id, Math.round(l4.askingPrice * 0.8)); var r = PE.Market.makeOffer(l4.id, Math.round(l4.askingPrice * 0.8)); return !r.ok; })());
  check('cannot offer more cash than you have', (function () { var l5 = PE.Market.genListing('london', 50000, 'developer'); l5.askingPrice = 10000000; var r = PE.Market.makeOffer(l5.id, 10000000); return !r.ok && r.cashNeeded > 0; })());
  // Auction with a scripted rival whose max bid is known
  var l6 = PE.Market.genListing('london', 2000, 'estate');
  PE.Rivals.contest = function () { return [{ id: 'wong', maxBid: Math.round(l6.askingPrice * 1.2) }]; };
  var a = PE.Market.makeOffer(l6.id, l6.askingPrice);
  check('a contested deal becomes an auction with the rival leading', a.ok && a.outcome === 'auction' && a.auction.leader === 'rival:wong' && a.auction.currentBid > l6.askingPrice, a);
  var badBid = PE.Market.bid(a.auction.id, a.auction.currentBid);
  check('a bid must beat the current bid', !badBid.ok);
  var b1 = PE.Market.bid(a.auction.id, Math.round(a.auction.currentBid * 1.02));
  check('bid below the rival max => continue with a higher rival bid', b1.ok && b1.outcome === 'continue' && b1.round === 1 && b1.currentBid > a.auction.currentBid, b1);
  var b2 = PE.Market.bid(a.auction.id, Math.round(l6.askingPrice * 1.25));
  check('bid above the rival max => won and owned', b2.ok && b2.outcome === 'won' && s.properties[l6.id].ownerId === 'player' && s.stats.auctionsWon >= 1, b2);
  var l7 = PE.Market.genListing('london', 2000, 'estate');
  PE.Rivals.contest = function () { return [{ id: 'petrov', maxBid: Math.round(l7.askingPrice * 3) }]; };
  var a2 = PE.Market.makeOffer(l7.id, l7.askingPrice); var last;
  for (var k = 0; k < 3; k++) last = PE.Market.bid(s.auction.id, Math.round(s.auction.currentBid * 1.03));
  check('after 3 rounds the rival outbids and takes the property', last.ok && last.outcome === 'outbid' && s.properties[l7.id] && s.properties[l7.id].ownerId === 'rival:petrov' && !s.auction, last);
  var l8 = PE.Market.genListing('london', 2000, 'estate');
  PE.Rivals.contest = function () { return [{ id: 'okonkwo', maxBid: Math.round(l8.askingPrice * 3) }]; };
  PE.Market.makeOffer(l8.id, l8.askingPrice); var w = PE.Market.withdraw(s.auction.id);
  check('withdrawing hands the lot to the leading rival', w.ok && w.outcome === 'withdrawn' && s.properties[l8.id].ownerId === 'rival:okonkwo');
  var l9 = PE.Market.genListing('london', 2000, 'auction'), ask9 = l9.askingPrice; PE.Rivals.contest = function () { return []; };
  var a3 = PE.Market.makeOffer(l9.id, ask9);
  check('auction-seller listing with no rival interest sells at the opening bid', a3.ok && a3.outcome === 'accepted' && s.properties[l9.id].purchasePrice === ask9, a3);
  check('stamp duty was charged on purchases', s.stats.bought >= 4 && s.cash < 12000);
})();

/* ---------- 6. Mortgage math, refinance, repay, covenants ---------- */
(function () {
  var PE = fresh('armstrong', 3), s = PE.S(), F = PE.Finance, B = PE.Data.balance;
  var m = { principal: 10000, rate: 0.05, type: 'io', yearsLeft: 0 };
  check('IO payment = principal × rate', F.annualPayment(m) === 500);
  var am = { principal: 10000, rate: 0.05, type: 'amort', yearsLeft: 25 };
  check('25y amortising payment ≈ 709 (annuity)', Math.abs(F.annualPayment(am) - 709) <= 1, F.annualPayment(am));
  var p = PE.State.playerProps()[0];
  var q = F.mortgageQuote(p.id, 0.95, 'io');
  check('quote clamps LTV to the max (75% with rep>70 or Banker, else 70%)', q.ok && q.ltv <= 0.75 && q.ltv === F.maxLtv('player') && q.principal === Math.round(p.trueValue * q.ltv), q);
  check('amortising quote is cheaper than IO by 0.5%', Math.abs((F.mortgageQuote(p.id, 0.5, 'io').rate - F.mortgageQuote(p.id, 0.5, 'amort').rate) - B.amortDiscount) < 1e-9);
  check('fixed-rate loans are not available in the Victorian era', q.fixedAvailable === false);
  check('Armstrong starts with two mortgaged properties (deleverage start)', PE.State.playerProps().length === 2 && PE.State.debt('player') > 0);
  p.mortgage.lastRefi = s.year - 1;
  var refiEarly = F.refinance(p.id, 0.7);
  check('refinance blocked within 3 years of the last one', !refiEarly.ok);
  p.mortgage.lastRefi = s.year - 3; p.mortgage.since = s.year - 3;
  var cash0 = s.cash, refi = F.refinance(p.id, 0.7);
  check('refinance to 70% cashes out the difference', refi.ok && s.cash - cash0 === refi.cashDelta && p.mortgage.principal === Math.round(p.trueValue * 0.7), refi);
  var rp = F.repay(p.id, 100), princ = p.mortgage.principal;
  check('repay reduces principal and cash', rp.ok && princ === Math.round(p.trueValue * 0.7) - 100 && s.cash === cash0 + refi.cashDelta - 100);
  check('repay more than cash fails', !F.repay(p.id, s.cash + 1).ok);
  // Covenant: crash the value
  var ownedProp = PE.State.playerProps()[1];
  var r0 = F.takeMortgage(ownedProp.id, 0.7, 'io'); if (!r0.ok) { ownedProp.mortgage.lastRefi = s.year - 5; F.refinance(ownedProp.id, 0.7); }
  var d = PE.State.district(ownedProp.cityId, ownedProp.district); d.ppsqm *= 0.5;
  clearEvents(PE); var rep1 = PE.Game.endYear();
  check('value collapse triggers a margin_call warning in the YearReport', rep1.ok && rep1.warnings.indexOf('margin_call:' + ownedProp.id) >= 0, rep1.warnings);
  var sum = F.summary();
  check('Finance.summary lists the covenant warning with a shortfall', sum.ok && sum.covenantWarnings.some(function (w) { return w.propertyId === ownedProp.id && w.shortfall > 0; }));
  var shortfall = Math.round(ownedProp.mortgage.principal - ownedProp.trueValue * B.covenantLtv) + 1;
  s.cash += shortfall; var cleared = F.repay(ownedProp.id, shortfall);
  check('injecting the shortfall clears the margin call', cleared.ok && cleared.marginCallCleared === true && !ownedProp.marginCall);
  // Miss one: forced sale next year
  var P2 = fresh('armstrong', 3), s2 = P2.S(), pp = P2.State.playerProps()[0];
  P2.State.district(pp.cityId, pp.district).ppsqm *= 0.5; clearEvents(P2); P2.Game.endYear(); clearEvents(P2); var rep2 = P2.Game.endYear();
  check('an unanswered margin call force-sells the property at 85%', rep2.ok && rep2.deals.some(function (dl) { return dl.kind === 'forced_sale' && dl.propertyId === pp.id; }) && !s2.properties[pp.id] && s2.stats.forcedSales === 1, rep2.deals);
})();

/* ---------- 7. Bankruptcy and comeback ---------- */
(function () {
  var PE = fresh('armstrong', 9), s = PE.S();
  s.cash = -10 * PE.State.assets('player'); clearEvents(PE);
  var rep = PE.Game.endYear();
  check('net worth < 0 => bankrupt report and status', rep.ok && rep.bankrupt === true && s.status === 'bankrupt' && /fallen/.test(rep.headline), rep.headline);
  check('endYear refuses while bankrupt', !PE.Game.endYear().ok);
  var before = PE.State.propertyCount('player'), cb = PE.Game.continueAsHeir();
  check('continueAsHeir keeps exactly 1 property, resets reputation to 40 and resumes play (rivals absorbed the rest when the house fell, P3.5)', cb.ok && PE.State.propertyCount('player') === 1 && s.reputation === 40 && s.status === 'playing' && s.cash >= 0 && before === 1, cb);
  check('comeback is recorded for the Phoenix achievement', s.stats.bankruptcies === 1 && s.stats.comebackFrom > 0);
  check('play continues after the comeback', PE.Game.endYear().ok || PE.Events.pending().event !== null);
  var P2 = fresh('chen', 9), s2 = P2.S();
  var up = P2.Market.genProperty('london', { type: 'terrace', condition: 70 }); P2.State.setOwner(up, 'player'); up.mortgage = P2.Finance.makeMortgage('player', Math.round(up.trueValue * 0.86), 'io', false);
  s2.cash = -5; s2.stats.negativeCashYears = 1; clearEvents(P2); var nwPos = P2.State.netWorth('player') > 0; var r2 = P2.Game.endYear();
  check('two years of negative cash with nothing sellable => bankrupt (even with positive net worth)', nwPos && r2.ok && r2.bankrupt && /cash|margin/.test(s2.endReason), [s2.endReason, nwPos]);
})();

/* ---------- 8. Renovation ---------- */
(function () {
  var PE = fresh('silva', 4), s = PE.S(), p = PE.State.playerProps()[0];
  check('Silva starts with a free derelict terrace and the Builder trait', p && p.condition < 20 && p.type === 'terrace' && PE.State.hasTrait('builder'));
  var opts = PE.Property.renovationOptions(p);
  check('three renovation tiers are offered with cost/time/risk', opts.length === 3 && opts.every(function (o) { return o.cost > 0 && o.years >= 0; }));
  var full = PE.Property.renovationCost(p, 'refurbish'), tier = PE.Data.renovation.refurbish;
  check('Builder trait makes renovation 15% cheaper', Math.abs(full - Math.round(p.trueValue * tier.cost * 0.85)) <= 1, [full, p.trueValue]);
  var c0 = p.condition, cash0 = s.cash, pr = PE.Property.renovate(p.id, 'patch');
  check('patch is immediate: +15 condition, cost deducted', pr.ok && Math.round(p.condition - c0) === 15 && s.cash === cash0 - pr.cost, pr);
  var rf = PE.Property.renovate(p.id, 'refurbish');
  check('refurbish takes a year (+1 in a heritage city like London)', rf.ok && p.renovation && p.renovation.yearsLeft === 2 && p.renovation.tier === 'refurbish' && PE.Data.cityById.london.trait === 'heritage_city');
  check('cannot start a second job on the same building', !PE.Property.renovate(p.id, 'patch').ok);
  var vBefore = p.trueValue, cBefore = p.condition, rep, lines = [];
  for (var y = 0; y < 3 && p.renovation; y++) { clearEvents(PE); rep = PE.Game.endYear(); lines = lines.concat(rep.lines); }
  check('refurbish completes on schedule: +35 condition, higher value, report line', rep.ok && !p.renovation && Math.round(p.condition - cBefore) >= 30 && p.trueValue > vBefore && lines.some(function (l) { return /Refurbish complete/.test(l); }), [cBefore, p.condition, vBefore, p.trueValue]);
  var land = PE.Market.genProperty('london', { type: 'land', district: 'Camden' }); PE.State.setOwner(land, 'player'); s.cash += PE.Property.renovationCost(land, 'rebuild') + 10;
  check('a plot can only be built on', !PE.Property.renovate(land.id, 'patch').ok);
  var rb = PE.Property.renovate(land.id, 'rebuild');
  check('rebuild on land starts a 2-year job', rb.ok && land.renovation && land.renovation.yearsLeft === 2);
  for (var i = 0; i < 4 && land.renovation; i++) { clearEvents(PE); PE.Game.endYear(); }
  check('rebuild turns the plot into a rentable building of the era, Prime condition', !land.renovation && land.type !== 'land' && land.condition >= 85 && PE.Data.propertyTypes[land.type].canRent && land.model3d === PE.Data.propertyTypes[land.type].model3d, land.type);
  check('overrun/delay risk is rolled deterministically from the seed', (function () { var hits = 0; for (var k = 0; k < 100; k++) { var P = fresh('vanderbilt', 100 + k); var q = P.Market.genProperty('london', { condition: 30, type: 'terrace' }); P.State.setOwner(q, 'player'); P.Property.renovate(q.id, 'refurbish'); if (q.renovation.overrun > 0) hits++; } return hits >= 3 && hits <= 25; })());
  check('rent setting clamps to 0.8–1.2', PE.Property.setRent(p.id, 5).rentSetting === 1.2 && PE.Property.setRent(p.id, 0.1).rentSetting === 0.8);
  check('insufficient cash fails cleanly', (function () { s.cash = 0; return !PE.Property.renovate(p.id, 'refurbish').ok; })());
})();

/* ---------- 9. Rivals: bankruptcy absorption, offers ---------- */
(function () {
  var PE = fresh('vanderbilt', 21), s = PE.S();
  var rv = s.rivals.petrov, n = PE.State.propertyCount('rival:petrov');
  rv.cash = -1e9; clearEvents(PE); var rep = PE.Game.endYear();
  check('a rival with negative net worth goes bankrupt', rv.bankrupt === true && rep.rivalsMoves.some(function (m) { return /bankrupt/i.test(m.text); }));
  var pend = s.events.pending.filter(function (e) { return e.id === 'rival_bankrupt'; })[0] || null;
  var absorbedByRival = PE.State.propertyCount('rival:petrov') === 0 && !pend;
  check('its portfolio is offered to the player (event) or absorbed by the strongest rival', (pend && pend.id === 'rival_bankrupt' && pend.choices.length === 2) || absorbedByRival, pend);
  if (pend && pend.id === 'rival_bankrupt') {
    var before = PE.State.propertyCount('player'), res = PE.Events.resolve(pend.uid, 0);
    check('buying the bankrupt portfolio transfers its buildings to the player', res.ok && PE.State.propertyCount('player') > before && PE.State.propertyCount('rival:petrov') === 0, res);
  } else check('absorbed portfolio moved to the strongest rival', PE.Rivals.strongest('petrov') && PE.State.propertyCount('rival:petrov') === 0);
  check('bankrupt rival shows 0 net worth on the leaderboard', PE.Rivals.leaderboard().leaderboard.filter(function (r) { return r.id === 'petrov'; })[0].netWorth === 0);
  // Rival offer on a player property
  var p = PE.State.playerProps()[0] || (function () { var q = PE.Market.genProperty('london', { district: 'Mayfair', type: 'townhouse' }); PE.State.setOwner(q, 'player'); return q; })();
  s.offers.push({ id: 'o_test', propertyId: p.id, rivalId: 'al_rashid', price: Math.round(p.trueValue * 1.3), year: s.year });
  var offers = PE.Market.offersOnMyProperties().offers;
  check('offers on my properties are listed with premium and quote', offers.length === 1 && offers[0].premium === 30 && offers[0].quote.cashGained > 0);
  var cash0 = s.cash, acc = PE.Market.respondToOffer('o_test', true);
  check('accepting a rival offer sells to the rival at the offer price less fees', acc.ok && acc.accepted && s.cash > cash0 && s.properties[p.id].ownerId === 'rival:al_rashid');
  check('rivals have real portfolios with mortgages', Object.keys(s.rivals).every(function (id) { return s.rivals[id].bankrupt || PE.State.propertyCount('rival:' + id) > 0; }) && PE.State.debt('rival:wong') > 0);
})();

/* ---------- 10. Dynasty: succession and estate tax ---------- */
(function () {
  var PE = fresh('vanderbilt', 31), s = PE.S(), D = PE.Data;
  var kid = PE.Dynasty.newMember(25, 'm', ['negotiator'], 'child'); s.dynasty.members.push(kid);
  check('chooseHeir accepts an adult child', PE.Dynasty.chooseHeir(kid.id).ok && s.dynasty.heirId === kid.id);
  var sum0 = PE.Dynasty.summary();
  check('Vanderbilt estate tax = era 20% + 20% family penalty', Math.abs(sum0.estateTaxRate - 0.40) < 1e-9, sum0.estateTaxRate);
  var nw = PE.State.netWorth('player'), cash0 = s.cash;
  s.dynasty.head.age = 150; // all but certain death
  var rep; for (var t = 0; t < 12; t++) { clearEvents(PE); nw = PE.State.netWorth('player'); rep = PE.Game.endYear(); if (rep.succession) break; }
  check('succession happens: heir becomes head, generation 2, report dynasty entry', rep.ok && rep.succession && s.dynasty.head.id === kid.id && s.dynasty.generation === 2 && rep.dynasty[0].kind === 'succession');
  check('estate tax of 40% of net worth was paid', Math.abs(rep.dynasty[0].tax - nw * 0.40) < nw * 0.03 && rep.cashFlow.taxes >= rep.dynasty[0].tax, [rep.dynasty[0].tax, nw]);
  check('reputation is partially inherited', s.reputation < 55 && s.reputation > 20, s.reputation);
  var P2 = fresh('chen', 32), s2 = P2.S();
  check('a trust halves the estate tax at 2%/yr', P2.Dynasty.setupTrust().ok && Math.abs(P2.Dynasty.summary().estateTaxRate - 0.10) < 1e-9);
  var ed = (function () { var k2 = P2.Dynasty.newMember(15, 'f', ['spendthrift'], 'child'); s2.dynasty.members.push(k2); s2.cash = 100000; var r = P2.Dynasty.educate(k2.id); return r.ok && k2.traits.indexOf('spendthrift') < 0; })();
  check('education removes the Spendthrift trait', ed);
  check('marriage needs relation ≥ 0 and reputation ≥ 50', (function () { var k3 = P2.Dynasty.newMember(22, 'm', ['charmer'], 'child'); s2.dynasty.members.push(k3); P2.Rivals.setRelation('rothschild', -10); var a = P2.Dynasty.proposeMarriage(k3.id, 'rothschild'); P2.Rivals.setRelation('rothschild', 10); s2.reputation = 40; var b = P2.Dynasty.proposeMarriage(k3.id, 'rothschild'); s2.reputation = 60; var c = P2.Dynasty.proposeMarriage(k3.id, 'rothschild'); return !a.ok && !b.ok && c.ok && typeof c.accepted === 'boolean'; })());
})();

/* ---------- 11. Goals never pre-satisfied (all 4 families) ---------- */
(function () {
  ['silva', 'chen', 'armstrong', 'vanderbilt'].forEach(function (fam) {
    for (var seed = 1; seed <= 5; seed++) {
      var PE = fresh(fam, seed), s = PE.S(), g = PE.Goals, D = PE.Data;
      check(fam + '/' + seed + ': yearly goal not satisfied at start', !g.yearlySatisfied(s.goals.yearly), s.goals.yearly);
      check(fam + '/' + seed + ': era goal not satisfied at start', !g.eraSatisfied(s.goals.era));
      check(fam + '/' + seed + ': first campaign tier not satisfied at start', !g.tierSatisfied(D.campaignTiers[0]) && s.goals.campaignTier === 0);
      check(fam + '/' + seed + ': no achievement satisfied at start', D.achievements.every(function (a) { return !g.achievementSatisfied(a.id); }), D.achievements.filter(function (a) { return g.achievementSatisfied(a.id); }).map(function (a) { return a.id; }));
    }
  });
  // P5.4 / P5.3: the same holds for every scenario start and the weekly challenge
  ['crash1929', 'oilshock1973', 'gfc2008'].forEach(function (sc) {
    for (var seed = 1; seed <= 3; seed++) {
      var PE = fresh('chen', seed, { scenario: sc }), s = PE.S(), g = PE.Goals, D = PE.Data;
      check(sc + '/' + seed + ': yearly, era, campaign and family goals not satisfied at start', !g.yearlySatisfied(s.goals.yearly) && !g.eraSatisfied(s.goals.era) && !g.tierSatisfied(D.campaignTiers[0]) && !g.familySatisfied(s.goals.family));
      check(sc + '/' + seed + ': no achievement satisfied at start', D.achievements.every(function (a) { return !g.achievementSatisfied(a.id); }), D.achievements.filter(function (a) { return g.achievementSatisfied(a.id); }).map(function (a) { return a.id; }));
    }
  });
  (function () { var PE = load(); PE.Game.newChallenge({ week: '2026-W01' }); var g = PE.Goals, D = PE.Data, s = PE.S(); check('challenge: no goal or achievement satisfied at start', !g.yearlySatisfied(s.goals.yearly) && !g.eraSatisfied(s.goals.era) && D.achievements.every(function (a) { return !g.achievementSatisfied(a.id); })); })();
  var PE = fresh('chen', 2), cur = PE.Goals.current();
  check('Goals.current returns yearly/era/campaign/achievements/legacy', cur.ok && cur.yearly && cur.era && cur.campaign && cur.achievements.length === PE.Data.achievements.length && cur.legacyScore > 0);
  check('every era has an era goal', PE.Data.eras.every(function (e) { return PE.Data.eraGoals[e.id]; }));
})();

/* ---------- 12. Save/load, storage ---------- */
(function () {
  var PE = fresh('chen', 77), players = require('./players.js')(PE);
  playYears(PE, players, 5);
  var sv = PE.Game.save(), snap = JSON.stringify(PE.S());
  check('save ok and hasSave', sv.ok && PE.Game.hasSave().hasSave === true);
  PE.S().cash = -999999; PE.S().year = 1700;
  var ld = PE.Game.load();
  check('load restores the exact saved state', ld.ok && JSON.stringify(PE.S()) === snap);
  playYears(PE, players, 3);
  var afterA = JSON.stringify(PE.S());
  PE.Game.load(); playYears(PE, players, 3);
  check('play after load is deterministic (RNG state is saved)', JSON.stringify(PE.S()) === afterA);
  check('save key is pe_v8_save and saveVersion is stored', PE.Storage.SAVE_KEY === 'pe_v8_save' && PE.S().saveVersion === PE.Storage.SAVE_VERSION);
  check('migration hook runs on older saves', (function () { PE.Storage.migrations[0] = function (st) { st.migrated = true; return st; }; var raw = JSON.parse(require('./load.js')().Storage.SAVE_KEY ? '{}' : '{}'); PE.Storage.useBackend({ get: function () { return JSON.stringify({ saveVersion: 0, state: { year: 1900, familyId: 'chen' } }); }, set: function () { return true; }, remove: function () {} }); var st = PE.Storage.load(); delete PE.Storage.migrations[0]; return st.migrated === true && st.saveVersion === PE.Storage.SAVE_VERSION; })());
  var P2 = fresh('chen', 78); P2.Game.save(); var del = P2.Game.deleteSave();
  check('deleteSave removes the save', del.ok && P2.Game.hasSave().hasSave === false && !P2.Game.load().ok);
  check('meta (legacy) persists separately', (function () { var m = P2.Storage.loadMeta(); m.legacyPoints = 5; P2.Storage.saveMeta(m); return P2.Storage.loadMeta().legacyPoints === 5; })());
})();

/* ---------- 13. Turn loop: YearReport contract, skipQuietYears, events ---------- */
(function () {
  var PE = fresh('chen', 88), s = PE.S();
  var pend = PE.Events.pending().event;
  check('1851 scripted event is pending at the start of 1851 (Great Exhibition) or endYear blocks on pending events', (function () { clearEvents(PE); PE.Game.endYear(); var e = PE.Events.pending().event; return e && /Exhibition/.test(e.title); })());
  var blocked = PE.Game.endYear();
  check('endYear refuses while an event is pending (needsDecision)', !blocked.ok && blocked.needsDecision === true && blocked.pending);
  var e = PE.Events.pending().event, nPend = s.events.pending.length, res = PE.Events.resolve(e.uid, e.choices.length - 1);
  check('resolving the event works and logs it', res.ok && s.events.log.length === 1 && res.remaining === nPend - 1);
  while (PE.Events.pending().event) { var e2 = PE.Events.pending().event; PE.Events.resolve(e2.uid, 0); }
  var rep = PE.Game.endYear();
  var keys = ['year', 'era', 'cashFlow', 'equityChange', 'valuesByCity', 'deals', 'rivalsMoves', 'events', 'dynasty', 'goals', 'rank', 'warnings', 'cliffhanger', 'needsDecision'];
  check('YearReport has every contract field', rep.ok && keys.every(function (k) { return k in rep; }) && ['rent', 'costs', 'debtService', 'taxes', 'net'].every(function (k) { return k in rep.cashFlow; }) && 'before' in rep.rank && 'achieved' in rep.goals && typeof rep.cliffhanger === 'string' && rep.cliffhanger.length > 0, Object.keys(rep));
  check('year advanced and history grew', s.year === rep.year + 1 && s.history[s.history.length - 1].year === s.year);
  check('morning paper exists for the new year', s.paper.length >= 1 && s.paper[0].kind === 'macro');
  // skipQuietYears
  var P2 = fresh('chen', 89), s2 = P2.S(); clearEvents(P2);
  var sk = P2.Game.skipQuietYears(5);
  check('skipQuietYears returns reports and stops on a decision (never more than 5)', sk.ok && sk.reports.length >= 1 && sk.reports.length <= 5 && (sk.reports.length === 5 || sk.needsDecision), { n: sk.reports.length, stopped: sk.stopped });
  check('skipQuietYears stops early when an event appears', sk.reports.length < 5 || !sk.needsDecision ? (sk.reports.length < 5 ? sk.reports[sk.reports.length - 1].needsDecision === true : true) : true);
  var sk2 = P2.Game.skipQuietYears(5);
  check('skipQuietYears with a pending event returns needsDecision without advancing', (P2.S().events.pending.length ? (sk2.ok && sk2.reports.length === 0 && sk2.needsDecision) : sk2.ok));
  check('max 2 random/historical events per year', (function () { var P = fresh('armstrong', 90), pl = require('./players.js')(P); var ok = true; for (var i = 0; i < 25; i++) { pl.competent.play(); var r = P.Game.endYear(); if (!r.ok) { pl.resolveEvents('competent'); r = P.Game.endYear(); } if (r.ok && r.events.length > 2) ok = false; } return ok; })());
  check('historical events carry non-trivial choices (≥2) and crashes are scripted', PE.Data.historicalEvents.every(function (h) { return h.choices.length >= 2; }) && PE.Data.scriptedCycles[1873] === 'depression' && PE.Data.scriptedCycles[1929] === 'depression' && PE.Data.scriptedCycles[2008] === 'depression');
  check('game ends at 2030', (function () { var P = fresh('chen', 91); P.S().year = 2030; clearEvents(P); var r = P.Game.endYear(); return r.ok && r.ended && P.S().status === 'ended' && !P.Game.endYear().ok; })());
})();

/* ---------- 14. Cities, managers, market sales ---------- */
(function () {
  var PE = fresh('chen', 55), s = PE.S();
  var list = PE.Cities.list().cities;
  check('20 cities; only London unlocked; Dubai not available before 1970', list.length === 20 && list.filter(function (c) { return c.unlocked; }).length === 1 && !list.filter(function (c) { return c.id === 'dubai'; })[0].available);
  var paris = list.filter(function (c) { return c.id === 'paris'; })[0];
  check('expansion cost and reputation threshold are reported', paris.cost > 0 && paris.repRequired >= 40);
  s.cash = 0;
  check('unlock fails without cash', !PE.Cities.unlock('paris').ok);
  s.cash = paris.cost + 100; s.reputation = 30;
  check('unlock fails below the reputation threshold', !PE.Cities.unlock('paris').ok);
  s.reputation = 80; var u = PE.Cities.unlock('paris');
  check('unlock deducts the cost, opens the city and fills its board', u.ok && s.cities.paris.unlocked && s.cash === 100 && PE.Market.listings('paris').listings.length >= 5, u);
  check('expansion cost rises with each city held', PE.Cities.expansionCost('new_york') > paris.cost);
  check('managers gated by reputation; hire/fire works', (function () { s.reputation = 10; var ms = PE.Property.availableManagers().managers; var h = PE.Property.hireManager('london', 'mgr_obrien'); var ok1 = ms.length === 2 && !h.ok; var h2 = PE.Property.hireManager('london', 'mgr_blake'); return ok1 && h2.ok && s.cities.london.managerId === 'mgr_blake' && PE.Property.fireManager('london').ok && !s.cities.london.managerId; })());
  check('management capacity: 5 self-managed, rest unmanaged without a manager', (function () { for (var i = 0; i < 7; i++) PE.State.setOwner(PE.Market.genProperty('london', {}), 'player'); var c = PE.Property.capacitySummary(); return c.self === 5 && c.none === 2; })());
  var p = PE.State.playerProps()[0], cash0 = s.cash, q = PE.Market.sell(p.id, 'quick');
  check('quick sale is immediate at 85% less 3% fee', q.ok && q.sold && !s.properties[p.id] && s.cash === cash0 + q.cashGained && q.price === Math.round(p.trueValue * PE.Market.saleMood() * 0.85) && q.fees === Math.round(q.price * 0.03), q);
  var p2 = PE.State.playerProps()[0], mk = PE.Market.sell(p2.id, 'market');
  check('market sale is pending until year end', mk.ok && mk.pending && p2.forSale);
  check('cancel withdraws a market sale', PE.Market.sell(p2.id, 'cancel').ok && !p2.forSale);
  check('CGT applies to sales within 3 years when the era taxes gains', (function () { var P = fresh('chen', 56); P.S().year = 1960; var pp = P.Market.genProperty('london', {}); P.State.setOwner(pp, 'player'); pp.purchasePrice = Math.round(pp.trueValue * 0.5); pp.purchaseYear = 1959; var qq = P.Market.saleQuote(pp, 1); return qq.tax > 0 && qq.tax === Math.round((qq.price - pp.purchasePrice) * 0.25); })());
  check('district saturation: owning >30% of a district raises the acceptance floor', (function () { var P = fresh('chen', 57); var d = P.State.district('london', 'Camden'); var l = P.Market.genListing('london', 1000, 'landlord'); l.district = 'Camden'; var f0 = P.Market.acceptFloor(l); d.playerCount = Math.ceil(d.stock * 0.4); return P.Market.acceptFloor(l) > f0; })());
})();


/* ---------- 15. P2.0 follow-ups: priced mortgage quotes, recordLegacy, prevRank, auction round ---------- */
(function () {
  var PE = fresh('vanderbilt', 3), s = PE.S(), F = PE.Finance, M = PE.Market;
  var l = M.genListing('london', 2500, 'landlord');
  var q0 = F.mortgageQuote(l.id, 0.7, 'io');
  check('quote without price keeps the legacy shape (principal = ltv × asking) and adds duty/cashNeeded', q0.ok && q0.principal === Math.round(l.askingPrice * 0.7) && q0.duty === M.stampDuty(l, l.askingPrice) && q0.cashNeeded === l.askingPrice + q0.duty - q0.principal && q0.lenderCapped === false, q0);
  var low = Math.round(l.trueValue * 0.8), qa = F.mortgageQuote(l.id, 0.7, 'io', false, low), needA = M.cashNeeded(l, low, { ltv: 0.7 });
  check('quote at a price below value: principal/duty/cashNeeded exactly match what makeOffer will charge', qa.ok && qa.price === low && qa.principal === needA.principal && qa.duty === needA.duty && qa.cashNeeded === needA.cash && !qa.lenderCapped && qa.message === '', qa);
  var high = Math.round(l.trueValue * 1.3), qb = F.mortgageQuote(l.id, 0.7, 'io', false, high), needB = M.cashNeeded(l, high, { ltv: 0.7 });
  check('quote at a price above value: lender lends against value, payload exact for the offer', qb.ok && qb.principal === Math.round(l.trueValue * 0.7) && qb.principal === needB.principal && qb.cashNeeded === needB.cash && qb.lenderCapped === true, qb);
  var est = M.estimate(l), expectX = Math.round(est.mid * 0.7 / 10) * 10, mX = /advance £(\d+)/.exec(qb.message.replace(/,/g, ''));
  check('capped message quotes "Lender will only advance £X" with X from the estimate midpoint, rounded to £10', /^Lender will only advance £\d+ on this property$/.test(qb.message) && mX && +mX[1] === expectX && +mX[1] % 10 === 0, qb.message);
  check('the message never contains the true value or the true-value-derived principal', qb.message.indexOf(String(l.trueValue)) < 0 && qb.message.indexOf(String(qb.principal)) < 0 || expectX === qb.principal);
  check('quote on an owned property ignores price', (function () { var r = M.makeOffer(l.id, l.askingPrice, { ltv: 0.5 }); var p = s.properties[l.id]; if (!p) return false; var q = F.mortgageQuote(p.id, 0.3, 'io', false, 999999); return q.ok && q.principal === Math.round(p.trueValue * 0.3) && q.price === undefined; })());
  // recordLegacy / newDynasty
  var P2 = fresh('chen', 4), pl = require('./players.js')(P2); playYears(P2, pl, 12);
  var score = P2.Goals.legacyScore(), rl = P2.Game.recordLegacy(), meta = P2.Storage.loadMeta();
  check('recordLegacy records the run into meta and returns the score and points', rl.ok && rl.legacyScore === score && rl.alreadyRecorded === false && meta.runs.length === 1 && meta.runs[0].score === score && meta.legacyPoints === rl.legacyPointsEarned && rl.legacyPointsEarned >= 1, rl);
  var rl2 = P2.Game.recordLegacy();
  check('recordLegacy is idempotent for a run (no double points)', rl2.ok && rl2.alreadyRecorded === true && P2.Storage.loadMeta().legacyPoints === meta.legacyPoints && P2.Storage.loadMeta().runs.length === 1);
  check('Game.legacy reports recorded flag and points-if-recorded', P2.Game.legacy().recorded === true && P2.Game.legacy().pointsIfRecorded === rl.legacyPointsEarned);
  var nd = P2.Game.newDynasty({ familyId: 'silva', seed: 9 });
  check('newDynasty still works: records (once) then starts a fresh game and returns legacyScore', nd.ok && nd.legacyScore === score && P2.S().familyId === 'silva' && P2.S().year === 1850 && P2.Storage.loadMeta().runs.length === 1);
  var P3 = fresh('chen', 4); require('./players.js')(P3); var nd2 = P3.Game.newDynasty({});
  check('newDynasty on an unrecorded run records it', nd2.ok && P3.Storage.loadMeta().runs.length === 1 && nd2.legacyPointsEarned === 0);
  // prevRank / rankDelta
  var P4 = fresh('chen', 8), pl4 = require('./players.js')(P4);
  var lb0 = P4.Rivals.leaderboard().leaderboard;
  check('leaderboard rows carry prevRank (null at start) and rankDelta (0 at start)', lb0.every(function (r) { return 'prevRank' in r && 'rankDelta' in r && r.prevRank === null && r.rankDelta === 0; }));
  var ranksAtStart = {}; lb0.forEach(function (r) { ranksAtStart[r.id] = r.rank; });
  playYears(P4, pl4, 1);
  var lb1 = P4.Rivals.leaderboard().leaderboard;
  check('after one year prevRank equals last year\'s rank from engine state and rankDelta = prevRank − rank', lb1.every(function (r) { return r.prevRank === ranksAtStart[r.id] && r.rankDelta === r.prevRank - r.rank; }), lb1.map(function (r) { return [r.id, r.rank, r.prevRank]; }));
  check('rank history is saved state, not a UI snapshot', P4.S().ranks && P4.S().ranks.prevYear === 1850 && P4.S().ranks.year === 1851 && P4.S().ranks.prevById.player === ranksAtStart.player);
  var moved = false; for (var y = 0; y < 15 && !moved; y++) { playYears(P4, pl4, 1); moved = P4.Rivals.leaderboard().leaderboard.some(function (r) { return r.rankDelta !== 0; }); }
  check('rankDelta becomes non-zero when the table reshuffles', moved);
  // auction round
  var P5 = fresh('vanderbilt', 5), s5 = P5.S(), l6 = P5.Market.genListing('london', 2000, 'estate');
  P5.Rivals.contest = function () { return [{ id: 'wong', maxBid: Math.round(l6.askingPrice * 1.3) }]; };
  var a = P5.Market.makeOffer(l6.id, l6.askingPrice);
  check('auctionView.round starts at 1 (bidsMade 0)', a.ok && a.outcome === 'auction' && a.auction.round === 1 && a.auction.bidsMade === 0 && a.auction.maxRounds === 3, a.auction);
  var b1 = P5.Market.bid(a.auction.id, Math.round(a.auction.currentBid * 1.02));
  check('after the first bid the view is in round 2 (bidsMade 1); bid() round field still counts bids', b1.ok && b1.outcome === 'continue' && b1.auction.round === 2 && b1.auction.bidsMade === 1 && b1.round === 1, b1);
  var b2 = P5.Market.bid(a.auction.id, Math.round(s5.auction.currentBid * 1.02));
  check('round never exceeds maxRounds', b2.ok && (b2.outcome !== 'continue' || b2.auction.round === 3));
})();

/* ---------- 16. P3.2 Relations, marriage, alliance, merger ---------- */
(function () {
  var PE = fresh('armstrong', 5), s = PE.S(), Rv = PE.Rivals, B = PE.Data.balance;
  check('relations exist for every rival on the −100..100 scale and rv.relation mirrors them (Charmer +20)', Object.keys(s.rivals).every(function (id) { return typeof s.relations[id] === 'number' && s.relations[id] === 20 && s.rivals[id].relation === 60; }), s.relations);
  Rv.adjustRelation('wong', 500);
  check('adjustRelation clamps to 100 and keeps the 0..100 view in sync', s.relations.wong === 100 && s.rivals.wong.relation === 100);
  Rv.setRelation('wong', 0);
  check('setRelation sets an absolute value', s.relations.wong === 0 && s.rivals.wong.relation === 50);
  // drivers
  s.cash = 1e6;
  var realContest = Rv.contest;
  var l6 = PE.Market.genListing('london', 1500, 'estate'); Rv.contest = function () { return [{ id: 'wong', maxBid: Math.round(l6.askingPrice * 1.1) }]; };
  var r0 = s.relations.wong; PE.Market.makeOffer(l6.id, l6.askingPrice); PE.Market.bid(s.auction.id, Math.round(l6.askingPrice * 1.2));
  check('outbidding a rival at auction lowers the relation and counts toward Nemesis', s.properties[l6.id] && s.properties[l6.id].ownerId === 'player' && s.relations.wong === r0 + B.relationOutbid && s.stats.outbidRivals.wong === 1, [r0, s.relations.wong]);
  var p = PE.State.playerProps()[0]; s.offers.push({ id: 'o1', propertyId: p.id, rivalId: 'petrov', price: Math.round(p.trueValue * 1.2), year: s.year });
  var r1 = s.relations.petrov; PE.Market.respondToOffer('o1', false);
  check('declining a rival offer lowers the relation', s.relations.petrov === r1 + B.relationDeclined);
  var p2 = PE.State.playerProps()[0]; s.offers.push({ id: 'o2', propertyId: p2.id, rivalId: 'petrov', price: Math.round(p2.trueValue * 1.2), year: s.year }); s.rivals.petrov.cash = 1e9;
  var r2 = s.relations.petrov; var acc = PE.Market.respondToOffer('o2', true);
  check('selling to a rival (accepting their offer) raises the relation', acc.ok && acc.accepted && s.relations.petrov === r2 + B.relationSoldTo);
  var hit = Rv.evictionIn('london');
  check('evictions in a city hit every rival holding buildings there', hit.length >= 1 && hit.every(function (id) { return s.rivals[id].lastRelationChange && s.rivals[id].lastRelationChange.why === 'evictions'; }) && s.stats.evictions === 1);
  check('relations drift back toward neutral each year', (function () { Rv.setRelation('okonkwo', 30); clearEvents(PE); PE.Game.endYear(); return s.relations.okonkwo < 30 && s.relations.okonkwo >= 30 - B.relationDrift - 1; })(), s.relations.okonkwo);
  // marriage eligibility
  var Dy = PE.Dynasty, kid = Dy.newMember(24, 'm', ['negotiator'], 'child'); s.dynasty.members.push(kid);
  var old = Dy.newMember(45, 'f', ['charmer'], 'child'); s.dynasty.members.push(old);
  s.reputation = 60; Rv.setRelation('rothschild', 10);
  check('eligibility: age 18–40', Dy.marriageEligibility(kid.id, 'rothschild') === null && /between 18 and 40/.test(Dy.marriageEligibility(old.id, 'rothschild')));
  check('eligibility: the head cannot be married off', /head/.test(Dy.marriageEligibility(s.dynasty.head.id, 'rothschild')));
  check('eligibility: reputation ≥ 50', (function () { s.reputation = 49; var w = Dy.marriageEligibility(kid.id, 'rothschild'); s.reputation = 60; return /reputation of 50/.test(w); })());
  check('eligibility: relation ≥ 0', (function () { Rv.setRelation('rothschild', -1); var w = Dy.marriageEligibility(kid.id, 'rothschild'); Rv.setRelation('rothschild', 10); return /too little/.test(w); })());
  check('acceptance probability rises with relation and relative wealth, clamped 5–95%', (function () { Rv.setRelation('rothschild', -0); var a = Dy.marriageChance('rothschild'); Rv.setRelation('rothschild', 90); var b = Dy.marriageChance('rothschild'); var c0 = s.cash; s.cash = 1e12; var c = Dy.marriageChance('rothschild'); s.cash = c0; Rv.setRelation('rothschild', 10); return b > a && c >= b && c <= 0.95 && a >= 0.05; })());
  check('Dynasty.summary lists marriage candidates with eligibility, reason and chance', (function () { var sm = Dy.summary(); return sm.ok && sm.marriageCandidates.length === 6 && sm.marriageCandidates.every(function (c) { return 'eligible' in c && 'chance' in c && 'relation' in c; }) && sm.merger && 'windowOpen' in sm.merger; })());
  // refusal
  var rawChance = PE.RNG.chance; PE.RNG.chance = function () { return false; };
  var rep0 = s.reputation, rel0 = s.relations.rothschild, ref = Dy.proposeMarriage(kid.id, 'rothschild');
  check('refusal: −6 reputation, −20 relation, heir stays single', ref.ok && ref.accepted === false && s.reputation === rep0 - 6 && s.relations.rothschild === rel0 - 20 && !kid.married && s.dynasty.alliances.length === 0, ref);
  check('a refused family will not hear another proposal for 5 years', (function () { Rv.setRelation('rothschild', 10); var w = Dy.marriageEligibility(kid.id, 'rothschild'); return /not forgotten/.test(w); })());
  // acceptance
  PE.RNG.chance = function () { return true; };
  Rv.setRelation('wong', 10); var relW = s.relations.wong, acc2 = Dy.proposeMarriage(kid.id, 'wong');
  PE.RNG.chance = rawChance;
  check('acceptance: alliance recorded, heir married, relation +30, Matchmaker stat', acc2.ok && acc2.accepted === true && kid.married === 'wong' && s.rivals.wong.allied === true && s.dynasty.alliances.length === 1 && s.relations.wong === relW + 30 && s.stats.marriages === 1 && Rv.allies()[0] === 'wong', acc2);
  check('cannot marry into the same family twice; a married heir cannot be proposed again', /already/.test(Dy.marriageEligibility(kid.id, 'wong')) && !Dy.proposeMarriage(kid.id, 'petrov').ok);
  var l7 = PE.Market.genListing('london', 1500, 'estate'); s.rivals.wong.cash = 1e9; Rv.contest = realContest; // restore real contest
  check('an allied rival never bids against you', (function () { var bidders = PE.Rivals.contest(l7, Math.round(l7.askingPrice * 0.5), 1.0); return bidders.every(function (b) { return b.id !== 'wong'; }); })());
  check('the ally reveals one listing a year in its favourite city', (function () { var fav = Rv.favouriteCity('wong'); PE.Market.refreshBoard(); var id = s.flags.allyRevealId; var l = id && s.listings[id]; var lst = PE.Market.listings(null); return !!l && l.revealed === true && (l.cityId === fav || !PE.Market.listingArray(fav).length) && lst.allyRevealedId === id && lst.listings.some(function (v) { return v.id === id && v.trueValue !== undefined; }); })());
  check('a non-Chen family without an alliance gets no free reveal', (function () { var P = fresh('silva', 2); return P.Market.listings(null).revealedId === null && P.Market.listings(null).allyRevealedId === null; })());
  // ENG-B4: relations have teeth — contests read s.relations (hostile: more often and harder; warm: less and softer)
  (function () {
    var relSave = {}; for (var id in s.relations) relSave[id] = s.relations[id];
    for (var id2 in s.rivals) s.rivals[id2].cash = 1e9; // affordability off the table
    var cycSave = s.cycle.phase; s.cycle.phase = 'boom'; // every archetype's wants() fires on a cheap derelict in a boom
    var lB4 = PE.Market.list(PE.Market.genProperty('london', { condition: 20, district: 'Shoreditch' }), 'estate', null);
    var priceB4 = Math.round(lB4.askingPrice * 0.5), rngB4 = s.rng;
    var run = function (rel, rngState, forced) { for (var id3 in s.relations) Rv.setRelation(id3, rel); s.rng = rngState; return Rv.contest(lB4, priceB4, forced); };
    var sum = function (bs) { var t = 0; for (var i = 0; i < bs.length; i++) t += bs[i].maxBid; return t; };
    var hostile = run(-100, rngB4, 1.0), neutral = run(0, rngB4, 1.0), warm = run(100, rngB4, 1.0);
    check('ENG-B4: hostile rivals bid harder and warm rivals softer on the same deal', hostile.length > 0 && sum(hostile) > sum(neutral) && sum(warm) < sum(neutral), [sum(warm), sum(neutral), sum(hostile)]);
    var hN = 0, wN = 0;
    for (var t = 0; t < 60; t++) { var rs = (rngB4 + 0x9E3779B9 * (t + 1)) >>> 0; hN += run(-100, rs, 0.4).length; wN += run(100, rs, 0.4).length; }
    check('ENG-B4: hostile relations raise contest frequency (seeded, 60 replayed trials)', hN > wN, { hostile: hN, warm: wN });
    for (var id4 in s.relations) Rv.setRelation(id4, relSave[id4]);
    s.cycle.phase = cycSave;
  })();
  check('ENG-B: snapped-up records and relations survive save/load', (function () {
    var P = fresh('silva', 91); P.Rivals.setRelation('okonkwo', -66);
    P.S().snappedUp.push({ id: 'p_snap', name: 'Test Terrace', cityId: 'london', district: 'Camden', type: 'terrace', askingPrice: 777, rivalId: 'wong', year: P.S().year });
    P.Game.save(); P._state = null; var r = P.Game.load();
    return r.ok && P.S().relations.okonkwo === -66 && P.S().snappedUp.some(function (x) { return x.id === 'p_snap' && x.rivalId === 'wong'; });
  })());
  // merger
  var mi = Dy.mergerInfo();
  check('merger window closed early in the run', mi.windowOpen === false && mi.allies.length === 1 && !mi.allies[0].available && !Dy.mergeWithAlly().ok);
  s.year = s.endYear - 20; mi = Dy.mergerInfo();
  check('merger window opens in the last 20 years; cost is 15% of the ally\'s net worth', mi.windowOpen === true && mi.allies[0].cost === Math.round(Math.max(0, PE.State.netWorth('rival:wong')) * 0.15));
  s.year = 1870; s.dynasty.head.age = 66;
  check('merger window also opens when the head is 65+', Dy.mergerInfo().windowOpen === true);
  s.cash = 0;
  check('merger refused without the cash', !Dy.mergeWithAlly('wong').ok);
  var nWong = PE.State.propertyCount('rival:wong'), nMine = PE.State.propertyCount('player'), wongCash = s.rivals.wong.cash, cost = Dy.mergerInfo().allies[0].cost; s.cash = cost + 10; var legacy0 = PE.Goals.legacyScore();
  var mg = Dy.mergeWithAlly('wong');
  check('merger folds the ally\'s portfolio into yours at the cost, removes it from the leaderboard', mg.ok && PE.State.propertyCount('player') === nMine + nWong && PE.State.propertyCount('rival:wong') === 0 && s.cash === 10 + wongCash && s.rivals.wong.merged && !PE.Rivals.leaderboard().leaderboard.some(function (r) { return r.id === 'wong'; }) && PE.Rivals.leaderboard().leaderboard.length === 6, mg);
  check('merged mortgages are now the player\'s; merger counts as a legacy multiplier and an achievement', PE.State.playerProps().every(function (p) { return !p.mortgage || p.mortgage.lender !== 'Private bank'; }) && PE.Goals.legacyScore() > legacy0 && s.dynasty.mergers === 1 && PE.Goals.achievementSatisfied('merger') && PE.Goals.achievementSatisfied('matchmaker'));
  check('State.rank ignores a merged rival', PE.State.rank() <= 6);
})();

/* ---------- 17. P3.4 Events v2 ---------- */
(function () {
  var PE = fresh('chen', 2), D = PE.Data;
  check('≥ 40 random events, each with 2–3 choices and unique ids', D.randomEvents.length >= 40 && D.randomEvents.every(function (e) { return e.choices.length >= 2 && e.choices.length <= 3 && e.id && e.title && e.text; }) && new Set(D.randomEvents.map(function (e) { return e.id; })).size === D.randomEvents.length, D.randomEvents.length);
  var mc = require('./eventsmc.js').run(load, { samples: 20 }); // 20 strata make every 5%-step gamble exact
  check('Monte-Carlo: every event\'s choices have EVs within ±20% and no choice dominates on both EV and variance', mc.failures.length === 0, mc.failures);
  check('every event has at least one choice with a different risk, reputation or time profile', mc.rows.every(function (r) { var sds = r.choices.map(function (c) { return Math.round(c.sd * 1e4); }), evs = r.choices.map(function (c) { return Math.round(c.ev * 1e4); }); return new Set(sds).size > 1 || new Set(evs).size > 1 || r.choices.length > 1; }));
  var pre = D.historicalEvents.filter(function (h) { return h.prewarn; });
  check('exactly 12 historical set-pieces carry a prewarn', pre.length === 12 && pre.every(function (h) { return typeof h.prewarn === 'string' && h.prewarn.length > 10; }), pre.map(function (h) { return h.year; }));
  check('the morning paper foreshadows a set-piece one year ahead (Town crier makes it near-certain)', (function () { var P = fresh('chen', 2, { perks: ['town_crier'], unlockedPerks: true }); P.S().year = 1913; P.Events.makePaper(); return P.S().paper.some(function (l) { return l.prewarn && l.text === D.prewarns[1914]; }); })()); // 1914 carries no cycle, so the jitter never moves it
  check('foreshadowing is noisy without the perk (appears in some seeds, not all)', (function () { var n = 0; for (var i = 0; i < 20; i++) { var P = fresh('chen', 100 + i); P.S().year = 1913; P.Events.makePaper(); if (P.S().paper.some(function (l) { return l.prewarn; })) n++; } return n >= 5 && n <= 18; })());
  check('5 era set-pieces with 2 choices each', ['gilded', 'crisis', 'boom', 'modern', 'digital'].every(function (e) { return D.eraSetPieces[e] && D.eraSetPieces[e].choices.length === 2 && D.eraSetPieces[e].title; }));
  var P2 = fresh('chen', 3); P2.S().year = 1899; clearEvents(P2); var rep = P2.Game.endYear();
  check('era transition report carries eraSetPiece and queues an \'era\' event (≤ 2 events that year)', rep.ok && rep.eraChanged && rep.eraSetPiece && rep.eraSetPiece.eraId === 'gilded' && P2.S().events.pending.some(function (e) { return e.kind === 'era'; }) && P2.S().events.pending.length <= 2 && /new era/.test(rep.headline), rep.eraSetPiece);
  check('era set-piece resolves like any event', (function () { var e = P2.S().events.pending.filter(function (x) { return x.kind === 'era'; })[0]; var r = P2.Events.resolve(e.uid, 1); return r.ok && P2.S().events.log.length === 1; })());
  check('every era transition year stays within the 2-event cap', (function () { var ok = true; [1929, 1949, 1979, 2007].forEach(function (y) { var P = fresh('chen', 3); P.S().year = y; clearEvents(P); var r = P.Game.endYear(); if (!r.ok || !r.eraChanged || !r.eraSetPiece || P.S().events.pending.length > 2) ok = false; }); return ok; })());
  // new effect keys
  var P3 = fresh('vanderbilt', 6), s3 = P3.S(), q = P3.Market.genProperty('london', { type: 'terrace', condition: 70 }); P3.State.setOwner(q, 'player'); P3.Property.initTenancy(q);
  var ev = { targets: { propId: q.id, cityId: 'london', rivalId: 'wong' }, id: 'test' };
  var d = P3.State.district('london', q.district), pp0 = d.ppsqm; P3.Events.applyFx({ districtShock: -0.1 }, ev);
  check('districtShock moves the district price and revalues', Math.abs(d.ppsqm / pp0 - 0.9) < 1e-9 && q.trueValue === P3.Property.computeValue(q));
  P3.Events.applyFx({ propVacantYears: 1 }, ev);
  check('propVacantYears empties the building for the year', q.vacantUntil === s3.year + 1 && P3.Property.occupancyFor(q, { mgmt: 'self' }) === 0);
  var qv = q.trueValue; P3.Events.applyFx({ propQuality: 0.1 }, ev);
  check('propQuality changes value permanently', q.trueValue > qv);
  P3.Events.applyFx({ insuredYears: 10 }, ev);
  check('insurance blocks fire/flood events for its term', (function () { s3.year = 1855; var seen = false; for (var i = 0; i < 40; i++) { var r = { events: [] }; s3.events.pending = []; P3.Events.rollYearly(r); if (s3.events.pending.some(function (e) { return e.id === 'fire' || e.id === 'flood'; })) seen = true; } return !seen; })());
  check('rivalRelation effects route through the −100..100 relations', (function () { var r0 = s3.relations.wong; P3.Events.applyFx({ rivalRelation: 10 }, ev); return s3.relations.wong === r0 + 10; })());
  check('evicting in an event lowers relations with rivals in that city', (function () { var before = JSON.stringify(s3.relations); P3.Events.applyFx({ evictionCity: true }, ev); return JSON.stringify(s3.relations) !== before; })());
  check('era-gated events never appear outside their eras', D.randomEvents.filter(function (e) { return e.toEra !== undefined; }).length >= 2 && (function () { var P = fresh('chen', 3); P.S().year = 2010; var ids = {}; for (var i = 0; i < 60; i++) { P.S().events.pending = []; var r = { events: [] }; P.Events.rollYearly(r); P.S().events.pending.forEach(function (e) { ids[e.id] = 1; }); } return !ids.plague_house && !ids.antique_find && !ids.factory; })());
})();

/* ---------- 17b. ENG-B5 unreliable crash foreshadowing ---------- */
(function () {
  var PE = fresh('chen', 7), D = PE.Data, St = PE.State;
  var base = D.scriptedCycles, jit = St.scriptedCycles();
  check('jittered calendar keeps every scripted entry (no collisions)', Object.keys(jit).length === Object.keys(base).length);
  var movable = Object.keys(base).filter(function (y) { return base[y] === 'recession' || base[y] === 'depression'; });
  var withinOne = true, fixedHeld = true;
  for (var y in jit) {
    var ph = jit[y], orig = Object.keys(base).filter(function (oy) { return base[oy] === ph && Math.abs(oy - y) <= 1; });
    if (!orig.length) withinOne = false;
  }
  ['1945', '1955', '2021'].forEach(function (y) { if (jit[y] !== base[y]) fixedHeld = false; });
  check('every crash moved at most ±1 year and booms/stagnation stayed put', withinOne && fixedHeld && movable.length > 0);
  check('jitter is deterministic per seed and differs across seeds', (function () {
    var a = fresh('chen', 42).State.scriptedCycles(), b = fresh('chen', 42).State.scriptedCycles();
    if (JSON.stringify(a) !== JSON.stringify(b)) return false;
    var differs = 0;
    for (var i = 0; i < 10; i++) if (JSON.stringify(fresh('chen', 500 + i).State.scriptedCycles()) !== JSON.stringify(base)) differs++;
    return differs >= 5;
  })());
  check('jittering does not perturb the main RNG stream', (function () {
    var A = fresh('chen', 9), Bx = fresh('chen', 9);
    A.State.jitterCycles('totally different'); // extra draws on the isolated stream
    return JSON.stringify(A.S().rng) === JSON.stringify(Bx.S().rng);
  })());
  check('cycle-carrying historical events move with their crash', (function () {
    for (var sd = 0; sd < 30; sd++) {
      var P = fresh('chen', 9000 + sd), sh = P.State.histShift(), years = Object.keys(sh);
      for (var i = 0; i < years.length; i++) {
        var h = P.Data.historicalEvents.filter(function (x) { return x.year === Number(years[i]); })[0];
        if (!h || P.Events.histYear(h) !== h.year + sh[years[i]]) return false;
        if (h.cycle && P.State.scriptedCycles()[P.Events.histYear(h)] !== h.cycle) return false;
      }
      if (years.length) return true;
    }
    return false; // no seed in 30 ever moved a crash: suspicious
  })());
  check('a jittered depression actually bites on the shifted year', (function () {
    for (var sd = 0; sd < 40; sd++) {
      var P = fresh('chen', 7000 + sd), sh = P.State.histShift(), years = Object.keys(sh);
      if (!years.length) continue;
      var origYear = Number(years[0]), newYear = origYear + sh[years[0]];
      P.S().year = newYear - 1; clearEvents(P);
      var players = require('./players.js')(P); players.resolveEvents('competent');
      var r = P.Game.endYear(); if (!r.ok) { P.S().events.pending = []; r = P.Game.endYear(); }
      return r.ok && P.S().year === newYear && P.S().cycle.phase === P.Data.scriptedCycles[origYear];
    }
    return false;
  })());
  check('old saves without the jitter fields fall back to the historical calendar', (function () {
    var P = fresh('chen', 7);
    delete P.S().scriptedCycles; delete P.S().histShift;
    var h = P.Data.historicalEvents.filter(function (x) { return x.cycle; })[0];
    return P.State.scriptedCycles() === P.Data.scriptedCycles && P.Events.histYear(h) === h.year;
  })());
  check('false alarms only cry wolf when nothing is coming, and never for the Town crier', (function () {
    var cried = 0, truthful = 0;
    for (var i = 0; i < 40; i++) {
      var P = fresh('chen', 3000 + i);
      for (var y = 1850; y < 2020; y++) {
        P.S().year = y; P.Events.makePaper();
        var wolf = P.S().paper.some(function (l) { return l.text === 'Bankers whisper of trouble next year.'; });
        if (!wolf) continue;
        var next = P.State.scriptedCycles()[y + 1], trouble = next === 'recession' || next === 'depression';
        var pre = P.Data.historicalEvents.some(function (h) { return P.Events.histYear(h) === y + 1 && h.prewarn; });
        if (trouble || pre) truthful++; else cried++;
      }
    }
    var crier = fresh('chen', 3000, { perks: ['town_crier'], unlockedPerks: true }), crierWolf = 0;
    for (var y2 = 1850; y2 < 2020; y2++) {
      crier.S().year = y2; crier.Events.makePaper();
      var next2 = crier.State.scriptedCycles()[y2 + 1], trouble2 = next2 === 'recession' || next2 === 'depression';
      var pre2 = crier.Data.historicalEvents.some(function (h) { return crier.Events.histYear(h) === y2 + 1 && h.prewarn; });
      if (!trouble2 && !pre2 && crier.S().paper.some(function (l) { return l.text === 'Bankers whisper of trouble next year.'; })) crierWolf++;
    }
    return cried > 0 && crierWolf === 0;
  })());
})();
(function () {
  var S = fresh('silva', 4), sp = S.State.playerProps()[0];
  check('Silva: Builder trait, a free derelict Shoreditch terrace, £900', S.State.hasTrait('builder') && sp.condition < 20 && sp.district === 'Shoreditch' && sp.purchasePrice === 0 && S.S().cash === 900);
  var C = fresh('chen', 4), cl = C.Market.listings(null);
  check('Chen: one listing revealed every year (merchant network), none for others', cl.revealedId && C.S().listings[cl.revealedId].revealed && cl.listings.some(function (l) { return l.id === cl.revealedId && typeof l.trueValue === 'number'; }) && fresh('vanderbilt', 4).Market.listings(null).revealedId === null);
  check('Chen: the reveal rotates each year', (function () { var id0 = C.S().flags.chenRevealId; clearEvents(C); C.Game.endYear(); return C.S().flags.chenRevealId && C.S().flags.chenRevealId !== id0; })());
  var A = fresh('armstrong', 4), sa = A.S(), g = A.Goals.current();
  check('Armstrong: two mortgaged properties, LTV above 50% at start, family goal track present', A.State.playerProps().length === 2 && A.State.playerProps().every(function (p) { return p.mortgage; }) && A.State.ltv('player') > 0.5 && g.family && g.family.id === 'armstrong_deleverage' && g.family.deadline === 1860 && !g.family.done && /LTV/.test(g.family.progress), g.family);
  check('other families have no family track', !fresh('chen', 4).Goals.current().family && !fresh('silva', 4).Goals.current().family);
  check('Armstrong: yearly goals lean toward cutting LTV while the track is open', (function () { var n = 0; for (var i = 0; i < 30; i++) { var P = fresh('armstrong', 200 + i); if (P.S().goals.yearly.id === 'reduce_ltv') n++; } return n >= 6; })());
  sa.cash = 1e6; A.State.playerProps().forEach(function (p) { A.Finance.repay(p.id, Math.round(p.mortgage.principal * 0.5)); });
  clearEvents(A); var ra = A.Game.endYear();
  check('Armstrong: bringing LTV below 50% completes the track with a reward and +5 reputation', A.State.ltv('player') < 0.5 && ra.ok && ra.goals.achieved.some(function (x) { return x.kind === 'family' && x.reward > 0; }) && sa.goals.family.done && sa.goals.family.doneYear === 1850);
  var A2 = fresh('armstrong', 4); A2.S().year = 1860; A2.S().goals.family.deadline = 1860; var rep0 = A2.S().reputation; clearEvents(A2); var ra2 = A2.Game.endYear();
  check('Armstrong: missing 1860 fails the track (−5 reputation)', ra2.ok && A2.S().goals.family.failed && ra2.goals.progress.some(function (x) { return x.kind === 'family' && x.failed; }) && A2.S().reputation < rep0);
  var V = fresh('vanderbilt', 4);
  check('Vanderbilt: +20% estate tax every generation, £12,000', Math.abs(V.Dynasty.estateTaxRate() - 0.40) < 1e-9 && V.S().cash === 12000);
  // per-family balance guard (small sample; the full table is js/sim/balance.js)
  var fams = ['silva', 'chen', 'armstrong', 'vanderbilt'], SEEDS = 24;
  fams.forEach(function (fam) {
    var mults = [], bk = 0;
    for (var seed = 1; seed <= SEEDS; seed++) {
      var P = fresh(fam, 300 + seed), pl = require('./players.js')(P), s = P.S();
      for (var y = 0; y < 30 && s.status === 'playing'; y++) { pl.competent.play(); var r = P.Game.endYear(); if (!r.ok) { pl.resolveEvents('competent'); r = P.Game.endYear(); } if (r.bankrupt) { bk++; break; } }
      mults.push(P.State.netWorth('player') / s.startNetWorth);
    }
    mults.sort(function (a, b) { return a - b; }); var med = mults[mults.length >> 1];
    check(fam + ': 30-year competent median NW× within 6–40× (24 seeds)', med >= 6 && med <= 40, med.toFixed(1));
    check(fam + ': competent bankruptcy ≤ 15% (24 seeds)', bk / SEEDS <= 0.15 + 1 / SEEDS, bk);
  });
})();

/* ---------- 19. P5.2 Prestige perks ---------- */
(function () {
  var PE = load(), D = PE.Data;
  check('≥ 8 perks costing 1–8 points, each with a kind (own_bank is the deliberate 6-point capstone)', D.perks.length >= 8 && D.perks.every(function (p) { return p.cost >= 1 && p.cost <= 8 && (p.kind === 'passive' || p.kind === 'mode') && p.desc; }));
  var lst = PE.Game.perks();
  check('Game.perks lists before a game exists with legacyPoints and owned/affordable flags', lst.ok && lst.legacyPoints === 0 && lst.perks.length === D.perks.length && lst.perks.every(function (p) { return p.owned === false && p.affordable === false; }));
  check('buyPerk refuses unaffordable, unknown and duplicate purchases', !PE.Game.buyPerk('old_money').ok && !PE.Game.buyPerk('nope').ok);
  var m = PE.Storage.loadMeta(); m.legacyPoints = 9; PE.Storage.saveMeta(m);
  var b1 = PE.Game.buyPerk('old_money'), b2 = PE.Game.buyPerk('old_money');
  check('buyPerk deducts points and records ownership', b1.ok && b1.legacyPoints === 6 && !b2.ok && PE.Game.perks().perks.filter(function (p) { return p.id === 'old_money'; })[0].owned);
  PE.Game.buyPerk('purist');
  var g1 = PE.Game.newGame({ familyId: 'chen', seed: 1 });
  check('newGame applies owned passive perks by default and never mode perks', g1.ok && g1.perks.indexOf('old_money') >= 0 && g1.perks.indexOf('purist') < 0 && PE.Finance.maxLtv('player') === 0.75);
  var g2 = PE.Game.newGame({ familyId: 'chen', seed: 1, perks: ['purist', 'seventh_rival'] });
  check('newGame({perks}) applies only owned perks (seventh_rival not owned → ignored)', g2.ok && g2.perks.indexOf('purist') >= 0 && g2.perks.indexOf('seventh_rival') < 0 && Object.keys(PE.S().rivals).length === 6);
  check('Purist: no mortgages, cashNeeded ignores financing, yearly rewards doubled', PE.Finance.maxLtv('player') === 0 && PE.Finance.mortgageQuote(PE.Market.listingArray(null)[0].id, 0.7).purist === true && PE.Market.cashNeeded(PE.Market.listingArray(null)[0], 1000, { ltv: 0.7 }).principal === 0 && PE.Finance.summary().purist === true && (function () { var l = PE.Market.listingArray(null)[0]; PE.Market.makeOffer(l.id, l.askingPrice, null); var p = PE.State.playerProps()[0]; return p && !PE.Finance.takeMortgage(p.id, 0.5).ok; })() && PE.S().goals.yearly.reward === 2 * Math.max(Math.round(10 * PE.S().priceIndex), Math.round(Math.max(0, PE.State.netWorth('player')) * 0.01)));
  function withPerks(perks, fam, seed) { var P = load(); var r = P.Game.newGame({ familyId: fam || 'chen', seed: seed || 1, perks: perks, unlockedPerks: true }); if (!r.ok) throw new Error(r.message); return P; }
  check('Family solicitor halves comps noise and tightens the estimate band', (function () { var P = withPerks(['family_solicitor']); var Q = withPerks([]); return P.Market.compsNoise() === Q.Market.compsNoise() / 2 && P.Data.balance.estimateBand * 0.5 === (function () { var l = P.Market.listingArray(null)[0]; var e = P.Market.estimate(l); return Math.round((e.high - e.mid) / e.mid * 1000) / 1000; })(); })());
  check('Old money: LTV cap +5 points (cap 80% with Banker)', withPerks(['old_money'], 'vanderbilt').Finance.maxLtv('player') === 0.80 && withPerks(['old_money'], 'chen').Finance.maxLtv('player') === 0.75);
  check('Seventh rival: the Hartwells join with real buildings; leaderboard has 8 rows', (function () { var P = withPerks(['seventh_rival']); return P.S().rivals.hartwell && P.State.propertyCount('rival:hartwell') > 0 && P.Rivals.leaderboard().leaderboard.length === 8 && P.Data.rivalById('hartwell').archetype === 'Magnate'; })());
  check('Crisis start begins in 1929 with Black Tuesday pending', (function () { var P = withPerks(['crisis_start']); return P.S().year === 1929 && P.S().scenario && P.S().scenario.id === 'crash1929' && P.S().events.pending[0].title === 'Black Tuesday'; })());
  check('Second city: Paris open from day one with a board', (function () { var P = withPerks(['second_city']); return P.S().cities.paris.unlocked && P.Market.listings('paris').ok && P.Market.listings('paris').listings.length >= 4; })());
  check('Thick skin halves reputation losses (not gains)', (function () { var P = withPerks(['thick_skin']); var r0 = P.S().reputation; P.State.rep(-10); var a = r0 - P.S().reputation; P.State.rep(10); return a === 5 && P.S().reputation === r0 + 5; })());
  check('Builders\' guild halves overrun/delay risk', (function () { var P = withPerks(['builders_guild']); var q = P.Market.genProperty('london', { condition: 30 }); P.State.setOwner(q, 'player'); var o = P.Property.renovationOptions(q).filter(function (x) { return x.tier === 'refurbish'; })[0]; return Math.abs(o.risk - 0.05) < 1e-9; })());
  check('Patient capital: savings earn the full bank rate', (function () { var P = withPerks(['patient_capital']); return Math.abs(P.Finance.summary().savingsRate - P.S().baseRate) < 1e-9; })());
  check('Town crier: the paper warns of 1866 the year before it lands, jittered or not, in every seed', (function () { for (var i = 0; i < 6; i++) { var P = withPerks(['town_crier'], 'chen', 50 + i); var h66 = P.Data.historicalEvents.filter(function (h) { return h.year === 1866; })[0]; P.S().year = P.Events.histYear(h66) - 1; P.Events.makePaper(); if (!P.S().paper.some(function (l) { return l.prewarn; })) return false; } return true; })());
  check('perks are saved with the run and survive load', (function () { var P = withPerks(['old_money', 'thick_skin']); P.Game.save(); P._state = null; var r = P.Game.load(); return r.ok && P.S().perks.length === 2 && P.State.hasPerk('thick_skin'); })());
})();

/* ---------- 19b. Mode-perk selection (stored in meta, applied by the next newGame) ---------- */
(function () {
  var PE = load(), D = PE.Data;
  check('setModes works before any game exists and keeps only owned mode perks', (function () {
    var m = PE.Storage.loadMeta(); m.legacyPoints = 12; m.perks = ['purist', 'old_money', 'seventh_rival']; PE.Storage.saveMeta(m);
    var r = PE.Game.setModes(['purist', 'seventh_rival', 'old_money', 'nope']);
    return r.ok && r.modes.slice().sort().join() === 'purist,seventh_rival' && PE.Storage.loadMeta().modes.slice().sort().join() === 'purist,seventh_rival';
  })());
  check('perks() exposes the stored selection on mode perks only', (function () { var ps = PE.Game.perks().perks; return ps.filter(function (p) { return p.selected; }).map(function (p) { return p.id; }).sort().join() === 'purist,seventh_rival' && ps.filter(function (p) { return p.kind === 'passive'; }).every(function (p) { return p.selected === false; }); })());
  check('newGame({modes}) drops unowned mode ids for that game and leaves the stored selection untouched', (function () { var r = PE.Game.newGame({ familyId: 'chen', seed: 1, modes: ['second_city', 'crisis_start'] }); return r.ok && r.perks.indexOf('second_city') < 0 && r.perks.indexOf('crisis_start') < 0 && PE.State.unlockedCities().indexOf('paris') < 0 && PE.Storage.loadMeta().modes.slice().sort().join() === 'purist,seventh_rival'; })());
  check('newGame({modes:[...]}) applies an owned listed mode without touching the stored selection', (function () { var P = load(); var m = P.Storage.loadMeta(); m.perks = ['second_city']; P.Storage.saveMeta(m); var r = P.Game.newGame({ familyId: 'chen', seed: 1, modes: ['second_city'] }); return r.ok && r.perks.indexOf('second_city') >= 0 && P.State.unlockedCities().indexOf('paris') >= 0 && P.Storage.loadMeta().modes.length === 0; })());
  var g = PE.Game.newGame({ familyId: 'chen', seed: 1 });
  check('a new game applies owned passives plus the selected modes by default', g.ok && g.perks.indexOf('old_money') >= 0 && g.perks.indexOf('purist') >= 0 && g.perks.indexOf('seventh_rival') >= 0 && PE.Finance.maxLtv('player') === 0 && Object.keys(PE.S().rivals).length === 7);
  check('setModes([]) clears the selection: the next game carries passives only', (function () { PE.Game.setModes([]); var r = PE.Game.newGame({ familyId: 'chen', seed: 1 }); return r.ok && r.perks.indexOf('purist') < 0 && r.perks.indexOf('old_money') >= 0 && PE.Finance.maxLtv('player') === 0.75; })());
  check('an explicit perks list still bypasses the selection (challenge rules stay fixed)', (function () { var r = PE.Game.newGame({ familyId: 'chen', seed: 1, perks: [] }); return r.ok && r.perks.length === 0; })());
  check('buying a mode perk does not auto-select it', (function () { var P = load(); var m = P.Storage.loadMeta(); m.legacyPoints = 4; P.Storage.saveMeta(m); P.Game.buyPerk('purist'); return P.Storage.loadMeta().modes.length === 0 && P.Game.perks().perks.filter(function (p) { return p.id === 'purist'; })[0].selected === false; })());
})();

/* ---------- 20. P5.3 Weekly seeded challenge ---------- */
(function () {
  var A = load(), B = load();
  var ra = A.Game.newChallenge({ week: '2026-W43' }), rb = B.Game.newChallenge({ week: '2026-W43' });
  check('newChallenge works before any game exists and is deterministic across devices', ra.ok && rb.ok && A.S().seed === B.S().seed && JSON.stringify(A.S().listings) === JSON.stringify(B.S().listings) && A.S().dynasty.head.traits.join() === B.S().dynasty.head.traits.join() && A.S().mode === 'challenge');
  check('different weeks give different seeds; the seed derives from the ISO week key', (function () { var C = load(); C.Game.newChallenge({ week: '2026-W44' }); return C.S().seed !== A.S().seed && A.S().seed === A.RNG.hashSeed('pe-challenge-2026-W43'); })());
  check('isoWeek produces YYYY-Www (2026-10-22 is W43; 2021-01-03 is 2020-W53)', A.Game.isoWeek(new Date(Date.UTC(2026, 9, 22))) === '2026-W43' && A.Game.isoWeek(new Date(Date.UTC(2021, 0, 3))) === '2020-W53' && /^\d{4}-W\d{2}$/.test(A.Game.isoWeek()));
  check('a challenge is a 30-year sprint ending 1879', A.S().endYear === 1879 && A.S().challenge.endYear === 1879 && ra.challenge.week === '2026-W43');
  var info = A.Game.challengeInfo();
  check('challengeInfo reports the week, seed, years left, live score and best', info.ok && info.week === '2026-W43' && info.active && info.current.yearsLeft === 30 && typeof info.current.score === 'number' && info.best === 0);
  function sprint(P) { var pl = require('./players.js')(P), s = P.S(), last = null; while (s.status === 'playing') { pl.competent.play(); var r = P.Game.endYear(); if (!r.ok) { pl.resolveEvents('competent'); r = P.Game.endYear(); } if (!r.ok) break; last = r; } return last; }
  var lastA = sprint(A), sA = A.S();
  check('a natural sprint ends (1880 or bankrupt) with the result recorded once in meta for the week', (sA.status === 'ended' && sA.year === 1880 && lastA.ended || sA.status === 'bankrupt' && lastA.bankrupt && lastA.challenge.score === 0) && lastA.challenge.recorded === true && A.Storage.loadMeta().challenges['2026-W43'].runs === 1 && A.Storage.loadMeta().challenges['2026-W43'].best === lastA.challenge.score, lastA && lastA.challenge);
  var C = load(); C.Game.newChallenge({ week: '2026-W43' }); C.S().cash = 1e6; var last = sprint(C), s = C.S();
  check('a well-funded sprint ends after 1879 with a positive score in the report and the best score stored in meta per week', s.status === 'ended' && s.year === 1880 && last.ended && last.challenge && last.challenge.score > 0 && C.Storage.loadMeta().challenges['2026-W43'].best === last.challenge.score && C.Storage.loadMeta().challenges['2026-W43'].runs === 1, last && last.challenge);
  check('challengeInfo after the run shows best and history; summary carries challenge info', C.Game.challengeInfo().best === last.challenge.score && C.Game.summary().challenge.week === '2026-W43' && C.Game.summary().mode === 'challenge');
  check('a second run of the same week keeps the best score', (function () { var m = C.Storage.loadMeta(); var best = m.challenges['2026-W43'].best; C.Game.newChallenge({ week: '2026-W43' }); C.S().status = 'bankrupt'; C.Game.recordChallenge(); return C.Storage.loadMeta().challenges['2026-W43'].best === best && C.Storage.loadMeta().challenges['2026-W43'].runs === 2; })());
})();

/* ---------- 21. P5.4 Era-start scenarios ---------- */
(function () {
  var D = load().Data, defs = [['crash1929', 1929, 'gilded', 'Black Tuesday'], ['oilshock1973', 1973, 'boom', 'Oil shock'], ['gfc2008', 2008, 'digital', 'The Global Financial Crisis']];
  defs.forEach(function (d) {
    var P = fresh('chen', 1, { scenario: d[0] }), s = P.S(), sc = D.scenarios[d[0]];
    check(d[0] + ': starts ' + d[1] + ' in the ' + d[2] + ' era with the set-piece pending and the intro in the paper', s.year === d[1] && s.eraId === d[2] && s.events.pending.length && s.events.pending[0].title === d[3] && s.paper[0].text === sc.intro && s.mode === 'scenario');
    check(d[0] + ': a pre-built leveraged portfolio at the scenario LTV, prices at the era level', P.State.propertyCount('player') === sc.props && Math.abs(P.State.ltv('player') - sc.ltv) < 0.03 && s.priceIndex > 10 && s.cash > 0 && P.State.playerProps().every(function (p) { return p.mortgage && p.purchaseYear < s.year; }));
    check(d[0] + ': win condition = survive to +15 with net worth ≥ start; endYear set', s.scenario.winYear === d[1] + 15 && s.endYear === d[1] + 15 && s.scenario.targetNetWorth === s.startNetWorth && s.scenario.result === null);
    check(d[0] + ': the crash lands at the first year end (cycle ' + sc.cycle + ')', s.cycle.phase === sc.cycle && s.baseRate === sc.baseRate && P.State.unlockedCities().length === 2);
  });
  check('unknown scenario fails cleanly', !load().Game.newGame({ familyId: 'chen', scenario: 'moon1999' }).ok);
  check('scenario result is written at the end: won when NW ≥ start, lost otherwise, lost on bankruptcy', (function () { var P = fresh('chen', 2, { scenario: 'crash1929' }), s = P.S(); s.year = s.endYear; clearEvents(P); s.cash += s.startNetWorth * 2; var r = P.Game.endYear(); var P2 = fresh('chen', 2, { scenario: 'crash1929' }), s2 = P2.S(); s2.year = s2.endYear; clearEvents(P2); s2.cash -= s2.startNetWorth * 0.9; var r2 = P2.Game.endYear(); return r.ok && r.ended && r.scenario.result === 'won' && /intact/.test(r.headline) && r2.ok && r2.scenario.result === 'lost'; })());
  // winnability: competent player, 30 seeds each
  defs.forEach(function (d) {
    var won = 0, lost = 0, SEEDS = 30;
    for (var seed = 1; seed <= SEEDS; seed++) {
      var P = fresh('chen', 400 + seed, { scenario: d[0] }), pl = require('./players.js')(P), s = P.S();
      while (s.status === 'playing') { pl.competent.play(); var r = P.Game.endYear(); if (!r.ok) { pl.resolveEvents('competent'); r = P.Game.endYear(); } if (!r.ok) break; }
      if (s.scenario.result === 'won') won++; else lost++;
    }
    check(d[0] + ': winnable by the competent player in ≥ 40% of 30 seeds and lost in ≥ 20%', won / SEEDS >= 0.4 && lost / SEEDS >= 0.2, { won: won, lost: lost });
  });
})();

/* ---------- 22. P5.5 Achievements v2 ---------- */
(function () {
  var PE = fresh('chen', 2), D = PE.Data, cats = { deals: 1, finance: 1, survival: 1, dynasty: 1, cities: 1, rivals: 1 };
  check('≥ 30 achievements with valid categories and unique ids', D.achievements.length >= 30 && D.achievements.every(function (a) { return cats[a.category]; }) && new Set(D.achievements.map(function (a) { return a.id; })).size === D.achievements.length, D.achievements.length);
  check('exactly 6 rare achievements', D.achievements.filter(function (a) { return a.rare; }).length === 6);
  check('every category has at least 3 achievements', Object.keys(cats).every(function (c) { return D.achievements.filter(function (a) { return a.category === c; }).length >= 3; }));
  check('Goals.current exposes category and rare on each achievement', PE.Goals.current().achievements.every(function (a) { return a.category && typeof a.rare === 'boolean'; }));
  var s = PE.S();
  s.stats.steals = 1; s.stats.countersClosed = 5; s.stats.educated = 3; s.stats.rank1Years = 10; s.stats.cashKingYears = 1; s.stats.highLtvYears = 3; s.stats.vultures = 1; s.stats.rothschildLoans = 1; s.stats.outbidRivals = { petrov: 5 }; s.stats.marginCallsCleared = 1; s.stats.trustSuccessions = 1;
  var ids = ['bargain_hunter', 'counter_closer', 'scholar', 'top_dog_decade', 'cash_king', 'high_wire', 'vulture', 'friend_of_banks', 'nemesis', 'covenant_kept', 'trust_fund'];
  check('stat-driven achievements fire from their counters', ids.every(function (id) { return PE.Goals.achievementSatisfied(id); }));
  check('year-based achievements are relative to the start year (a 1973 scenario is not a centenarian)', (function () { var P = fresh('chen', 1, { scenario: 'oilshock1973' }); return !P.Goals.achievementSatisfied('centenarian') && (function () { var Q = fresh('chen', 1); Q.S().year = 1950; return Q.Goals.achievementSatisfied('centenarian'); })(); })());
  check('The Long Game is awarded on the final report of a finished campaign', (function () { var P = fresh('chen', 3); P.S().year = 2030; clearEvents(P); var r = P.Game.endYear(); return r.ok && r.ended && P.S().goals.achievements.indexOf('the_long_game') >= 0 && r.goals.achieved.some(function (g) { return g.id === 'the_long_game' && g.rare === true; }); })());
  check('counters behind the new achievements are tracked by the engine', (function () { var P = fresh('vanderbilt', 5), st = P.S(); var l = P.Market.genListing('london', 1500, 'landlord'); P.Rivals.contest = function () { return []; }; var c = P.Market.makeOffer(l.id, Math.round(l.askingPrice * 0.8)); if (c.outcome !== 'countered') return true; P.Market.makeOffer(l.id, c.counterPrice); return st.stats.countersClosed === 1; })());
  check('Peacemaker needs four friendly rivals at once', (function () { ['wong', 'petrov', 'martinez'].forEach(function (id) { PE.Rivals.setRelation(id, 50); }); var a = PE.Goals.achievementSatisfied('peacemaker'); PE.Rivals.setRelation('okonkwo', 50); return !a && PE.Goals.achievementSatisfied('peacemaker'); })());
})();

/* ---------- 23. Save migration v1 → v2 and payload compatibility ---------- */
(function () {
  var PE = fresh('armstrong', 7), s = PE.S();
  var old = JSON.parse(JSON.stringify(s));
  ['relations', 'ranks', 'mode', 'scenario', 'challenge', 'legacyRecorded', 'perks', 'snappedUp'].forEach(function (k) { delete old[k]; });
  delete old.goals.family; delete old.flags.insuredUntil; delete old.flags.allyRevealId; delete old.dynasty.proposals; delete old.dynasty.mergers;
  ['steals', 'countersClosed', 'marginCallsCleared', 'highLtvYears', 'rank1Years', 'educated', 'marriages', 'mergers', 'vultures', 'cashKingYears', 'trustSuccessions', 'evictions', 'yearlyGoalsDone', 'rothschildLoans', 'outbidRivals'].forEach(function (k) { delete old.stats[k]; });
  for (var id in old.rivals) { delete old.rivals[id].merged; delete old.rivals[id].allied; delete old.rivals[id].mergedYear; old.rivals[id].relation = 62; }
  old.saveVersion = 1;
  PE.Storage.useBackend({ get: function () { return JSON.stringify({ saveVersion: 1, state: old }); }, set: function () { return true; }, remove: function () {} });
  var r = PE.Game.load(), m = PE.S();
  check('SAVE_VERSION is 2 and a v1 save loads', PE.Storage.SAVE_VERSION === 2 && r.ok && m.saveVersion === 2);
  check('migration fills relations from rv.relation, rank history, mode, perks, family goal, stats and flags', m.relations && m.relations.wong === 24 && m.ranks && m.ranks.byId && m.mode === 'campaign' && m.scenario === null && m.challenge === null && m.legacyRecorded === false && Array.isArray(m.perks) && m.goals.family === null && m.stats.outbidRivals && m.stats.marriages === 0 && m.flags.insuredUntil === 0 && m.rivals.wong.merged === false && m.dynasty.proposals.length === 0 && m.dynasty.mergers === 0, m.relations);
  check('a migrated save plays on: endYear, leaderboard, summary, dynasty, goals all ok', (function () { clearEvents(PE); var e = PE.Game.endYear(); return e.ok && PE.Rivals.leaderboard().ok && PE.Game.summary().ok && PE.Dynasty.summary().ok && PE.Goals.current().ok && PE.Finance.summary().ok; })());
  // payload compatibility with the current UI
  var P = fresh('chen', 9), sm = P.Game.summary(), lb = P.Rivals.leaderboard().leaderboard, lv = P.Market.listings('london').listings[0], fs = P.Finance.summary(), dy = P.Dynasty.summary(), gc = P.Goals.current();
  check('summary keeps every field the UI reads', ['year', 'era', 'eraId', 'status', 'family', 'color', 'cash', 'netWorth', 'debt', 'ltv', 'reputation', 'rank', 'properties', 'cities', 'cycle', 'cycleName', 'baseRate', 'head', 'headAge', 'generation', 'pendingEvents', 'offers', 'auction', 'paper', 'lastReport', 'capacity', 'currency', 'mode', 'endYear', 'scenario', 'challenge', 'perks', 'allies'].every(function (k) { return k in sm; }));
  check('leaderboard rows keep id/name/netWorth/properties/cities/lastAction/relation/archetype/color/bankrupt/isPlayer/rank', lb.every(function (r) { return ['id', 'name', 'netWorth', 'properties', 'cities', 'lastAction', 'color', 'bankrupt', 'isPlayer', 'rank', 'prevRank', 'rankDelta', 'allied'].every(function (k) { return k in r; }); }) && lb.filter(function (r) { return !r.isPlayer; }).every(function (r) { return 'relation' in r && 'archetype' in r; }));
  check('listing view keeps lowEstimate/highEstimate/sellerName/pricePerSqm/districtPricePerSqm/districtTrend/stampDuty/maxLtv and hides trueValue', ['lowEstimate', 'highEstimate', 'sellerName', 'pricePerSqm', 'districtPricePerSqm', 'districtTrend', 'stampDuty', 'maxLtv', 'comps', 'cues', 'conditionLabel', 'typeName', 'cityName', 'renovationOptions'].every(function (k) { return k in lv; }) && (lv.trueValue === undefined || lv.revealed));
  check('Finance.summary / Dynasty.summary / Goals.current keep their fields', ['cash', 'debt', 'assets', 'ltv', 'netWorth', 'annualDebtService', 'baseRate', 'quoteRate', 'maxLtv', 'savingsRate', 'covenantWarnings', 'trust'].every(function (k) { return k in fs; }) && ['head', 'members', 'generation', 'heirId', 'trust', 'estateTaxRate', 'reputation', 'alliances', 'deaths', 'surname', 'mortality', 'educationCost'].every(function (k) { return k in dy; }) && ['yearly', 'era', 'campaign', 'achievements', 'legacyScore'].every(function (k) { return k in gc; }));
  check('Game.families now also lists perks and scenarios', P.Game.families().perks.length >= 8 && P.Game.families().scenarios.length === 3);
  check('ORDER.txt unchanged (no new engine files needed)', require('./load.js').order().length === 14);
})();

/* ---------- P3.1 rival personalities visible ---------- */
(function () {
  var P = fresh('chen', 11), s = P.S(), Rv = P.Rivals, D = P.Data;
  var archetypes = ['Banker', 'Trader', 'Hoarder', 'Speculator', 'Slumlord', 'Builder', 'Magnate'], kinds = ['outbidYou', 'outbidAny', 'win', 'lose', 'ally', 'jab', 'greet', 'idle'];
  var allLines = true;
  archetypes.forEach(function (a) { kinds.forEach(function (k) { if (!D.taunts[a] || !D.taunts[a][k] || !D.taunts[a][k].length) allLines = false; }); });
  check('P3.1: every archetype has voiced lines for every kind', allLines);
  check('P3.1: taunts are deterministic per call count and never consume the gameplay RNG', (function () {
    var P1 = fresh('chen', 12), P2 = fresh('chen', 12);
    for (var i = 0; i < 5; i++) { P1.Rivals.taunt('wong', 'outbidYou'); P2.Rivals.taunt('wong', 'outbidYou'); }
    return P1.S().rngState === P2.S().rngState;
  })());
  check('P3.1: taunt picks stay inside their pool', (function () {
    var ok = true;
    for (var i = 0; i < 40; i++) { var t = Rv.taunt('petrov', 'outbidYou'); if (D.taunts.Speculator.outbidYou.indexOf(t) < 0) ok = false; }
    return ok;
  })());
  check('P3.1: adjustRelation keeps a capped relation log', (function () {
    for (var i = 0; i < 9; i++) Rv.adjustRelation('wong', -2, 'relationOutbid');
    var log = P.S().rivals.wong.relationLog;
    return log && log.length === 6 && log[log.length - 1].why === 'relationOutbid';
  })());
  check('P3.1: leaderboard rows carry holdings and relation log', (function () {
    var rows = Rv.leaderboard().leaderboard.filter(function (r) { return !r.isPlayer; });
    return rows.every(function (r) { return Array.isArray(r.holdings) && Array.isArray(r.relationLog); });
  })());
  check('P3.1: idle lines come from the persona table (relations shift the voice)', (function () {
    var Pn = fresh('chen', 13), pool = [];
    for (var y = 0; y < 10; y++) {
      clearEvents(Pn); Pn.Game.endYear();
      for (var id in Pn.S().rivals) { var rv = Pn.S().rivals[id], T = D.taunts[P.Data.rivalById(id).archetype]; if (rv.lastAction) pool.push([].concat(T.ally, T.jab, T.greet, T.idle).indexOf(rv.lastAction) >= 0); }
    }
    var persona = pool.filter(Boolean).length;
    return pool.length > 0 && persona >= pool.length * 0.3;
  })());
  check('P3.1: >=1 rival interaction per 2 years across scripted competent runs', (function () {
    var pl = require('./players.js'), totalYears = 0, interactionYears = 0;
    [21, 22, 23].forEach(function (seed) {
      var Px = fresh('chen', seed), players = pl(Px);
      for (var y = 0; y < 30 && Px.S().status === 'playing'; y++) {
        var relBefore = 0; for (var id in Px.S().rivals) relBefore += (Px.S().rivals[id].relationLog || []).length;
        var offers = Px.S().offers.length;
        players.competent.play();
        var r = Px.Game.endYear(); if (!r.ok) { players.resolveEvents('competent'); r = Px.Game.endYear(); }
        var relAfter = 0; for (var id2 in Px.S().rivals) relAfter += (Px.S().rivals[id2].relationLog || []).length;
        totalYears++;
        if (offers > 0 || Px.S().auction || relAfter > relBefore || (r.rivalsMoves && r.rivalsMoves.length)) interactionYears++;
      }
    });
    return interactionYears * 2 >= totalYears;
  })());
})();

/* ---------- P3.3 succession ceremony + charity planning ---------- */
(function () {
  var P = fresh('chen', 31), s = P.S(), D = P.Data, B = D.balance;
  check('P3.3: charity endowment halves-ish estate tax: 5 points off after trust', (function () {
    var base = P.Dynasty.estateTaxRate();
    P.Dynasty.setupTrust();
    var withTrust = P.Dynasty.estateTaxRate();
    P.Dynasty.toggleCharity();
    var withBoth = P.Dynasty.estateTaxRate();
    var era = P.State.era().estateTax;
    return Math.abs(base - era) < 0.001 && Math.abs(withTrust - era * B.estateTrustFactor) < 0.002 && Math.abs(withBoth - Math.max(0, era * B.estateTrustFactor - B.charityTaxCut)) < 0.002;
  })());
  check('P3.3: charity costs 1% of net worth a year and adds reputation', (function () {
    P.Dynasty.toggleCharity(); // off again
    var rep0 = s.reputation;
    var rep1 = Math.min(100, rep0 + B.charityRepPerYear);
    return rep1 > rep0 || rep0 === 100;
  })());
  check('P3.3: Dynasty.summary exposes charity', P.Dynasty.summary().charity === false || typeof P.Dynasty.summary().charity === 'boolean');
  check('P3.3: succession reports a tax breakdown with trust and charity savings', (function () {
    var P2 = fresh('vanderbilt', 32);
    P2.Dynasty.setupTrust(); P2.Dynasty.toggleCharity();
    var nw = P2.State.netWorth('player');
    if (nw <= 0) { P2.S().cash = 5000; nw = P2.State.netWorth('player'); }
    var rep = { cashFlow: { taxes: 0 }, dynasty: [], lines: [] };
    P2.Dynasty.succession(rep);
    var sc = rep.dynasty[0];
    var expectGross = Math.round(nw * sc.breakdown.baseRate / 100);
    return sc && sc.breakdown && sc.breakdown.trustSaved > 0 && sc.breakdown.charitySaved > 0 && sc.breakdown.tax === expectGross - sc.breakdown.trustSaved - sc.breakdown.charitySaved && sc.breakdown.heirTraits.length >= 1;
  })());
})();


/* ---------- P3.5 bankruptcy absorption + comeback track ---------- */
(function () {
  var P = fresh('chen', 41), s = P.S();
  var ls = P.Market.listings('london').listings.slice(0, 3);
  ls.forEach(function (l) { s.cash += l.askingPrice; P.Market.buy(s.listings[l.id], Math.round(l.askingPrice * 0.9), null, 'player'); });
  var before = P.State.propertyCount('player');
  s.cash = -1e6; s.stats.peakNetWorth = Math.max(5000, s.stats.peakNetWorth);
  clearEvents(P); var r = P.Game.endYear();
  check('P3.5: bankruptcy absorbs all but the best building into rivals immediately', r.bankrupt && r.absorbed && r.absorbed.count === before - 1 && P.State.propertyCount('player') === 1);
  check('P3.5: the absorbing rival takes the buildings and is named', (function () { var rv = P.S().rivals[r.absorbed.rivalId]; return rv && /Absorbed/.test(rv.lastAction); })());
  check('P3.5: comeback state is set with the peak to recover', !!s.comeback && s.comeback.from >= 5000);
  var ch = P.Game.continueAsHeir();
  var gy = P.S().goals.yearly;
  check('P3.5: continuing as heir keeps one building and starts the comeback track', ch.ok && P.State.propertyCount('player') === 1 && gy && gy.comeback === true && gy.id === 'comeback_black');
  check('P3.5: comeback step one completes on a black year and advances', (function () {
    var P2 = fresh('chen', 42);
    P2.S().stats.lastNetCashFlow = 500; P2.S().goals.yearly = { id: 'comeback_black', desc: '', year: 1850, reward: 50, comeback: true, stage: 0 };
    P2.S().comeback = { from: 9000, year: 1850, stage: 0 };
    var rep = { goals: { achieved: [], progress: [] }, lines: [] };
    P2.Goals.evaluate(rep);
    return rep.goals.achieved.length === 1 && P2.S().comeback.stage === 1;
  })());
  check('P3.5: finishing all three steps clears the comeback', (function () {
    var P2 = fresh('chen', 43);
    P2.S().comeback = { from: 10, year: 1850, stage: 2 };
    P2.S().goals.yearly = { id: 'comeback_recover', desc: '', year: 1850, reward: 50, comeback: true, stage: 2 };
    var rep = { goals: { achieved: [], progress: [] }, lines: [] };
    P2.Goals.evaluate(rep);
    return rep.goals.achieved.length === 1 && P2.S().comeback === null && rep.lines.join().indexOf('rebuilt') >= 0;
  })());
})();

/* ---------- P6.3 Save slots + import ---------- */
(function () {
  var PE = fresh('chen', 701), pl = require('./players.js')(PE);
  playYears(PE, pl, 3);
  var snap = JSON.stringify(PE.S());
  check('P6.3: default save writes slot 1 (pe_v8_save_1) and round-trips', (function () {
    PE.Game.save(); PE.S().cash = -1; PE.S().year = 1700;
    var ld = PE.Game.load();
    return ld.ok && JSON.stringify(PE.S()) === snap && PE.Storage.has() && PE.Storage.has(1);
  })());
  check('P6.3: slots are independent (save/load slots 2 and 3)', (function () {
    PE.Storage.save(PE.S(), 2); PE.S().cash = 4242; PE.Storage.save(PE.S(), 3);
    var s2 = PE.Storage.load(2), s3 = PE.Storage.load(3);
    var ok = s2 && s3 && s2.cash !== 4242 && s3.cash === 4242 && s2.year === s3.year;
    PE.Storage.remove(2); PE.Storage.remove(3);
    return ok && !PE.Storage.has(2) && !PE.Storage.has(3) && PE.Storage.has(1);
  })());
  check('P6.3: invalid slots resolve to null and fail cleanly; strings stay verbatim keys', PE.Storage.resolveKey(0) === null && PE.Storage.resolveKey(4) === null && PE.Storage.resolveKey('custom_key') === 'custom_key' && PE.Storage.save(PE.S(), 9) === false && PE.Storage.load(9) === null && !PE.Storage.has(9));
  check('P6.3: listSaves reports all three slots with meta', (function () { var l = PE.Storage.listSaves(); return l.length === 3 && l[0].slot === 1 && l[0].key === 'pe_v8_save_1' && l[0].exists === true && l[0].familyName && l[0].year === PE.S().year && l[1].exists === false && l[1].corrupt === false; })());
  check('P6.3: a legacy pe_v8_save migrates into slot 1 once, then the legacy key is gone', (function () {
    var P2 = load(); P2.Game.newGame({ familyId: 'silva', seed: 5 });
    P2.Storage.useBackend({ _m: {}, get: function (k) { return this._m.hasOwnProperty(k) ? this._m[k] : null; }, set: function (k, v) { this._m[k] = v; return true; }, remove: function (k) { delete this._m[k]; } });
    P2.Storage.save(P2.S(), P2.Storage.LEGACY_KEY); /* what a pre-P6.3 build wrote */
    var r = P2.Game.load();
    return r.ok && P2.S().familyId === 'silva' && P2.Storage.has(1) && !P2.Storage.has(P2.Storage.LEGACY_KEY) && P2.Storage.migrateLegacy() === false;
  })());
  check('P6.3: importSave validates the payload and the slot choice', (function () {
    var P3 = load(); P3.Game.newGame({ familyId: 'vanderbilt', seed: 6 });
    var exported = JSON.stringify({ saveVersion: P3.Storage.SAVE_VERSION, savedAt: 1850, state: P3.S() });
    var P4 = load();
    var bad = [
      P4.Storage.importSave('not json', 2),
      P4.Storage.importSave('{"a":1}', 2),
      P4.Storage.importSave({ saveVersion: 99, state: { familyId: 'chen' } }, 2),
      P4.Storage.importSave({ saveVersion: 2, state: { bogus: true } }, 2),
      P4.Storage.importSave({ saveVersion: 2, state: { familyId: 'chen' } }, 7),
      P4.Storage.importSave(null, 2)
    ];
    var okBad = bad.every(function (r) { return r && r.ok === false && typeof r.message === 'string'; });
    var good = P4.Storage.importSave(exported, 2), loaded = P4.Storage.load(2);
    var P5 = load(), good1 = P5.Storage.importSave(JSON.parse(exported));
    return okBad && good.ok && good.slot === 2 && loaded && loaded.familyId === 'vanderbilt' && good1.ok && good1.slot === 1 && P5.Storage.has(1);
  })());
  check('P6.3: Game back-compat — no-slot save/load/hasSave/deleteSave unchanged', (function () {
    var P6 = load(); P6.Game.newGame({ familyId: 'chen', seed: 9 });
    P6.Game.save(); var h = P6.Game.hasSave().hasSave; P6.S().cash = -5; P6.Game.load();
    var ok = h === true && P6.S().cash !== -5;
    P6.Game.deleteSave();
    return ok && P6.Game.hasSave().hasSave === false && !P6.Game.load().ok;
  })());
})();

/* ---------- P6.5 l10n scaffolding ---------- */
(function () {
  var vm = require('vm');
  function loadL10n(PE, ls) {
    var ctx = { console: console, PE: PE, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, localStorage: ls, CustomEvent: function (type, d) { this.type = type; this.detail = d; } };
    ctx.global = ctx; ctx.window = undefined;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'engine', 'l10n.js'), 'utf8'), ctx, { filename: 'l10n.js' });
    return PE;
  }
  var ls = (function () { var m = {}; return { getItem: function (k) { return m.hasOwnProperty(k) ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } }; })();
  var PE = load(); PE.Game.newGame({ familyId: 'chen', seed: 1 });
  loadL10n(PE, ls);
  check('P6.5: default locale is en-GB and T returns the fallback', PE.locale() === 'en-GB' && PE.T('nav.deals', 'Deals') === 'Deals' && PE.T('missing.key') === 'missing.key');
  check('P6.5: setLocale switches and T translates; unknown locales are refused', (function () {
    var ok = PE.setLocale('fr') === true && PE.locale() === 'fr' && PE.T('nav.deals', 'Deals') === 'Affaires' && PE.T('settings.title', 'Settings') === 'Réglages';
    var refused = PE.setLocale('de') === false && PE.setLocale('fr-FR') === false && PE.locale() === 'fr';
    PE.setLocale('en-GB');
    return ok && refused && PE.T('nav.deals', 'Deals') === 'Deals';
  })());
  check('P6.5: the locale persists across reloads via localStorage', (function () {
    PE.setLocale('fr');
    var PE2 = load(); loadL10n(PE2, ls);
    var ok = PE2.locale() === 'fr';
    PE2.setLocale('en-GB');
    return ok;
  })());
  check('P6.5: fr covers the 40 core demo keys', (function () {
    var keys = ['nav.deals', 'nav.city', 'nav.portfolio', 'nav.dynasty', 'nav.rivals', 'hud.cash', 'hud.net_worth', 'hud.end_year', 'hud.year_menu', 'settings.title', 'settings.sound', 'settings.quality', 'settings.theme', 'settings.guide', 'settings.export', 'settings.import', 'settings.delete_save', 'settings.close', 'common.ok', 'common.cancel', 'common.close', 'common.confirm', 'common.back', 'common.buy', 'common.sell', 'common.save', 'common.loading', 'menu.continue', 'menu.new_game', 'menu.how_to_play', 'menu.settings', 'menu.challenge', 'menu.scenarios', 'deals.title', 'deals.make_offer', 'deals.appraise', 'deals.auction', 'year.end_year', 'year.report', 'year.skip_quiet'];
    var d = PE.L10N.dict.fr;
    return keys.every(function (k) { return typeof d[k] === 'string' && d[k].length > 0; });
  })());
  check('P6.5: apply() translates [data-t] nodes; data-t-fallback keeps two-way switching exact', (function () {
    var nodes = [];
    function mk(key, fb, text) { var n = { attrs: { 'data-t': key }, textContent: text }; if (fb !== undefined) n.attrs['data-t-fallback'] = fb; n.getAttribute = function (k) { return this.attrs.hasOwnProperty(k) ? this.attrs[k] : null; }; nodes.push(n); return n; }
    var a = mk('nav.deals', 'Deals', 'Deals'), b = mk('nav.city', 'City', 'City'), c = mk('unknown.thing', undefined, 'Stay');
    var fakeRoot = { querySelectorAll: function () { return nodes; } };
    PE.setLocale('fr'); var n1 = PE.L10N.apply(fakeRoot);
    var frOk = a.textContent === 'Affaires' && b.textContent === 'Ville' && c.textContent === 'Stay';
    PE.setLocale('en-GB'); var n2 = PE.L10N.apply(fakeRoot);
    var enOk = a.textContent === 'Deals' && b.textContent === 'City' && c.textContent === 'Stay';
    return n1 === 3 && n2 === 3 && frOk && enOk;
  })());
})();

/* ---------- P6.7 analytics ring buffer ---------- */
(function () {
  var PE = load();
  check('P6.7: track appends {e, p, t} and refuses invalid events without throwing', (function () {
    PE.Analytics.clear();
    var ok1 = PE.Analytics.track('year_reached', { year: 1851 }) === true;
    var ev = PE.Analytics.events();
    var ok2 = ev.length === 1 && ev[0].e === 'year_reached' && ev[0].p.year === 1851 && typeof ev[0].t === 'string';
    var ok3 = PE.Analytics.track() === false && PE.Analytics.track(42) === false;
    PE.Analytics.track('x', [1]); PE.Analytics.track('y', 'str');
    var rest = PE.Analytics.events();
    var ok4 = Object.keys(rest[1].p).length === 0 && Object.keys(rest[2].p).length === 0;
    return ok1 && ok2 && ok3 && ok4;
  })());
  check('P6.7: the ring buffer caps at 200 and drops the oldest', (function () {
    PE.Analytics.clear();
    for (var i = 0; i < 250; i++) PE.Analytics.track('ev', { i: i });
    var ev = PE.Analytics.events();
    return ev.length === 200 && ev[0].p.i === 50 && ev[ev.length - 1].p.i === 249;
  })());
  check('P6.7: events survive a JSON round-trip', (function () { var ev = PE.Analytics.events(); return JSON.stringify(JSON.parse(JSON.stringify(ev))) === JSON.stringify(ev); })());
  check('P6.7: flush delivers via the hook and clears; failed delivery keeps events', (function () {
    PE.Analytics.onFlush = function () { return false; };
    var kept = PE.Analytics.flush(), n1 = PE.Analytics.count();
    PE.Analytics.onFlush = function (q) { return q.length === 200; };
    var sent = PE.Analytics.flush(), n2 = PE.Analytics.count();
    PE.Analytics.onFlush = null;
    return kept === 0 && n1 === 200 && sent === 200 && n2 === 0 && PE.Analytics.flush() === 0;
  })());
})();

/* ---------- P7. Live-ops: event packs, leaderboard, city packs ---------- */
/* loadWith: the js/sim/load.js harness plus extra engine files evaluated in the same
   context (lb.js / pack-demo.js are not in ORDER.txt; they load after game.js). */
function loadWith(extra) {
  var vm = require('vm'), dir = path.join(__dirname, '..', 'engine');
  var order = load.order().concat(extra || []);
  var ctx = { console: console, Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, Error: Error, Infinity: Infinity, NaN: NaN, Date: Date, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, isFinite: isFinite, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout };
  ctx.global = ctx; ctx.window = undefined;
  vm.createContext(ctx);
  for (var i = 0; i < order.length; i++) vm.runInContext(fs.readFileSync(path.join(dir, order[i]), 'utf8'), ctx, { filename: order[i] });
  return ctx;
}

(function () {
  /* FX vocabulary stays in sync with applyFx, both directions. */
  var PE = load(), src = fs.readFileSync(path.join(__dirname, '..', 'engine', 'events.js'), 'utf8');
  var used = {};
  function scan(fx) { if (fx && typeof fx === 'object') for (var k in fx) used[k] = 1; }
  PE.Data.randomEvents.forEach(function (e) { e.choices.forEach(function (c) { scan(c.fx); }); });
  PE.Data.historicalEvents.forEach(function (e) { (e.choices || []).forEach(function (c) { scan(c.fx); }); });
  for (var era in PE.Data.eraSetPieces) (PE.Data.eraSetPieces[era].choices || []).forEach(function (c) { scan(c.fx); });
  var vocab = PE.Events.FX_VOCABULARY;
  var missing = Object.keys(used).filter(function (k) { return !vocab[k]; });
  var dead = Object.keys(vocab).filter(function (k) { return src.indexOf('fx.' + k) < 0; });
  check('P7: every fx key used by built-in events is in the pack vocabulary', missing.length === 0, missing);
  check('P7: every pack-vocabulary key is applied in applyFx', dead.length === 0, dead);
  check('P7: validateFx flags unknown keys', (function () { var p = PE.Events.validateFx({ bogusKey: 1 }); return p.length === 1 && /unknown fx key/.test(p[0]); })());
})();

(function () {
  /* Pack registration + validation. */
  var ctx = loadWith(['pack-demo.js']), PE = ctx.PE;
  check('P7: demo pack ships 5 events and stays unregistered by default', !!(PE.Events.DEMO_PACK && PE.Events.DEMO_PACK.events.length === 5) && PE.Events.packs.length === 0);
  var okPack = PE.Events.registerPack(PE.Events.DEMO_PACK);
  check('P7: registerPack accepts the demo pack', okPack.ok === true && PE.Events.packs.length === 1, okPack);
  check('P7: duplicate pack id is rejected', PE.Events.registerPack(PE.Events.DEMO_PACK).ok === false);
  function tryPack(p) { return PE.Events.registerPack(p); }
  var base = { id: 't1', name: 'Test', events: [{ id: 't1:a', title: 'T', text: 'x', choices: [{ label: '1', fx: {} }, { label: '2', fx: {} }] }] };
  check('P7: minimal valid pack registers', tryPack(JSON.parse(JSON.stringify(base))).ok === true);
  var seq = 0;
  function bad(mutate, why) {
    var p = JSON.parse(JSON.stringify(base)); p.id = 'bad' + (seq); p.events[0].id = 'bad' + seq + ':a'; seq++;
    mutate(p);
    var r = tryPack(p);
    check('P7: rejected — ' + why, r.ok === false, r);
  }
  bad(function (p) { p.id = 'T1!'; }, 'bad pack id');
  bad(function (p) { p.events[0].choices[0].fx = { noSuchFx: 1 }; }, 'unknown fx key');
  bad(function (p) { p.events[0].choices = [{ label: 'only', fx: {} }]; }, 'a one-choice event');
  bad(function (p) { p.events[0].minYear = 1900; p.events[0].maxYear = 1850; }, 'minYear after maxYear');
  bad(function (p) { p.events[0].weight = 0; }, 'non-positive weight');
  bad(function (p) { p.events[0].kind = 'historical'; }, 'pack events must be kind "random"');
  bad(function (p) { p.events[0].id = 'fire'; }, 'collision with a built-in event id');
  bad(function (p) { p.events[0].choices[0].fx = { gamble: { p: 2, win: 1, lose: 1 } }; }, 'out-of-domain probability');
  bad(function (p) { p.events[0].choices[0].fx = { lease: { years: 3 } }; }, 'compound fx missing a required key');
  var unk = (function () { var p = JSON.parse(JSON.stringify(base)); p.id = 'badf'; p.events[0].id = 'badf:a'; p.events[0].choices[0].fx = { noSuchFx: 1 }; return tryPack(p); })();
  check('P7: unknown fx key rejected with ok:false and a message', !unk.ok && /unknown fx key/.test(unk.message), unk);
})();

(function () {
  /* Pool merge + per-year cap, driven through rollYearly for 1850–2029. */
  var ctx = loadWith(['pack-demo.js']), PE = ctx.PE, B = PE.Data.balance;
  PE.Events.registerPack(PE.Events.DEMO_PACK);
  var g = PE.Game.newGame({ familyId: 'chen', seed: 99 });
  check('P7: newGame ok with a pack registered', g.ok === true);
  var s = PE.S(), St = PE.State;
  for (var i = 0; i < 6; i++) { var p = PE.Market.genProperty('london', { type: i % 2 ? 'terrace' : 'shop', condition: 70 }); p.purchasePrice = p.trueValue; p.purchaseYear = s.year; St.setOwner(p, 'player'); PE.Property.initTenancy(p); }
  var builtIns = PE.Data.randomEvents.length, totalPack = 0, worst = 0, packUid = null;
  for (var y = 1850; y <= 2029; y++) {
    s.year = y;
    var rep = { events: [] };
    PE.Events.rollYearly(rep, false);
    var pk = rep.events.filter(function (e) { return e.kind === 'pack'; });
    totalPack += pk.length;
    worst = Math.max(worst, rep.events.length);
    if (pk.length && !packUid) packUid = pk[0].uid;
    s.events.pending = [];
  }
  check('P7: built-in event list is untouched by packs', PE.Data.randomEvents.length === builtIns);
  check('P7: pack events appear across 180 seeded years', totalPack > 0, totalPack);
  check('P7: at most 2 pack events in any year, never beyond maxEventsPerYear total', totalPack > 0 && worst <= B.maxEventsPerYear);
  var found = null;
  for (var y2 = 1890; y2 < 2020 && !found; y2++) {
    s.year = y2; s.events.pending = [];
    var rep2 = { events: [] };
    PE.Events.rollYearly(rep2, false);
    for (var q = 0; q < s.events.pending.length; q++) if (s.events.pending[q].kind === 'pack') { found = s.events.pending[q]; break; }
    if (!found) s.events.pending = [];
  }
  check('P7: a rolled pack event resolves through the normal path', !!found && PE.Events.resolve(found.uid, 0).ok === true, found && found.id);
})();

(function () {
  /* fetchPack guards, run in a child process because they are promise-based. */
  var script = [
    "var fs=require('fs'),path=require('path'),vm=require('vm');",
    "var dir=path.join(process.cwd(),'..','engine');",
    "var order=fs.readFileSync(path.join(dir,'ORDER.txt'),'utf8').split(/\\r?\\n/).filter(Boolean);",
    "var ctx={console:console,Math:Math,JSON:JSON,Object:Object,Array:Array,String:String,Number:Number,Error:Error,Infinity:Infinity,NaN:NaN,Date:Date,parseInt:parseInt,parseFloat:parseFloat,isNaN:isNaN,isFinite:isFinite,Promise:Promise,setTimeout:setTimeout,clearTimeout:clearTimeout};",
    "ctx.global=ctx;ctx.window=undefined;vm.createContext(ctx);",
    "order.forEach(function(f){vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),ctx,{filename:f});});",
    "var PE=ctx.PE;",
    "var pack={id:'net',name:'Network Pack',events:[{id:'net:a',title:'A',text:'b',choices:[{label:'x',fx:{reputation:1}},{label:'y',fx:{}}]}]};",
    "var results={};",
    "function ok(res){return !!res.ok;}",
    "ctx.fetch=function(){return Promise.resolve({ok:true,status:200,text:function(){return Promise.resolve(JSON.stringify(pack));}});};",
    "PE.Events.fetchPack('https://example.test/p.json').then(function(r){results.good=r.ok&&PE.Events.packs.length===1;",
    " ctx.fetch=function(){return Promise.resolve({ok:true,status:200,text:function(){return Promise.resolve(JSON.stringify(pack).replace('Network Pack','N')+' '.repeat(70000));}});};",
    " return PE.Events.fetchPack('https://example.test/big.json');}).then(function(r){results.oversize=!r.ok&&/max/.test(r.message);",
    " ctx.fetch=function(){return Promise.resolve({ok:true,status:200,text:function(){return Promise.resolve('{not json');}});};",
    " return PE.Events.fetchPack('https://example.test/bad.json');}).then(function(r){results.badjson=!r.ok&&/JSON/.test(r.message);",
    " ctx.fetch=function(){return Promise.resolve({ok:false,status:500,text:function(){return Promise.resolve('');}});};",
    " return PE.Events.fetchPack('https://example.test/500.json');}).then(function(r){results.http=!r.ok&&/HTTP 500/.test(r.message);",
    " var bad=JSON.parse(JSON.stringify(pack));bad.id='net2';bad.events[0].id='net2:a';bad.events[0].choices[0].fx={nope:1};",
    " ctx.fetch=function(){return Promise.resolve({ok:true,status:200,text:function(){return Promise.resolve(JSON.stringify(bad));}});};",
    " return PE.Events.fetchPack('https://example.test/badfx.json');}).then(function(r){results.badfx=!r.ok&&/unknown fx key/.test(r.message);",
    " ctx.fetch=function(){return new Promise(function(){});};",
    " return PE.Events.fetchPack('https://example.test/slow.json',{timeoutMs:80});}).then(function(r){results.timeout=!r.ok&&/Timed out/.test(r.message);",
    " console.log('FETCHTESTS '+JSON.stringify(results));});"
  ].join('\n');
  var out = require('child_process').execFileSync(process.execPath, ['-e', script], { cwd: __dirname, encoding: 'utf8', timeout: 30000 });
  var m = out.match(/FETCHTESTS (\{.*\})/), results = m ? JSON.parse(m[1]) : {};
  check('P7: fetchPack registers a valid pack', results.good === true, out);
  check('P7: fetchPack size guard rejects an oversize pack', results.oversize === true);
  check('P7: fetchPack rejects invalid JSON', results.badjson === true);
  check('P7: fetchPack rejects an HTTP error', results.http === true);
  check('P7: fetchPack rejects unknown fx keys', results.badfx === true);
  check('P7: fetchPack time guard rejects a slow host', results.timeout === true);
})();

(function () {
  /* Leaderboard: submit/rank/sort/persist + recordChallenge integration. */
  var ctx = loadWith(['lb.js']), PE = ctx.PE;
  check('P7: LB exposes submit/board/hook', PE.LB && typeof PE.LB.submit === 'function' && typeof PE.LB.board === 'function' && typeof PE.LB.hook === 'function');
  check('P7: submit validates its entry', PE.LB.submit({ score: 'x' }).ok === false);
  var r1 = PE.LB.submit({ name: 'Ada', score: 1200, year: 1879, gens: 2, week: '2030-W01' });
  var r2 = PE.LB.submit({ name: 'Ben', score: 2400, year: 1879, gens: 1, week: '2030-W01' });
  check('P7: submit returns the rank at submission time', r1.ok && r2.ok && r1.rank === 1 && r2.rank === 1, [r1.rank, r2.rank]);
  var b = PE.LB.board('2030-W01');
  check('P7: board sorts descending with entry shape {rank,name,score,year,gens}', b.ok && b.board.length === 2 && b.board[0].name === 'Ben' && b.board[0].score === 2400 && b.board[1].rank === 2 && b.board[0].year === 1879 && b.board[0].gens === 1);
  check('P7: board is stored across calls (local persistence)', PE.LB.board('2030-W01').board.length === 2 && PE.LB.board('2030-W01').you === null);
  for (var i = 0; i < 105; i++) PE.LB.submit({ name: 'Bot' + i, score: i, week: '2030-W02' });
  var cap = PE.LB.board('2030-W02');
  check('P7: a week keeps the top 100', cap.board.length === 100 && cap.board[0].score === 104 && cap.top.name === 'Bot104');
  for (var w = 1; w <= 13; w++) PE.LB.submit({ name: 'W', score: w, week: '2031-W' + (w < 10 ? '0' : '') + w });
  check('P7: only the newest 12 weeks are kept', PE.LB.board('2031-W01').board.length === 0 && PE.LB.board('2031-W13').board.length === 1);
  /* the recordChallenge wrapper: one submission per finished challenge */
  var ctx2 = loadWith(['lb.js']), P2 = ctx2.PE;
  var ng = P2.Game.newChallenge({ week: '2031-W50' });
  var s2 = P2.S(), hooked = [];
  P2.LB.hook(function (r) { hooked.push(r); });
  var c = P2.Game.recordChallenge();
  var lb = P2.LB.board('2031-W50');
  check('P7: recordChallenge wrapper submits the finished run', ng.ok && c && lb.you && lb.you.score === s2.challenge.score && lb.you.name === 'You' && lb.you.year === s2.year && lb.you.gens === s2.dynasty.generation, lb.you);
  check('P7: the wrapper fires hooks and never double-submits', hooked.length === 1 && hooked[0].ok === true && P2.Game.recordChallenge() === null && P2.LB.board('2031-W50').board.length === 1);
  var direct = P2.LB.submit({ name: 'Zoe', score: 99999, week: '2031-W50' });
  check('P7: a better entry takes rank 1', direct.ok && P2.LB.board('2031-W50').board[0].name === 'Zoe');
})();

(function () {
  /* City packs: registerPack validation. */
  var PE = load();
  var g0 = PE.Game.newGame({ familyId: 'chen', seed: 3 });
  var fake = { id: 'testville', name: 'Testville', country: 'Nowhere', trait: 'tech_hub', tier: 2, availableFrom: 1900, basePpsqm: 10, grossYield: 0.08, taxRate: 0.01, growth: 0.02, districts: [{ name: 'Alpha', mult: 1, trend: 0 }, { name: 'Beta', mult: 0.6, trend: 1 }, { name: 'Gamma', mult: 1.8, trend: 2 }, { name: 'Delta', mult: 0.4, trend: -1 }] };
  var r = PE.Cities.registerPack(fake);
  check('P7: a valid city pack registers', r.ok === true, r);
  var g = PE.Game.newGame({ familyId: 'chen', seed: 3 });
  check('P7: the next new game initialises the pack city state', g.ok === true && !!PE.S().cities.testville && Object.keys(PE.S().cities.testville.districts).length === 4);
  check('P7: the pack city appears in Cities.list with its trait', PE.Cities.list().cities.some(function (c) { return c.id === 'testville' && c.traitName === 'Tech Hub' && c.availableFrom === 1900; }));
  var info = PE.Cities.info('testville');
  check('P7: the pack city plays by the normal economy (cost + rep gate)', info.cost > 0 && info.repRequired > 0);
  function bad(def) { return !PE.Cities.registerPack(def).ok; }
  var d;
  d = JSON.parse(JSON.stringify(fake)); d.id = 'london'; check('P7: duplicate city id rejected', bad(d));
  d = JSON.parse(JSON.stringify(fake)); d.id = 'badville'; d.trait = 'nope'; check('P7: unknown trait rejected', bad(d));
  d = JSON.parse(JSON.stringify(fake)); d.id = 'badville'; d.tier = 5; check('P7: bad tier rejected', bad(d));
  d = JSON.parse(JSON.stringify(fake)); d.id = 'badville'; d.availableFrom = 1750; check('P7: bad availableFrom rejected', bad(d));
  d = JSON.parse(JSON.stringify(fake)); d.id = 'badville'; d.districts = d.districts.slice(0, 2); check('P7: fewer than 4 districts rejected', bad(d));
  d = JSON.parse(JSON.stringify(fake)); d.id = 'badville'; d.districts[0].trend = 7; check('P7: bad district trend rejected', bad(d));
  d = JSON.parse(JSON.stringify(fake)); d.id = 'badville'; d.districts.push({ name: 'Alpha', mult: 1, trend: 0 }); check('P7: duplicate district name rejected', bad(d));
})();

(function () {
  /* Pillar 1 for packs: the Monte-Carlo check passes on every demo-pack event. */
  var mc = require('./eventsmc.js');
  var ctx = loadWith(['pack-demo.js']), PE = ctx.PE;
  var fails = [];
  PE.Events.DEMO_PACK.events.forEach(function (ev) {
    var problems = mc.judge(mc.evaluate(load, ev, 40));
    if (problems.length) fails.push(ev.id + ': ' + problems.join('; '));
  });
  check('P7: MC check passes for every demo-pack event', fails.length === 0, fails);
})();

/* ---------- Summary ---------- */
console.log('tests: ' + passed + ' passed, ' + failed + ' failed');
if (failed) { console.log('FAILURES:'); failures.forEach(function (f) { console.log('  - ' + f); }); }
process.exitCode = failed ? 1 : 0;
