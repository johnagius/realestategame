/* ========================================
   PROPERTY EMPIRE - Game Engine
   ======================================== */

const GameEngine = {

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
      autoAdvanceSpeed: 0   // 0=off, 1=slow, 2=medium, 3=fast
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

    // Initialize AI families
    this.state.aiFamilies = GameData.aiFamilies.map(ai => ({
      id: ai.id,
      name: ai.name,
      icon: ai.icon,
      color: ai.color,
      aggressiveness: ai.aggressiveness,
      riskTolerance: ai.riskTolerance,
      netWorth: ai.startingWealth,
      propertyCount: Math.floor(ai.startingWealth / 500000),
      monthlyIncome: Math.round(ai.startingWealth * 0.004),
      history: [ai.startingWealth],
      rank: 0
    }));

    // Milestones / goals
    this.state.milestones = [];
    this.state.monthlyGoal = null;

    this.save();
    return this.state;
  },

  // ---- Load game ----
  loadGame() {
    try {
      const saved = localStorage.getItem('propertyEmpire_save');
      if (saved) {
        this.state = JSON.parse(saved);
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
  buyProperty(propertyId, cityId) {
    const cityMarket = this.state.marketProperties[cityId];
    if (!cityMarket) return { success: false, message: 'City not found.' };

    const propIdx = cityMarket.findIndex(p => p.id === propertyId);
    if (propIdx === -1) return { success: false, message: 'Property no longer available.' };

    const property = cityMarket[propIdx];
    const city = GameData.cities.find(c => c.id === cityId);
    const purchaseTax = Math.round(property.currentValue * city.taxRate);
    const totalCost = property.currentValue + purchaseTax;

    if (this.state.cash < totalCost) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(totalCost)} (incl. ${GameData.formatMoney(purchaseTax)} tax).` };
    }

    // Check city property limit
    const ownedInCity = this.state.properties.filter(p => p.cityId === cityId).length;
    if (ownedInCity >= city.maxProperties) {
      return { success: false, message: `Maximum ${city.maxProperties} properties in ${city.name}.` };
    }

    // Execute purchase
    this.state.cash -= totalCost;
    property.isOwned = true;
    property.isNew = false;
    property.purchasePrice = property.currentValue;
    property.monthPurchased = this.state.month;
    property.totalRentCollected = 0;
    property.totalExpensesPaid = purchaseTax;

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
      property
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
    this.save();

    if (property.isRented) {
      return { success: true, message: `Now renting for ${GameData.formatMoney(property.monthlyRent)}/month.` };
    } else {
      return { success: true, message: 'Property is no longer rented.' };
    }
  },

  // ---- Refurbish property ----
  refurbishProperty(propertyId) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if (!property) return { success: false, message: 'Property not found.' };

    const typeDef = GameData.propertyTypes[property.type];
    if (!typeDef.canRefurbish) return { success: false, message: 'Cannot refurbish this property type.' };
    if (property.condition === 'excellent') return { success: false, message: 'Already in excellent condition.' };
    if (property.isRefurbishing) return { success: false, message: 'Already refurbishing.' };
    if (property.isBuilding) return { success: false, message: 'Still under construction.' };

    const condDef = GameData.conditions[property.condition];
    let cost = Math.round(property.currentValue * condDef.refurbCostPct);

    // Check for renovation grant discount
    const grantEvent = this.state.activeEvents.find(
      e => e.eventId === 'renovation_grant' && e.cityId === property.cityId
    );
    if (grantEvent) {
      cost = Math.round(cost * 0.7);
    }

    if (this.state.cash < cost) {
      return { success: false, message: `Not enough cash. Need ${GameData.formatMoney(cost)}.` };
    }

    // Determine time
    let months;
    if (property.condition === 'derelict') months = 4;
    else if (property.condition === 'poor') months = 3;
    else if (property.condition === 'fair') months = 2;
    else months = 2;

    // Execute
    this.state.cash -= cost;
    property.isRefurbishing = true;
    property.isRented = false;
    property.refurbMonthsLeft = months;
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

    // Calculate build cost based on resulting property value
    const city = GameData.cities.find(c => c.id === property.cityId);
    const resultType = GameData.propertyTypes[option.resultType];
    const [minP, maxP] = resultType.basePriceRange;
    const estimatedValue = Math.round(((minP + maxP) / 2) * city.priceMultiplier / 1000) * 1000;
    const buildCost = Math.round(estimatedValue * option.costPct);

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
      baseProbability: 0.015
    },
    earthquake: {
      name: 'Earthquake',
      icon: '🫨',
      description: 'Seismic activity causes structural damage.',
      baseDamageValuePct: 0.12,
      conditionDrop: 2,
      baseProbability: 0.008
    },
    fire: {
      name: 'Fire',
      icon: '🔥',
      description: 'A fire breaks out, causing significant damage.',
      baseDamageValuePct: 0.15,
      conditionDrop: 2,
      baseProbability: 0.01
    },
    storm: {
      name: 'Severe Storm',
      icon: '🌪️',
      description: 'High winds and heavy rain damage the property.',
      baseDamageValuePct: 0.06,
      conditionDrop: 1,
      baseProbability: 0.02
    },
    theft: {
      name: 'Burglary',
      icon: '🦹',
      description: 'Break-in reported. Property contents stolen and damaged.',
      baseDamageValuePct: 0.03,
      conditionDrop: 0,
      baseProbability: 0.02
    },
    vandalism: {
      name: 'Vandalism',
      icon: '💥',
      description: 'Property vandalised, requiring repairs.',
      baseDamageValuePct: 0.02,
      conditionDrop: 1,
      baseProbability: 0.015
    },
    drought: {
      name: 'Water Crisis',
      icon: '☀️',
      description: 'Severe drought causes water restrictions, reducing property appeal.',
      baseDamageValuePct: 0.02,
      conditionDrop: 0,
      baseProbability: 0.01
    },
    sandstorm: {
      name: 'Sandstorm',
      icon: '🏜️',
      description: 'Severe sandstorm damages exterior surfaces.',
      baseDamageValuePct: 0.04,
      conditionDrop: 1,
      baseProbability: 0.015
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

    const condPenalty = GameData.conditions[property.condition].rentPenalty;
    const rentMultiplier = typeDef.rentMultiplier || 0;

    // Check for tourism boost
    let rentBoost = 1;
    const tourismEvent = this.state.activeEvents.find(
      e => e.eventId === 'tourism_surge' && e.cityId === property.cityId
    );
    if (tourismEvent) rentBoost = 1.15;

    const eraBoost = GameData.getEraRentBoost(this.state.year || GameData.startingYear || 1750);
    const annualRent = property.currentValue * city.rentYield * rentMultiplier * condPenalty * rentBoost * eraBoost;
    property.monthlyRent = Math.round(annualRent / 12);
  },

  // ---- Advance one month ----
  advanceMonth() {
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

    // 1. Collect rent
    this.state.properties.forEach(p => {
      if (p.isRented && !p.isRefurbishing && !p.isBuilding) {
        this.state.cash += p.monthlyRent;
        p.totalRentCollected += p.monthlyRent;
        results.rentIncome += p.monthlyRent;
        this.state.totalRentEarned += p.monthlyRent;
      }
    });

    // 2. Pay expenses (maintenance + licensing + mitigation upkeep)
    this.state.properties.forEach(p => {
      const expense = p.monthlyMaintenance + p.monthlyLicense;
      this.state.cash -= expense;
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

    // 3. Process refurbishments
    this.state.properties.forEach(p => {
      if (p.isRefurbishing) {
        p.refurbMonthsLeft--;
        if (p.refurbMonthsLeft <= 0) {
          p.isRefurbishing = false;
          // Upgrade condition
          const currentLevel = GameData.conditions[p.condition].level;
          const newLevel = Math.min(4, currentLevel + 1);
          p.condition = GameData.conditionOrder[newLevel];
          // Increase value
          p.currentValue = Math.round(p.currentValue * 1.12);
          this.recalculateRent(p);
          results.completedRefurbishments.push(p);
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

          // Transform property
          const [minP, maxP] = newType.basePriceRange;
          const newValue = Math.round(((minP + maxP) / 2) * city.priceMultiplier / 1000) * 1000;

          p.type = option.resultType;
          p.name = p.name.replace(/Land|Plot|Site|Lot/, option.name);
          p.currentValue = newValue;
          p.condition = 'excellent';
          p.isBuilding = false;
          p.buildType = null;
          p.monthlyMaintenance = Math.round(newValue * newType.maintenanceRate / 12);
          const eraCostFactor = GameData.getEraCostFactor(this.state.year || GameData.startingYear || 1750);
          p.monthlyLicense = Math.round(Math.max(12, (GameData.licensingFees[option.resultType] || 500) * eraCostFactor * 0.2) / 12);

          this.recalculateRent(p);
          results.completedBuilds.push(p);
        }
      }
    });

    // 5. Market value fluctuations (with inflation + buying/selling pressure)
    // Track buying/selling pressure per city
    if (!this.state.marketPressure) this.state.marketPressure = {};

    // Slowly drift inflation rates each month (small random walk)
    GameData.cities.forEach(city => {
      const drift = (Math.random() - 0.5) * 0.002; // +/- 0.1% drift
      city.inflationRate = Math.max(0.005, Math.min(0.08, (city.inflationRate || 0.02) + drift));
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
        const monthlyGrowth = city.growthRate / 12;
        const monthlyInflation = (city.inflationRate || 0.02) / 12;
        const pressure = this.state.marketPressure[city.id] || 0;
        const randomFactor = (Math.random() - 0.5) * 0.02;
        const change = monthlyGrowth + monthlyInflation + pressure + randomFactor;
        p.currentValue = Math.round(p.currentValue * (1 + change));
        p.appreciation = ((p.currentValue - p.purchasePrice) / p.purchasePrice) * 100;
        this.recalculateRent(p);
      }
    });

    // Also fluctuate market properties
    Object.keys(this.state.marketProperties).forEach(cityId => {
      const city = GameData.cities.find(c => c.id === cityId);
      const monthlyGrowth = city.growthRate / 12;
      const monthlyInflation = (city.inflationRate || 0.02) / 12;
      const pressure = this.state.marketPressure[cityId] || 0;
      this.state.marketProperties[cityId].forEach(p => {
        const randomFactor = (Math.random() - 0.5) * 0.02;
        p.currentValue = Math.round(p.currentValue * (1 + monthlyGrowth + monthlyInflation + pressure + randomFactor));
        this.recalculateRent(p);
      });
    });

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

    // 9. New properties may appear on market
    GameData.cities.forEach(city => {
      const market = this.state.marketProperties[city.id];
      if (market.length < city.maxProperties && Math.random() < 0.3) {
        const types = Object.keys(GameData.propertyTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        const newProp = GameData.generateProperty(city.id, type);
        if (newProp) {
          market.push(newProp);
          results.newProperties.push({ cityId: city.id, property: newProp });
        }
      }
    });

    // 10. Process loan payments
    results.loanPayments = this.processLoanPayments();
    results.expenses += results.loanPayments;

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

    // 15. Check era transition
    results.eraChange = this.checkEraTransition();

    // 16. Simulate AI families
    this.simulateAIFamilies();

    // 16. Check milestones
    results.milestones = this.checkMilestones();

    // 17. Track net worth
    this.state.networthHistory.push(this.getNetWorth());
    if (this.state.networthHistory.length > 120) {
      this.state.networthHistory.shift();
    }

    this.state.monthlyIncome = results.rentIncome;
    this.state.monthlyExpenses = results.expenses;

    this.save();
    return results;
  },

  // ---- Simulate AI families ----
  simulateAIFamilies() {
    if (!this.state.aiFamilies) return;
    this.state.aiFamilies.forEach(ai => {
      // Monthly income from their properties
      const income = ai.monthlyIncome * (0.9 + Math.random() * 0.2);
      ai.netWorth += income;

      // Occasionally buy/sell (simulated)
      if (Math.random() < ai.aggressiveness * 0.15) {
        const investAmount = ai.netWorth * (0.02 + Math.random() * 0.05) * ai.riskTolerance;
        ai.netWorth += investAmount * (Math.random() - 0.4); // Could gain or lose
        ai.propertyCount += Math.random() > 0.4 ? 1 : 0;
      }

      // Market effects hit AI too
      const marketShift = (Math.random() - 0.48) * 0.03;
      ai.netWorth *= (1 + marketShift);
      ai.netWorth = Math.max(100000, Math.round(ai.netWorth));

      // Grow income slowly
      ai.monthlyIncome = Math.round(ai.monthlyIncome * (1 + (Math.random() - 0.45) * 0.02));

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
        // City growth rate also takes a temporary hit
        city.growthRate = Math.max(-0.02, city.growthRate - 0.015);
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

  getLoanOffers(amount) {
    const netWorth = this.getNetWorth();
    const existingDebt = (this.state.loans || []).reduce((s, l) => s + l.remainingBalance, 0);
    const offers = [];

    GameData.banks.forEach(bank => {
      if (bank.minNetWorth && netWorth < bank.minNetWorth) return;

      const maxLoan = Math.round(netWorth * bank.maxLoanPct) - existingDebt;
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

      this.state.cash -= payment;
      loan.remainingBalance -= (payment - interestPortion);
      loan.monthsLeft--;
      totalPaid += payment;

      if (!this.state.totalLoanInterestPaid) this.state.totalLoanInterestPaid = 0;
      this.state.totalLoanInterestPaid += interestPortion;

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
    const eraM = era.propertyMultiplier || 1;
    const all = [];

    // Commodities - historically accurate availability
    // Gold & Silver: always available
    all.push({ id: 'gold', type: 'commodity', name: 'Gold', icon: '🥇',
      unitPrice: Math.round(50 * eraM), annualYield: 0.03, risk: 0.12, minYear: 0,
      description: 'The eternal store of value.' });
    all.push({ id: 'silver', type: 'commodity', name: 'Silver', icon: '🥈',
      unitPrice: Math.round(10 * eraM), annualYield: 0.025, risk: 0.15, minYear: 0,
      description: 'Precious metal. Monetary and industrial use.' });
    // Cotton: 1750+
    all.push({ id: 'cotton', type: 'commodity', name: 'Cotton', icon: '☁️',
      unitPrice: Math.round(5 * eraM), annualYield: 0.06, risk: 0.20, minYear: 1750,
      description: 'King Cotton. Drives the textile trade.' });
    // Tea & Spices: 1750+
    all.push({ id: 'tea_spices', type: 'commodity', name: 'Tea & Spices', icon: '🍵',
      unitPrice: Math.round(8 * eraM), annualYield: 0.07, risk: 0.18, minYear: 1750,
      description: 'Colonial trade goods. High demand.' });
    // Coal: 1780+
    if (year >= 1780) all.push({ id: 'coal', type: 'commodity', name: 'Coal', icon: '⛏️',
      unitPrice: Math.round(15 * eraM), annualYield: 0.05, risk: 0.10, minYear: 1780,
      description: 'Fuel of the Industrial Revolution.' });
    // Iron/Steel: 1800+
    if (year >= 1800) all.push({ id: 'iron_steel', type: 'commodity', name: 'Iron & Steel', icon: '⚒️',
      unitPrice: Math.round(30 * eraM), annualYield: 0.06, risk: 0.12, minYear: 1800,
      description: 'Building material of empires.' });
    // Oil: 1859+ (first well drilled)
    if (year >= 1859) all.push({ id: 'oil', type: 'commodity', name: 'Crude Oil', icon: '🛢️',
      unitPrice: Math.round(100 * eraM), annualYield: 0.08, risk: 0.25, minYear: 1859,
      description: 'Black gold. Discovered 1859.' });
    // Rubber: 1880+
    if (year >= 1880) all.push({ id: 'rubber', type: 'commodity', name: 'Rubber', icon: '🌳',
      unitPrice: Math.round(25 * eraM), annualYield: 0.06, risk: 0.18, minYear: 1880,
      description: 'Essential for the automobile age.' });
    // Copper/Aluminum: 1900+
    if (year >= 1900) all.push({ id: 'copper', type: 'commodity', name: 'Copper & Aluminium', icon: '🔶',
      unitPrice: Math.round(40 * eraM), annualYield: 0.05, risk: 0.15, minYear: 1900,
      description: 'Industrial metals. Wiring the world.' });
    // Uranium: 1945+
    if (year >= 1945) all.push({ id: 'uranium', type: 'commodity', name: 'Uranium', icon: '☢️',
      unitPrice: Math.round(500 * eraM), annualYield: 0.07, risk: 0.35, minYear: 1945,
      description: 'Nuclear age. Power and peril.' });
    // Lithium: 1990+
    if (year >= 1990) all.push({ id: 'lithium', type: 'commodity', name: 'Lithium', icon: '🔋',
      unitPrice: Math.round(200 * eraM), annualYield: 0.12, risk: 0.30, minYear: 1990,
      description: 'Battery revolution. The new oil.' });
    // Rare Earths: 2000+
    if (year >= 2000) all.push({ id: 'rare_earth', type: 'commodity', name: 'Rare Earth Minerals', icon: '💎',
      unitPrice: Math.round(300 * eraM), annualYield: 0.10, risk: 0.28, minYear: 2000,
      description: 'Critical for tech. Geopolitical power.' });

    // Bonds - available from 1800+ (when stock exchanges emerge)
    if (year >= 1800) {
      all.push({ id: 'gov_bond', type: 'bond', name: 'Government Bond', icon: '🏛️',
        unitPrice: Math.round(100 * eraM), annualYield: 0.04 + baseRate, risk: 0.03,
        description: 'Safe, government-backed.' });
    }
    if (year >= 1870) {
      all.push({ id: 'corp_bond', type: 'bond', name: 'Corporate Bond', icon: '🏢',
        unitPrice: Math.round(500 * eraM), annualYield: 0.06 + baseRate, risk: 0.08,
        description: 'Higher yield, some default risk.' });
      all.push({ id: 'railway_bond', type: 'bond', name: 'Railway Bond', icon: '🚂',
        unitPrice: Math.round(200 * eraM), annualYield: 0.07 + baseRate, risk: 0.12,
        description: 'Finance the iron roads.' });
    }

    // Stocks - available from 1870+
    if (year >= 1870) {
      all.push({ id: 'blue_chip', type: 'stock', name: 'Blue Chip Stocks', icon: '📊',
        unitPrice: Math.round(300 * eraM), annualYield: 0.06, risk: 0.12,
        description: 'Large established companies.' });
    }
    if (year >= 1930) {
      all.push({ id: 'index_fund', type: 'stock', name: 'Index Fund', icon: '🌍',
        unitPrice: Math.round(500 * eraM), annualYield: 0.08, risk: 0.15,
        description: 'Diversified equities.' });
    }
    if (year >= 1980) {
      all.push({ id: 'tech_stocks', type: 'stock', name: 'Tech Stocks', icon: '💻',
        unitPrice: Math.round(1000 * eraM), annualYield: 0.14, risk: 0.30,
        description: 'Technology sector. High growth.' });
      all.push({ id: 'reit', type: 'stock', name: 'Real Estate REIT', icon: '🏠',
        unitPrice: Math.round(2000 * eraM), annualYield: 0.07, risk: 0.12,
        description: 'Real estate investment trust.' });
    }
    if (year >= 2000) {
      all.push({ id: 'emerging_mkts', type: 'stock', name: 'Emerging Markets', icon: '🚀',
        unitPrice: Math.round(500 * eraM), annualYield: 0.14, risk: 0.35,
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
