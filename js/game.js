/* ========================================
   PROPERTY EMPIRE - Game Engine
   Debug logging: GameEngine.debug = true to enable
   All economy events logged to GameEngine.log[]
   ======================================== */

const GameEngine = {
  debug: false,    // set true for console logging
  recording: true,  // always on — records all events for export
  log: [],          // structured log of every economy event

  // Log an economy event — always records when recording=true
  _log(category, action, amount, detail) {
    if (!this.debug && !this.recording) return;
    var nw = this.state ? Math.round(this.getNetWorth()) : 0;
    var entry = {
      month: this.state ? this.state.month : 0,
      year: this.state ? this.state.year : 0,
      cash: this.state ? Math.round(this.state.cash) : 0,
      nw: nw,
      props: this.state ? this.state.properties.length : 0,
      category: category,
      action: action,
      amount: Math.round(amount),
      detail: detail || '',
      ts: Date.now()
    };
    this.log.push(entry);
    // Cap log size at 50K entries to prevent memory issues
    if (this.log.length > 50000) this.log = this.log.slice(-40000);
    if (this.debug && typeof console !== 'undefined') {
      var sign = amount >= 0 ? '+' : '';
      console.log('[M' + entry.month + ' Y' + entry.year + '] ' + category + '.' + action + ': ' + sign + amount + ' | cash=' + entry.cash + ' | ' + detail);
    }
  },

  // Export full game recording as downloadable JSON
  exportRecording() {
    var data = {
      exported: new Date().toISOString(),
      version: 'v5.3',
      family: this.state ? this.state.familyName : 'unknown',
      familyId: this.state ? this.state.familyId : 'unknown',
      monthsPlayed: this.state ? this.state.month : 0,
      currentYear: this.state ? this.state.year : 0,
      finalCash: this.state ? Math.round(this.state.cash) : 0,
      finalNW: this.state ? Math.round(this.getNetWorth()) : 0,
      properties: this.state ? this.state.properties.length : 0,
      totalRentEarned: this.state ? Math.round(this.state.totalRentEarned || 0) : 0,
      totalExpensesPaid: this.state ? Math.round(this.state.totalExpensesPaid || 0) : 0,
      loans: this.state ? (this.state.loans || []).length : 0,
      citiesUnlocked: this.state ? (this.state.unlockedCities || []).length : 0,
      campaignTier: this.state ? (this.state.campaignTier || 0) : 0,
      events: this.log.length,
      log: this.log
    };
    var json = JSON.stringify(data, null, 2);
    // Persist log before download
    try { localStorage.setItem('propertyEmpire_log', JSON.stringify(this.log)); } catch(e) {}
    // Trigger download
    if (typeof document !== 'undefined') {
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'property-empire-recording-' + (this.state ? this.state.year : 'unknown') + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return data;
  },

  // Start recording
  startRecording() {
    this.recording = true;
    this.log = [];
    this._log('system', 'recording_started', 0, 'Recording all game events');
  },

  // Stop recording
  stopRecording() {
    this._log('system', 'recording_stopped', 0, this.log.length + ' events recorded');
    this.recording = false;
  },

  // ---- Game State ----
  state: null,

  // ---- Initialize new game ----
  newGame(familyId) {
    var family = GameData.families.find(f => f.id === familyId) || GameData.families[1];
    this.state = {
      familyId: family.id,
      familyName: family.name,
      familyIcon: family.icon,
      familyColor: family.color,
      cash: family.startingCash,
      month: 0,       // months since start
      year: GameData.startingYear || 1750,
      monthIndex: 0,  // 0-11
      currentEra: 'pre_industrial',
      properties: [], // owned properties
      marketProperties: {}, // cityId -> [properties]
      totalPropertiesBought: 0,
      totalPropertiesSold: 0,
      totalRentEarned: 0,
      totalExpensesPaid: 0,
      totalPurchaseSpent: 0,
      totalSaleRevenue: 0,
      networthHistory: [family.startingCash],
      monthlyIncome: 0,
      monthlyExpenses: 0,
      activeEvents: [],     // {eventId, cityId, monthsLeft}
      insurance: {},        // cityId -> { type: level } insurance purchased
      disasterHistory: [],  // record of past disasters
      mitigations: {},      // propertyId -> { type: true/false }
      globalMitigations: {}, // global mitigations purchased
      // Banking & Loans
      loans: [],            // { id, bankId, principal, remainingBalance, interestRate, monthlyPayment, termMonths, monthsLeft }
      totalLoanInterestPaid: 0,
      bankRateModifier: 0,  // global rate shift from events
      // Businesses
      businesses: {},       // cityId -> [businesses available]
      ownedStakes: [],      // { businessId, cityId, stakePct, purchasePrice, monthPurchased }
      totalDividendsEarned: 0,
      // Bank savings
      savingsBalance: 0,    // deposited cash earning interest
      savingsRate: 0.02,    // annual interest rate on savings
      totalSavingsInterest: 0,
      // Investments (stocks & bonds)
      investments: [],      // { id, type:'stock'|'bond', name, icon, amount, purchasePrice, currentPrice, yield, risk }
      totalInvestmentGains: 0,
      // Player-owned banks
      playerBanks: [],      // { id, name, capital, interestRate, loans: [], monthlyProfit }
      // Merger history
      mergerHistory: [],
      // Auto-sell rules
      autoSellRules: [],    // { propertyId, type: 'pct'|'value', threshold }
      // Auto-advance
      autoAdvanceSpeed: 0,  // 0=off, 1=slow, 2=medium, 3=fast
      // Achievements
      achievements: [],     // array of unlocked achievement ids
      achievementNotified: [], // ids already shown as toast
      // Campaign goals
      campaignTier: 0,       // current tier (0=none completed, 1-5)
      campaignCompleted: [],  // array of completed tier numbers
      // Focused start: unlocked cities + opening objective (scaled by family difficulty)
      unlockedCities: ['london'],  // start with London only
      openingObjective: (function() {
        var d = family.difficulty;
        // Difficulty tested with 500-run simulations for casual/smart players
        // Budget constrains difficulty: Silva €8K can only afford 1 prop, Armstrong €25K can afford 3
        // Hard is hard because of LOW BUDGET + TIGHT DEADLINE, not because of target count
        var cfg = {
          Hard:    { target: 1, deadline: 18, rival: 'martinez' },    // 1 prop but tight deadline + harder rival
          Normal:  { target: 2, deadline: 30, rival: 'okonkwo' },     // 2 props, weak rival, reasonable time
          Easy:    { target: 2, deadline: 36, rival: 'okonkwo' },     // 2 props, weak rival, long deadline
          Sandbox: { target: 2, deadline: 36, rival: 'okonkwo' }      // same as Easy but way more cash
        };
        var c = cfg[d] || cfg.Easy;
        return { active: true, deadline: c.deadline, monthsLeft: c.deadline, targetProperties: c.target, rivalId: c.rival, completed: false, failed: false };
      })(),
      // Progressive feature unlocking
      unlockedFeatures: {
        bank: true,            // always visible (loans are gated by rent history anyway)
        businesses: false,     // unlocks at campaign tier 1
        investments: false,    // unlocks at campaign tier 2
        aiDiplomacy: false,    // unlocks at 5 properties
        fullLeaderboard: false // unlocks when opening objective done or 3 properties
      }
    };

    // Generate initial market for all cities
    GameData.cities.forEach(city => {
      this.state.marketProperties[city.id] = GameData.generateCityProperties(city.id);
    });

    // Generate initial businesses for all cities (era-appropriate)
    const startEra = this.getCurrentEra();
    GameData.cities.forEach(city => {
      this.state.businesses[city.id] = [];
      const eraBizTypes = startEra.businessTypes || Object.keys(GameData.businessTypes);
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const type = eraBizTypes[Math.floor(Math.random() * eraBizTypes.length)];
        const biz = GameData.generateBusiness(city.id, type);
        if (biz) this.state.businesses[city.id].push(biz);
      }
    });

    // Initialize AI families — Rothschilds get a head start as the opening rival
    this.state.aiFamilies = GameData.aiFamilies.map(ai => {
      var rivalBoost = (ai.id === 'rothschild') ? 1.15 : 1;
      var nw = Math.round(ai.startingWealth * rivalBoost);
      return {
        id: ai.id,
        name: ai.name,
        icon: ai.icon,
        color: ai.color,
        aggressiveness: ai.aggressiveness,
        riskTolerance: ai.riskTolerance,
        netWorth: nw,
        propertyCount: Math.floor(nw / 500000),
        monthlyIncome: Math.round(nw * 0.004),
        history: [nw],
        rank: 0
      };
    });

    // Milestones / goals
    this.state.milestones = [];
    this.state.monthlyGoal = null;

    // Economic cycle
    this.state.economicCycle = 'growth'; // boom, growth, stagnation, recession, depression
    this.state.cycleMonthsLeft = 36 + Math.floor(Math.random() * 60); // 3-8 years per phase
    this.state.consecutiveNegativeCash = 0; // for foreclosure tracking

    // Dynasty: family members
    this.state.familyMembers = [this.createFamilyMember(family.name.split(' ')[1] || 'Patriarch', 30, true)];
    this.state.generation = 1;
    this.state.reputation = 50;
    this.state.socialTier = 'Commoner';

    this.save();
    // Always start recording on new game
    this.recording = true;
    this.log = [];
    return this.state;
  },

  // ---- Load game ----
  loadGame() {
    try {
      const saved = localStorage.getItem('propertyEmpire_save');
      if (saved) {
        this.state = JSON.parse(saved);
        // Migrate: add missing fields from newer versions
        if (!this.state.goals) this.state.goals = { monthly: null, decade: null, completed: [] };
        if (!this.state.reputation) this.state.reputation = 50;
        if (!this.state.aiFamilies) this.state.aiFamilies = [];
        if (!this.state.currentEra) this.state.currentEra = 'pre_industrial';
        if (!this.state.pendingDecision) this.state.pendingDecision = null;
        if (!this.state.playerBanks) this.state.playerBanks = [];
        if (!this.state.mergerHistory) this.state.mergerHistory = [];
        if (!this.state.investments) this.state.investments = [];
        if (this.state.savingsBalance === undefined) this.state.savingsBalance = 0;
        // Sprint 2+3 fields
        if (!this.state.achievements) this.state.achievements = [];
        if (!this.state.achievementNotified) this.state.achievementNotified = [];
        if (!this.state.aiRelationships) this.state.aiRelationships = {};
        if (this.state.autoAdvanceSpeed === undefined) this.state.autoAdvanceSpeed = 0;
        if (!this.state.autoSellRules) this.state.autoSellRules = [];
        if (this.state.consecutiveNegativeCash === undefined) this.state.consecutiveNegativeCash = 0;
        if (this.state.prestigeLevel === undefined) this.state.prestigeLevel = 0;
        if (!this.state.totalLegacyPoints) this.state.totalLegacyPoints = 0;
        if (!this.state.prestigeHistory) this.state.prestigeHistory = [];
        if (!this.state.marketPressure) this.state.marketPressure = {};
        if (!this.state.campaignTier) this.state.campaignTier = 0;
        if (!this.state.campaignCompleted) this.state.campaignCompleted = [];
        // Old saves: unlock all cities (they already had full access)
        if (!this.state.unlockedCities) {
          this.state.unlockedCities = GameData.cities.map(function(c) { return c.id; });
        }
        if (!this.state.openingObjective) {
          this.state.openingObjective = { active: false, completed: true, failed: false };
        }
        // Old saves: unlock all features (they already had access)
        if (!this.state.unlockedFeatures) {
          this.state.unlockedFeatures = { bank: true, businesses: true, investments: true, aiDiplomacy: true, fullLeaderboard: true };
        }
        if (this.state.activeCampaign === undefined) this.state.activeCampaign = null;
        if (!this.state.managers) this.state.managers = {};
        // Reset city economic data to base values (fixes drifted inflation/growth from old saves)
        GameData.cities.forEach(function(city) {
          var base = GameData.cities.find(function(c) { return c.id === city.id; });
          if (base) {
            city._baseInflation = base.inflationRate;
            city._baseGrowth = base.growthRate;
          }
        });
        // Migrate old properties: ensure tenant + rentMultiplier fields exist
        if (this.state.properties) {
          this.state.properties.forEach(function(p) {
            if (p.rentMultiplier === undefined) p.rentMultiplier = 1.0;
            if (p.isRented && !p.tenant) {
              p.tenant = GameData.assignTenant(p);
            }
          });
        }
        // Always start recording on game load — restore previous log if exists
        this.recording = true;
        try {
          var savedLog = localStorage.getItem('propertyEmpire_log');
          this.log = savedLog ? JSON.parse(savedLog) : [];
        } catch(e) { this.log = []; }
        console.log('[ENGINE] Game loaded — recording resumed with ' + this.log.length + ' events, month=' + this.state.month + ' year=' + this.state.year);
        // Fix: remove duplicate insurance (basic+premium on same property)
        if (this.state.mitigations) {
          var fixed = 0;
          Object.keys(this.state.mitigations).forEach(function(pid) {
            var m = GameEngine.state.mitigations[pid];
            if (m && m['insurance_basic'] && m['insurance_premium']) {
              delete m['insurance_basic']; // keep premium, remove basic
              fixed++;
            }
          });
          if (fixed > 0) console.log('[ENGINE] Fixed ' + fixed + ' properties with duplicate insurance');
        }
        return this.state;
      }
    } catch (e) {
      console.error('Failed to load game:', e);
    }
    return null;
  },

  hasSavedGame() {
    return !!localStorage.getItem('propertyEmpire_save');
  },

  // ---- Save game ----
  save() {
    try {
      localStorage.setItem('propertyEmpire_save', JSON.stringify(this.state));
      // Persist recording log (save every 12 months to reduce writes)
      if (this.recording && this.log.length > 0 && this.state && this.state.month % 12 === 0) {
        localStorage.setItem('propertyEmpire_log', JSON.stringify(this.log));
      }
    } catch (e) {
      console.error('Failed to save:', e);
    }
  },

  // ---- Delete save ----
  deleteSave() {
    localStorage.removeItem('propertyEmpire_save');
  },

  // ---- Get current date string ----
  getDateString() {
    const monthName = GameData.monthNames[this.state.monthIndex];
    return `${monthName} ${this.state.year}`;
  },

  // ---- Calculate net worth ----
  // getNetWorth is defined at bottom with loan/stake awareness

  // ---- Get monthly income ----
  getMonthlyIncome() {
    return this.state.properties
      .filter(p => p.isRented && !p.isRefurbishing && !p.isBuilding)
      .reduce((sum, p) => sum + p.monthlyRent, 0);
  },

  // ---- Get monthly expenses ----
  getMonthlyExpenses() {
    return this.state.properties.reduce((sum, p) => {
      return sum + p.monthlyMaintenance + p.monthlyLicense;
    }, 0);
  },

  // ---- Buy property ----
  buyProperty(propertyId, cityId, offerPct) {
    const cityMarket = this.state.marketProperties[cityId];
    if (!cityMarket) return { success: false, message: 'City not found.' };

    const propIdx = cityMarket.findIndex(p => p.id === propertyId);
    if (propIdx === -1) return { success: false, message: 'Property no longer available.' };

    const property = cityMarket[propIdx];
    const city = GameData.cities.find(c => c.id === cityId);

    // Negotiation: offerPct is 0.8-1.2 of asking price
    var offerMultiplier = offerPct || 1.0;
    var offerValue = Math.round(property.currentValue * offerMultiplier);

    // Acceptance probability: below asking = risky, above = guaranteed
    if (offerMultiplier < 1.0) {
      // Lower offers have lower acceptance chance
      // At 80%: ~30% acceptance. At 90%: ~60%. At 95%: ~80%
      var acceptChance = Math.pow(offerMultiplier, 6); // 0.8^6=0.26, 0.9^6=0.53, 0.95^6=0.74
      // Reputation helps
      var repBonus = (this.state.reputation || 50) / 500; // 0-0.2 bonus
      acceptChance = Math.min(0.95, acceptChance + repBonus);

      if (Math.random() > acceptChance) {
        return { success: false, message: 'Offer of ' + GameData.formatMoney(offerValue) + ' rejected! The seller wants closer to asking price.' };
      }
    }

    // City trait purchase modifiers
    var traitSurcharge = 0;
    if (city.trait === 'tax_haven') {
      // No property tax, but 15% demand premium on price
      traitSurcharge = Math.round(offerValue * 0.15);
    } else if (city.trait === 'foreign_buyer') {
      // Extra 8% foreign buyer surcharge
      traitSurcharge = Math.round(offerValue * 0.08);
    }

    const purchaseTax = city.trait === 'tax_haven' ? 0 : Math.round(offerValue * city.taxRate);
    const totalCost = offerValue + purchaseTax + traitSurcharge;

    if (this.state.cash < totalCost) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(totalCost)} (incl. ${GameData.formatMoney(purchaseTax)} tax).` };
    }

    // Check city property limit
    const ownedInCity = this.state.properties.filter(p => p.cityId === cityId).length;
    if (ownedInCity >= city.maxProperties) {
      return { success: false, message: `Maximum ${city.maxProperties} properties in ${city.name}.` };
    }

    // BUY PROPERTY: price + city tax + trait surcharge (foreign_buyer/tax_haven)
    this.state.cash -= totalCost;
    this._log('buy', 'property', -totalCost, property.name + ' price=' + offerValue + ' tax=' + purchaseTax + ' surcharge=' + traitSurcharge + ' in ' + cityId);
    property.isOwned = true;
    property.isNew = false;
    property.purchasePrice = offerValue;
    property.currentValue = offerValue; // Update to purchase price
    property.monthPurchased = this.state.month;
    property.totalRentCollected = 0;
    property.totalExpensesPaid = 0; // tracks ongoing maintenance/license only, not purchase tax

    // Initialize mitigations for this property
    this.state.mitigations[property.id] = {};

    // Move from market to owned
    cityMarket.splice(propIdx, 1);
    this.state.properties.push(property);

    this.state.totalPropertiesBought++;
    this.state.totalPurchaseSpent += totalCost;

    this.save();
    return {
      success: true,
      message: `Purchased ${property.name} for ${GameData.formatMoney(property.currentValue)} (+${GameData.formatMoney(purchaseTax)} tax).`,
      property,
      cost: totalCost
    };
  },

  // ---- Sell property ----
  sellProperty(propertyId) {
    const propIdx = this.state.properties.findIndex(p => p.id === propertyId);
    if (propIdx === -1) return { success: false, message: 'Property not found.' };

    const property = this.state.properties[propIdx];
    if (property.isBuilding) return { success: false, message: 'Cannot sell while under construction.' };
    if (property.isRefurbishing) return { success: false, message: 'Cannot sell while refurbishing.' };

    const agentFee = Math.round(property.currentValue * GameData.sellingFeeRate);
    const salePrice = property.currentValue - agentFee;
    const profit = salePrice - property.purchasePrice;

    // Execute sale
    this.state.cash += salePrice;
    this.state.properties.splice(propIdx, 1);
    delete this.state.mitigations[propertyId];

    this.state.totalPropertiesSold++;
    this.state.totalSaleRevenue += salePrice;

    this.save();
    return {
      success: true,
      message: `Sold for ${GameData.formatMoney(salePrice)} (${GameData.formatMoney(agentFee)} agent fee). ${profit >= 0 ? 'Profit' : 'Loss'}: ${GameData.formatMoney(Math.abs(profit))}.`,
      salePrice,
      profit
    };
  },

  // ---- Rent out property ----
  toggleRent(propertyId) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property) return { success: false, message: 'Property not found.' };

    const typeDef = GameData.propertyTypes[property.type];
    if (!typeDef.canRent) return { success: false, message: 'This property type cannot be rented.' };
    if (property.condition === 'derelict') return { success: false, message: 'Derelict properties cannot be rented. Refurbish first.' };
    if (property.isRefurbishing) return { success: false, message: 'Cannot rent while refurbishing.' };
    if (property.isBuilding) return { success: false, message: 'Still under construction.' };

    property.isRented = !property.isRented;

    if (property.isRented) {
      // Assign a tenant
      property.tenant = GameData.assignTenant(property);
      this.save();
      return { success: true, message: `${property.tenant.icon} ${property.tenant.name} moved in! Renting for ${GameData.formatMoney(Math.round(property.monthlyRent * (property.rentMultiplier || 1)))}/month.` };
    } else {
      property.tenant = null;
      this.save();
      return { success: true, message: 'Tenant evicted. Property is now vacant.' };
    }
  },

  // ---- Adjust Rent Level ----
  adjustRent(propertyId, multiplier) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property) return { success: false, message: 'Property not found.' };
    multiplier = Math.max(0.7, Math.min(1.3, multiplier));
    property.rentMultiplier = multiplier;
    // If currently rented, tenant may leave if rent too high
    if (property.isRented && property.tenant) {
      var tenantDef = GameData.tenantTypes[property.tenant.type];
      if (tenantDef && multiplier > tenantDef.rentTolerance + 0.05) {
        // Tenant leaves due to high rent
        property.isRented = false;
        property.tenant = null;
        this.save();
        return { success: true, message: `Rent too high — tenant left! Set to ${Math.round(multiplier * 100)}% of market rate.` };
      }
    }
    this.save();
    return { success: true, message: `Rent adjusted to ${Math.round(multiplier * 100)}% of market rate (${GameData.formatMoney(Math.round(property.monthlyRent * multiplier))}/mo).` };
  },

  // ---- Evict Tenant ----
  evictTenant(propertyId) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property || !property.isRented) return { success: false, message: 'No tenant to evict.' };
    var evictionCost = Math.max(500, Math.round(property.monthlyRent * (property.rentMultiplier || 1)));
    this.state.cash -= evictionCost;
    property.isRented = false;
    property.tenant = null;
    this.save();
    return { success: true, message: `Tenant evicted. Eviction cost: ${GameData.formatMoney(evictionCost)}.` };
  },

  // ---- Refurbish property ----
  refurbishProperty(propertyId, tier) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property) return { success: false, message: 'Property not found.' };

    const typeDef = GameData.propertyTypes[property.type];
    if (!typeDef.canRefurbish) return { success: false, message: 'Cannot refurbish this property type.' };
    if (property.condition === 'excellent') return { success: false, message: 'Already in excellent condition.' };
    if (property.isRefurbishing) return { success: false, message: 'Already refurbishing.' };
    if (property.isBuilding) return { success: false, message: 'Still under construction.' };

    const condDef = GameData.conditions[property.condition];
    let baseCost = Math.round(property.currentValue * condDef.refurbCostPct);
    tier = tier || 'standard';

    // Tier modifiers
    var costMultiplier, condLevels, valueBoost, months, failChance;
    if (tier === 'budget') {
      costMultiplier = 0.6; condLevels = 1; valueBoost = 0; months = 2; failChance = 0.2;
    } else if (tier === 'luxury') {
      costMultiplier = 2.0; condLevels = 2; valueBoost = 0.25; months = 4; failChance = 0.1;
    } else { // standard
      costMultiplier = 1.0; condLevels = 1; valueBoost = 0.12; months = 3; failChance = 0;
    }

    let cost = Math.round(baseCost * costMultiplier);

    // Check for renovation grant discount
    const grantEvent = this.state.activeEvents.find(
      e => e.eventId === 'renovation_grant' && e.cityId === property.cityId
    );
    if (grantEvent) {
      cost = Math.round(cost * 0.7);
    }

    // City trait: redevelopment — 30% cheaper refurbishment
    var refCity = GameData.cities.find(function(c) { return c.id === property.cityId; });
    if (refCity && refCity.trait === 'redevelopment') {
      cost = Math.round(cost * 0.7);
    }
    // City trait: heritage_city — refurbishment takes 2x longer
    if (refCity && refCity.trait === 'heritage_city') {
      months = months * 2;
    }

    if (this.state.cash < cost) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(cost)}.` };
    }

    // Execute
    this.state.cash -= cost;
    property.isRefurbishing = true;
    property.isRented = false;
    property.refurbMonthsLeft = months;
    property.refurbTier = tier;
    property.refurbCondLevels = condLevels;
    property.refurbValueBoost = valueBoost;
    property.refurbFailChance = failChance;
    property.totalExpensesPaid += cost;
    this.state.totalExpensesPaid += cost;

    this.save();
    return {
      success: true,
      message: `Refurbishing for ${GameData.formatMoney(cost)}. Ready in ${months} months.`,
      cost,
      months
    };
  },

  // ---- Build on land ----
  buildOnLand(propertyId, buildOptionKey) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property) return { success: false, message: 'Property not found.' };
    if (property.type !== 'land') return { success: false, message: 'Can only build on land.' };
    if (property.isBuilding) return { success: false, message: 'Already building.' };

    const option = GameData.buildOptions[buildOptionKey];
    if (!option) return { success: false, message: 'Invalid build option.' };

    // Calculate build cost based on resulting property value (era-scaled)
    const city = GameData.cities.find(c => c.id === property.cityId);
    const era = this.getCurrentEra();
    const eraM = era.propertyMultiplier || 1;
    const resultType = GameData.propertyTypes[option.resultType];
    const [minP, maxP] = resultType.basePriceRange;
    const estimatedValue = Math.max(1, Math.round(((minP + maxP) / 2) * city.priceMultiplier * eraM));
    const buildCost = Math.max(1, Math.round(estimatedValue * option.costPct));

    if (this.state.cash < buildCost) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(buildCost)}.` };
    }

    // Execute
    this.state.cash -= buildCost;
    property.isBuilding = true;
    property.buildMonthsLeft = option.timeMonths;
    property.buildType = buildOptionKey;
    property.totalExpensesPaid += buildCost;
    this.state.totalExpensesPaid += buildCost;

    this.save();
    return {
      success: true,
      message: `Building ${option.name} for ${GameData.formatMoney(buildCost)}. Ready in ${option.timeMonths} months.`,
      cost: buildCost
    };
  },

  // ---- Demolish property → converts to land (keep ownership) ----
  demolishProperty(propertyId) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property) return { success: false, message: 'Property not found.' };
    if (!property.isOwned) return { success: false, message: 'You don\'t own this property.' };
    if (property.type === 'land') return { success: false, message: 'Already land — nothing to demolish.' };
    if (property.isBuilding) return { success: false, message: 'Cannot demolish during construction.' };
    if (property.isRefurbishing) return { success: false, message: 'Cannot demolish during refurbishment.' };

    // Demolition cost: 10% of current value
    var demoCost = Math.round(property.currentValue * 0.10);
    if (this.state.cash < demoCost) {
      return { success: false, message: 'Not enough cash. Demolition costs ' + GameData.formatMoney(demoCost) + '.' };
    }

    var oldType = GameData.propertyTypes[property.type] ? GameData.propertyTypes[property.type].name : property.type;

    // Execute demolition
    this.state.cash -= demoCost;

    // Land value is a fraction of the building value
    var landValue = Math.round(property.currentValue * 0.3);

    // Convert to land
    property.type = 'land';
    property.currentValue = landValue;
    property.monthlyRent = 0;
    property.isRented = false;
    property.tenant = null;
    property.rentMultiplier = 1.0;
    property.condition = 'good';
    property.monthlyMaintenance = Math.round(landValue * 0.005 / 12);
    property.monthlyLicense = Math.round(landValue * 0.005 / 12);
    property.name = property.district + ' Development Site';

    // Clear mitigations
    if (this.state.mitigations[property.id]) {
      this.state.mitigations[property.id] = {};
    }

    this.save();
    return {
      success: true,
      message: oldType + ' demolished for ' + GameData.formatMoney(demoCost) + '. You now own land worth ' + GameData.formatMoney(landValue) + '. Build something new or sell it.',
      cost: demoCost
    };
  },

  // ---- Purchase mitigation for a property ----
  purchaseMitigation(propertyId, mitigationType) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property) return { success: false, message: 'Property not found.' };

    const mitigation = this.getMitigationOptions(property).find(m => m.id === mitigationType);
    if (!mitigation) return { success: false, message: 'Invalid mitigation.' };

    if (!this.state.mitigations[propertyId]) {
      this.state.mitigations[propertyId] = {};
    }

    if (this.state.mitigations[propertyId][mitigationType]) {
      return { success: false, message: 'Already purchased.' };
    }

    if (this.state.cash < mitigation.cost) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(mitigation.cost)}.` };
    }

    this.state.cash -= mitigation.cost;
    this.state.mitigations[propertyId][mitigationType] = true;
    property.totalExpensesPaid += mitigation.cost;

    this.save();
    return {
      success: true,
      message: `${mitigation.name} installed for ${GameData.formatMoney(mitigation.cost)}. Risk reduced by ${Math.round(mitigation.riskReduction * 100)}%.`
    };
  },

  // ---- Get available mitigation options for a property ----
  getMitigationOptions(property) {
    const city = GameData.cities.find(c => c.id === property.cityId);
    const baseValue = property.currentValue;
    const options = [];

    // Universal mitigations
    options.push({
      id: 'fire_alarm',
      name: 'Fire Alarm System',
      icon: '🔥',
      description: 'Advanced fire detection and sprinkler system.',
      cost: Math.round(baseValue * 0.008),
      disasterTypes: ['fire'],
      riskReduction: 0.5,
      monthlyUpkeep: Math.round(baseValue * 0.0003)
    });

    options.push({
      id: 'security_system',
      name: 'Security System',
      icon: '🔒',
      description: 'CCTV, alarm, and 24/7 monitoring service.',
      cost: Math.round(baseValue * 0.006),
      disasterTypes: ['theft', 'vandalism'],
      riskReduction: 0.6,
      monthlyUpkeep: Math.round(baseValue * 0.0004)
    });

    options.push({
      id: 'insurance_basic',
      name: 'Basic Insurance',
      icon: '📋',
      description: 'Covers 50% of disaster damage costs.',
      cost: Math.round(baseValue * 0.005),
      disasterTypes: ['all'],
      riskReduction: 0.0, // doesn't reduce risk, covers costs
      coveragePct: 0.5,
      monthlyUpkeep: Math.round(baseValue * 0.0008)
    });

    options.push({
      id: 'insurance_premium',
      name: 'Premium Insurance',
      icon: '🛡️',
      description: 'Covers 90% of disaster damage costs.',
      cost: Math.round(baseValue * 0.012),
      disasterTypes: ['all'],
      riskReduction: 0.0,
      coveragePct: 0.9,
      monthlyUpkeep: Math.round(baseValue * 0.0015)
    });

    // Location-specific mitigations
    const cityDisasters = this.getCityDisasterProfile(property.cityId);

    if (cityDisasters.includes('flood')) {
      options.push({
        id: 'flood_barrier',
        name: 'Flood Barriers',
        icon: '🌊',
        description: 'Waterproof barriers and drainage system.',
        cost: Math.round(baseValue * 0.015),
        disasterTypes: ['flood'],
        riskReduction: 0.6,
        monthlyUpkeep: Math.round(baseValue * 0.0003)
      });
    }

    if (cityDisasters.includes('earthquake')) {
      options.push({
        id: 'seismic_retrofit',
        name: 'Seismic Retrofit',
        icon: '🏗️',
        description: 'Structural reinforcement for earthquake resistance.',
        cost: Math.round(baseValue * 0.025),
        disasterTypes: ['earthquake'],
        riskReduction: 0.5,
        monthlyUpkeep: Math.round(baseValue * 0.0002)
      });
    }

    if (cityDisasters.includes('storm')) {
      options.push({
        id: 'storm_shutters',
        name: 'Storm Protection',
        icon: '🌪️',
        description: 'Hurricane shutters and reinforced roofing.',
        cost: Math.round(baseValue * 0.01),
        disasterTypes: ['storm'],
        riskReduction: 0.5,
        monthlyUpkeep: Math.round(baseValue * 0.0002)
      });
    }

    // City trait: crime_pressure — insurance costs 25% less
    if (city && city.trait === 'crime_pressure') {
      options.forEach(function(opt) {
        opt.cost = Math.round(opt.cost * 0.75);
        opt.monthlyUpkeep = Math.round(opt.monthlyUpkeep * 0.75);
      });
    }

    return options;
  },

  // ---- Get city disaster profile ----
  getCityDisasterProfile(cityId) {
    const profiles = {
      new_york:    ['flood', 'storm', 'fire', 'theft'],
      london:      ['flood', 'fire', 'theft'],
      paris:       ['flood', 'fire', 'theft'],
      tokyo:       ['earthquake', 'flood', 'fire', 'storm'],
      dubai:       ['sandstorm', 'fire', 'flood'],
      singapore:   ['flood', 'fire', 'storm'],
      hong_kong:   ['storm', 'flood', 'fire', 'theft'],
      sydney:      ['fire', 'flood', 'storm'],
      los_angeles: ['earthquake', 'fire', 'drought'],
      miami:       ['storm', 'flood', 'fire', 'theft'],
      barcelona:   ['flood', 'fire', 'theft'],
      rome:        ['earthquake', 'flood', 'fire'],
      berlin:      ['flood', 'fire', 'theft'],
      amsterdam:   ['flood', 'fire', 'theft'],
      toronto:     ['flood', 'fire', 'storm', 'theft'],
      monaco:      ['flood', 'fire', 'theft'],
      shanghai:    ['flood', 'storm', 'earthquake', 'fire'],
      mumbai:      ['flood', 'storm', 'fire', 'theft'],
      sao_paulo:   ['flood', 'fire', 'theft', 'vandalism'],
      cape_town:   ['drought', 'fire', 'theft', 'flood']
    };
    return profiles[cityId] || ['fire', 'theft'];
  },

  // ---- Disaster definitions ----
  disasters: {
    flood: {
      name: 'Flooding',
      icon: '🌊',
      description: 'Heavy rains cause flooding damage to your property.',
      baseDamageValuePct: 0.08,
      conditionDrop: 1,
      baseProbability: 0.003
    },
    earthquake: {
      name: 'Earthquake',
      icon: '🫨',
      description: 'Seismic activity causes structural damage.',
      baseDamageValuePct: 0.12,
      conditionDrop: 2,
      baseProbability: 0.002
    },
    fire: {
      name: 'Fire',
      icon: '🔥',
      description: 'A fire breaks out, causing significant damage.',
      baseDamageValuePct: 0.15,
      conditionDrop: 2,
      baseProbability: 0.002
    },
    storm: {
      name: 'Severe Storm',
      icon: '🌪️',
      description: 'High winds and heavy rain damage the property.',
      baseDamageValuePct: 0.06,
      conditionDrop: 1,
      baseProbability: 0.004
    },
    theft: {
      name: 'Burglary',
      icon: '🦹',
      description: 'Break-in reported. Property contents stolen and damaged.',
      baseDamageValuePct: 0.03,
      conditionDrop: 0,
      baseProbability: 0.004
    },
    vandalism: {
      name: 'Vandalism',
      icon: '💥',
      description: 'Property vandalised, requiring repairs.',
      baseDamageValuePct: 0.02,
      conditionDrop: 1,
      baseProbability: 0.003
    },
    drought: {
      name: 'Water Crisis',
      icon: '☀️',
      description: 'Severe drought causes water restrictions, reducing property appeal.',
      baseDamageValuePct: 0.02,
      conditionDrop: 0,
      baseProbability: 0.002
    },
    sandstorm: {
      name: 'Sandstorm',
      icon: '🏜️',
      description: 'Severe sandstorm damages exterior surfaces.',
      baseDamageValuePct: 0.04,
      conditionDrop: 1,
      baseProbability: 0.003
    }
  },

  // ---- Process disasters for a property ----
  checkDisasters(property) {
    const cityDisasters = this.getCityDisasterProfile(property.cityId);
    const results = [];

    for (const disasterType of cityDisasters) {
      const disaster = this.disasters[disasterType];
      if (!disaster) continue;

      let probability = disaster.baseProbability;

      // Mitigations reduce probability
      const propMitigations = this.state.mitigations[property.id] || {};
      const mitigationOptions = this.getMitigationOptions(property);

      for (const mitOpt of mitigationOptions) {
        if (propMitigations[mitOpt.id] && mitOpt.disasterTypes.includes(disasterType)) {
          probability *= (1 - mitOpt.riskReduction);
        }
      }

      // Poor condition increases risk
      if (property.condition === 'poor') probability *= 1.3;
      if (property.condition === 'derelict') probability *= 1.8;

      // City trait: crime_pressure — 2x theft/vandalism risk for uninsured
      var cCity = GameData.cities.find(function(c) { return c.id === property.cityId; });
      if (cCity && cCity.trait === 'crime_pressure' && (disasterType === 'theft' || disasterType === 'vandalism')) {
        var hasInsurance = propMitigations['insurance_basic'] || propMitigations['insurance_premium'] || propMitigations['security_system'];
        if (!hasInsurance) probability *= 2;
      }

      // Roll for disaster
      if (Math.random() < probability) {
        const damageValue = Math.round(property.currentValue * disaster.baseDamageValuePct);

        // Check insurance coverage
        let coveredAmount = 0;
        if (propMitigations['insurance_premium']) {
          coveredAmount = Math.round(damageValue * 0.9);
        } else if (propMitigations['insurance_basic']) {
          coveredAmount = Math.round(damageValue * 0.5);
        }

        const actualDamage = damageValue - coveredAmount;

        // Apply condition drop
        let newCondition = property.condition;
        if (disaster.conditionDrop > 0) {
          const currentLevel = GameData.conditions[property.condition].level;
          const newLevel = Math.max(0, currentLevel - disaster.conditionDrop);
          newCondition = GameData.conditionOrder[newLevel];
        }

        results.push({
          disasterType,
          disaster,
          damageValue,
          coveredAmount,
          actualDamage,
          oldCondition: property.condition,
          newCondition,
          property
        });

        // Apply damage
        property.currentValue = Math.round(property.currentValue * (1 - disaster.baseDamageValuePct * 0.5));
        property.condition = newCondition;
        if (property.isRented && newCondition === 'derelict') {
          property.isRented = false;
        }

        // Recalculate rent after condition change
        this.recalculateRent(property);

        // Deduct repair costs from cash
        this.state.cash -= actualDamage;
        property.totalExpensesPaid += actualDamage;

        // Store in history
        this.state.disasterHistory.push({
          month: this.state.month,
          cityId: property.cityId,
          propertyId: property.id,
          propertyName: property.name,
          disasterType,
          damageValue,
          coveredAmount,
          actualDamage
        });

        break; // Only one disaster per property per month
      }
    }

    return results;
  },

  // ---- Recalculate rent for a property ----
  recalculateRent(property) {
    const typeDef = GameData.propertyTypes[property.type];
    const city = GameData.cities.find(c => c.id === property.cityId);
    if (!typeDef || !city || !typeDef.canRent) return;

    // Premium lease: locked rent that doesn't change with market
    if (property.premiumRent) {
      property.monthlyRent = property.premiumRent;
      return;
    }

    const condPenalty = GameData.conditions[property.condition].rentPenalty;
    const rentMultiplier = typeDef.rentMultiplier || 0;

    // Check for tourism boost
    let rentBoost = 1;
    const tourismEvent = this.state.activeEvents.find(
      e => e.eventId === 'tourism_surge' && e.cityId === property.cityId
    );
    if (tourismEvent) rentBoost = 1.15;

    const annualRent = property.currentValue * city.rentYield * rentMultiplier * condPenalty * rentBoost;
    property.monthlyRent = Math.round(annualRent / 12);
  },

  // ---- Advance one month ----
  advanceMonth() {
    console.log('[ENGINE] advanceMonth START — month=' + (this.state ? this.state.month : '?') + ' year=' + (this.state ? this.state.year : '?'));
    try {
    const results = {
      month: 0,
      year: 0,
      rentIncome: 0,
      expenses: 0,
      events: [],
      disasters: [],
      completedRefurbishments: [],
      completedBuilds: [],
      newProperties: [],
      propertyChanges: []
    };

    // Advance time
    this.state.month++;
    this.state.monthIndex = (this.state.monthIndex + 1) % 12;
    if (this.state.monthIndex === 0) this.state.year++;

    results.month = this.state.monthIndex;
    results.year = this.state.year;

    // 0. Initialize results extras
    results.tenantProblems = [];
    results.propertyTax = 0;
    results.decisions = [];

    // 1. Collect rent (with tenant problems, diminishing returns, cycle effects, seasonality)
    var rentedCount = this.state.properties.filter(p => p.isRented).length;
    // Economic cycle rent multiplier (boom=110%, recession=85%, depression=70%)
    var cycleRentMult = { boom:1.1, growth:1.0, stagnation:0.95, recession:0.85, depression:0.7 };
    var rentCycleFactor = cycleRentMult[this.state.economicCycle] || 1.0;
    // Seasonal rent factor (summer boost for tourism cities, winter dip for northern)
    var monthIdx = this.state.monthIndex || 0;
    var isSummer = monthIdx >= 5 && monthIdx <= 7; // Jun-Aug
    var isWinter = monthIdx === 11 || monthIdx <= 1; // Dec-Feb
    var touristCities = { barcelona:1, monaco:1, miami:1, dubai:1, rome:1, sydney:1 };
    var northernCities = { toronto:1, amsterdam:1, berlin:1, london:1, paris:1 };
    this.state.properties.forEach(p => {
      if (p.isRented && !p.isRefurbishing && !p.isBuilding) {
        // Portfolio synergy: more properties = bonus rent (empire reputation attracts premium tenants)
        // 1-5 properties: no bonus. 6-10: +2% each. 11-20: +1.5% each. 21+: +1% each (soft cap ~50%)
        var synergyFactor = 1;
        if (rentedCount > 5) {
          var tier1 = Math.min(rentedCount - 5, 5) * 0.02;  // 6-10: up to +10%
          var tier2 = Math.max(0, Math.min(rentedCount - 10, 10)) * 0.015; // 11-20: up to +15%
          var tier3 = Math.max(0, rentedCount - 20) * 0.01; // 21+: +1% each
          synergyFactor = 1 + Math.min(tier1 + tier2 + tier3, 0.60); // cap at +60%
        }

        // Tenant-aware rent collection
        var rentMult = p.rentMultiplier || 1.0;
        var adjustedRent = Math.round(p.monthlyRent * rentMult);
        var tenant = p.tenant;
        var reliability = (tenant && tenant.reliability) ? tenant.reliability : 0.85;
        var care = (tenant && tenant.care) ? tenant.care : 0.80;
        if (tenant) tenant.monthsOccupied = (tenant.monthsOccupied || 0) + 1;

        // Tenant problem chance: base 3% modified by reliability (higher = fewer problems)
        var problemChance = 0.03 * (2 - reliability); // reliability 1.0 → 3%, reliability 0.7 → 3.9%
        // Manager reduces tenant problems based on quality
        var cityMgr = (this.state.managers || {})[p.cityId];
        if (cityMgr) problemChance *= (1 - cityMgr.quality * 0.5); // quality 0.9 → 55% reduction
        if (Math.random() < problemChance) {
          var problemRoll = Math.random();
          if (problemRoll < 0.35) {
            // Late payment — get only 50% rent this month
            var reducedRent = Math.round(adjustedRent * 0.5 * synergyFactor * rentCycleFactor);
            this.state.cash += reducedRent;
            p.totalRentCollected += reducedRent;
            results.rentIncome += reducedRent;
            results.tenantProblems.push({ property: p.name, type: 'late', loss: adjustedRent - reducedRent, tenant: tenant ? tenant.icon : '' });
          } else if (problemRoll < 0.65) {
            // Vacancy — tenant leaves, no rent, property becomes unrented
            p.isRented = false;
            p.tenant = null;
            results.tenantProblems.push({ property: p.name, type: 'vacancy', loss: adjustedRent, tenant: tenant ? tenant.icon : '' });
          } else if (problemRoll < 0.85) {
            // Damage — cost scaled by care (lower care = more damage)
            var damageMult = 2.0 - care; // care 1.0 → 100% of rent, care 0.6 → 140%
            var damageCost = Math.round(adjustedRent * 0.8 * damageMult);
            this.state.cash -= damageCost;
            results.tenantProblems.push({ property: p.name, type: 'damage', loss: damageCost, tenant: tenant ? tenant.icon : '' });
          } else {
            // Dispute — no rent collected, legal fees
            var legalFee = Math.round(adjustedRent * 0.3);
            this.state.cash -= legalFee;
            results.tenantProblems.push({ property: p.name, type: 'dispute', loss: legalFee + adjustedRent, tenant: tenant ? tenant.icon : '' });
          }
        } else {
          // Normal rent collection with diminishing returns + cycle effect + rent adjustment + seasonality + city traits
          var seasonFactor = 1.0;
          if (isSummer && touristCities[p.cityId]) seasonFactor = 1.12;
          else if (isWinter && northernCities[p.cityId]) seasonFactor = 0.92;

          // City trait rent modifiers
          var traitFactor = 1.0;
          var pCity = GameData.cities.find(function(c) { return c.id === p.cityId; });
          var trait = pCity ? pCity.trait : null;
          if (trait === 'tourism_boom') {
            // Stronger seasonality: summer +25%, winter -15%
            if (isSummer) traitFactor = 1.25 / (touristCities[p.cityId] ? 1.12 : 1.0); // override base tourism
            else if (isWinter) traitFactor = 0.85 / (northernCities[p.cityId] ? 0.92 : 1.0);
          } else if (trait === 'rent_control') {
            // Cap rent at base — rentMultiplier adjustments above 1.0 are halved
            if (rentMult > 1.0) traitFactor = 1.0 - (rentMult - 1.0) * 0.5 / rentMult;
          } else if (trait === 'elite_enclave') {
            // Non-luxury property types get -40% rent
            var luxTypes = { villa:1, penthouse:1, mansion:1 };
            if (!luxTypes[p.type]) traitFactor = 0.6;
          } else if (trait === 'tech_hub') {
            // Studios and apartments get +20% rent
            if (p.type === 'studio' || p.type === 'apartment') traitFactor = 1.2;
          } else if (trait === 'density_premium') {
            // +3% rent per owned property in this city, max +30%
            var cityOwned = this.state.properties.filter(function(pp) { return pp.cityId === p.cityId; }).length;
            traitFactor = 1 + Math.min(0.30, cityOwned * 0.03);
          } else if (trait === 'monsoon_market') {
            // Jul-Sep rent halved, other months +15%
            if (monthIdx >= 6 && monthIdx <= 8) traitFactor = 0.5;
            else traitFactor = 1.15;
          }

          // Cap combined multiplier at 2.5x to prevent snowball
          var combinedMult = Math.min(2.5, synergyFactor * rentCycleFactor * seasonFactor * traitFactor);
          // RENT COLLECTION: base rent × player adjust × synergy × cycle × season × trait (capped 2.5x)
          var actualRent = Math.round(adjustedRent * combinedMult);
          this.state.cash += actualRent;
          p.totalRentCollected += actualRent;
          results.rentIncome += actualRent;
          this.state.totalRentEarned += actualRent;
          this._log('rent', 'collect', actualRent, p.name + ' base=' + p.monthlyRent + ' mult=' + combinedMult.toFixed(2));
        }
      }
    });

    // 2. EXPENSES: maintenance (type-based %) + licensing (1% annual) per property
    this.state.properties.forEach(p => {
      const expense = p.monthlyMaintenance + p.monthlyLicense;
      this.state.cash -= expense;
      this._log('expense', 'maint+license', -expense, p.name + ' maint=' + p.monthlyMaintenance + ' lic=' + p.monthlyLicense);
      p.totalExpensesPaid += expense;
      results.expenses += expense;
      this.state.totalExpensesPaid += expense;

      // Mitigation upkeep costs
      const propMitigations = this.state.mitigations[p.id] || {};
      const mitigationOptions = this.getMitigationOptions(p);
      for (const mitOpt of mitigationOptions) {
        if (propMitigations[mitOpt.id] && mitOpt.monthlyUpkeep) {
          this.state.cash -= mitOpt.monthlyUpkeep;
          p.totalExpensesPaid += mitOpt.monthlyUpkeep;
          results.expenses += mitOpt.monthlyUpkeep;
        }
      }
    });

    // 2b. Property tax (scales with portfolio size — wealth tax)
    // Tax haven properties are exempt
    if (this.state.properties.length > 0) {
      var taxableProps = this.state.properties.filter(function(p) {
        var c = GameData.cities.find(function(cc) { return cc.id === p.cityId; });
        return !c || c.trait !== 'tax_haven';
      });
      if (taxableProps.length > 0) {
        // Tax shelter: shell companies reduce tax by 60% on sheltered properties
        var unsheltered = taxableProps.filter(function(p) { return !p.taxShelter; });
        var sheltered = taxableProps.filter(function(p) { return p.taxShelter; });
        var unshelteredValue = unsheltered.reduce(function(s, p) { return s + p.currentValue; }, 0);
        var shelteredValue = sheltered.reduce(function(s, p) { return s + p.currentValue; }, 0);
        // Base rate: 0.5% annual. Increases 0.1% for every 10 properties owned (up to 2.5%)
        var taxRate = Math.min(0.025, 0.005 + Math.floor(this.state.properties.length / 10) * 0.001);
        // Sheltered properties pay 40% of normal rate
        var monthlyTax = Math.round((unshelteredValue * taxRate + shelteredValue * taxRate * 0.4) / 12);
        this.state.cash -= monthlyTax;
        results.propertyTax = monthlyTax;
        results.expenses += monthlyTax;
        this._log('tax', 'property', -monthlyTax, 'rate=' + (taxRate*100).toFixed(1) + '% on ' + taxableProps.length + ' props (unsheltered=' + unshelteredValue + ' sheltered=' + shelteredValue + ')');
      }
    }

    // 3. Process refurbishments (with tier results)
    this.state.properties.forEach(p => {
      if (p.isRefurbishing) {
        p.refurbMonthsLeft--;
        if (p.refurbMonthsLeft <= 0) {
          p.isRefurbishing = false;
          var condLevels = p.refurbCondLevels || 1;
          var valueBoost = p.refurbValueBoost || 0.12;
          var failChance = p.refurbFailChance || 0;

          // Budget renovation can fail
          if (failChance > 0 && Math.random() < failChance) {
            // Failed — no condition improvement, small value loss
            p.currentValue = Math.round(p.currentValue * 0.95);
            results.completedRefurbishments.push(p);
            p.refurbTier = null;
            return; // forEach continues
          }

          // Upgrade condition by tier levels
          var condDef = GameData.conditions[p.condition];
          var currentLevel = condDef ? condDef.level : 2; // default to 'fair' if missing
          var newLevel = Math.min(4, currentLevel + condLevels);
          p.condition = GameData.conditionOrder[newLevel] || 'good';
          // Value boost
          p.currentValue = Math.round(p.currentValue * (1 + valueBoost));
          this.recalculateRent(p);
          results.completedRefurbishments.push(p);
          p.refurbTier = null;
        }
      }
    });

    // 4. Process builds
    this.state.properties.forEach(p => {
      if (p.isBuilding) {
        p.buildMonthsLeft--;
        if (p.buildMonthsLeft <= 0) {
          const option = GameData.buildOptions[p.buildType];
          const city = GameData.cities.find(c => c.id === p.cityId);
          const newType = GameData.propertyTypes[option.resultType];

          // Transform property (era-scaled value)
          const curEra = this.getCurrentEra();
          const eraMP = curEra.propertyMultiplier || 1;
          const [minP, maxP] = newType.basePriceRange;
          const newValue = Math.max(1, Math.round(((minP + maxP) / 2) * city.priceMultiplier * eraMP));

          p.type = option.resultType;
          p.name = p.name.replace(/Land|Plot|Site|Lot/, option.name);
          p.currentValue = newValue;
          p.condition = 'excellent';
          p.isBuilding = false;
          p.buildType = null;
          p.monthlyMaintenance = Math.round(newValue * newType.maintenanceRate / 12);
          p.monthlyLicense = Math.round((GameData.licensingFees[option.resultType] || 500) / 12);

          this.recalculateRent(p);
          results.completedBuilds.push(p);
        }
      }
    });

    // 4b. Property degradation (annual check in January)
    if (this.state.monthIndex === 0) {
      this.state.properties.forEach(p => {
        if (!p.isRefurbishing && !p.isBuilding && p.condition !== 'derelict') {
          // 12% chance per year of condition dropping one level
          if (Math.random() < 0.12) {
            var curLevel = GameData.conditions[p.condition].level;
            if (curLevel > 0) {
              var newLevel = curLevel - 1;
              // heritage_city trait: properties never drop below Fair (level 2)
              var dCity = GameData.cities.find(function(c) { return c.id === p.cityId; });
              if (dCity && dCity.trait === 'heritage_city' && newLevel < 2) newLevel = 2;
              if (newLevel < curLevel) {
                p.condition = GameData.conditionOrder[newLevel];
                this.recalculateRent(p);
                if (!results.degraded) results.degraded = [];
                results.degraded.push(p);
              }
            }
          }
        }
      });
    }

    // 4c. Economic cycle processing
    if (!this.state.economicCycle) this.state.economicCycle = 'growth';
    if (!this.state.cycleMonthsLeft) this.state.cycleMonthsLeft = 48;
    this.state.cycleMonthsLeft--;
    if (this.state.cycleMonthsLeft <= 0) {
      // Transition to next phase
      var transitions = {
        boom: ['growth', 'stagnation'],
        growth: ['boom', 'stagnation', 'growth'],
        stagnation: ['recession', 'growth', 'stagnation'],
        recession: ['depression', 'stagnation', 'growth'],
        depression: ['recession', 'stagnation']
      };
      var options = transitions[this.state.economicCycle] || ['growth'];
      this.state.economicCycle = options[Math.floor(Math.random() * options.length)];
      this.state.cycleMonthsLeft = 24 + Math.floor(Math.random() * 72); // 2-8 years
      results.cycleChange = this.state.economicCycle;
    }

    // Cycle multipliers
    var cycleEffects = {
      boom:       { growth: 0.003, rent: 1.1, disaster: 0.7, newProps: 1.3 },
      growth:     { growth: 0.001, rent: 1.0, disaster: 1.0, newProps: 1.0 },
      stagnation: { growth: 0,     rent: 0.95, disaster: 1.0, newProps: 0.8 },
      recession:  { growth: -0.002, rent: 0.85, disaster: 1.2, newProps: 0.5 },
      depression: { growth: -0.005, rent: 0.7, disaster: 1.5, newProps: 0.3 }
    };
    var cycleEffect = cycleEffects[this.state.economicCycle] || cycleEffects.growth;

    // 4d. Foreclosure check — if cash negative for 3+ months
    if (this.state.cash < 0) {
      if (!this.state.consecutiveNegativeCash) this.state.consecutiveNegativeCash = 0;
      this.state.consecutiveNegativeCash++;
      if (this.state.consecutiveNegativeCash >= 3 && this.state.properties.length > 0) {
        // Force sell worst property at 70% value
        var worst = this.state.properties.reduce(function(w, p) {
          return (!w || p.currentValue < w.currentValue) ? p : w;
        }, null);
        if (worst) {
          var forcedAmount = Math.round(worst.currentValue * 0.7);
          this.state.cash += forcedAmount;
          this.state.properties = this.state.properties.filter(function(p) { return p.id !== worst.id; });
          results.foreclosure = { property: worst, amount: forcedAmount };
          this.state.consecutiveNegativeCash = 0;
        }
      }
    } else {
      this.state.consecutiveNegativeCash = 0;
    }

    // 4e. Check achievements
    results.newAchievements = this.checkAchievements();

    // 5. Market value fluctuations (with inflation + buying/selling pressure + economic cycle)
    // Track buying/selling pressure per city
    if (!this.state.marketPressure) this.state.marketPressure = {};

    // Slowly drift inflation rates each month (small random walk, tightly bounded)
    GameData.cities.forEach(city => {
      const drift = (Math.random() - 0.5) * 0.001; // +/- 0.05% drift (halved)
      if (!city._baseInflation) city._baseInflation = city.inflationRate;
      // Cap drift to ±50% of base rate — prevents runaway inflation destroying investment scores
      var minInfl = city._baseInflation * 0.5;
      var maxInfl = city._baseInflation * 1.5;
      city.inflationRate = Math.max(minInfl, Math.min(maxInfl, (city.inflationRate || 0.02) + drift));
    });

    // Calculate supply/demand pressure per city
    GameData.cities.forEach(city => {
      const market = this.state.marketProperties[city.id] || [];
      const owned = this.state.properties.filter(p => p.cityId === city.id);
      const totalSlots = city.maxProperties;
      const available = market.length;
      // Less supply = higher pressure (prices go up)
      // More supply = lower pressure (prices stay flat or drop)
      const supplyRatio = available / Math.max(1, totalSlots);
      // Buying pressure: more owned = demand was high = slight upward push
      const demandRatio = owned.length / Math.max(1, totalSlots);
      // Net pressure: -0.01 to +0.01 monthly
      const pressure = (demandRatio * 0.008) - (supplyRatio * 0.004);
      this.state.marketPressure[city.id] = pressure;
    });

    this.state.properties.forEach(p => {
      if (!p.isBuilding) {
        const city = GameData.cities.find(c => c.id === p.cityId);
        const pressure = this.state.marketPressure[city.id] || 0;
        var randomFactor = (Math.random() - 0.5) * 0.008; // reduced from 0.015 — less noise
        // Growth rate already includes inflation — don't add it separately
        const maxMonthlyGrowth = 0.003; // ~3.6% annual cap
        const realGrowth = Math.min(maxMonthlyGrowth, city.growthRate / 12);
        // Cycle effect: smaller bonus/penalty to prevent runaway
        const cycleGrowth = (cycleEffect.growth || 0) * 0.5;
        var prestigeBonus = this.state.prestigeAppreciationBonus || 0;

        // City trait appreciation modifiers
        var traitAppreciation = 0;
        var cityTrait = city.trait;
        if (cityTrait === 'redevelopment') {
          if (p.condition === 'poor' || p.condition === 'derelict') traitAppreciation = realGrowth;
        } else if (cityTrait === 'boom_bust') {
          randomFactor *= 3;
        } else if (cityTrait === 'foreign_buyer') {
          traitAppreciation = 0.0008; // ~1% annual extra
        }

        const change = (realGrowth + pressure + randomFactor + cycleGrowth + traitAppreciation) * (1 + prestigeBonus);
        p.currentValue = Math.max(1, Math.round(p.currentValue * (1 + change)));
        p.appreciation = ((p.currentValue - p.purchasePrice) / p.purchasePrice) * 100;
        this.recalculateRent(p);
      }
    });

    // Also fluctuate market properties (same formula as owned)
    Object.keys(this.state.marketProperties).forEach(cityId => {
      const city = GameData.cities.find(c => c.id === cityId);
      const pressure = this.state.marketPressure[cityId] || 0;
      const maxMonthlyGrowth = 0.003;
      const realGrowth = Math.min(maxMonthlyGrowth, city.growthRate / 12);
      var mTrait = city.trait;
      this.state.marketProperties[cityId].forEach(p => {
        var randomFactor = (Math.random() - 0.5) * 0.008;
        var cGrowth = (cycleEffect.growth || 0) * 0.5;
        var mTraitBonus = 0;
        if (mTrait === 'boom_bust') randomFactor *= 3;
        if (mTrait === 'foreign_buyer') mTraitBonus = 0.0008;
        if (mTrait === 'redevelopment' && (p.condition === 'poor' || p.condition === 'derelict')) mTraitBonus = realGrowth;
        p.currentValue = Math.max(1, Math.round(p.currentValue * (1 + realGrowth + pressure + randomFactor + cGrowth + mTraitBonus)));
        this.recalculateRent(p);
      });
    });

    // 5b. Check for historical events (scripted, year-triggered)
    results.historicalEvent = null;
    if (this.state.monthIndex === 0 && GameData.historicalEvents) { // January each year
      var yr = this.state.year;
      if (!this.state.triggeredHistEvents) this.state.triggeredHistEvents = [];
      var histEvent = GameData.historicalEvents.find(function(e) {
        return e.year === yr && !GameEngine.state.triggeredHistEvents.includes(e.year);
      });
      if (histEvent) {
        this.state.triggeredHistEvents.push(histEvent.year);
        this.state.pendingHistoricalEvent = histEvent;
        results.historicalEvent = histEvent;
      }
    }

    // 6. Random events
    GameData.events.forEach(event => {
      if (Math.random() < event.probability) {
        // Pick a random city (prefer cities where player owns property)
        let targetCityId;
        if (this.state.properties.length > 0 && Math.random() < 0.6) {
          const ownedCityIds = [...new Set(this.state.properties.map(p => p.cityId))];
          targetCityId = ownedCityIds[Math.floor(Math.random() * ownedCityIds.length)];
        } else {
          const randomCity = GameData.cities[Math.floor(Math.random() * GameData.cities.length)];
          targetCityId = randomCity.id;
        }

        const city = GameData.cities.find(c => c.id === targetCityId);
        this.applyEvent(event, targetCityId);

        results.events.push({
          event,
          cityName: city.name,
          cityId: targetCityId
        });
      }
    });

    // 7. Process active events (countdowns)
    this.state.activeEvents = this.state.activeEvents.filter(ae => {
      ae.monthsLeft--;
      return ae.monthsLeft > 0;
    });

    // 8. Disasters check on owned properties
    this.state.properties.forEach(p => {
      if (!p.isBuilding) {
        const disasterResults = this.checkDisasters(p);
        results.disasters.push(...disasterResults);
      }
    });

    // 9. New properties may appear on market — weighted toward affordable types
    var ownedState = this.state;
    var currentEraId = this.getCurrentEra().id;
    var eraTypes = {
      pre_industrial: ['studio','studio','studio','house','commercial','warehouse','land'],
      industrial_revolution: ['studio','studio','house','townhouse','commercial','warehouse','land'],
      gilded_age: ['studio','apartment','apartment','townhouse','house','villa','commercial','warehouse'],
      modern_era: ['studio','apartment','apartment','penthouse','townhouse','house','villa','mansion','commercial','warehouse'],
      information_age: ['studio','apartment','apartment','penthouse','townhouse','house','villa','mansion','commercial','warehouse']
    };
    var spawnTypes = eraTypes[currentEraId] || Object.keys(GameData.propertyTypes);
    GameData.cities.forEach(city => {
      const market = this.state.marketProperties[city.id];
      var ownedInCity = ownedState.properties.filter(function(p) { return p.cityId === city.id; }).length;
      var totalInCity = market.length + ownedInCity;
      // Guarantee at least 1 affordable studio always exists in unlocked city markets
      var hasAffordable = market.some(function(p) { return p.monthlyRent > 0 && p.currentValue < 10000; });
      if (!hasAffordable && totalInCity < city.maxProperties && this.isCityUnlocked(city.id)) {
        var studioP = GameData.generateProperty(city.id, 'studio');
        if (studioP) {
          studioP.condition = 'good';
          GameEngine.recalculateRent(studioP);
          market.push(studioP);
          results.newProperties.push({ cityId: city.id, property: studioP });
        }
      }
      // Normal spawn: 30% chance per month, weighted toward affordable types
      if (totalInCity < city.maxProperties && Math.random() < 0.3) {
        var type = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];
        var newProp = GameData.generateProperty(city.id, type);
        if (newProp) {
          market.push(newProp);
          results.newProperties.push({ cityId: city.id, property: newProp });
        }
      }
    });

    // 10. Process loan payments
    results.loanPayments = this.processLoanPayments();
    results.expenses += results.loanPayments;

    // 10b. Process property managers (auto-rent, auto-refurb, collect fees)
    results.managerFees = this.processManagers(results);
    results.expenses += results.managerFees;

    // 11. Process businesses & collect dividends
    results.dividends = this.processBusinesses();
    results.rentIncome += results.dividends;

    // 12. Savings interest
    results.savingsInterest = this.processSavingsInterest();

    // 13. Investment returns (bonds pay coupons, stocks fluctuate)
    var era = this.getCurrentEra();
    if (era.features.stocks) {
      results.investmentReturns = this.processInvestments();
      results.rentIncome += results.investmentReturns;
    } else {
      results.investmentReturns = 0;
    }

    // 13b. Player bank income
    results.bankIncome = this.processPlayerBanks();
    results.rentIncome += results.bankIncome;

    // 14. Process auto-sell rules
    results.autoSold = this.processAutoSells();

    // 13. Occasionally add new businesses to cities
    GameData.cities.forEach(city => {
      if (!this.state.businesses[city.id]) this.state.businesses[city.id] = [];
      if (this.state.businesses[city.id].length < 8 && Math.random() < 0.15) {
        const types = Object.keys(GameData.businessTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        const biz = GameData.generateBusiness(city.id, type);
        if (biz) this.state.businesses[city.id].push(biz);
      }
    });

    // 14. Shift bank rates slowly
    if (!this.state.bankRateModifier) this.state.bankRateModifier = 0;
    this.state.bankRateModifier += (Math.random() - 0.5) * 0.002;
    this.state.bankRateModifier = Math.max(-0.02, Math.min(0.02, this.state.bankRateModifier));

    // 14a2. AI rivalry interactions (offers, threats)
    results.aiInteraction = this.generateAIInteraction();

    // 14b. Check and generate goals
    results.goalsAchieved = this.checkGoals();
    this.generateGoals();

    // 14c. Generate monthly decision (the "one more turn" hook)
    results.decision = this.generateDecision();

    // 15. Check era transition + prestige
    results.eraChange = this.checkEraTransition();
    // Re-offer prestige every January after 2030
    if (this.state.year >= 2030 && this.state.monthIndex === 0 && !this.state.prestigeOffered) {
      this.state.prestigeOffered = true; // reset to false in January (below)
      results.prestige = true;
    }

    // Reset prestige offer flag each January so it can re-appear yearly
    if (this.state.year >= 2030 && this.state.monthIndex === 0 && !results.prestige) {
      this.state.prestigeOffered = false;
    }

    // 15b. Process dynasty (aging, births, deaths, succession)
    results.dynasty = this.processDynasty();

    // 16. Simulate AI families
    this.simulateAIFamilies(results);

    // 16. Check milestones
    results.milestones = this.checkMilestones();

    // 16b. Check campaign goals
    results.campaignTierCompleted = this.checkCampaignGoals();

    // 16c. Check opening objective
    results.openingObjectiveResult = this.checkOpeningObjective();

    // 16d. Check feature unlocks
    results.featureUnlocks = this.checkFeatureUnlocks();

    // 16e. Check city unlock challenges
    results.cityUnlocks = this.checkCityUnlocks();

    // 17. Track net worth
    this.state.networthHistory.push(this.getNetWorth());
    if (this.state.networthHistory.length > 120) {
      this.state.networthHistory.shift();
    }

    this.state.monthlyIncome = results.rentIncome;
    this.state.monthlyExpenses = results.expenses;

    // MONTHLY SUMMARY LOG: snapshot of all key metrics + market data
    var marketSummary = {};
    var self = this;
    (this.state.unlockedCities || ['london']).forEach(function(cid) {
      var mkt = self.state.marketProperties[cid] || [];
      var rentable = mkt.filter(function(p) { return p.monthlyRent > 0; });
      var cheapest = rentable.length > 0 ? rentable.reduce(function(a,b){return a.currentValue<b.currentValue?a:b;}).currentValue : 0;
      var avgPrice = mkt.length > 0 ? Math.round(mkt.reduce(function(s,p){return s+p.currentValue;},0)/mkt.length) : 0;
      marketSummary[cid] = { count: mkt.length, cheapest: cheapest, avg: avgPrice };
    });

    this._log('summary', 'month_end', results.rentIncome - results.expenses,
      'rent=' + results.rentIncome + ' exp=' + results.expenses + ' tax=' + (results.propertyTax||0) +
      ' loans=' + (results.loanPayments||0) + ' divs=' + (results.dividends||0) + ' mgrFees=' + (results.managerFees||0) +
      ' props=' + this.state.properties.length + ' nw=' + Math.round(this.getNetWorth()) +
      ' cash=' + Math.round(this.state.cash) + ' cycle=' + this.state.economicCycle +
      ' market=' + JSON.stringify(marketSummary));

    // Log each owned property status
    this.state.properties.forEach(function(p) {
      self._log('property', 'status', p.monthlyRent, p.name + ' val=' + Math.round(p.currentValue) + ' cond=' + p.condition + ' rented=' + p.isRented + (p.taxShelter ? ' sheltered' : ''));
    });

    // Log AI family standings
    if (this.state.aiFamilies) {
      this.state.aiFamilies.forEach(function(ai) {
        self._log('ai', 'status', Math.round(ai.netWorth), ai.name + ' props=' + ai.propertyCount + ' income=' + Math.round(ai.monthlyIncome));
      });
    }

    this.save();
    console.log('[ENGINE] advanceMonth END — month=' + this.state.month + ' cash=' + Math.round(this.state.cash) + ' props=' + this.state.properties.length);
    return results;
    } catch(err) {
      console.error('[ENGINE] advanceMonth CRASHED:', err.message, err.stack);
      this._log('error', 'crash', 0, err.message);
      return { rentIncome:0, expenses:0, disasters:[], events:[], completedRefurbishments:[], completedBuilds:[], newProperties:[], propertyChanges:[] };
    }
  },

  // ---- Simulate AI families ----
  simulateAIFamilies(results) {
    if (!this.state.aiFamilies) return;
    var state = this.state;

    this.state.aiFamilies.forEach(ai => {
      // Monthly income from their properties
      const income = ai.monthlyIncome * (0.9 + Math.random() * 0.2);
      ai.netWorth += income;

      // AI ACTUALLY BUYS from the market (removes properties you could buy)
      // AI only competes in cities the player has unlocked — fair, legible rivalry
      if (Math.random() < ai.aggressiveness * 0.22) {
        var buyableCities = Object.keys(state.marketProperties).filter(function(cid) {
          return !state.unlockedCities || state.unlockedCities.indexOf(cid) >= 0;
        });
        if (buyableCities.length > 0) {
          var cityId = buyableCities[Math.floor(Math.random() * buyableCities.length)];
          var market = state.marketProperties[cityId];
          if (market && market.length > 1) {
            var affordable = market.filter(p => p.currentValue < ai.netWorth * 0.3);
            if (affordable.length > 0) {
              // Aggressive AIs pick the BEST property, others pick randomly
              var target;
              if (ai.aggressiveness > 0.6) {
                affordable.sort(function(a,b) { return b.currentValue - a.currentValue; });
                target = affordable[0]; // most expensive they can afford
              } else {
                target = affordable[Math.floor(Math.random() * affordable.length)];
              }
              state.marketProperties[cityId] = market.filter(p => p.id !== target.id);
              ai.netWorth -= target.currentValue;
              ai.propertyCount++;
              ai.monthlyIncome += Math.round(target.monthlyRent * 0.7);
              // AI BUY: AI purchases from unlocked city market, reduces supply
              if (!results.aiBuys) results.aiBuys = [];
              var cityName = (GameData.cities.find(function(c){return c.id===cityId;}) || {}).name || cityId;
              results.aiBuys.push({ ai: ai, property: target, cityName: cityName });
              GameEngine._log('ai', 'buy', -target.currentValue, ai.name + ' bought ' + target.name + ' in ' + cityName + ' | ai_nw=' + ai.netWorth + ' ai_props=' + ai.propertyCount);
            }
          }
        }
      }

      // AI sells occasionally (adds properties back to market)
      if (Math.random() < 0.03 && ai.propertyCount > 2) {
        // Generate a "sold" property back to a random market
        var cities = Object.keys(state.marketProperties);
        if (cities.length > 0) {
          var cityId = cities[Math.floor(Math.random() * cities.length)];
          var era = this.getCurrentEra();
          var types = era.businessTypes ? ['apartment', 'house', 'commercial'] : ['farm', 'house'];
          var type = types[Math.floor(Math.random() * types.length)];
          if (GameData.propertyTypes[type]) {
            var newProp = GameData.generateProperty(cityId, type);
            if (newProp) {
              state.marketProperties[cityId].push(newProp);
              ai.propertyCount = Math.max(0, ai.propertyCount - 1);
            }
          }
        }
      }

      // Market effects hit AI too (less extreme)
      const marketShift = (Math.random() - 0.48) * 0.02;
      ai.netWorth *= (1 + marketShift);

      // AI can also suffer crashes
      ai.netWorth = Math.max(50, Math.round(ai.netWorth));

      // Grow income based on property count
      ai.monthlyIncome = Math.max(1, Math.round(ai.monthlyIncome * (1 + (Math.random() - 0.45) * 0.015)));

      // Track history
      ai.history.push(ai.netWorth);
      if (ai.history.length > 120) ai.history.shift();
    });

    // Rank all families including player
    const playerNW = this.getNetWorth();
    const allFamilies = [
      { id: 'player', netWorth: playerNW },
      ...this.state.aiFamilies
    ];
    allFamilies.sort((a, b) => b.netWorth - a.netWorth);
    allFamilies.forEach((f, i) => {
      if (f.id === 'player') {
        this.state.playerRank = i + 1;
      } else {
        const ai = this.state.aiFamilies.find(a => a.id === f.id);
        if (ai) ai.rank = i + 1;
      }
    });
  },

  // ---- Check milestones ----
  checkMilestones() {
    if (!this.state.milestones) this.state.milestones = [];
    const nw = this.getNetWorth();
    const achieved = [];
    const milestoneList = [
      { id: 'm_500k', name: 'Half Millionaire', threshold: 500000, icon: '⭐' },
      { id: 'm_1m', name: 'Millionaire', threshold: 1000000, icon: '🌟' },
      { id: 'm_5m', name: 'Multi-Millionaire', threshold: 5000000, icon: '💫' },
      { id: 'm_10m', name: 'Decamillionaire', threshold: 10000000, icon: '🏆' },
      { id: 'm_50m', name: 'Tycoon', threshold: 50000000, icon: '👑' },
      { id: 'm_100m', name: 'Mogul', threshold: 100000000, icon: '🎖️' },
      { id: 'm_500m', name: 'Billionaire', threshold: 500000000, icon: '💎' },
      { id: 'm_1b', name: 'Empire Builder', threshold: 1000000000, icon: '🏰' },
      { id: 'm_rank1', name: 'Number One', threshold: -1, icon: '🥇' },
      { id: 'm_10props', name: 'Portfolio Builder', threshold: -2, icon: '🏠' },
      { id: 'm_5cities', name: 'Global Investor', threshold: -3, icon: '🌍' },
    ];

    milestoneList.forEach(m => {
      if (this.state.milestones.includes(m.id)) return;
      let earned = false;
      if (m.threshold === -1) earned = this.state.playerRank === 1;
      else if (m.threshold === -2) earned = this.state.properties.length >= 10;
      else if (m.threshold === -3) earned = new Set(this.state.properties.map(p => p.cityId)).size >= 5;
      else earned = nw >= m.threshold;

      if (earned) {
        this.state.milestones.push(m.id);
        achieved.push(m);
      }
    });
    return achieved;
  },

  // ---- Apply event effects ----
  applyEvent(event, cityId) {
    const city = GameData.cities.find(c => c.id === cityId);
    if (!city) return;

    switch (event.effect.type) {
      case 'city_value_change': {
        // Adjust all properties in this city
        const allProps = [
          ...this.state.properties.filter(p => p.cityId === cityId),
          ...(this.state.marketProperties[cityId] || [])
        ];
        allProps.forEach(p => {
          p.currentValue = Math.round(p.currentValue * (1 + event.effect.value));
        });
        break;
      }

      case 'global_value_change': {
        // Adjust all properties globally
        const allProps = [
          ...this.state.properties,
          ...Object.values(this.state.marketProperties).flat()
        ];
        allProps.forEach(p => {
          p.currentValue = Math.round(p.currentValue * (1 + event.effect.value));
        });
        break;
      }

      case 'city_rent_boost':
      case 'refurb_discount': {
        this.state.activeEvents.push({
          eventId: event.id,
          cityId,
          monthsLeft: event.effect.duration || 3
        });
        break;
      }

      case 'damage': {
        // Already handled by disaster system
        break;
      }

      case 'tax_change': {
        city.taxRate = Math.max(0.02, Math.min(0.12, city.taxRate + (Math.random() > 0.5 ? 1 : -1) * event.effect.value));
        break;
      }

      case 'city_crash': {
        // Severe crash: property values drop sharply in one city
        const crashProps = [
          ...this.state.properties.filter(p => p.cityId === cityId),
          ...(this.state.marketProperties[cityId] || [])
        ];
        crashProps.forEach(p => {
          // Each property hit slightly differently (some worse, some less)
          const variance = 1 + (Math.random() - 0.5) * 0.4; // 0.8x to 1.2x of the crash
          const drop = event.effect.value * variance;
          p.currentValue = Math.round(p.currentValue * (1 + drop));
          this.recalculateRent(p);
        });
        // City growth rate takes a small temporary hit (recovers via inflation drift)
        city.growthRate = Math.max(0, city.growthRate - 0.003);
        break;
      }

      case 'global_crash': {
        // Global recession: all cities hit, varying severity
        const allCityProps = [
          ...this.state.properties,
          ...Object.values(this.state.marketProperties).flat()
        ];
        allCityProps.forEach(p => {
          const variance = 1 + (Math.random() - 0.5) * 0.3;
          const drop = event.effect.value * variance;
          p.currentValue = Math.round(p.currentValue * (1 + drop));
          this.recalculateRent(p);
        });
        // All businesses take a hit too
        if (this.state.businesses) {
          Object.values(this.state.businesses).forEach(cityBizList => {
            cityBizList.forEach(biz => {
              biz.totalValue = Math.round(biz.totalValue * (1 + event.effect.value * 0.8));
              biz.performance = Math.max(0.2, biz.performance * 0.7);
              biz.monthlyRevenue = Math.round(biz.monthlyRevenue * 0.75);
              biz.monthlyProfit = biz.monthlyRevenue - biz.monthlyExpenses;
            });
          });
        }
        // All city growth rates dip
        GameData.cities.forEach(c => {
          c.growthRate = Math.max(-0.03, c.growthRate - 0.01);
        });
        break;
      }

      case 'city_business_crash': {
        // Businesses in a city lose value and performance
        const cityBiz = (this.state.businesses || {})[cityId] || [];
        cityBiz.forEach(biz => {
          const variance = 1 + (Math.random() - 0.5) * 0.4;
          const drop = event.effect.value * variance;
          biz.totalValue = Math.round(biz.totalValue * (1 + drop));
          biz.performance = Math.max(0.15, biz.performance * (0.5 + Math.random() * 0.3));
          biz.monthlyRevenue = Math.round(biz.monthlyRevenue * (0.5 + Math.random() * 0.3));
          biz.monthlyProfit = biz.monthlyRevenue - biz.monthlyExpenses;
        });
        break;
      }
    }
  },

  // ---- Get city summary info ----
  getCitySummary(cityId) {
    const market = this.state.marketProperties[cityId] || [];
    const owned = this.state.properties.filter(p => p.cityId === cityId);
    const allPrices = market.map(p => p.currentValue);

    return {
      available: market.length,
      owned: owned.length,
      avgPrice: allPrices.length > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : 0,
      minPrice: allPrices.length > 0 ? Math.min(...allPrices) : 0,
      monthlyIncome: owned.filter(p => p.isRented).reduce((sum, p) => sum + p.monthlyRent, 0)
    };
  },

  // ---- Check and unlock achievements ----
  checkAchievements() {
    if (!this.state.achievements) this.state.achievements = [];
    if (!this.state.achievementNotified) this.state.achievementNotified = [];
    var newlyUnlocked = [];
    var s = this.state;
    // Scale rewards to current era so they're meaningful but not game-breaking
    var era = this.getCurrentEra();
    var eraScale = Math.max(0.001, era.propertyMultiplier || 1);
    GameData.achievements.forEach(function(a) {
      if (s.achievements.indexOf(a.id) >= 0) return;
      try {
        if (a.check(s)) {
          s.achievements.push(a.id);
          // Reward scaled by era: €500 base in Info Age → €0.50 in 1750, floored at 1
          var scaledReward = Math.max(1, Math.round(a.reward * eraScale));
          s.cash += scaledReward;
          // Store actual reward given for display
          a._lastReward = scaledReward;
          newlyUnlocked.push(a);
        }
      } catch(e) { /* skip broken checks */ }
    });
    return newlyUnlocked;
  },

  // ---- Get portfolio statistics ----
  getPortfolioStats() {
    const props = this.state.properties;
    const totalValue = props.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPurchaseValue = props.reduce((sum, p) => sum + p.purchasePrice, 0);
    const monthlyIncome = this.getMonthlyIncome();
    const monthlyExpenses = this.getMonthlyExpenses();

    // Add mitigation upkeep to expenses
    let mitigationUpkeep = 0;
    props.forEach(p => {
      const propMitigations = this.state.mitigations[p.id] || {};
      const mitigationOptions = this.getMitigationOptions(p);
      for (const mitOpt of mitigationOptions) {
        if (propMitigations[mitOpt.id] && mitOpt.monthlyUpkeep) {
          mitigationUpkeep += mitOpt.monthlyUpkeep;
        }
      }
    });

    return {
      propertyCount: props.length,
      totalValue,
      totalPurchaseValue,
      totalAppreciation: totalPurchaseValue > 0 ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100 : 0,
      monthlyIncome,
      monthlyExpenses: monthlyExpenses + mitigationUpkeep,
      monthlyCashflow: monthlyIncome - monthlyExpenses - mitigationUpkeep,
      netWorth: this.getNetWorth(),
      rentedCount: props.filter(p => p.isRented).length,
      vacantCount: props.filter(p => !p.isRented && !p.isRefurbishing && !p.isBuilding).length,
      refurbishingCount: props.filter(p => p.isRefurbishing).length,
      buildingCount: props.filter(p => p.isBuilding).length,
      citiesPresent: [...new Set(props.map(p => p.cityId))].length,
      totalLoanDebt: (this.state.loans || []).reduce((s, l) => s + l.remainingBalance, 0),
      monthlyLoanPayments: (this.state.loans || []).reduce((s, l) => s + l.monthlyPayment, 0),
      businessStakeValue: this.getBusinessStakeValue(),
      monthlyDividends: this.getMonthlyDividends()
    };
  },

  // ========== BANKING & LOANS ==========

  // Get the player's maximum borrowing capacity for UI display
  getLoanCapacity() {
    var netWorth = this.getNetWorth();
    var monthlyIncome = this.getMonthlyIncome();
    var totalRentEarned = this.state.totalRentEarned || 0;
    var existingDebt = (this.state.loans || []).reduce(function(s, l) { return s + l.remainingBalance; }, 0);
    var existingPayments = (this.state.loans || []).reduce(function(s, l) { return s + l.monthlyPayment; }, 0);
    var monthsPlayed = Math.max(1, this.state.month || 1);
    var historicalAvgIncome = totalRentEarned > 0 ? Math.round(totalRentEarned / monthsPlayed) : 0;
    var effectiveIncome = Math.max(monthlyIncome, historicalAvgIncome);
    var propCount = this.state.properties ? this.state.properties.length : 0;
    var debtRatio = propCount < 3 ? 0.9 : 0.5;
    var paymentCap = Math.max(0, Math.round(effectiveIncome * debtRatio) - existingPayments);

    var maxTotalDebt;
    if (totalRentEarned <= 0) {
      maxTotalDebt = Math.min(Math.round(netWorth * 0.15), effectiveIncome * 24);
    } else {
      var ltvRatio = netWorth < 20000 ? 0.85 : 0.7;
      maxTotalDebt = Math.min(Math.round(netWorth * ltvRatio), totalRentEarned * 30);
      maxTotalDebt = Math.max(maxTotalDebt, effectiveIncome * 60);
    }
    var debtRoom = Math.max(0, maxTotalDebt - existingDebt);

    // Max loan from payment capacity (longest available term at lowest rate)
    var bestRate = 0.02 / 12; // starter fund rate
    var bestTerm = 240;
    var maxFromPayment = paymentCap > 0 ? Math.round(paymentCap * (Math.pow(1 + bestRate, bestTerm) - 1) / (bestRate * Math.pow(1 + bestRate, bestTerm))) : 0;

    return {
      maxLoan: Math.min(debtRoom, maxFromPayment),
      debtRoom: debtRoom,
      paymentCap: paymentCap,
      maxFromPayment: maxFromPayment,
      effectiveIncome: effectiveIncome
    };
  },

  getLoanOffers(amount) {
    const netWorth = this.getNetWorth();
    const existingDebt = (this.state.loans || []).reduce((s, l) => s + l.remainingBalance, 0);
    const existingPayments = (this.state.loans || []).reduce((s, l) => s + l.monthlyPayment, 0);
    const monthlyIncome = this.getMonthlyIncome();
    const totalRentEarned = this.state.totalRentEarned || 0;

    // Monthly payment capacity: percentage of rental income allocated to debt service
    // Use higher of current income or historical average (vacancy shouldn't kill credit)
    var monthsPlayed = Math.max(1, this.state.month || 1);
    var historicalAvgIncome = totalRentEarned > 0 ? Math.round(totalRentEarned / monthsPlayed) : 0;
    var effectiveIncome = Math.max(monthlyIncome, historicalAvgIncome);
    // Bootstrap (<3 properties): 90% — aggressive but necessary to enable growth from 1→2 properties
    // Established (3+ properties): 50% — tighter discipline as portfolio scales
    var propCount = this.state.properties ? this.state.properties.length : 0;
    var debtRatio = propCount < 3 ? 0.9 : 0.5;
    var paymentCapacity = Math.max(0, Math.round(effectiveIncome * debtRatio) - existingPayments);

    // Max total debt: proportional to rent history (can't borrow big with no track record)
    // Must have earned rent before qualifying for meaningful loans
    var maxTotalDebt;
    if (totalRentEarned <= 0) {
      // No rent history: tiny starter loans only (enough for mitigation, not properties)
      maxTotalDebt = Math.min(Math.round(netWorth * 0.15), monthlyIncome * 24);
    } else {
      // Has rent history: scale with proven income
      // Bootstrap: small portfolios (<€20K NW) get higher LTV to enable growth
      var ltvRatio = netWorth < 20000 ? 0.85 : 0.7;
      maxTotalDebt = Math.min(
        Math.round(netWorth * ltvRatio), // NW cap (higher for small players)
        totalRentEarned * 30              // must earn ~3% of loan in rent first
      );
      // Floor: at least 5 years of current monthly income
      maxTotalDebt = Math.max(maxTotalDebt, monthlyIncome * 60);
    }
    var availableDebtRoom = Math.max(0, maxTotalDebt - existingDebt);

    const offers = [];

    GameData.banks.forEach(bank => {
      if (bank.minNetWorth && netWorth < bank.minNetWorth) return;
      if (bank.maxNetWorth && netWorth > bank.maxNetWorth) return;

      const maxLoan = Math.min(
        Math.round(netWorth * bank.maxLoanPct) - existingDebt,
        availableDebtRoom
      );
      if (maxLoan <= 0) return;

      const loanAmount = Math.min(amount, maxLoan);
      if (loanAmount <= 0) return;

      bank.termMonths.forEach(term => {
        // Rate varies by term length and market conditions
        let rate = bank.baseRate + (this.state.bankRateModifier || 0);
        rate += (Math.random() - 0.5) * bank.rateVariance;
        // Longer terms = slightly higher rates
        rate += (term / 240) * 0.01;
        rate = Math.max(0.01, Math.round(rate * 1000) / 1000);

        const monthlyRate = rate / 12;
        const monthlyPayment = Math.round(
          loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) /
          (Math.pow(1 + monthlyRate, term) - 1)
        );
        const totalRepayment = monthlyPayment * term;

        // Skip if monthly payment exceeds remaining capacity
        if (monthlyPayment > paymentCapacity) return;

        offers.push({
          bankId: bank.id,
          bankName: bank.name,
          bankIcon: bank.icon,
          amount: loanAmount,
          maxAmount: maxLoan,
          interestRate: rate,
          termMonths: term,
          monthlyPayment,
          totalRepayment,
          totalInterest: totalRepayment - loanAmount
        });
      });
    });

    return offers;
  },

  takeLoan(bankId, amount, termMonths) {
    const offers = this.getLoanOffers(amount);
    const offer = offers.find(o => o.bankId === bankId && o.termMonths === termMonths);
    if (!offer) return { success: false, message: 'Loan offer not available.' };

    const loan = {
      id: 'loan_' + Date.now(),
      bankId,
      bankName: offer.bankName,
      principal: offer.amount,
      remainingBalance: offer.amount,
      interestRate: offer.interestRate,
      monthlyPayment: offer.monthlyPayment,
      termMonths,
      monthsLeft: termMonths,
      monthTaken: this.state.month
    };

    if (!this.state.loans) this.state.loans = [];
    this.state.loans.push(loan);
    this.state.cash += offer.amount;

    this.save();
    return {
      success: true,
      message: `Loan of ${GameData.formatMoney(offer.amount)} from ${offer.bankName} at ${(offer.interestRate * 100).toFixed(1)}% over ${termMonths} months. Payment: ${GameData.formatMoney(offer.monthlyPayment)}/mo.`
    };
  },

  repayLoan(loanId, amount) {
    if (!this.state.loans) return { success: false, message: 'No loans.' };
    const loan = this.state.loans.find(l => l.id === loanId);
    if (!loan) return { success: false, message: 'Loan not found.' };

    const repayAmount = amount ? Math.min(amount, loan.remainingBalance) : loan.remainingBalance;
    if (this.state.cash < repayAmount) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(repayAmount)}.` };
    }

    this.state.cash -= repayAmount;
    loan.remainingBalance -= repayAmount;

    if (loan.remainingBalance <= 0) {
      this.state.loans = this.state.loans.filter(l => l.id !== loanId);
      this.save();
      return { success: true, message: `Loan fully repaid! Paid ${GameData.formatMoney(repayAmount)}.` };
    }

    this.save();
    return { success: true, message: `Repaid ${GameData.formatMoney(repayAmount)}. Remaining: ${GameData.formatMoney(loan.remainingBalance)}.` };
  },

  processLoanPayments() {
    if (!this.state.loans) return 0;
    let totalPaid = 0;

    this.state.loans = this.state.loans.filter(loan => {
      const payment = Math.min(loan.monthlyPayment, loan.remainingBalance);
      const interestPortion = Math.round(loan.remainingBalance * loan.interestRate / 12);

      // LOAN PAYMENT: fixed monthly, split between interest (on balance) and principal
      this.state.cash -= payment;
      loan.remainingBalance -= (payment - interestPortion);
      loan.monthsLeft--;
      totalPaid += payment;

      if (!this.state.totalLoanInterestPaid) this.state.totalLoanInterestPaid = 0;
      this.state.totalLoanInterestPaid += interestPortion;
      GameEngine._log('loan', 'payment', -payment, loan.bankName + ' int=' + interestPortion + ' princ=' + (payment-interestPortion) + ' bal=' + loan.remainingBalance);

      if (loan.remainingBalance <= 0 || loan.monthsLeft <= 0) {
        return false; // Remove paid-off loan
      }
      return true;
    });

    return totalPaid;
  },

  // ========== BUSINESS STAKES ==========

  getBusinessStakeValue() {
    if (!this.state.ownedStakes) return 0;
    let total = 0;
    this.state.ownedStakes.forEach(stake => {
      const cityBiz = (this.state.businesses || {})[stake.cityId] || [];
      const biz = cityBiz.find(b => b.id === stake.businessId);
      if (biz) total += Math.round(biz.totalValue * stake.stakePct / 100);
    });
    return total;
  },

  getMonthlyDividends() {
    if (!this.state.ownedStakes) return 0;
    let total = 0;
    this.state.ownedStakes.forEach(stake => {
      const cityBiz = (this.state.businesses || {})[stake.cityId] || [];
      const biz = cityBiz.find(b => b.id === stake.businessId);
      if (biz && biz.monthlyProfit > 0) {
        total += Math.round(biz.monthlyProfit * stake.stakePct / 100 * biz.performance);
      }
    });
    return total;
  },

  buyStake(businessId, cityId, stakePct) {
    if (!this.state.businesses) return { success: false, message: 'No businesses available.' };
    const cityBiz = this.state.businesses[cityId];
    if (!cityBiz) return { success: false, message: 'City not found.' };
    const biz = cityBiz.find(b => b.id === businessId);
    if (!biz) return { success: false, message: 'Business not found.' };

    stakePct = Math.min(stakePct, biz.availableStake);
    if (stakePct <= 0) return { success: false, message: 'No stake available.' };

    const cost = Math.round(biz.totalValue * stakePct / 100);
    if (this.state.cash < cost) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(cost)}.` };
    }

    this.state.cash -= cost;
    biz.availableStake -= stakePct;

    if (!this.state.ownedStakes) this.state.ownedStakes = [];
    // Check if already own stake in this business
    const existing = this.state.ownedStakes.find(s => s.businessId === businessId);
    if (existing) {
      existing.stakePct += stakePct;
      existing.purchasePrice += cost;
    } else {
      this.state.ownedStakes.push({
        businessId,
        cityId,
        stakePct,
        purchasePrice: cost,
        monthPurchased: this.state.month
      });
    }

    this.save();
    return {
      success: true,
      message: `Bought ${stakePct}% of ${biz.name} for ${GameData.formatMoney(cost)}. Est. dividends: ${GameData.formatMoney(Math.round(biz.monthlyProfit * stakePct / 100))}/mo.`
    };
  },

  sellStake(businessId) {
    if (!this.state.ownedStakes) return { success: false, message: 'No stakes owned.' };
    const stakeIdx = this.state.ownedStakes.findIndex(s => s.businessId === businessId);
    if (stakeIdx === -1) return { success: false, message: 'Stake not found.' };

    const stake = this.state.ownedStakes[stakeIdx];
    const cityBiz = (this.state.businesses || {})[stake.cityId] || [];
    const biz = cityBiz.find(b => b.id === businessId);
    if (!biz) return { success: false, message: 'Business not found.' };

    const saleValue = Math.round(biz.totalValue * stake.stakePct / 100 * 0.97); // 3% fee
    this.state.cash += saleValue;
    biz.availableStake += stake.stakePct;
    this.state.ownedStakes.splice(stakeIdx, 1);

    const profit = saleValue - stake.purchasePrice;
    this.save();
    return {
      success: true,
      message: `Sold ${stake.stakePct}% stake for ${GameData.formatMoney(saleValue)}. ${profit >= 0 ? 'Profit' : 'Loss'}: ${GameData.formatMoney(Math.abs(profit))}.`
    };
  },

  processBusinesses() {
    // Fluctuate business performance and collect dividends
    let dividends = 0;
    if (!this.state.businesses) return dividends;

    Object.keys(this.state.businesses).forEach(cityId => {
      this.state.businesses[cityId].forEach(biz => {
        // Performance fluctuation
        const shift = (Math.random() - 0.48) * biz.riskFactor * 0.2;
        biz.performance = Math.max(0.3, Math.min(1.8, biz.performance + shift));

        // Update revenue/expenses
        const typeDef = GameData.businessTypes[biz.type];
        if (typeDef) {
          biz.monthlyRevenue = Math.round(biz.monthlyRevenue * (1 + (Math.random() - 0.48) * 0.05));
          biz.monthlyExpenses = Math.round(biz.monthlyExpenses * (1 + (Math.random() - 0.48) * 0.03));
          biz.monthlyProfit = biz.monthlyRevenue - biz.monthlyExpenses;
        }

        // Value fluctuation
        biz.totalValue = Math.round(biz.totalValue * (1 + (Math.random() - 0.48) * 0.03));
      });
    });

    // Collect dividends from owned stakes
    if (this.state.ownedStakes) {
      this.state.ownedStakes.forEach(stake => {
        const cityBiz = this.state.businesses[stake.cityId] || [];
        const biz = cityBiz.find(b => b.id === stake.businessId);
        if (biz && biz.monthlyProfit > 0) {
          const div = Math.round(biz.monthlyProfit * stake.stakePct / 100 * biz.performance);
          dividends += div;
        }
      });
    }

    this.state.cash += dividends;
    if (!this.state.totalDividendsEarned) this.state.totalDividendsEarned = 0;
    this.state.totalDividendsEarned += dividends;

    return dividends;
  },

  // ========== AUTO-SELL ==========

  addAutoSellRule(propertyId, type, threshold) {
    // type: 'pct' (appreciation %) or 'value' (absolute value)
    if (!this.state.autoSellRules) this.state.autoSellRules = [];
    // Remove existing rule for this property
    this.state.autoSellRules = this.state.autoSellRules.filter(r => r.propertyId !== propertyId);
    this.state.autoSellRules.push({ propertyId, type, threshold });
    this.save();
    return { success: true, message: `Auto-sell set: will sell when ${type === 'pct' ? 'appreciation reaches ' + threshold + '%' : 'value reaches ' + GameData.formatMoney(threshold)}.` };
  },

  removeAutoSellRule(propertyId) {
    if (!this.state.autoSellRules) return;
    this.state.autoSellRules = this.state.autoSellRules.filter(r => r.propertyId !== propertyId);
    this.save();
  },

  processAutoSells() {
    if (!this.state.autoSellRules) return [];
    const sold = [];

    this.state.autoSellRules = this.state.autoSellRules.filter(rule => {
      const prop = this.state.properties.find(p => p.id === rule.propertyId);
      if (!prop) return false; // property no longer owned

      let shouldSell = false;
      if (rule.type === 'pct') {
        const appreciation = ((prop.currentValue - prop.purchasePrice) / prop.purchasePrice) * 100;
        shouldSell = appreciation >= rule.threshold;
      } else if (rule.type === 'value') {
        shouldSell = prop.currentValue >= rule.threshold;
      }

      if (shouldSell && !prop.isBuilding && !prop.isRefurbishing) {
        const result = this.sellProperty(prop.id);
        if (result.success) {
          sold.push({ property: prop, result });
          return false; // Remove rule
        }
      }
      return true;
    });

    return sold;
  },

  // ========== ERA SYSTEM ==========

  getCurrentEra() {
    const year = this.state.year;
    return GameData.eras.find(e => year >= e.years[0] && year <= e.years[1]) || GameData.eras[GameData.eras.length - 1];
  },

  checkEraTransition() {
    const era = this.getCurrentEra();
    if (era.id !== this.state.currentEra) {
      const old = this.state.currentEra;
      this.state.currentEra = era.id;
      return { oldEra: old, newEra: era };
    }
    return null;
  },

  // ========== PLAYER-OPERATED BANKS ==========

  canOpenBank() {
    const era = this.getCurrentEra();
    if (!era.features.playerBanks) return false;
    const nw = this.getNetWorth();
    // Need significant capital to open a bank
    const threshold = era.id === 'gilded_age' ? 500000 : era.id === 'modern_era' ? 5000000 : 10000000;
    return nw >= threshold;
  },

  openBank(name, capital) {
    if (!this.canOpenBank()) return { success: false, message: 'Cannot open a bank in this era or not enough capital.' };
    if (this.state.cash < capital) return { success: false, message: 'Not enough cash.' };
    if (capital < 10000) return { success: false, message: 'Minimum bank capital required.' };

    this.state.cash -= capital;
    if (!this.state.playerBanks) this.state.playerBanks = [];

    this.state.playerBanks.push({
      id: 'pbank_' + Date.now(),
      name: name || (this.state.familyName + ' Bank'),
      capital: capital,
      reserves: capital,
      interestRate: 0.06,
      loansOut: [],
      totalInterestEarned: 0,
      monthlyProfit: 0,
      reputation: 50,
      monthOpened: this.state.month
    });

    this.save();
    return { success: true, message: `${name} established with ${GameData.formatMoney(capital)} in capital!` };
  },

  processPlayerBanks() {
    if (!this.state.playerBanks) return 0;
    let totalProfit = 0;

    this.state.playerBanks.forEach(bank => {
      // Simulate lending: bank generates loans automatically
      if (bank.reserves > bank.capital * 0.2 && Math.random() < 0.3) {
        const loanSize = Math.round(bank.reserves * (0.1 + Math.random() * 0.2));
        bank.reserves -= loanSize;
        bank.loansOut.push({
          amount: loanSize,
          remaining: loanSize,
          monthsLeft: 12 + Math.floor(Math.random() * 48),
          rate: bank.interestRate
        });
      }

      // Collect loan payments
      let monthlyIncome = 0;
      bank.loansOut = bank.loansOut.filter(loan => {
        const payment = Math.round(loan.remaining / Math.max(1, loan.monthsLeft));
        const interest = Math.round(loan.remaining * loan.rate / 12);
        bank.reserves += payment + interest;
        loan.remaining -= payment;
        loan.monthsLeft--;
        monthlyIncome += interest;

        // Some defaults (risk)
        if (Math.random() < 0.005) {
          bank.reserves -= Math.round(loan.remaining * 0.5);
          bank.reputation = Math.max(0, bank.reputation - 2);
          return false;
        }
        return loan.remaining > 0 && loan.monthsLeft > 0;
      });

      bank.totalInterestEarned += monthlyIncome;
      bank.monthlyProfit = monthlyIncome;
      totalProfit += monthlyIncome;

      // Reputation grows slowly
      bank.reputation = Math.min(100, bank.reputation + 0.1);
    });

    this.state.cash += totalProfit;
    return totalProfit;
  },

  // ========== BUSINESS MERGERS ==========

  canMerge() {
    const era = this.getCurrentEra();
    return era.features.mergers;
  },

  mergeBusiness(businessId1, businessId2, cityId) {
    if (!this.canMerge()) return { success: false, message: 'Mergers not available in this era.' };
    if (!this.state.businesses || !this.state.businesses[cityId]) return { success: false, message: 'City not found.' };

    const biz1 = this.state.businesses[cityId].find(b => b.id === businessId1);
    const biz2 = this.state.businesses[cityId].find(b => b.id === businessId2);
    if (!biz1 || !biz2) return { success: false, message: 'Business not found.' };

    // Need controlling stake (51%+) in at least one
    const stakes = this.state.ownedStakes || [];
    const stake1 = stakes.find(s => s.businessId === businessId1);
    const stake2 = stakes.find(s => s.businessId === businessId2);

    if ((!stake1 || stake1.stakePct < 51) && (!stake2 || stake2.stakePct < 51)) {
      return { success: false, message: 'Need controlling interest (51%+) in at least one business to merge.' };
    }

    // Cost to acquire the other
    const targetBiz = (stake1 && stake1.stakePct >= 51) ? biz2 : biz1;
    const acquirerBiz = (stake1 && stake1.stakePct >= 51) ? biz1 : biz2;
    const acquisitionCost = Math.round(targetBiz.totalValue * (targetBiz.availableStake / 100) * 0.85);

    if (this.state.cash < acquisitionCost) {
      return { success: false, message: `Need ${GameData.formatMoney(acquisitionCost)} to acquire ${targetBiz.name}.` };
    }

    // Execute merger
    this.state.cash -= acquisitionCost;
    acquirerBiz.totalValue += targetBiz.totalValue;
    acquirerBiz.monthlyRevenue += targetBiz.monthlyRevenue;
    acquirerBiz.monthlyExpenses += Math.round(targetBiz.monthlyExpenses * 0.7); // Synergies
    acquirerBiz.monthlyProfit = acquirerBiz.monthlyRevenue - acquirerBiz.monthlyExpenses;
    acquirerBiz.employees += targetBiz.employees;
    acquirerBiz.name = acquirerBiz.name.split(' — ')[0] + ' Group';

    // Remove target from market
    this.state.businesses[cityId] = this.state.businesses[cityId].filter(b => b.id !== targetBiz.id);
    // Remove target stakes
    this.state.ownedStakes = (this.state.ownedStakes || []).filter(s => s.businessId !== targetBiz.id);

    if (!this.state.mergerHistory) this.state.mergerHistory = [];
    this.state.mergerHistory.push({
      month: this.state.month,
      acquirer: acquirerBiz.name,
      target: targetBiz.name,
      cost: acquisitionCost
    });

    this.save();
    return {
      success: true,
      message: `Merged ${targetBiz.name} into ${acquirerBiz.name}! Synergies save 30% on costs.`
    };
  },

  // Get control level label for a stake
  getControlLevel(stakePct) {
    const t = GameData.controlThresholds;
    if (stakePct >= t.full) return { level: 'full', label: 'Full Owner', color: '#D4A84B' };
    if (stakePct >= t.supermajority) return { level: 'super', label: 'Supermajority', color: '#2C6E49' };
    if (stakePct >= t.controlling) return { level: 'controlling', label: 'Controlling', color: '#2A9D8F' };
    if (stakePct >= t.blocking) return { level: 'blocking', label: 'Blocking Minority', color: '#3D5A80' };
    if (stakePct >= t.significant) return { level: 'significant', label: 'Board Seat', color: '#457B9D' };
    if (stakePct >= t.minority) return { level: 'minority', label: 'Minority Stake', color: '#7B6D4E' };
    return { level: 'none', label: 'Observer', color: '#99A3A8' };
  },

  // ========== BANK SAVINGS ==========

  deposit(amount) {
    if (!amount || amount <= 0) return { success: false, message: 'Invalid amount.' };
    if (this.state.cash < amount) return { success: false, message: 'Not enough cash.' };
    this.state.cash -= amount;
    if (!this.state.savingsBalance) this.state.savingsBalance = 0;
    this.state.savingsBalance += amount;
    this.save();
    return { success: true, message: `Deposited ${GameData.formatMoney(amount)}. Savings: ${GameData.formatMoney(this.state.savingsBalance)}.` };
  },

  withdraw(amount) {
    if (!amount || amount <= 0) return { success: false, message: 'Invalid amount.' };
    if (!this.state.savingsBalance) this.state.savingsBalance = 0;
    if (this.state.savingsBalance < amount) return { success: false, message: 'Not enough in savings.' };
    this.state.savingsBalance -= amount;
    this.state.cash += amount;
    this.save();
    return { success: true, message: `Withdrew ${GameData.formatMoney(amount)}. Savings: ${GameData.formatMoney(this.state.savingsBalance)}.` };
  },

  processSavingsInterest() {
    if (!this.state.savingsBalance || this.state.savingsBalance <= 0) return 0;
    const rate = this.state.savingsRate || 0.02;
    const monthlyInterest = Math.round(this.state.savingsBalance * rate / 12);
    this.state.savingsBalance += monthlyInterest;
    if (!this.state.totalSavingsInterest) this.state.totalSavingsInterest = 0;
    this.state.totalSavingsInterest += monthlyInterest;
    return monthlyInterest;
  },

  // ========== STOCKS & BONDS ==========

  getAvailableInvestments() {
    const baseRate = this.state.bankRateModifier || 0;
    const year = this.state.year;
    const era = this.getCurrentEra();
    // Investment prices scale differently — use square root of era multiplier for gentler scaling
    // Investment price scaling — gentler than property scaling, minimum €2 per unit
    const rawScale = Math.sqrt(era.propertyMultiplier || 1);
    const eraScale = Math.max(0.15, rawScale); // floor at 0.15 (gold=€8, silver=€2)
    const all = [];

    // Commodities - historically accurate availability
    // Gold & Silver: always available
    all.push({ id: 'gold', type: 'commodity', name: 'Gold', icon: '🥇',
      unitPrice: Math.round(50 * eraScale), annualYield: 0.03, risk: 0.12, minYear: 0,
      description: 'The eternal store of value.' });
    all.push({ id: 'silver', type: 'commodity', name: 'Silver', icon: '🥈',
      unitPrice: Math.round(10 * eraScale), annualYield: 0.025, risk: 0.15, minYear: 0,
      description: 'Precious metal. Monetary and industrial use.' });
    // Cotton: 1750+
    all.push({ id: 'cotton', type: 'commodity', name: 'Cotton', icon: '☁️',
      unitPrice: Math.round(5 * eraScale), annualYield: 0.06, risk: 0.20, minYear: 1750,
      description: 'King Cotton. Drives the textile trade.' });
    // Tea & Spices: 1750+
    all.push({ id: 'tea_spices', type: 'commodity', name: 'Tea & Spices', icon: '🍵',
      unitPrice: Math.round(8 * eraScale), annualYield: 0.07, risk: 0.18, minYear: 1750,
      description: 'Colonial trade goods. High demand.' });
    // Coal: 1780+
    if (year >= 1780) all.push({ id: 'coal', type: 'commodity', name: 'Coal', icon: '⛏️',
      unitPrice: Math.round(15 * eraScale), annualYield: 0.05, risk: 0.10, minYear: 1780,
      description: 'Fuel of the Industrial Revolution.' });
    // Iron/Steel: 1800+
    if (year >= 1800) all.push({ id: 'iron_steel', type: 'commodity', name: 'Iron & Steel', icon: '⚒️',
      unitPrice: Math.round(30 * eraScale), annualYield: 0.06, risk: 0.12, minYear: 1800,
      description: 'Building material of empires.' });
    // Oil: 1859+ (first well drilled)
    if (year >= 1859) all.push({ id: 'oil', type: 'commodity', name: 'Crude Oil', icon: '🛢️',
      unitPrice: Math.round(100 * eraScale), annualYield: 0.08, risk: 0.25, minYear: 1859,
      description: 'Black gold. Discovered 1859.' });
    // Rubber: 1880+
    if (year >= 1880) all.push({ id: 'rubber', type: 'commodity', name: 'Rubber', icon: '🌳',
      unitPrice: Math.round(25 * eraScale), annualYield: 0.06, risk: 0.18, minYear: 1880,
      description: 'Essential for the automobile age.' });
    // Copper/Aluminum: 1900+
    if (year >= 1900) all.push({ id: 'copper', type: 'commodity', name: 'Copper & Aluminium', icon: '🔶',
      unitPrice: Math.round(40 * eraScale), annualYield: 0.05, risk: 0.15, minYear: 1900,
      description: 'Industrial metals. Wiring the world.' });
    // Uranium: 1945+
    if (year >= 1945) all.push({ id: 'uranium', type: 'commodity', name: 'Uranium', icon: '☢️',
      unitPrice: Math.round(500 * eraScale), annualYield: 0.07, risk: 0.35, minYear: 1945,
      description: 'Nuclear age. Power and peril.' });
    // Lithium: 1990+
    if (year >= 1990) all.push({ id: 'lithium', type: 'commodity', name: 'Lithium', icon: '🔋',
      unitPrice: Math.round(200 * eraScale), annualYield: 0.12, risk: 0.30, minYear: 1990,
      description: 'Battery revolution. The new oil.' });
    // Rare Earths: 2000+
    if (year >= 2000) all.push({ id: 'rare_earth', type: 'commodity', name: 'Rare Earth Minerals', icon: '💎',
      unitPrice: Math.round(300 * eraScale), annualYield: 0.10, risk: 0.28, minYear: 2000,
      description: 'Critical for tech. Geopolitical power.' });

    // Bonds - available from 1800+ (when stock exchanges emerge)
    if (year >= 1800) {
      all.push({ id: 'gov_bond', type: 'bond', name: 'Government Bond', icon: '🏛️',
        unitPrice: Math.round(100 * eraScale), annualYield: 0.04 + baseRate, risk: 0.03,
        description: 'Safe, government-backed.' });
    }
    if (year >= 1870) {
      all.push({ id: 'corp_bond', type: 'bond', name: 'Corporate Bond', icon: '🏢',
        unitPrice: Math.round(500 * eraScale), annualYield: 0.06 + baseRate, risk: 0.08,
        description: 'Higher yield, some default risk.' });
      all.push({ id: 'railway_bond', type: 'bond', name: 'Railway Bond', icon: '🚂',
        unitPrice: Math.round(200 * eraScale), annualYield: 0.07 + baseRate, risk: 0.12,
        description: 'Finance the iron roads.' });
    }

    // Stocks - available from 1870+
    if (year >= 1870) {
      all.push({ id: 'blue_chip', type: 'stock', name: 'Blue Chip Stocks', icon: '📊',
        unitPrice: Math.round(300 * eraScale), annualYield: 0.06, risk: 0.12,
        description: 'Large established companies.' });
    }
    if (year >= 1930) {
      all.push({ id: 'index_fund', type: 'stock', name: 'Index Fund', icon: '🌍',
        unitPrice: Math.round(500 * eraScale), annualYield: 0.08, risk: 0.15,
        description: 'Diversified equities.' });
    }
    if (year >= 1980) {
      all.push({ id: 'tech_stocks', type: 'stock', name: 'Tech Stocks', icon: '💻',
        unitPrice: Math.round(1000 * eraScale), annualYield: 0.14, risk: 0.30,
        description: 'Technology sector. High growth.' });
      all.push({ id: 'reit', type: 'stock', name: 'Real Estate REIT', icon: '🏠',
        unitPrice: Math.round(2000 * eraScale), annualYield: 0.07, risk: 0.12,
        description: 'Real estate investment trust.' });
    }
    if (year >= 2000) {
      all.push({ id: 'emerging_mkts', type: 'stock', name: 'Emerging Markets', icon: '🚀',
        unitPrice: Math.round(500 * eraScale), annualYield: 0.14, risk: 0.35,
        description: 'High-growth developing economies.' });
    }

    return all;
  },

  buyInvestment(investmentId, units) {
    const available = this.getAvailableInvestments();
    const inv = available.find(i => i.id === investmentId);
    if (!inv) return { success: false, message: 'Investment not found.' };

    units = Math.max(1, Math.floor(units || 1));
    const cost = inv.unitPrice * units;
    if (this.state.cash < cost) return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(cost)}.` };

    this.state.cash -= cost;
    if (!this.state.investments) this.state.investments = [];

    // Check if already holding this
    const existing = this.state.investments.find(i => i.id === investmentId);
    if (existing) {
      existing.units += units;
      existing.totalInvested += cost;
    } else {
      this.state.investments.push({
        id: investmentId,
        type: inv.type,
        name: inv.name,
        icon: inv.icon,
        units: units,
        purchaseUnitPrice: inv.unitPrice,
        currentUnitPrice: inv.unitPrice,
        totalInvested: cost,
        annualYield: inv.annualYield,
        risk: inv.risk
      });
    }

    this.save();
    return { success: true, message: `Bought ${units} units of ${inv.name} for ${GameData.formatMoney(cost)}.` };
  },

  sellInvestment(investmentId, units) {
    if (!this.state.investments) return { success: false, message: 'No investments.' };
    const inv = this.state.investments.find(i => i.id === investmentId);
    if (!inv) return { success: false, message: 'Investment not found.' };

    units = Math.min(units || inv.units, inv.units);
    const saleValue = Math.round(inv.currentUnitPrice * units);
    const costBasis = Math.round(inv.totalInvested * (units / inv.units));

    this.state.cash += saleValue;
    inv.units -= units;
    inv.totalInvested -= costBasis;

    if (!this.state.totalInvestmentGains) this.state.totalInvestmentGains = 0;
    this.state.totalInvestmentGains += (saleValue - costBasis);

    if (inv.units <= 0) {
      this.state.investments = this.state.investments.filter(i => i.id !== investmentId);
    }

    this.save();
    const profit = saleValue - costBasis;
    return { success: true, message: `Sold ${units} units for ${GameData.formatMoney(saleValue)}. ${profit >= 0 ? 'Gain' : 'Loss'}: ${GameData.formatMoney(Math.abs(profit))}.` };
  },

  processInvestments() {
    if (!this.state.investments) return 0;
    let totalReturn = 0;

    this.state.investments.forEach(inv => {
      // Monthly price fluctuation
      const monthlyYield = inv.annualYield / 12;
      const randomShock = (Math.random() - 0.48) * inv.risk * 0.5;
      const monthlyChange = monthlyYield + randomShock;

      inv.currentUnitPrice = Math.max(1, Math.round(inv.currentUnitPrice * (1 + monthlyChange)));

      // Bonds pay monthly coupon
      if (inv.type === 'bond') {
        const coupon = Math.round(inv.currentUnitPrice * inv.units * inv.annualYield / 12);
        this.state.cash += coupon;
        totalReturn += coupon;
      }
    });

    return totalReturn;
  },

  getInvestmentValue() {
    if (!this.state.investments) return 0;
    return this.state.investments.reduce((sum, inv) => sum + (inv.currentUnitPrice * inv.units), 0);
  },

  // ========== TAX SHELTERS (Shell Companies) ==========

  setupTaxShelter(propertyId) {
    var prop = this.state.properties.find(function(p) { return p.id === propertyId; });
    if (!prop) return { success: false, message: 'Property not found.' };
    if (prop.taxShelter) return { success: false, message: 'Already has a shell company.' };
    // Cost: 3% of property value (min €300, max €8000)
    var cost = Math.max(300, Math.min(8000, Math.round(prop.currentValue * 0.03)));
    if (this.state.cash < cost) return { success: false, message: 'Need ' + GameData.formatMoney(cost) + ' to set up shell company.' };
    this.state.cash -= cost;
    prop.taxShelter = true;
    this.save();
    return { success: true, message: '🏢 Shell company set up for ' + prop.name + '! Property tax reduced 60%. Cost: ' + GameData.formatMoney(cost), cost: cost };
  },

  // ========== PROPERTY MANAGERS ==========

  hireManager(cityId, managerId) {
    if (!this.state.managers) this.state.managers = {};
    if (this.state.managers[cityId]) return { success: false, message: 'Already have a manager in this city.' };
    var mgr = GameData.managerPool.find(function(m) { return m.id === managerId; });
    if (!mgr) return { success: false, message: 'Manager not found.' };
    if (this.state.cash < mgr.hireCost) return { success: false, message: 'Not enough cash. Need ' + GameData.formatMoney(mgr.hireCost) + '.' };
    this.state.cash -= mgr.hireCost;
    this.state.managers[cityId] = { id: mgr.id, name: mgr.name, icon: mgr.icon, quality: mgr.quality, fee: mgr.fee, trait: mgr.trait, monthsActive: 0 };
    this.save();
    return { success: true, message: mgr.icon + ' ' + mgr.name + ' hired for ' + GameData.formatMoney(mgr.hireCost) + '!' };
  },

  fireManager(cityId) {
    if (!this.state.managers || !this.state.managers[cityId]) return { success: false, message: 'No manager in this city.' };
    var mgr = this.state.managers[cityId];
    delete this.state.managers[cityId];
    this.save();
    return { success: true, message: mgr.icon + ' ' + mgr.name + ' dismissed.' };
  },

  // Called from advanceMonth — managers auto-handle properties
  processManagers(results) {
    if (!this.state.managers) return 0;
    var totalFees = 0;
    var self = this;
    Object.keys(this.state.managers).forEach(function(cityId) {
      var mgr = self.state.managers[cityId];
      mgr.monthsActive++;
      var cityProps = self.state.properties.filter(function(p) { return p.cityId === cityId; });

      cityProps.forEach(function(p) {
        var mgrSettings = mgr.settings || { autoRent: true, autoRefurb: true, autoMitigation: true, autoDecisions: true };

        // 1. Auto re-rent vacancies
        if (mgrSettings.autoRent && !p.isRented && !p.isRefurbishing && !p.isBuilding && p.condition !== 'derelict' && p.monthlyRent > 0) {
          p.isRented = true;
          p.tenant = GameData.assignTenant(p);
          self._log('manager', 'auto-rent', 0, mgr.name + ' rented ' + p.name);
        }

        // 2. Auto refurbish — good managers maintain at Fair, all fix Poor/Derelict
        if (mgrSettings.autoRefurb && !p.isRefurbishing && !p.isBuilding) {
          var needsRefurb = (p.condition === 'poor' || p.condition === 'derelict');
          // High quality managers also refurb Fair → Good (preventive maintenance)
          if (!needsRefurb && mgr.quality >= 0.7 && p.condition === 'fair') needsRefurb = true;
          if (needsRefurb) {
            var tier = mgr.trait === 'handyman' ? 'budget' : (mgr.quality >= 0.8 ? 'standard' : 'budget');
            var refurbResult = self.refurbishProperty(p.id, tier);
            if (refurbResult.success) {
              self._log('manager', 'auto-refurb', 0, mgr.name + ' started ' + tier + ' refurb on ' + p.name + ' (was ' + p.condition + ')');
            }
          }
        }

        // 3. Auto-buy mitigations (insurance, fire alarm, security, flood barriers, seismic)
        if (mgrSettings.autoMitigation) {
        var propMits = self.state.mitigations[p.id] || {};
        var mitOptions = self.getMitigationOptions(p);
        mitOptions.forEach(function(mit) {
          // Skip if already owned OR if buying would push cash below €50
          if (propMits[mit.id] || self.state.cash < mit.cost + 50) return;
          // Insurance logic: only one type allowed
          if (mit.id === 'insurance_basic') {
            if (propMits['insurance_premium']) return; // already have better
            if (mgr.quality >= 0.8) return; // premium manager will buy premium instead
          }
          if (mit.id === 'insurance_premium') {
            if (mgr.quality < 0.8) return; // not qualified for premium
            // If has basic, remove it first (upgrade)
            if (propMits['insurance_basic']) {
              delete self.state.mitigations[p.id]['insurance_basic'];
              propMits['insurance_basic'] = false;
            }
          }
          // Buy if: manager quality > 0.7 OR city has had recent disasters
          var shouldBuy = mgr.quality >= 0.7;
          if (!shouldBuy) {
            var recentDisasters = (self.state.disasterHistory || []).filter(function(d) {
              return d.cityId === p.cityId && (self.state.month - d.month) < 24;
            });
            if (recentDisasters.length > 0) shouldBuy = true;
          }
          if (shouldBuy) {
            self.state.cash -= mit.cost;
            if (!self.state.mitigations[p.id]) self.state.mitigations[p.id] = {};
            self.state.mitigations[p.id][mit.id] = true;
            propMits[mit.id] = true; // update local cache
            self._log('manager', 'auto-mitigation', -mit.cost, mgr.name + ' bought ' + mit.name + ' for ' + p.name);
          }
        });
        } // end autoMitigation

        // 4. Collect fee on rented properties
        if (p.isRented && p.monthlyRent > 0) {
          var fee = Math.round(p.monthlyRent * mgr.fee);
          self.state.cash -= fee;
          totalFees += fee;
        }
      });
    });
    return totalFees;
  },

  // ========== LEGACY RATING ==========

  getLegacyRating() {
    var s = this.state;
    var tiersCompleted = s.campaignTier || 0;
    var nw = this.getNetWorth();
    var gen = s.generation || 1;
    var rank = s.playerRank || 99;
    var achievementCount = (s.achievements || []).length;
    var totalAchievements = GameData.achievements ? GameData.achievements.length : 30;
    var rep = s.reputation || 50;

    // Score based on campaign tiers (60 pts max) + bonus factors (40 pts max)
    var score = tiersCompleted * 12; // 0-60 pts from campaign
    score += Math.min(10, Math.floor(achievementCount / totalAchievements * 10)); // 0-10 from achievements
    score += Math.min(10, rank === 1 ? 10 : rank <= 3 ? 6 : rank <= 5 ? 3 : 0); // 0-10 from rank
    score += Math.min(10, gen >= 5 ? 10 : gen >= 3 ? 6 : gen >= 2 ? 3 : 0); // 0-10 from dynasty
    score += Math.min(10, rep >= 90 ? 10 : rep >= 70 ? 6 : rep >= 50 ? 3 : 0); // 0-10 from reputation

    var grade, title;
    if (score >= 90) { grade = 'S'; title = 'Legendary Dynasty'; }
    else if (score >= 75) { grade = 'A'; title = 'Great Dynasty'; }
    else if (score >= 55) { grade = 'B'; title = 'Successful Dynasty'; }
    else if (score >= 35) { grade = 'C'; title = 'Modest Dynasty'; }
    else if (score >= 15) { grade = 'D'; title = 'Struggling Dynasty'; }
    else { grade = 'F'; title = 'Fledgling Dynasty'; }

    return {
      score: score,
      maxScore: 100,
      grade: grade,
      title: title,
      tiersCompleted: tiersCompleted,
      totalTiers: 5
    };
  },

  // ========== PRESTIGE / NEW GAME+ ==========

  getPrestigeStats() {
    var nw = this.getNetWorth();
    var gen = this.state.generation || 1;
    var props = this.state.properties.length;
    var cities = new Set(this.state.properties.map(function(p){return p.cityId;})).size;
    var rep = this.state.reputation || 50;
    var rank = this.state.playerRank || 7;
    var achievementCount = (this.state.achievements || []).length;

    // Prestige score based on achievements
    var score = 0;
    score += Math.floor(Math.log10(Math.max(1, nw))) * 10;
    score += gen * 5;
    score += props * 2;
    score += cities * 8;
    score += Math.floor(rep / 10) * 3;
    score += (7 - Math.min(7, rank)) * 10;
    score += achievementCount * 3; // achievements matter

    // Legacy points earned this run
    var legacyPoints = Math.floor(score / 3);

    // Prestige bonuses scale with level
    var prestigeLevel = (this.state.prestigeLevel || 0);
    var cashBonus = 1 + score * 0.02 + prestigeLevel * 0.15; // 2% per point + 15% per level
    var repBonus = Math.min(50, Math.floor(score / 4) + prestigeLevel * 5);

    // Prestige unlock descriptions
    var nextLevel = prestigeLevel + 1;
    var unlocks = [];
    if (nextLevel >= 1) unlocks.push({ name: 'Experienced Investor', desc: 'All properties start at Fair condition' });
    if (nextLevel >= 2) unlocks.push({ name: 'Connected', desc: 'Start with +25 reputation' });
    if (nextLevel >= 3) unlocks.push({ name: 'Old Money', desc: 'Properties appreciate 20% faster' });
    if (nextLevel >= 5) unlocks.push({ name: 'Dynasty Power', desc: 'Children inherit parent traits' });
    if (nextLevel >= 7) unlocks.push({ name: 'Market Manipulator', desc: 'AI families start 30% weaker' });
    if (nextLevel >= 10) unlocks.push({ name: 'Legend', desc: 'Start with 3 free properties' });

    return {
      score: score,
      legacyPoints: legacyPoints,
      netWorth: nw,
      generation: gen,
      properties: props,
      cities: cities,
      reputation: rep,
      rank: rank,
      cashBonus: cashBonus,
      repBonus: repBonus,
      unlocks: unlocks,
      nextLevel: nextLevel,
      achievementCount: achievementCount
    };
  },

  startPrestige(familyId) {
    var stats = this.getPrestigeStats();
    var prestigeLevel = (this.state.prestigeLevel || 0) + 1;
    var family = GameData.families.find(function(f){return f.id === familyId;}) || GameData.families[1];

    // Save legacy points across runs
    var totalLegacyPoints = (this.state.totalLegacyPoints || 0) + stats.legacyPoints;
    var prestigeHistory = this.state.prestigeHistory || [];
    prestigeHistory.push({
      level: prestigeLevel - 1,
      score: stats.score,
      netWorth: stats.netWorth,
      generation: stats.generation,
      properties: stats.properties,
      cities: stats.cities,
      achievements: stats.achievementCount
    });

    this.newGame(familyId);
    this.state.prestigeLevel = prestigeLevel;
    this.state.totalLegacyPoints = totalLegacyPoints;
    this.state.prestigeHistory = prestigeHistory;
    this.state.cash = Math.round(family.startingCash * stats.cashBonus);
    this.state.reputation = Math.min(80, 50 + stats.repBonus);
    this.state.familyName = family.name + (prestigeLevel > 0 ? ' (Prestige ' + prestigeLevel + ')' : '');

    // Apply prestige unlocks
    if (prestigeLevel >= 3) {
      // Old Money: appreciation bonus stored as modifier
      this.state.prestigeAppreciationBonus = 0.2;
    }
    if (prestigeLevel >= 7) {
      // Market Manipulator: weaken AI
      if (this.state.aiFamilies) {
        this.state.aiFamilies.forEach(function(ai) {
          ai.netWorth = Math.round(ai.netWorth * 0.7);
          ai.monthlyIncome = Math.round(ai.monthlyIncome * 0.7);
        });
      }
    }
    if (prestigeLevel >= 10) {
      // Legend: start with 3 free properties in a random city
      var cityId = GameData.cities[Math.floor(Math.random() * GameData.cities.length)].id;
      for (var i = 0; i < 3; i++) {
        var types = ['apartment', 'house', 'commercial'];
        var prop = GameData.generateProperty(cityId, types[i]);
        if (prop) {
          prop.isOwned = true;
          prop.purchasePrice = prop.currentValue;
          prop.monthPurchased = 0;
          this.state.properties.push(prop);
          // Remove from market
          var market = this.state.marketProperties[cityId] || [];
          if (market.length > 0) market.pop();
        }
      }
    }

    this.save();
    return stats;
  },

  // ========== DYNASTY SYSTEM ==========

  createFamilyMember(surname, age, isHead) {
    var firstNames = ['Alexander','Catherine','Edward','Elizabeth','Frederick','Isabella',
      'James','Margaret','Nicholas','Victoria','William','Charlotte','Henry','Maria',
      'Robert','Anne','George','Eleanor','Philip','Sophia'];
    var traits = ['shrewd','reckless','charming','frugal','ambitious','cautious','visionary','stubborn'];
    return {
      id: 'fm_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
      name: firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + surname,
      age: age,
      isHead: isHead || false,
      trait: traits[Math.floor(Math.random() * traits.length)],
      health: 60 + Math.floor(Math.random() * 40), // 60-100
      lifespan: 55 + Math.floor(Math.random() * 35), // 55-90
      birthYear: this.state ? this.state.year - age : 1720,
      educated: false
    };
  },

  getTraitBonus(trait) {
    var bonuses = {
      shrewd: { negotiation: 0.05, rent: 0 },      // 5% better negotiation
      reckless: { negotiation: 0, risk: 0.1 },       // 10% higher risk tolerance
      charming: { negotiation: 0, rent: 0.05 },      // 5% more rent (better tenants)
      frugal: { maintenance: -0.15, rent: 0 },        // 15% less maintenance
      ambitious: { negotiation: 0, growth: 0.01 },    // 1% more appreciation
      cautious: { disaster: -0.3, rent: 0 },           // 30% fewer disasters
      visionary: { negotiation: 0, growth: 0.02 },    // 2% more appreciation
      stubborn: { negotiation: -0.05, maintenance: -0.1 } // worse deals, lower maintenance
    };
    return bonuses[trait] || {};
  },

  processDynasty() {
    if (!this.state.familyMembers) return null;
    var results = { births: [], deaths: [], succession: null };

    // Age all members (1 year per 12 months)
    if (this.state.monthIndex === 0) { // January
      this.state.familyMembers.forEach(function(m) { m.age++; });

      // Check for births (head can have children if age 20-45, max 4 children)
      var head = this.state.familyMembers.find(function(m){return m.isHead;});
      var children = this.state.familyMembers.filter(function(m){return !m.isHead;});
      if (head && head.age >= 22 && head.age <= 45 && children.length < 4 && Math.random() < 0.15) {
        var surname = head.name.split(' ').pop();
        var child = this.createFamilyMember(surname, 0, false);
        child.birthYear = this.state.year;
        this.state.familyMembers.push(child);
        results.births.push(child);
      }

      // Check for death (based on age vs lifespan)
      var self = this;
      this.state.familyMembers = this.state.familyMembers.filter(function(m) {
        if (m.age >= m.lifespan || (m.age > 50 && Math.random() < (m.age - 50) / 200)) {
          results.deaths.push(m);
          if (m.isHead) {
            results.succession = true;
          }
          return false;
        }
        return true;
      });

      // Succession — oldest child becomes head
      if (results.succession) {
        var heirs = this.state.familyMembers.filter(function(m){return m.age >= 16;});
        heirs.sort(function(a,b){return b.age - a.age;});
        if (heirs.length > 0) {
          heirs[0].isHead = true;
          this.state.generation++;
          // Inheritance tax: 10% of cash
          var tax = Math.round(this.state.cash * 0.1);
          this.state.cash -= tax;
          results.successionHeir = heirs[0];
          results.inheritanceTax = tax;
        } else {
          // No heirs — game gets harder
          results.noHeir = true;
        }
      }

      // Update social tier based on reputation
      var rep = this.state.reputation || 50;
      if (rep >= 90) this.state.socialTier = 'Legend';
      else if (rep >= 80) this.state.socialTier = 'Magnate';
      else if (rep >= 70) this.state.socialTier = 'Tycoon';
      else if (rep >= 60) this.state.socialTier = 'Aristocrat';
      else if (rep >= 50) this.state.socialTier = 'Gentry';
      else if (rep >= 35) this.state.socialTier = 'Merchant';
      else this.state.socialTier = 'Commoner';
    }

    return results;
  },

  // ========== AI RIVALRY INTERACTIONS ==========

  generateAIInteraction() {
    if (!this.state.aiFamilies || this.state.aiFamilies.length === 0) return null;
    // Gate: AI diplomacy locked until player owns 5+ properties
    if (this.state.unlockedFeatures && !this.state.unlockedFeatures.aiDiplomacy) return null;
    if (Math.random() > 0.15) return null; // 15% chance per month

    var ai = this.state.aiFamilies[Math.floor(Math.random() * this.state.aiFamilies.length)];
    var rel = this.getRelationship(ai.name);
    var interactions = [];

    // Buyout offer: AI wants to buy one of your properties
    if (this.state.properties.length > 0) {
      var prop = this.state.properties[Math.floor(Math.random() * this.state.properties.length)];
      if (!prop.isBuilding && !prop.isRefurbishing) {
        // Better relationship = better offers
        var premium = 1.3 + Math.random() * 0.4 + (rel > 0 ? rel / 500 : 0); // 130-170% + relationship bonus
        interactions.push({
          type: 'buyout_offer',
          ai: ai,
          title: ai.icon + ' ' + ai.name + ' — Buyout Offer',
          description: ai.name + ' offer ' + GameData.formatMoney(Math.round(prop.currentValue * premium)) + ' for your ' + prop.name + ' (worth ' + GameData.formatMoney(prop.currentValue) + ').' + (rel > 20 ? ' They seem friendly.' : rel < -20 ? ' They seem hostile.' : ''),
          data: { propId: prop.id, amount: Math.round(prop.currentValue * premium), aiId: ai.name }
        });
      }
    }

    // Threat: more likely if relationship is bad
    var threatChance = rel < -20 ? 0.7 : 0.3; // hostile rivals threaten more
    var playerCities = [...new Set(this.state.properties.map(function(p){return p.cityId;}))];
    if (playerCities.length > 0 && Math.random() < threatChance) {
      var cityId = playerCities[Math.floor(Math.random() * playerCities.length)];
      var city = GameData.cities.find(function(c){return c.id === cityId;});
      if (city) {
        var threatLevel = rel < -50 ? 'furiously' : rel < -20 ? 'aggressively' : '';
        interactions.push({
          type: 'threat',
          ai: ai,
          title: ai.icon + ' ' + ai.name + ' — Market Warning',
          description: ai.name + ' are ' + (threatLevel || 'aggressively') + ' expanding in ' + city.name + '. "This city belongs to us. Sell now or face consequences."' + (rel < -30 ? ' (They look serious this time.)' : ''),
          data: { cityId: cityId, aiId: ai.name }
        });
      }
    }

    // Alliance offer: only if relationship is positive
    if (this.state.properties.length >= 3 && ai.netWorth > 100 && rel >= -10) {
      interactions.push({
        type: 'alliance',
        ai: ai,
        title: ai.icon + ' ' + ai.name + ' — Alliance Proposal',
        description: ai.name + ' propose a business alliance. Pool resources for a joint venture with shared profits.' + (rel > 30 ? ' Your strong relationship increases success odds.' : ''),
        data: { amount: Math.round(Math.min(this.state.cash * 0.2, ai.netWorth * 0.1)), aiId: ai.name }
      });
    }

    if (interactions.length === 0) return null;
    return interactions[Math.floor(Math.random() * interactions.length)];
  },

  resolveAIInteraction(action, data) {
    this.state.pendingAIInteraction = null;
    var result = { success: true, message: '' };

    // Initialize relationship tracking
    if (!this.state.aiRelationships) this.state.aiRelationships = {};
    var aiId = data.aiId || (data.ai && data.ai.name) || '';

    switch (action) {
      case 'accept_buyout': {
        var propIdx = this.state.properties.findIndex(function(p){return p.id === data.propId;});
        if (propIdx >= 0) {
          var soldPropId = this.state.properties[propIdx].id;
          this.state.cash += data.amount;
          this.state.properties.splice(propIdx, 1);
          if (this.state.mitigations) delete this.state.mitigations[soldPropId];
          this.state.totalSaleRevenue += data.amount;
          this.state.totalPropertiesSold++;
          // Accepting a deal improves relationship
          this.adjustRelationship(aiId, 10);
          result.message = 'Sold for ' + GameData.formatMoney(data.amount) + '! Relationship with ' + aiId + ' improved.';
        }
        break;
      }
      case 'reject_buyout': {
        // Rejecting a buyout slightly annoys them
        this.adjustRelationship(aiId, -5);
        result.message = 'You declined. They seem disappointed.';
        break;
      }
      case 'reject_threat': {
        // Rejecting a threat triggers REAL retaliation based on relationship
        this.adjustRelationship(aiId, -15);
        var rel = this.getRelationship(aiId);
        if (data.cityId) {
          // Price manipulation in that city
          var market = this.state.marketProperties[data.cityId] || [];
          market.forEach(function(p) { p.currentValue = Math.round(p.currentValue * 1.08); }); // prices go UP (bad for buyer)

          // If relationship is very negative, additional retaliation
          var extraMsg = '';
          if (rel < -30) {
            // Poach a tenant — one of your rented properties in that city loses its tenant
            var cityProps = this.state.properties.filter(function(p) {
              return p.cityId === data.cityId && p.isRented;
            });
            if (cityProps.length > 0) {
              var victim = cityProps[Math.floor(Math.random() * cityProps.length)];
              victim.isRented = false;
              victim.tenant = null;
              extraMsg = ' They poached your tenant from ' + victim.name + '!';
            }
          }
          if (rel < -50) {
            // Reputation damage — they spread rumors
            this.state.reputation = Math.max(0, (this.state.reputation || 50) - 3);
            extraMsg += ' They spread rumors about you (-3 reputation).';
          }
          result.message = 'You stood your ground. They drove prices up 8% in the city.' + extraMsg;
        }
        break;
      }
      case 'accept_alliance': {
        if (this.state.cash >= data.amount) {
          this.state.cash -= data.amount;
          // Alliance success improved by good relationship
          var rel = this.getRelationship(aiId);
          var successChance = 0.7 + (rel / 500); // -100 rel = 50% success, +100 rel = 90%
          if (Math.random() < successChance) {
            var profit = Math.round(data.amount * (0.3 + Math.random() * 0.5));
            this.state.cash += data.amount + profit;
            result.message = 'Alliance profitable! Earned ' + GameData.formatMoney(profit) + '.';
          } else {
            result.message = 'Alliance failed. Lost ' + GameData.formatMoney(data.amount) + '.';
          }
          this.adjustRelationship(aiId, 8);
          if (!this.state.reputation) this.state.reputation = 50;
          this.state.reputation = Math.min(100, this.state.reputation + 3);
        }
        break;
      }
      case 'decline':
        this.adjustRelationship(aiId, -3);
        result.message = 'You declined the offer.';
        break;
    }

    this.save();
    return result;
  },

  // Relationship tracking helpers
  adjustRelationship: function(aiName, delta) {
    if (!aiName) return;
    if (!this.state.aiRelationships) this.state.aiRelationships = {};
    var current = this.state.aiRelationships[aiName] || 0;
    this.state.aiRelationships[aiName] = Math.max(-100, Math.min(100, current + delta));
  },

  getRelationship: function(aiName) {
    if (!this.state.aiRelationships) return 0;
    return this.state.aiRelationships[aiName] || 0;
  },

  // ========== HISTORICAL EVENT RESOLUTION ==========

  resolveHistoricalEvent(choiceIndex) {
    var event = this.state.pendingHistoricalEvent;
    if (!event || !event.choices || !event.choices[choiceIndex]) return { success: false, message: 'No event.' };

    var choice = event.choices[choiceIndex];
    var effect = choice.effect;
    this.state.pendingHistoricalEvent = null;
    var msg = choice.label;

    switch (effect.type) {
      case 'gamble': {
        var amount = Math.round(this.state.cash * effect.amount);
        if (this.state.cash < amount) { msg = 'Not enough cash!'; break; }
        this.state.cash -= amount;
        if (Math.random() * 100 < effect.risk) {
          msg = '💸 Lost ' + GameData.formatMoney(amount) + '! The venture failed.';
        } else {
          var profit = Math.round(amount * (0.5 + Math.random()));
          this.state.cash += amount + profit;
          msg = '📈 Gained ' + GameData.formatMoney(profit) + '!';
        }
        break;
      }
      case 'city_crash': {
        (effect.cities || []).forEach(function(cid) {
          var props = GameEngine.state.properties.filter(function(p) { return p.cityId === cid; });
          var market = GameEngine.state.marketProperties[cid] || [];
          props.concat(market).forEach(function(p) {
            p.currentValue = Math.max(1, Math.round(p.currentValue * (1 + effect.value)));
          });
        });
        msg = 'Markets crashed in affected cities.';
        break;
      }
      case 'city_boost': {
        var props = this.state.properties.filter(function(p) { return p.cityId === effect.city; });
        var market = this.state.marketProperties[effect.city] || [];
        props.concat(market).forEach(function(p) {
          p.currentValue = Math.round(p.currentValue * (1 + effect.value));
        });
        msg = GameData.cities.find(function(c){return c.id===effect.city;}).name + ' property values rose ' + Math.round(effect.value*100) + '%!';
        break;
      }
      case 'city_discount': {
        // Temporarily reduce prices in a city (apply to market properties)
        var market = this.state.marketProperties[effect.city] || [];
        market.forEach(function(p) {
          p.currentValue = Math.max(1, Math.round(p.currentValue * (1 - effect.value)));
        });
        msg = 'Bargain prices in ' + (GameData.cities.find(function(c){return c.id===effect.city;}) || {name:'the city'}).name + '!';
        break;
      }
      case 'global_boost': {
        this.state.properties.forEach(function(p) {
          p.currentValue = Math.round(p.currentValue * (1 + effect.value));
        });
        msg = 'Global property values rose ' + Math.round(effect.value*100) + '%!';
        break;
      }
      case 'global_crash': {
        var all = this.state.properties.concat(Object.values(this.state.marketProperties).flat());
        all.forEach(function(p) {
          p.currentValue = Math.max(1, Math.round(p.currentValue * (1 + effect.value)));
        });
        msg = 'Global market crash: ' + Math.round(Math.abs(effect.value)*100) + '% decline!';
        break;
      }
      case 'global_discount': {
        Object.values(this.state.marketProperties).forEach(function(cityMarket) {
          cityMarket.forEach(function(p) {
            p.currentValue = Math.max(1, Math.round(p.currentValue * (1 - effect.value)));
          });
        });
        msg = 'Distressed assets available at ' + Math.round(effect.value*100) + '% discount!';
        break;
      }
      case 'reputation': {
        var cost = Math.round(this.state.cash * (effect.cost || 0));
        if (this.state.cash >= cost) {
          this.state.cash -= cost;
          if (!this.state.reputation) this.state.reputation = 50;
          this.state.reputation = Math.min(100, this.state.reputation + effect.value);
          msg = 'Reputation +' + effect.value + '! Cost: ' + GameData.formatMoney(cost);
        } else {
          msg = 'Not enough cash for this choice.';
        }
        break;
      }
      case 'none':
        msg = 'You chose to wait and see.';
        break;
    }

    this.save();
    return { success: true, message: msg };
  },

  // ========== GOAL SYSTEM ==========

  generateGoals() {
    if (!this.state.goals) this.state.goals = { monthly: null, decade: null, completed: [] };
    var g = this.state.goals;
    var nw = this.getNetWorth();
    var propCount = this.state.properties.length;
    var cityCount = new Set(this.state.properties.map(p => p.cityId)).size;
    var year = this.state.year;

    // Monthly goal — changes each month
    var monthlyGoals = [
      { id: 'buy_property', text: 'Buy a property this month', check: function(s, prev) { return s.properties.length > prev.propCount; } },
      { id: 'earn_rent', text: 'Earn ' + GameData.formatMoney(Math.round(nw * 0.01)) + ' in rent', check: function(s, prev) { return s.cash > prev.cash + nw * 0.008; } },
      { id: 'new_city', text: 'Buy in a new city', check: function(s, prev) { return new Set(s.properties.map(function(p){return p.cityId;})).size > prev.cityCount; } },
      { id: 'refurbish', text: 'Refurbish a property', check: function(s, prev) { return s.properties.some(function(p){return p.isRefurbishing;}); } },
      { id: 'rent_out', text: 'Rent out a vacant property', check: function(s, prev) { return s.properties.filter(function(p){return p.isRented;}).length > prev.rentedCount; } },
    ];
    if (!g.monthly || g.monthly.done) {
      var pick = monthlyGoals[Math.floor(Math.random() * monthlyGoals.length)];
      g.monthly = { id: pick.id, text: pick.text, done: false, reward: Math.max(1, Math.round(nw * 0.005)) };
    }
    // Snapshot for comparison next month
    g._snapshot = { propCount: propCount, cityCount: cityCount, cash: this.state.cash, rentedCount: this.state.properties.filter(function(p){return p.isRented;}).length };

    // Decade goal — changes every 10 years
    if (!g.decade || g.decade.done || (year % 10 === 0 && this.state.monthIndex === 0)) {
      var decadeEnd = Math.ceil(year / 10) * 10;
      var decadeGoals = [
        { text: 'Own properties in ' + Math.min(5, cityCount + 3) + ' cities by ' + decadeEnd, target: Math.min(5, cityCount + 3), type: 'cities' },
        { text: 'Own ' + (propCount + 5) + ' properties by ' + decadeEnd, target: propCount + 5, type: 'properties' },
        { text: 'Reach net worth ' + GameData.formatMoney(Math.round(nw * 3)) + ' by ' + decadeEnd, target: Math.round(nw * 3), type: 'networth' },
        { text: 'Rank #1 among families by ' + decadeEnd, target: 1, type: 'rank' },
      ];
      var dpick = decadeGoals[Math.floor(Math.random() * decadeGoals.length)];
      g.decade = { text: dpick.text, target: dpick.target, type: dpick.type, deadline: decadeEnd, done: false, reward: Math.max(5, Math.round(nw * 0.02)) };
    }
  },

  checkGoals() {
    if (!this.state.goals) return [];
    var g = this.state.goals;
    var achieved = [];

    // Check monthly goal
    if (g.monthly && !g.monthly.done && g._snapshot) {
      var snap = g._snapshot;
      var s = this.state;
      var met = false;
      if (g.monthly.id === 'buy_property') met = s.properties.length > snap.propCount;
      else if (g.monthly.id === 'earn_rent') met = s.cash > snap.cash + this.getNetWorth() * 0.008;
      else if (g.monthly.id === 'new_city') met = new Set(s.properties.map(function(p){return p.cityId;})).size > snap.cityCount;
      else if (g.monthly.id === 'refurbish') met = s.properties.some(function(p){return p.isRefurbishing;});
      else if (g.monthly.id === 'rent_out') met = s.properties.filter(function(p){return p.isRented;}).length > snap.rentedCount;

      if (met) {
        g.monthly.done = true;
        s.cash += g.monthly.reward;
        achieved.push({ type: 'monthly', text: g.monthly.text, reward: g.monthly.reward });
        if (!g.completed) g.completed = [];
        g.completed.push(g.monthly.text);
      }
    }

    // Check decade goal
    if (g.decade && !g.decade.done) {
      var s = this.state;
      var met = false;
      if (g.decade.type === 'cities') met = new Set(s.properties.map(function(p){return p.cityId;})).size >= g.decade.target;
      else if (g.decade.type === 'properties') met = s.properties.length >= g.decade.target;
      else if (g.decade.type === 'networth') met = this.getNetWorth() >= g.decade.target;
      else if (g.decade.type === 'rank') met = (s.playerRank || 99) <= g.decade.target;

      if (met) {
        g.decade.done = true;
        s.cash += g.decade.reward;
        if (!s.reputation) s.reputation = 50;
        s.reputation = Math.min(100, s.reputation + 10);
        achieved.push({ type: 'decade', text: g.decade.text, reward: g.decade.reward });
        if (!g.completed) g.completed = [];
        g.completed.push(g.decade.text);
      }
    }

    return achieved;
  },

  // ========== CAMPAIGN GOALS ==========

  campaignTiers: [
    {
      tier: 1, name: 'Established', icon: '🏠',
      requirements: [
        { type: 'networth', target: 100000, label: 'Net worth €100K' },
        { type: 'properties', target: 5, label: 'Own 5 properties' },
        { type: 'cities', target: 2, label: 'Invest in 2 cities' }
      ],
      rewardPct: 0.05, repBonus: 5
    },
    {
      tier: 2, name: 'Regional Power', icon: '🏘️',
      requirements: [
        { type: 'networth', target: 1000000, label: 'Net worth €1M' },
        { type: 'properties', target: 15, label: 'Own 15 properties' },
        { type: 'cities', target: 5, label: 'Invest in 5 cities' }
      ],
      rewardPct: 0.04, repBonus: 8
    },
    {
      tier: 3, name: 'National Empire', icon: '🏰',
      requirements: [
        { type: 'networth', target: 10000000, label: 'Net worth €10M' },
        { type: 'properties', target: 30, label: 'Own 30 properties' },
        { type: 'cities', target: 10, label: 'Invest in 10 cities' },
        { type: 'rank', target: 3, label: 'Reach rank #3' }
      ],
      rewardPct: 0.03, repBonus: 10
    },
    {
      tier: 4, name: 'Global Dynasty', icon: '🌍',
      requirements: [
        { type: 'networth', target: 100000000, label: 'Net worth €100M' },
        { type: 'properties', target: 50, label: 'Own 50 properties' },
        { type: 'cities', target: 15, label: 'Invest in 15 cities' },
        { type: 'rank', target: 1, label: 'Reach rank #1' }
      ],
      rewardPct: 0.02, repBonus: 12
    },
    {
      tier: 5, name: 'Legendary Estate', icon: '👑',
      requirements: [
        { type: 'networth', target: 1000000000, label: 'Net worth €1B' },
        { type: 'properties', target: 75, label: 'Own 75 properties' },
        { type: 'cities', target: 20, label: 'All 20 cities' },
        { type: 'generations', target: 3, label: '3+ generations' },
        { type: 'rank', target: 1, label: 'Rank #1' }
      ],
      rewardPct: 0.015, repBonus: 15
    }
  ],

  getCampaignProgress() {
    var s = this.state;
    var currentTier = s.campaignTier || 0;
    if (currentTier >= 5) return { completed: true, tier: 5, tierData: this.campaignTiers[4], met: [], unmet: [], metCount: 0, totalCount: 0 };

    var tierData = this.campaignTiers[currentTier];
    var nw = this.getNetWorth();
    var propCount = s.properties.length;
    var cityCount = new Set(s.properties.map(function(p) { return p.cityId; })).size;
    var rank = s.playerRank || 99;
    var gen = s.generation || 1;

    var met = [];
    var unmet = [];
    tierData.requirements.forEach(function(req) {
      var current = 0;
      if (req.type === 'networth') current = nw;
      else if (req.type === 'properties') current = propCount;
      else if (req.type === 'cities') current = cityCount;
      else if (req.type === 'rank') current = rank <= req.target ? req.target : rank;
      else if (req.type === 'generations') current = gen;

      var isMet = false;
      if (req.type === 'rank') isMet = rank <= req.target;
      else isMet = current >= req.target;

      if (isMet) met.push(req);
      else unmet.push(req);
    });

    return {
      completed: false,
      tier: currentTier + 1,
      tierData: tierData,
      met: met,
      unmet: unmet,
      metCount: met.length,
      totalCount: tierData.requirements.length
    };
  },

  checkCampaignGoals() {
    var progress = this.getCampaignProgress();
    if (progress.completed) return null;
    if (progress.unmet.length === 0) {
      // All requirements met — advance tier
      var s = this.state;
      s.campaignTier = progress.tier;
      if (!s.campaignCompleted) s.campaignCompleted = [];
      s.campaignCompleted.push(progress.tier);
      // Reward
      var nw = this.getNetWorth();
      var reward = Math.max(1000, Math.round(nw * progress.tierData.rewardPct));
      s.cash += reward;
      s.reputation = Math.min(100, (s.reputation || 50) + progress.tierData.repBonus);
      return {
        tier: progress.tier,
        name: progress.tierData.name,
        icon: progress.tierData.icon,
        reward: reward,
        repBonus: progress.tierData.repBonus,
        nextTier: progress.tier < 5 ? this.campaignTiers[progress.tier] : null
      };
    }
    return null;
  },

  // ========== PROGRESSIVE FEATURE UNLOCKING ==========

  checkFeatureUnlocks() {
    var uf = this.state.unlockedFeatures;
    if (!uf) return [];
    var newlyUnlocked = [];
    var propCount = this.state.properties.length;
    var tier = this.state.campaignTier || 0;
    var objDone = this.state.openingObjective && (this.state.openingObjective.completed || !this.state.openingObjective.active);

    if (!uf.bank && propCount >= 1) {
      uf.bank = true;
      newlyUnlocked.push({ id: 'bank', icon: '🏦', message: 'Bank Unlocked! Take a loan to buy your next property — tap the Bank tab.' });
    }
    if (!uf.businesses && tier >= 1) {
      uf.businesses = true;
      newlyUnlocked.push({ id: 'businesses', icon: '💼', message: 'Businesses Unlocked! Buy stakes in local businesses for dividends.' });
    }
    if (!uf.investments && tier >= 2) {
      uf.investments = true;
      newlyUnlocked.push({ id: 'investments', icon: '📈', message: 'Investments Unlocked! Trade stocks and bonds on the Bank screen.' });
    }
    if (!uf.aiDiplomacy && propCount >= 5) {
      uf.aiDiplomacy = true;
      newlyUnlocked.push({ id: 'aiDiplomacy', icon: '⚔️', message: 'Rival families are taking notice. Diplomacy is now active.' });
    }
    if (!uf.fullLeaderboard && (objDone || propCount >= 3)) {
      uf.fullLeaderboard = true;
      newlyUnlocked.push({ id: 'fullLeaderboard', icon: '🏆', message: 'Leaderboard expanded — see all rival families.' });
    }
    return newlyUnlocked;
  },

  // ========== CITY UNLOCKING (Challenge-based) ==========

  // ========== CITY CAMPAIGNS (sequential, one-at-a-time) ==========

  // Each city has a unique campaign with interesting mechanics — not just "have more money"
  // Player must START a campaign by clicking a locked city, then complete its objective
  // Only one campaign active at a time. Completing it unlocks the city and allows starting the next.
  cityUnlockChallenges: [
    // --- TIER 1: Learn the ropes vs weakest families ---
    { cityId: 'paris', rivalId: 'okonkwo', icon: '🗼',
      title: 'The Paris Gambit',
      challenge: 'Flip a property for profit',
      description: 'Buy a property, improve or hold it, then sell it for more than you paid.',
      setup: function(s) { s._campaignStartNW = s.totalSaleRevenue; },
      check: function(s, ge) { return s.totalSaleRevenue > (s._campaignStartNW || 0); },
      progress: function(s, ge) { var sold = s.totalSaleRevenue - (s._campaignStartNW||0); return {current: sold > 0 ? 1 : 0, target: 1, label: sold > 0 ? 'Sold for profit!' : 'Sell a property for profit'}; } },
    { cityId: 'amsterdam', rivalId: 'okonkwo', icon: '🌷',
      title: 'The Amsterdam Yield',
      challenge: 'Collect €200 rent in a single month',
      description: 'Build enough rental income that one month pays €200+.',
      check: function(s) { return (s.monthlyIncome || 0) >= 200; },
      progress: function(s, ge) { return {current: s.monthlyIncome||0, target: 200, label: '€'+(s.monthlyIncome||0)+'/€200 rent/mo'}; } },
    // --- TIER 2: Outmanoeuvre the Bourbon-Martinez ---
    { cityId: 'berlin', rivalId: 'martinez', icon: '🚪',
      title: 'The Berlin Blitz',
      challenge: 'Own 5 properties while Bourbon-Martinez own fewer',
      description: 'Build faster than your rival. Reach 5 properties while they trail behind.',
      check: function(s) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='martinez';}); return s.properties.length >= 5 && ai && s.properties.length > ai.propertyCount; },
      progress: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='martinez';}); return {current: s.properties.length, target: 5, label: s.properties.length+'/5 props (rival: '+(ai?ai.propertyCount:0)+')'}; } },
    { cityId: 'rome', rivalId: 'martinez', icon: '🏛️',
      title: 'The Roman Renovation',
      challenge: 'Refurbish 2 properties to Good or Excellent',
      description: 'Master the renovation game. Two properties must reach Good or better.',
      check: function(s) { var good = s.properties.filter(function(p){return p.condition==='good'||p.condition==='excellent';}); return good.length >= 2; },
      progress: function(s, ge) { var good = s.properties.filter(function(p){return p.condition==='good'||p.condition==='excellent';}); return {current: good.length, target: 2, label: good.length+'/2 good+ properties'}; } },
    // --- TIER 3: Take on the Petrovs ---
    { cityId: 'barcelona', rivalId: 'petrov', icon: '⛪',
      title: 'The Barcelona Boom',
      challenge: 'Earn €500 rent in a single month',
      description: 'Scale your rental empire. Monthly rent must hit €500.',
      check: function(s) { return (s.monthlyIncome || 0) >= 500; },
      progress: function(s, ge) { return {current: s.monthlyIncome||0, target: 500, label: '€'+(s.monthlyIncome||0)+'/€500 rent/mo'}; } },
    { cityId: 'toronto', rivalId: 'petrov', icon: '🗼',
      title: 'The Toronto Takeover',
      challenge: 'Surpass the Petrovs in net worth',
      description: 'The aggressive Petrovs are growing fast. Overtake them.',
      check: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='petrov';}); return ai && ge.getNetWorth() > ai.netWorth; },
      progress: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='petrov';}); var nw=ge.getNetWorth(); var t=ai?ai.netWorth:1; return {current: nw, target: t, label: '€'+GameData.formatMoneyShort(nw)+' / €'+GameData.formatMoneyShort(t)}; } },
    // --- TIER 4: Challenge the Wong Dynasty ---
    { cityId: 'los_angeles', rivalId: 'wong', icon: '🎬',
      title: 'The Hollywood Portfolio',
      challenge: 'Own properties in 3 different cities',
      description: 'Diversify beyond your home turf. Spread across three markets.',
      check: function(s) { var c = {}; s.properties.forEach(function(p){c[p.cityId]=1;}); return Object.keys(c).length >= 3; },
      progress: function(s, ge) { var c = {}; s.properties.forEach(function(p){c[p.cityId]=1;}); var n=Object.keys(c).length; return {current: n, target: 3, label: n+'/3 cities'}; } },
    { cityId: 'miami', rivalId: 'wong', icon: '🌴',
      title: 'The Miami Cash Machine',
      challenge: 'Reach €2,000 monthly rental income',
      description: 'Build a rent machine. €2K/month flowing in every single month.',
      check: function(s) { return (s.monthlyIncome || 0) >= 2000; },
      progress: function(s, ge) { return {current: s.monthlyIncome||0, target: 2000, label: '€'+(s.monthlyIncome||0)+'/€2,000 rent/mo'}; } },
    { cityId: 'sydney', rivalId: 'wong', icon: '🎭',
      title: 'The Sydney Showdown',
      challenge: 'Surpass the Wong Dynasty in net worth',
      description: 'The Wongs are formidable traders. Outgrow them.',
      check: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='wong';}); return ai && ge.getNetWorth() > ai.netWorth; },
      progress: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='wong';}); var nw=ge.getNetWorth(); var t=ai?ai.netWorth:1; return {current: nw, target: t, label: '€'+GameData.formatMoneyShort(nw)+' / €'+GameData.formatMoneyShort(t)}; } },
    // --- TIER 5: Rothschilds ---
    { cityId: 'new_york', rivalId: 'rothschild', icon: '🗽',
      title: 'The New York Ascent',
      challenge: 'Reach a portfolio of 20 properties',
      description: 'Build a true empire. 20 properties across your markets.',
      check: function(s) { return s.properties.length >= 20; },
      progress: function(s) { return {current: s.properties.length, target: 20, label: s.properties.length+'/20 properties'}; } },
    { cityId: 'singapore', rivalId: 'rothschild', icon: '🦁',
      title: 'The Singapore Strategy',
      challenge: 'Surpass the Rothschilds in net worth',
      description: 'The ultimate rivalry. Dethrone the banking dynasty.',
      check: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='rothschild';}); return ai && ge.getNetWorth() > ai.netWorth; },
      progress: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='rothschild';}); var nw=ge.getNetWorth(); var t=ai?ai.netWorth:1; return {current: nw, target: t, label: '€'+GameData.formatMoneyShort(nw)+' / €'+GameData.formatMoneyShort(t)}; } },
    // --- TIER 6: Al-Rashids (richest) ---
    { cityId: 'dubai', rivalId: 'al_rashid', icon: '🏗️',
      title: 'The Dubai Fortune',
      challenge: 'Reach €500K net worth',
      description: 'Build serious wealth. Half a million in total assets.',
      check: function(s, ge) { return ge.getNetWorth() >= 500000; },
      progress: function(s, ge) { var nw=ge.getNetWorth(); return {current: nw, target: 500000, label: '€'+GameData.formatMoneyShort(nw)+'/€500K'}; } },
    { cityId: 'tokyo', rivalId: 'al_rashid', icon: '⛩️',
      title: 'The Tokyo Tycoon',
      challenge: 'Surpass the Al-Rashids in net worth',
      description: 'The wealthiest family in the game. Beat their fortune.',
      check: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='al_rashid';}); return ai && ge.getNetWorth() > ai.netWorth; },
      progress: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='al_rashid';}); var nw=ge.getNetWorth(); var t=ai?ai.netWorth:1; return {current: nw, target: t, label: '€'+GameData.formatMoneyShort(nw)+' / €'+GameData.formatMoneyShort(t)}; } },
    // --- TIER 7: Domination ---
    { cityId: 'mumbai', rivalId: 'petrov', icon: '🕌',
      title: 'The Mumbai Monopoly',
      challenge: 'Own 5+ properties in a single city',
      description: 'Dominate one market completely. Stack 5 properties in one city.',
      check: function(s) { var c = {}; s.properties.forEach(function(p){c[p.cityId]=(c[p.cityId]||0)+1;}); return Object.values(c).some(function(v){return v>=5;}); },
      progress: function(s) { var c = {}; s.properties.forEach(function(p){c[p.cityId]=(c[p.cityId]||0)+1;}); var max=Math.max.apply(null,Object.values(c).concat([0])); return {current: max, target: 5, label: max+'/5 in one city'}; } },
    { cityId: 'shanghai', rivalId: 'wong', icon: '🏯',
      title: 'The Shanghai Surge',
      challenge: 'Reach €5,000 monthly rental income',
      description: 'Industrial-scale rent collection. €5K every month.',
      check: function(s) { return (s.monthlyIncome || 0) >= 5000; },
      progress: function(s) { return {current: s.monthlyIncome||0, target: 5000, label: '€'+(s.monthlyIncome||0)+'/€5,000 rent/mo'}; } },
    { cityId: 'hong_kong', rivalId: 'rothschild', icon: '🌉',
      title: 'The Hong Kong Crown',
      challenge: 'Have 2x the Rothschilds\' net worth',
      description: 'Don\'t just beat them — crush them. Double their entire fortune.',
      check: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='rothschild';}); return ai && ge.getNetWorth() > ai.netWorth * 2; },
      progress: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='rothschild';}); var nw=ge.getNetWorth(); var t=ai?ai.netWorth*2:1; return {current: nw, target: t, label: '€'+GameData.formatMoneyShort(nw)+' / €'+GameData.formatMoneyShort(t)}; } },
    { cityId: 'cape_town', rivalId: 'al_rashid', icon: '⛰️',
      title: 'The Cape Town Conquest',
      challenge: 'Have 2x the Al-Rashids\' net worth',
      description: 'Double the fortune of the richest dynasty.',
      check: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='al_rashid';}); return ai && ge.getNetWorth() > ai.netWorth * 2; },
      progress: function(s, ge) { var ai = (s.aiFamilies||[]).find(function(a){return a.id==='al_rashid';}); var nw=ge.getNetWorth(); var t=ai?ai.netWorth*2:1; return {current: nw, target: t, label: '€'+GameData.formatMoneyShort(nw)+' / €'+GameData.formatMoneyShort(t)}; } },
    { cityId: 'sao_paulo', icon: '🎨',
      title: 'The São Paulo Empire',
      challenge: 'Own properties in 10+ cities',
      description: 'A truly global empire. Properties on every continent.',
      check: function(s) { var c = {}; s.properties.forEach(function(p){c[p.cityId]=1;}); return Object.keys(c).length >= 10; },
      progress: function(s) { var c = {}; s.properties.forEach(function(p){c[p.cityId]=1;}); var n=Object.keys(c).length; return {current: n, target: 10, label: n+'/10 cities'}; } },
    { cityId: 'monaco', icon: '🎰',
      title: 'The Monaco Coronation',
      challenge: 'Reach Rank #1 on the leaderboard',
      description: 'The final challenge. Be the wealthiest dynasty in the world.',
      check: function(s) { return (s.playerRank || 99) <= 1; } }
  ],

  // Get city unlock campaign readiness (0-1) and label for a locked city
  getCityUnlockProgress(cityId) {
    var ch = this.cityUnlockChallenges.find(function(c) { return c.cityId === cityId; });
    if (!ch || !ch.progress) return { progress: 0, label: 'Locked', color: '#888' };
    var info = ch.progress(this.state, this);
    var p = info.target > 0 ? Math.min(1, info.current / info.target) : 0;
    var label, color;
    if (p >= 0.75) { label = 'Ready'; color = '#2A9D8F'; }
    else if (p >= 0.4) { label = 'Getting Close'; color = '#D4A84B'; }
    else if (p >= 0.15) { label = 'Not Yet'; color = '#E67E22'; }
    else { label = 'Too Early'; color = '#E63946'; }
    return { progress: p, label: label, color: color, info: info };
  },

  isCityUnlocked(cityId) {
    if (!this.state.unlockedCities) return true;
    return this.state.unlockedCities.indexOf(cityId) >= 0;
  },

  unlockCity(cityId) {
    if (!this.state.unlockedCities) this.state.unlockedCities = ['london'];
    if (this.state.unlockedCities.indexOf(cityId) < 0) {
      this.state.unlockedCities.push(cityId);
    }
  },

  // Start a campaign to unlock a specific city
  startCityCampaign(cityId) {
    if (this.isCityUnlocked(cityId)) return null;
    if (this.state.activeCampaign) return null; // one at a time

    var ch = this.cityUnlockChallenges.find(function(c) { return c.cityId === cityId; });
    if (!ch) return null;

    this.state.activeCampaign = {
      cityId: cityId,
      startMonth: this.state.month,
      startNW: this.getNetWorth()
    };
    // Run any setup function the campaign defines
    if (ch.setup) ch.setup(this.state);
    this.save();
    return ch;
  },

  // Cancel active campaign (player can switch)
  cancelCityCampaign() {
    this.state.activeCampaign = null;
    this.save();
  },

  // Check ONLY the active campaign — not all challenges
  checkCityUnlocks() {
    var camp = this.state.activeCampaign;
    if (!camp) return [];

    var ch = this.cityUnlockChallenges.find(function(c) { return c.cityId === camp.cityId; });
    if (!ch) return [];

    if (ch.check(this.state, this)) {
      // Campaign won — unlock the city
      this.unlockCity(camp.cityId);
      this.state.activeCampaign = null;
      var city = GameData.cities.find(function(c) { return c.id === camp.cityId; });
      this.save();
      return [{
        cityId: camp.cityId,
        cityName: city ? city.name : camp.cityId,
        cityFlag: city ? city.flag : '🌍',
        challenge: ch.challenge,
        title: ch.title,
        icon: ch.icon
      }];
    }
    return [];
  },

  getActiveCampaign() {
    var camp = this.state.activeCampaign;
    if (!camp) return null;
    var ch = this.cityUnlockChallenges.find(function(c) { return c.cityId === camp.cityId; });
    if (!ch) return null;
    var city = GameData.cities.find(function(c) { return c.id === camp.cityId; });
    var prog = ch.progress ? ch.progress(this.state, this) : null;
    return {
      cityId: camp.cityId,
      cityName: city ? city.name : camp.cityId,
      cityFlag: city ? city.flag : '🌍',
      title: ch.title,
      challenge: ch.challenge,
      description: ch.description,
      rivalId: ch.rivalId,
      icon: ch.icon,
      monthsActive: this.state.month - camp.startMonth,
      progress: prog
    };
  },

  getLockedCities() {
    var self = this;
    return GameData.cities.filter(function(c) { return !self.isCityUnlocked(c.id); });
  },

  getUnlockedCities() {
    var self = this;
    return GameData.cities.filter(function(c) { return self.isCityUnlocked(c.id); });
  },

  // ========== OPENING OBJECTIVE ==========

  checkOpeningObjective() {
    var obj = this.state.openingObjective;
    if (!obj || !obj.active) return null;

    // Count London properties only — the opening is about establishing in London
    var propCount = this.state.properties.filter(function(p) { return p.cityId === 'london'; }).length;
    var rival = this.state.aiFamilies ? this.state.aiFamilies.find(function(ai) { return ai.id === obj.rivalId; }) : null;
    var playerNW = this.getNetWorth();
    var rivalNW = rival ? rival.netWorth : 0;

    // Check completion: 3 properties AND net worth > rival
    var propsOk = propCount >= obj.targetProperties;
    var rivalOk = playerNW > rivalNW;

    if (propsOk && rivalOk) {
      obj.active = false;
      obj.completed = true;
      // Reward: bonus cash
      var reward = Math.max(500, Math.round(playerNW * 0.1));
      this.state.cash += reward;
      this.state.reputation = Math.min(100, (this.state.reputation || 50) + 5);
      // Cities now unlock via individual challenges (checked in advanceMonth)
      return {
        type: 'completed',
        reward: reward
      };
    }

    // Count down
    obj.monthsLeft--;
    if (obj.monthsLeft <= 0) {
      // Time's up — meaningful consequences but not game-ending
      obj.active = false;
      obj.failed = true;
      // Reputation hit — you failed your first public challenge
      this.state.reputation = Math.max(0, (this.state.reputation || 50) - 10);
      // Rival gets a boost — they capitalize on your weakness
      var failRival = this.state.aiFamilies ? this.state.aiFamilies.find(function(ai) { return ai.id === obj.rivalId; }) : null;
      if (failRival) {
        failRival.netWorth = Math.round(failRival.netWorth * 1.2);
        failRival.monthlyIncome = Math.round(failRival.monthlyIncome * 1.15);
      }
      return {
        type: 'expired',
        repLoss: 10,
        rivalBoost: failRival ? failRival.name : null
      };
    }

    return null;
  },

  getOpeningObjectiveProgress() {
    var obj = this.state.openingObjective;
    if (!obj || !obj.active) return null;

    var propCount = this.state.properties.filter(function(p) { return p.cityId === 'london'; }).length;
    var rival = this.state.aiFamilies ? this.state.aiFamilies.find(function(ai) { return ai.id === obj.rivalId; }) : null;
    var playerNW = this.getNetWorth();
    var rivalNW = rival ? rival.netWorth : 0;

    return {
      monthsLeft: obj.monthsLeft,
      properties: propCount,
      targetProperties: obj.targetProperties,
      playerNW: playerNW,
      rivalNW: rivalNW,
      rivalName: rival ? rival.name : 'The Rothschilds',
      rivalIcon: rival ? rival.icon : '🏛️',
      propsComplete: propCount >= obj.targetProperties,
      rivalComplete: playerNW > rivalNW
    };
  },

  // ========== DECISION SYSTEM ==========

  generateDecision() {
    // 20% chance of a decision each month — less intrusive
    if (Math.random() > 0.2) return null;

    var s = this.state;
    if (!s.properties) return null;
    var decisions = [];
    var nw = this.getNetWorth();
    var cash = s.cash;
    var props = s.properties;
    var cycle = s.economicCycle || 'growth';

    // ---- PORTFOLIO-LINKED DECISIONS (emerge from what the player owns) ----

    // LOAN NUDGE: Player has 1 property but can't afford another — teach them to use the bank
    var loans = s.loans || [];
    if (props.length >= 1 && props.length < 3 && loans.length === 0 && cash < 6500 && s.unlockedFeatures && s.unlockedFeatures.bank) {
      var loanNW = this.getNetWorth();
      var suggestedLoan = Math.round(loanNW * 0.5);
      decisions.push({
        type: 'loan_nudge',
        title: '🏦 Your Banker Calls',
        description: 'With ' + GameData.formatMoney(cash) + ' in cash, you can\'t afford another property. But your portfolio is worth ' + GameData.formatMoney(loanNW) + '. A loan of ' + GameData.formatMoney(suggestedLoan) + ' would let you expand. Visit the Bank tab to explore loan offers.',
        choices: [
          { label: 'Open Bank', action: 'open_bank' },
          { label: 'Not yet', action: 'pass' }
        ]
      });
    }

    // DERELICT OPPORTUNITY: Player owns a poor/derelict property — neighbor wants to sell adjacent lot cheap
    var derelicts = props.filter(function(p) { return p.condition === 'derelict' || p.condition === 'poor'; });
    if (derelicts.length > 0) {
      var dp = derelicts[Math.floor(Math.random() * derelicts.length)];
      var city = GameData.cities.find(function(c) { return c.id === dp.cityId; });
      var refurbCost = Math.round(dp.currentValue * 0.15);
      decisions.push({
        type: 'derelict_dilemma',
        title: '🏚️ Your ' + dp.name + ' Is Crumbling',
        description: 'Neighbors are complaining about your ' + dp.condition + ' ' + dp.name + ' in ' + (city ? city.name : 'the city') + '. The council threatens a fine. Emergency patch it now or risk a penalty next month.',
        choices: [
          { label: 'Emergency repair (' + GameData.formatMoney(refurbCost) + ')', action: 'emergency_repair', data: { propId: dp.id, cost: refurbCost } },
          { label: 'Ignore the warning (30% chance of fine)', action: 'ignore_derelict', data: { propId: dp.id, fine: Math.round(dp.currentValue * 0.08) } }
        ]
      });
    }

    // TENANT CRISIS: A rented property's tenant is causing problems
    var rentedProps = props.filter(function(p) { return p.isRented && p.tenant; });
    if (rentedProps.length > 0) {
      var tp = rentedProps[Math.floor(Math.random() * rentedProps.length)];
      var tCity = GameData.cities.find(function(c) { return c.id === tp.cityId; });
      var tenantIcon = tp.tenant.icon || '👤';
      var monthlyR = tp.monthlyRent || 0;
      if (tp.tenant.reliability < 0.85) {
        decisions.push({
          type: 'tenant_trouble',
          title: tenantIcon + ' Tenant Trouble at ' + tp.name,
          description: 'Your ' + (tp.tenant.type || 'tenant') + ' tenant in ' + (tCity ? tCity.name : 'the city') + ' has been late on rent 3 times. Evict them (lose 2 months rent) or renegotiate at -20% rent to keep them?',
          choices: [
            { label: 'Evict tenant (vacant for 2 months)', action: 'evict_tenant', data: { propId: tp.id, lostRent: monthlyR * 2 } },
            { label: 'Renegotiate at -20% rent', action: 'renegotiate_rent', data: { propId: tp.id, newMult: 0.8 } }
          ]
        });
      } else if (tp.tenant.monthsOccupied > 24 && !tp._tenantUpgraded && Math.random() < 0.3) {
        // Long-term tenant wants improvement — only once per property, 30% chance
        var upgradeCost = Math.round(monthlyR * 3);
        decisions.push({
          type: 'tenant_upgrade',
          title: tenantIcon + ' Tenant Request at ' + tp.name,
          description: 'Your loyal ' + (tp.tenant.type || '') + ' tenant in ' + (tCity ? tCity.name : 'the city') + ' (' + tp.tenant.monthsOccupied + ' months) asks for improvements. Invest ' + GameData.formatMoney(upgradeCost) + ' to keep them happy, or they may leave.',
          choices: [
            { label: 'Invest ' + GameData.formatMoney(upgradeCost) + ' (tenant stays, +10% rent)', action: 'upgrade_for_tenant', data: { propId: tp.id, cost: upgradeCost } },
            { label: 'Decline (15% chance tenant leaves)', action: 'decline_upgrade', data: { propId: tp.id } }
          ]
        });
      }
    }

    // CITY DOMINANCE: Player owns 3+ properties in one city — monopoly opportunity
    var cityCount = {};
    props.forEach(function(p) { cityCount[p.cityId] = (cityCount[p.cityId] || 0) + 1; });
    var dominantCities = Object.keys(cityCount).filter(function(cid) { return cityCount[cid] >= 3; });
    if (dominantCities.length > 0) {
      var dcId = dominantCities[Math.floor(Math.random() * dominantCities.length)];
      var dc = GameData.cities.find(function(c) { return c.id === dcId; });
      var boostCost = Math.round(nw * 0.03);
      if (dc) {
        decisions.push({
          type: 'city_dominance',
          title: '🏘️ Market Influence in ' + dc.name,
          description: 'You own ' + cityCount[dcId] + ' properties in ' + dc.name + '. A local developer offers a partnership: invest ' + GameData.formatMoney(boostCost) + ' to redevelop the district. All your properties here would appreciate +5%.',
          choices: [
            { label: 'Invest ' + GameData.formatMoney(boostCost) + ' (all ' + dc.name + ' properties +5%)', action: 'city_invest', data: { cityId: dcId, cost: boostCost } },
            { label: 'Not interested', action: 'pass' }
          ]
        });
      }
    }

    // DEBT PRESSURE: Player has loans and cash is tight
    var loans = s.loans || [];
    var monthlyDebt = loans.reduce(function(sum, l) { return sum + (l.monthlyPayment || 0); }, 0);
    if (monthlyDebt > 0 && cash < monthlyDebt * 3) {
      var worstProp = props.slice().sort(function(a, b) { return a.currentValue - b.currentValue; })[0];
      if (worstProp) {
        var saleValue = Math.round(worstProp.currentValue * 0.85);
        decisions.push({
          type: 'debt_pressure',
          title: '💳 Cash Flow Crisis',
          description: 'Loan payments of ' + GameData.formatMoney(monthlyDebt) + '/month are squeezing you. Only ' + GameData.formatMoney(cash) + ' cash left. Consider a fire-sale of ' + worstProp.name + ' for ' + GameData.formatMoney(saleValue) + ' (15% below market).',
          choices: [
            { label: 'Fire-sale ' + worstProp.name + ' (+' + GameData.formatMoney(saleValue) + ')', action: 'accept_sell', data: { propId: worstProp.id, amount: saleValue } },
            { label: 'Hold tight, ride it out', action: 'pass' }
          ]
        });
      }
    }

    // RECESSION OPPORTUNITY: Market is in recession/depression and player has cash
    if ((cycle === 'recession' || cycle === 'depression') && cash > 1000) {
      var cheapCityId = null; var cheapProp = null;
      var cityIds = Object.keys(s.marketProperties);
      for (var i = 0; i < cityIds.length; i++) {
        var mkt = s.marketProperties[cityIds[i]] || [];
        if (mkt.length > 0 && this.isCityUnlocked(cityIds[i])) {
          var cheapest = mkt.reduce(function(a, b) { return a.currentValue < b.currentValue ? a : b; });
          if (!cheapProp || cheapest.currentValue < cheapProp.currentValue) {
            cheapProp = cheapest; cheapCityId = cityIds[i];
          }
        }
      }
      if (cheapProp && cheapProp.currentValue < cash * 0.8) {
        var cheapCity = GameData.cities.find(function(c) { return c.id === cheapCityId; });
        decisions.push({
          type: 'recession_buy',
          title: '📉 ' + (cycle === 'depression' ? 'Depression' : 'Recession') + ' Bargain',
          description: 'Markets are down. ' + cheapProp.name + ' in ' + (cheapCity ? cheapCity.name : 'the city') + ' is going for ' + GameData.formatMoney(cheapProp.currentValue) + ' — well below historical value. Buy the dip?',
          choices: [
            { label: 'Buy it now', action: 'outbid', data: { propId: cheapProp.id, cityId: cheapCityId, cost: cheapProp.currentValue } },
            { label: 'Wait for lower prices', action: 'pass' }
          ]
        });
      }
    }

    // VACANT PROPERTY: Player has unrented property — someone wants to rent at a premium
    var vacantProps = props.filter(function(p) { return !p.isRented && !p.isRefurbishing && !p.isBuilding && p.condition !== 'derelict'; });
    if (vacantProps.length > 0) {
      var vp = vacantProps[Math.floor(Math.random() * vacantProps.length)];
      var vCity = GameData.cities.find(function(c) { return c.id === vp.cityId; });
      var premiumRent = Math.round((vp.monthlyRent || Math.round(vp.currentValue * 0.08 / 12)) * 1.3);
      decisions.push({
        type: 'premium_tenant',
        title: '🔑 Premium Tenant for ' + vp.name,
        description: 'A corporate client offers to rent your vacant ' + vp.name + ' in ' + (vCity ? vCity.name : 'the city') + ' at ' + GameData.formatMoney(premiumRent) + '/mo (30% above market) — but demands a 12-month lease with no eviction.',
        choices: [
          { label: 'Accept premium lease', action: 'premium_lease', data: { propId: vp.id, rent: premiumRent } },
          { label: 'Wait for normal tenant', action: 'pass' }
        ]
      });
    }

    // TRAIT-LINKED: City trait creates a unique decision
    if (props.length > 0) {
      var traitProp = props[Math.floor(Math.random() * props.length)];
      var traitCity = GameData.cities.find(function(c) { return c.id === traitProp.cityId; });
      if (traitCity && traitCity.trait === 'boom_bust' && Math.random() < 0.4) {
        var flipGain = Math.round(traitProp.currentValue * 0.15);
        decisions.push({
          type: 'speculate',
          title: '📈 Speculation Frenzy in ' + traitCity.name,
          description: traitCity.name + '\'s volatile market is surging. A speculator offers ' + GameData.formatMoney(traitProp.currentValue + flipGain) + ' for your ' + traitProp.name + ' — ' + GameData.formatMoney(flipGain) + ' above market. But prices could keep rising...',
          choices: [
            { label: 'Cash out now (+' + GameData.formatMoney(flipGain) + ' profit)', action: 'accept_sell', data: { propId: traitProp.id, amount: traitProp.currentValue + flipGain } },
            { label: 'Hold — bet on more upside', action: 'pass' }
          ]
        });
      } else if (traitCity && traitCity.trait === 'redevelopment' && (traitProp.condition === 'poor' || traitProp.condition === 'fair') && Math.random() < 0.3) {
        var grantAmt = Math.round(traitProp.currentValue * 0.12);
        decisions.push({
          type: 'redevelopment_grant',
          title: '🏗️ Government Grant in ' + traitCity.name,
          description: traitCity.name + '\'s redevelopment zone is offering grants. Your ' + traitProp.condition + ' ' + traitProp.name + ' qualifies for ' + GameData.formatMoney(grantAmt) + ' toward renovation — but you must begin refurbishment this month.',
          choices: [
            { label: 'Accept grant (+' + GameData.formatMoney(grantAmt) + ', must refurbish)', action: 'accept_grant', data: { propId: traitProp.id, grant: grantAmt } },
            { label: 'Pass on the grant', action: 'pass' }
          ]
        });
      } else if (traitCity && traitCity.trait === 'crime_pressure' && Math.random() < 0.3) {
        var protCost = Math.round(traitProp.currentValue * 0.02);
        decisions.push({
          type: 'security_shakedown',
          title: '🔓 Security Concern in ' + traitCity.name,
          description: 'Break-ins have spiked near your ' + traitProp.name + ' in ' + traitCity.name + '. A security firm offers protection for ' + GameData.formatMoney(protCost) + '. Unprotected properties face higher crime risk this quarter.',
          choices: [
            { label: 'Hire security (' + GameData.formatMoney(protCost) + ')', action: 'hire_security', data: { propId: traitProp.id, cost: protCost } },
            { label: 'Take the risk', action: 'pass' }
          ]
        });
      }
    }

    // ---- SELECTION: Filter out unaffordable decisions ----
    var currentCash = this.state.cash;
    decisions = decisions.filter(function(d) {
      if (!d.choices || !d.choices[0] || !d.choices[0].data) return true;
      var cost = d.choices[0].data.cost || d.choices[0].data.amount || 0;
      if (cost > 0 && cost > currentCash) {
        console.log('[ENGINE] Filtered unaffordable decision: ' + d.type + ' cost=€' + cost + ' cash=€' + currentCash);
        return false;
      }
      return true;
    });
    if (decisions.length === 0) return null;

    var chosen = decisions[Math.floor(Math.random() * decisions.length)];

    // Manager auto-decision: if a manager covers this property's city, handle it automatically
    var autoResult = this.tryManagerAutoDecision(chosen);
    if (autoResult) {
      // Manager handled it — don't show to player, return auto-result for toast
      this._log('decision', 'manager_auto', 0, chosen.type + ': ' + autoResult);
      return { _managerHandled: true, message: autoResult };
    }

    // Log the decision shown to the player (for recording analysis)
    var decCost = (chosen.choices && chosen.choices[0] && chosen.choices[0].data) ? (chosen.choices[0].data.cost || chosen.choices[0].data.amount || 0) : 0;
    this._log('decision', 'shown', -decCost, chosen.type + ': ' + chosen.title + ' | ' + (chosen.choices[0] ? chosen.choices[0].label : '') + ' | cash=' + Math.round(this.state.cash));

    this.state.pendingDecision = chosen;
    return chosen;
  },

  // Manager auto-handles decisions for properties in managed cities
  tryManagerAutoDecision(decision) {
    if (!decision || !this.state.managers) return null;

    // Find which city this decision relates to
    var propId = decision.choices && decision.choices[0] && decision.choices[0].data ? decision.choices[0].data.propId : null;
    var cityId = decision.choices && decision.choices[0] && decision.choices[0].data ? decision.choices[0].data.cityId : null;
    if (propId && !cityId) {
      var prop = this.state.properties.find(function(p) { return p.id === propId; });
      if (prop) cityId = prop.cityId;
    }
    if (!cityId) return null;

    var mgr = this.state.managers[cityId];
    if (!mgr) return null;
    var mgrSettings = mgr.settings || { autoRent: true, autoRefurb: true, autoMitigation: true, autoDecisions: true };
    if (!mgrSettings.autoDecisions) return null;

    var type = decision.type;
    var data = decision.choices[0] ? decision.choices[0].data : {};

    // Investment opportunities (city_dominance, redevelopment_grant)
    if (type === 'city_dominance' && data.cost && this.state.cash >= data.cost) {
      var result = this.resolveDecision('city_invest', data);
      return mgr.icon + ' ' + mgr.name + ' invested ' + GameData.formatMoney(data.cost) + ' in district redevelopment (+5%)';
    }
    if (type === 'redevelopment_grant') {
      var result = this.resolveDecision('accept_grant', data);
      return mgr.icon + ' ' + mgr.name + ' accepted redevelopment grant of ' + GameData.formatMoney(data.grant);
    }

    // Tenant decisions
    if (type === 'tenant_upgrade' && data.cost && this.state.cash >= data.cost) {
      var result = this.resolveDecision('upgrade_for_tenant', data);
      return mgr.icon + ' ' + mgr.name + ' upgraded property for tenant (+10% value)';
    }
    if (type === 'tenant_trouble') {
      // Good managers renegotiate, bad ones evict
      if (mgr.quality >= 0.7) {
        var result = this.resolveDecision('renegotiate_rent', data);
        return mgr.icon + ' ' + mgr.name + ' renegotiated rent with difficult tenant';
      } else {
        var result = this.resolveDecision('evict_tenant', data);
        return mgr.icon + ' ' + mgr.name + ' evicted problematic tenant';
      }
    }

    // Emergency repairs (derelict_dilemma)
    if (type === 'derelict_dilemma' && data.cost && this.state.cash >= data.cost) {
      var result = this.resolveDecision('emergency_repair', data);
      return mgr.icon + ' ' + mgr.name + ' ordered emergency repairs (' + GameData.formatMoney(data.cost) + ')';
    }
    if (type === 'security_shakedown' && data.cost && this.state.cash >= data.cost) {
      var result = this.resolveDecision('hire_security', data);
      return mgr.icon + ' ' + mgr.name + ' hired security for your property';
    }

    return null; // Manager can't handle this decision type
  },

  resolveDecision(choiceAction, choiceData) {
    var decision = this.state.pendingDecision;
    if (!decision) return { success: false, message: 'No pending decision.' };

    this._log('decision', 'resolved', 0, choiceAction + ' | ' + (decision ? decision.type : 'unknown'));
    this.state.pendingDecision = null;
    var result = { success: true, message: '' };

    switch (choiceAction) {
      case 'outbid': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash < d.cost) {
          result.message = 'Not enough cash to outbid!';
          result.success = false;
        } else {
          // Force-buy at premium price — pass offer percentage so buyProperty uses the premium
          var prop = (this.state.marketProperties[d.cityId] || []).find(function(p) { return p.id === d.propId; });
          var offerPct = prop ? d.cost / prop.currentValue : 1.0;
          var buyResult = this.buyProperty(d.propId, d.cityId, offerPct);
          if (buyResult.success) {
            result.message = 'You outbid the rival! ' + buyResult.message;
          } else {
            result.message = 'Bid failed: ' + buyResult.message;
            result.success = false;
          }
        }
        break;
      }
      case 'invest': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash < d.amount) {
          result.message = 'Not enough cash!';
          result.success = false;
        } else {
          this.state.cash -= d.amount;
          // Resolve: risk% chance of losing it all, otherwise get return%
          if (Math.random() * 100 < d.riskPct) {
            result.message = '💸 The venture failed! You lost ' + GameData.formatMoney(d.amount) + '.';
          } else {
            var profit = Math.round(d.amount * d.returnPct / 100);
            this.state.cash += d.amount + profit;
            result.message = '📈 The venture succeeded! Profit: ' + GameData.formatMoney(profit) + '.';
          }
        }
        break;
      }
      case 'accept_sell': {
        var d = choiceData || decision.choices[0].data;
        var propIdx = this.state.properties.findIndex(p => p.id === d.propId);
        if (propIdx >= 0) {
          var propId = this.state.properties[propIdx].id;
          this.state.properties.splice(propIdx, 1);
          // Clean up mitigations for sold property
          if (this.state.mitigations) delete this.state.mitigations[propId];
          this.state.cash += d.amount;
          this.state.totalSaleRevenue += d.amount;
          this.state.totalPropertiesSold++;
          result.message = 'Property sold for ' + GameData.formatMoney(d.amount) + '!';
        }
        break;
      }
      case 'emergency_repair': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash >= d.cost) {
          this.state.cash -= d.cost;
          var prop = this.state.properties.find(function(p) { return p.id === d.propId; });
          if (prop) {
            var cl = GameData.conditions[prop.condition] ? GameData.conditions[prop.condition].level : 0;
            prop.condition = GameData.conditionOrder[Math.min(4, cl + 1)];
            this.recalculateRent(prop);
          }
          result.message = '🔧 Emergency repair complete. Condition improved!';
        } else { result.message = 'Not enough cash.'; result.success = false; }
        break;
      }
      case 'ignore_derelict': {
        var d = choiceData || decision.choices[0].data;
        if (Math.random() < 0.3) {
          this.state.cash -= Math.min(d.fine, this.state.cash);
          result.message = '📋 Council fined you ' + GameData.formatMoney(d.fine) + ' for the property condition!';
        } else {
          result.message = 'No fine this time — but the property is still deteriorating.';
        }
        break;
      }
      case 'evict_tenant': {
        var d = choiceData || decision.choices[0].data;
        var prop = this.state.properties.find(function(p) { return p.id === d.propId; });
        if (prop) { prop.isRented = false; prop.tenant = null; }
        result.message = 'Tenant evicted. Property vacant — find a new tenant.';
        break;
      }
      case 'renegotiate_rent': {
        var d = choiceData || decision.choices[0].data;
        var prop = this.state.properties.find(function(p) { return p.id === d.propId; });
        if (prop) { prop.rentMultiplier = d.newMult; }
        result.message = 'Rent renegotiated at -20%. Tenant stays for now.';
        break;
      }
      case 'upgrade_for_tenant': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash >= d.cost) {
          this.state.cash -= d.cost;
          var prop = this.state.properties.find(function(p) { return p.id === d.propId; });
          if (prop) {
            // Improvement adds 10% to property value — rent follows naturally
            prop.currentValue = Math.round(prop.currentValue * 1.10);
            prop._tenantUpgraded = true; // prevent repeat decisions
            this.recalculateRent(prop);
          }
          result.message = '🏠 Improvements made! Property value and rent increased by 10%.';
        } else { result.message = 'Not enough cash.'; result.success = false; }
        break;
      }
      case 'decline_upgrade': {
        var d = choiceData || decision.choices[0].data;
        if (Math.random() < 0.15) {
          var prop = this.state.properties.find(function(p) { return p.id === d.propId; });
          if (prop) { prop.isRented = false; prop.tenant = null; }
          result.message = '😔 Tenant left due to unaddressed complaints.';
        } else {
          result.message = 'Tenant grumbles but stays — for now.';
        }
        break;
      }
      case 'city_invest': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash >= d.cost) {
          this.state.cash -= d.cost;
          var self = this;
          this.state.properties.forEach(function(p) {
            if (p.cityId === d.cityId) {
              p.currentValue = Math.round(p.currentValue * 1.05);
              self.recalculateRent(p);
            }
          });
          result.message = '🏘️ District redevelopment complete! All properties in the area appreciated +5%.';
        } else { result.message = 'Not enough cash.'; result.success = false; }
        break;
      }
      case 'premium_lease': {
        var d = choiceData || decision.choices[0].data;
        var prop = this.state.properties.find(function(p) { return p.id === d.propId; });
        if (prop) {
          prop.isRented = true;
          prop.tenant = GameData.assignTenant(prop);
          if (prop.tenant) { prop.tenant.type = 'corporate'; prop.tenant.icon = '🏢'; prop.tenant.reliability = 0.96; prop.tenant.care = 0.90; }
          prop.rentMultiplier = 1.0;
          // Lock in premium rent — survives recalculateRent() calls
          prop.premiumRent = d.rent;
          prop.monthlyRent = d.rent;
        }
        result.message = '🔑 Premium corporate lease signed! ' + GameData.formatMoney(d.rent) + '/month guaranteed.';
        break;
      }
      case 'accept_grant': {
        var d = choiceData || decision.choices[0].data;
        this.state.cash += d.grant;
        // Auto-start standard refurbishment
        var prop = this.state.properties.find(function(p) { return p.id === d.propId; });
        if (prop && !prop.isRefurbishing) {
          var refResult = this.refurbishProperty(d.propId, 'standard');
          if (refResult.success) {
            result.message = '🏗️ Grant of ' + GameData.formatMoney(d.grant) + ' received! Refurbishment started.';
          } else {
            result.message = '🏗️ Grant of ' + GameData.formatMoney(d.grant) + ' received! (Start refurbishment manually.)';
          }
        } else {
          result.message = '🏗️ Grant of ' + GameData.formatMoney(d.grant) + ' received!';
        }
        break;
      }
      case 'hire_security': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash >= d.cost) {
          this.state.cash -= d.cost;
          // Apply security mitigation
          if (!this.state.mitigations) this.state.mitigations = {};
          if (!this.state.mitigations[d.propId]) this.state.mitigations[d.propId] = {};
          this.state.mitigations[d.propId]['security_system'] = true;
          result.message = '🔒 Security hired! Property protected against theft and vandalism.';
        } else { result.message = 'Not enough cash.'; result.success = false; }
        break;
      }
      case 'donate': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash >= d.amount) {
          this.state.cash -= d.amount;
          if (!this.state.reputation) this.state.reputation = 50;
          this.state.reputation = Math.min(100, this.state.reputation + 8);
          result.message = '🎗️ Donated ' + GameData.formatMoney(d.amount) + '. Reputation increased!';
        } else {
          result.message = 'Not enough cash.';
          result.success = false;
        }
        break;
      }
      case 'educate': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash >= d.cost) {
          this.state.cash -= d.cost;
          var member = (this.state.familyMembers || []).find(function(m) { return m.id === d.memberId; });
          if (member) {
            member.educated = true;
            member.health = Math.min(100, member.health + 10);
            member.lifespan += 5;
          }
          result.message = '🎓 ' + (member ? member.name : 'Child') + ' graduated! +10 health, +5 lifespan.';
        } else { result.message = 'Not enough cash.'; result.success = false; }
        break;
      }
      case 'marry': {
        var d = choiceData || decision.choices[0].data;
        this.state.cash += d.dowry;
        var member = (this.state.familyMembers || []).find(function(m) { return m.id === d.memberId; });
        if (member) member.married = true;
        if (!this.state.reputation) this.state.reputation = 50;
        this.state.reputation = Math.min(100, this.state.reputation + 5);
        result.message = '💒 Marriage alliance formed! +'+ GameData.formatMoney(d.dowry) + ' dowry, +5 reputation.';
        break;
      }
      case 'suppress_scandal': {
        var d = choiceData || decision.choices[0].data;
        if (this.state.cash >= d.cost) {
          this.state.cash -= d.cost;
          result.message = 'Scandal suppressed for ' + GameData.formatMoney(d.cost) + '. Reputation preserved.';
        } else { result.message = 'Not enough cash!'; result.success = false; }
        break;
      }
      case 'accept_scandal': {
        var d = choiceData || decision.choices[0].data;
        if (!this.state.reputation) this.state.reputation = 50;
        this.state.reputation = Math.max(0, this.state.reputation - d.repLoss);
        result.message = 'Scandal made public. Reputation -' + d.repLoss + '.';
        break;
      }
      case 'open_bank':
        result.message = 'Opening the Bank...';
        result.navigateTo = 'bank';
        break;
      case 'pass':
        result.message = 'You passed on this opportunity.';
        break;
    }

    this.save();
    return result;
  },

  // ========== UPDATED NET WORTH ==========
  getNetWorth() {
    const propertyValue = this.state.properties.reduce((sum, p) => sum + p.currentValue, 0);
    const stakeValue = this.getBusinessStakeValue();
    const investmentValue = this.getInvestmentValue();
    const savings = this.state.savingsBalance || 0;
    const debt = (this.state.loans || []).reduce((sum, l) => sum + l.remainingBalance, 0);
    return this.state.cash + propertyValue + stakeValue + investmentValue + savings - debt;
  }
};
