/* ========================================
   PROPERTY EMPIRE - App Controller
   ======================================== */

const App = {

  init() {
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
    document.getElementById('btn-advance-month').addEventListener('click', function() { App.advanceMonth(); });
    document.querySelectorAll('.btn-advance-alt').forEach(function(btn) {
      btn.addEventListener('click', function() { App.advanceMonth(); });
    });

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
    // Start on slow auto-play by default so game feels alive
    GameUI.setAutoAdvance(1);
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
    GameUI.updateHUD();
    GameUI.showScreen('map');
  },

  advanceMonth() {
    var results = GameEngine.advanceMonth();
    GameUI.updateHUD();
    GameUI.showMonthResults(results);

    // Refresh current screen
    if (GameUI.currentScreen === 'map') GameUI.renderMap();
    else if (GameUI.currentScreen === 'city') GameUI.renderCity();
    else if (GameUI.currentScreen === 'portfolio') GameUI.renderPortfolio();
    else if (GameUI.currentScreen === 'finances') GameUI.renderFinances();
    else if (GameUI.currentScreen === 'bank') GameUI.renderBank();
    else if (GameUI.currentScreen === 'settings') GameUI.renderSettings();
  },

  buyProperty(propertyId, cityId) {
    var result = GameEngine.buyProperty(propertyId, cityId);
    if (result.success) {
      GameUI.toast(result.message, 'success');
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

  refurbishProperty(propertyId) {
    var result = GameEngine.refurbishProperty(propertyId);
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

    var html = '<p style="margin-bottom:12px">Loan offers for <strong>' + GameData.formatMoney(amount) + '</strong>:</p>';
    offers.forEach(function(o) {
      html += '<div class="loan-option" onclick="App.takeLoan(\'' + o.bankId + '\', ' + o.amount + ', ' + o.termMonths + ')">' +
        '<div class="loan-term">' + o.bankIcon + ' ' + o.termMonths + ' months</div>' +
        '<div class="loan-rate">' + (o.interestRate * 100).toFixed(1) + '% APR</div>' +
        '<div class="loan-payment">' + GameData.formatMoney(o.monthlyPayment) + '/mo</div>' +
        '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px">Total: ' + GameData.formatMoney(o.totalRepayment) + '</div>' +
      '</div>';
    });

    GameUI.showModal('Loan Offers', '<div class="loan-options">' + html + '</div>', '');
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
  }
};

// ---- Boot ----
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
