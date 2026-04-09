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
    GameEngine.newGame();
    this.enterGame();
  },

  continueGame() {
    var state = GameEngine.loadGame();
    if (state) {
      this.enterGame();
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
    GameEngine.deleteSave();
    GameEngine.newGame();
    GameUI.updateHUD();
    GameUI.showScreen('map');
    GameUI.toast('New game started!', 'success');
  }
};

// ---- Boot ----
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
