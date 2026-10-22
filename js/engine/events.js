/* PE.Events — the morning paper (facts + noisy foreshadowing), random events
   with choices (max 2/year, every choice a real trade-off) and the scripted
   historical events from 1850 to 2020. Pending events block endYear so a
   decision is never skipped. All effects are applied here (applyFx). */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var E = {};

  E.push = function (ev) {
    var s = PE.S(), uid = St.nextId('e');
    var inst = { uid: uid, id: ev.id, title: ev.title, text: ev.text, choices: ev.choices, year: s.year, kind: ev.kind || 'system', targets: ev.targets || {} };
    s.events.pending.push(inst);
    return inst;
  };

  E.fill = function (text, t) {
    var s = PE.S();
    return text.replace(/\{prop\}/g, t.prop ? t.prop.name : 'a property').replace(/\{district\}/g, t.prop ? t.prop.district : 'the district').replace(/\{city\}/g, t.cityId ? D.cityById[t.cityId].name : 'the city')
      .replace(/\{member\}/g, t.member ? t.member.name : 'a relative').replace(/\{rival\}/g, t.rivalId ? D.rivalById(t.rivalId).name : 'a rival').replace(/\{type\}/g, t.type ? D.propertyTypes[t.type].name.toLowerCase() : 'property');
  };

  E.pickTargets = function () {
    var s = PE.S(), props = St.playerProps().filter(function (p) { return !p.renovation && p.type !== 'land'; }), t = {};
    if (!props.length) props = St.playerProps().filter(function (p) { return !p.renovation; });
    if (props.length) t.prop = R.pick(props);
    var counts = {}, bestC = null; for (var i = 0; i < props.length; i++) { counts[props[i].cityId] = (counts[props[i].cityId] || 0) + 1; if (!bestC || counts[props[i].cityId] > counts[bestC]) bestC = props[i].cityId; }
    t.cityId = bestC || 'london';
    var adults = s.dynasty.members.filter(function (m) { return m.alive && m.relation !== 'head' && m.age >= 16 && !m.disgraced; });
    if (adults.length) t.member = R.pick(adults);
    var rivals = Object.keys(s.rivals).filter(function (id) { return !s.rivals[id].bankrupt; });
    if (rivals.length) t.rivalId = R.pick(rivals);
    t.type = R.pick(D.typesForEra(St.eraIdx()).filter(function (x) { return x.canRent; })).id;
    return t;
  };

  /* Generate next year's events at endYear (s.year already advanced). Never more than B.maxEventsPerYear. */
  E.rollYearly = function (report, eraChanged) {
    var s = PE.S(), n = 0;
    if (eraChanged && D.eraSetPieces[St.era().id]) {
      var sp = D.eraSetPieces[St.era().id], inst0 = E.push({ id: 'era_' + St.era().id, title: sp.title, text: sp.text, choices: sp.choices, kind: 'era' });
      report.events.push({ uid: inst0.uid, title: sp.title, kind: 'era' }); report.eraSetPiece = { uid: inst0.uid, title: sp.title, text: sp.text, eraId: St.era().id }; n++;
    }
    for (var i = 0; i < D.historicalEvents.length; i++) {
      var h = D.historicalEvents[i];
      if (h.year === s.year && n < B.maxEventsPerYear) { var inst = E.push({ id: 'hist_' + h.year, title: h.title, text: h.text, choices: h.choices, kind: 'historical' }); report.events.push({ uid: inst.uid, title: h.title, kind: 'historical' }); n++; }
    }
    var props = St.playerProps().length, members = s.dynasty.members.filter(function (m) { return m.alive; }).length, eraIdx = St.eraIdx(), debt = St.debt('player');
    var insured = s.flags.insuredUntil && s.year < s.flags.insuredUntil;
    var tries = R.chance(B.randomEventChance) ? 1 : 0; if (tries && R.chance(0.25)) tries++;
    var pool = D.randomEvents.filter(function (e) {
      if (props < (e.minProps || 0) || members < (e.minMembers || 0)) return false;
      if (e.fromEra !== undefined && eraIdx < e.fromEra) return false;
      if (e.toEra !== undefined && eraIdx > e.toEra) return false;
      if (e.minDebt && debt <= 0) return false;
      if ((s.flags.bombInsured || insured) && (e.id === 'fire' || e.id === 'flood')) return false;
      if (insured && e.id === 'insurance_offer') return false;
      return true;
    });
    while (n < B.maxEventsPerYear && tries > 0 && pool.length) {
      tries--;
      var ws = pool.map(function (e) { return e.weight; }), ev = R.weighted(pool, ws), t = E.pickTargets();
      pool = pool.filter(function (x) { return x.id !== ev.id; });
      if (ev.id === 'manager_fraud' && !s.cities[t.cityId].managerId) continue;
      if (ev.id === 'windfall_tenant' && (!t.prop || t.prop.condition >= 85)) continue;
      if ((ev.id === 'rate_lock' || ev.id === 'debt_forgiven' || ev.id === 'bank_call') && !St.playerProps().some(function (p) { return p.mortgage; })) continue;
      if (ev.id === 'conversion' && (!t.prop || t.prop.type === 'land')) continue;
      var inst2 = E.push({ id: ev.id, title: E.fill(ev.title, t), text: E.fill(ev.text, t), choices: ev.choices.map(function (c) { return { label: E.fill(c.label, t), fx: c.fx }; }), kind: 'random', targets: { propId: t.prop ? t.prop.id : null, cityId: t.cityId, memberId: t.member ? t.member.id : null, rivalId: t.rivalId || null, type: t.type } });
      report.events.push({ uid: inst2.uid, title: inst2.title, kind: 'random' });
      n++;
    }
  };

  E.pending = function () {
    var s = PE.S(); if (!s.events.pending.length) return PE.ok({ event: null });
    var e = s.events.pending[0];
    return PE.ok({ event: { uid: e.uid, id: e.id, title: e.title, text: e.text, kind: e.kind, year: e.year, choices: e.choices.map(function (c, i) { return { index: i, label: c.label }; }) }, remaining: s.events.pending.length });
  };
  E.resolve = function (eventUid, choiceIndex) {
    var s = PE.S(), idx = -1;
    for (var i = 0; i < s.events.pending.length; i++) if (s.events.pending[i].uid === eventUid) idx = i;
    if (idx < 0) return PE.fail('No such pending event');
    var ev = s.events.pending[idx], ch = ev.choices[choiceIndex | 0];
    if (!ch) return PE.fail('No such choice');
    s.events.pending.splice(idx, 1);
    var lines = E.applyFx(ch.fx || {}, ev);
    if (/evict/i.test(ch.label) && !(ch.fx && ch.fx.evictionCity)) { var evHit = PE.Rivals.evictionIn((ev.targets && ev.targets.cityId) || 'london'); if (evHit.length) lines.push(evHit.map(function (id) { return D.rivalById(id).name; }).join(', ') + ' disapprove of the evictions.'); }
    s.events.log.push({ year: s.year, id: ev.id, title: ev.title, choice: ch.label, result: lines.join(' ') });
    if (s.events.log.length > 60) s.events.log.shift();
    return PE.ok({ message: lines.join(' ') || 'Done.', lines: lines, remaining: s.events.pending.length });
  };

  /* ---------- Effects ---------- */
  E.applyFx = function (fx, ev) {
    var s = PE.S(), t = ev.targets || {}, lines = [], props = St.playerProps(), nw = Math.max(0, St.netWorth('player')), i, p;
    var prop = t.propId ? s.properties[t.propId] : null;
    if (prop && prop.ownerId !== 'player') prop = null;
    function cash(delta, why) { s.cash += Math.round(delta); lines.push((delta >= 0 ? '+' : '−') + U.fmt(Math.abs(delta)) + (why ? ' ' + why : '') + '.'); }
    function rep(d) { var a = St.rep(d); lines.push('Reputation ' + (a > 0 ? '+' : '') + Math.round(a * 10) / 10 + '.'); }
    function district() { var pp = prop || props[0]; return pp ? St.district(pp.cityId, pp.district) : null; }
    function shockDistrict(pct) { var pp = prop || props[0], d = district(); if (!d) return; d.ppsqm = Math.max(0.5, d.ppsqm * (1 + pct)); for (var k in s.properties) if (s.properties[k].cityId === pp.cityId && s.properties[k].district === pp.district) PE.Property.revalue(s.properties[k]); for (var k2 in s.listings) if (s.listings[k2].cityId === pp.cityId && s.listings[k2].district === pp.district) PE.Property.revalue(s.listings[k2]); lines.push(pp.district + ' prices ' + (pct >= 0 ? '+' : '') + Math.round(pct * 100) + '%.'); }
    function momentum(years) { var pp = prop || props[0], d = district(); if (!d) return; d.momentumUntil = s.year + years; d.momentum = Math.max(d.momentum, 0.02); lines.push(pp.district + ' is on the up for ' + years + ' years.'); }
    function weakest(n, factor) {
      var cands = props.filter(function (x) { return !x.renovation; }).sort(function (a, b) { return (a.trueValue - (a.mortgage ? a.mortgage.principal : 0)) - (b.trueValue - (b.mortgage ? b.mortgage.principal : 0)); });
      for (var k = 0; k < Math.min(n, cands.length); k++) { var q = PE.Market.saleQuote(cands[k], factor / PE.Market.saleMood()); q.fees = 0; q.cashGained = q.price - q.tax - q.debtRepaid; PE.Market.completeSale(cands[k], q, null, null); lines.push('Sold ' + cands[k].name + ' for ' + U.fmt(q.price) + '.'); }
    }
    if (fx.reputation) rep(fx.reputation);
    if (fx.cashPct) cash(s.cash * fx.cashPct);
    if (fx.cashPctNW) cash(nw * fx.cashPctNW);
    if (fx.donatePct) cash(-Math.max(0, s.cash) * fx.donatePct, 'given');
    if (fx.rentBoost) { s.flags.rentBoostYear = s.year; lines.push('Rents +' + Math.round(fx.rentBoost * 100) + '% this year.'); }
    if (fx.decay) { for (i = 0; i < props.length; i++) props[i].condition = U.clamp(props[i].condition - fx.decay, 0, 100); lines.push('Condition −' + fx.decay + ' on every building.'); }
    if (fx.giftLand) { var cost = Math.round(Math.max(0, s.cash) * fx.giftLand); var land = PE.Market.genProperty('london', { type: 'land', district: 'Kensington' }); var sc = cost / Math.max(1, land.trueValue); land.sqm = Math.round(U.clamp(land.sqm * sc, 300, 1500)); PE.Property.revalue(land); land.purchasePrice = cost; land.purchaseYear = s.year; St.setOwner(land, 'player'); s.cash -= cost; lines.push('Bought ' + land.name + ' for ' + U.fmt(cost) + '.'); }
    if (fx.giftProperty) { var g = fx.giftProperty, cityId = g.city || 'london', cost2 = Math.round(Math.max(0, s.cash) * g.pct); if (!s.cities[cityId].unlocked && !fx.unlockCity) cityId = 'london'; var gp = PE.Market.genProperty(cityId, { type: g.type, condition: g.condition }); gp.purchasePrice = cost2; gp.purchaseYear = s.year; St.setOwner(gp, 'player'); PE.Property.initTenancy(gp); s.cash -= cost2; lines.push('Acquired ' + gp.name + ' for ' + U.fmt(cost2) + '.'); }
    if (fx.unlockCity && !s.cities[fx.unlockCity].unlocked) { s.cities[fx.unlockCity].unlocked = true; s.cities[fx.unlockCity].unlockedYear = s.year; s.stats.cityUnlockYear[fx.unlockCity] = s.year; PE.Market.topUpCity(fx.unlockCity); lines.push(D.cityById[fx.unlockCity].name + ' unlocked.'); }
    if (fx.repayPct) { var total = 0; for (i = 0; i < props.length; i++) { p = props[i]; if (!p.mortgage) continue; var amt = Math.min(Math.round(p.mortgage.principal * fx.repayPct), Math.max(0, s.cash - total)); if (amt <= 0) continue; p.mortgage.principal -= amt; total += amt; if (p.mortgage.principal <= 0) p.mortgage = null; } s.cash -= total; lines.push('Repaid ' + U.fmt(total) + ' of mortgages.'); }
    if (fx.gamble) { var stake = Math.max(0, s.cash); if (R.chance(fx.gamble.p)) cash(stake * fx.gamble.win, 'won'); else cash(-stake * fx.gamble.lose, 'lost'); }
    if (fx.gambleNW) { if (R.chance(fx.gambleNW.p)) { if (fx.gambleNW.win) cash(nw * fx.gambleNW.win, 'won'); else lines.push('You win the case.'); } else { if (fx.gambleNW.loseWin) cash(nw * fx.gambleNW.loseWin, 'made'); else if (fx.gambleNW.lose) cash(-nw * fx.gambleNW.lose, 'lost'); else lines.push('Nothing came of it.'); if (fx.gambleNW.loseRep) rep(-fx.gambleNW.loseRep); } }
    if (fx.repGamble) { if (R.chance(fx.repGamble.p)) { if (fx.repGamble.win) rep(fx.repGamble.win); else lines.push('It blows over.'); } else rep(-fx.repGamble.lose); }
    if (fx.cashFixed) cash(fx.cashFixed * s.priceIndex);
    if (fx.propQuality && prop) { prop.quality = U.clamp(prop.quality * (1 + fx.propQuality), 0.5, PE.Property.MAX_QUALITY); PE.Property.revalue(prop); lines.push(prop.name + ' value ' + (fx.propQuality > 0 ? '+' : '') + Math.round(fx.propQuality * 100) + '%.'); }
    if (fx.propGamble && prop) { var g2 = fx.propGamble; if (R.chance(g2.p)) { if (g2.winCond) { prop.condition = U.clamp(prop.condition + g2.winCond, 0, 100); PE.Property.revalue(prop); } lines.push(prop.name + ': all is well.'); } else { if (g2.loseCostPct) cash(-prop.trueValue * g2.loseCostPct, 'repairs'); if (g2.loseCond) { prop.condition = U.clamp(prop.condition - g2.loseCond, 0, 100); PE.Property.revalue(prop); lines.push(prop.name + ' condition −' + g2.loseCond + '.'); } if (g2.loseRep) rep(-g2.loseRep); } }
    if (fx.propValueGamble && prop) { var g3 = fx.propValueGamble, pct = R.chance(g3.p) ? g3.win : -g3.lose; if (pct) { prop.quality = U.clamp(prop.quality * (1 + pct), 0.5, PE.Property.MAX_QUALITY); PE.Property.revalue(prop); } lines.push(prop.name + ' value ' + (pct >= 0 ? '+' : '') + Math.round(pct * 100) + '%.'); }
    if (fx.propRent && prop && !prop.lease) { prop.rentSetting = U.clamp(fx.propRent, 0.8, 1.2); prop.rentAnnual = PE.Property.grossRent(prop); lines.push(prop.name + ' rent set to ' + Math.round(prop.rentSetting * 100) + '%.'); }
    if (fx.propVacantYears && prop) { prop.vacantUntil = s.year + fx.propVacantYears; prop.occupancy = 0; lines.push(prop.name + ' stands empty until ' + prop.vacantUntil + '.'); }
    if (fx.districtShock) shockDistrict(fx.districtShock);
    if (fx.districtShockChance) { if (R.chance(fx.districtShockChance.p)) shockDistrict(fx.districtShockChance.shock); else lines.push('The objection succeeds.'); }
    if (fx.districtMomentum) momentum(fx.districtMomentum);
    if (fx.districtMomentumChance) { if (R.chance(fx.districtMomentumChance.p)) momentum(fx.districtMomentumChance.years); else lines.push('Nothing is built.'); }
    if (fx.petition && prop) { if (R.chance(fx.petition.p)) shockDistrict(fx.petition.shock); else { var q6 = PE.Market.saleQuote(prop, fx.petition.factor / PE.Market.saleMood()); q6.fees = 0; q6.cashGained = q6.price - q6.tax - q6.debtRepaid; PE.Market.completeSale(prop, q6, null, null); lines.push('The council took ' + prop.name + ' for ' + U.fmt(q6.price) + '.'); } }
    if (fx.sellPropFee && prop) { var q7 = PE.Market.saleQuote(prop, fx.sellPropFee / PE.Market.saleMood()); PE.Market.completeSale(prop, q7, null, null); lines.push('Sold ' + prop.name + ' for ' + U.fmt(q7.price) + '.'); }
    if (fx.sellToRival && prop && t.rivalId && s.rivals[t.rivalId] && !s.rivals[t.rivalId].bankrupt) { var q8 = PE.Market.saleQuote(prop, fx.sellToRival / PE.Market.saleMood()); q8.fees = 0; q8.cashGained = q8.price - q8.tax - q8.debtRepaid; PE.Market.completeSale(prop, q8, 'rival:' + t.rivalId, null); PE.Rivals.paid(t.rivalId, q8.price, prop); lines.push('Sold ' + prop.name + ' to ' + D.rivalById(t.rivalId).name + ' for ' + U.fmt(q8.price) + '.'); }
    if (fx.debtForgive) { var big = props.filter(function (x) { return x.mortgage; }).sort(function (a, b) { return b.mortgage.principal - a.mortgage.principal; })[0]; if (big) { var off = Math.round(big.mortgage.principal * fx.debtForgive); big.mortgage.principal -= off; if (big.mortgage.principal <= 0) big.mortgage = null; lines.push(U.fmt(off) + ' quietly written off.'); } }
    if (fx.insuredYears) { s.flags.insuredUntil = s.year + fx.insuredYears; lines.push('Insured until ' + s.flags.insuredUntil + '.'); }
    if (fx.evictionCity && t.cityId) { var hit = PE.Rivals.evictionIn(t.cityId); if (hit.length) lines.push(hit.map(function (id) { return D.rivalById(id).name; }).join(', ') + ' disapprove.'); }
    if (fx.evictionDistrict && prop) { var hit2 = PE.Rivals.evictionIn(prop.cityId, prop.district); if (hit2.length) lines.push(hit2.map(function (id) { return D.rivalById(id).name; }).join(', ') + ' disapprove.'); }
    if (fx.namedRelation && s.rivals[fx.namedRelation.id] && !s.rivals[fx.namedRelation.id].bankrupt) { PE.Rivals.adjustRelation(fx.namedRelation.id, fx.namedRelation.delta, ev.id); lines.push(D.rivalById(fx.namedRelation.id).name + ' relation ' + (fx.namedRelation.delta > 0 ? '+' : '') + fx.namedRelation.delta + '.'); }
    if (fx.sellWeakest) weakest(fx.count || 1, fx.sellWeakest);
    if (fx.sellMostLeveraged) { var lev = props.filter(function (x) { return x.mortgage && !x.renovation; }).sort(function (a, b) { return b.mortgage.principal / b.trueValue - a.mortgage.principal / a.trueValue; })[0]; if (lev) { var q1 = PE.Market.saleQuote(lev, fx.sellMostLeveraged / PE.Market.saleMood()); PE.Market.completeSale(lev, q1, null, null); lines.push('Sold ' + lev.name + ' for ' + U.fmt(q1.price) + '.'); } else lines.push('Nothing leveraged to sell.'); }
    if (fx.sellCommercial) { var cm = props.filter(function (x) { return (x.type === 'shop' || x.type === 'office') && !x.renovation; }).sort(function (a, b) { return b.trueValue - a.trueValue; })[0]; if (cm) { var q3 = PE.Market.saleQuote(cm, fx.sellCommercial / PE.Market.saleMood()); PE.Market.completeSale(cm, q3, null, null); lines.push('Sold ' + cm.name + ' for ' + U.fmt(q3.price) + '.'); } else lines.push('No shop or office to sell.'); }
    if (fx.refiBest) { var best = props.filter(function (x) { return !x.renovation; }).sort(function (a, b) { return b.trueValue - a.trueValue; })[0]; if (best) { if (best.mortgage) best.mortgage.lastRefi = s.year - 10; var r = PE.Finance.refinance(best.id, 0.7); lines.push(r.ok ? r.message : r.message); } }
    if (fx.refiAll) { var nref = 0; for (i = 0; i < props.length; i++) { p = props[i]; if (p.renovation) continue; if (p.mortgage) p.mortgage.lastRefi = s.year - 10; if (PE.Finance.refinance(p.id, fx.refiAll).ok) nref++; } lines.push(nref + ' loan(s) refinanced to ' + Math.round(fx.refiAll * 100) + '%.'); }
    if (fx.rentAll) { for (i = 0; i < props.length; i++) { if (!props[i].lease) { props[i].rentSetting = U.clamp(fx.rentAll, 0.8, 1.2); props[i].rentAnnual = PE.Property.grossRent(props[i]); } } lines.push('All rents set to ' + Math.round(fx.rentAll * 100) + '%.'); }
    if (fx.cityRent) { for (i = 0; i < props.length; i++) if (props[i].cityId === t.cityId && !props[i].lease) { props[i].rentSetting = fx.cityRent; props[i].rentAnnual = PE.Property.grossRent(props[i]); } lines.push('Rents cut in ' + D.cityById[t.cityId].name + '.'); }
    if (fx.cityVacancy) { s.flags.cityVacancyYear = s.year; s.flags.cityVacancyCity = t.cityId; s.flags.cityVacancyAmount = fx.cityVacancy; lines.push('Tenants leave in ' + D.cityById[t.cityId].name + '.'); }
    if (fx.vacancyYears) lines.push('Vacancy doubled until ' + (s.year + fx.vacancyYears) + '.');
    if (fx.commercialRent) lines.push('Commercial rents −20% this year.');
    if (fx.bombInsured) lines.push('Insured against bombing.');
    if (fx.surveyorYears) lines.push('A surveyor is retained for ' + fx.surveyorYears + ' years.');
    if (fx.convertAmort) { var nconv = 0; for (i = 0; i < props.length; i++) { p = props[i]; if (p.mortgage && p.mortgage.type === 'io') { p.mortgage.type = 'amort'; p.mortgage.yearsLeft = B.amortYears; p.mortgage.rate = PE.Finance.rateFor('player', 'amort', p.mortgage.fixed); nconv++; } } lines.push(nconv + ' loan(s) converted to 25-year amortising.'); }
    if (fx.fixAll) { var nfix = 0; for (i = 0; i < props.length; i++) { p = props[i]; if (p.mortgage && !p.mortgage.fixed) { p.mortgage.fixed = true; p.mortgage.rate = PE.Finance.rateFor('player', p.mortgage.type, true); nfix++; } } lines.push(nfix + ' loan(s) fixed.'); }
    if (fx.surveyorYears) s.flags.surveyorUntil = s.year + fx.surveyorYears;
    if (fx.extraDistressed) { s.flags.extraDistressed += fx.extraDistressed; lines.push(fx.extraDistressed + ' distressed listings expected next year.'); }
    if (fx.extraLand) { s.flags.extraLand += fx.extraLand; lines.push(fx.extraLand + ' plots expected next year.'); }
    if (fx.warLease) { s.flags.warLeaseUntil = s.year + fx.warLease; lines.push('Leased to the War Office until ' + (s.year + fx.warLease) + '.'); }
    if (fx.vacancyYears) s.flags.vacancyUntil = s.year + fx.vacancyYears;
    if (fx.bombInsured) s.flags.bombInsured = true;
    if (fx.bombRisk) { if (prop && R.chance(0.5)) { prop.condition = U.clamp(prop.condition - 40, 0, 100); lines.push(prop.name + ' was hit in a raid (condition −40).'); } else lines.push('The bombs missed you.'); }
    if (fx.renoDiscountYears) { s.flags.renoDiscountUntil = s.year + fx.renoDiscountYears; lines.push('Renovations −30% until ' + s.flags.renoDiscountUntil + '.'); }
    if (fx.cityMomentum) { var ds = s.cities[fx.cityMomentum.city].districts; for (var dn in ds) ds[dn].momentumUntil = s.year + fx.cityMomentum.years; lines.push(D.cityById[fx.cityMomentum.city].name + ' is on the up.'); }
    if (fx.convertOffice) { var off = props.filter(function (x) { return x.type === 'office' && !x.renovation; })[0]; if (off) { var cc = Math.round(off.trueValue * 0.1); s.cash -= cc; off.type = 'apartment'; off.model3d = 'AP'; off.condition = U.clamp(off.condition + 20, 0, 100); PE.Property.revalue(off); lines.push(off.name + ' converted to flats for ' + U.fmt(cc) + '.'); } else lines.push('You own no office to convert.'); }
    if (fx.commercialRent) s.flags.commercialRentYear = s.year;
    if (fx.lease && prop) { prop.lease = { years: fx.lease.years, yearsLeft: fx.lease.years, setting: fx.lease.setting }; lines.push(prop.name + ' let for ' + fx.lease.years + ' years.'); }
    if (fx.propCostPct && prop) cash(-prop.trueValue * fx.propCostPct, 'repairs');
    if (fx.propCondition && prop) { prop.condition = U.clamp(prop.condition + fx.propCondition, 0, 100); PE.Property.revalue(prop); lines.push(prop.name + ' condition now ' + Math.round(prop.condition) + '.'); }
    if (fx.sellProp && prop) { var q4 = PE.Market.saleQuote(prop, fx.sellProp / PE.Market.saleMood()); q4.fees = 0; q4.cashGained = q4.price - q4.tax - q4.debtRepaid; PE.Market.completeSale(prop, q4, null, null); lines.push('Sold ' + prop.name + ' for ' + U.fmt(q4.price) + '.'); }
    if (fx.forcedSaleChance && prop && R.chance(fx.forcedSaleChance.p)) { var q5 = PE.Market.saleQuote(prop, fx.forcedSaleChance.factor / PE.Market.saleMood()); PE.Market.completeSale(prop, q5, null, null); lines.push('The council took ' + prop.name + ' anyway for ' + U.fmt(q5.price) + '.'); }
    if (fx.revealBest) { var ls = PE.Market.listingArray(null).filter(function (l) { return s.cities[l.cityId].unlocked; }).sort(function (a, b) { return a.askingPrice / a.trueValue - b.askingPrice / b.trueValue; })[0]; if (ls) { ls.revealed = true; lines.push(ls.name + ' is worth ' + U.fmt(ls.trueValue) + ' (asking ' + U.fmt(ls.askingPrice) + ').'); } }
    if (fx.memberTrait && t.memberId) { var mm = PE.Dynasty.member(t.memberId); if (mm && mm.traits.indexOf(fx.memberTrait) < 0) mm.traits.push(fx.memberTrait); }
    if (fx.rivalRelation && t.rivalId && s.rivals[t.rivalId]) { PE.Rivals.adjustRelation(t.rivalId, fx.rivalRelation, ev.id); lines.push(D.rivalById(t.rivalId).name + ' relation ' + (fx.rivalRelation > 0 ? '+' : '') + fx.rivalRelation + '.'); }
    if (fx.inheritProperty) { var ip = PE.Market.genProperty(t.cityId && s.cities[t.cityId].unlocked ? t.cityId : 'london', { type: t.type }); ip.purchasePrice = ip.trueValue; ip.purchaseYear = s.year; ip.mortgage = PE.Finance.makeMortgage('player', ip.trueValue * fx.inheritProperty.ltv, 'io', false); St.setOwner(ip, 'player'); PE.Property.initTenancy(ip); lines.push('Inherited ' + ip.name + ' (' + U.fmt(ip.trueValue) + ', mortgage ' + U.fmt(ip.mortgage.principal) + ').'); }
    if (fx.fireManager && t.cityId) s.cities[t.cityId].managerId = null;
    if (fx.refurbForTenant && prop) { var rc = PE.Property.renovationCost(prop, 'refurbish'); s.cash -= rc; prop.renovation = { tier: 'refurbish', yearsLeft: 1, cost: rc, overrun: 0, delay: 0, started: s.year }; prop.rentSetting = 1.2; prop.rentLockUntil = s.year + 4; lines.push('Refurbishing ' + prop.name + ' for ' + U.fmt(rc) + '; rent 120% for 4 years.'); }
    if (fx.absorbRival) { var a = fx.absorbRival, n = PE.Rivals.absorb(a.rivalId, a.by, a.price); if (a.by === 'player') s.stats.vultures++; lines.push(a.by === 'player' ? 'You acquire ' + n + ' building(s) for ' + U.fmt(a.price) + '.' : (a.by ? D.rivalById(a.by).name + ' absorb the portfolio.' : 'The banks take the portfolio.')); }
    return lines;
  };

  /* ---------- Morning paper (bible §2) ---------- */
  E.makePaper = function () {
    var s = PE.S(), lines = [], cyc = s.cycle, next = D.scriptedCycles[s.year + 1], crier = St.hasPerk('town_crier');
    lines.push({ kind: 'macro', text: 'The bank rate stands at ' + (s.baseRate * 100).toFixed(1) + '%. The market is in ' + D.cycles[cyc.phase].name.toLowerCase() + '.' });
    // P3.4: the twelve biggest set-pieces are foreshadowed a year ahead (noisy; the Town crier perk makes it reliable)
    var pre = null; for (var ph = 0; ph < D.historicalEvents.length; ph++) if (D.historicalEvents[ph].year === s.year + 1 && D.historicalEvents[ph].prewarn) pre = D.historicalEvents[ph].prewarn;
    if (pre && R.chance(crier ? 0.95 : B.prewarnAccuracy)) lines.push({ kind: 'macro', text: pre, prewarn: true });
    else if (next && R.chance(crier ? 0.95 : B.foreshadowAccuracy)) lines.push({ kind: 'macro', text: (next === 'depression' || next === 'recession') ? 'Bankers whisper of trouble next year.' : 'Bankers talk of a coming boom.' });
    else if (cyc.yearsLeft <= 1) {
      var nx = D.cycles[cyc.phase].next, bestK = null; for (var k in nx) if (!bestK || nx[k] > nx[bestK]) bestK = k;
      if (R.chance(0.3)) bestK = R.pick(Object.keys(nx));
      lines.push({ kind: 'macro', text: 'The City expects ' + D.cycles[bestK].name.toLowerCase() + ' ahead.' });
    }
    var bestD = null, bestM = -1, worstD = null, worstM = 1, cities = St.unlockedCities();
    for (var i = 0; i < cities.length; i++) { var ds = s.cities[cities[i]].districts; for (var dn in ds) { if (ds[dn].momentum > bestM) { bestM = ds[dn].momentum; bestD = { c: cities[i], d: dn }; } if (ds[dn].momentum < worstM) { worstM = ds[dn].momentum; worstD = { c: cities[i], d: dn }; } } }
    if (bestD && bestM > 0.012 && R.chance(0.7)) lines.push({ kind: 'city', text: R.pick(['A new tramline is planned for ', 'Fashionable people are moving to ', 'Builders are busy in ']) + bestD.d + ', ' + D.cityById[bestD.c].name + '.' });
    else if (worstD && worstM < -0.01 && R.chance(0.5)) lines.push({ kind: 'city', text: worstD.d + ', ' + D.cityById[worstD.c].name + ' is losing its shine.' });
    var head = s.dynasty.head;
    if (head.age >= 60 && R.chance(0.6)) lines.push({ kind: 'dynasty', text: head.name + ' is ' + head.age + '. The question of succession is whispered at dinner.' });
    var kids = PE.Dynasty.children();
    for (var j = 0; j < kids.length; j++) if (kids[j].age === B.adultAge - 1) lines.push({ kind: 'dynasty', text: kids[j].name + ' comes of age next year.' });
    for (var h = 0; h < D.historicalEvents.length; h++) if (D.historicalEvents[h].year === s.year) lines.push({ kind: 'headline', text: D.historicalEvents[h].title + '.' });
    s.paper = lines;
    return lines;
  };

  PE.Events = E;
})(typeof window !== 'undefined' ? window : global);
