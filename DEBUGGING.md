# Property Empire — Debugging & Testing Guide

## Quick Commands

```bash
# Run full test suite (103+ tests)
node js/simulate.js

# Play a specific family for N months
node js/simulate.js play 36 armstrong
node js/simulate.js play 120 silva --verbose

# Quick smoke test
node js/simulate.js quick
```

## Debug Logging (In Browser)

Open browser console and type:
```js
GameEngine.debug = true;   // Enable economy logging
GameEngine.log = [];       // Clear log

// After playing some months, inspect:
GameEngine.log;            // Array of all economy events
GameEngine.log.filter(e => e.category === 'rent');    // Only rent events
GameEngine.log.filter(e => e.amount < 0);             // Only expenses
```

Log format:
```
[M12 Y1751] rent.collect: +45 | cash=18623 | Charming Studio base=45 mult=0.95
[M12 Y1751] expense.maint+license: -13 | cash=18610 | Charming Studio maint=8 lic=5
[M12 Y1751] tax.property: -3 | cash=18607 | rate=0.5% on 1 taxable props
[M12 Y1751] summary.month_end: +29 | rent=45 exp=16 tax=3 props=1 nw=24607
```

## Inspect Game State (Browser Console)

```js
// Current state
GameEngine.state.cash
GameEngine.state.properties.length
GameEngine.getNetWorth()
GameEngine.getMonthlyIncome()
GameEngine.getMonthlyExpenses()

// Properties
GameEngine.state.properties.forEach(p => console.log(p.name, '€'+p.currentValue, p.condition, '€'+p.monthlyRent+'/mo'))

// AI families
GameEngine.state.aiFamilies.forEach(a => console.log(a.name, '€'+Math.round(a.netWorth), a.propertyCount+'props'))

// Loans
GameEngine.state.loans.forEach(l => console.log(l.bankName, '€'+l.remainingBalance, l.monthsLeft+'mo left'))

// Managers
JSON.stringify(GameEngine.state.managers, null, 2)

// Opening objective
GameEngine.state.openingObjective

// Active campaign
GameEngine.getActiveCampaign()

// Campaign progress
GameEngine.getCampaignProgress()

// Loan capacity
GameEngine.getLoanCapacity()

// Feature unlocks
GameEngine.state.unlockedFeatures
```

## Economy Formulas

### Rent
```
monthlyRent = propertyValue × cityRentYield × typeMultiplier × conditionPenalty / 12
actualRent = monthlyRent × playerRentAdjust × min(2.5, synergy × cycle × season × trait)
```

### Property Appreciation
```
monthlyChange = growthRate/12 + pressure + random(±0.4%) + cycleEffect×0.5 + traitBonus
propertyValue *= (1 + monthlyChange)
// NO separate inflation component (already in growthRate)
```

### Property Tax
```
taxRate = min(2.5%, 0.5% + 0.1% per 10 properties)
monthlyTax = sum(unsheltered × taxRate + sheltered × taxRate × 0.4) / 12
// Tax haven cities: exempt entirely
// Shell company: 60% reduction per property
```

### Loan Capacity
```
paymentCap = income × (90% if <3 props, 50% if 3+) - existingPayments
maxDebt = if noRentHistory: min(NW×15%, income×24)
          else: min(NW × (85% if <€20K else 70%), rentHistory × 30)
          floor: max(above, income × 60)
```

### Manager Fees
```
monthlyFee = propertyRent × managerFeePercent (5-12%)
Problem reduction = quality × 50% (quality 0.9 = 45% fewer problems)
```

## Common Issues

### "Properties too expensive"
- Check era multiplier: pre-industrial=0.05, industrial=0.12, etc.
- Market guarantees 3 studios at minimum price + 1 affordable always exists
- New studios spawn with 3x weight in monthly generation

### "Investment scores all negative"
- Inflation may have drifted — check `city.inflationRate` in console
- Drift is now capped at ±50% of base rate
- Reload game to reset base inflation markers

### "Loan offers showing €0 or negative interest"  
- Interest uses `o.amount` (approved) not `amount` (requested)
- Slider caps at player's max borrowing capacity

### "Campaign won't complete"
- Opening objective checks London properties only: `cityId === 'london'`
- City campaigns require `activeCampaign` to be set first
- Check progress: `GameEngine.getActiveCampaign().progress`

### "Manager not working"
- Check settings: `GameEngine.state.managers['london'].settings`
- Auto-refurb triggers at poor (all) or fair (quality ≥0.7)
- Auto-mitigation: quality ≥0.7 proactive, others reactive after disasters

## Version History

Update version in 3 places with every push to main:
1. `index.html` line 38: `<p class="splash-version">vX.Y</p>`
2. `index.html` line 260: `<span id="game-version"...>vX.Y</span>`
3. `sw.js` line 1: `const CACHE_NAME = 'property-empire-vX.Y';`

Current: v5.2
