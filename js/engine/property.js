/* PE.Property — the physical asset: valuation (district £/sqm × type ×
   condition), rent and occupancy, operating costs, condition decay, the three
   renovation tiers with overrun/delay risk, and management capacity/managers. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var P = {};
  P.UPLIFT_TO_QUALITY = 0.35;   // renovation "value uplift" beyond the condition band, as a quality multiplier
  P.MAX_QUALITY = 1.4;

  P.band = function (p) { return D.conditionBand(p.condition); };
  P.type = function (p) { return D.propertyTypes[p.type]; };
  P.city = function (p) { return D.cityById[p.cityId]; };

  /* trueValue = sqm × districtPricePerSqm × typeFactor × conditionFactor × quality (bible §3.2) */
  P.computeValue = function (p) {
    var d = St.district(p.cityId, p.district), t = P.type(p), band = P.band(p);
    if (!d || !t) return p.trueValue || 0;
    var v = p.sqm * d.ppsqm * t.factor * (t.id === 'land' ? 1 : band.valueFactor) * p.quality;
    if (p.renovation && p.renovation.tier === 'rebuild') v *= 0.85; // a building site is worth less until finished
    return Math.max(1, Math.round(v));
  };
  P.revalue = function (p) { p.trueValue = P.computeValue(p); return p.trueValue; };

  P.tenantClassFor = function (p) {
    var t = p.type, mult = (D.cityById[p.cityId].districts.filter(function (x) { return x.name === p.district; })[0] || { mult: 1 }).mult;
    if (t === 'shop' || t === 'office' || t === 'warehouse' || t === 'tower') return mult >= 1.4 ? 'corporate' : 'merchants';
    if (t === 'mansion' || t === 'villa' || t === 'penthouse') return p.rentSetting >= 1.1 ? 'luxury' : 'gentry';
    if (t === 'lodging' || t === 'tenement' || t === 'studio') return p.rentSetting < 0.95 ? 'labourers' : 'clerks';
    if (mult >= 1.5) return 'gentry';
    if (mult >= 0.9) return 'clerks';
    return p.rentSetting > 1.05 ? 'clerks' : 'labourers';
  };
  P.initTenancy = function (p) {
    p.rentSetting = p.rentSetting || 1.0;
    p.tenantClass = P.tenantClassFor(p);
    p.occupancy = P.type(p).canRent && p.condition >= B.unrentableBelow ? B.baseOccupancy : 0;
    p.rentAnnual = P.grossRent(p);
  };

  /* Annual gross rent at full occupancy. */
  P.grossRent = function (p) {
    var t = P.type(p), c = P.city(p), band = P.band(p), s = PE.S();
    if (!t.canRent || p.condition < B.unrentableBelow) return 0;
    var setting = p.lease ? p.lease.setting : p.rentSetting;
    var r = p.trueValue * c.grossYield * t.yieldMult * band.rentFactor * setting;
    // city traits
    var isLux = (t.id === 'mansion' || t.id === 'villa' || t.id === 'penthouse');
    if (c.trait === 'elite_enclave') r *= isLux ? 1.25 : 0.8;
    if (c.trait === 'tech_hub' && St.eraIdx() >= 4 && (t.id === 'studio' || t.id === 'apartment' || t.id === 'office')) r *= 1.15;
    // saturation: owning >30% of a district lowers your yield (bible §6.3)
    if (p.ownerId === 'player') {
      var d = St.district(p.cityId, p.district);
      if (d && d.playerCount / d.stock > B.saturationShare) r *= (1 - B.saturationYieldPenalty);
    }
    if (s.flags.warLeaseUntil && s.year < s.flags.warLeaseUntil && p.ownerId === 'player') r *= 0.8;
    if (s.flags.rentBoostYear === s.year && p.ownerId === 'player') r *= 1.10;
    if (s.flags.commercialRentYear === s.year && p.ownerId === 'player' && (t.id === 'shop' || t.id === 'office')) r *= 0.8;
    return Math.round(r);
  };

  /* Occupancy for the year, given management context. */
  P.occupancyFor = function (p, ctx) {
    var t = P.type(p), s = PE.S(), c = P.city(p);
    if (!t.canRent || p.condition < B.unrentableBelow) return 0;
    if (p.renovation && p.renovation.tier !== 'patch') return 0;
    if (p.lease) return 1.0;
    if (s.flags.warLeaseUntil && s.year < s.flags.warLeaseUntil && p.ownerId === 'player') return 1.0;
    var vacancy = 1 - B.baseOccupancy;
    vacancy += B.vacancyPerRentStep * Math.max(0, p.rentSetting - 1.0) * 0.5;
    if (p.rentSetting < 1.0) vacancy *= 0.6;
    if (p.condition < B.highVacancyBelow) vacancy *= 2;
    vacancy *= D.cycles[s.cycle.phase].vacancy;
    if (ctx && ctx.mgmt === 'none') vacancy += B.unmanagedVacancy;
    if (ctx && ctx.mgmt === 'manager') vacancy *= (1 - 0.4 * (ctx.quality || 0.6));
    if (c.trait === 'rent_control') vacancy -= 0.03;
    if (s.flags.vacancyUntil && s.year < s.flags.vacancyUntil && p.ownerId === 'player') vacancy *= 2;
    if (s.flags.cityVacancyYear === s.year && s.flags.cityVacancyCity === p.cityId && p.ownerId === 'player') vacancy += 0.2;
    var tc = D.tenantClasses[p.tenantClass] || D.tenantClasses.clerks;
    vacancy += (1 - tc.stability) * 0.1;
    vacancy += R.range(-0.02, 0.02);
    return U.clamp(1 - vacancy, 0, 1);
  };

  /* Operating costs for a year (bible §3.2, §6.1). */
  P.costsFor = function (p, rent, ctx) {
    var c = P.city(p), s = PE.S();
    var era = St.era();
    var maint = p.trueValue * (B.maintenanceMin + (B.maintenanceMax - B.maintenanceMin) * (1 - p.condition / 100));
    if (s.year - (p.builtYear || s.year) > B.decayAgeYears) maint += p.trueValue * B.maintenanceAgeExtra;
    if (p.type === 'land') maint *= 0.2;
    maint += p.trueValue * era.insurance; // compulsory insurance in later eras
    var tax = c.trait === 'tax_haven' ? 0 : p.trueValue * c.taxRate * era.propTaxMult;
    var mgmt = 0, fines = 0;
    if (ctx && ctx.mgmt === 'manager') mgmt = rent * (ctx.fee || B.managerFeeDefault);
    if (ctx && ctx.mgmt === 'none' && R.chance(B.unmanagedFineChance)) fines = p.trueValue * B.unmanagedFine;
    return { maintenance: Math.round(maint), tax: Math.round(tax), management: Math.round(mgmt), fines: Math.round(fines) };
  };

  /* Condition decay for a year. */
  P.decay = function (p, ctx) {
    var s = PE.S(), t = P.type(p), c = P.city(p);
    if (p.renovation) return;
    if (t.id === 'land') return;
    var d = R.range(B.decayMin, B.decayMax) * t.decay;
    if (s.year - (p.builtYear || s.year) > B.decayAgeYears) d += 1;
    var tc = D.tenantClasses[p.tenantClass] || D.tenantClasses.clerks;
    d *= (1.3 - tc.care * 0.4);
    if (p.rentSetting < 0.95) d *= 0.85;             // long, careful tenants
    if (ctx && ctx.mgmt === 'none') d += B.unmanagedDecay;
    if (ctx && ctx.mgmt === 'manager') d *= (1 - 0.3 * (ctx.quality || 0.6));
    p.condition = U.clamp(p.condition - d, 0, 100);
    if (c.trait === 'heritage_city' && p.condition < 30) p.condition = 30;
  };

  /* One year of operation: returns the cash-flow lines and mutates the asset. */
  P.operate = function (p, ctx) {
    var s = PE.S();
    P.revalue(p);
    var gross = P.grossRent(p);
    var occ = P.occupancyFor(p, ctx);
    var rent = Math.round(gross * occ);
    var costs = P.costsFor(p, rent, ctx);
    p.occupancy = occ; p.rentAnnual = gross;
    P.decay(p, ctx);
    if (p.lease) { p.lease.yearsLeft--; if (p.lease.yearsLeft <= 0) p.lease = null; }
    if (p.rentLockUntil && s.year >= p.rentLockUntil) p.rentLockUntil = 0;
    p.tenantClass = P.tenantClassFor(p);
    p.history.push({ year: s.year, value: p.trueValue });
    if (p.history.length > 30) p.history.shift();
    var total = costs.maintenance + costs.tax + costs.management + costs.fines;
    return { rent: rent, maintenance: costs.maintenance, tax: costs.tax, management: costs.management, fines: costs.fines, costs: total, net: rent - total };
  };

  /* ---------- Management capacity (bible §6.1) ---------- */
  /* Returns { propId: {mgmt:'manager'|'self'|'none', quality, fee} } for the player's portfolio. */
  P.assignManagement = function () {
    var s = PE.S(), props = St.playerProps(), out = {}, perCity = {}, selfUsed = 0;
    for (var i = 0; i < props.length; i++) {
      var p = props[i], cs = s.cities[p.cityId], m = cs.managerId ? D.managerById(cs.managerId) : null;
      perCity[p.cityId] = perCity[p.cityId] || 0;
      if (m && perCity[p.cityId] < B.managerCapacity) { perCity[p.cityId]++; out[p.id] = { mgmt: 'manager', quality: m.quality, fee: m.fee }; }
      else if (selfUsed < B.personalCapacity) { selfUsed++; out[p.id] = { mgmt: 'self' }; }
      else out[p.id] = { mgmt: 'none' };
    }
    return out;
  };
  P.capacitySummary = function () {
    var a = P.assignManagement(), n = { manager: 0, self: 0, none: 0 };
    for (var k in a) n[a[k].mgmt]++;
    return n;
  };

  P._availableManagersRaw = function () {
    var rep = PE.S().reputation, out = [];
    for (var i = 0; i < D.managers.length; i++) if (D.managers[i].minReputation <= rep) out.push(D.managers[i]);
    return out;
  };
  P.hireManager = function (cityId, managerId) {
    var s = PE.S(), cs = s.cities[cityId], m = D.managerById(managerId);
    if (!cs || !cs.unlocked) return PE.fail('City not unlocked');
    if (!m) return PE.fail('Unknown manager');
    if (m.minReputation > s.reputation) return PE.fail(m.name + ' will not work for a family of your standing (needs reputation ' + m.minReputation + ')');
    cs.managerId = m.id; cs.managerSince = s.year;
    return PE.ok({ message: m.name + ' now manages your ' + D.cityById[cityId].name + ' buildings for ' + Math.round(m.fee * 100) + '% of rent.' });
  };
  P.fireManager = function (cityId) {
    var cs = PE.S().cities[cityId];
    if (!cs || !cs.managerId) return PE.fail('No manager in that city');
    cs.managerId = null;
    return PE.ok({ message: 'Manager dismissed.' });
  };

  /* ---------- Renovation (bible §3.4) ---------- */
  P.renovationCost = function (p, tier) {
    var s = PE.S(), t = D.renovation[tier], c = P.city(p);
    var cost = p.trueValue * t.cost;
    if (p.type === 'land' && tier === 'rebuild') cost = p.trueValue * 1.6;       // building on a plot costs more than the plot
    if (St.hasTrait('builder')) cost *= 0.85;
    if (c.trait === 'redevelopment') cost *= 0.8;
    if (s.flags.renoDiscountUntil && s.year < s.flags.renoDiscountUntil) cost *= 0.7;
    return Math.max(1, Math.round(cost));
  };
  P.renovationOptions = function (p) {
    var out = [];
    for (var k in D.renovation) {
      var t = D.renovation[k];
      if (p.type === 'land' && k !== 'rebuild') continue;
      if (k === 'patch' && p.condition >= 100) continue;
      var years = t.years; if (k === 'refurbish' && P.city(p).trait === 'heritage_city') years += 1;
      out.push({ tier: k, name: t.name, cost: P.renovationCost(p, k), years: years, conditionGain: t.gain, uplift: t.uplift, risk: t.risk, riskKind: t.riskKind });
    }
    return out;
  };
  P.renovate = function (propertyId, tier) {
    var s = PE.S(), p = s.properties[propertyId], t = D.renovation[tier];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (!t) return PE.fail('Unknown renovation tier');
    if (p.renovation) return PE.fail('Work already in progress');
    if (p.type === 'land' && tier !== 'rebuild') return PE.fail('A plot can only be built on (Rebuild)');
    var cost = P.renovationCost(p, tier);
    if (s.cash < cost) return PE.fail('Not enough cash (' + U.fmt(cost) + ' needed)');
    s.cash -= cost;
    s.stats.renovations++;
    var years = t.years; if (tier === 'refurbish' && P.city(p).trait === 'heritage_city') years += 1;
    if (years === 0) { P.applyRenovation(p, tier); return PE.ok({ message: D.renovation[tier].name + ' done. Condition now ' + Math.round(p.condition) + ' (' + P.band(p).name + ').', cost: cost, property: p }); }
    // Risk is rolled now but revealed at completion.
    var overrun = tier === 'refurbish' && R.chance(t.risk) ? Math.round(cost * t.riskCost) : 0;
    var delay = tier === 'rebuild' && R.chance(t.risk) ? 1 : 0;
    p.renovation = { tier: tier, yearsLeft: years, cost: cost, overrun: overrun, delay: delay, started: s.year };
    p.occupancy = 0;
    return PE.ok({ message: t.name + ' started; ready in ' + years + ' year' + (years > 1 ? 's' : '') + '.', cost: cost, property: p });
  };
  P.applyRenovation = function (p, tier) {
    var s = PE.S(), t = D.renovation[tier];
    if (tier === 'rebuild') {
      p.condition = 100;
      p.type = D.rebuildTarget(p.type, St.eraIdx());
      p.era = St.era().id; p.builtYear = s.year; p.model3d = D.propertyTypes[p.type].model3d;
      if (p.ownerId === 'player') s.stats.rebuilds++;
    } else p.condition = U.clamp(p.condition + t.gain, 0, 100);
    p.quality = Math.min(P.MAX_QUALITY, p.quality * (1 + t.uplift * P.UPLIFT_TO_QUALITY));
    p.lastRenovated = s.year;
    P.revalue(p);
    p.rentAnnual = P.grossRent(p);
    p.tenantClass = P.tenantClassFor(p);
  };
  /* Called at endYear for every property with work in progress. Returns a report line or null. */
  P.progressRenovation = function (p) {
    var s = PE.S();
    if (!p.renovation) return null;
    var r = p.renovation;
    r.yearsLeft--;
    if (r.yearsLeft <= 0 && r.delay > 0) { r.delay--; r.yearsLeft = 1; return { propertyId: p.id, text: p.name + ': the rebuild is delayed a year.' }; }
    if (r.yearsLeft > 0) return null;
    var line = p.name + ': ' + D.renovation[r.tier].name + ' complete.';
    if (r.overrun > 0 && p.ownerId === 'player') { s.cash -= r.overrun; line += ' Overrun: ' + U.fmt(r.overrun) + ' extra.'; }
    p.renovation = null;
    P.applyRenovation(p, r.tier);
    line += ' Now ' + P.band(p).name + ', worth ' + U.fmt(p.trueValue) + '.';
    return { propertyId: p.id, text: line };
  };

  P.setRent = function (propertyId, setting) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (p.lease) return PE.fail('Rent is fixed by a lease for ' + p.lease.yearsLeft + ' more years');
    if (p.rentLockUntil && s.year < p.rentLockUntil) return PE.fail('Rent is locked until ' + p.rentLockUntil);
    setting = Math.round(U.clamp(+setting || 1, 0.8, 1.2) * 100) / 100;
    if (P.city(p).trait === 'rent_control' && setting > p.rentSetting + 0.02) setting = Math.round((p.rentSetting + 0.02) * 100) / 100;
    var was = p.rentSetting;
    p.rentSetting = setting;
    if (setting > 1.1 && p.condition < 40 && setting > was) s.reputation = U.clamp(s.reputation - 1, 0, 100); // slumlording
    p.rentAnnual = P.grossRent(p);
    p.tenantClass = P.tenantClassFor(p);
    return PE.ok({ message: 'Rent set to ' + Math.round(setting * 100) + '% of market.', rentAnnual: p.rentAnnual, rentSetting: setting });
  };

  /* Public view of a property for the UI. */
  P.view = function (p) {
    var v = U.clone(p); v.conditionLabel = P.band(p).name; v.cityName = D.cityById[p.cityId].name; v.typeName = P.type(p).name;
    v.equity = p.trueValue - (p.mortgage ? p.mortgage.principal : 0); v.ltv = p.mortgage ? p.mortgage.principal / p.trueValue : 0;
    v.renovationOptions = p.ownerId === 'player' ? P.renovationOptions(p) : [];
    return v;
  };

  PE.Property = P;
})(typeof window !== 'undefined' ? window : global);
