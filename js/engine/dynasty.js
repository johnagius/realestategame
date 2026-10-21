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
    return { head: head, members: [head], generation: 1, heirId: null, trust: false, trustSince: 0, alliances: [], deaths: [], surname: fam.name.replace(/^The /, '').replace(/ Family$/, '').replace(/s$/, '') };
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
    // Child mortality (small) and head mortality
    for (i = 0; i < d.members.length; i++) { var c = d.members[i]; if (c.relation === 'child' && c.alive && R.chance(Dy.mortality(c.age) * 0.3)) { c.alive = false; lines.push(c.name + ' has died.'); } }
    if (R.chance(Dy.mortality(d.head.age))) lines = lines.concat(Dy.succession(report));
    return lines;
  };

  Dy.estateTaxRate = function () {
    var s = PE.S(), fam = D.familyById(s.familyId), rate = St.era().estateTax + fam.estateTaxAdj;
    if (s.dynasty.trust) rate *= B.estateTrustFactor;
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
    // Estate tax
    var rate = Dy.estateTaxRate() + (regent ? 0.05 : 0), nw = Math.max(0, St.netWorth('player')), tax = Math.round(nw * rate);
    s.cash -= tax; report.cashFlow.taxes += tax;
    lines.push('Estate tax: ' + U.fmt(tax) + ' (' + Math.round(rate * 100) + '%' + (d.trust ? ', halved by the trust' : '') + ').');
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
    s.reputation = Math.round(U.clamp(s.reputation * B.reputationInherit + (regent ? -10 : 0) + (St.hasTrait('charmer') ? 8 : 0), 0, 100));
    lines.push(heir.name + ' is head of the family (generation ' + d.generation + '): ' + heir.traits.map(function (t) { return D.traits[t].name; }).join(', ') + '.');
    report.dynasty.push({ kind: 'succession', heir: heir.name, generation: d.generation, tax: tax });
    return lines;
  };

  Dy.summary = function () {
    var s = PE.S(), d = s.dynasty;
    return PE.ok({ head: U.clone(d.head), members: U.clone(d.members.filter(function (m) { return m.alive; })), generation: d.generation, heirId: d.heirId, trust: d.trust,
      estateTaxRate: Dy.estateTaxRate(), reputation: s.reputation, alliances: U.clone(d.alliances), deaths: U.clone(d.deaths), surname: d.surname,
      mortality: Math.round(Dy.mortality(d.head.age) * 1000) / 10, educationCost: Dy.educationCost() });
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
    s.cash -= cost; m.educated = true;
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
  /* Marriage alliance stub (bible §7): shared deal info now; merger option is a later phase. */
  Dy.proposeMarriage = function (memberId, rivalId) {
    var s = PE.S(), m = Dy.member(memberId), rv = s.rivals[rivalId];
    if (!m || !m.alive || m.age < B.adultAge || m.married) return PE.fail('Not eligible for marriage');
    if (!rv || rv.bankrupt) return PE.fail('No such family');
    if (rv.relation < 55) return PE.fail(D.rivalById(rivalId).name + ' will not consider it (relation ' + rv.relation + ')');
    m.married = rivalId; s.dynasty.alliances.push({ rivalId: rivalId, memberId: memberId, year: s.year });
    rv.relation = U.clamp(rv.relation + 20, 0, 100);
    return PE.ok({ message: m.name + ' marries into ' + D.rivalById(rivalId).name + '. Their agents will share one true value a year.' });
  };

  PE.Dynasty = Dy;
})(typeof window !== 'undefined' ? window : global);
