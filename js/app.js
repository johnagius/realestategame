/* ========================================
   PROPERTY EMPIRE - App Controller
   ======================================== */

const App = {

  init() {
    // Render splash scene
    GameGraphics.renderSplash();

    // Check for saved game
    if (GameEngine.hasSavedGame()) {
      document.getElementById('btn-continue-game').style.display = '';
    }

    this.bindEvents();
  },

  bindEvents() {
    // Splash buttons
    document.getElementById('btn-new-game').addEventListener('click', function() { App.startNewGame(); });
    document.getElementById('btn-continue-game').addEventListener('click', function() { App.continueGame(); });

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        GameUI.showScreen(this.getAttribute('data-screen'));
      });
    });

    // Advance month buttons
    // HUD advance button (always visible)
    document.getElementById('btn-hud-advance').addEventListener('click', function() { App.advanceMonth(); });
    // Removed: .btn-advance-alt buttons no longer exist in HTML

    // Map toggle
    document.getElementById('btn-map-toggle').addEventListener('click', function() {
      GameUI.toggleMapView();
    });

    // Map pin clicks
    document.getElementById('world-map-pins').addEventListener('click', function(e) {
      var pin = e.target.closest('.map-pin');
      if (pin) {
        var cityId = pin.getAttribute('data-city');
        GameUI.currentCityTab = 'market';
        document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
        document.querySelector('.tab-btn[data-tab="market"]').classList.add('active');
        GameUI.showScreen('city', cityId);
      }
    });

    // City search
    document.getElementById('city-search').addEventListener('input', function() {
      GameUI.renderMap();
    });

    // City grid clicks (event delegation)
    document.getElementById('cities-grid').addEventListener('click', function(e) {
      var card = e.target.closest('.city-card');
      if (card) {
        var cityId = card.getAttribute('data-city');
        GameUI.currentCityTab = 'market';
        document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
        document.querySelector('.tab-btn[data-tab="market"]').classList.add('active');
        GameUI.showScreen('city', cityId);
      }
    });

    // City tab buttons
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        GameUI.currentCityTab = this.getAttribute('data-tab');
        GameUI.renderCityProperties();
      });
    });

    // Property card clicks (city screen)
    document.getElementById('city-properties').addEventListener('click', function(e) {
      var card = e.target.closest('.property-card');
      if (card) {
        var propId = card.getAttribute('data-property');
        GameUI.showScreen('property', propId);
      }
    });

    // Portfolio card clicks
    document.getElementById('portfolio-list').addEventListener('click', function(e) {
      var card = e.target.closest('.property-card');
      if (card) {
        var propId = card.getAttribute('data-property');
        GameUI.showScreen('property', propId);
      }
    });

    // Portfolio filter buttons
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(f) { f.classList.remove('active'); });
        this.classList.add('active');
        GameUI.currentPortfolioFilter = this.getAttribute('data-filter');
        GameUI.renderPortfolio();
      });
    });

    // City view toggle
    document.getElementById('btn-city-view-toggle').addEventListener('click', function() {
      GameUI.toggleCityView();
    });

    // City map building clicks
    document.getElementById('city-map').addEventListener('click', function(e) {
      var bldg = e.target.closest('.city-building');
      if (bldg) {
        var propId = bldg.getAttribute('data-property');
        GameUI.showScreen('property', propId);
      }
    });

    // Back buttons
    document.getElementById('btn-back-city').addEventListener('click', function() {
      GameUI.showScreen('map');
    });
    document.getElementById('btn-back-property').addEventListener('click', function() {
      // Go back to city if we came from one, else portfolio
      if (GameUI.currentCity) {
        GameUI.showScreen('city');
      } else {
        GameUI.showScreen('portfolio');
      }
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', function() { GameUI.hideModal(); });
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
      if (e.target === this) GameUI.hideModal();
    });

    // Event dismiss
    document.getElementById('event-dismiss').addEventListener('click', function() {
      document.getElementById('event-overlay').classList.remove('active');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (!GameEngine.state) return;
      // Don't trigger during text input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          App.advanceMonth();
          break;
        case 'Digit1': GameUI.setAutoAdvance(1); break;
        case 'Digit2': GameUI.setAutoAdvance(2); break;
        case 'Digit3': GameUI.setAutoAdvance(3); break;
        case 'Digit0': case 'KeyP': GameUI.setAutoAdvance(0); break;
        case 'Escape':
          GameUI.hideModal();
          GameUI.hideDecision();
          document.getElementById('floating-leaderboard').classList.add('hidden');
          break;
        case 'KeyL':
          GameUI.toggleLeaderboard();
          break;
      }
    });

    // Leaderboard toggle
    document.getElementById('btn-leaderboard').addEventListener('click', function() {
      GameUI.toggleLeaderboard();
    });
    document.getElementById('btn-close-lb').addEventListener('click', function() {
      document.getElementById('floating-leaderboard').classList.add('hidden');
    });
  },

  startNewGame() {
    // Show family selection
    document.getElementById('splash-main-btns').style.display = 'none';
    var familySelect = document.getElementById('family-select');
    familySelect.style.display = 'block';

    var html = '';
    GameData.families.forEach(function(f) {
      var diffClass = f.difficulty.toLowerCase();
      html += '<div class="family-card" onclick="App.selectFamily(\'' + f.id + '\')">' +
        '<div class="family-card-icon">' + f.icon + '</div>' +
        '<div class="family-card-info">' +
          '<div class="family-card-name">' + f.name + '</div>' +
          '<div class="family-card-desc">' + f.description + '</div>' +
          '<div class="family-card-motto">' + f.motto + '</div>' +
        '</div>' +
        '<div class="family-card-meta">' +
          '<div class="family-card-cash">' + GameData.formatMoney(f.startingCash) + '</div>' +
          '<div class="family-card-diff diff-' + diffClass + '">' + f.difficulty + '</div>' +
        '</div>' +
      '</div>';
    });
    document.getElementById('family-cards').innerHTML = html;
  },

  selectFamily(familyId) {
    GameEngine.newGame(familyId);
    this.enterGame();
  },

  continueGame() {
    var state = GameEngine.loadGame();
    if (state) {
      this.enterGame();
      // Resume auto-play if it was running
      if (state.autoAdvanceSpeed > 0) {
        GameUI.setAutoAdvance(state.autoAdvanceSpeed);
      }
    } else {
      GameUI.toast('No saved game found', 'error');
    }
  },

  enterGame() {
    document.getElementById('screen-splash').classList.remove('active');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('hud-ticker').classList.remove('hidden');
    document.getElementById('hud-goals').classList.remove('hidden');
    // Generate initial goals
    GameEngine.generateGoals();
    GameUI.updateHUD();
    GameUI.showScreen('map');
    // Start tutorial for new players
    if (!GameEngine.state.tutorialDone) {
      this.startTutorial();
    }
  },

  showRandomTip() {
    var tips = [
      'Buy in cities with high yield (8%+) and low tax for best rental returns.',
      'Refurbish poor-condition properties to increase rent by 30-50%.',
      'Cities near the equator often have flood and storm risks. Buy insurance!',
      'Tokyo and Los Angeles have earthquake risk. Seismic retrofits help.',
      'Cape Town and Mumbai offer cheap entry prices with high growth potential.',
      'Monaco has the highest property prices but lowest tax rate (3%).',
      'Buildings in good/excellent condition rent for much more.',
      'Land parcels can be built on — choose what to construct carefully.',
      'Dubai has 0% income tax making it great for rental income.',
      'London and Paris flood occasionally. Consider flood barriers.',
      'Buy business stakes at 51%+ to gain controlling interest.',
      'Open your own bank in the Gilded Age to earn interest income.',
      'Commodities like gold hold value through market crashes.',
      'Diversify across cities to reduce disaster risk.',
    ];
    GameUI.setTip(tips[Math.floor(Math.random() * tips.length)]);
  },

  advanceMonth() {
    var results = GameEngine.advanceMonth();
    GameUI.updateHUD();
    // Update floating leaderboard if open
    if (!document.getElementById('floating-leaderboard').classList.contains('hidden')) {
      GameUI.renderFloatingLeaderboard();
    }
    GameUI.showMonthResults(results);

    // Show AI interaction or decision card
    if (results.aiInteraction) {
      var ai = results.aiInteraction;
      var aiDecision = {
        title: ai.title,
        description: ai.description,
        choices: []
      };
      if (ai.type === 'buyout_offer') {
        aiDecision.choices = [
          { label: 'Accept offer — sell for ' + GameData.formatMoney(ai.data.amount), action: 'accept_buyout', data: ai.data },
          { label: 'Decline — not for sale', action: 'decline', data: {} }
        ];
      } else if (ai.type === 'threat') {
        aiDecision.choices = [
          { label: 'Stand your ground — "We\'re staying"', action: 'reject_threat', data: ai.data },
          { label: 'Ignore the threat', action: 'decline', data: {} }
        ];
      } else if (ai.type === 'alliance') {
        aiDecision.choices = [
          { label: 'Join alliance — invest ' + GameData.formatMoney(ai.data.amount), action: 'accept_alliance', data: ai.data },
          { label: 'Decline — we work alone', action: 'decline', data: {} }
        ];
      }
      aiDecision._isAI = true;
      GameUI.showDecision(aiDecision);
    } else if (results.decision) {
      GameUI.showDecision(results.decision);
    }

    // Rotate tips every few months
    if (GameEngine.state.month % 3 === 0) this.showRandomTip();

    // Refresh current screen
    if (GameUI.currentScreen === 'map') GameUI.renderMap();
    else if (GameUI.currentScreen === 'city') GameUI.renderCity();
    else if (GameUI.currentScreen === 'portfolio') GameUI.renderPortfolio();
    else if (GameUI.currentScreen === 'finances') GameUI.renderFinances();
    else if (GameUI.currentScreen === 'bank') GameUI.renderBank();
    else if (GameUI.currentScreen === 'settings') GameUI.renderSettings();
  },

  buyProperty(propertyId, cityId, offerPct) {
    var result = GameEngine.buyProperty(propertyId, cityId, offerPct);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameAudio.purchase();
      GameUI.updateHUD();
      GameUI.showScreen('property', propertyId);
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  sellProperty(propertyId) {
    // Confirm first
    GameUI.showModal(
      'Sell Property?',
      '<p>Are you sure you want to sell this property? This cannot be undone.</p>',
      '<button class="btn btn-secondary" onclick="GameUI.hideModal()">Cancel</button>' +
      '<button class="btn btn-danger" onclick="App.confirmSell(\'' + propertyId + '\')">Sell</button>'
    );
  },

  confirmSell(propertyId) {
    GameUI.hideModal();
    var result = GameEngine.sellProperty(propertyId);
    if (result.success) {
      GameUI.toast(result.message, result.profit >= 0 ? 'success' : 'warning');
      GameUI.updateHUD();
      if (GameUI.currentCity) {
        GameUI.showScreen('city');
      } else {
        GameUI.showScreen('portfolio');
      }
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  toggleRent(propertyId) {
    var result = GameEngine.toggleRent(propertyId);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderProperty(propertyId);
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  refurbishProperty(propertyId, tier) {
    var result = GameEngine.refurbishProperty(propertyId, tier);
    if (result.success) {
      GameUI.toast(result.message, 'info');
      GameUI.updateHUD();
      GameUI.renderProperty(propertyId);
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  buildOnLand(propertyId, buildOption) {
    var result = GameEngine.buildOnLand(propertyId, buildOption);
    if (result.success) {
      GameUI.toast(result.message, 'info');
      GameUI.updateHUD();
      GameUI.renderProperty(propertyId);
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  purchaseMitigation(propertyId, mitigationType) {
    var result = GameEngine.purchaseMitigation(propertyId, mitigationType);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderProperty(propertyId);
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  confirmNewGame() {
    GameUI.showModal(
      'Start New Game?',
      '<p>This will erase your current progress. Are you sure?</p>',
      '<button class="btn btn-secondary" onclick="GameUI.hideModal()">Cancel</button>' +
      '<button class="btn btn-danger" onclick="App.doNewGame()">Reset</button>'
    );
  },

  doNewGame() {
    GameUI.hideModal();
    if (GameUI.autoTimer) { clearInterval(GameUI.autoTimer); GameUI.autoTimer = null; }
    GameEngine.deleteSave();
    // Go back to splash for family selection
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-nav').classList.add('hidden');
    document.getElementById('screen-splash').classList.add('active');
    document.getElementById('splash-main-btns').style.display = '';
    document.getElementById('family-select').style.display = 'none';
  },

  // ---- Bank / Loans ----
  showLoanOffers(amount) {
    var offers = GameEngine.getLoanOffers(amount);
    if (offers.length === 0) {
      GameUI.toast('No loan offers available for this amount.', 'error');
      return;
    }

    // Sort by total cost (cheapest first)
    offers.sort(function(a, b) { return a.totalRepayment - b.totalRepayment; });

    var html = '<p style="margin-bottom:8px">Loan offers for <strong>' + GameData.formatMoney(amount) + '</strong>:</p>';
    html += '<table class="compare-table" style="margin-bottom:8px"><thead><tr><th>Bank</th><th>Term</th><th>APR</th><th>Monthly</th><th>Total Cost</th><th></th></tr></thead><tbody>';
    offers.forEach(function(o, i) {
      var interestCost = o.totalRepayment - amount;
      var cheapest = i === 0 ? ' style="background:rgba(44,110,73,0.06)"' : '';
      html += '<tr' + cheapest + '>' +
        '<td style="font-weight:700;white-space:nowrap">' + o.bankIcon + ' ' + (o.bankName || '') + '</td>' +
        '<td>' + o.termMonths + 'mo</td>' +
        '<td>' + (o.interestRate * 100).toFixed(1) + '%</td>' +
        '<td>' + GameData.formatMoney(o.monthlyPayment) + '</td>' +
        '<td>' + GameData.formatMoney(o.totalRepayment) + '<div style="font-size:0.6rem;color:#E63946">+' + GameData.formatMoney(interestCost) + ' interest</div></td>' +
        '<td><button class="btn btn-primary btn-small" style="padding:4px 10px;font-size:0.7rem" onclick="App.takeLoan(\'' + o.bankId + '\', ' + o.amount + ', ' + o.termMonths + ')">Accept</button></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '<p style="font-size:0.65rem;color:var(--text-muted);margin:0">Sorted by total cost. Top row is cheapest.</p>';

    GameUI.showModal('Loan Comparison', '<div class="loan-options">' + html + '</div>', '');
  },

  takeLoan(bankId, amount, termMonths) {
    GameUI.hideModal();
    var result = GameEngine.takeLoan(bankId, amount, termMonths);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderBank();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  repayLoan(loanId) {
    var result = GameEngine.repayLoan(loanId);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderBank();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  // ---- Business Stakes ----
  buyStake(businessId, cityId, stakePct) {
    var result = GameEngine.buyStake(businessId, cityId, stakePct);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderCityBusinesses();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  sellStake(businessId) {
    var result = GameEngine.sellStake(businessId);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderCityBusinesses();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  // ---- Auto-sell ----
  setAutoSell(propertyId, type, threshold) {
    var result = GameEngine.addAutoSellRule(propertyId, type, threshold);
    GameUI.toast(result.message, 'success');
    GameUI.renderProperty(propertyId);
  },

  removeAutoSell(propertyId) {
    GameEngine.removeAutoSellRule(propertyId);
    GameUI.toast('Auto-sell rule removed.', 'info');
    GameUI.renderProperty(propertyId);
  },

  // ---- Decision Resolution ----
  resolveDecision(action, data) {
    // Check if this is an AI interaction or regular decision
    var isAI = action === 'accept_buyout' || action === 'reject_threat' || action === 'accept_alliance' || (action === 'decline' && data);
    var result;
    if (isAI) {
      result = GameEngine.resolveAIInteraction(action, data || {});
    } else {
      result = GameEngine.resolveDecision(action, data);
    }
    GameUI.hideDecision();
    if (result.success) {
      GameUI.toast(result.message, action === 'pass' ? 'info' : 'success');
    } else {
      GameUI.toast(result.message, 'error');
    }
    GameUI.updateHUD();
  },

  // ---- Historical Events ----
  resolveHistoricalEvent(choiceIndex) {
    GameUI.hideModal();
    var result = GameEngine.resolveHistoricalEvent(choiceIndex);
    if (result.success) {
      GameUI.toast(result.message, 'info');
    }
    GameUI.updateHUD();
    GameUI.hideDecision(); // Resume auto-play
  },

  // ---- Bank Savings ----
  deposit(amount) {
    var result = GameEngine.deposit(amount);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderBank();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  withdraw(amount) {
    var result = GameEngine.withdraw(amount);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderBank();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  // ---- Investments ----
  buyInvestment(investmentId, units) {
    var result = GameEngine.buyInvestment(investmentId, units);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderBank();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  sellInvestment(investmentId, units) {
    var result = GameEngine.sellInvestment(investmentId, units);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderBank();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  // ---- Mergers ----
  showMergerOptions(acquirerBizId, cityId) {
    var businesses = (GameEngine.state.businesses || {})[cityId] || [];
    var acquirer = businesses.find(function(b) { return b.id === acquirerBizId; });
    if (!acquirer) return;

    var targets = businesses.filter(function(b) { return b.id !== acquirerBizId; });
    var html = '<p style="margin-bottom:10px">Merge into <strong>' + acquirer.name + '</strong>:</p>';
    targets.forEach(function(t) {
      var cost = Math.round(t.totalValue * (t.availableStake / 100) * 0.85);
      html += '<div class="finance-row" style="cursor:pointer" onclick="App.executeMerger(\'' + acquirerBizId + '\', \'' + t.id + '\', \'' + cityId + '\')">' +
        '<span>' + (GameData.businessTypes[t.type] || {}).icon + ' ' + t.name + '</span>' +
        '<span class="finance-row-value">' + GameData.formatMoney(cost) + '</span>' +
      '</div>';
    });
    GameUI.showModal('🤝 Business Merger', html, '<button class="btn btn-secondary" onclick="GameUI.hideModal()">Cancel</button>');
  },

  executeMerger(biz1, biz2, cityId) {
    GameUI.hideModal();
    var result = GameEngine.mergeBusiness(biz1, biz2, cityId);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderCityBusinesses();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  // ---- Player Bank ----
  openBank() {
    if (!GameEngine.canOpenBank()) {
      GameUI.toast('Cannot open a bank yet. Need more capital or a later era.', 'error');
      return;
    }
    var capital = Math.round(GameEngine.state.cash * 0.3);
    var name = (GameEngine.state.familyName || 'Family') + ' Bank';
    GameUI.showModal('🏦 Open Your Own Bank',
      '<p>Invest capital to open a bank. It will lend money and earn interest automatically.</p>' +
      '<div class="finance-row"><span>Bank Name</span><span><strong>' + name + '</strong></span></div>' +
      '<div class="finance-row"><span>Capital (30% of cash)</span><span><strong>' + GameData.formatMoney(capital) + '</strong></span></div>',
      '<button class="btn btn-secondary" onclick="GameUI.hideModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="App.confirmOpenBank(\'' + name + '\', ' + capital + ')">Open Bank</button>'
    );
  },

  confirmOpenBank(name, capital) {
    GameUI.hideModal();
    var result = GameEngine.openBank(name, capital);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderBank();
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  // ---- Prestige ----
  startPrestige() {
    GameUI.hideModal();
    // Show family selection for prestige run
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-nav').classList.add('hidden');
    document.getElementById('hud-ticker').classList.add('hidden');
    document.getElementById('hud-goals').classList.add('hidden');
    document.getElementById('screen-splash').classList.add('active');
    document.getElementById('splash-main-btns').style.display = 'none';
    // Reuse family selection — prestige flag stored
    this.startNewGame();
  },

  // ---- Share Prestige Card ----
  sharePrestige() {
    var stats = GameEngine.getPrestigeStats();
    var s = GameEngine.state;
    // Create a canvas card
    var canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 340;
    var ctx = canvas.getContext('2d');
    // Background
    var bg = ctx.createLinearGradient(0, 0, 600, 340);
    bg.addColorStop(0, '#2B1810'); bg.addColorStop(0.5, '#4A2C1A'); bg.addColorStop(1, '#6B4423');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 600, 340);
    // Border
    ctx.strokeStyle = '#D4A84B'; ctx.lineWidth = 4; ctx.strokeRect(8, 8, 584, 324);
    ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1; ctx.strokeRect(14, 14, 572, 312);
    // Title
    ctx.fillStyle = '#F0D890'; ctx.font = 'bold 28px serif'; ctx.textAlign = 'center';
    ctx.fillText('PROPERTY EMPIRE', 300, 50);
    ctx.font = 'italic 14px serif'; ctx.fillStyle = '#C8A868';
    ctx.fillText('Dynasty Legacy Card', 300, 72);
    // Family name
    ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#FFF';
    ctx.fillText(s.familyName || 'Dynasty', 300, 110);
    // Stats
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#E8D8B8'; ctx.textAlign = 'left';
    var y = 145;
    var rows = [
      ['Net Worth', GameData.formatMoney(stats.netWorth)],
      ['Properties', stats.properties + ''],
      ['Cities', stats.cities + ''],
      ['Generations', stats.generation + ''],
      ['Reputation', stats.reputation + '/100'],
      ['Ranking', '#' + stats.rank],
      ['Prestige Score', stats.score + ' pts']
    ];
    for (var i = 0; i < rows.length; i++) {
      ctx.fillStyle = '#A09080'; ctx.fillText(rows[i][0], 60, y);
      ctx.fillStyle = '#F0D890'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(rows[i][1], 300, y);
      ctx.font = '14px sans-serif';
      y += 24;
    }
    // Footer
    ctx.fillStyle = '#6A5A42'; ctx.font = 'italic 11px serif'; ctx.textAlign = 'center';
    ctx.fillText('propertyempire.game • ' + new Date().getFullYear(), 300, 320);

    // Download
    var link = document.createElement('a');
    link.download = 'property-empire-legacy.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    GameUI.toast('Legacy card downloaded!', 'success');
  },

  // ---- Tutorial System ----
  tutorialSteps: [
    { icon: '🏛️', text: '<strong>Welcome to Property Empire!</strong><br>You are founding a dynasty in ' + (GameData.startingYear || 1750) + '. Your goal: build the wealthiest real estate empire across centuries.' },
    { icon: '🌍', text: '<strong>Browse Cities</strong><br>Click any city on the map or in the list to explore its property market. Different cities have different tax rates, growth, and risks.' },
    { icon: '🏠', text: '<strong>Buy Properties</strong><br>In a city, browse the Market tab and click a property to see details. You can <strong>negotiate the price</strong> — lowball for savings or pay full price for guaranteed purchase.' },
    { icon: '💰', text: '<strong>Earn Income</strong><br>After buying, <strong>rent out</strong> your property for monthly income. Refurbish properties to increase rent. Watch out for tenant problems and disasters!' },
    { icon: '▶️', text: '<strong>Advance Time</strong><br>Click <strong>Next Month</strong> or use the speed controls (⏸▶▶▶▶▶▶) in the top bar. Each month brings rent income, expenses, and sometimes important decisions.' },
    { icon: '🎯', text: '<strong>Goals & Decisions</strong><br>Follow the <strong>monthly goals</strong> in the green bar for bonus cash. Historical events and rival families will challenge you with choices. Build your dynasty across generations!' },
  ],

  tutorialStep: 0,

  startTutorial() {
    this.tutorialStep = 0;
    this.showTutorialStep();
    // Bind tutorial buttons
    var self = this;
    document.getElementById('tutorial-next').onclick = function() { self.nextTutorialStep(); };
    document.getElementById('tutorial-skip').onclick = function() { self.endTutorial(); };
  },

  showTutorialStep() {
    var step = this.tutorialSteps[this.tutorialStep];
    if (!step) { this.endTutorial(); return; }

    document.getElementById('tutorial-step').innerHTML =
      '<span class="tutorial-icon">' + step.icon + '</span>' + step.text;
    document.getElementById('tutorial-counter').textContent =
      (this.tutorialStep + 1) + ' / ' + this.tutorialSteps.length;
    document.getElementById('tutorial-next').textContent =
      this.tutorialStep === this.tutorialSteps.length - 1 ? 'Start Playing! 🎮' : 'Next →';
    document.getElementById('tutorial-overlay').classList.remove('hidden');
  },

  nextTutorialStep() {
    this.tutorialStep++;
    if (this.tutorialStep >= this.tutorialSteps.length) {
      this.endTutorial();
    } else {
      this.showTutorialStep();
    }
  },

  endTutorial() {
    document.getElementById('tutorial-overlay').classList.add('hidden');
    GameEngine.state.tutorialDone = true;
    GameEngine.save();
  }
};

// ---- Boot ----
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
