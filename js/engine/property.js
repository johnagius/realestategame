/* PE.Property — the physical asset: valuation (district £/sqm × type ×
   condition), rent and occupancy, operating costs, condition decay, the three
   renovation tiers with overrun/delay risk, build-to-suit commissions on land
   plots (P4.3), and management capacity/managers. */
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

  /* Annual gross rent at full occupancy, before the letting-mode factor (LOCATION-SLICE §3). */
  P.grossRentCore = function (p) {
    var t = P.type(p), c = P.city(p), band = P.band(p), s = PE.S();
    if (!t.canRent || p.condition < B.unrentableBelow) return 0;
    var setting = p.lease ? p.lease.setting : p.rentSetting;
    var r = p.trueValue * c.grossYield * t.yieldMult * band.rentFactor * setting;
    // city traits
    if (c.trait === 'tourism' && D.cycles[s.cycle.phase]) r *= D.cycles[s.cycle.phase].tourismMult; // visitors ride the cycle (P4.4)
    if (c.trait === 'tech_hub' && St.eraIdx() >= 4 && (t.id === 'studio' || t.id === 'apartment' || t.id === 'office')) r *= 1.15;
    // saturation: owning >30% of a district lowers your yield (bible §6.3)
    if (p.ownerId === 'player') {
      var d = St.district(p.cityId, p.district);
      if (d && d.playerCount / d.stock > B.saturationShare) r *= (1 - B.saturationYieldPenalty);
    }
    if (s.flags.warLeaseUntil && s.year < s.flags.warLeaseUntil && p.ownerId === 'player') r *= 0.8;
    if (s.flags.rentBoostYear === s.year && p.ownerId === 'player') r *= 1.10;
    if (s.flags.commercialRentYear === s.year && p.ownerId === 'player' && (t.id === 'shop' || t.id === 'office')) r *= 0.8;
    if (p.flagship && p.ownerId === 'player') r *= (1 + B.flagshipRentBonus); // ENG-B8: the name on the door draws better tenants
    return r;
  };
  /* Short-let multiplier (LOCATION-SLICE §3): base × visitor × cycle × saturation. Long let: 1.
     The tourism city trait stays inside the core — choosing short let in Miami stacks the two
     deliberately (a disclosed strategy, §3 "no double-counting"). */
  P.shortLetFactor = function (p) {
    if (P.letModeOf(p) !== 'short' || !P.shortLetEligible(p)) return 1;
    var s = PE.S(), v = P.visitorRating(p.cityId, p.district);
    return B.shortLetBase * B.shortLetVisitor[v] * (B.shortLetCycle[s.cycle.phase] || 1) * P.shortLetSaturation(p.ownerId, p.cityId, p.district).factor;
  };
  P.grossRent = function (p) { return Math.round(P.grossRentCore(p) * P.shortLetFactor(p)); };

  /* Occupancy for the year, given management context. est=true skips the RNG noise (estimates must
     not draw from the gameplay stream). */
  P.occupancyFor = function (p, ctx, est) {
    var t = P.type(p), s = PE.S(), c = P.city(p);
    if (!t.canRent || p.condition < B.unrentableBelow) return 0;
    if (p.renovation && p.renovation.tier !== 'patch') return 0;
    if (p.vacantUntil && s.year < p.vacantUntil) return 0;
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
    if (s.flags.cityVacancyYear === s.year && s.flags.cityVacancyCity === p.cityId && p.ownerId === 'player') vacancy += s.flags.cityVacancyAmount || 0.2;
    var tc = D.tenantClasses[p.tenantClass] || D.tenantClasses.clerks;
    vacancy += (1 - tc.stability) * 0.1;
    if (p.ownerId === 'player' && p.tenant) vacancy *= (1 - B.tenantLoyaltyVacancyCut * p.tenant.loyalty); // ENG-B6: a settled tenant stays put
    if (p.ownerId === 'player' && p.reletYear === s.year) vacancy += B.tenantReletVacancy; // ENG-B6: re-letting takes part of the year
    if (!est) vacancy += R.range(-0.02, 0.02);
    return U.clamp(1 - vacancy, 0, 1);
  };

  /* Operating costs for a year (bible §3.2, §6.1). est=true replaces the unmanaged-fines dice roll
     with its expected value; modeOv evaluates costs as if the property were on that letting mode. */
  P.costsFor = function (p, rent, ctx, est, modeOv) {
    var c = P.city(p), s = PE.S();
    var era = St.era();
    var maint = p.trueValue * (B.maintenanceMin + (B.maintenanceMax - B.maintenanceMin) * (1 - p.condition / 100));
    if (s.year - (p.builtYear || s.year) > B.decayAgeYears) maint += p.trueValue * B.maintenanceAgeExtra;
    if (p.type === 'land') maint *= 0.2;
    maint += p.trueValue * era.insurance; // compulsory insurance in later eras
    if ((modeOv || P.letModeOf(p)) === 'short') maint += p.trueValue * B.shortLetOpexPct; // linen, agents, voids between guests (§3)
    var tax = c.trait === 'tax_haven' ? 0 : p.trueValue * c.taxRate * era.propTaxMult;
    var mgmt = 0, fines = 0;
    if (ctx && ctx.mgmt === 'manager') mgmt = rent * (ctx.fee || B.managerFeeDefault);
    if (ctx && ctx.mgmt === 'none') fines = est ? p.trueValue * B.unmanagedFine * B.unmanagedFineChance : (R.chance(B.unmanagedFineChance) ? p.trueValue * B.unmanagedFine : 0);
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
    if (p.ownerId === 'player' && p.tenant) d *= (1 - B.tenantLoyaltyDecayCut * p.tenant.loyalty); // ENG-B6
    if (P.letModeOf(p) === 'short') d += B.shortLetDecay; // LOCATION-SLICE §3: turnover wear
    if (ctx && ctx.mgmt === 'none') d += B.unmanagedDecay;
    if (ctx && ctx.mgmt === 'manager') d *= (1 - 0.3 * (ctx.quality || 0.6));
    p.condition = U.clamp(p.condition - d, 0, 100);
    if (c.trait === 'heritage_city' && p.condition < 30) p.condition = 30;
  };

  /* ENG-B6: the named tenant's year. A tenant arrives quietly once the building has been operated
     a year; raising the rent past their tolerance risks losing exactly that tenant (the building
     stands empty next year); holding or cutting the rent builds loyalty, which keeps them and
     lowers vacancy and decay. Returns a report line when someone leaves. */
  P.tenantLeaveChance = function (p, rise) {
    var t = p.tenant;
    if (!t || rise <= B.tenantRiseTolerance) return 0;
    var heat = Math.min(1, (rise - B.tenantRiseTolerance) / 0.1);
    return U.clamp(B.tenantLeaveBase * (0.4 + heat) * (1 - t.loyalty * B.tenantLoyaltyRetention), 0, 1);
  };
  P.tenantYear = function (p) {
    var s = PE.S();
    if (P.letModeOf(p) === 'short') { p.tenant = null; return null; } // short let has no named tenant (LOCATION-SLICE §3)
    if (p.ownerId !== 'player' || p.lease || !P.type(p).canRent || p.condition < B.unrentableBelow) { if (p.tenant && (p.lease || !P.type(p).canRent)) p.tenant = null; return null; }
    if (p.vacantUntil && s.year < p.vacantUntil) { p.tenant = null; return null; } // emptied by an event: they fled
    var t = p.tenant;
    if (!t) { p.tenant = { name: R.pick(D.tenantNames), since: s.year, loyalty: B.tenantStartLoyalty, rentSeen: p.rentSetting }; return null; } // arrivals are quiet
    var rise = p.rentSetting - t.rentSeen;
    t.rentSeen = p.rentSetting;
    var lc = P.tenantLeaveChance(p, rise);
    if (lc > 0 && R.chance(lc)) {
      p.tenant = null;
      p.reletYear = s.year + 1; // they paid this year; re-letting costs part of next year
      return t.name + ' leaves ' + p.name + ' over the rent rise.';
    }
    t.loyalty = U.clamp(t.loyalty + (rise <= 0.005 ? B.tenantLoyaltyGain : B.tenantLoyaltyGain * 0.25), 0, 1);
    return null;
  };

  /* One year of operation: returns the cash-flow lines and mutates the asset. */
  P.operate = function (p, ctx) {
    var s = PE.S();
    var lastRent = typeof p.lastRent === 'number' ? p.lastRent : null;
    P.revalue(p);
    var gross = P.grossRent(p);
    var occ = P.occupancyFor(p, ctx);
    var rent = Math.round(gross * occ);
    var costs = P.costsFor(p, rent, ctx);
    p.occupancy = occ; p.rentAnnual = gross; p.lastRent = rent;
    P.decay(p, ctx);
    if (p.lease) { p.lease.yearsLeft--; if (p.lease.yearsLeft <= 0) p.lease = null; }
    if (p.rentLockUntil && s.year >= p.rentLockUntil) p.rentLockUntil = 0;
    p.tenantClass = P.tenantClassFor(p);
    var tenantLine = P.tenantYear(p);
    p.history.push({ year: s.year, value: p.trueValue });
    if (p.history.length > 30) p.history.shift();
    var total = costs.maintenance + costs.tax + costs.management + costs.fines;
    return { rent: rent, maintenance: costs.maintenance, tax: costs.tax, management: costs.management, fines: costs.fines, costs: total, net: rent - total, line: tenantLine, mode: P.letModeOf(p), lastRent: lastRent };
  };

  /* ---------- Letting strategy (LOCATION-SLICE §2–§4): long let vs short let ----------
     p.letMode: 'long' (default; absent means 'long') or 'short'. p.letLockUntil: the year the
     agent contract ends; the mode cannot change before it. */
  P.letModeOf = function (p) { return p.letMode === 'short' ? 'short' : 'long'; };
  P.visitorBase = function (cityId, district) { var m = D.districtVisitor[cityId]; return (m && m[district]) || 0; };
  /* +1 when a landmark feeding this district is standing (era gate passed); the cap is applied
     in visitorRating. Pure lookup — nothing is read from rendered positions. */
  P.landmarkBoost = function (cityId, district) {
    var lm = D.landmarkDistrict[cityId]; if (!lm) return 0;
    for (var tok in lm) {
      if (lm[tok] !== district) continue;
      var gate = D.landmarkEraGate[tok];
      if (gate && St.eraIdx() < D.eraIndex(gate)) continue; // not built yet: no draw
      return 1;
    }
    return 0;
  };
  P.visitorRating = function (cityId, district) { return Math.min(2, P.visitorBase(cityId, district) + P.landmarkBoost(cityId, district)); };
  P.shortLetEligibleType = function (p) { return D.shortLetTypes.indexOf(p.type) >= 0; };
  P.shortLetEligible = function (p) { return P.shortLetEligibleType(p) && P.visitorRating(p.cityId, p.district) >= 1; };

  /* The district's short-let share from one owner's viewpoint: own properties at full weight,
   every other owner's at half (you compete for the same visitors, §3). */
  P.shortLetShare = function (ownerId, cityId, district) {
    var s = PE.S(), mine = 0, myShort = 0, other = 0, otherShort = 0;
    for (var id in s.properties) {
      var q = s.properties[id];
      if (q.cityId !== cityId || q.district !== district || !q.ownerId) continue;
      if (q.ownerId === ownerId) { mine++; if (P.letModeOf(q) === 'short') myShort++; }
      else { other++; if (P.letModeOf(q) === 'short') otherShort++; }
    }
    var denom = mine + 0.5 * other;
    return denom > 0 ? (myShort + 0.5 * otherShort) / denom : 0;
  };
  P.shortLetSaturation = function (ownerId, cityId, district) {
    var share = P.shortLetShare(ownerId, cityId, district);
    return { share: share, factor: Math.max(B.shortLetSaturationFloor, 1 - 0.5 * Math.max(0, share - B.shortLetSaturationStart)) };
  };

  /* Engine estimate for one mode (§6): gross and net this year as a ±comps-noise range, never a
     point promise. Draws nothing from the RNG stream, so reading the sheet never moves the game. */
  P._lettingEstimate = function (p, mode) {
    var s = PE.S(), noise = PE.Market.compsNoise();
    var ctx = p.ownerId === 'player' ? (P.assignManagement()[p.id] || { mgmt: 'self' }) : { mgmt: 'manager', quality: 0.7, fee: B.managerFeeDefault };
    var factor = 1;
    if (mode === 'short') {
      var v = P.visitorRating(p.cityId, p.district);
      factor = B.shortLetBase * B.shortLetVisitor[v] * (B.shortLetCycle[s.cycle.phase] || 1) * P.shortLetSaturation(p.ownerId || 'player', p.cityId, p.district).factor;
    }
    var core = P.grossRentCore(p), occ = P.occupancyFor(p, ctx, true);
    function at(m) {
      var gross = core * factor * m, rent = gross * occ;
      var c = P.costsFor(p, rent, ctx, true, mode);
      return { gross: Math.round(gross), net: Math.round(rent - c.maintenance - c.tax - c.management - c.fines) };
    }
    var lo = at(1 - noise), hi = at(1 + noise);
    return { gross: [lo.gross, hi.gross], net: [lo.net, hi.net] };
  };

  /* The property sheet's "Letting strategy" block (§6): current mode, eligibility with reasons,
     lock state, switch cost, and a per-mode estimate payload. Works for owned properties and for
     board listings (pre-purchase evaluation: mode long, no switch). */
  P.lettingInfo = function (propertyId) {
    var s = PE.S(), p = s.properties[propertyId] || s.listings[propertyId];
    if (!p) return PE.fail('No such property');
    var owned = p.ownerId === 'player';
    var mode = P.letModeOf(p), visitor = P.visitorRating(p.cityId, p.district);
    var lockedUntil = p.letLockUntil || 0, canSwitch = owned && s.year >= lockedUntil;
    var reasons = [];
    if (!P.shortLetEligibleType(p)) reasons.push('A ' + P.type(p).name.toLowerCase() + ' cannot be short-let');
    if (visitor < 1) reasons.push(p.district + ' draws no visitors to speak of');
    if (P.type(p).canRent && p.condition < B.unrentableBelow) reasons.push('Unrentable in this condition');
    if (p.lease) reasons.push('A fixed lease has ' + p.lease.yearsLeft + ' year' + (p.lease.yearsLeft > 1 ? 's' : '') + ' left');
    if (p.renovation) reasons.push('Works are in progress');
    if (owned && p.flagship) reasons.push('The flagship flies the family name — it cannot change letting mode');
    if (owned && !canSwitch) reasons.push('The agent contract runs until ' + lockedUntil);
    var eligible = P.shortLetEligible(p) && p.condition >= B.unrentableBelow;
    var sat = P.shortLetSaturation(p.ownerId || 'player', p.cityId, p.district);
    var longEst = P._lettingEstimate(p, 'long'), shortEst = P._lettingEstimate(p, 'short');
    var shortNote = 'Swings with the cycle; higher running costs, faster wear.';
    if (sat.share > B.shortLetSaturationStart) shortNote += ' The district is filling with short lets — returns are diluted.';
    return PE.ok({
      eligible: eligible, reasons: reasons, mode: mode, lockedUntil: lockedUntil, canSwitch: canSwitch,
      switchCost: Math.max(1, Math.round(p.trueValue * B.shortLetSwitchCostPct)),
      visitor: visitor, landmarkBoost: P.landmarkBoost(p.cityId, p.district),
      long: { gross: longEst.gross, net: longEst.net, note: 'Steady; a named tenant may settle in.' },
      short: { gross: shortEst.gross, net: shortEst.net, note: shortNote, saturation: sat }
    });
  };

  /* Switch the letting strategy (§4): 2% of value once, mode locked for 3 years, one switch per
     property per year by construction. Flagship, works in progress, an active lease (to short)
     and the lock all refuse. */
  P.setLetMode = function (propertyId, mode) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (mode !== 'long' && mode !== 'short') return PE.fail('Unknown letting mode');
    if (mode === P.letModeOf(p)) return PE.fail(p.name + ' is already on a ' + mode + ' let');
    if (p.flagship) return PE.fail('The flagship flies the family name — it cannot change letting mode');
    if (p.renovation) return PE.fail('Finish the works first');
    if (p.letLockUntil && s.year < p.letLockUntil) return PE.fail('The agent contract runs until ' + p.letLockUntil);
    if (mode === 'short') {
      if (!P.shortLetEligibleType(p)) return PE.fail('A ' + P.type(p).name.toLowerCase() + ' cannot be short-let');
      if (P.visitorRating(p.cityId, p.district) < 1) return PE.fail(p.district + ' draws no visitors to speak of');
      if (p.condition < B.unrentableBelow) return PE.fail('The building is unrentable; renovate first');
      if (p.lease) return PE.fail('A fixed lease has ' + p.lease.yearsLeft + ' year' + (p.lease.yearsLeft > 1 ? 's' : '') + ' left; the guests come after');
    }
    var cost = Math.max(1, Math.round(p.trueValue * B.shortLetSwitchCostPct));
    if (s.cash < cost) return PE.fail('Not enough cash (' + U.fmt(cost) + ' needed for the refit)');
    s.cash -= cost;
    p.letMode = mode;
    p.letLockUntil = s.year + B.shortLetLockYears;
    if (mode === 'short') { p.tenant = null; p.reletYear = 0; }
    p.rentAnnual = P.grossRent(p);
    return PE.ok({ message: p.name + (mode === 'short' ? ' is furnished for visiting guests' : ' returns to a long let') + '; the agent contract runs until ' + p.letLockUntil + '. Refit cost ' + U.fmt(cost) + '.', cost: cost, mode: mode, lockedUntil: p.letLockUntil, rentAnnual: p.rentAnnual });
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
      out.push({ tier: k, name: t.name, cost: P.renovationCost(p, k), years: years, conditionGain: t.gain, uplift: t.uplift, risk: t.risk * (St.hasPerk('builders_guild') ? 0.5 : 1), riskKind: t.riskKind });
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
    if (PE.Analytics && !s.flags.firstRenoTracked) { s.flags.firstRenoTracked = true; PE.Analytics.track('first_renovation', { tier: tier }); }
    if (years === 0) { P.applyRenovation(p, tier); return PE.ok({ message: D.renovation[tier].name + ' done. Condition now ' + Math.round(p.condition) + ' (' + P.band(p).name + ').', cost: cost, property: p }); }
    // Risk is rolled now but revealed at completion.
    var risk = t.risk * (St.hasPerk('builders_guild') ? 0.5 : 1);
    var overrun = tier === 'refurbish' && R.chance(risk) ? Math.round(cost * t.riskCost) : 0;
    var delay = tier === 'rebuild' && R.chance(risk) ? 1 : 0;
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
    if (p.buildJob) { // a commissioned build (P4.3)
      if (p.ownerId !== 'player') { p.buildJob = null; p.renovation = null; return { propertyId: p.id, text: p.name + ': the half-built shell stands abandoned.' }; }
      return P.progressBuild(p);
    }
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

  /* Rewarded ad (P6.2): shave one year off work in progress, once per year.
     Covers build-to-suit jobs too (renovation {tier:'build'} + buildJob): both
     timers tick, never below 1 — completion stays with the endYear machinery. */
  P.speedUpRenovation = function (propertyId) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (!p.renovation) return PE.fail('No works under way here');
    if (s.flags.speedupYear === s.year) return PE.fail('One speed-up a year; the yard cannot be bribed twice.');
    if (p.renovation.yearsLeft <= 1) return PE.fail('Nearly done — the yard needs no encouragement.');
    s.flags.speedupYear = s.year;
    p.renovation.yearsLeft = Math.max(1, p.renovation.yearsLeft - 1);
    if (p.buildJob) p.buildJob.yearsLeft = Math.max(1, p.buildJob.yearsLeft - 1);
    return PE.ok({ message: 'Coin in the foreman\'s pocket: ' + p.name + ' will be ready a year sooner (' + p.renovation.yearsLeft + ' to go).', yearsLeft: p.renovation.yearsLeft });
  };

  /* ---------- Build-to-suit (P4.3): commission a building on a plot you own ----------
     Choose a class (the building type the plot becomes) and a spec (cost vs expected
     value). Cost is staged over the build; the delivered true value is the build cost
     x the era factor x the spec multiplier x the district's drift during the build,
     ± noise — so the same commission profits in a rising district and loses in a
     falling one. The Builder trait cuts cost 15% (bible §7). Okonkwo & Sons charge
     +10% but halve the delay risk. The renovation flag doubles as the scaffolding
     flag, so the 3D map shows the site working. */
  P.buildTargetType = function (cls) {
    var e = St.eraIdx(), c = D.buildClasses[cls]; if (!c) return null;
    var t = c.types[0][0];
    for (var i = 0; i < c.types.length; i++) if (e >= c.types[i][1]) t = c.types[i][0];
    return t;
  };
  P.developerAvailable = function () {
    var s = PE.S(), rv = s.rivals ? s.rivals.okonkwo : null;
    if (!rv) return { ok: false, message: 'No builder of that calibre is on the scene.' };
    if (rv.bankrupt) return { ok: false, message: 'Okonkwo & Sons are bankrupt.' };
    if (rv.merged) return { ok: false, message: 'Okonkwo & Sons build only for your allied house now.' };
    return { ok: true, message: '' };
  };
  /* The finished building's as-if market value at 'good' condition, quality 1 — the anchor for build cost. */
  P.buildAsIfValue = function (p, cls) {
    var t = D.propertyTypes[P.buildTargetType(cls)], d = St.district(p.cityId, p.district);
    return t && d ? p.sqm * d.ppsqm * t.factor : 0;
  };
  P.buildCost = function (p, cls, spec, developer) {
    var sp = D.buildSpecs[spec]; if (!sp) return 0;
    var cost = P.buildAsIfValue(p, cls) * sp.costFrac;
    if (St.hasTrait('builder')) cost *= 0.85;
    if (developer) cost *= 1 + B.buildDeveloperFee;
    return Math.max(1, Math.round(cost));
  };
  P.buildEraFactor = function () { return U.clamp(B.buildEraFactorBase + St.era().drift * B.buildEraFactorDriftMult, 1, 1.3); };
  P.commissionQuote = function (propertyId, cls, spec, developer) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (p.type !== 'land') return PE.fail('Only a building plot can take a commission');
    if (p.renovation || p.buildJob) return PE.fail('Work is already under way here');
    var c = D.buildClasses[cls], sp = D.buildSpecs[spec];
    if (!c) return PE.fail('Unknown building class');
    if (!sp) return PE.fail('Unknown specification');
    developer = !!developer;
    var dev = P.developerAvailable();
    if (developer && !dev.ok) return PE.fail(dev.message);
    var cost = P.buildCost(p, cls, spec, developer);
    var stages = sp.years, stageCost = Math.round(cost / stages), lastStage = cost - stageCost * (stages - 1);
    var expected = Math.round(cost * P.buildEraFactor() * sp.valueMult);
    return PE.ok({ propertyId: propertyId, cls: cls, spec: spec, developer: developer,
      className: c.name, classDesc: c.desc, specName: sp.name, specDesc: sp.desc,
      targetType: P.buildTargetType(cls), targetName: D.propertyTypes[P.buildTargetType(cls)].name,
      totalCost: cost, stages: stages, stageCost: stageCost, lastStage: lastStage, years: sp.years,
      delayRiskPct: Math.round(sp.delayRisk * (developer ? B.buildDeveloperDelayMult : 1) * 100),
      eraFactor: Math.round(P.buildEraFactor() * 100) / 100, condition: sp.condition,
      expectedValue: expected, lowEstimate: Math.round(expected * (1 - sp.noise)), highEstimate: Math.round(expected * (1 + sp.noise)),
      developerAvailable: dev.ok, developerReason: dev.message, developerFee: developer ? cost - P.buildCost(p, cls, spec, false) : 0 });
  };
  P.commissionBuild = function (propertyId, cls, spec, developer) {
    var s = PE.S(), p = s.properties[propertyId];
    var q = P.commissionQuote(propertyId, cls, spec, developer); // validates class, spec, developer and site
    if (!q.ok) return q;
    if (s.cash < q.stageCost) return PE.fail('Not enough cash for the first stage (' + U.fmt(q.stageCost) + ')');
    s.cash -= q.stageCost;
    var sp = D.buildSpecs[spec];
    var delayRisk = sp.delayRisk * (q.developer ? B.buildDeveloperDelayMult : 1);
    var delay = R.chance(delayRisk) ? 1 : 0;
    var years = sp.years + delay;
    p.buildJob = { cls: cls, spec: spec, developer: q.developer, targetType: q.targetType, totalCost: q.totalCost, stageCost: q.stageCost, lastStage: q.lastStage, stages: q.stages, paid: 1, yearsLeft: years, delay: delay, ppsqmAtStart: St.district(p.cityId, p.district).ppsqm, started: s.year };
    p.renovation = { tier: 'build', yearsLeft: years, started: s.year }; // scaffolding on the 3D map
    s.stats.builds = (s.stats.builds || 0) + 1;
    if (PE.Analytics && !s.flags.firstRenoTracked) { s.flags.firstRenoTracked = true; PE.Analytics.track('first_renovation', { tier: 'build' }); }
    var msg = (q.developer ? 'Okonkwo & Sons break ground' : 'Builders break ground') + ' on ' + p.name + ': a ' + q.specName.toLowerCase() + ' ' + q.targetName.toLowerCase() + ', ready in about ' + sp.years + ' year' + (sp.years > 1 ? 's' : '') + '.';
    return PE.ok({ message: msg, cost: q.stageCost, years: years, job: U.clone(p.buildJob) });
  };
  /* endYear: pay the next stage, tick the timer, deliver at completion. Returns a report line or null. */
  P.progressBuild = function (p) {
    var s = PE.S(), j = p.buildJob; if (!j) return null;
    if (j.paid < j.stages) { s.cash -= j.paid === j.stages - 1 ? j.lastStage : j.stageCost; j.paid++; }
    j.yearsLeft--;
    if (j.yearsLeft <= 0 && j.delay > 0) {
      j.delay--; j.yearsLeft = 1; if (p.renovation) p.renovation.yearsLeft = 1;
      return { propertyId: p.id, text: p.name + ': the ' + D.propertyTypes[j.targetType].name.toLowerCase() + ' build runs a year late.' };
    }
    if (j.yearsLeft > 0) { if (p.renovation) p.renovation.yearsLeft = j.yearsLeft; return null; }
    return { propertyId: p.id, text: P.completeBuild(p) };
  };
  P.completeBuild = function (p) {
    var s = PE.S(), j = p.buildJob, sp = D.buildSpecs[j.spec];
    var d = St.district(p.cityId, p.district);
    var driftMult = d ? d.ppsqm / Math.max(0.01, j.ppsqmAtStart) : 1; // the district's move during the build
    var noise = 1 + R.range(-sp.noise, sp.noise);
    var value = Math.max(1, Math.round(j.totalCost * P.buildEraFactor() * sp.valueMult * driftMult * noise));
    p.buildJob = null; p.renovation = null;
    p.type = j.targetType; p.model3d = D.propertyTypes[p.type].model3d; p.era = St.era().id; p.builtYear = s.year;
    p.condition = sp.condition; p.quality = 1; p.lastRenovated = s.year;
    P.revalue(p);
    p.quality = U.clamp(value / Math.max(1, p.trueValue), 0.5, P.MAX_QUALITY); // land the delivered value on the formula
    P.revalue(p);
    p.rentAnnual = P.grossRent(p); p.tenantClass = P.tenantClassFor(p);
    p.occupancy = P.type(p).canRent && p.condition >= B.unrentableBelow ? B.baseOccupancy : 0;
    p.history.push({ year: s.year, value: p.trueValue });
    if (p.history.length > 30) p.history.shift();
    s.stats.buildsDone = (s.stats.buildsDone || 0) + 1;
    return 'The ' + D.buildClasses[j.cls].name.toLowerCase() + ' build completes on ' + p.name + ': ' + D.propertyTypes[p.type].name + ' (' + sp.name + ', ' + P.band(p).name + '), worth ' + U.fmt(p.trueValue) + '.';
  };

  /* ENG-B8: one named flagship per city. Prestige (+rent, +standing) but a target:
     rivals bid on it more (and pay up), random events find it more often. */
  P.setFlagship = function (propertyId, name) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player') return PE.fail('Not your property');
    if (p.type === 'land') return PE.fail('Land cannot be a flagship');
    if (p.renovation) return PE.fail('Finish the works first');
    name = String(name === undefined || name === null ? '' : name).trim().replace(/\s+/g, ' ');
    if (name.length < 3 || name.length > 40) return PE.fail('Give it a name (3–40 characters)');
    var props = St.playerProps(), cleared = null;
    for (var i = 0; i < props.length; i++) if (props[i].cityId === p.cityId && props[i].flagship && props[i].id !== p.id) { props[i].flagship = false; cleared = props[i]; }
    p.flagship = true; p.name = name;
    return PE.ok({ message: name + ' now flies as the flagship of your ' + D.cityById[p.cityId].name + ' holdings.' + (cleared ? ' ' + cleared.name + ' stands down.' : ''), replaced: cleared ? cleared.id : null });
  };
  P.releaseFlagship = function (propertyId) {
    var s = PE.S(), p = s.properties[propertyId];
    if (!p || p.ownerId !== 'player' || !p.flagship) return PE.fail('No flagship here');
    p.flagship = false;
    return PE.ok({ message: p.name + ' no longer flies as the flagship.' });
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
    if (setting > 1.1 && p.condition < 40 && setting > was) St.rep(-1); // slumlording
    p.rentAnnual = P.grossRent(p);
    p.tenantClass = P.tenantClassFor(p);
    var r = { message: 'Rent set to ' + Math.round(setting * 100) + '% of market.', rentAnnual: p.rentAnnual, rentSetting: setting };
    if (p.tenant) { r.tenant = p.tenant.name; r.tenantRisk = Math.round(P.tenantLeaveChance(p, setting - p.tenant.rentSeen) * 100); } // ENG-B6
    return PE.ok(r);
  };

  /* Public view of a property for the UI. */
  P.tenantLabel = function (t) { return t.loyalty >= 0.75 ? 'settled' : t.loyalty >= 0.45 ? 'warming to you' : 'new'; };
  P.view = function (p) {
    var v = U.clone(p); v.conditionLabel = P.band(p).name; v.cityName = D.cityById[p.cityId].name; v.typeName = P.type(p).name;
    v.equity = p.trueValue - (p.mortgage ? p.mortgage.principal : 0); v.ltv = p.mortgage ? p.mortgage.principal / p.trueValue : 0;
    if (p.tenant) v.tenantLabel = P.tenantLabel(p.tenant);
    v.renovationOptions = p.ownerId === 'player' && !p.buildJob ? P.renovationOptions(p) : [];
    v.buildOptions = p.ownerId === 'player' && p.type === 'land' && !p.renovation && !p.buildJob ? D.buildClassIds.map(function (cid) { return D.buildClasses[cid].name; }) : [];
    return v;
  };

  PE.Property = P;
  /* P4 public calls, guarded with the same wrap pattern as game.js (its wrap list predates Phase 4). */
  (function (mod, names) {
    for (var i = 0; i < names.length; i++) (function (n) {
      var raw = mod[n]; if (typeof raw !== 'function') return;
      mod[n] = PE.guard(n, raw); mod['_' + n] = raw;
    })(names[i]);
  })(P, ['commissionQuote', 'commissionBuild', 'speedUpRenovation', 'lettingInfo', 'setLetMode']);
})(typeof window !== 'undefined' ? window : global);
