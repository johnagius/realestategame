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
      // Click on dot or label — both have data-city, or find parent group
      var target = e.target.closest('[data-city]');
      if (target) {
        var cityId = target.getAttribute('data-city');
        if (!GameEngine.isCityUnlocked(cityId)) {
          App.showCampaignOffer(cityId);
          return;
        }
        GameUI.currentCityTab = 'market';
        document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
        document.querySelector('.tab-btn[data-tab="market"]').classList.add('active');
        GameUI.showScreen('city', cityId);
      }
    });

    // City search (debounced — avoid re-rendering pins on every keystroke)
    var searchTimer = null;
    document.getElementById('city-search').addEventListener('input', function() {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(function() { GameUI.renderMap(); }, 250);
    });

    // City grid clicks (event delegation)
    document.getElementById('cities-grid').addEventListener('click', function(e) {
      var card = e.target.closest('.city-card');
      if (card) {
        var cityId = card.getAttribute('data-city');
        if (!GameEngine.isCityUnlocked(cityId)) {
          App.showCampaignOffer(cityId);
          return;
        }
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
    if (this._prestigeMode) {
      GameEngine.startPrestige(familyId);
      this._prestigeMode = false;
    } else {
      GameEngine.newGame(familyId);
    }
    this.enterGame(true);
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

  enterGame(isNewGame) {
    // Stop intro animation
    if (typeof IntroScene !== 'undefined') IntroScene.stop();
    document.getElementById('screen-splash').classList.remove('active');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('hud-ticker').classList.remove('hidden');
    document.getElementById('hud-goals').classList.remove('hidden');
    // Generate initial goals
    GameEngine.generateGoals();
    GameUI.updateHUD();

    if (isNewGame && !GameEngine.state.tutorialDone) {
      // New game: drop into London directly, show narrative intro
      GameUI.showScreen('city', 'london');
      this.showOpeningNarrative();
    } else {
      GameUI.showScreen('map');
    }
  },

  showOpeningNarrative() {
    var s = GameEngine.state;
    var family = GameData.families.find(function(f) { return f.id === s.familyId; }) || { name: 'Your family' };
    var rivalId = (s.openingObjective && s.openingObjective.rivalId) || 'rothschild';
    var rival = s.aiFamilies ? s.aiFamilies.find(function(ai) { return ai.id === rivalId; }) : null;
    var rivalName = rival ? rival.name : 'The Rothschilds';
    var rivalNW = rival ? GameData.formatMoney(rival.netWorth) : '€23,000';
    var cash = GameData.formatMoney(s.cash);
    var obj = s.openingObjective || {};
    var targetProps = obj.targetProperties || 3;
    var deadline = obj.deadline || 24;
    var propWord = targetProps === 1 ? '1 property' : targetProps + ' properties';

    GameUI.showModal('🎡 London, 1750',
      '<div style="text-align:center;padding:6px 0">' +
        '<div style="font-size:2.5rem;margin-bottom:8px">🏰</div>' +
        '<div style="font-family:var(--font-heading);font-size:1rem;margin-bottom:10px;color:var(--primary-dark)">' + family.name + '</div>' +
        '<div style="font-size:0.82rem;line-height:1.7;color:var(--text-dark);text-align:left;max-width:340px;margin:0 auto">' +
          'You have arrived in <strong>London</strong> with <strong>' + cash + '</strong> to your name. ' +
          'The property market is ripe with opportunity — but you are not alone.' +
          '<div style="margin:12px 0;padding:10px;background:rgba(27,77,51,0.06);border-radius:8px;border-left:3px solid #1B4D33">' +
            '<span style="font-size:1.2rem">' + (rival ? rival.icon : '🏛️') + '</span> ' +
            '<strong>' + rivalName + '</strong> already have a foothold here, ' +
            'with <strong>' + rivalNW + '</strong> in assets. They are watching.' +
          '</div>' +
          'You have <strong>' + deadline + ' months</strong> to prove your family belongs:' +
          '<div style="margin:10px 0;padding:8px 12px;background:rgba(44,110,73,0.06);border-radius:8px">' +
            '<div style="font-weight:700;color:var(--primary-dark);margin-bottom:4px">Your Objective</div>' +
            '<div>🏠 Buy <strong>' + propWord + '</strong> in London</div>' +
            '<div>💰 Surpass <strong>' + rivalName + '</strong> in net worth</div>' +
            '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px">⏱️ Deadline: ' + deadline + ' months</div>' +
          '</div>' +
          '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:8px">' +
            '<strong>Tip:</strong> Browse the market, buy affordable properties, and rent them out for income. Click "Next Month" to advance time.' +
          '</div>' +
        '</div>' +
      '</div>',
      '<button class="btn btn-primary" onclick="GameUI.hideModal();GameEngine.state.tutorialDone=true;GameEngine.save()">Begin</button>'
    );
    if (typeof GameAudio !== 'undefined') GameAudio.fanfare();
  },

  showCampaignOffer(cityId) {
    var ch = GameEngine.cityUnlockChallenges ? GameEngine.cityUnlockChallenges.find(function(c) { return c.cityId === cityId; }) : null;
    if (!ch) { GameUI.toast('🔒 City locked', 'warning'); return; }

    var city = GameData.cities.find(function(c) { return c.id === cityId; });
    var cityName = city ? city.flag + ' ' + city.name : cityId;
    var trait = city && city.trait ? GameData.cityTraits[city.trait] : null;

    // Calculate difficulty based on position in campaign list (earlier = easier)
    var idx = GameEngine.cityUnlockChallenges.indexOf(ch);
    var totalCampaigns = GameEngine.cityUnlockChallenges.length;
    var diffPct = idx / totalCampaigns;
    var diffLabel, diffColor;
    if (diffPct < 0.25) { diffLabel = 'Early Game'; diffColor = '#2A9D8F'; }
    else if (diffPct < 0.5) { diffLabel = 'Mid Game'; diffColor = '#D4A84B'; }
    else if (diffPct < 0.75) { diffLabel = 'Late Game'; diffColor = '#E07A5F'; }
    else { diffLabel = 'Endgame'; diffColor = '#E63946'; }

    // Check if player can realistically complete this now
    var canComplete = ch.check(GameEngine.state, GameEngine);
    var warningHTML = '';
    if (!canComplete && diffPct > 0.5) {
      warningHTML = '<div style="margin-top:8px;font-size:0.72rem;color:#E63946;padding:6px;background:rgba(230,57,70,0.06);border-radius:6px">' +
        '⚠️ This is a <strong>' + diffLabel + '</strong> campaign. Consider completing easier campaigns first to build your wealth.</div>';
    }
    var trait = city && city.trait ? GameData.cityTraits[city.trait] : null;

    // Show rival info if applicable
    var rivalHTML = '';
    if (ch.rivalId && GameEngine.state.aiFamilies) {
      var rival = GameEngine.state.aiFamilies.find(function(a) { return a.id === ch.rivalId; });
      if (rival) {
        rivalHTML = '<div style="margin:10px 0;padding:8px;background:rgba(27,77,51,0.06);border-radius:8px;border-left:3px solid ' + (rival.color || '#1B4D33') + '">' +
          '<span style="font-size:1.1rem">' + rival.icon + '</span> <strong>' + rival.name + '</strong><br>' +
          '<span style="font-size:0.72rem;color:var(--text-muted)">Net worth: ' + GameData.formatMoney(rival.netWorth) + ' · ' + rival.propertyCount + ' properties</span></div>';
      }
    }

    // Check if another campaign is already active
    var activeCamp = GameEngine.state.activeCampaign;
    var switchWarning = '';
    var btnLabel = 'Start Campaign';
    if (activeCamp) {
      var activeCh = GameEngine.cityUnlockChallenges.find(function(c) { return c.cityId === activeCamp.cityId; });
      var activeCity = GameData.cities.find(function(c) { return c.id === activeCamp.cityId; });
      switchWarning = '<div style="margin-top:8px;font-size:0.72rem;color:#E63946;padding:6px;background:rgba(230,57,70,0.06);border-radius:6px">' +
        '⚠️ This will abandon your current campaign: <strong>' + (activeCh ? activeCh.title : '') + '</strong> (' + (activeCity ? activeCity.name : '') + ')</div>';
      btnLabel = 'Switch Campaign';
    }

    var traitHTML = trait ? '<div style="font-size:0.72rem;margin-top:6px;padding:4px 8px;display:inline-block;border-radius:8px;background:' + trait.color + '15;color:' + trait.color + ';border:1px solid ' + trait.color + '30">' + trait.icon + ' ' + trait.name + '</div>' : '';
    var diffBadge = '<span style="font-size:0.65rem;padding:2px 8px;border-radius:10px;background:' + diffColor + '20;color:' + diffColor + ';font-weight:700;margin-left:6px">' + diffLabel + '</span>';

    GameUI.showModal(ch.icon + ' ' + ch.title + diffBadge,
      '<div style="text-align:center;padding:6px 0">' +
        '<div style="font-size:1.8rem;margin-bottom:6px">' + (city ? (GameData.cityLandmarks[cityId] || {}).landmark || city.flag : '🌍') + '</div>' +
        '<div style="font-family:var(--font-heading);font-size:1rem;color:var(--primary-dark)">' + cityName + '</div>' +
        traitHTML +
        '<div style="font-size:0.82rem;line-height:1.6;color:var(--text-dark);text-align:left;max-width:340px;margin:12px auto 0">' +
          '<div style="margin-bottom:8px;padding:10px;background:rgba(44,110,73,0.06);border-radius:8px">' +
            '<div style="font-weight:700;color:var(--primary-dark);margin-bottom:4px">Objective</div>' +
            '<div>' + ch.challenge + '</div>' +
            '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px">' + ch.description + '</div>' +
          '</div>' +
          rivalHTML +
          warningHTML +
          switchWarning +
        '</div>' +
      '</div>',
      '<button class="btn btn-primary" onclick="App.acceptCampaign(\'' + cityId + '\')">' + btnLabel + '</button>' +
      '<button class="btn btn-ghost" onclick="GameUI.hideModal()">Not Yet</button>'
    );
  },

  acceptCampaign(cityId) {
    // Cancel existing campaign first (if any)
    if (GameEngine.state.activeCampaign) {
      GameEngine.cancelCityCampaign();
    }
    GameUI.hideModal();
    var ch = GameEngine.startCityCampaign(cityId);
    if (ch) {
      GameUI.toast(ch.icon + ' Campaign started: ' + ch.title, 'milestone');
    } else {
      GameUI.toast('Campaign started for ' + cityId, 'info');
      // Force-set if startCityCampaign returned null (edge case)
      if (!GameEngine.state.activeCampaign) {
        var challenge = GameEngine.cityUnlockChallenges.find(function(c) { return c.cityId === cityId; });
        if (challenge && !GameEngine.isCityUnlocked(cityId)) {
          GameEngine.state.activeCampaign = { cityId: cityId, startMonth: GameEngine.state.month, startNW: GameEngine.getNetWorth() };
          if (challenge.setup) challenge.setup(GameEngine.state);
          GameEngine.save();
        }
      }
    }
    GameUI.updateHUD();
    GameUI.renderMap();
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

  _advancing: false,

  advanceMonth() {
    if (this._advancing) return; // prevent double execution
    this._advancing = true;
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
          { label: 'Decline — not for sale', action: 'reject_buyout', data: ai.data }
        ];
      } else if (ai.type === 'threat') {
        aiDecision.choices = [
          { label: 'Stand your ground — "We\'re staying"', action: 'reject_threat', data: ai.data },
          { label: 'Back down — sell a property', action: 'decline', data: ai.data }
        ];
      } else if (ai.type === 'alliance') {
        aiDecision.choices = [
          { label: 'Join alliance — invest ' + GameData.formatMoney(ai.data.amount), action: 'accept_alliance', data: ai.data },
          { label: 'Decline — we work alone', action: 'decline', data: ai.data }
        ];
      }
      aiDecision._isAI = true;
      GameUI.showDecision(aiDecision);
    } else if (results.decision) {
      GameUI.showDecision(results.decision);
    }

    // Rotate tips every few months
    if (GameEngine.state.month % 3 === 0) this.showRandomTip();

    // Refresh current screen so it reflects state changes (refurb complete, values, etc.)
    if (GameUI.currentScreen === 'map') GameUI.renderMap();
    else if (GameUI.currentScreen === 'property') GameUI.renderProperty();
    else if (GameUI.currentScreen === 'city') GameUI.renderCity();
    else if (GameUI.currentScreen === 'portfolio') GameUI.renderPortfolio();
    else if (GameUI.currentScreen === 'finances') GameUI.renderFinances();
    else if (GameUI.currentScreen === 'bank') GameUI.renderBank();
    else if (GameUI.currentScreen === 'settings') GameUI.renderSettings();
    this._advancing = false;
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
      // Remove sold property from compare list
      var cIdx = GameUI.compareList.indexOf(propertyId);
      if (cIdx >= 0) { GameUI.compareList.splice(cIdx, 1); GameUI.updateCompareBar(); }
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

  demolishProperty(propertyId) {
    var p = GameEngine.state.properties.find(function(x) { return x.id === propertyId; });
    var cost = p ? GameData.formatMoney(Math.round(p.currentValue * 0.10)) : '';
    GameUI.showModal(
      'Demolish Property?',
      '<p>This will demolish the building and convert it to land. You keep ownership.</p>' +
      '<p style="font-size:0.8rem;color:var(--text-muted);margin-top:6px">Demolition cost: <strong>' + cost + '</strong><br>Land value will be ~30% of current building value.</p>',
      '<button class="btn btn-secondary" onclick="GameUI.hideModal()">Cancel</button>' +
      '<button class="btn btn-danger" onclick="App.confirmDemolish(\'' + propertyId + '\')">Demolish</button>'
    );
  },

  confirmDemolish(propertyId) {
    GameUI.hideModal();
    var result = GameEngine.demolishProperty(propertyId);
    if (result.success) {
      GameUI.toast(result.message, 'success');
      GameUI.updateHUD();
      GameUI.renderProperty(propertyId);
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

  adjustRent(propertyId, multiplier) {
    var result = GameEngine.adjustRent(propertyId, multiplier);
    if (result.success) {
      GameUI.toast(result.message, 'info');
      GameUI.renderProperty(propertyId);
    } else {
      GameUI.toast(result.message, 'error');
    }
  },

  evictTenant(propertyId) {
    var result = GameEngine.evictTenant(propertyId);
    if (result.success) {
      GameUI.toast(result.message, 'info');
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

    var actualAmt = offers[0] ? offers[0].amount : amount;
    var html = '<div style="max-height:60vh;overflow-y:auto">';
    html += '<p style="margin-bottom:8px;font-size:0.82rem">Loan: <strong>' + GameData.formatMoney(actualAmt) + '</strong>';
    if (actualAmt < amount) html += ' <span style="font-size:0.7rem;color:var(--text-muted)">(of ' + GameData.formatMoney(amount) + ' requested)</span>';
    html += '</p>';

    offers.forEach(function(o, i) {
      var interestCost = o.totalRepayment - o.amount;
      var bg = i === 0 ? 'background:rgba(44,110,73,0.06);border-color:var(--primary-light)' : '';
      html += '<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;' + bg + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<span style="font-weight:700;font-size:0.82rem">' + o.bankIcon + ' ' + (o.bankName || '') + '</span>' +
          (i === 0 ? '<span style="font-size:0.6rem;color:var(--primary);font-weight:700">BEST DEAL</span>' : '') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.75rem;margin-bottom:8px">' +
          '<div>Term: <strong>' + o.termMonths + ' months</strong></div>' +
          '<div>APR: <strong>' + (o.interestRate * 100).toFixed(1) + '%</strong></div>' +
          '<div>Monthly: <strong>' + GameData.formatMoney(o.monthlyPayment) + '</strong></div>' +
          '<div>Interest: <strong style="color:#E63946">' + GameData.formatMoney(interestCost) + '</strong></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-size:0.7rem;color:var(--text-muted)">Total repay: ' + GameData.formatMoney(o.totalRepayment) + '</span>' +
          '<button class="btn btn-primary btn-small" onclick="App.takeLoan(\'' + o.bankId + '\', ' + o.amount + ', ' + o.termMonths + ')">Accept</button>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';

    GameUI.showModal('Loan Offers', html, '');
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

  repayLoan(loanId, amount) {
    var result = GameEngine.repayLoan(loanId, amount);
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
    // Navigate if decision requested it (e.g. open_bank)
    if (result.navigateTo) {
      GameUI.showScreen(result.navigateTo);
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
    // Show family selection — store prestige flag so selectFamily uses startPrestige
    this._prestigeMode = true;
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
