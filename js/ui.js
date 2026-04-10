/* ========================================
   PROPERTY EMPIRE - UI Rendering (Part 1)
   ======================================== */

const GameUI = {

  currentScreen: 'splash',
  currentCity: null,
  currentProperty: null,
  cityMapView: false,
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
    var era = GameEngine.getCurrentEra();
    dateEl.textContent = GameEngine.getDateString();
    dateEl.title = era.name;
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
    var speed = (GameEngine.state && GameEngine.state.autoAdvanceSpeed) || 0;
    var isAutoPlaying = speed > 0;

    // Era transitions
    if (results.eraChange) {
      var era = results.eraChange.newEra;
      this.showEventPopup(era.icon, 'New Era: ' + era.name, era.description, '', 'positive');
      return; // Let them read this important message
    }

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

    // Dividends - only show when not in fast auto-play
    if (results.dividends > 0 && (!isAutoPlaying || speed <= 1)) {
      GameUI.toast('💼 Dividends received: +' + GameData.formatMoney(results.dividends), 'success');
    }

    // Milestones
    if (results.milestones) {
      results.milestones.forEach(function(m) {
        GameUI.toast(m.icon + ' Milestone: ' + m.name + '!', 'milestone');
      });
    }

    // Basic summary toast - skip during fast auto-play to reduce noise
    if (!isAutoPlaying || speed === 1) {
      if (!hasDisasters && !hasEvents && !(results.milestones && results.milestones.length)) {
        var net = results.rentIncome - results.expenses;
        if (results.rentIncome > 0 && !isAutoPlaying) {
          GameUI.toast('Month complete: +' + GameData.formatMoney(results.rentIncome) + ' rent, -' + GameData.formatMoney(results.expenses) + ' costs', net >= 0 ? 'success' : 'warning');
        }
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

    if (!this._mapLoaded) {
      svg.innerHTML =
        '<defs>' +
          '<linearGradient id="oc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6BA3BE"/><stop offset="100%" stop-color="#4A8AA8"/></linearGradient>' +
          '<linearGradient id="ln" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8DB87C"/><stop offset="100%" stop-color="#6D9B5A"/></linearGradient>' +
          '<filter id="ls"><feGaussianBlur stdDeviation="2"/></filter>' +
        '</defs>' +
        '<rect width="1200" height="600" fill="url(#oc)"/>' +
        // Subtle grid
        '<g opacity="0.08" stroke="#fff" stroke-width="0.5">' +
          '<line x1="0" y1="100" x2="1200" y2="100"/><line x1="0" y1="200" x2="1200" y2="200"/>' +
          '<line x1="0" y1="300" x2="1200" y2="300"/><line x1="0" y1="400" x2="1200" y2="400"/>' +
          '<line x1="0" y1="500" x2="1200" y2="500"/>' +
          '<line x1="200" y1="0" x2="200" y2="600"/><line x1="400" y1="0" x2="400" y2="600"/>' +
          '<line x1="600" y1="0" x2="600" y2="600"/><line x1="800" y1="0" x2="800" y2="600"/>' +
          '<line x1="1000" y1="0" x2="1000" y2="600"/>' +
        '</g>' +
        // Shadow layer
        '<g filter="url(#ls)" opacity="0.3">' +
          '<path d="M95,75 C130,55 200,50 250,58 C290,65 320,78 335,100 C345,115 340,140 330,158 C322,172 330,188 335,200 C340,215 332,235 315,245 C298,252 280,258 270,268 C255,280 240,288 218,282 C198,276 178,268 162,278 C142,290 125,275 112,260 C98,242 85,220 78,198 C72,178 70,155 75,135 C80,115 85,95 95,75Z" fill="#555"/>' +
          '<path d="M248,320 C268,308 290,310 308,318 C325,328 338,348 345,372 C350,395 348,420 340,445 C330,465 314,478 295,485 C275,490 258,480 248,465 C238,448 232,425 228,400 C224,375 230,345 248,320Z" fill="#555"/>' +
          '<path d="M475,70 C510,58 545,62 565,72 C580,80 598,70 612,78 C628,88 638,105 632,125 C625,142 612,155 595,162 C575,168 558,165 542,170 C525,175 508,168 495,158 C480,145 470,128 468,110 C466,92 470,78 475,70Z" fill="#555"/>' +
          '<path d="M495,195 C520,185 548,188 570,198 C592,210 610,232 620,260 C628,288 630,318 625,348 C618,378 605,405 585,422 C562,440 535,445 512,435 C492,425 478,405 470,380 C462,352 458,322 460,292 C462,262 472,230 495,195Z" fill="#555"/>' +
          '<path d="M580,60 C640,45 710,38 780,42 C840,48 895,62 940,58 C970,55 995,68 1000,88 C1005,108 998,128 980,138 C958,150 930,145 905,150 C878,155 850,148 825,155 C798,162 770,158 742,162 C715,165 688,158 662,162 C638,165 615,155 600,142 C585,128 576,108 574,88 C572,72 575,62 580,60Z" fill="#555"/>' +
          '<path d="M700,200 C725,190 750,195 768,212 C782,228 790,252 785,278 C778,302 762,318 742,325 C720,330 700,322 688,305 C675,288 668,265 670,242 C672,220 682,205 700,200Z" fill="#555"/>' +
          '<path d="M820,260 C845,252 870,258 888,272 C902,285 908,305 900,322 C892,338 875,348 855,345 C835,342 818,330 812,312 C805,295 808,272 820,260Z" fill="#555"/>' +
          '<path d="M940,118 C952,108 968,112 975,125 C980,138 978,155 968,165 C958,175 945,172 938,160 C932,148 932,130 940,118Z" fill="#555"/>' +
          '<path d="M895,370 C930,358 968,365 998,380 C1022,395 1035,418 1028,442 C1020,462 1000,475 975,478 C948,480 922,472 902,458 C885,442 878,420 882,400 C886,382 890,372 895,370Z" fill="#555"/>' +
        '</g>' +
        // Land masses
        '<g>' +
          // North America
          '<path d="M95,70 C130,50 200,45 250,53 C290,60 320,73 335,95 C345,110 340,135 330,153 C322,167 330,183 335,195 C340,210 332,230 315,240 C298,247 280,253 270,263 C255,275 240,283 218,277 C198,271 178,263 162,273 C142,285 125,270 112,255 C98,237 85,215 78,193 C72,173 70,150 75,130 C80,110 85,90 95,70Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1.5"/>' +
          // Greenland
          '<path d="M330,22 C355,15 380,22 395,38 C405,52 400,70 385,78 C368,85 348,80 335,68 C322,55 320,35 330,22Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1"/>' +
          // South America
          '<path d="M248,315 C268,303 290,305 308,313 C325,323 338,343 345,367 C350,390 348,415 340,440 C330,460 314,473 295,480 C275,485 258,475 248,460 C238,443 232,420 228,395 C224,370 230,340 248,315Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1.5"/>' +
          // Europe
          '<path d="M475,65 C510,53 545,57 565,67 C580,75 598,65 612,73 C628,83 638,100 632,120 C625,137 612,150 595,157 C575,163 558,160 542,165 C525,170 508,163 495,153 C480,140 470,123 468,105 C466,87 470,73 475,65Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1.5"/>' +
          // UK + Ireland
          '<path d="M458,72 C468,65 478,68 482,78 C485,88 480,98 472,102 C464,105 456,100 454,90 C452,82 454,75 458,72Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1"/>' +
          // Africa
          '<path d="M495,190 C520,180 548,183 570,193 C592,205 610,227 620,255 C628,283 630,313 625,343 C618,373 605,400 585,417 C562,435 535,440 512,430 C492,420 478,400 470,375 C462,347 458,317 460,287 C462,257 472,225 495,190Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1.5"/>' +
          // Madagascar
          '<path d="M638,370 C645,362 652,368 652,380 C652,392 648,402 640,405 C633,400 632,388 635,378Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="0.8"/>' +
          // Russia/Asia
          '<path d="M580,55 C640,40 710,33 780,37 C840,43 895,57 940,53 C970,50 995,63 1000,83 C1005,103 998,123 980,133 C958,145 930,140 905,145 C878,150 850,143 825,150 C798,157 770,153 742,157 C715,160 688,153 662,157 C638,160 615,150 600,137 C585,123 576,103 574,83 C572,67 575,57 580,55Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1.5"/>' +
          // Middle East
          '<path d="M620,170 C642,162 660,168 672,180 C682,192 685,208 678,222 C668,235 652,240 638,235 C622,228 612,215 610,198 C608,182 612,172 620,170Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1"/>' +
          // India
          '<path d="M700,195 C725,185 750,190 768,207 C782,223 790,247 785,273 C778,297 762,313 742,320 C720,325 700,317 688,300 C675,283 668,260 670,237 C672,215 682,200 700,195Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1.2"/>' +
          // Southeast Asia
          '<path d="M820,255 C845,247 870,253 888,267 C902,280 908,300 900,317 C892,333 875,343 855,340 C835,337 818,325 812,307 C805,290 808,267 820,255Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1"/>' +
          // Japan
          '<path d="M940,113 C952,103 968,107 975,120 C980,133 978,150 968,160 C958,170 945,167 938,155 C932,143 932,125 940,113Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1"/>' +
          // Australia
          '<path d="M895,365 C930,353 968,360 998,375 C1022,390 1035,413 1028,437 C1020,457 1000,470 975,473 C948,475 922,467 902,453 C885,437 878,415 882,395 C886,377 890,367 895,365Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="1.5"/>' +
          // NZ
          '<path d="M1055,440 C1062,432 1070,438 1068,450 C1066,460 1058,465 1052,458 C1048,452 1050,445 1055,440Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="0.8"/>' +
          // Indonesia islands
          '<path d="M830,310 C845,305 860,310 868,320 C872,328 865,335 850,335 C838,335 828,328 828,318Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="0.8"/>' +
          '<path d="M875,315 C885,312 895,318 895,328 C895,335 888,338 880,335 C872,332 870,322 875,315Z" fill="url(#ln)" stroke="#5A8A48" stroke-width="0.8"/>' +
        '</g>';
      this._mapLoaded = true;
    }

    // Render city pins with landmarks
    var pinsHTML = '';
    GameData.cities.forEach(function(city) {
      var coords = GameData.cityCoords[city.id];
      if (!coords) return;
      var summary = GameEngine.getCitySummary(city.id);
      var hasOwned = summary.owned > 0;
      var lm = GameData.cityLandmarks[city.id] || {};
      var pinIcon = lm.landmark || '📍';

      pinsHTML += '<div class="map-pin" data-city="' + city.id + '" style="left:' + coords.x + '%;top:' + coords.y + '%">' +
        '<div class="map-pin-icon">' + pinIcon + '</div>' +
        '<div class="map-pin-label' + (hasOwned ? ' map-pin-owned' : '') + '">' + city.name + (hasOwned ? ' (' + summary.owned + ')' : '') + '</div>' +
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

    // Player-owned banks
    var playerBanks = s.playerBanks || [];
    var era = GameEngine.getCurrentEra();

    if (playerBanks.length > 0) {
      html += '<div class="finance-section"><div class="finance-section-title">🏦 Your Banks</div>';
      playerBanks.forEach(function(bank) {
        html += '<div class="bank-card">' +
          '<div class="bank-header"><span class="bank-icon">🏦</span><div><div class="bank-name">' + bank.name + '</div>' +
          '<div class="bank-description">Reputation: ' + Math.round(bank.reputation) + '/100 · ' + bank.loansOut.length + ' active loans</div></div></div>' +
          '<div class="city-info-bar">' +
            '<div class="city-info-chip">💰 Capital: <strong>' + GameData.formatMoney(bank.capital) + '</strong></div>' +
            '<div class="city-info-chip">🏧 Reserves: <strong>' + GameData.formatMoney(bank.reserves) + '</strong></div>' +
            '<div class="city-info-chip">📈 Profit: <strong class="text-success">' + GameData.formatMoney(bank.monthlyProfit) + '/mo</strong></div>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    } else if (era.features.playerBanks && GameEngine.canOpenBank()) {
      html += '<div class="finance-section"><div class="finance-card text-center">' +
        '<p style="margin-bottom:10px;font-weight:700">You have enough capital to open your own bank!</p>' +
        '<button class="btn btn-primary" onclick="App.openBank()">🏦 Open a Bank</button>' +
      '</div></div>';
    }

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
        var control = GameEngine.getControlLevel(myStake.stakePct);
        html += '<div class="city-info-chip" style="width:100%;margin-bottom:4px;justify-content:space-between">' +
          '<span>You own <strong>' + myStake.stakePct + '%</strong></span>' +
          '<span style="color:' + control.color + ';font-weight:800">' + control.label + '</span>' +
        '</div>';
        html += '<div class="city-info-chip" style="width:100%;margin-bottom:6px">Dividends: <strong>' + GameData.formatMoney(Math.round(biz.monthlyProfit * myStake.stakePct / 100 * biz.performance)) + '/mo</strong></div>';
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
        if (biz.availableStake >= 5) {
          html += '<button class="btn btn-primary btn-small" style="flex:1" onclick="App.buyStake(\'' + biz.id + '\', \'' + cityId + '\', 10)">+10%</button>';
        }
        if (biz.availableStake >= 25) {
          html += '<button class="btn btn-accent btn-small" style="flex:1" onclick="App.buyStake(\'' + biz.id + '\', \'' + cityId + '\', 25)">+25%</button>';
        }
        // Merger button if controlling and another biz exists
        if (myStake.stakePct >= 51 && GameEngine.canMerge()) {
          var otherBiz = businesses.filter(function(b) { return b.id !== biz.id; });
          if (otherBiz.length > 0) {
            html += '<button class="btn btn-ghost btn-small" style="flex:1" onclick="App.showMergerOptions(\'' + biz.id + '\', \'' + cityId + '\')">🤝 Merge</button>';
          }
        }
        html += '<button class="btn btn-danger btn-small" style="flex:1" onclick="App.sellStake(\'' + biz.id + '\')">Sell</button>';
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

  // ---- Toggle city view ----
  toggleCityView() {
    this.cityMapView = !this.cityMapView;
    document.getElementById('city-map-view').style.display = this.cityMapView ? 'block' : 'none';
    document.getElementById('city-list-view').style.display = this.cityMapView ? 'none' : '';
    document.getElementById('btn-city-view-toggle').textContent = this.cityMapView ? '📋 List View' : '🏙️ City View';
    if (this.cityMapView) this.renderCityMap();
  },

  // ---- Render City Map ----
  renderCityMap() {
    var cityId = this.currentCity;
    var city = GameData.cities.find(function(c) { return c.id === cityId; });
    if (!city) return;

    var market = GameEngine.state.marketProperties[cityId] || [];
    var owned = GameEngine.state.properties.filter(function(p) { return p.cityId === cityId; });
    var allProps = market.concat(owned);
    var lm = GameData.cityLandmarks[cityId] || {};

    var container = document.getElementById('city-map');
    var html = '';

    // Roads
    html += '<div class="city-map-road horizontal" style="top:35%"></div>';
    html += '<div class="city-map-road horizontal" style="top:65%"></div>';
    html += '<div class="city-map-road vertical" style="left:30%"></div>';
    html += '<div class="city-map-road vertical" style="left:65%"></div>';

    // River
    html += '<div class="city-map-river" style="width:80%;height:8px;top:50%;left:10%;transform:rotate(-5deg)"></div>';

    // Landmark
    if (lm.landmark) {
      html += '<div class="city-landmark" style="left:45%;top:40%">' + lm.landmark + '</div>';
    }

    // District label
    var districts = GameData.districts[cityId] || [];
    if (districts.length > 0) {
      html += '<div class="city-map-label" style="left:5%;top:8%">' + districts[0] + '</div>';
      if (districts[1]) html += '<div class="city-map-label" style="right:5%;top:8%">' + districts[1] + '</div>';
      if (districts[2]) html += '<div class="city-map-label" style="left:5%;bottom:8%">' + districts[2] + '</div>';
      if (districts[3]) html += '<div class="city-map-label" style="right:5%;bottom:8%">' + districts[3] + '</div>';
    }

    // Place buildings on the map
    allProps.forEach(function(p, i) {
      var typeDef = GameData.propertyTypes[p.type] || {};
      var isOwned = p.isOwned;

      // Distribute buildings in a grid-like pattern with some randomness
      var cols = Math.ceil(Math.sqrt(allProps.length + 2));
      var row = Math.floor(i / cols);
      var col = i % cols;
      var xPct = 8 + (col / cols) * 80 + (Math.sin(i * 3.7) * 4);
      var yPct = 10 + (row / Math.ceil(allProps.length / cols)) * 75 + (Math.cos(i * 2.3) * 4);

      html += '<div class="city-building ' + (isOwned ? 'owned' : '') + '" data-property="' + p.id + '" data-city="' + p.cityId + '" style="left:' + xPct + '%;top:' + yPct + '%">' +
        '<span class="city-building-icon">' + (typeDef.icon || '🏠') + '</span>' +
        '<span class="city-building-name">' + (p.district || '') + '</span><br>' +
        '<span class="city-building-price">' + GameData.formatMoneyShort(p.currentValue) + '</span>' +
      '</div>';
    });

    container.innerHTML = html;
  },

  // ---- Auto-advance controls ----
  setAutoAdvance(speed) {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }

    GameEngine.state.autoAdvanceSpeed = speed;
    var intervals = { 0: 0, 1: 5000, 2: 2500, 3: 1200 };
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
