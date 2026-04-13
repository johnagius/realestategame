/**
 * PROPERTY EMPIRE — Ad Manager
 *
 * Shows interstitial ads every N month advances.
 * Supports:
 *   - Native Android (AdMob via JS bridge)
 *   - Web fallback (placeholder interstitial for testing)
 *
 * Purchase "Remove Ads" ($3.99) via Google Play Billing through the bridge.
 */

var AdManager = {

  // Config
  MONTHS_BETWEEN_ADS: 5,
  REMOVE_ADS_PRICE: '$3.99',

  // State
  _monthsSinceAd: 0,
  _adsRemoved: false,
  _initialized: false,

  init: function() {
    if (this._initialized) return;
    this._initialized = true;

    // Check if ads were previously removed (stored in localStorage)
    this._adsRemoved = localStorage.getItem('pe_ads_removed') === 'true';

    // If running in Android WebView with our bridge, sync purchase state
    if (this._hasNativeBridge()) {
      var nativeRemoved = window.PropertyEmpireBridge.isAdsRemoved();
      if (nativeRemoved) {
        this._adsRemoved = true;
        localStorage.setItem('pe_ads_removed', 'true');
      }
    }
  },

  /**
   * Call this after every month advance.
   * Returns true if an ad was shown (caller should wait for dismissal).
   */
  onMonthAdvanced: function() {
    if (this._adsRemoved) return false;

    this._monthsSinceAd++;

    if (this._monthsSinceAd >= this.MONTHS_BETWEEN_ADS) {
      this._monthsSinceAd = 0;
      this._showInterstitial();
      return true;
    }
    return false;
  },

  /** Show an interstitial ad */
  _showInterstitial: function() {
    if (this._hasNativeBridge()) {
      // Native Android — tell the bridge to show a real AdMob interstitial
      window.PropertyEmpireBridge.showInterstitial();
    } else {
      // Web fallback — show a styled placeholder
      this._showWebInterstitial();
    }
  },

  /** Web fallback interstitial (for testing outside Android) */
  _showWebInterstitial: function() {
    var overlay = document.createElement('div');
    overlay.id = 'ad-interstitial';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#FFF;font-family:var(--font-body,sans-serif);';

    var countdown = 3;
    overlay.innerHTML =
      '<div style="max-width:320px;text-align:center">' +
        '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:2px;opacity:0.5;margin-bottom:16px">Advertisement</div>' +
        '<div style="width:300px;height:250px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;border:1px solid rgba(255,255,255,0.1)">' +
          '<div style="text-align:center">' +
            '<div style="font-size:2rem;margin-bottom:8px">🏛️</div>' +
            '<div style="font-size:0.9rem;font-weight:700;color:#F0D68A">Property Empire</div>' +
            '<div style="font-size:0.7rem;opacity:0.6;margin-top:4px">Ad space — AdMob in production</div>' +
          '</div>' +
        '</div>' +
        '<button id="ad-close-btn" disabled style="padding:10px 32px;border-radius:8px;border:2px solid rgba(255,255,255,0.3);background:transparent;color:#FFF;font-size:0.85rem;font-weight:700;cursor:pointer">Close in <span id="ad-countdown">' + countdown + '</span>s</button>' +
        '<div style="margin-top:12px">' +
          '<button style="background:none;border:none;color:#F0D68A;font-size:0.75rem;text-decoration:underline;cursor:pointer;font-weight:600" onclick="AdManager.purchaseRemoveAds()">Remove Ads — ' + this.REMOVE_ADS_PRICE + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Countdown timer
    var timer = setInterval(function() {
      countdown--;
      var el = document.getElementById('ad-countdown');
      if (el) el.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(timer);
        var btn = document.getElementById('ad-close-btn');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Close';
          btn.style.borderColor = '#F0D68A';
          btn.style.color = '#F0D68A';
          btn.onclick = function() {
            var ad = document.getElementById('ad-interstitial');
            if (ad) ad.remove();
          };
        }
      }
    }, 1000);
  },

  /** Initiate "Remove Ads" purchase */
  purchaseRemoveAds: function() {
    if (this._hasNativeBridge()) {
      // Native Android — launch Google Play Billing flow
      window.PropertyEmpireBridge.purchaseRemoveAds();
    } else {
      // Web fallback — simulate purchase for testing
      if (confirm('Remove ads for ' + this.REMOVE_ADS_PRICE + '?\n\n(This would launch Google Play Billing in the APK)')) {
        this._onAdsRemoved();
        GameUI.toast('Ads removed! Thank you for supporting Property Empire.', 'success');
      }
    }
  },

  /** Called when purchase is confirmed (from native bridge or web test) */
  _onAdsRemoved: function() {
    this._adsRemoved = true;
    localStorage.setItem('pe_ads_removed', 'true');
    // Dismiss any visible ad
    var ad = document.getElementById('ad-interstitial');
    if (ad) ad.remove();
    // Re-render settings if open
    if (typeof GameUI !== 'undefined' && GameUI.currentScreen === 'settings') {
      GameUI.renderSettings();
    }
  },

  /** Restore purchase (for Settings screen) */
  restorePurchase: function() {
    if (this._hasNativeBridge()) {
      window.PropertyEmpireBridge.restorePurchase();
    } else {
      GameUI.toast('Restore is only available in the Android app', 'info');
    }
  },

  /** Check if native Android bridge is available */
  _hasNativeBridge: function() {
    return typeof window.PropertyEmpireBridge !== 'undefined';
  },

  /** Whether ads are currently removed */
  isAdsRemoved: function() {
    return this._adsRemoved;
  }
};
