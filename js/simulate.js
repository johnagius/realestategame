#!/usr/bin/env node
/* ========================================
   PROPERTY EMPIRE - Headless Simulation
   Run: node js/simulate.js [months] [family]
   Examples:
     node js/simulate.js 24 armstrong   # 24 months as Armstrong
     node js/simulate.js 120 silva      # 10 years as Silva
     node js/simulate.js 24 armstrong --verbose  # full debug log
   ======================================== */

// Minimal DOM shim so game code can load
global.document = { getElementById: () => null, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ style: {}, classList: { add(){}, remove(){} }, appendChild(){}, remove(){} }), body: { appendChild(){} }, addEventListener(){} };
global.window = { addEventListener(){} };
global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
global.navigator = { serviceWorker: { register: () => Promise.resolve() } };
global.setTimeout = setTimeout;
global.console = console;
global.THREE = undefined;
global.caches = undefined;

// Load game files in global scope
var fs = require('fs');
var vm = require('vm');
var dataCode = fs.readFileSync(__dirname + '/data.js', 'utf8');
var gameCode = fs.readFileSync(__dirname + '/game.js', 'utf8');
vm.runInThisContext(dataCode, { filename: 'data.js' });
vm.runInThisContext(gameCode, { filename: 'game.js' });

// Parse args
var args = process.argv.slice(2);
var months = parseInt(args[0]) || 24;
var familyId = (args[1] || 'armstrong').toLowerCase();
var verbose = args.includes('--verbose');

// Enable debug logging
GameEngine.debug = verbose;
GameEngine.save = function() {}; // no-op save

// Start game
GameEngine.newGame(familyId);
var s = GameEngine.state;

console.log('');
console.log('='.repeat(70));
console.log('PROPERTY EMPIRE SIMULATION');
console.log('='.repeat(70));
console.log('Family: ' + s.familyName + ' | Cash: €' + s.cash + ' | Difficulty: ' + familyId);
console.log('Objective: ' + s.openingObjective.targetProperties + ' London properties in ' + s.openingObjective.deadline + ' months');
console.log('Rival: ' + s.openingObjective.rivalId);
console.log('='.repeat(70));
console.log('');

// Track key metrics each month
var snapshots = [];
var objCompleted = false;
var objMonth = null;

// Simple auto-player: buys cheapest rentable property when affordable, takes loans when available
function autoPlay() {
  var market = GameEngine.state.marketProperties['london'] || [];
  var rentable = market.filter(function(p) { return p.monthlyRent > 0; });
  if (rentable.length === 0) return;
  rentable.sort(function(a, b) { return a.currentValue - b.currentValue; });
  var cheapest = rentable[0];
  var city = GameData.cities.find(function(c) { return c.id === 'london'; });
  var taxRate = city ? city.taxRate : 0.07;
  var traitSurcharge = 0;
  if (city && city.trait === 'foreign_buyer') traitSurcharge = 0.08;
  if (city && city.trait === 'tax_haven') { traitSurcharge = 0.15; taxRate = 0; }
  var totalCost = Math.round(cheapest.currentValue * (1 + taxRate + traitSurcharge));

  // Try to buy with cash
  if (GameEngine.state.cash >= totalCost) {
    var result = GameEngine.buyProperty(cheapest.id, 'london');
    if (result.success) {
      // Rent it immediately
      GameEngine.toggleRent(cheapest.id);
      if (verbose) console.log('  >> AUTO: Bought ' + cheapest.name + ' for €' + totalCost + ', rented');
    }
    return;
  }

  // Try to take a loan if can't afford
  if (GameEngine.state.properties.length >= 1 && (GameEngine.state.loans || []).length < 2) {
    var gap = totalCost - GameEngine.state.cash + 500; // buffer
    var offers = GameEngine.getLoanOffers(gap);
    if (offers.length > 0) {
      // Pick longest term (lowest payment)
      offers.sort(function(a, b) { return a.monthlyPayment - b.monthlyPayment; });
      var best = offers[0];
      var loanResult = GameEngine.takeLoan(best.bankId, best.amount, best.termMonths);
      if (loanResult.success && verbose) console.log('  >> AUTO: Took €' + best.amount + ' loan from ' + best.bankName + ' (' + best.termMonths + 'mo)');
    }
  }
}

for (var m = 1; m <= months; m++) {
  // Auto-player acts before month advances
  autoPlay();
  var results = GameEngine.advanceMonth();

  var londonProps = s.properties.filter(function(p) { return p.cityId === 'london'; }).length;
  var totalProps = s.properties.length;
  var nw = GameEngine.getNetWorth();
  var rival = s.aiFamilies.find(function(a) { return a.id === s.openingObjective.rivalId; });
  var rivalNW = rival ? rival.netWorth : 0;

  var snapshot = {
    month: m,
    year: s.year,
    cash: s.cash,
    nw: nw,
    londonProps: londonProps,
    totalProps: totalProps,
    rentIncome: results.rentIncome,
    expenses: results.expenses,
    netCashflow: results.rentIncome - results.expenses,
    rivalNW: rivalNW,
    rivalProps: rival ? rival.propertyCount : 0,
    loans: (s.loans || []).length,
    totalDebt: (s.loans || []).reduce(function(sum, l) { return sum + l.remainingBalance; }, 0),
    totalRentEarned: s.totalRentEarned,
    cycle: s.economicCycle,
    objActive: s.openingObjective.active,
    objCompleted: s.openingObjective.completed
  };
  snapshots.push(snapshot);

  // Check if objective just completed
  if (results.openingObjectiveResult && results.openingObjectiveResult.type === 'completed' && !objCompleted) {
    objCompleted = true;
    objMonth = m;
    console.log('*** OBJECTIVE COMPLETED at month ' + m + '! ***');
  }
  if (results.openingObjectiveResult && results.openingObjectiveResult.type === 'expired') {
    console.log('*** OBJECTIVE EXPIRED at month ' + m + ' ***');
  }

  // Print every month or summary
  if (verbose || m <= 3 || m % 12 === 0 || m === months) {
    console.log(
      'M' + String(m).padStart(3) + ' Y' + s.year +
      ' | Cash €' + String(Math.round(s.cash)).padStart(8) +
      ' | NW €' + String(Math.round(nw)).padStart(8) +
      ' | Props ' + totalProps + ' (London ' + londonProps + ')' +
      ' | Rent €' + String(results.rentIncome).padStart(5) +
      ' | Exp €' + String(results.expenses).padStart(5) +
      ' | Net €' + String(results.rentIncome - results.expenses).padStart(5) +
      ' | Rival €' + String(Math.round(rivalNW)).padStart(8) +
      ' | Debt €' + String(snapshot.totalDebt).padStart(6) +
      ' | ' + s.economicCycle
    );
  }
}

// Final report
console.log('');
console.log('='.repeat(70));
console.log('SIMULATION RESULTS (' + months + ' months as ' + s.familyName + ')');
console.log('='.repeat(70));
var final = snapshots[snapshots.length - 1];
console.log('Net Worth: €' + Math.round(final.nw) + ' (started €' + GameData.families.find(function(f){return f.id===familyId;}).startingCash + ')');
console.log('Properties: ' + final.totalProps + ' total, ' + final.londonProps + ' in London');
console.log('Cash: €' + Math.round(final.cash));
console.log('Total Rent Earned: €' + Math.round(final.totalRentEarned));
console.log('Total Debt: €' + final.totalDebt + ' across ' + final.loans + ' loans');
console.log('Rival (' + s.openingObjective.rivalId + '): NW €' + Math.round(final.rivalNW) + ', Props ' + final.rivalProps);
console.log('');

if (objCompleted) {
  console.log('✓ OPENING OBJECTIVE: COMPLETED at month ' + objMonth);
} else if (!final.objActive && !final.objCompleted) {
  console.log('✗ OPENING OBJECTIVE: EXPIRED (failed)');
} else {
  console.log('⏳ OPENING OBJECTIVE: Still active (' + s.openingObjective.monthsLeft + ' months left)');
}

// Campaign tier check
var cp = GameEngine.getCampaignProgress();
console.log('Campaign Tier: ' + (s.campaignTier || 0) + '/5' + (cp.completed ? ' (ALL COMPLETE)' : ' — next: ' + cp.tierData.name));

// Feature unlocks
var uf = s.unlockedFeatures;
console.log('Features: bank=' + (uf.bank?'✓':'✗') + ' biz=' + (uf.businesses?'✓':'✗') + ' invest=' + (uf.investments?'✓':'✗') + ' ai=' + (uf.aiDiplomacy?'✓':'✗') + ' lb=' + (uf.fullLeaderboard?'✓':'✗'));

// Cities unlocked
console.log('Cities unlocked: ' + (s.unlockedCities || ['london']).length + '/20');

console.log('');

// Cashflow analysis
var totalRent = snapshots.reduce(function(s,x){return s+x.rentIncome;}, 0);
var totalExp = snapshots.reduce(function(s,x){return s+x.expenses;}, 0);
console.log('CASHFLOW ANALYSIS:');
console.log('  Total rent collected: €' + totalRent);
console.log('  Total expenses paid: €' + totalExp);
console.log('  Net operating income: €' + (totalRent - totalExp));
console.log('  Avg monthly cashflow: €' + Math.round((totalRent - totalExp) / months));

// Warnings
console.log('');
console.log('WARNINGS:');
var negCashMonths = snapshots.filter(function(x){return x.cash < 0;}).length;
if (negCashMonths > 0) console.log('  ⚠ Cash went negative in ' + negCashMonths + ' months');
if (final.totalDebt > final.nw * 0.5) console.log('  ⚠ Debt exceeds 50% of net worth');
if (!objCompleted && !final.objActive) console.log('  ⚠ Opening objective failed — rival got +20% boost');
if (final.totalProps === 0) console.log('  ⚠ Player owns zero properties');
if (snapshots.every(function(x){return x.rentIncome === 0;})) console.log('  ⚠ Zero rent collected entire simulation');
if (negCashMonths === 0 && objCompleted && final.totalProps >= 3) console.log('  ✓ No warnings — clean run');
console.log('');
