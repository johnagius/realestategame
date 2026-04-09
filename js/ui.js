/* ========================================
   PROPERTY EMPIRE - UI Rendering (Part 1)
   ======================================== */

const GameUI = {

  currentScreen: 'splash',
  currentCity: null,
  currentProperty: null,
  currentCityTab: 'market',
  currentPortfolioFilter: 'all',

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
      case 'finances': this.renderFinances(); break;
      case 'settings': this.renderSettings(); break;
    }
  },

  // ---- Update HUD ----
  updateHUD() {
    const s = GameEngine.state;
    if (!s) return;
    document.getElementById('hud-cash').textContent = GameData.formatMoney(s.cash);
    document.getElementById('hud-date').textContent = GameEngine.getDateString();
    document.getElementById('hud-networth').textContent = GameData.formatMoney(GameEngine.getNetWorth());
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

  // ---- Render Map (Cities grid) ----
  renderMap() {
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
      html += '<div class="city-card" data-tier="' + city.tier + '" data-city="' + city.id + '" style="animation-delay:' + (i * 0.05) + 's">' +
        '<div class="city-card-header">' +
          '<span class="city-flag">' + city.flag + '</span>' +
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
  },

  // ---- Render Settings ----
  renderSettings() {
    var content = document.getElementById('settings-content');
    content.innerHTML =
      '<div class="settings-section">' +
        '<div class="settings-row"><div><div class="settings-label">Save Game</div><div class="settings-description">Game saves automatically each month</div></div><button class="btn btn-primary btn-small" onclick="GameEngine.save(); GameUI.toast(\'Game saved!\', \'success\')">Save Now</button></div>' +
        '<div class="settings-row"><div><div class="settings-label">New Game</div><div class="settings-description">Start fresh with €500,000</div></div><button class="btn btn-danger btn-small" onclick="App.confirmNewGame()">Reset</button></div>' +
      '</div>' +
      '<div class="settings-section">' +
        '<div class="settings-row"><div><div class="settings-label">Property Empire</div><div class="settings-description">v1.0 — Build your real estate fortune</div></div></div>' +
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

    // Basic summary toast
    if (!hasDisasters && !hasEvents) {
      var net = results.rentIncome - results.expenses;
      if (results.rentIncome > 0) {
        GameUI.toast('Month complete: +' + GameData.formatMoney(results.rentIncome) + ' rent, -' + GameData.formatMoney(results.expenses) + ' costs', net >= 0 ? 'success' : 'warning');
      } else {
        GameUI.toast('Month complete', 'info');
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
  }
};
