#!/usr/bin/env node
/* Balance harness (bible §14): 100 seeds × 4 families × 2 players × 30 years,
   plus 20 seeds × 180 years. Prints the §14 table with PASS/FAIL per row.
   Usage: node js/sim/balance.js [seeds30] [seeds180] [--verbose] */
var load = require('./load.js');
var args = process.argv.slice(2), verbose = args.indexOf('--verbose') >= 0;
var nums = args.filter(function (a) { return /^\d+$/.test(a); });
var SEEDS30 = +nums[0] || 100, SEEDS180 = +nums[1] || 20;
var FAMILIES = ['chen', 'silva', 'armstrong', 'vanderbilt'];

function run(PE, players, familyId, seed, years, playerName) {
  var r = PE.Game.newGame({ familyId: familyId, seed: seed });
  if (!r.ok) throw new Error(r.message + ' ' + r.error);
  var s = PE.S(), player = players[playerName], St = PE.State;
  var out = { family: familyId, seed: seed, player: playerName, startNW: s.startNetWorth, year2nd: null, year5th: null, yearCity2: null, nw30: null, rank30: null, bankruptYear: null, decisionYears: 0, years: 0, ratio150: null, nwEnd: null, props30: null, errors: 0, cities30: null, rentOps150: null };
  var startProps = St.propertyCount('player');
  for (var y = 0; y < years; y++) {
    if (s.status !== 'playing') break;
    player.play();
    var rep = PE.Game.endYear();
    if (!rep.ok) { if (rep.error) { out.errors++; if (verbose) console.log('ERR', rep.message, rep.error); } players.resolveEvents(playerName); rep = PE.Game.endYear(); if (!rep.ok) break; }
    out.years++;
    var n = St.propertyCount('player'), yr = y + 1;
    if (out.year2nd === null && n >= startProps + 2 && n >= 2) out.year2nd = yr;
    if (out.year5th === null && n >= 5) out.year5th = yr;
    if (out.yearCity2 === null && St.unlockedCities().length >= 2) out.yearCity2 = yr;
    if (rep.decisions.length) out.decisionYears++;
    if (yr === 30) { out.nw30 = St.netWorth('player'); out.rank30 = St.rank(); out.props30 = n; out.cities30 = St.unlockedCities().length; }
    if (yr === 150) { var ops = rep.cashFlow.costs; out.ratio150 = ops > 0 ? rep.cashFlow.rent / ops : null; out.rentOps150 = [rep.cashFlow.rent, ops]; }
    if (rep.bankrupt) { out.bankruptYear = yr; break; }
  }
  out.nwEnd = St.netWorth('player');
  return out;
}

function median(a) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }
function mean(a) { if (!a.length) return null; var t = 0; for (var i = 0; i < a.length; i++) t += a[i]; return t / a.length; }
function fmt(v, d) { return v === null || v === undefined ? 'n/a' : (typeof v === 'number' ? v.toFixed(d === undefined ? 1 : d) : String(v)); }

function main() {
  var t0 = Date.now(), PE = load(), players = require('./players.js')(PE);
  var rows30 = [], rows180 = [], f, sd;
  for (f = 0; f < FAMILIES.length; f++) for (sd = 1; sd <= SEEDS30; sd++) { rows30.push(run(PE, players, FAMILIES[f], sd, 30, 'competent')); rows30.push(run(PE, players, FAMILIES[f], sd, 30, 'naive')); }
  for (f = 0; f < FAMILIES.length; f++) for (sd = 1; sd <= SEEDS180; sd++) { rows180.push(run(PE, players, FAMILIES[f], 1000 + sd, 180, 'competent')); rows180.push(run(PE, players, FAMILIES[f], 1000 + sd, 180, 'naive')); }
  var t1 = Date.now();

  function sel(rows, fam, pl) { return rows.filter(function (r) { return (!fam || r.family === fam) && (!pl || r.player === pl); }); }
  var cc = sel(rows30, 'chen', 'competent'), ac = sel(rows30, null, 'competent'), an = sel(rows30, null, 'naive');
  var y2 = median(cc.map(function (r) { return r.year2nd === null ? 31 : r.year2nd; }));
  var y5 = median(ac.map(function (r) { return r.year5th === null ? 31 : r.year5th; }));
  var yc = median(ac.map(function (r) { return r.yearCity2 === null ? 31 : r.yearCity2; }));
  var nwC = median(ac.filter(function (r) { return r.nw30 !== null; }).map(function (r) { return r.nw30 / r.startNW; }));
  var nwN = median(an.filter(function (r) { return r.nw30 !== null; }).map(function (r) { return r.nw30 / r.startNW; }));
  var bkC = ac.filter(function (r) { return r.bankruptYear !== null; }).length / ac.length * 100;
  var bkN = an.filter(function (r) { return r.bankruptYear !== null; }).length / an.length * 100;
  var rk = median(ac.filter(function (r) { return r.rank30 !== null; }).map(function (r) { return r.rank30; }));
  var dec = mean(ac.map(function (r) { return r.decisionYears / r.years; }));
  var c180 = sel(rows180, null, 'competent').filter(function (r) { return r.ratio150 !== null; });
  var ratio = median(c180.map(function (r) { return r.ratio150; }));
  var errors = rows30.concat(rows180).reduce(function (t, r) { return t + r.errors; }, 0);

  var table = [
    ['Year of 2nd property (competent, Chen)', '≤ 3', fmt(y2, 0), y2 !== null && y2 <= 3],
    ['Year of 5th property (competent, all)', '8–12', fmt(y5, 0), y5 !== null && y5 >= 8 && y5 <= 12],
    ['Year of 2nd city (competent, all)', '8–15', fmt(yc, 0), yc !== null && yc >= 8 && yc <= 15],
    ['Net worth at year 30 / start (competent)', '~15× (10–22×)', fmt(nwC, 1) + '×', nwC !== null && nwC >= 10 && nwC <= 22],
    ['Net worth at year 30 / start (naive)', '~3× (2–4.5×)', fmt(nwN, 1) + '×', nwN !== null && nwN >= 2 && nwN <= 4.5],
    ['Bankruptcies per 100 competent runs', '5–15', fmt(bkC, 1), bkC >= 5 && bkC <= 15],
    ['Bankruptcies per 100 naive runs', '0–3', fmt(bkN, 1), bkN >= 0 && bkN <= 3],
    ['Player rank at year 30 (competent, median)', '#2–#4', '#' + fmt(rk, 0), rk !== null && rk >= 2 && rk <= 4],
    ['Years with ≥1 non-dominant decision (competent)', '≥ 1 per year', fmt(dec * 100, 0) + '% of years', dec !== null && dec >= 0.95],
    ['Rent / operating costs at year 150 (competent)', '≤ 2.5', fmt(ratio, 2), ratio !== null && ratio <= 2.5]
  ];
  console.log('Property Empire v8 balance — ' + SEEDS30 + ' seeds × 4 families × 2 players × 30y, ' + SEEDS180 + ' seeds × 180y (' + ((t1 - t0) / 1000).toFixed(1) + 's, ' + errors + ' internal errors)');
  console.log(pad('Metric', 50) + pad('Target', 16) + pad('Result', 18) + 'Status');
  for (var i = 0; i < table.length; i++) console.log(pad(table[i][0], 50) + pad(table[i][1], 16) + pad(table[i][2], 18) + (table[i][3] ? 'PASS' : 'FAIL'));
  console.log('\nPer family (competent, 30y): median NW×, bankruptcy %, median rank, median props, median cities');
  for (f = 0; f < FAMILIES.length; f++) {
    var rs = sel(rows30, FAMILIES[f], 'competent'), rn = sel(rows30, FAMILIES[f], 'naive');
    console.log(pad(FAMILIES[f], 12) + 'competent: ' + fmt(median(rs.map(function (r) { return (r.nw30 === null ? r.nwEnd : r.nw30) / r.startNW; })), 1) + '×  bk ' + fmt(rs.filter(function (r) { return r.bankruptYear !== null; }).length / rs.length * 100, 0) + '%  rank #' + fmt(median(rs.map(function (r) { return r.rank30 || 7; })), 0) + '  props ' + fmt(median(rs.map(function (r) { return r.props30 || 0; })), 0) + '  cities ' + fmt(median(rs.map(function (r) { return r.cities30 || 1; })), 0) + '  2nd city y' + fmt(median(rs.map(function (r) { return r.yearCity2 === null ? 31 : r.yearCity2; })), 0) + '  5th prop y' + fmt(median(rs.map(function (r) { return r.year5th === null ? 31 : r.year5th; })), 0)
      + '   | naive: ' + fmt(median(rn.map(function (r) { return (r.nw30 === null ? r.nwEnd : r.nw30) / r.startNW; })), 1) + '×  bk ' + fmt(rn.filter(function (r) { return r.bankruptYear !== null; }).length / rn.length * 100, 0) + '%');
  }
  var c180b = sel(rows180, null, 'competent');
  console.log('\n180-year runs (competent): median NW× at end ' + fmt(median(c180b.map(function (r) { return r.nwEnd / r.startNW; })), 0) + ', bankrupt ' + fmt(c180b.filter(function (r) { return r.bankruptYear !== null; }).length / c180b.length * 100, 0) + '%, median bankruptcy year ' + fmt(median(c180b.filter(function (r) { return r.bankruptYear !== null; }).map(function (r) { return r.bankruptYear; })), 0) + ', rent/opex at y150 samples ' + c180.length + ' (e.g. ' + (c180[0] ? c180[0].rentOps150.join('/') : 'n/a') + ')');
  if (verbose) { console.log(JSON.stringify(rows30.slice(0, 4), null, 1)); }
  var fails = table.filter(function (r) { return !r[3]; }).length;
  console.log('\n' + (table.length - fails) + '/' + table.length + ' targets pass.');
  process.exitCode = fails ? 1 : 0;
}
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
main();
