/* ========================================
   PROPERTY EMPIRE - UI Rendering (Part 1)
   ======================================== */

const GameUI = {

  currentScreen: 'splash',
  currentCity: null,
  currentProperty: null,
  cityMapView: false,
  cityPage: 0,
  PAGE_SIZE: 6,
  currentCityTab: 'market',
  currentPortfolioFilter: 'all',
  citySort: 'price-asc',
  cityTypeFilter: 'all',
  portfolioSort: 'value-desc',
  portfolioCityFilter: 'all',
  compareList: [], // array of property IDs (max 3)
  portfolioPage: 0,
  mapView: true,
  autoTimer: null,

  // ---- Show a screen ----
  showScreen(screenId, data) {
    // Cleanup 3D city when leaving city screen
    if (this.currentScreen === 'city' && screenId !== 'city' && typeof City3D !== 'undefined') {
      City3D.destroy();
    }
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
    // Show era name + generation + social tier
    var head = s.familyMembers ? s.familyMembers.find(function(m){return m.isHead;}) : null;
    var tierLabel = s.socialTier || '';
    dateEl.textContent = GameEngine.getDateString() + (tierLabel ? ' · ' + tierLabel : '');
    dateEl.title = era.name + (head ? ' | ' + head.name + ', age ' + head.age + ' (' + head.trait + ')' : '');
    document.getElementById('hud-networth').textContent = GameData.formatMoney(GameEngine.getNetWorth());
    // Speed controls in HUD
    document.getElementById('hud-speed').innerHTML = this.renderSpeedControls();
    // Goal + cycle in merged ticker bar (right side)
    var goalEl = document.getElementById('hud-ticker-goal');
    if (goalEl) {
      var cycleIcons = { boom:'📈', growth:'📊', stagnation:'📉', recession:'🔻', depression:'💥' };
      var cycleLabel = cycleIcons[s.economicCycle || 'growth'] || '📊';
      var goalText = '';
      if (s.goals && s.goals.monthly) {
        var g = s.goals.monthly;
        goalText = g.done ? '✅ Done' : '🎯 ' + g.text;
      }
      goalEl.innerHTML = cycleLabel + ' ' + (s.economicCycle || 'growth') + ' | ' + goalText;
    }
  },

  // Show floating income/expense summary near HUD
  showFloatingIncome: function(income, expenses) {
    var net = income - expenses;
    // Create floating element
    var el = document.createElement('div');
    el.className = 'float-income-summary';
    el.innerHTML = '<span class="positive">+' + GameData.formatMoney(income) + '</span>';
    if (expenses > 0) el.innerHTML += ' <span class="negative">-' + GameData.formatMoney(expenses) + '</span>';
    el.innerHTML += ' = <strong class="' + (net >= 0 ? 'positive' : 'negative') + '">' + (net >= 0 ? '+' : '') + GameData.formatMoney(net) + '</strong>';
    document.body.appendChild(el);
    // Position at top center, below HUD
    el.style.left = '50%';
    el.style.top = '52px';
    // Remove after animation
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
  },

  // ---- Visual Feedback Animations ----
  animateIncome(amount) {
    var el = document.createElement('div');
    el.className = 'float-number income';
    el.textContent = '+' + GameData.formatMoney(amount);
    // Position near the cash display
    var cashEl = document.getElementById('hud-cash');
    if (cashEl) {
      var rect = cashEl.getBoundingClientRect();
      el.style.left = rect.left + 'px';
      el.style.top = (rect.bottom + 4) + 'px';
    } else {
      el.style.left = '20px';
      el.style.top = '60px';
    }
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 1600);
  },

  animateExpense(amount) {
    var el = document.createElement('div');
    el.className = 'float-number expense';
    el.textContent = '-' + GameData.formatMoney(amount);
    var cashEl = document.getElementById('hud-cash');
    if (cashEl) {
      var rect = cashEl.getBoundingClientRect();
      el.style.left = rect.left + 'px';
      el.style.top = (rect.bottom + 4) + 'px';
    }
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 1300);
  },

  animateConfetti() {
    var colors = ['#D4A84B', '#F0D68A', '#2C6E49', '#E07A5F', '#3D5A80', '#F4A261'];
    for (var i = 0; i < 30; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = (20 + Math.random() * 60) + 'vw';
      piece.style.top = (10 + Math.random() * 30) + 'vh';
      piece.style.width = (4 + Math.random() * 8) + 'px';
      piece.style.height = (4 + Math.random() * 8) + 'px';
      piece.style.animation = 'confettiBurst ' + (1 + Math.random()) + 's ease-out ' + (Math.random() * 0.3) + 's forwards';
      document.body.appendChild(piece);
      setTimeout(function() { piece.remove(); }, 2500);
    }
  },

  // ---- Toast notification ----
  toast(message, type) {
    type = type || 'info';
    // Suppress non-critical toasts during fast auto-play (speed >= 2)
    var speed = (typeof GameEngine !== 'undefined' && GameEngine.state) ? (GameEngine.state.autoAdvanceSpeed || 0) : 0;
    if (speed >= 2 && type !== 'error') return;
    var container = document.getElementById('toast-container');
    // Cap visible toasts at 5
    while (container.children.length >= 5) container.removeChild(container.firstChild);
    var toast = document.createElement('div');
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

    // Only rebuild DOM on first render or search change — otherwise just update values
    var existing = grid.querySelectorAll('.city-card');
    var needsRebuild = existing.length !== cities.length || this._lastSearch !== search;
    this._lastSearch = search;

    if (needsRebuild) {
      var html = '';
      cities.forEach(function(city, i) {
        var lm = GameData.cityLandmarks[city.id] || {};
        html += '<div class="city-card" data-tier="' + city.tier + '" data-city="' + city.id + '">' +
          '<div class="city-card-header">' +
            '<span class="city-flag">' + (lm.landmark || city.flag) + '</span>' +
            '<div>' +
              '<div class="city-card-name">' + city.name + '</div>' +
              '<div class="city-card-country">' + city.country + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="city-card-stats">' +
            '<div class="city-stat"><span class="city-stat-value" data-stat="available"></span><span class="city-stat-label">For Sale</span></div>' +
            '<div class="city-stat"><span class="city-stat-value" data-stat="owned"></span><span class="city-stat-label">Owned</span></div>' +
            '<div class="city-stat"><span class="city-stat-value" data-stat="avgPrice"></span><span class="city-stat-label">Avg Price</span></div>' +
          '</div>' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">' +
            '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px" data-stat="tax"></span>' +
            '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px" data-stat="growth"></span>' +
            '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px" data-stat="yield"></span>' +
            '<span class="city-info-chip" style="font-size:0.6rem;padding:2px 6px" data-stat="inflation"></span>' +
          '</div>' +
        '</div>';
      });
      grid.innerHTML = html;
    }

    // Update just the dynamic values (no DOM rebuild flicker)
    var cards = grid.querySelectorAll('.city-card');
    cards.forEach(function(card) {
      var cityId = card.getAttribute('data-city');
      var city = GameData.cities.find(function(c) { return c.id === cityId; });
      if (!city) return;
      var summary = GameEngine.getCitySummary(cityId);
      var inflRate = city.inflationRate !== undefined ? city.inflationRate : 0.02;

      var els = card.querySelectorAll('[data-stat]');
      els.forEach(function(el) {
        var stat = el.getAttribute('data-stat');
        if (stat === 'available') el.textContent = summary.available;
        else if (stat === 'owned') el.textContent = summary.owned;
        else if (stat === 'avgPrice') el.textContent = GameData.formatMoneyShort(summary.avgPrice);
        else if (stat === 'tax') el.textContent = '📊 Tax ' + Math.round(city.taxRate * 100) + '%';
        else if (stat === 'growth') el.textContent = '📈 ' + (city.growthRate * 100).toFixed(1) + '%';
        else if (stat === 'yield') el.textContent = '🏠 ' + (city.rentYield * 100).toFixed(1) + '%';
        else if (stat === 'inflation') el.textContent = '💹 ' + (inflRate * 100).toFixed(1) + '%';
      });
    });
  },

  // ---- Render City ----
  renderCity(cityId) {
    if (cityId) this.currentCity = cityId;
    var city = GameData.cities.find(function(c) { return c.id === GameUI.currentCity; });
    if (!city) return;

    document.getElementById('city-title').textContent = city.flag + ' ' + city.name;
    this.cityPage = 0; // reset pagination

    // City info chips
    var info = document.getElementById('city-info');
    var inflationRate = city.inflationRate !== undefined ? city.inflationRate : 0.02;
    info.innerHTML =
      '<div class="city-info-chip">📊 Tax: <strong>' + Math.round(city.taxRate * 100) + '%</strong></div>' +
      '<div class="city-info-chip">📈 Growth: <strong>' + (city.growthRate * 100).toFixed(1) + '%/yr</strong></div>' +
      '<div class="city-info-chip">💹 Inflation: <strong>' + (inflationRate * 100).toFixed(1) + '%</strong></div>' +
      '<div class="city-info-chip">🏠 Yield: <strong>' + (city.rentYield * 100).toFixed(1) + '%</strong></div>';

    // Auto-show 3D city view if definition exists
    var mapView = document.getElementById('city-map-view');
    var has3D = this._city3dDefs[this.currentCity] && typeof City3D !== 'undefined' && typeof THREE !== 'undefined';
    if (has3D) {
      mapView.style.display = 'block';
      this.cityMapView = true;
      this.renderCityMap();
      document.getElementById('btn-city-view-toggle').textContent = '📋 List View';
    } else {
      // Cleanup any leftover 3D
      if (typeof City3D !== 'undefined') City3D.destroy();
      mapView.style.display = 'none';
      this.cityMapView = false;
      document.getElementById('btn-city-view-toggle').textContent = '🏙️ City View';
    }

    // Always show list view below the 3D scene
    document.getElementById('city-list-view').style.display = '';

    // Render properties based on tab
    this.renderCityProperties();
  },

  // Sort an array of properties by the given sort key
  sortProperties: function(props, sortKey) {
    var sorted = props.slice(); // clone
    var condOrder = { derelict: 0, poor: 1, fair: 2, good: 3, excellent: 4 };
    sorted.sort(function(a, b) {
      switch (sortKey) {
        case 'price-asc':  return a.currentValue - b.currentValue;
        case 'price-desc': return b.currentValue - a.currentValue;
        case 'value-asc':  return a.currentValue - b.currentValue;
        case 'value-desc': return b.currentValue - a.currentValue;
        case 'rent-desc':  return (b.monthlyRent || 0) - (a.monthlyRent || 0);
        case 'yield-desc':
          var ya = a.currentValue > 0 ? (a.monthlyRent || 0) * 12 / a.currentValue : 0;
          var yb = b.currentValue > 0 ? (b.monthlyRent || 0) * 12 / b.currentValue : 0;
          return yb - ya;
        case 'size-desc':   return (b.size || 0) - (a.size || 0);
        case 'condition-desc': return (condOrder[b.condition] || 0) - (condOrder[a.condition] || 0);
        case 'condition-asc':  return (condOrder[a.condition] || 0) - (condOrder[b.condition] || 0);
        case 'appreciation-desc': return (b.appreciation || 0) - (a.appreciation || 0);
        case 'city': return (a.cityId || '').localeCompare(b.cityId || '');
        case 'type': return (a.type || '').localeCompare(b.type || '');
        default: return 0;
      }
    });
    return sorted;
  },

  renderCityProperties() {
    var cityId = this.currentCity;
    var tab = this.currentCityTab;

    // Show/hide sort bar based on tab
    var sortBar = document.getElementById('city-sort-bar');
    if (sortBar) sortBar.style.display = (tab === 'businesses') ? 'none' : 'flex';

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

    // Apply type filter
    if (this.cityTypeFilter && this.cityTypeFilter !== 'all') {
      var tf = this.cityTypeFilter;
      props = props.filter(function(p) { return p.type === tf; });
    }

    // Apply sort
    props = this.sortProperties(props, this.citySort);

    var grid = document.getElementById('city-properties');
    var empty = document.getElementById('city-empty');

    if (props.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      empty.querySelector('p').textContent = tab === 'market' ? 'No properties for sale right now' : 'You don\'t own any properties here';
      return;
    }

    empty.style.display = 'none';

    // Paginate
    var total = props.length;
    var ps = this.PAGE_SIZE;
    var maxPage = Math.max(0, Math.ceil(total / ps) - 1);
    if (this.cityPage > maxPage) this.cityPage = maxPage;
    var start = this.cityPage * ps;
    var pageProps = props.slice(start, start + ps);

    var html = pageProps.map(function(p, i) { return GameUI.renderPropertyCard(p, start + i); }).join('');

    // Pagination controls
    if (total > ps) {
      html += '<div style="grid-column:1/-1;display:flex;justify-content:center;gap:8px;padding:8px 0;align-items:center">';
      html += '<button class="btn btn-ghost btn-small" onclick="GameUI.cityPage=Math.max(0,GameUI.cityPage-1);GameUI.renderCityProperties()" ' + (this.cityPage <= 0 ? 'disabled' : '') + '>← Prev</button>';
      html += '<span style="font-size:0.75rem;font-weight:700;color:var(--text-muted)">' + (this.cityPage + 1) + ' / ' + (maxPage + 1) + ' (' + total + ' total)</span>';
      html += '<button class="btn btn-ghost btn-small" onclick="GameUI.cityPage=Math.min('+ maxPage+',GameUI.cityPage+1);GameUI.renderCityProperties()" ' + (this.cityPage >= maxPage ? 'disabled' : '') + '>Next →</button>';
      html += '</div>';
    }

    grid.innerHTML = html;
  },

  // ---- Render a property card ----
  renderPropertyCard(p, index) {
    var typeDef = GameData.propertyTypes[p.type];
    var condDef = GameData.conditions[p.condition];
    var delay = (index || 0) * 0.04;

    var badge = '';
    if (p.isOwned && p.isRented) badge = '<span class="property-badge badge-rented">Rented</span>';
    else if (p.isOwned && p.isRefurbishing) badge = '<span class="property-badge badge-refurbishing">🔨 ' + p.refurbMonthsLeft + 'mo</span>';
    else if (p.isOwned && p.isBuilding) badge = '<span class="property-badge badge-refurbishing">🏗️ ' + p.buildMonthsLeft + 'mo</span>';
    else if (p.isOwned && (p.condition === 'poor' || p.condition === 'derelict')) badge = '<span class="property-badge" style="background:#E63946;color:#FFF">⚠️ ' + GameData.conditions[p.condition].name + '</span>';
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

    var isCompared = this.compareList.indexOf(p.id) >= 0;
    var compareBtn = '<button class="compare-btn' + (isCompared ? ' active' : '') + '" onclick="event.stopPropagation();GameUI.toggleCompare(\'' + p.id + '\',\'' + p.cityId + '\')" title="Compare">⚖️</button>';

    return '<div class="property-card' + (isCompared ? ' compare-selected' : '') + '" data-property="' + p.id + '" data-city="' + p.cityId + '" style="animation-delay:' + delay + 's">' +
      badge + compareBtn +
      '<div class="property-card-type">' +
        '<span class="property-thumb">' + (typeof GameGraphics !== 'undefined' ? GameGraphics.propertyThumb(p.type) : typeDef.icon) + '</span>' +
        '<span class="property-type-label">' + typeDef.name + '</span>' +
      '</div>' +
      '<div class="property-card-name">' + p.name + '</div>' +
      '<div class="property-card-price">' + GameData.formatMoney(p.currentValue) +
        (p.isOwned && p.appreciation !== undefined ? ' <span style="font-size:0.7rem;color:' + (p.appreciation >= 0 ? '#2A9D8F' : '#E63946') + '">' + (p.appreciation >= 0 ? '▲' : '▼') + Math.abs(p.appreciation).toFixed(1) + '%</span>' : '') +
      '</div>' +
      '<div class="property-card-details">' +
        '<span>📐 ' + p.size + ' m²</span>' +
        '<span>📊 ' + condDef.name + '</span>' +
        (p.monthlyRent > 0 ? '<span>💶 ' + GameData.formatMoney(p.monthlyRent) + '/mo</span>' : '') +
      '</div>' +
      condBar +
    '</div>';
  },

  // ---- Compare System ----
  toggleCompare: function(propertyId, cityId) {
    var idx = this.compareList.indexOf(propertyId);
    if (idx >= 0) {
      this.compareList.splice(idx, 1);
    } else {
      if (this.compareList.length >= 3) {
        this.compareList.shift(); // remove oldest
      }
      this.compareList.push(propertyId);
    }
    this.updateCompareBar();
    // Re-render current view to update card highlights
    if (this.currentScreen === 'city') this.renderCityProperties();
    else if (this.currentScreen === 'portfolio') this.renderPortfolio();
  },

  updateCompareBar: function() {
    var bar = document.getElementById('compare-bar');
    if (!bar) return;
    if (this.compareList.length === 0) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    var count = this.compareList.length;
    bar.innerHTML =
      '<span>⚖️ ' + count + ' selected</span>' +
      '<button class="btn btn-primary btn-small" onclick="GameUI.showCompareModal()"' + (count < 2 ? ' disabled' : '') + '>Compare</button>' +
      '<button class="btn btn-ghost btn-small" onclick="GameUI.compareList=[];GameUI.updateCompareBar();GameUI.renderCityProperties()">Clear</button>';
  },

  showCompareModal: function() {
    if (this.compareList.length < 2) return;
    var props = [];
    var self = this;
    this.compareList.forEach(function(id) {
      var p = GameEngine.state.properties.find(function(x) { return x.id === id; });
      if (!p) {
        for (var cid in GameEngine.state.marketProperties) {
          var found = GameEngine.state.marketProperties[cid].find(function(x) { return x.id === id; });
          if (found) { p = found; break; }
        }
      }
      if (p) props.push(p);
    });
    if (props.length < 2) return;

    var colWidth = Math.floor(100 / props.length);
    var html = '<div class="compare-modal-content">';
    html += '<div class="compare-header"><h3>Property Comparison</h3><button class="btn btn-ghost btn-small" onclick="document.getElementById(\'compare-modal\').style.display=\'none\'">Close</button></div>';
    html += '<div class="compare-grid" style="grid-template-columns:repeat(' + props.length + ',1fr)">';

    // Property names
    props.forEach(function(p) {
      var typeDef = GameData.propertyTypes[p.type];
      var city = GameData.cities.find(function(c) { return c.id === p.cityId; });
      html += '<div class="compare-cell compare-name">' + typeDef.icon + ' ' + p.name + '<br><span style="font-size:0.7rem;color:var(--text-muted)">' + (city ? city.flag + ' ' + city.name : '') + '</span></div>';
    });

    // Comparison rows
    var rows = [
      { label: 'Price', fn: function(p) { return GameData.formatMoney(p.currentValue); } },
      { label: 'Type', fn: function(p) { return GameData.propertyTypes[p.type].name; } },
      { label: 'Size', fn: function(p) { return p.size + ' m\u00B2'; } },
      { label: 'Condition', fn: function(p) { return GameData.conditions[p.condition].name; } },
      { label: 'Monthly Rent', fn: function(p) { return p.monthlyRent > 0 ? GameData.formatMoney(p.monthlyRent) : '—'; } },
      { label: 'Annual Yield', fn: function(p) { return p.currentValue > 0 && p.monthlyRent > 0 ? ((p.monthlyRent * 12 / p.currentValue) * 100).toFixed(1) + '%' : '—'; } },
      { label: 'Appreciation', fn: function(p) { return p.appreciation !== undefined ? (p.appreciation >= 0 ? '+' : '') + p.appreciation.toFixed(1) + '%' : '—'; } },
      { label: 'Status', fn: function(p) {
        if (p.isRented) return 'Rented';
        if (p.isRefurbishing) return 'Refurbishing';
        if (p.isBuilding) return 'Building';
        if (p.isOwned) return 'Vacant';
        return 'For Sale';
      }},
    ];

    rows.forEach(function(row) {
      html += '<div class="compare-cell compare-label">' + row.label + '</div>';
      // Values — highlight best
      var vals = props.map(row.fn);
      for (var i = 1; i < props.length; i++) {
        html += '<div class="compare-cell">' + vals[i - 1] + '</div>';
      }
      // last column needs the label column offset accounted for — actually let me redo the grid
    });

    html += '</div></div>';

    // Actually, let me use a simpler table layout
    html = '<div class="compare-modal-content">';
    html += '<div class="compare-header"><h3>⚖️ Property Comparison</h3><button class="btn btn-ghost btn-small" onclick="document.getElementById(\'compare-modal\').style.display=\'none\'">Close</button></div>';
    html += '<table class="compare-table"><thead><tr><th></th>';
    props.forEach(function(p) {
      var typeDef = GameData.propertyTypes[p.type];
      var city = GameData.cities.find(function(c) { return c.id === p.cityId; });
      html += '<th>' + typeDef.icon + ' ' + p.name + '<br><span style="font-size:0.65rem;font-weight:400;opacity:0.7">' + (city ? city.flag + ' ' + city.name : '') + '</span></th>';
    });
    html += '</tr></thead><tbody>';

    rows.forEach(function(row) {
      html += '<tr><td class="compare-label">' + row.label + '</td>';
      props.forEach(function(p) {
        html += '<td>' + row.fn(p) + '</td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    var modal = document.getElementById('compare-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'compare-modal';
      modal.className = 'compare-modal-overlay';
      modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
      document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    modal.style.display = 'flex';
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
      var asking = p.currentValue;
      actionsHTML += '<div class="action-info mb-8">Asking: ' + GameData.formatMoney(asking) + ' + ' + Math.round(city.taxRate*100) + '% tax</div>';
      actionsHTML += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
      actionsHTML += '<button class="btn btn-ghost btn-small" style="flex:1" onclick="App.buyProperty(\'' + p.id + '\', \'' + p.cityId + '\', 0.85)">Lowball 85%<br><span style="font-size:0.65rem;opacity:0.7">~30% accepted</span></button>';
      actionsHTML += '<button class="btn btn-secondary btn-small" style="flex:1" onclick="App.buyProperty(\'' + p.id + '\', \'' + p.cityId + '\', 0.93)">Negotiate 93%<br><span style="font-size:0.65rem;opacity:0.7">~65% accepted</span></button>';
      actionsHTML += '<button class="btn btn-primary btn-small" style="flex:1" onclick="App.buyProperty(\'' + p.id + '\', \'' + p.cityId + '\', 1.0)">Full Price<br><span style="font-size:0.65rem">' + GameData.formatMoney(asking + tax) + '</span></button>';
      actionsHTML += '</div>';
    } else {
      if (p.isBuilding) {
        actionsHTML += '<div class="action-info">🏗️ Under construction — ' + p.buildMonthsLeft + ' months remaining</div>';
      } else if (p.isRefurbishing) {
        actionsHTML += '<div class="action-info">🔨 Refurbishing — ' + p.refurbMonthsLeft + ' months remaining</div>';
      } else {
        // Rent toggle + tenant info + rent adjustment
        if (typeDef.canRent && p.condition !== 'derelict') {
          var rm = p.rentMultiplier || 1.0;
          var adjRent = Math.round(p.monthlyRent * rm);
          if (p.isRented) {
            // Show current tenant
            if (p.tenant) {
              actionsHTML += '<div class="tenant-info">' +
                '<div class="tenant-header">' + p.tenant.icon + ' <strong>' + p.tenant.name + '</strong> <span style="font-size:0.7rem;color:var(--text-muted)">(' + (p.tenant.monthsOccupied || 0) + ' months)</span></div>' +
                '<div class="tenant-stats">' +
                  '<span title="Reliability — affects late payments">🔒 ' + Math.round((p.tenant.reliability || 0.85) * 100) + '%</span>' +
                  '<span title="Care — affects property damage">🧹 ' + Math.round((p.tenant.care || 0.80) * 100) + '%</span>' +
                  '<span title="Satisfaction">😊 ' + Math.round((p.tenant.satisfaction || 0.85) * 100) + '%</span>' +
                '</div>' +
              '</div>';
            }
            actionsHTML += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">';
            actionsHTML += '<button class="btn btn-secondary btn-small" style="flex:1" onclick="App.toggleRent(\'' + p.id + '\')">Stop Renting</button>';
            actionsHTML += '<button class="btn btn-ghost btn-small" style="flex:1" onclick="App.evictTenant(\'' + p.id + '\')">Evict (costs ' + GameData.formatMoney(adjRent) + ')</button>';
            actionsHTML += '</div>';
          } else {
            actionsHTML += '<button class="btn btn-primary" onclick="App.toggleRent(\'' + p.id + '\')">Rent Out — ' + GameData.formatMoney(adjRent) + '/mo</button>';
          }
          // Rent adjustment slider
          actionsHTML += '<div class="rent-adjust">' +
            '<label class="settings-label" style="margin-bottom:4px">Rent Level: <strong>' + Math.round(rm * 100) + '%</strong> (' + GameData.formatMoney(adjRent) + '/mo)</label>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
              '<button class="btn btn-ghost btn-small' + (rm <= 0.75 ? ' active' : '') + '" onclick="App.adjustRent(\'' + p.id + '\',0.8)">80% Low</button>' +
              '<button class="btn btn-ghost btn-small' + (rm > 0.85 && rm < 1.05 ? ' active' : '') + '" onclick="App.adjustRent(\'' + p.id + '\',1.0)">100% Market</button>' +
              '<button class="btn btn-ghost btn-small' + (rm >= 1.05 && rm < 1.15 ? ' active' : '') + '" onclick="App.adjustRent(\'' + p.id + '\',1.1)">110% High</button>' +
              '<button class="btn btn-ghost btn-small' + (rm >= 1.15 ? ' active' : '') + '" onclick="App.adjustRent(\'' + p.id + '\',1.2)">120% Premium</button>' +
            '</div>' +
            '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:3px">Higher rent = more income but pickier tenants + slower fills</div>' +
          '</div>';
        }

        // Renovation tiers
        if (typeDef.canRefurbish && p.condition !== 'excellent') {
          var baseCost = Math.round(p.currentValue * condDef.refurbCostPct);
          actionsHTML += '<div class="action-info mb-8">🔨 Renovation Options:</div>';
          actionsHTML += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
          actionsHTML += '<button class="btn btn-ghost btn-small" style="flex:1" onclick="App.refurbishProperty(\'' + p.id + '\', \'budget\')">Budget<br>' + GameData.formatMoney(Math.round(baseCost*0.6)) + '<br><span style="font-size:0.6rem;opacity:0.6">+1 cond, 80% chance</span></button>';
          actionsHTML += '<button class="btn btn-accent btn-small" style="flex:1" onclick="App.refurbishProperty(\'' + p.id + '\', \'standard\')">Standard<br>' + GameData.formatMoney(baseCost) + '<br><span style="font-size:0.6rem;opacity:0.7">+1 cond, +12% value</span></button>';
          actionsHTML += '<button class="btn btn-primary btn-small" style="flex:1" onclick="App.refurbishProperty(\'' + p.id + '\', \'luxury\')">Luxury<br>' + GameData.formatMoney(Math.round(baseCost*2)) + '<br><span style="font-size:0.6rem;opacity:0.7">+2 cond, +25% value</span></button>';
          actionsHTML += '</div>';
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
          (p.isOwned ? this.renderDegradationInfo(p) : '') +
        '</div>' +
        actionsHTML +
      '</div>';
  },

  renderDegradationInfo: function(p) {
    // Show condition decay estimate
    // Base: 0.5% chance per month to degrade, doubled if rented, worse if poor/derelict
    var baseChance = 0.005;
    if (p.isRented) baseChance *= 2;
    if (p.condition === 'poor') baseChance *= 1.3;
    if (p.condition === 'derelict') baseChance *= 0.5; // can't go lower
    if (p.condition === 'excellent') baseChance *= 1.5; // degrades faster from top

    // Tenant care factor
    if (p.tenant && p.tenant.care) {
      baseChance *= (2.0 - p.tenant.care); // care 0.95 → ×1.05, care 0.6 → ×1.4
    }

    var monthsEstimate = Math.round(1 / baseChance);
    if (p.condition === 'derelict') {
      return '<div class="degradation-info">Already at lowest condition</div>';
    }
    var urgency = monthsEstimate < 12 ? 'degradation-warn' : monthsEstimate < 24 ? 'degradation-caution' : 'degradation-ok';
    return '<div class="degradation-info ' + urgency + '">' +
      (p.isRented ? '📊 Est. ~' + monthsEstimate + ' months until condition drops (rented)' : '📊 Est. ~' + monthsEstimate + ' months until condition drops') +
    '</div>';
  },

  // ---- Render Mitigations ----
  renderMitigations(property) {
    var options = GameEngine.getMitigationOptions(property);
    var owned = GameEngine.state.mitigations[property.id] || {};

    var ownedCount = Object.keys(owned).filter(function(k){return owned[k];}).length;
    var html = '<div style="border-top:2px dashed #DDD3C0; margin-top:12px; padding-top:8px;">' +
      '<div class="action-info mb-8" style="cursor:pointer" onclick="var el=document.getElementById(\'mit-list\');el.style.display=el.style.display===\'none\'?\'block\':\'none\'">🛡️ Risk Mitigation (' + ownedCount + '/' + options.length + ') ▾</div>' +
      '<div id="mit-list" style="display:none">';

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

    html += '</div></div>'; // close mit-list and outer div
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

    // Populate city filter dropdown with owned cities
    var cityFilterEl = document.getElementById('portfolio-city-filter');
    if (cityFilterEl) {
      var ownedCities = {};
      GameEngine.state.properties.forEach(function(p) { ownedCities[p.cityId] = true; });
      var opts = '<option value="all">All Cities</option>';
      GameData.cities.forEach(function(c) {
        if (ownedCities[c.id]) opts += '<option value="' + c.id + '"' + (GameUI.portfolioCityFilter === c.id ? ' selected' : '') + '>' + c.flag + ' ' + c.name + '</option>';
      });
      cityFilterEl.innerHTML = opts;
    }

    // Filter properties
    if (filter === 'rented') props = props.filter(function(p) { return p.isRented; });
    else if (filter === 'vacant') props = props.filter(function(p) { return !p.isRented && !p.isRefurbishing && !p.isBuilding; });
    else if (filter === 'refurbishing') props = props.filter(function(p) { return p.isRefurbishing || p.isBuilding; });

    // City filter
    if (this.portfolioCityFilter && this.portfolioCityFilter !== 'all') {
      var cf = this.portfolioCityFilter;
      props = props.filter(function(p) { return p.cityId === cf; });
    }

    // Sort
    props = this.sortProperties(props, this.portfolioSort);

    var list = document.getElementById('portfolio-list');
    var empty = document.getElementById('portfolio-empty');

    if (props.length === 0 && filter === 'all' && this.portfolioCityFilter === 'all') {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';

    // Paginate portfolio
    var total = props.length;
    var ps = this.PAGE_SIZE;
    var maxPage = Math.max(0, Math.ceil(total / ps) - 1);
    if (this.portfolioPage > maxPage) this.portfolioPage = maxPage;
    var start = this.portfolioPage * ps;
    var pageProps = props.slice(start, start + ps);

    var html = pageProps.map(function(p, i) { return GameUI.renderPropertyCard(p, start + i); }).join('');

    if (total > ps) {
      html += '<div style="grid-column:1/-1;display:flex;justify-content:center;gap:8px;padding:8px 0;align-items:center">';
      html += '<button class="btn btn-ghost btn-small" onclick="GameUI.portfolioPage=Math.max(0,GameUI.portfolioPage-1);GameUI.renderPortfolio()" ' + (this.portfolioPage <= 0 ? 'disabled' : '') + '>← Prev</button>';
      html += '<span style="font-size:0.75rem;font-weight:700;color:var(--text-muted)">' + (this.portfolioPage + 1) + ' / ' + (maxPage + 1) + ' (' + total + ' total)</span>';
      html += '<button class="btn btn-ghost btn-small" onclick="GameUI.portfolioPage=Math.min(' + maxPage + ',GameUI.portfolioPage+1);GameUI.renderPortfolio()" ' + (this.portfolioPage >= maxPage ? 'disabled' : '') + '>Next →</button>';
      html += '</div>';
    }

    list.innerHTML = html;
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

      this.renderCashflowForecast(s, stats) +

      '<div class="finance-section">' +
        '<div class="finance-section-title" style="cursor:pointer" onclick="var el=document.getElementById(\'lifetime-stats\');el.style.display=el.style.display===\'none\'?\'block\':\'none\'">Lifetime Stats ▾</div>' +
        '<div class="finance-card" id="lifetime-stats" style="display:none">' +
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
        var rel = GameEngine.getRelationship(ai.name);
        var relIcon = rel > 30 ? ' 🤝' : rel > 0 ? '' : rel > -30 ? '' : ' ⚔️';
        allFamilies.push({ name: ai.icon + ' ' + ai.name + relIcon, netWorth: ai.netWorth, color: ai.color, isPlayer: false });
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

  // ---- 12-Month Cashflow Forecast ----
  renderCashflowForecast: function(state, stats) {
    if (!state.properties || state.properties.length === 0) return '';

    // Calculate monthly projections
    var monthlyRent = stats.monthlyIncome || 0;
    var monthlyExpenses = stats.monthlyExpenses || 0;
    var monthlyLoanPayments = 0;
    if (state.loans) {
      state.loans.forEach(function(loan) {
        monthlyLoanPayments += loan.monthlyPayment || 0;
      });
    }
    var savingsInterest = (state.savings || 0) * 0.02 / 12;
    var monthlyNet = monthlyRent - monthlyExpenses - monthlyLoanPayments + savingsInterest;

    // Project forward 12 months
    var projectedCash = state.cash;
    var rows = '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var currentMonth = state.month || 0;

    for (var i = 1; i <= 12; i++) {
      projectedCash += monthlyNet;
      var mIdx = (currentMonth + i - 1) % 12;
      var cls = projectedCash >= 0 ? '' : ' negative';
      rows += '<div class="forecast-row">' +
        '<span class="forecast-month">' + months[mIdx] + '</span>' +
        '<span class="forecast-income positive">+' + GameData.formatMoney(Math.round(monthlyRent)) + '</span>' +
        '<span class="forecast-expense negative">-' + GameData.formatMoney(Math.round(monthlyExpenses + monthlyLoanPayments)) + '</span>' +
        '<span class="forecast-balance' + cls + '">' + GameData.formatMoney(Math.round(projectedCash)) + '</span>' +
      '</div>';
    }

    return '<div class="finance-section">' +
      '<div class="finance-section-title" style="cursor:pointer" onclick="var el=document.getElementById(\'cashflow-forecast\');el.style.display=el.style.display===\'none\'?\'block\':\'none\'">12-Month Forecast ▾</div>' +
      '<div class="finance-card" id="cashflow-forecast" style="display:none">' +
        '<div class="forecast-header">' +
          '<span>Month</span><span>Income</span><span>Costs</span><span>Balance</span>' +
        '</div>' +
        rows +
        '<div class="finance-row finance-total" style="margin-top:6px">' +
          '<span class="finance-row-label">Monthly Net</span>' +
          '<span class="finance-row-value ' + (monthlyNet >= 0 ? 'positive' : 'negative') + '">' + GameData.formatMoney(Math.round(monthlyNet)) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // ---- Render Settings ----
  renderSettings() {
    var content = document.getElementById('settings-content');
    // Build trophy case
    var unlocked = GameEngine.state.achievements || [];
    var total = GameData.achievements.length;
    var trophyHTML = '';
    GameData.achievements.forEach(function(a) {
      var done = unlocked.indexOf(a.id) >= 0;
      trophyHTML += '<div class="trophy-badge' + (done ? ' unlocked' : '') + '" title="' + a.desc + (done ? ' (Unlocked!)' : '') + '">' +
        '<span class="trophy-icon">' + (done ? a.icon : '🔒') + '</span>' +
        '<span class="trophy-name">' + a.name + '</span>' +
      '</div>';
    });

    content.innerHTML =
      '<div class="settings-section">' +
        '<div class="settings-row"><div><div class="settings-label">Auto-Advance Time</div><div class="settings-description">Automatically advance months</div></div>' + this.renderSpeedControls() + '</div>' +
        '<div class="settings-row"><div><div class="settings-label">Sound Effects</div><div class="settings-description">' + (GameAudio.muted ? 'Muted' : 'On') + '</div></div><button class="btn btn-secondary btn-small" onclick="GameAudio.toggle();GameUI.renderSettings()">' + (GameAudio.muted ? '🔇 Unmute' : '🔊 Mute') + '</button></div>' +
        '<div class="settings-row"><div><div class="settings-label">Save Game</div><div class="settings-description">Game saves automatically each month</div></div><button class="btn btn-primary btn-small" onclick="GameEngine.save(); GameUI.toast(\'Game saved!\', \'success\')">Save Now</button></div>' +
        '<div class="settings-row"><div><div class="settings-label">New Game</div><div class="settings-description">Start fresh with €500,000</div></div><button class="btn btn-danger btn-small" onclick="App.confirmNewGame()">Reset</button></div>' +
      '</div>' +
      '<div class="settings-section">' +
        '<div class="finance-section-title" style="cursor:pointer" onclick="var el=document.getElementById(\'trophy-grid\');el.style.display=el.style.display===\'none\'?\'grid\':\'none\'">🏆 Achievements (' + unlocked.length + '/' + total + ') ▾</div>' +
        '<div class="trophy-case" id="trophy-grid" style="display:none">' + trophyHTML + '</div>' +
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

    // Show floating rent income (always, even during auto-play)
    if (results.rentIncome > 0) {
      this.showFloatingIncome(results.rentIncome, results.expenses);
      if (!isAutoPlaying) GameAudio.coin();
    }

    // Show portfolio synergy bonus in ticker if significant
    var rentedCount = GameEngine.state.properties.filter(function(p){return p.isRented;}).length;
    if (rentedCount > 5 && !isAutoPlaying) {
      var synPct = Math.min(60, Math.round(
        Math.min(rentedCount - 5, 5) * 2 +
        Math.max(0, Math.min(rentedCount - 10, 10)) * 1.5 +
        Math.max(0, rentedCount - 20) * 1
      ));
      if (synPct > 0) this.setTicker('📈 Portfolio synergy: +' + synPct + '% rent bonus (' + rentedCount + ' rented properties)');
    }

    // Prestige — end of game
    if (results.prestige) {
      var stats = GameEngine.getPrestigeStats();
      var unlocksHTML = '';
      if (stats.unlocks.length > 0) {
        unlocksHTML = '<div style="margin-top:10px;text-align:left"><strong>Prestige ' + stats.nextLevel + ' Unlocks:</strong>';
        stats.unlocks.forEach(function(u) {
          unlocksHTML += '<div style="font-size:0.75rem;padding:3px 0">✨ <strong>' + u.name + '</strong> — ' + u.desc + '</div>';
        });
        unlocksHTML += '</div>';
      }
      var historyHTML = '';
      var history = GameEngine.state.prestigeHistory || [];
      if (history.length > 0) {
        historyHTML = '<div style="margin-top:10px;font-size:0.7rem;color:var(--text-muted)"><strong>Previous Runs:</strong>';
        history.slice(-3).forEach(function(h, i) {
          historyHTML += '<div>Run ' + (i+1) + ': ' + GameData.formatMoneyShort(h.netWorth) + ' · ' + h.properties + ' properties · ' + h.generation + ' gen</div>';
        });
        historyHTML += '</div>';
      }
      this.showModal('🏆 The Year 2030 — Your Legacy',
        '<div style="text-align:center;padding:8px 0">' +
          '<div style="font-size:3rem;margin-bottom:8px">🏛️</div>' +
          '<div style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:12px">Your dynasty spans ' + stats.generation + ' generations</div>' +
          '<div class="finance-card">' +
            '<div class="finance-row"><span class="finance-row-label">Final Net Worth</span><span class="finance-row-value">' + GameData.formatMoney(stats.netWorth) + '</span></div>' +
            '<div class="finance-row"><span class="finance-row-label">Properties</span><span class="finance-row-value">' + stats.properties + '</span></div>' +
            '<div class="finance-row"><span class="finance-row-label">Cities</span><span class="finance-row-value">' + stats.cities + '</span></div>' +
            '<div class="finance-row"><span class="finance-row-label">Achievements</span><span class="finance-row-value">' + stats.achievementCount + '/' + GameData.achievements.length + '</span></div>' +
            '<div class="finance-row"><span class="finance-row-label">Ranking</span><span class="finance-row-value">#' + stats.rank + '</span></div>' +
            '<div class="finance-row finance-total"><span class="finance-row-label">Prestige Score</span><span class="finance-row-value text-primary fw-800">' + stats.score + ' pts</span></div>' +
            '<div class="finance-row"><span class="finance-row-label">Legacy Points Earned</span><span class="finance-row-value" style="color:#D4A84B;font-weight:800">+' + stats.legacyPoints + ' LP</span></div>' +
          '</div>' +
          '<div style="margin-top:8px;font-size:0.82rem;font-weight:700">' +
            'Next run bonuses: <span class="positive">+' + Math.round((stats.cashBonus-1)*100) + '% cash</span>, <span class="positive">+' + stats.repBonus + ' reputation</span>' +
          '</div>' +
          unlocksHTML +
          historyHTML +
        '</div>',
        '<button class="btn btn-primary" onclick="App.startPrestige()">🔄 New Game+ (Prestige ' + stats.nextLevel + ')</button>' +
        '<button class="btn btn-accent" onclick="App.sharePrestige()">📷 Share Legacy</button>' +
        '<button class="btn btn-ghost" onclick="GameUI.hideModal()">Keep Playing</button>'
      );
      GameAudio.fanfare();
      return;
    }

    // Historical events — show as major decision card
    if (results.historicalEvent) {
      this.showHistoricalEvent(results.historicalEvent);
      return; // Pause everything for this major event
    }

    // Era transitions
    if (results.eraChange) {
      var era = results.eraChange.newEra;
      this.showEventPopup(era.icon, 'New Era: ' + era.name, era.description, '', 'positive');
      return;
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

    // Economic cycle changes
    if (results.cycleChange) {
      var cycleNames = { boom:'📈 Economic Boom!', growth:'📊 Steady Growth', stagnation:'📉 Stagnation', recession:'🔻 Recession!', depression:'💥 Depression!' };
      var cycleColors = { boom:'success', growth:'info', stagnation:'warning', recession:'error', depression:'error' };
      GameUI.setTicker((cycleNames[results.cycleChange] || results.cycleChange) + ' — The economy has shifted.');
      if (results.cycleChange === 'depression' || results.cycleChange === 'recession') {
        GameUI.toast(cycleNames[results.cycleChange] + ' Property values are falling!', cycleColors[results.cycleChange]);
      }
    }

    // Foreclosure warning / execution
    if (results.foreclosure) {
      GameUI.toast('🏦 FORECLOSURE! ' + results.foreclosure.property.name + ' sold for ' + GameData.formatMoney(results.foreclosure.amount) + ' (70% of value)', 'error');
      GameAudio.alarm();
    } else if (GameEngine.state.consecutiveNegativeCash === 1) {
      GameUI.toast('⚠️ Cash negative! Foreclosure in 2 months if not resolved.', 'error');
    } else if (GameEngine.state.consecutiveNegativeCash === 2) {
      GameUI.toast('🚨 DANGER! Cash still negative — foreclosure NEXT MONTH! Sell a property or take a loan.', 'error');
      GameAudio.alarm();
    }

    // Property degradation
    if (results.degraded && results.degraded.length > 0) {
      var names = results.degraded.slice(0, 2).map(function(p){return p.name;}).join(', ');
      GameUI.setTicker('🏚️ Deteriorated: ' + names + (results.degraded.length > 2 ? ' +' + (results.degraded.length-2) + ' more' : ''));
      if (!isAutoPlaying) GameAudio.negative();
    }

    // AI property purchases — create rivalry feeling
    if (results.aiBuys && results.aiBuys.length > 0 && !isAutoPlaying) {
      results.aiBuys.forEach(function(buy) {
        GameUI.toast(buy.ai.icon + ' ' + buy.ai.name + ' just bought ' + buy.property.name + ' in ' + buy.cityName + '!', 'info');
      });
    }

    // Achievements
    if (results.newAchievements && results.newAchievements.length > 0) {
      results.newAchievements.forEach(function(a) {
        GameUI.toast(a.icon + ' Achievement: ' + a.name + '! +' + GameData.formatMoney(a.reward), 'success');
        GameAudio.fanfare();
      });
    }

    // Dynasty events
    if (results.dynasty) {
      var dyn = results.dynasty;
      if (dyn.births && dyn.births.length > 0) {
        dyn.births.forEach(function(b) {
          GameUI.toast('👶 A child is born: ' + b.name + ' (trait: ' + b.trait + ')', 'success');
        });
      }
      if (dyn.deaths && dyn.deaths.length > 0) {
        dyn.deaths.forEach(function(d) {
          GameUI.toast('⚰️ ' + d.name + ' has passed away at age ' + d.age + '.', 'warning');
        });
      }
      if (dyn.successionHeir) {
        GameUI.setTicker('👑 Succession! ' + dyn.successionHeir.name + ' (Gen ' + GameEngine.state.generation + ') takes over. Inheritance tax: ' + GameData.formatMoney(dyn.inheritanceTax));
      }
      if (dyn.noHeir) {
        GameUI.setTicker('⚠️ No heir of age! The dynasty struggles without leadership.');
      }
    }

    // Floating income/expense numbers (only at slow speed or manual)
    if (!isAutoPlaying || speed <= 1) {
      if (results.rentIncome > 0) { GameUI.animateIncome(results.rentIncome); GameAudio.coin(); }
      if (results.expenses > 0) {
        setTimeout(function() { GameUI.animateExpense(results.expenses); }, 400);
      }
    }

    // Goals achieved — with confetti!
    if (results.goalsAchieved && results.goalsAchieved.length > 0) {
      results.goalsAchieved.forEach(function(g) {
        GameUI.toast('🎯 Goal complete: ' + g.text + ' +' + GameData.formatMoney(g.reward), 'milestone');
      });
      GameUI.animateConfetti();
    }

    // Tenant problems — show in ticker
    if (results.tenantProblems && results.tenantProblems.length > 0) {
      var tp = results.tenantProblems[0];
      var tpMsg = { late: '⏰ Late rent', vacancy: '🚪 Tenant left', damage: '🔨 Tenant damage', dispute: '⚖️ Tenant dispute' };
      GameUI.setTicker((tpMsg[tp.type] || '⚠️ Tenant issue') + ' at ' + tp.property + ' — lost ' + GameData.formatMoney(tp.loss));
    }

    // Property tax in ticker
    if (results.propertyTax > 0 && !isAutoPlaying) {
      GameUI.toast('🏛️ Property tax: -' + GameData.formatMoney(results.propertyTax), 'warning');
    }

    // Milestones
    if (results.milestones && results.milestones.length > 0) {
      results.milestones.forEach(function(m) {
        GameUI.toast(m.icon + ' Milestone: ' + m.name + '!', 'milestone');
      });
      GameUI.animateConfetti();
      GameAudio.fanfare();
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
    // Show in HUD ticker instead of blocking popup
    var msg = icon + ' ' + title;
    if (description) msg += ' — ' + description;
    if (effectText) msg += ' | ' + effectText;
    this.setTicker(msg);
  },

  setTicker(text) {
    var el = document.getElementById('hud-ticker-text');
    if (el) el.textContent = text;
    // Auto-clear after 8 seconds
    if (this._tickerTimer) clearTimeout(this._tickerTimer);
    this._tickerTimer = setTimeout(function() {
      if (el) el.textContent = '';
    }, 8000);
  },

  setTip(text) {
    var el = document.getElementById('hud-tips-text');
    if (el) el.textContent = '💡 ' + text;
  },

  // ---- Decision Card ----
  showDecision(decision) {
    if (!decision) {
      document.getElementById('decision-panel').classList.add('hidden');
      return;
    }

    var html = '<div class="decision-title">' + decision.title + '</div>' +
      '<div class="decision-desc">' + decision.description + '</div>' +
      '<div class="decision-choices">';

    for (var i = 0; i < decision.choices.length; i++) {
      var c = decision.choices[i];
      html += '<button class="decision-choice" onclick="App.resolveDecision(\'' + c.action + '\', ' + (c.data ? JSON.stringify(c.data).replace(/"/g, '&quot;') : 'null') + ')">' + c.label + '</button>';
    }
    html += '</div>';

    document.getElementById('decision-card').innerHTML = html;
    document.getElementById('decision-panel').classList.remove('hidden');

    GameAudio.decision();

    // Auto-play pauses during decisions
    if (GameEngine.state.autoAdvanceSpeed > 0) {
      this._savedSpeed = GameEngine.state.autoAdvanceSpeed;
      this.setAutoAdvance(0);
    }
  },

  hideDecision() {
    document.getElementById('decision-panel').classList.add('hidden');
    // Resume auto-play if it was running
    if (this._savedSpeed && this._savedSpeed > 0) {
      this.setAutoAdvance(this._savedSpeed);
      this._savedSpeed = 0;
    }
  },

  // ---- Historical Event (major, uses modal) ----
  showHistoricalEvent(event) {
    // Pause auto-play
    if (GameEngine.state.autoAdvanceSpeed > 0) {
      this._savedSpeed = GameEngine.state.autoAdvanceSpeed;
      this.setAutoAdvance(0);
    }

    var html = '<div style="text-align:center;padding:8px 0">' +
      '<div style="font-size:3rem;margin-bottom:8px">' + event.icon + '</div>' +
      '<div style="font-family:var(--font-heading);font-size:1.2rem;color:#2B1810;margin-bottom:8px">' + event.title + ' (' + event.year + ')</div>' +
      '<div style="font-size:0.85rem;color:#6A5A42;line-height:1.5;margin-bottom:16px">' + event.description + '</div>' +
      '</div>';

    var actions = '';
    for (var i = 0; i < event.choices.length; i++) {
      var c = event.choices[i];
      var btnClass = i === 0 ? 'btn btn-primary' : (i === event.choices.length - 1 ? 'btn btn-ghost' : 'btn btn-secondary');
      actions += '<button class="' + btnClass + '" style="flex:1;font-size:0.8rem" onclick="App.resolveHistoricalEvent(' + i + ')">' + c.label + '</button>';
    }

    this.showModal(event.icon + ' ' + event.title, html, actions);
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

  // ---- Floating Leaderboard ----
  toggleLeaderboard() {
    var panel = document.getElementById('floating-leaderboard');
    if (panel.classList.contains('hidden')) {
      this.renderFloatingLeaderboard();
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  },

  renderFloatingLeaderboard() {
    var s = GameEngine.state;
    if (!s || !s.aiFamilies) return;
    var playerNW = GameEngine.getNetWorth();
    var all = [
      { name: (s.familyIcon || '👤') + ' ' + (s.familyName || 'You'), nw: playerNW, isPlayer: true }
    ];
    s.aiFamilies.forEach(function(ai) {
      all.push({ name: ai.icon + ' ' + ai.name, nw: ai.netWorth, isPlayer: false });
    });
    all.sort(function(a, b) { return b.nw - a.nw; });

    var html = '';
    all.forEach(function(f, i) {
      var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      html += '<div class="lb-row' + (f.isPlayer ? ' lb-player' : '') + '">' +
        '<span class="lb-rank">' + medal + '</span>' +
        '<span class="lb-name">' + f.name + '</span>' +
        '<span class="lb-value">' + GameData.formatMoneyShort(f.nw) + '</span>' +
      '</div>';
    });
    document.getElementById('floating-lb-content').innerHTML = html;
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
    var mapContainer = document.getElementById('world-map');

    if (!this._mapLoaded) {
      if (typeof Mosaic !== 'undefined' && !Mosaic._rendered) {
        Mosaic.renderWorldMap(svg);
      } else if (typeof Mosaic === 'undefined') {
        GameGraphics.renderWorldMap(svg);
      }
      // Only mark loaded after Mosaic confirms render (async D3 sets _rendered in .then)
      // For sync fallback (GameGraphics), mark immediately
      if (typeof Mosaic === 'undefined' || Mosaic._rendered) {
        this._mapLoaded = true;
      }
    }

    // Render city pins with leader lines to avoid overlapping labels
    var pinsHTML = '';
    GameData.cities.forEach(function(city) {
      var coords = GameData.cityCoords[city.id];
      if (!coords) return;
      var summary = GameEngine.getCitySummary(city.id);
      var hasOwned = summary.owned > 0;
      var lx = coords.lx || 10, ly = coords.ly || 0;
      var needsLeader = Math.abs(lx) > 15 || Math.abs(ly) > 15;
      var labelText = city.name + (hasOwned ? ' (' + summary.owned + ')' : '');

      pinsHTML += '<div class="map-pin-group" data-city="' + city.id + '">';
      // Dot at the city position
      pinsHTML += '<div class="map-pin-dot-wrap" data-city="' + city.id + '" style="left:' + coords.x + '%;top:' + coords.y + '%">' +
        '<div class="map-pin-dot' + (hasOwned ? ' owned' : '') + '"></div>' +
      '</div>';
      // Leader line (SVG overlay positioned between dot and label)
      if (needsLeader) {
        pinsHTML += '<svg class="map-leader-line" style="left:' + coords.x + '%;top:' + coords.y + '%;overflow:visible;position:absolute;width:1px;height:1px;pointer-events:none">' +
          '<line x1="0" y1="0" x2="' + (lx + (lx > 0 ? 2 : -2)) + '" y2="' + (ly + 7) + '" stroke="rgba(200,168,88,.45)" stroke-width="0.8" stroke-dasharray="3,2"/>' +
        '</svg>';
      }
      // Label at offset position
      pinsHTML += '<div class="map-pin-label-wrap" data-city="' + city.id + '" style="left:calc(' + coords.x + '% + ' + lx + 'px);top:calc(' + coords.y + '% + ' + ly + 'px)">' +
        '<div class="map-pin-label' + (hasOwned ? ' map-pin-owned' : '') + '">' + labelText + '</div>' +
      '</div>';
      pinsHTML += '</div>';
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
    // Collapsible investment list — only show 4 at a time
    html += '<div class="finance-card mt-8">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;cursor:pointer" onclick="var el=document.getElementById(\'inv-list\');el.style.display=el.style.display===\'none\'?\'block\':\'none\'">' +
        '<strong>Buy Investments ▾</strong>' +
        '<span style="font-size:0.7rem;color:var(--text-muted)">' + GameEngine.getAvailableInvestments().length + ' available</span>' +
      '</div>' +
      '<div id="inv-list" style="display:none">';
    var available = GameEngine.getAvailableInvestments();
    available.forEach(function(inv) {
      var typeColor = inv.type === 'bond' ? '#3D5A80' : inv.type === 'commodity' ? '#D4A84B' : '#2C6E49';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.04);font-size:0.78rem">' +
        '<div style="flex:1;min-width:0">' +
          '<span style="font-weight:700">' + inv.icon + ' ' + inv.name + '</span>' +
          '<div style="font-size:0.65rem;color:var(--text-muted)">' + GameData.formatMoney(inv.unitPrice) + ' · ' + (inv.annualYield * 100).toFixed(1) + '% yield · ' + (inv.risk * 100).toFixed(0) + '% risk</div>' +
        '</div>' +
        '<div style="display:flex;gap:3px;flex-shrink:0">' +
          '<button class="btn btn-small btn-secondary" style="padding:3px 8px;font-size:0.7rem" onclick="App.buyInvestment(\'' + inv.id + '\', 1)">1</button>' +
          '<button class="btn btn-small btn-primary" style="padding:3px 8px;font-size:0.7rem" onclick="App.buyInvestment(\'' + inv.id + '\', 5)">5</button>' +
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
    // Cleanup 3D city when switching away
    if (!this.cityMapView && typeof City3D !== 'undefined') City3D.destroy();
    if (this.cityMapView) this.renderCityMap();
  },

  // ---- Render City Map ----
  // Map of city IDs to 3D definitions
  _city3dDefs: {
    new_york: function() { return typeof CityDef_NewYork !== 'undefined' ? CityDef_NewYork : null; },
    london: function() { return typeof CityDef_London !== 'undefined' ? CityDef_London : null; },
    tokyo: function() { return typeof CityDef_Tokyo !== 'undefined' ? CityDef_Tokyo : null; },
    dubai: function() { return typeof CityDef_Dubai !== 'undefined' ? CityDef_Dubai : null; },
    paris: function() { return typeof CityDef_Paris !== 'undefined' ? CityDef_Paris : null; },
    sydney: function() { return typeof CityDef_Sydney !== 'undefined' ? CityDef_Sydney : null; },
  },

  renderCityMap() {
    var cityId = this.currentCity;
    var city = GameData.cities.find(function(c) { return c.id === cityId; });
    if (!city) return;

    // Try 3D city first
    if (typeof City3D !== 'undefined' && typeof THREE !== 'undefined') {
      var defFn = this._city3dDefs[cityId];
      var def = defFn ? defFn() : null;
      if (def) {
        var container = document.getElementById('city-map');
        // Don't re-render if same city is already showing
        if (City3D._cityDef && City3D._cityDef.id === cityId) return;
        container.innerHTML = '';
        container.style.background = '#060c1a';
        container.style.minHeight = '450px';
        City3D.renderCity(def, container);
        return;
      }
    }
    // Fall back to SVG city rendering

    var market = GameEngine.state.marketProperties[cityId] || [];
    var owned = GameEngine.state.properties.filter(function(p) { return p.cityId === cityId; });
    var allProps = market.concat(owned);
    var lm = GameData.cityLandmarks[cityId] || {};

    var container = document.getElementById('city-map');

    // Render SVG city scene as background
    var sceneDivId = 'city-scene-bg';
    var html = '<div id="'+sceneDivId+'" style="position:absolute;inset:0;pointer-events:none;opacity:0.9"></div>';

    // Overlay for clickable buildings
    html += '<div style="position:absolute;inset:0">';

    // District labels
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

    html += '</div>'; // close overlay div
    container.innerHTML = html;

    // Render the SVG city scene
    var sceneEl = document.getElementById(sceneDivId);
    if (sceneEl) GameGraphics.renderCityScene(cityId, sceneEl);
  },

  // ---- Auto-advance controls ----
  setAutoAdvance(speed) {
    // Clear existing timer
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }

    if (!GameEngine.state) return;
    GameEngine.state.autoAdvanceSpeed = speed;
    var intervals = { 0: 0, 1: 4000, 2: 2000, 3: 800 };
    var ms = intervals[speed] || 0;

    if (ms > 0) {
      var self = this;
      this.autoTimer = setInterval(function() {
        if (GameEngine.state) App.advanceMonth();
      }, ms);
    }
    GameEngine.save();
    // Re-render speed buttons to show active state
    var el = document.getElementById('hud-speed');
    if (el) el.innerHTML = this.renderSpeedControls();
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
