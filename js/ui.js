/* ========================================
   PROPERTY EMPIRE - UI Rendering (Part 1)
   ======================================== */

const GameUI = {

  currentScreen: 'splash',
  currentCity: null,
  currentProperty: null,
  currentCityTab: 'market',
  currentPortfolioFilter: 'all',
  mapView: true,
  autoTimer: null,

  // ---- Show a screen ----
  showScreen(screenId, data) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + screenId);
    if (screen) screen.classList.add('active');

    // Update nav
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-btn[data-screen="${screenId}"]`);
    if (navBtn) navBtn.classList.add('active');

    this.currentScreen = screenId;

    switch (screenId) {
      case 'map': this.renderMap(); break;
      case 'city': this.renderCity(data); break;
      case 'property': this.renderProperty(data); break;
      case 'portfolio': this.renderPortfolio(); break;
      case 'bank': this.renderBank(); break;
      case 'finances': this.renderFinances(); break;
      case 'settings': this.renderSettings(); break;
    }
  },

  // ---- Update HUD ----
  updateHUD() {
    const s = GameEngine.state;
    if (!s) return;
    document.getElementById('hud-cash').textContent = GameData.formatMoney(s.cash);
    var dateEl = document.getElementById('hud-date');
    dateEl.textContent = GameEngine.getDateString();
    document.getElementById('hud-networth').textContent = GameData.formatMoney(GameEngine.getNetWorth());
    // Speed controls in HUD
    document.getElementById('hud-speed').innerHTML = this.renderSpeedControls();
  },

  // ---- Toast notification ----
  toast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3200);
  },

  // ---- Render Map (Cities grid + world map) ----
  renderMap() {
    // Render world map pins
    this.renderWorldMap();

    const grid = document.getElementById('cities-grid');
    const search = document.getElementById('city-search').value.toLowerCase();
    let cities = GameData.cities;
    if (search) {
      cities = cities.filter(function(c) {
        return c.name.toLowerCase().includes(search) || c.country.toLowerCase().includes(search);
      });
    }

    var html = '';
    cities.forEach(function(city, i) {
      var summary = GameEngine.getCitySummary(city.id);
      var inflRate = city.inflationRate !== undefined ? city.inflationRate : 0.02;
      var lm = GameData.cityLandmarks[city.id] || {};
      html += '<div class="city-card" data-tier="' + city.tier + '" data-city="' + city.id + '" style="animation-delay:' + (i * 0.05) + 's">' +
        '<div class="city-card-header">' +
          '<span class="city-flag">' + (lm.landmark || city.flag) + '</span>' +
          '<div>' +
            '<div class="city-card-name">' + city.name + '</div>' +
            '<div class="city-card-country">' + city.country + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="city-card-stats">' +
          '<div class="city-stat">' +
            '<span class="city-stat-value">' + summary.available + '</span>' +
            '<span class="city-stat-label">For Sale</span>' +
          '</div>' +
          '<div class="city-stat">' +
            '<span class="city-stat-value">' + summary.owned + '</span>' +
            '<span class="city-stat-label">Owned</span>' +
          '</div>' +
          '<div class="city-stat">' +
            '<span class="city-stat-value">' + GameData.formatMoneyShort(summary.avgPrice) + '</span>' +
            '<span class="city-stat-label">Avg Price</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">' +
          '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px">📊 Tax ' + Math.round(city.taxRate * 100) + '%</span>' +
          '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px">📈 ' + (city.growthRate * 100).toFixed(1) + '%</span>' +
          '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px">🏠 ' + (city.rentYield * 100).toFixed(1) + '%</span>' +
          '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px">💹 ' + (inflRate * 100).toFixed(1) + '%</span>' +
        '</div>' +
      '</div>';
    });
    grid.innerHTML = html;
  },

  // ---- Render City ----
  renderCity(cityId) {
    if (cityId) this.currentCity = cityId;
    var city = GameData.cities.find(function(c) { return c.id === GameUI.currentCity; });
    if (!city) return;

    document.getElementById('city-title').textContent = city.flag + ' ' + city.name;

    // City info chips
    var info = document.getElementById('city-info');
    var inflationRate = city.inflationRate !== undefined ? city.inflationRate : 0.02;
    info.innerHTML =
      '<div class="city-info-chip">📊 Tax: <strong>' + Math.round(city.taxRate * 100) + '%</strong></div>' +
      '<div class="city-info-chip">📈 Growth: <strong>' + (city.growthRate * 100).toFixed(1) + '%/yr</strong></div>' +
      '<div class="city-info-chip">💹 Inflation: <strong>' + (inflationRate * 100).toFixed(1) + '%</strong></div>' +
      '<div class="city-info-chip">🏠 Yield: <strong>' + (city.rentYield * 100).toFixed(1) + '%</strong></div>';

    // Render properties based on tab
    this.renderCityProperties();
  },

  renderCityProperties() {
    var cityId = this.currentCity;
    var tab = this.currentCityTab;

    // Handle businesses tab separately
    if (tab === 'businesses') {
      this.renderCityBusinesses();
      return;
    }

    var props;
    if (tab === 'market') {
      props = GameEngine.state.marketProperties[cityId] || [];
    } else {
      props = GameEngine.state.properties.filter(function(p) { return p.cityId === cityId; });
    }

    var grid = document.getElementById('city-properties');
    var empty = document.getElementById('city-empty');

    if (props.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      empty.querySelector('p').textContent = tab === 'market' ? 'No properties for sale right now' : 'You don\'t own any properties here';
      return;
    }

    empty.style.display = 'none';
    grid.innerHTML = props.map(function(p, i) { return GameUI.renderPropertyCard(p, i); }).join('');
  },

  // ---- Render a property card ----
  renderPropertyCard(p, index) {
    var typeDef = GameData.propertyTypes[p.type];
    var condDef = GameData.conditions[p.condition];
    var delay = (index || 0) * 0.04;

    var badge = '';
    if (p.isOwned && p.isRented) badge = '<span class="property-badge badge-rented">Rented</span>';
    else if (p.isOwned && p.isRefurbishing) badge = '<span class="property-badge badge-refurbishing">Refurbishing</span>';
    else if (p.isOwned && p.isBuilding) badge = '<span class="property-badge badge-refurbishing">Building</span>';
    else if (p.isOwned) badge = '<span class="property-badge badge-owned">Owned</span>';
    else if (p.isNew) badge = '<span class="property-badge badge-new">New</span>';

    // Condition bar
    var condBar = '<div class="condition-bar">';
    for (var i = 0; i < 5; i++) {
      var filled = i <= condDef.level;
      var cls = filled ? (condDef.level <= 1 ? 'filled bad' : condDef.level <= 2 ? 'filled warn' : 'filled') : '';
      condBar += '<div class="condition-segment ' + cls + '"></div>';
    }
    condBar += '</div>';

    return '<div class="property-card" data-property="' + p.id + '" data-city="' + p.cityId + '" style="animation-delay:' + delay + 's">' +
      badge +
      '<div class="property-card-type">' +
        '<span class="property-icon">' + typeDef.icon + '</span>' +
        '<span class="property-type-label">' + typeDef.name + '</span>' +
      '</div>' +
      '<div class="property-card-name">' + p.name + '</div>' +
      '<div class="property-card-price">' + GameData.formatMoney(p.currentValue) + '</div>' +
      '<div class="property-card-details">' +
        '<span>📐 ' + p.size + ' m²</span>' +
        '<span>📊 ' + condDef.name + '</span>' +
        (p.monthlyRent > 0 ? '<span>💶 ' + GameData.formatMoney(p.monthlyRent) + '/mo</span>' : '') +
      '</div>' +
      condBar +
    '</div>';
  },

  // ---- Render Property Detail ----
  renderProperty(propertyId) {
    if (propertyId) this.currentProperty = propertyId;
    var p = GameEngine.state.properties.find(function(x) { return x.id === GameUI.currentProperty; });
    if (!p) {
      // Check market
      for (var cid in GameEngine.state.marketProperties) {
        var found = GameEngine.state.marketProperties[cid].find(function(x) { return x.id === GameUI.currentProperty; });
        if (found) { p = found; break; }
      }
    }
    if (!p) return;

    var typeDef = GameData.propertyTypes[p.type];
    var condDef = GameData.conditions[p.condition];
    var city = GameData.cities.find(function(c) { return c.id === p.cityId; });

    document.getElementById('property-title').textContent = typeDef.icon + ' Details';

    // Condition bar
    var condBarHTML = '<div class="condition-bar-large">';
    for (var i = 0; i < 5; i++) {
      var filled = i <= condDef.level;
      var cls = filled ? (condDef.level <= 1 ? 'filled bad' : condDef.level <= 2 ? 'filled warn' : 'filled') : '';
      condBarHTML += '<div class="condition-segment ' + cls + '"></div>';
    }
    condBarHTML += '</div>';

    // Actions
    var actionsHTML = '<div class="property-actions">';

    if (!p.isOwned) {
      var tax = Math.round(p.currentValue * city.taxRate);
      var total = p.currentValue + tax;
      actionsHTML += '<button class="btn btn-primary" onclick="App.buyProperty(\'' + p.id + '\', \'' + p.cityId + '\')">Buy for ' + GameData.formatMoney(total) + '</button>';
      actionsHTML += '<div class="action-info">Price: ' + GameData.formatMoney(p.currentValue) + ' + Tax: ' + GameData.formatMoney(tax) + '</div>';
    } else {
      if (p.isBuilding) {
        actionsHTML += '<div class="action-info">🏗️ Under construction — ' + p.buildMonthsLeft + ' months remaining</div>';
      } else if (p.isRefurbishing) {
        actionsHTML += '<div class="action-info">🔨 Refurbishing — ' + p.refurbMonthsLeft + ' months remaining</div>';
      } else {
        // Rent toggle
        if (typeDef.canRent && p.condition !== 'derelict') {
          if (p.isRented) {
            actionsHTML += '<button class="btn btn-secondary" onclick="App.toggleRent(\'' + p.id + '\')">Stop Renting</button>';
          } else {
            actionsHTML += '<button class="btn btn-primary" onclick="App.toggleRent(\'' + p.id + '\')">Rent Out — ' + GameData.formatMoney(p.monthlyRent) + '/mo</button>';
          }
        }

        // Refurbish
        if (typeDef.canRefurbish && p.condition !== 'excellent') {
          var refurbCost = Math.round(p.currentValue * condDef.refurbCostPct);
          actionsHTML += '<button class="btn btn-accent" onclick="App.refurbishProperty(\'' + p.id + '\')">Refurbish — ' + GameData.formatMoney(refurbCost) + '</button>';
        }

        // Build on land
        if (p.type === 'land') {
          actionsHTML += '<div class="action-info mb-8">Build on this land:</div>';
          var opts = GameData.buildOptions;
          for (var key in opts) {
            var opt = opts[key];
            var resultType = GameData.propertyTypes[opt.resultType];
            var minP = resultType.basePriceRange[0];
            var maxP = resultType.basePriceRange[1];
            var estValue = Math.round(((minP + maxP) / 2) * city.priceMultiplier / 1000) * 1000;
            var buildCost = Math.round(estValue * opt.costPct);
            actionsHTML += '<button class="btn btn-secondary btn-small" onclick="App.buildOnLand(\'' + p.id + '\', \'' + key + '\')">' + opt.icon + ' ' + opt.name + ' — ' + GameData.formatMoney(buildCost) + ' (' + opt.timeMonths + 'mo)</button>';
          }
        }

        // Sell
        var agentFee = Math.round(p.currentValue * GameData.sellingFeeRate);
        var saleProceeds = p.currentValue - agentFee;
        actionsHTML += '<button class="btn btn-danger btn-small mt-8" onclick="App.sellProperty(\'' + p.id + '\')">Sell — ' + GameData.formatMoney(saleProceeds) + ' (after ' + GameData.formatMoney(agentFee) + ' fee)</button>';

        // Auto-sell
        var autoRule = (GameEngine.state.autoSellRules || []).find(function(r) { return r.propertyId === p.id; });
        if (autoRule) {
          actionsHTML += '<div class="city-info-chip mt-8" style="width:100%;justify-content:space-between">' +
            '<span>🤖 Auto-sell at ' + (autoRule.type === 'pct' ? autoRule.threshold + '% appreciation' : GameData.formatMoney(autoRule.threshold)) + '</span>' +
            '<button class="btn btn-ghost btn-small" onclick="App.removeAutoSell(\'' + p.id + '\')">Remove</button>' +
          '</div>';
        } else {
          actionsHTML += '<div style="display:flex;gap:4px;margin-top:6px">' +
            '<button class="btn btn-ghost btn-small" onclick="App.setAutoSell(\'' + p.id + '\', \'pct\', 20)">Auto +20%</button>' +
            '<button class="btn btn-ghost btn-small" onclick="App.setAutoSell(\'' + p.id + '\', \'pct\', 50)">Auto +50%</button>' +
            '<button class="btn btn-ghost btn-small" onclick="App.setAutoSell(\'' + p.id + '\', \'pct\', 100)">Auto +100%</button>' +
          '</div>';
        }
      }

      // Mitigations section
      actionsHTML += this.renderMitigations(p);
    }
    actionsHTML += '</div>';

    // Stats
    var appreciation = p.isOwned ? ((p.currentValue - p.purchasePrice) / p.purchasePrice * 100).toFixed(1) : '—';
    var appreciationClass = p.isOwned ? (p.currentValue >= p.purchasePrice ? 'text-success' : 'text-danger') : '';

    var detail = document.getElementById('property-detail');
    detail.innerHTML =
      '<div class="property-detail-card">' +
        '<div class="property-detail-hero">' +
          '<div class="property-detail-icon">' + typeDef.icon + '</div>' +
          '<div class="property-detail-type">' + typeDef.name + '</div>' +
          '<div class="property-detail-name">' + p.name + '</div>' +
          '<div class="property-detail-city">' + city.flag + ' ' + city.name + ', ' + city.country + '</div>' +
          '<div class="property-detail-price">' +
            '<span class="price-label">Current Value</span>' +
            GameData.formatMoney(p.currentValue) +
          '</div>' +
        '</div>' +
        '<div class="property-stats">' +
          '<div class="property-stat"><div class="property-stat-value">📐 ' + p.size + ' m²</div><div class="property-stat-label">Size</div></div>' +
          '<div class="property-stat"><div class="property-stat-value">' + (p.monthlyRent > 0 ? GameData.formatMoney(p.monthlyRent) : '—') + '</div><div class="property-stat-label">Monthly Rent</div></div>' +
          '<div class="property-stat"><div class="property-stat-value">' + GameData.formatMoney(p.monthlyMaintenance + p.monthlyLicense) + '</div><div class="property-stat-label">Monthly Costs</div></div>' +
          '<div class="property-stat"><div class="property-stat-value ' + appreciationClass + '">' + (p.isOwned ? appreciation + '%' : '—') + '</div><div class="property-stat-label">Appreciation</div></div>' +
        '</div>' +
        '<div class="condition-display">' +
          '<div class="condition-label-row">' +
            '<span class="condition-text">Condition</span>' +
            '<span class="condition-text" style="color:' + condDef.color + '">' + condDef.name + '</span>' +
          '</div>' +
          condBarHTML +
        '</div>' +
        actionsHTML +
      '</div>';
  },

  // ---- Render Mitigations ----
  renderMitigations(property) {
    var options = GameEngine.getMitigationOptions(property);
    var owned = GameEngine.state.mitigations[property.id] || {};

    var html = '<div style="border-top:2px dashed #DDD3C0; margin-top:12px; padding-top:12px;">' +
      '<div class="action-info mb-8">🛡️ Risk Mitigation:</div>';

    options.forEach(function(m) {
      var isOwned = !!owned[m.id];
      if (isOwned) {
        html += '<div class="city-info-chip" style="width:100%;justify-content:space-between;margin-bottom:4px;">' +
          '<span>' + m.icon + ' ' + m.name + ' ✅</span>' +
          '<span class="text-muted">' + GameData.formatMoney(m.monthlyUpkeep || 0) + '/mo</span>' +
        '</div>';
      } else {
        html += '<button class="btn btn-secondary btn-small" style="width:100%;margin-bottom:4px;justify-content:space-between;" onclick="App.purchaseMitigation(\'' + property.id + '\', \'' + m.id + '\')">' +
          '<span>' + m.icon + ' ' + m.name + '</span>' +
          '<span>' + GameData.formatMoney(m.cost) + '</span>' +
        '</button>';
      }
    });

    html += '</div>';
    return html;
  },

  // ---- Render Portfolio ----
  renderPortfolio() {
    var stats = GameEngine.getPortfolioStats();
    var props = GameEngine.state.properties;
    var filter = this.currentPortfolioFilter;

    // Summary card
    var summary = document.getElementById('portfolio-summary');
    summary.innerHTML =
      '<div class="portfolio-summary-card">' +
        '<div class="portfolio-summary-title">Total Net Worth</div>' +
        '<div class="portfolio-summary-value">' + GameData.formatMoney(stats.netWorth) + '</div>' +
        '<div class="portfolio-summary-grid">' +
          '<div class="portfolio-summary-stat"><span class="portfolio-summary-stat-value">' + stats.propertyCount + '</span><span class="portfolio-summary-stat-label">Properties</span></div>' +
          '<div class="portfolio-summary-stat"><span class="portfolio-summary-stat-value">' + GameData.formatMoney(stats.monthlyIncome) + '</span><span class="portfolio-summary-stat-label">Income/mo</span></div>' +
          '<div class="portfolio-summary-stat"><span class="portfolio-summary-stat-value ' + (stats.monthlyCashflow >= 0 ? '' : 'text-danger') + '">' + GameData.formatMoney(stats.monthlyCashflow) + '</span><span class="portfolio-summary-stat-label">Cashflow/mo</span></div>' +
        '</div>' +
      '</div>';

    // Filter properties
    if (filter === 'rented') props = props.filter(function(p) { return p.isRented; });
    else if (filter === 'vacant') props = props.filter(function(p) { return !p.isRented && !p.isRefurbishing && !p.isBuilding; });
    else if (filter === 'refurbishing') props = props.filter(function(p) { return p.isRefurbishing || p.isBuilding; });

    var list = document.getElementById('portfolio-list');
    var empty = document.getElementById('portfolio-empty');

    if (props.length === 0 && filter === 'all') {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = props.map(function(p, i) { return GameUI.renderPropertyCard(p, i); }).join('');
  },

  // ---- Render Finances ----
  renderFinances() {
    var s = GameEngine.state;
    var stats = GameEngine.getPortfolioStats();
    var content = document.getElementById('finances-content');

    // Net worth chart
    var history = s.networthHistory;
    var maxVal = Math.max.apply(null, history) || 1;
    var chartBars = history.map(function(v) {
      var pct = Math.max(2, (v / maxVal) * 100);
      return '<div class="chart-bar" style="height:' + pct + '%" title="' + GameData.formatMoney(v) + '"></div>';
    }).join('');

    content.innerHTML =
      '<div class="finance-section">' +
        '<div class="finance-section-title">Net Worth History</div>' +
        '<div class="finance-card"><div class="networth-chart">' + chartBars + '</div></div>' +
      '</div>' +

      '<div class="finance-section">' +
        '<div class="finance-section-title">Monthly Summary</div>' +
        '<div class="finance-card">' +
          '<div class="finance-row"><span class="finance-row-label">Rental Income</span><span class="finance-row-value positive">+' + GameData.formatMoney(stats.monthlyIncome) + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Maintenance & Fees</span><span class="finance-row-value negative">-' + GameData.formatMoney(stats.monthlyExpenses) + '</span></div>' +
          '<div class="finance-row finance-total"><span class="finance-row-label">Net Cashflow</span><span class="finance-row-value ' + (stats.monthlyCashflow >= 0 ? 'positive' : 'negative') + '">' + GameData.formatMoney(stats.monthlyCashflow) + '</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="finance-section">' +
        '<div class="finance-section-title">Lifetime Stats</div>' +
        '<div class="finance-card">' +
          '<div class="finance-row"><span class="finance-row-label">Properties Bought</span><span class="finance-row-value">' + s.totalPropertiesBought + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Properties Sold</span><span class="finance-row-value">' + s.totalPropertiesSold + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Total Rent Earned</span><span class="finance-row-value positive">+' + GameData.formatMoney(s.totalRentEarned) + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Total Expenses</span><span class="finance-row-value negative">-' + GameData.formatMoney(s.totalExpensesPaid) + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Total Purchases</span><span class="finance-row-value">' + GameData.formatMoney(s.totalPurchaseSpent) + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Total Sale Revenue</span><span class="finance-row-value">' + GameData.formatMoney(s.totalSaleRevenue) + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Portfolio Value</span><span class="finance-row-value">' + GameData.formatMoney(stats.totalValue) + '</span></div>' +
          '<div class="finance-row"><span class="finance-row-label">Appreciation</span><span class="finance-row-value ' + (stats.totalAppreciation >= 0 ? 'positive' : 'negative') + '">' + stats.totalAppreciation.toFixed(1) + '%</span></div>' +
        '</div>' +
      '</div>' +

      (s.disasterHistory.length > 0 ?
        '<div class="finance-section">' +
          '<div class="finance-section-title">Recent Disasters</div>' +
          '<div class="finance-card">' +
            s.disasterHistory.slice(-5).reverse().map(function(d) {
              var dis = GameEngine.disasters[d.disasterType];
              return '<div class="finance-row"><span class="finance-row-label">' + (dis ? dis.icon : '⚠️') + ' ' + d.propertyName + '</span><span class="finance-row-value negative">-' + GameData.formatMoney(d.actualDamage) + '</span></div>';
            }).join('') +
          '</div>' +
        '</div>' : '');

    // Wealth Leaderboard
    if (s.aiFamilies) {
      var playerNW = GameEngine.getNetWorth();
      var allFamilies = [
        { name: (s.familyIcon || '👤') + ' ' + (s.familyName || 'You'), netWorth: playerNW, color: s.familyColor || '#2C6E49', isPlayer: true }
      ];
      s.aiFamilies.forEach(function(ai) {
        allFamilies.push({ name: ai.icon + ' ' + ai.name, netWorth: ai.netWorth, color: ai.color, isPlayer: false });
      });
      allFamilies.sort(function(a, b) { return b.netWorth - a.netWorth; });
      var maxNW = allFamilies[0].netWorth || 1;

      content.innerHTML += '<div class="finance-section">' +
        '<div class="finance-section-title">🏆 Wealth Leaderboard</div>' +
        '<div class="finance-card">' +
          allFamilies.map(function(f, i) {
            var barPct = Math.max(5, (f.netWorth / maxNW) * 100);
            var rank = i + 1;
            var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
            return '<div style="margin-bottom:8px' + (f.isPlayer ? ';padding:6px;background:rgba(44,110,73,0.06);border-radius:8px;border:1.5px solid var(--primary-light)' : '') + '">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">' +
                '<span style="font-size:0.8rem;font-weight:700' + (f.isPlayer ? ';color:var(--primary)' : '') + '">' + medal + ' ' + f.name + '</span>' +
                '<span style="font-size:0.8rem;font-weight:800">' + GameData.formatMoneyShort(f.netWorth) + '</span>' +
              '</div>' +
              '<div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">' +
                '<div style="height:100%;width:' + barPct + '%;background:' + f.color + ';border-radius:4px;transition:width 0.5s"></div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

      // Wealth over time chart (player vs top AI)
      var playerHist = s.networthHistory;
      var topAI = s.aiFamilies.reduce(function(best, ai) { return ai.netWorth > best.netWorth ? ai : best; }, s.aiFamilies[0]);
      if (topAI && topAI.history && playerHist.length > 1) {
        var allVals = playerHist.concat(topAI.history);
        var chartMax = Math.max.apply(null, allVals) || 1;

        content.innerHTML += '<div class="finance-section">' +
          '<div class="finance-section-title">📈 Wealth Over Time</div>' +
          '<div class="finance-card">' +
            '<div style="display:flex;gap:12px;margin-bottom:8px;font-size:0.7rem;font-weight:700">' +
              '<span style="color:' + (s.familyColor || '#2C6E49') + '">● ' + (s.familyName || 'You') + '</span>' +
              '<span style="color:' + topAI.color + '">● ' + topAI.name + '</span>' +
            '</div>' +
            '<div style="position:relative;height:120px;display:flex;align-items:flex-end;gap:1px">' +
              playerHist.map(function(v, i) {
                var pPct = Math.max(2, (v / chartMax) * 100);
                var aiVal = topAI.history[i] || 0;
                var aPct = Math.max(2, (aiVal / chartMax) * 100);
                return '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:1px">' +
                  '<div style="height:' + pPct + '%;background:' + (s.familyColor || '#2C6E49') + ';border-radius:2px 2px 0 0;min-height:2px;opacity:0.7"></div>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
      }
    }
  },

  // ---- Render Settings ----
  renderSettings() {
    var content = document.getElementById('settings-content');
    content.innerHTML =
      '<div class="settings-section">' +
        '<div class="settings-row"><div><div class="settings-label">Auto-Advance Time</div><div class="settings-description">Automatically advance months</div></div>' + this.renderSpeedControls() + '</div>' +
        '<div class="settings-row"><div><div class="settings-label">Save Game</div><div class="settings-description">Game saves automatically each month</div></div><button class="btn btn-primary btn-small" onclick="GameEngine.save(); GameUI.toast(\'Game saved!\', \'success\')">Save Now</button></div>' +
        '<div class="settings-row"><div><div class="settings-label">New Game</div><div class="settings-description">Start fresh with €500,000</div></div><button class="btn btn-danger btn-small" onclick="App.confirmNewGame()">Reset</button></div>' +
      '</div>' +
      '<div class="settings-section">' +
        '<div class="settings-row"><div><div class="settings-label">Property Empire</div><div class="settings-description">v2.0 — Build your real estate fortune</div></div></div>' +
        '<div class="settings-row"><div><div class="settings-label">Month</div><div class="settings-description">' + GameEngine.getDateString() + ' (Month ' + GameEngine.state.month + ')</div></div></div>' +
      '</div>';
  },

  // ---- Show month results ----
  showMonthResults(results) {
    var hasDisasters = results.disasters.length > 0;
    var hasEvents = results.events.length > 0;
    var hasCompletions = results.completedRefurbishments.length > 0 || results.completedBuilds.length > 0;

    // Show disasters as event popups
    if (hasDisasters) {
      var d = results.disasters[0];
      this.showEventPopup(
        d.disaster.icon,
        d.disaster.name + '!',
        d.disaster.description.replace('{city}', ''),
        d.coveredAmount > 0
          ? 'Damage: ' + GameData.formatMoney(d.damageValue) + ' (Insured: ' + GameData.formatMoney(d.coveredAmount) + '). You pay: ' + GameData.formatMoney(d.actualDamage)
          : 'Repair cost: ' + GameData.formatMoney(d.actualDamage),
        'negative'
      );
    } else if (hasEvents) {
      var e = results.events[0];
      var effectText = '';
      var effectClass = 'positive';
      if (e.event.effect.value < 0) effectClass = 'negative';
      effectText = e.event.description.replace('{city}', e.cityName);
      this.showEventPopup(e.event.icon, e.event.title, effectText, '', effectClass);
    }

    // Toasts for completions
    results.completedRefurbishments.forEach(function(p) {
      GameUI.toast('✨ ' + p.name + ' refurbishment complete! Now ' + GameData.conditions[p.condition].name, 'success');
    });
    results.completedBuilds.forEach(function(p) {
      GameUI.toast('🏗️ ' + p.name + ' construction complete!', 'success');
    });

    // Auto-sold properties
    if (results.autoSold) {
      results.autoSold.forEach(function(item) {
        GameUI.toast('🤖 Auto-sold: ' + item.property.name + ' — ' + item.result.message, 'info');
      });
    }

    // Dividends
    if (results.dividends > 0) {
      GameUI.toast('💼 Dividends received: +' + GameData.formatMoney(results.dividends), 'success');
    }

    // Milestones
    if (results.milestones) {
      results.milestones.forEach(function(m) {
        GameUI.toast(m.icon + ' Milestone: ' + m.name + '!', 'milestone');
      });
    }

    // Basic summary toast
    if (!hasDisasters && !hasEvents && !(results.milestones && results.milestones.length)) {
      var net = results.rentIncome - results.expenses;
      if (results.rentIncome > 0) {
        GameUI.toast('Month complete: +' + GameData.formatMoney(results.rentIncome) + ' rent, -' + GameData.formatMoney(results.expenses) + ' costs', net >= 0 ? 'success' : 'warning');
      }
    }
  },

  // ---- Event popup ----
  showEventPopup(icon, title, description, effectText, effectClass) {
    var overlay = document.getElementById('event-overlay');
    var content = document.getElementById('event-content');
    content.innerHTML =
      '<div class="event-icon">' + icon + '</div>' +
      '<div class="event-title">' + title + '</div>' +
      '<div class="event-description">' + description + '</div>' +
      (effectText ? '<div class="event-effect ' + (effectClass || 'positive') + '">' + effectText + '</div>' : '');
    overlay.classList.add('active');

    // Auto-dismiss if auto-advance is running
    var speed = (GameEngine.state && GameEngine.state.autoAdvanceSpeed) || 0;
    if (speed > 0) {
      var dismissMs = speed >= 3 ? 800 : speed >= 2 ? 1500 : 2500;
      if (this._eventDismissTimer) clearTimeout(this._eventDismissTimer);
      this._eventDismissTimer = setTimeout(function() {
        overlay.classList.remove('active');
      }, dismissMs);
    }
  },

  // ---- Show modal ----
  showModal(title, bodyHTML, actions) {
    var modal = document.getElementById('modal-content');
    modal.innerHTML =
      '<div class="modal-header"><h3>' + title + '</h3></div>' +
      '<div class="modal-body">' + bodyHTML + '</div>' +
      (actions ? '<div class="modal-actions">' + actions + '</div>' : '');
    document.getElementById('modal-overlay').classList.add('active');
  },

  hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  // ---- Toggle map view ----
  toggleMapView() {
    this.mapView = !this.mapView;
    document.getElementById('world-map-container').style.display = this.mapView ? 'block' : 'none';
    document.getElementById('cities-list-view').style.display = this.mapView ? 'none' : '';
    document.getElementById('btn-map-toggle').textContent = this.mapView ? '📋 List' : '🗺️ Map';
  },

  // ---- Render World Map ----
  renderWorldMap() {
    var svg = document.getElementById('world-map-svg');
    var pins = document.getElementById('world-map-pins');

    // Draw simple continent shapes
    svg.innerHTML =
      '<rect width="1000" height="500" fill="#C8DFF0"/>' +
      // North America
      '<path d="M50,80 L180,60 L260,100 L280,180 L240,250 L200,280 L160,260 L120,300 L80,260 L40,200 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // South America
      '<path d="M220,310 L280,290 L320,330 L340,400 L320,460 L280,480 L240,450 L220,380 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // Europe
      '<path d="M420,60 L520,50 L560,80 L540,120 L520,150 L480,160 L440,140 L420,100 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // Africa
      '<path d="M440,180 L520,170 L560,220 L580,300 L560,380 L520,420 L480,400 L440,340 L430,260 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // Asia
      '<path d="M560,40 L700,30 L800,60 L860,100 L880,160 L840,200 L780,220 L700,210 L640,180 L580,150 L560,100 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // India
      '<path d="M640,180 L680,200 L700,260 L680,300 L640,280 L620,240 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // Southeast Asia
      '<path d="M720,220 L780,230 L800,280 L760,310 L720,290 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // Australia
      '<path d="M800,340 L900,330 L940,370 L920,420 L860,440 L800,420 L790,380 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>' +
      // Japan
      '<path d="M850,100 L870,90 L880,120 L870,150 L855,140 Z" fill="#D4CBA8" stroke="#C4B898" stroke-width="1.5"/>';

    // Render city pins
    var pinsHTML = '';
    GameData.cities.forEach(function(city) {
      var coords = GameData.cityCoords[city.id];
      if (!coords) return;
      var summary = GameEngine.getCitySummary(city.id);
      var hasOwned = summary.owned > 0;
      pinsHTML += '<div class="map-pin" data-city="' + city.id + '" style="left:' + coords.x + '%;top:' + coords.y + '%">' +
        '<div class="map-pin-dot ' + (hasOwned ? 'owned' : '') + '"></div>' +
        '<div class="map-pin-label">' + city.name + (hasOwned ? ' (' + summary.owned + ')' : '') + '</div>' +
      '</div>';
    });
    pins.innerHTML = pinsHTML;
  },

  // ---- Render Bank ----
  renderBank() {
    var content = document.getElementById('bank-content');
    var s = GameEngine.state;
    var loans = s.loans || [];
    var netWorth = GameEngine.getNetWorth();
    var savings = s.savingsBalance || 0;
    var savingsRate = s.savingsRate || 0.02;

    var html = '';

    // Savings account
    html += '<div class="finance-section">' +
      '<div class="finance-section-title">💰 Savings Account</div>' +
      '<div class="finance-card">' +
        '<div class="finance-row"><span class="finance-row-label">Balance</span><span class="finance-row-value">' + GameData.formatMoney(savings) + '</span></div>' +
        '<div class="finance-row"><span class="finance-row-label">Interest Rate</span><span class="finance-row-value positive">' + (savingsRate * 100).toFixed(1) + '% APR</span></div>' +
        '<div class="finance-row"><span class="finance-row-label">Monthly Interest</span><span class="finance-row-value positive">+' + GameData.formatMoney(Math.round(savings * savingsRate / 12)) + '</span></div>' +
        '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">' +
          '<button class="btn btn-primary btn-small" onclick="App.deposit(50000)">Deposit €50K</button>' +
          '<button class="btn btn-primary btn-small" onclick="App.deposit(100000)">€100K</button>' +
          '<button class="btn btn-primary btn-small" onclick="App.deposit(500000)">€500K</button>' +
          '<button class="btn btn-secondary btn-small" onclick="App.withdraw(50000)">Withdraw €50K</button>' +
          '<button class="btn btn-secondary btn-small" onclick="App.withdraw(100000)">€100K</button>' +
          (savings > 0 ? '<button class="btn btn-secondary btn-small" onclick="App.withdraw(' + savings + ')">All</button>' : '') +
        '</div>' +
      '</div>' +
    '</div>';

    // Investments (stocks & bonds)
    var investments = s.investments || [];
    html += '<div class="finance-section">' +
      '<div class="finance-section-title">📈 Investments</div>';

    if (investments.length > 0) {
      investments.forEach(function(inv) {
        var currentVal = inv.currentUnitPrice * inv.units;
        var gain = currentVal - inv.totalInvested;
        var gainPct = inv.totalInvested > 0 ? ((gain / inv.totalInvested) * 100).toFixed(1) : '0.0';
        html += '<div class="active-loan">' +
          '<div class="loan-info">' +
            '<div class="loan-info-bank">' + inv.icon + ' ' + inv.name + '</div>' +
            '<div class="loan-info-detail">' + inv.units + ' units · ' + GameData.formatMoney(currentVal) + ' <span class="' + (gain >= 0 ? 'text-success' : 'text-danger') + '">(' + (gain >= 0 ? '+' : '') + gainPct + '%)</span></div>' +
          '</div>' +
          '<div style="display:flex;gap:4px">' +
            '<button class="btn btn-small btn-primary" onclick="App.buyInvestment(\'' + inv.id + '\', 1)">+1</button>' +
            '<button class="btn btn-small btn-danger" onclick="App.sellInvestment(\'' + inv.id + '\', ' + inv.units + ')">Sell</button>' +
          '</div>' +
        '</div>';
      });
    }

    // Available investments to buy
    html += '<div class="finance-card mt-8"><div style="margin-bottom:8px"><strong>Buy Investments</strong></div>';
    var available = GameEngine.getAvailableInvestments();
    available.forEach(function(inv) {
      var typeBadge = inv.type === 'bond' ? '🔵 Bond' : '🟢 Stock';
      html += '<div class="finance-row" style="flex-wrap:wrap;gap:6px">' +
        '<div style="flex:1;min-width:150px">' +
          '<div style="font-weight:700;font-size:0.85rem">' + inv.icon + ' ' + inv.name + '</div>' +
          '<div style="font-size:0.7rem;color:var(--text-muted)">' + typeBadge + ' · ' + GameData.formatMoney(inv.unitPrice) + '/unit · Yield: ' + (inv.annualYield * 100).toFixed(1) + '% · Risk: ' + (inv.risk * 100).toFixed(0) + '%</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button class="btn btn-small btn-secondary" onclick="App.buyInvestment(\'' + inv.id + '\', 1)">1x</button>' +
          '<button class="btn btn-small btn-primary" onclick="App.buyInvestment(\'' + inv.id + '\', 5)">5x</button>' +
          '<button class="btn btn-small btn-accent" onclick="App.buyInvestment(\'' + inv.id + '\', 10)">10x</button>' +
        '</div>' +
      '</div>';
    });
    html += '</div></div>';

    // Active loans section
    if (loans.length > 0) {
      html += '<div class="finance-section"><div class="finance-section-title">Active Loans</div>';
      loans.forEach(function(loan) {
        html += '<div class="active-loan">' +
          '<div class="loan-info">' +
            '<div class="loan-info-bank">' + loan.bankName + '</div>' +
            '<div class="loan-info-detail">' + GameData.formatMoney(loan.remainingBalance) + ' remaining · ' + (loan.interestRate * 100).toFixed(1) + '% · ' + loan.monthsLeft + ' months left</div>' +
            '<div class="loan-info-detail">' + GameData.formatMoney(loan.monthlyPayment) + '/month</div>' +
          '</div>' +
          '<button class="btn btn-small btn-primary" onclick="App.repayLoan(\'' + loan.id + '\')">Repay</button>' +
        '</div>';
      });
      var totalDebt = loans.reduce(function(s, l) { return s + l.remainingBalance; }, 0);
      html += '<div class="action-info mt-8">Total debt: ' + GameData.formatMoney(totalDebt) + '</div>';
      html += '</div>';
    }

    // Loan amount selector
    html += '<div class="finance-section">' +
      '<div class="finance-section-title">Take a Loan</div>' +
      '<div class="finance-card">' +
        '<div style="margin-bottom:10px"><label class="settings-label">Loan Amount</label></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';

    var amounts = [50000, 100000, 250000, 500000, 1000000, 2000000];
    amounts.forEach(function(amt) {
      html += '<button class="btn btn-secondary btn-small" onclick="App.showLoanOffers(' + amt + ')">' + GameData.formatMoneyShort(amt) + '</button>';
    });
    html += '</div></div></div>';

    // Bank listings
    html += '<div class="finance-section"><div class="finance-section-title">Available Banks</div>';
    GameData.banks.forEach(function(bank) {
      var available = !bank.minNetWorth || netWorth >= bank.minNetWorth;
      html += '<div class="bank-card" style="' + (available ? '' : 'opacity:0.5') + '">' +
        '<div class="bank-header">' +
          '<span class="bank-icon">' + bank.icon + '</span>' +
          '<div><div class="bank-name">' + bank.name + '</div>' +
          '<div class="bank-description">' + bank.description + '</div></div>' +
        '</div>' +
        '<div class="city-info-bar">' +
          '<div class="city-info-chip">📊 Base rate: <strong>' + (bank.baseRate * 100).toFixed(1) + '%</strong></div>' +
          '<div class="city-info-chip">💰 Max: <strong>' + Math.round(bank.maxLoanPct * 100) + '% NW</strong></div>' +
          (bank.minNetWorth ? '<div class="city-info-chip">🔒 Min NW: <strong>' + GameData.formatMoneyShort(bank.minNetWorth) + '</strong></div>' : '') +
        '</div>' +
      '</div>';
    });
    html += '</div>';

    content.innerHTML = html;
  },

  // ---- Render Businesses in City ----
  renderCityBusinesses() {
    var cityId = this.currentCity;
    var businesses = (GameEngine.state.businesses || {})[cityId] || [];
    var ownedStakes = (GameEngine.state.ownedStakes || []).filter(function(s) { return s.cityId === cityId; });

    var grid = document.getElementById('city-properties');
    var empty = document.getElementById('city-empty');

    if (businesses.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      empty.querySelector('p').textContent = 'No businesses available in this city';
      return;
    }

    empty.style.display = 'none';
    var html = '';

    businesses.forEach(function(biz, i) {
      var typeDef = GameData.businessTypes[biz.type];
      var myStake = ownedStakes.find(function(s) { return s.businessId === biz.id; });
      var perfPct = Math.round(biz.performance * 100);
      var perfColor = perfPct >= 100 ? '#2A9D8F' : perfPct >= 70 ? '#F4A261' : '#E63946';

      html += '<div class="business-card" style="animation-delay:' + (i * 0.04) + 's">' +
        '<div class="business-card-header">' +
          '<span class="business-icon">' + typeDef.icon + '</span>' +
          '<div><div class="business-card-name">' + biz.name + '</div></div>' +
        '</div>' +
        '<div class="business-card-stats">' +
          '<div class="business-stat">Value: <strong>' + GameData.formatMoneyShort(biz.totalValue) + '</strong></div>' +
          '<div class="business-stat">Profit: <strong class="' + (biz.monthlyProfit >= 0 ? 'text-success' : 'text-danger') + '">' + GameData.formatMoney(biz.monthlyProfit) + '/mo</strong></div>' +
          '<div class="business-stat">Staff: <strong>' + biz.employees + '</strong></div>' +
          '<div class="business-stat">Available: <strong>' + biz.availableStake + '%</strong></div>' +
        '</div>' +
        '<div class="business-performance">' +
          '<span>Performance:</span>' +
          '<div class="perf-bar"><div class="perf-bar-fill" style="width:' + Math.min(100, perfPct) + '%;background:' + perfColor + '"></div></div>' +
          '<span>' + perfPct + '%</span>' +
        '</div>';

      if (myStake) {
        html += '<div class="city-info-chip" style="width:100%;margin-bottom:6px">You own <strong>' + myStake.stakePct + '%</strong> · Dividends: <strong>' + GameData.formatMoney(Math.round(biz.monthlyProfit * myStake.stakePct / 100 * biz.performance)) + '/mo</strong></div>';
        html += '<div style="display:flex;gap:6px">';
        if (biz.availableStake >= 5) {
          html += '<button class="btn btn-primary btn-small" style="flex:1" onclick="App.buyStake(\'' + biz.id + '\', \'' + cityId + '\', 10)">Buy 10%</button>';
        }
        html += '<button class="btn btn-danger btn-small" style="flex:1" onclick="App.sellStake(\'' + biz.id + '\')">Sell Stake</button>';
        html += '</div>';
      } else if (biz.availableStake >= 5) {
        html += '<div style="display:flex;gap:6px">';
        html += '<button class="btn btn-secondary btn-small" style="flex:1" onclick="App.buyStake(\'' + biz.id + '\', \'' + cityId + '\', 5)">Buy 5% · ' + GameData.formatMoneyShort(Math.round(biz.totalValue * 0.05)) + '</button>';
        html += '<button class="btn btn-primary btn-small" style="flex:1" onclick="App.buyStake(\'' + biz.id + '\', \'' + cityId + '\', 10)">Buy 10% · ' + GameData.formatMoneyShort(Math.round(biz.totalValue * 0.10)) + '</button>';
        if (biz.availableStake >= 25) {
          html += '<button class="btn btn-accent btn-small" style="flex:1" onclick="App.buyStake(\'' + biz.id + '\', \'' + cityId + '\', 25)">25%</button>';
        }
        html += '</div>';
      } else {
        html += '<div class="action-info">Fully invested</div>';
      }

      html += '</div>';
    });

    grid.innerHTML = html;
  },

  // ---- Auto-advance controls ----
  setAutoAdvance(speed) {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }

    GameEngine.state.autoAdvanceSpeed = speed;
    var intervals = { 0: 0, 1: 3000, 2: 1500, 3: 600 };
    var ms = intervals[speed] || 0;

    if (ms > 0) {
      this.autoTimer = setInterval(function() { App.advanceMonth(); }, ms);
    }
    GameEngine.save();
  },

  renderSpeedControls() {
    var speed = (GameEngine.state && GameEngine.state.autoAdvanceSpeed) || 0;
    return '<div class="speed-controls">' +
      '<span style="font-size:0.7rem;font-weight:700;color:var(--text-muted)">Speed:</span>' +
      '<button class="speed-btn ' + (speed === 0 ? 'active' : '') + '" onclick="GameUI.setAutoAdvance(0)">⏸</button>' +
      '<button class="speed-btn ' + (speed === 1 ? 'active' : '') + '" onclick="GameUI.setAutoAdvance(1)">▶</button>' +
      '<button class="speed-btn ' + (speed === 2 ? 'active' : '') + '" onclick="GameUI.setAutoAdvance(2)">▶▶</button>' +
      '<button class="speed-btn ' + (speed === 3 ? 'active' : '') + '" onclick="GameUI.setAutoAdvance(3)">▶▶▶</button>' +
    '</div>';
  }
};
