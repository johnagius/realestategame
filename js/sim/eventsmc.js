/* Events Monte-Carlo (P3.4): checks that every random event's choices have expected values within ±20% of each
   other and that no choice dominates another on both EV and variance. Utility is measured in money: net worth
   (cash + equity), reputation at a fixed value per point, rival relations at a fixed value per point, plus
   approximate values for durable effects (leases, flags, listings expected next year, district momentum).
   Usage: var mc = require('./eventsmc.js'); mc.run(load, { samples: 40 }) → { rows, failures } */
var REP_VALUE = 0.0025;       // 1 reputation point ≈ 0.25% of net worth (cheaper purchases, LTV cap, managers, city gates)
var REL_VALUE = 0.0002;       // 1 relation point (−100..100 scale) ≈ 0.02% of net worth (lender terms, marriage, offers)
var COND_VALUE = 0.004;       // 1 condition point ≈ 0.4% of a building's value (bands step ~10% per ~22 points, plus rent and decay)
var TOL = 0.20;               // EVs must sit within ±20% of the largest magnitude...
var FLOOR = 0.03;             // ...with the magnitude floored at 3% of net worth (so near-zero EVs compare sanely)

function buildState(load, seed) {
  var PE = load(), r = PE.Game.newGame({ familyId: 'vanderbilt', seed: seed || 5 });
  if (!r.ok) throw new Error(r.message);
  var s = PE.S(), St = PE.State;
  s.year = 1875; s.eraId = 'victorian';
  s.cities.paris.unlocked = true; s.cities.paris.unlockedYear = 1860;
  var specs = [['london', 'terrace', 72, 0.55], ['london', 'townhouse', 55, 0.6], ['paris', 'lodging', 48, 0], ['london', 'shop', 90, 0.5], ['london', 'tenement', 80, 0.6], ['paris', 'terrace', 35, 0], ['london', 'warehouse', 80, 0.45], ['london', 'mansion', 60, 0.5]];
  for (var i = 0; i < specs.length; i++) {
    var p = PE.Market.genProperty(specs[i][0], { type: specs[i][1], condition: specs[i][2] });
    p.purchasePrice = Math.round(p.trueValue * 0.9); p.purchaseYear = 1860 + i;
    if (specs[i][3]) p.mortgage = PE.Finance.makeMortgage('player', Math.round(p.trueValue * specs[i][3]), 'io', false);
    St.setOwner(p, 'player'); PE.Property.initTenancy(p);
  }
  s.cash = Math.round(St.assets('player') * 0.25);
  s.cities.london.managerId = 'mgr_chen';
  var k1 = PE.Dynasty.newMember(24, 'm', ['negotiator'], 'child'), k2 = PE.Dynasty.newMember(19, 'f', ['charmer'], 'child');
  s.dynasty.members.push(k1); s.dynasty.members.push(k2);
  s.reputation = 60;
  PE.Market.refreshBoard();
  return PE;
}

/* Approximate money value of durable state the immediate net-worth delta does not capture. */
function durable(PE) {
  var s = PE.S(), St = PE.State, props = St.playerProps(), nw = Math.max(1, St.netWorth('player')), v = 0, i, p, rentTotal = 0;
  for (i = 0; i < props.length; i++) rentTotal += props[i].rentAnnual || 0;
  for (i = 0; i < props.length; i++) {
    p = props[i]; var rent = p.rentAnnual || 0;
    if (p.type !== 'land') { var band = PE.Data.conditionBand(p.condition), bi = PE.Data.conditionBands.indexOf(band), top = bi + 1 < PE.Data.conditionBands.length ? PE.Data.conditionBands[bi + 1].min : 100; v += (p.condition - (band.min + top) / 2) * COND_VALUE * p.trueValue; }
    if (p.lease) { var y = p.lease.yearsLeft; v += rent * (y * (p.lease.setting - 1) + y * 0.06 - 0.03 * y * (y - 1) / 2); }
    if (p.vacantUntil && s.year < p.vacantUntil) v -= rent * (p.vacantUntil - s.year);
    if (p.rentLockUntil && s.year < p.rentLockUntil) v += rent * (p.rentSetting - 1) * (p.rentLockUntil - s.year) * 0.6;
    else if (!p.lease && p.rentSetting !== 1) v += rent * (p.rentSetting - 1) * (p.rentSetting > 1 ? 0.6 : 1.0); // one year until the player resets it
    if (p.renovation) { var t = PE.Data.renovation[p.renovation.tier]; v += p.trueValue * (t.uplift * PE.Property.UPLIFT_TO_QUALITY + 0.08) - rent * p.renovation.yearsLeft; }
    var d = St.district(p.cityId, p.district);
    if (d && d.momentumUntil && s.year < d.momentumUntil) v += p.trueValue * 0.015 * (d.momentumUntil - s.year);
  }
  var f = s.flags;
  if (f.renoDiscountUntil && s.year < f.renoDiscountUntil) v += nw * 0.006 * (f.renoDiscountUntil - s.year);
  if (f.surveyorUntil && s.year < f.surveyorUntil) v += nw * 0.0015 * (f.surveyorUntil - s.year);
  if (f.insuredUntil && s.year < f.insuredUntil) v += nw * 0.0007 * (f.insuredUntil - s.year);
  if (f.vacancyUntil && s.year < f.vacancyUntil) v -= rentTotal * 0.05 * (f.vacancyUntil - s.year);
  if (f.warLeaseUntil && s.year < f.warLeaseUntil) v -= rentTotal * 0.15 * (f.warLeaseUntil - s.year);
  if (f.extraDistressed) v += nw * 0.006 * f.extraDistressed;
  if (f.extraLand) v += nw * 0.004 * f.extraLand;
  if (f.rentBoostYear === s.year) v += rentTotal * 0.10;
  if (f.commercialRentYear === s.year) v -= rentTotal * 0.06;
  if (f.cityVacancyYear === s.year) { var cr = 0; for (i = 0; i < props.length; i++) if (props[i].cityId === f.cityVacancyCity) cr += props[i].rentAnnual || 0; v -= cr * (f.cityVacancyAmount || 0.2); }
  for (var lid in s.listings) if (s.listings[lid].revealed) v += nw * 0.004;
  var rel = 0; for (var rid in s.relations) rel += s.relations[rid] || 0;
  v += rel * REL_VALUE * nw;
  // a Spendthrift heir drains cash later
  var kids = s.dynasty.members.filter(function (m) { return m.alive && m.relation !== 'head' && m.traits.indexOf('spendthrift') >= 0; });
  v -= kids.length * 0.08 * Math.max(0, s.cash);
  // a fired manager leaves buildings unmanaged until rehired (small)
  for (var cid in s.cities) if (s.cities[cid].unlocked && !s.cities[cid].managerId && props.some(function (q) { return q.cityId === cid; })) v -= nw * 0.002;
  return v;
}
function utility(PE, nw0) { var St = PE.State; return St.netWorth('player') + PE.S().reputation * REP_VALUE * nw0 + durable(PE); }

function instance(PE, ev, t) {
  var E = PE.Events;
  return { uid: 'mc', id: ev.id, title: E.fill(ev.title, t), text: E.fill(ev.text, t), choices: ev.choices.map(function (c) { return { label: E.fill(c.label, t), fx: c.fx }; }), kind: 'random', targets: { propId: t.prop ? t.prop.id : null, cityId: t.cityId, memberId: t.member ? t.member.id : null, rivalId: t.rivalId || null, type: t.type } };
}

function evaluate(load, ev, samples) {
  var base = buildState(load), s0 = base.S(), St = base.State;
  var props = St.playerProps();
  var t = { prop: props[4], cityId: 'london', member: s0.dynasty.members[1], rivalId: 'wong', type: 'terrace' };
  if (ev.id === 'conversion' || ev.id === 'planning') t.prop = props[1];
  var snapshot = JSON.stringify(s0), nw0 = St.netWorth('player');
  var out = [];
  for (var ci = 0; ci < ev.choices.length; ci++) {
    var vals = [];
    for (var k = 0; k < samples; k++) {
      var PE = load(); var st = JSON.parse(snapshot); PE._state = st; PE.RNG.bind(st); st.rng = (st.rng + 7919 * k) >>> 0;
      var u0 = utility(PE, nw0);
      var inst = instance(PE, ev, t);
      PE.Events.applyFx(ev.choices[ci].fx || {}, inst);
      vals.push((utility(PE, nw0) - u0) / nw0);
    }
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length, varc = vals.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / vals.length;
    out.push({ label: ev.choices[ci].label, ev: mean, sd: Math.sqrt(varc) });
  }
  return out;
}

function judge(rows) {
  var evs = rows.map(function (r) { return r.ev; }), maxAbs = Math.max.apply(null, evs.map(Math.abs)), scale = Math.max(maxAbs, FLOOR);
  var spread = Math.max.apply(null, evs) - Math.min.apply(null, evs), problems = [];
  if (spread > TOL * scale) problems.push('EV spread ' + (spread * 100).toFixed(2) + '% > ' + (TOL * scale * 100).toFixed(2) + '%');
  for (var a = 0; a < rows.length; a++) for (var b = 0; b < rows.length; b++) {
    if (a === b) continue;
    if (rows[a].ev > rows[b].ev + 1e-9 && rows[a].sd < rows[b].sd - 1e-9) problems.push('choice ' + (a + 1) + ' dominates ' + (b + 1) + ' on EV and variance');
  }
  return problems;
}

function run(load, opts) {
  opts = opts || {};
  var PE = load(), D = PE.Data, samples = opts.samples || 40, rows = [], failures = [];
  for (var i = 0; i < D.randomEvents.length; i++) {
    var ev = D.randomEvents[i], res = evaluate(load, ev, samples), problems = judge(res);
    rows.push({ id: ev.id, choices: res, problems: problems });
    if (problems.length) failures.push(ev.id + ': ' + problems.join('; '));
  }
  return { rows: rows, failures: failures };
}

module.exports = { run: run, evaluate: evaluate, judge: judge, buildState: buildState, REP_VALUE: REP_VALUE };
if (require.main === module) {
  var load = require('./load.js'), r = run(load, { samples: +process.argv[2] || 40 });
  r.rows.forEach(function (row) {
    console.log((row.problems.length ? 'FAIL ' : 'ok   ') + row.id);
    row.choices.forEach(function (c, i) { console.log('     ' + (i + 1) + '. EV ' + (c.ev * 100).toFixed(2).padStart(6) + '%  sd ' + (c.sd * 100).toFixed(2).padStart(5) + '%  ' + c.label.slice(0, 90)); });
    if (row.problems.length) console.log('     -> ' + row.problems.join('; '));
  });
  console.log(r.failures.length + ' of ' + r.rows.length + ' events fail');
}
