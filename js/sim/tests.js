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
  check('continueAsHeir keeps exactly 1 property, resets reputation to 40 and resumes play', cb.ok && PE.State.propertyCount('player') === 1 && s.reputation === 40 && s.status === 'playing' && s.cash >= 0 && before === 2, cb);
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
  check('marriage alliance stub needs relation ≥ 55', (function () { var k3 = P2.Dynasty.newMember(22, 'm', ['charmer'], 'child'); s2.dynasty.members.push(k3); s2.rivals.rothschild.relation = 40; var a = P2.Dynasty.proposeMarriage(k3.id, 'rothschild'); s2.rivals.rothschild.relation = 60; var b = P2.Dynasty.proposeMarriage(k3.id, 'rothschild'); return !a.ok && b.ok && s2.dynasty.alliances.length === 1; })());
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

/* ---------- Summary ---------- */
console.log('tests: ' + passed + ' passed, ' + failed + ' failed');
if (failed) { console.log('FAILURES:'); failures.forEach(function (f) { console.log('  - ' + f); }); }
process.exitCode = failed ? 1 : 0;
