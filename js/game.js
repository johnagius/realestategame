/* ========================================
   PROPERTY EMPIRE - Game Engine
   ======================================== */

const GameEngine = {

  // ---- Game State ----
  state: null,

  // ---- Initialize new game ----
  newGame() {
    this.state = {
      cash: GameData.startingCash,
      month: 0,       // months since start
      year: 2024,
      monthIndex: 0,  // 0-11
      properties: [], // owned properties
      marketProperties: {}, // cityId -> [properties]
      totalPropertiesBought: 0,
      totalPropertiesSold: 0,
      totalRentEarned: 0,
      totalExpensesPaid: 0,
      totalPurchaseSpent: 0,
      totalSaleRevenue: 0,
      networthHistory: [GameData.startingCash],
      monthlyIncome: 0,
      monthlyExpenses: 0,
      activeEvents: [],     // {eventId, cityId, monthsLeft}
      insurance: {},        // cityId -> { type: level } insurance purchased
      disasterHistory: [],  // record of past disasters
      mitigations: {},      // propertyId -> { type: true/false }
      globalMitigations: {} // global mitigations purchased
    };

    // Generate initial market for all cities
    GameData.cities.forEach(city => {
      this.state.marketProperties[city.id] = GameData.generateCityProperties(city.id);
    });

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
  getNetWorth() {
    const propertyValue = this.state.properties.reduce((sum, p) => sum + p.currentValue, 0);
    return this.state.cash + propertyValue;
  },

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

    const annualRent = property.currentValue * city.rentYield * rentMultiplier * condPenalty * rentBoost;
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
          p.monthlyLicense = Math.round((GameData.licensingFees[option.resultType] || 500) / 12);

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

    // 10. Track net worth
    this.state.networthHistory.push(this.getNetWorth());
    // Keep last 120 months
    if (this.state.networthHistory.length > 120) {
      this.state.networthHistory.shift();
    }

    this.state.monthlyIncome = results.rentIncome;
    this.state.monthlyExpenses = results.expenses;

    this.save();
    return results;
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
        // Slightly change city tax rate
        city.taxRate = Math.max(0.02, Math.min(0.12, city.taxRate + (Math.random() > 0.5 ? 1 : -1) * event.effect.value));
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
      citiesPresent: [...new Set(props.map(p => p.cityId))].length
    };
  }
};
