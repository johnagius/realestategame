/* PE.Dynasty — people: the head of the family ages and dies, children are
   born, educated and (stub) married into rival houses; succession applies
   estate tax (reducible by a trust), partial reputation inheritance and the
   heir's traits. Generations are the long-term counterforce and the score. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var D = PE.Data, B = PE.Data.balance, U = PE.util, R = PE.RNG, St = PE.State;

  var Dy = {};

  Dy.newMember = function (age, gender, traits, relation) {
    var s = PE.S();
    return { id: St.nextId('m'), name: R.pick(D.firstNames[gender]), gender: gender, age: age, born: s.year - age, traits: traits, relation: relation, educated: false, married: null, alive: true, disgraced: false };
  };
  Dy.rollTraits = function (n) {
    var out = [], pool = D.traitIds.slice();
    while (out.length < n && pool.length) { var t = R.pick(pool); pool.splice(pool.indexOf(t), 1); out.push(t); }
    return out;
  };
  Dy.create = function (fam, traitId) {
    var traits = fam.trait ? [fam.trait] : [];
    if (traitId && D.traits[traitId] && traits.indexOf(traitId) < 0 && traits.length < 2) traits.push(traitId);
    if (!traits.length) traits.push('negotiator');
    var head = Dy.newMember(R.int(28, 36), R.chance(0.5) ? 'm' : 'f', traits, 'head');
    head.name = R.pick(D.firstNames[head.gender]);
    return { head: head, members: [head], generation: 1, heirId: null, trust: false, trustSince: 0, alliances: [], proposals: [], mergers: 0, deaths: [], surname: fam.name.replace(/^The /, '').replace(/ Family$/, '').replace(/s$/, '') };
  };
  Dy.children = function () { var d = PE.S().dynasty, out = []; for (var i = 0; i < d.members.length; i++) if (d.members[i].relation === 'child' && d.members[i].alive && !d.members[i].disgraced) out.push(d.members[i]); return out; };
  Dy.member = function (id) { var d = PE.S().dynasty; for (var i = 0; i < d.members.length; i++) if (d.members[i].id === id) return d.members[i]; return null; };

  Dy.mortality = function (age) {
    var era = St.era();
    return Math.min(age >= 90 ? 0.9 : 0.6, B.mortalityBase * Math.pow(B.mortalityGrowth, age - 30) * era.lifeMult);
  };

  /* One year of family life. Returns report lines. */
  Dy.yearly = function (report) {
    var s = PE.S(), d = s.dynasty, lines = [], i;
    for (i = 0; i < d.members.length; i++) if (d.members[i].alive) d.members[i].age++;
    // Births
    if (d.head.age >= 22 && d.head.age <= 45 && Dy.children().length < B.maxChildren && R.chance(B.birthChance)) {
      var kid = Dy.newMember(0, R.chance(0.5) ? 'm' : 'f', Dy.rollTraits(R.int(1, 2)), 'child');
      d.members.push(kid); lines.push('A child is born: ' + kid.name + '.');
    }
    // Coming of age
    for (i = 0; i < d.members.length; i++) { var m = d.members[i]; if (m.relation === 'child' && m.alive && m.age === B.adultAge) lines.push(m.name + ' comes of age (' + m.traits.map(function (t) { return D.traits[t].name; }).join(', ') + ').'); }
    // Spendthrift drain
    if (St.hasTrait('spendthrift') && s.cash > 0) { var drain = Math.round(s.cash * B.spendthriftDrain); s.cash -= drain; lines.push(d.head.name + ' spent ' + U.fmt(drain) + ' on nothing in particular.'); }
    // Gambler windfalls/losses
    if (St.hasTrait('gambler') && R.chance(0.15)) { var amt = Math.round(Math.abs(s.cash) * 0.05 + 10 * s.priceIndex); if (R.chance(0.5)) { s.cash += amt; lines.push(d.head.name + ' won ' + U.fmt(amt) + ' at cards.'); } else { s.cash -= amt; lines.push(d.head.name + ' lost ' + U.fmt(amt) + ' at cards.'); } }
    // Trust cost
    if (d.trust) { var nw = Math.max(0, St.netWorth('player')), tc = Math.round(nw * B.trustCostPct); s.cash -= tc; report.cashFlow.taxes += tc; }
    // Charity endowment: a steady cost, goodwill, and a smaller estate-tax bill (bible §7)
    if (d.charity) { var nwc = Math.max(0, St.netWorth('player')), cc = Math.round(nwc * B.charityCostPct); s.cash -= cc; report.cashFlow.taxes += cc; s.reputation = Math.min(100, s.reputation + B.charityRepPerYear); }
    // Child mortality (small) and head mortality
    for (i = 0; i < d.members.length; i++) { var c = d.members[i]; if (c.relation === 'child' && c.alive && R.chance(Dy.mortality(c.age) * 0.3)) { c.alive = false; lines.push(c.name + ' has died.'); } }
    if (R.chance(Dy.mortality(d.head.age))) lines = lines.concat(Dy.succession(report));
    return lines;
  };

  Dy.estateTaxRate = function () {
    var s = PE.S(), fam = D.familyById(s.familyId), rate = St.era().estateTax + fam.estateTaxAdj;
    if (s.dynasty.trust) rate *= B.estateTrustFactor;
    if (s.dynasty.charity) rate = Math.max(0, rate - B.charityTaxCut);
    return Math.round(rate * 1000) / 1000;
  };

  Dy.succession = function (report) {
    var s = PE.S(), d = s.dynasty, old = d.head, lines = [];
    old.alive = false; d.deaths.push({ year: s.year, name: old.name, age: old.age, generation: d.generation });
    lines.push(old.name + ' dies at ' + old.age + '.');
    var heir = d.heirId ? Dy.member(d.heirId) : null;
    if (!heir || !heir.alive || heir.disgraced || heir.age < B.adultAge) {
      var adults = Dy.children().filter(function (c) { return c.age >= B.adultAge; }).sort(function (a, b) { return b.age - a.age; });
      heir = adults[0] || null;
    }
    var regent = false;
    if (!heir) { heir = Dy.newMember(R.int(24, 34), R.chance(0.5) ? 'm' : 'f', Dy.rollTraits(1), 'child'); heir.name += ' (a cousin)'; d.members.push(heir); regent = true; }
    // Estate tax, with the breakdown the ceremony shows (P3.3)
    var fam = D.familyById(s.familyId), baseRate = St.era().estateTax + fam.estateTaxAdj + (regent ? 0.05 : 0);
    var rate = baseRate;
    if (d.trust) rate *= B.estateTrustFactor;
    if (d.charity) rate = Math.max(0, rate - B.charityTaxCut);
    var nw = Math.max(0, St.netWorth('player')), gross = Math.round(nw * baseRate), tax = Math.round(nw * rate);
    var afterTrust = Math.round(nw * (baseRate * (d.trust ? B.estateTrustFactor : 1)));
    var breakdown = { netWorth: nw, baseRate: Math.round(baseRate * 1000) / 10, regent: regent, trustSaved: Math.max(0, gross - afterTrust), charitySaved: Math.max(0, afterTrust - tax), rate: Math.round(rate * 1000) / 10, tax: tax, oldHead: old.name, oldAge: old.age, heirTraits: heir.traits.slice(), heirAge: heir.age };
    s.cash -= tax; report.cashFlow.taxes += tax;
    lines.push('Estate tax: ' + U.fmt(tax) + ' (' + Math.round(rate * 100) + '%' + (d.trust ? ', halved by the trust' : '') + (d.charity ? ', reduced by the endowment' : '') + ').');
    // Pay with forced sales if needed
    var sold = 0;
    while (s.cash < 0 && St.propertyCount('player') > 0) {
      var props = St.playerProps().slice().sort(function (a, b) { return (b.trueValue - (b.mortgage ? b.mortgage.principal : 0)) - (a.trueValue - (a.mortgage ? a.mortgage.principal : 0)); });
      var p = props[0], q = PE.Market.saleQuote(p, B.quickSaleFactor);
      if (q.cashGained <= 0) break;
      PE.Market.completeSale(p, q, null, report); sold++;
    }
    if (sold) lines.push(sold + ' building(s) sold to pay the taxman.');
    // New head
    heir.relation = 'head'; d.head = heir; d.heirId = null; d.generation++;
    for (var i = 0; i < d.members.length; i++) if (d.members[i].relation === 'child' && d.members[i] !== heir) d.members[i].relation = 'sibling';
    if (d.trust) s.stats.trustSuccessions++;
    s.reputation = Math.round(U.clamp(s.reputation * B.reputationInherit + (regent ? -10 : 0) + (St.hasTrait('charmer') ? 8 : 0), 0, 100));
    lines.push(heir.name + ' is head of the family (generation ' + d.generation + '): ' + heir.traits.map(function (t) { return D.traits[t].name; }).join(', ') + '.');
    report.dynasty.push({ kind: 'succession', heir: heir.name, generation: d.generation, tax: tax, breakdown: breakdown });
    return lines;
  };

  Dy.summary = function () {
    var s = PE.S(), d = s.dynasty;
    return PE.ok({ head: U.clone(d.head), members: U.clone(d.members.filter(function (m) { return m.alive; })), generation: d.generation, heirId: d.heirId, trust: d.trust, charity: !!d.charity,
      estateTaxRate: Dy.estateTaxRate(), reputation: s.reputation, alliances: U.clone(d.alliances), deaths: U.clone(d.deaths), surname: d.surname,
      mortality: Math.round(Dy.mortality(d.head.age) * 1000) / 10, educationCost: Dy.educationCost(),
      marriageCandidates: Dy.marriageCandidates(), merger: Dy.mergerInfo(), mergers: d.mergers || 0 });
  };
  Dy.chooseHeir = function (memberId) {
    var m = Dy.member(memberId);
    if (!m || !m.alive || m.relation !== 'child' || m.disgraced) return PE.fail('Not an eligible heir');
    PE.S().dynasty.heirId = memberId;
    return PE.ok({ message: m.name + ' will inherit.' });
  };
  Dy.educationCost = function () { var s = PE.S(); return Math.max(Math.round(40 * s.priceIndex), Math.round(Math.max(0, St.netWorth('player')) * B.educationCostPct)); };
  Dy.educate = function (memberId) {
    var s = PE.S(), m = Dy.member(memberId);
    if (!m || !m.alive) return PE.fail('No such family member');
    if (m.educated) return PE.fail(m.name + ' has already been educated');
    if (m.age < 10 || m.age > 30) return PE.fail('Education is for the young (10–30)');
    var cost = Dy.educationCost();
    if (s.cash < cost) return PE.fail('Not enough cash (' + U.fmt(cost) + ')');
    s.cash -= cost; m.educated = true; s.stats.educated++;
    var msg;
    var si = m.traits.indexOf('spendthrift');
    if (si >= 0) { m.traits.splice(si, 1); msg = m.name + ' has outgrown the Spendthrift habit.'; }
    else if (m.traits.length < 2) { var pool = D.traitIds.filter(function (t) { return D.traits[t].positive && m.traits.indexOf(t) < 0; }); var t = R.pick(pool); m.traits.push(t); msg = m.name + ' gains ' + D.traits[t].name + '.'; }
    else msg = m.name + ' returns polished but unchanged.';
    return PE.ok({ message: msg, cost: cost, member: U.clone(m) });
  };
  Dy.setupTrust = function () {
    var s = PE.S(), d = s.dynasty;
    if (d.trust) return PE.fail('A family trust already exists');
    d.trust = true; d.trustSince = s.year;
    return PE.ok({ message: 'Family trust established: estate tax halved, costs 2% of net worth each year.' });
  };
  Dy.dissolveTrust = function () { var d = PE.S().dynasty; if (!d.trust) return PE.fail('No trust'); d.trust = false; return PE.ok({ message: 'Trust dissolved.' }); };
  Dy.toggleCharity = function () {
    var s = PE.S(), d = s.dynasty;
    d.charity = !d.charity;
    return PE.ok({ message: d.charity ? 'The ' + s.dynasty.surname + ' endowment is established: 1% of net worth each year, goodwill, and 5 points off estate tax.' : 'The endowment is wound down.', charity: d.charity });
  };
  /* ---------- Marriage and alliance (P3.2, bible §7) ---------- */
  Dy.marriageEligibility = function (memberId, rivalId) {
    var s = PE.S(), m = Dy.member(memberId), rv = s.rivals[rivalId], rd = D.rivalById(rivalId);
    if (!m || !m.alive || m.disgraced) return 'No such family member';
    if (m.relation === 'head') return 'The head of the family cannot be married off';
    if (m.married) return m.name + ' is already married';
    if (m.age < B.marriageMinAge || m.age > B.marriageMaxAge) return m.name + ' must be between ' + B.marriageMinAge + ' and ' + B.marriageMaxAge;
    if (!rv || !rd || rv.bankrupt) return 'No such family';
    if (rv.allied) return rd.name + ' are already allied with your house';
    if ((s.relations[rivalId] || 0) < 0) return rd.name + ' think too little of you (relation ' + rv.relation + ')';
    if (s.reputation < B.marriageMinReputation) return 'A reputation of ' + B.marriageMinReputation + ' is needed before ' + rd.name + ' would consider it';
    var last = Dy.lastProposal(memberId, rivalId);
    if (last && s.year - last.year < B.marriageCooldownYears) return rd.name + ' have not forgotten the last proposal (' + last.year + ')';
    return null;
  };
  Dy.lastProposal = function (memberId, rivalId) { var ps = PE.S().dynasty.proposals || [], out = null; for (var i = 0; i < ps.length; i++) if (ps[i].rivalId === rivalId) out = ps[i]; return out; };
  /* Acceptance probability: relation and relative net worth, clamped 5–95%. */
  Dy.marriageChance = function (rivalId) {
    var s = PE.S(), rel = s.relations[rivalId] || 0, mine = Math.max(1, St.netWorth('player')), theirs = Math.max(1, St.netWorth('rival:' + rivalId));
    var wealth = U.clamp(Math.log(mine / theirs) / Math.LN2 / 2, -1, 1); // ±1 at 4× richer / poorer
    var p = 0.35 + rel * 0.004 + wealth * 0.2 + (St.hasTrait('charmer') ? 0.08 : 0);
    return Math.round(U.clamp(p, 0.05, 0.95) * 100) / 100;
  };
  Dy.marriageCandidates = function () {
    var s = PE.S(), out = [], members = s.dynasty.members.filter(function (m) { return m.alive && m.relation !== 'head' && !m.married && !m.disgraced && m.age >= B.marriageMinAge && m.age <= B.marriageMaxAge; });
    for (var id in s.rivals) {
      var rv = s.rivals[id]; if (rv.bankrupt || rv.merged) continue;
      var why = members.length ? Dy.marriageEligibility(members[0].id, id) : 'No heir of marriageable age';
      out.push({ rivalId: id, name: D.rivalById(id).name, relation: rv.relation, relationScore: s.relations[id] || 0, allied: !!rv.allied, eligible: !why, reason: why, chance: Dy.marriageChance(id) });
    }
    return out;
  };
  Dy.proposeMarriage = function (memberId, rivalId) {
    var s = PE.S(), m = Dy.member(memberId), rv = s.rivals[rivalId], rd = D.rivalById(rivalId);
    var why = Dy.marriageEligibility(memberId, rivalId);
    if (why) return PE.fail(why);
    var p = Dy.marriageChance(rivalId), accepted = R.chance(p);
    (s.dynasty.proposals = s.dynasty.proposals || []).push({ year: s.year, memberId: memberId, rivalId: rivalId, accepted: accepted });
    if (!accepted) {
      var repHit = St.rep(B.marriageRefusalRep);
      PE.Rivals.adjustRelation(rivalId, B.marriageRefusalRelation, 'refused marriage');
      rv.lastAction = 'Declined a marriage proposal from your house.';
      return PE.ok({ accepted: false, chance: p, reputationChange: repHit, message: rd.name + ' decline the match. Society talks (reputation ' + repHit + ').' });
    }
    m.married = rivalId; rv.allied = true; s.stats.marriages++;
    s.dynasty.alliances.push({ rivalId: rivalId, memberId: memberId, year: s.year });
    PE.Rivals.adjustRelation(rivalId, B.marriageAcceptRelation, 'marriage');
    rv.lastAction = 'Welcomed ' + m.name + ' into the family.';
    return PE.ok({ accepted: true, chance: p, message: m.name + ' marries into ' + rd.name + '. Their agents will share one listing a year and they will never bid against you.' });
  };
  /* Late-game merger (P3.2): fold an ally's portfolio into yours at a 15% estate-tax-like cost. */
  Dy.mergerInfo = function () {
    var s = PE.S(), allies = PE.Rivals.allies(), windowOpen = s.year >= s.endYear - B.mergerWindowYears || s.dynasty.head.age >= B.mergerHeadAge, out = [];
    for (var i = 0; i < allies.length; i++) {
      var id = allies[i], nw = Math.max(0, St.netWorth('rival:' + id)), cost = Math.round(nw * B.mergerCost);
      out.push({ rivalId: id, name: D.rivalById(id).name, netWorth: nw, properties: St.propertyCount('rival:' + id), cost: cost, available: windowOpen && s.cash >= cost, reason: !windowOpen ? 'Mergers are for the last ' + B.mergerWindowYears + ' years of the run (or a head aged ' + B.mergerHeadAge + '+)' : (s.cash < cost ? 'Needs ' + U.fmt(cost) + ' in cash' : null) });
    }
    return { windowOpen: windowOpen, allies: out };
  };
  Dy.mergeWithAlly = function (rivalId) {
    var s = PE.S(), info = Dy.mergerInfo();
    if (!info.allies.length) return PE.fail('No allied family to merge with');
    var a = null; for (var i = 0; i < info.allies.length; i++) if (!rivalId || info.allies[i].rivalId === rivalId) { a = info.allies[i]; break; }
    if (!a) return PE.fail('Not allied with that family');
    if (!a.available) return PE.fail(a.reason);
    var rv = s.rivals[a.rivalId], owner = 'rival:' + a.rivalId, props = St.ownedProps(owner).slice();
    s.cash -= a.cost;
    s.cash += Math.max(0, rv.cash);
    for (var k = 0; k < props.length; k++) {
      var p = props[k];
      St.setOwner(p, 'player'); p.purchasePrice = p.trueValue; p.purchaseYear = s.year;
      if (p.mortgage) p.mortgage = PE.Finance.makeMortgage('player', p.mortgage.principal, 'io', false);
      PE.Property.initTenancy(p);
    }
    rv.cash = 0; rv.merged = true; rv.mergedYear = s.year; rv.bankrupt = true; rv.bankruptYear = s.year; rv.allied = false; rv.lastAction = 'Merged into the House of ' + s.dynasty.surname + '.';
    s.dynasty.mergers = (s.dynasty.mergers || 0) + 1; s.stats.mergers++;
    return PE.ok({ message: 'The ' + a.name.replace(/^The /, '') + ' fold ' + props.length + ' building(s) into your house for ' + U.fmt(a.cost) + ' in duties.', properties: props.length, cost: a.cost, rivalId: a.rivalId });
  };

  PE.Dynasty = Dy;
})(typeof window !== 'undefined' ? window : global);
