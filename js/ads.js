/**
 * PROPERTY EMPIRE — Ad Manager (P6.2)
 *
 * Store-safe monetisation layer, web-first with a native bridge:
 *   - Interstitials: only at the year report, gated by wall-clock + year caps
 *     in js/ui/year.js (≤1 per 6 years, ≤1 per 4 minutes, never in the first
 *     15 minutes). This file only counts years and renders the ad.
 *   - Rewarded ads (opt-in) via AdManager.rewarded(placement, onReward).
 *     Placements per bible §12: reroll_board, insider_tip, renovation_speedup,
 *     skip_quiet_years. Native bridge (Capacitor plugin or the legacy
 *     PropertyEmpireBridge) shows a real ad; the web fallback plays a visible
 *     simulated ad, then grants the reward. See docs/monetization.md.
 *   - Remove Ads (€3.99 IAP) is a purchase intent: in app builds it launches the
 *     store billing flow through the bridge; in web builds it opens an
 *     explanatory sheet (never a free confirm() grant — that was v7 theatre).
 *
 * Public API used by the UI: init(), countMonth(), tryShowAd(), isAdsRemoved(),
 * MONTHS_BETWEEN_ADS, _monthsSinceAd (read by the year-report gate), plus
 * requestRemoveAds(), purchaseRemoveAds() (alias), restorePurchase(), rewarded().
 * Loaded before the engine in index.html: reference PE/PEUI only at call time.
 */

var AdManager = {

  // Config
  MONTHS_BETWEEN_ADS: 5, /* years between interstitials once the year.js caps pass */
  REMOVE_ADS_PRICE: '€3.99',
  REWARDED_SECONDS: 4, /* web-fallback "ad" length */
  REWARDED_PLACEMENTS: {
    reroll_board: 'Re-roll the deal board',
    insider_tip: 'Insider tip — the true value of one listing',
    renovation_speedup: 'Renovation speed-up',
    skip_quiet_years: 'Skip quiet years instantly'
  },

  // State
  _monthsSinceAd: 0,
  _adsRemoved: false,
  _initialized: false,
  _adShowing: false,
  _rewardShowing: false,
  _adTimer: null,

  init: function () {
    if (this._initialized) return;
    this._initialized = true;

    try {
      this._adsRemoved = localStorage.getItem('pe_ads_removed') === 'true';
    } catch (e) {
      this._adsRemoved = false;
    }

    // Native builds: the bridge is authoritative for the purchase state.
    if (this._hasNativeBridge()) {
      try {
        if (window.PropertyEmpireBridge.isAdsRemoved()) {
          this._adsRemoved = true;
          try { localStorage.setItem('pe_ads_removed', 'true'); } catch (e) {}
        }
      } catch (e) {}
    }
  },

  /* ---------- Interstitials ---------- */

  /** Count a year end. Always call — the counter ticks every year so the cadence holds. */
  countMonth: function () {
    if (this._adsRemoved) return;
    this._monthsSinceAd++;
  },

  /** Try to show an ad if the counter reached the threshold. The year.js gate applies
      the wall-clock/year caps first. Returns true if an ad was shown. */
  tryShowAd: function () {
    if (this._adsRemoved || this._adShowing) return false;
    if (this._monthsSinceAd >= this.MONTHS_BETWEEN_ADS) {
      this._monthsSinceAd = 0;
      this._showInterstitial();
      return true;
    }
    return false;
  },

  /** Show an interstitial: native when a bridge exposes one, else the visible web placeholder. */
  _showInterstitial: function () {
    if (this._adShowing) return;
    this._adShowing = true;
    if (this._hasNativeBridge() && typeof window.PropertyEmpireBridge.showInterstitial === 'function') {
      window.PropertyEmpireBridge.showInterstitial();
      var self = this;
      setTimeout(function () { self._onAdDismissed(); }, 60000); /* safety if the callback never fires */
    } else {
      this._showWebInterstitial();
    }
  },

  /** Called when an interstitial is dismissed (native callback or web close). */
  _onAdDismissed: function () {
    if (!this._adShowing) return;
    this._adShowing = false;
  },

  _showWebInterstitial: function () {
    if (document.getElementById('ad-interstitial')) return;
    var self = this;
    var overlay = this._overlay('ad-interstitial',
      '<div style="max-width:320px;text-align:center">' +
        '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:2px;opacity:0.5;margin-bottom:16px">Advertisement</div>' +
        '<div style="width:300px;height:250px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;border:1px solid rgba(255,255,255,0.1)">' +
          '<div style="text-align:center">' +
            '<div style="font-size:2rem;margin-bottom:8px">&#127963;</div>' +
            '<div style="font-size:0.9rem;font-weight:700;color:#F0D68A">Property Empire</div>' +
            '<div style="font-size:0.7rem;opacity:0.6;margin-top:4px">Ad space &mdash; AdMob in app builds</div>' +
          '</div>' +
        '</div>' +
        '<button id="ad-close-btn" disabled style="padding:10px 32px;border-radius:8px;border:2px solid rgba(255,255,255,0.3);background:transparent;color:#FFF;font-size:0.85rem;font-weight:700;cursor:pointer">Close in <span id="ad-countdown">3</span>s</button>' +
        '<div style="margin-top:12px">' +
          '<button id="ad-remove-btn" style="background:none;border:none;color:#F0D68A;font-size:0.75rem;text-decoration:underline;cursor:pointer;font-weight:600">Remove Ads &mdash; ' + this.REMOVE_ADS_PRICE + '</button>' +
        '</div>' +
      '</div>');
    if (!overlay) return;

    var removeBtn = document.getElementById('ad-remove-btn');
    if (removeBtn) removeBtn.addEventListener('click', function () { AdManager.requestRemoveAds(); });

    var countdown = 3;
    this._adTimer = setInterval(function () {
      countdown--;
      var el = document.getElementById('ad-countdown');
      if (el) el.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(self._adTimer); self._adTimer = null;
        var btn = document.getElementById('ad-close-btn');
        if (btn) {
          btn.disabled = false; btn.textContent = 'Close';
          btn.style.borderColor = '#F0D68A'; btn.style.color = '#F0D68A';
          btn.addEventListener('click', function () { self._dismissWebAd('ad-interstitial'); });
        }
      }
    }, 1000);
  },

  _dismissWebAd: function (id) {
    if (this._adTimer) { clearInterval(this._adTimer); this._adTimer = null; }
    var ad = document.getElementById(id || 'ad-interstitial');
    if (ad) ad.remove();
    this._onAdDismissed();
  },

  /* ---------- Rewarded ads (opt-in) ---------- */

  /** Play a rewarded ad for one of the REWARDED_PLACEMENTS, then call
      onReward({ placement, rewarded }). In app builds the bridge shows a real
      AdMob rewarded ad; on the web a visible simulated ad plays and the reward
      is granted on completion. No reward without completion; nothing plays when
      ads are removed (the placement buttons should be hidden then anyway). */
  rewarded: function (placement, onReward) {
    if (!this.REWARDED_PLACEMENTS[placement]) {
      if (onReward) onReward({ placement: placement, rewarded: false, reason: 'unknown placement' });
      return false;
    }
    if (this._rewardShowing || this._adShowing) return false;
    if (this._adsRemoved) {
      if (onReward) onReward({ placement: placement, rewarded: false, reason: 'ads removed' });
      return false;
    }
    this._rewardShowing = true;
    var self = this, done = false;
    function finish(rewarded, reason) {
      if (done) return; done = true;
      self._rewardShowing = false;
      var ad = document.getElementById('ad-rewarded'); if (ad) ad.remove();
      if (onReward) { try { onReward({ placement: placement, rewarded: rewarded, reason: reason }); } catch (e) {} }
    }
    if (this._hasNativeBridge() && typeof window.PropertyEmpireBridge.showRewarded === 'function') {
      /* Bridge contract: it calls AdManager._onRewardEarned() on completion and
         AdManager._onRewardClosed() on dismiss. We keep the placement on AdManager. */
      this._pendingReward = { placement: placement, cb: finish };
      try { window.PropertyEmpireBridge.showRewarded(placement); }
      catch (e) { this._pendingReward = null; this._rewardShowing = false; finish(false, 'bridge error'); return false; }
      setTimeout(function () { if (AdManager._pendingReward) { AdManager._pendingReward = null; finish(false, 'timeout'); } }, 90000);
      return true;
    }
    /* Web fallback: a visible simulated ad, then the reward. */
    var secs = this.REWARDED_SECONDS;
    var overlay = this._overlay('ad-rewarded',
      '<div style="max-width:320px;text-align:center">' +
        '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:2px;opacity:0.5;margin-bottom:16px">Rewarded advertisement</div>' +
        '<div style="width:300px;height:220px;background:linear-gradient(135deg,#14202e,#0f1a2e);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;border:1px solid rgba(240,214,138,0.25)">' +
          '<div style="text-align:center">' +
            '<div style="font-size:2rem;margin-bottom:8px">&#127963;</div>' +
            '<div style="font-size:0.9rem;font-weight:700;color:#F0D68A">' + this.REWARDED_PLACEMENTS[placement] + '</div>' +
            '<div style="font-size:0.7rem;opacity:0.6;margin-top:4px">A rewarded ad plays here in app builds</div>' +
          '</div>' +
        '</div>' +
        '<button id="ad-claim-btn" disabled style="padding:10px 32px;border-radius:8px;border:2px solid rgba(255,255,255,0.3);background:transparent;color:#FFF;font-size:0.85rem;font-weight:700;cursor:pointer">Reward in <span id="ad-reward-count">' + secs + '</span>s</button>' +
        '<div style="margin-top:10px"><button id="ad-skip-btn" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:0.75rem;text-decoration:underline;cursor:pointer">No thanks</button></div>' +
      '</div>');
    if (!overlay) { this._rewardShowing = false; return false; }
    var timer = setInterval(function () {
      secs--;
      var el = document.getElementById('ad-reward-count');
      if (el) el.textContent = Math.max(0, secs);
      if (secs <= 0) {
        clearInterval(timer);
        var btn = document.getElementById('ad-claim-btn');
        if (btn) {
          btn.disabled = false; btn.textContent = 'Claim reward';
          btn.style.borderColor = '#F0D68A'; btn.style.color = '#F0D68A';
          btn.addEventListener('click', function () { finish(true, 'completed'); });
        }
      }
    }, 1000);
    var skip = document.getElementById('ad-skip-btn');
    if (skip) skip.addEventListener('click', function () { clearInterval(timer); finish(false, 'dismissed'); });
    return true;
  },

  /** Bridge callbacks for the native rewarded flow (see rewarded()). */
  _onRewardEarned: function () {
    if (this._pendingReward) { var p = this._pendingReward; this._pendingReward = null; p.cb(true, 'completed'); }
  },
  _onRewardClosed: function () {
    if (this._pendingReward) { var p = this._pendingReward; this._pendingReward = null; p.cb(false, 'dismissed'); }
  },

  /* ---------- Remove Ads (IAP) ---------- */

  /** Purchase intent. App builds: launches billing via the bridge. Web builds:
      opens an explanatory sheet — the web build has nothing to sell yet, so we
      explain instead of granting (the old confirm() free-grant is gone). */
  requestRemoveAds: function () {
    this.init();
    if (this._hasNativeBridge() && typeof window.PropertyEmpireBridge.purchaseRemoveAds === 'function') {
      window.PropertyEmpireBridge.purchaseRemoveAds();
      return;
    }
    this._showRemoveAdsSheet();
  },

  /** Back-compat alias (v7 UI and the legacy interstitial call this name). */
  purchaseRemoveAds: function () { this.requestRemoveAds(); },

  _showRemoveAdsSheet: function () {
    var body = [
      this._el('p', { text: 'Property Empire is free to play. Interstitials appear at most once per six years and once per four minutes, never in the first fifteen minutes, never mid-deal — and a rewarded ad is always your choice.' }),
      this._el('p', { text: 'Remove Ads (' + this.REMOVE_ADS_PRICE + ') removes every interstitial and rewarded placement for good. It is a store purchase handled by Google Play or the App Store inside the app — this web build cannot sell it, and we will never charge a browser player.' }),
      this._el('p', { text: 'How we handle your data: the game saves live on this device. App builds show ads through Google AdMob with GDPR consent (UMP) where required. Full details in the privacy policy.' })
    ];
    var link = this._el('a', { text: 'Read the privacy policy' });
    link.href = 'docs/privacy-policy.md';
    link.target = '_blank'; link.rel = 'noopener';
    link.style.color = 'var(--gold, #B08D3C)';
    body.push(link);

    if (this._peui() && this._peui().sheet && this._peui().sheet.open) {
      this._peui().sheet.open({ id: 'remove-ads', title: 'Remove Ads ' + this.REMOVE_ADS_PRICE, sub: 'Store purchase', body: body });
      return;
    }
    /* Pre-boot fallback: a plain overlay until PEUI is ready. */
    if (document.getElementById('ad-remove-sheet')) return;
    var overlay = this._overlay('ad-remove-sheet',
      '<div style="max-width:340px;background:var(--surface,#1d2733);color:var(--ink,#F3EBDD);border-radius:14px;padding:20px;border:1px solid rgba(240,214,138,0.3);text-align:left">' +
        '<div style="font-weight:700;margin-bottom:8px">Remove Ads ' + this.REMOVE_ADS_PRICE + '</div>' +
        '<p style="font-size:0.85rem;opacity:0.85;margin:0 0 10px">This web build cannot sell the Remove Ads purchase — inside the Android/iOS app it is a store purchase that removes every interstitial and rewarded placement.</p>' +
        '<button id="ad-remove-close" style="padding:8px 24px;border-radius:8px;border:1px solid rgba(240,214,138,0.4);background:transparent;color:inherit;cursor:pointer">Close</button>' +
      '</div>');
    if (overlay) document.getElementById('ad-remove-close').addEventListener('click', function () { var el = document.getElementById('ad-remove-sheet'); if (el) el.remove(); });
  },

  /** Called by the bridge when the purchase is confirmed. */
  _onAdsRemoved: function () {
    this._adsRemoved = true;
    try { localStorage.setItem('pe_ads_removed', 'true'); } catch (e) {}
    var ad = document.getElementById('ad-interstitial'); if (ad) ad.remove();
    if (this._peui() && this._peui().toast) this._peui().toast('Ads removed. Thank you for supporting Property Empire.', 'success');
  },

  /** Restore purchase (settings). */
  restorePurchase: function () {
    if (this._hasNativeBridge() && typeof window.PropertyEmpireBridge.restorePurchase === 'function') {
      window.PropertyEmpireBridge.restorePurchase();
    } else if (this._peui() && this._peui().toast) {
      this._peui().toast('Restore is only available in the app builds.', 'info');
    }
  },

  /* ---------- Helpers ---------- */

  isAdsRemoved: function () { return this._adsRemoved; },

  _hasNativeBridge: function () {
    return typeof window !== 'undefined' && typeof window.PropertyEmpireBridge !== 'undefined';
  },

  _peui: function () { return (typeof window !== 'undefined' && window.PEUI) ? window.PEUI : null; },

  _el: function (tag, opts) {
    var el = document.createElement(tag);
    if (opts && opts.text) el.textContent = opts.text;
    return el;
  },

  _overlay: function (id, html) {
    if (typeof document === 'undefined') return null;
    var existing = document.getElementById(id); if (existing) return existing;
    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Advertisement');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,8,6,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#FFF;font-family:var(--font-body,Georgia,serif);';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    return overlay;
  }
};
