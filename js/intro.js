/* ========================================
   PROPERTY EMPIRE — Hero Splash
   Live 3D London at dusk: slow orbit, drifting clouds, windows flickering on
   as night falls, and an era cycle (Victorian → Digital) every ~8 s.

   API
     Splash.mount(containerEl, opts)
       opts = { quality:'low'|'high', eraCycleMs:8000, startEra:'victorian',
                orbitSpeed:0.07, dayCycleMs:48000, onEra:fn(era, def), hero:true }
     Splash.unmount()
     Splash.currentEra()

   Needs: js/vendor/three.min.js, js/city3d-engine.js, js/cities/london.js, css/splash.css
   Degrades to a CSS silhouette skyline (css/splash.css) when WebGL is unavailable.
   ======================================== */

var Splash = {
  _el: null, _host: null, _timer: null, _raf: null, _eraIdx: 0, _opts: null, _mounted: false, _t0: 0, _fallback: false,

  // Slot progression across eras (London layout scan order: TH AP CM MN SK HO ST VI PH CM WR TH)
  SLOTS: [
    { m: ['TH', 'TH', 'TH', 'TH', 'AP', 'AP'], owner: 'player' },
    { m: ['HO', 'TH', 'AP', 'AP', 'AP', 'SK'], owner: null },
    { m: ['CM', 'CM', 'CM', 'CM', 'CM', 'CM'], owner: 'rival:a' },
    { m: ['MN', 'MN', 'MN', 'MN', 'MN', 'MN'], owner: 'player', cond: 95 },
    { m: ['TH', 'TH', 'AP', 'AP', 'SK', 'SK'], owner: null, listingFrom: 3 },
    { m: ['HO', 'HO', 'HO', 'HO', 'HO', 'HO'], owner: 'rival:b' },
    { m: ['ST', 'ST', 'ST', 'ST', 'ST', 'PH'], owner: null },
    { m: ['VI', 'VI', 'VI', 'VI', 'VI', 'VI'], owner: 'player' },
    { m: ['TH', 'TH', 'AP', 'AP', 'PH', 'PH'], owner: null, renovAt: 4 },
    { m: ['WR', 'WR', 'CM', 'CM', 'CM', 'CM'], owner: null, cond: 40 },
    { m: ['WR', 'WR', 'WR', 'WR', 'WR', 'CM'], owner: 'rival:a' },
    { m: ['TH', 'TH', 'TH', 'AP', 'AP', 'SK'], owner: null },
  ],

  _props: function(eraIdx) {
    var ERAS = City3D.ERA_ORDER, era = ERAS[eraIdx];
    return this.SLOTS.map(function(s, i) {
      return {
        id: 'splash-' + i, type: 'generic', model3d: s.m[eraIdx], name: 'Slot ' + i,
        ownerId: s.owner, condition: s.cond != null ? s.cond : 78,
        isListing: s.listingFrom != null && eraIdx >= s.listingFrom,
        renovation: s.renovAt === eraIdx ? { tier: 'rebuild', yearsLeft: 2 } : null,
      };
    });
  },

  _webglOK: function() {
    try {
      var cv = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (cv.getContext('webgl') || cv.getContext('experimental-webgl')));
    } catch (e) { return false; }
  },

  mount: function(containerEl, opts) {
    if (this._mounted) this.unmount();
    opts = Object.assign({ quality: null, eraCycleMs: 8000, startEra: 'victorian', orbitSpeed: 0.07, dayCycleMs: 48000, hero: true }, opts || {});
    this._opts = opts; this._mounted = true;
    var el = document.createElement('div');
    el.className = 'sp-hero';
    el.innerHTML = '<div class="sp-hero-canvas"></div>' +
      '<div class="sp-hero-fallback"><div class="sp-sky"></div><div class="sp-stars"></div><div class="sp-skyline sp-skyline--far"></div><div class="sp-skyline sp-skyline--near"></div><div class="sp-lights"></div><div class="sp-fog"></div></div>' +
      '<div class="sp-hero-vignette"></div>' +
      '<div class="sp-era-tag"><span class="sp-era-city">London</span><span class="sp-era-sep"></span><span class="sp-era-year">1850</span><span class="sp-era-sep"></span><span class="sp-era-name">Victorian</span></div>';
    containerEl.insertBefore(el, containerEl.firstChild);
    this._el = el; this._host = el.querySelector('.sp-hero-canvas');
    this._eraIdx = Math.max(0, City3D.ERA_ORDER.indexOf(opts.startEra));

    var canRender = this._webglOK() && typeof THREE !== 'undefined' && typeof City3D !== 'undefined' && typeof CityDef_London !== 'undefined';
    if (!canRender) { this._startFallback(); return this; }

    var quality = opts.quality || ((navigator.hardwareConcurrency || 4) < 6 || /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'low' : 'high');
    var ok = false;
    try {
      ok = City3D.renderCity(CityDef_London, this._host, this._props(this._eraIdx), {
        era: City3D.ERA_ORDER[this._eraIdx], quality: quality, night: 0.1,
        playerColor: '#d4a84b', rivalColors: { a: '#3d7bd8', b: '#b84a5a' },
        autoOrbit: opts.orbitSpeed, ambientEvents: false,
      });
    } catch (e) { console.warn('Splash 3D failed', e); ok = false; }
    if (!ok) { this._startFallback(); return this; }
    // Cinematic framing: slightly tighter and centred on the river
    City3D._zoomGoal = 1.18; City3D._cam.zoom = 1.18; City3D._cam.updateProjectionMatrix();
    City3D._camGoal.set(0, 18, 0); City3D._camTarget.set(0, 18, 0); City3D._updateCam();
    City3D._pivot.rotation.y = 0.35;
    el.classList.add('sp-hero--3d');
    this._setTag(this._eraIdx);
    this._t0 = performance.now();
    this._tick();
    this._timer = setInterval(this._nextEra.bind(this), opts.eraCycleMs);
    return this;
  },

  _tick: function() {
    if (!this._mounted || this._fallback) return;
    var self = this;
    this._raf = requestAnimationFrame(function() { self._tick(); });
    var t = (performance.now() - this._t0) / this._opts.dayCycleMs;
    // dusk → night → dusk, eased; windows flicker on as night rises
    var n = 0.52 - 0.47 * Math.cos(t * Math.PI * 2);
    if (Math.abs(n - City3D._night) > 0.004) City3D.setNight(n);
  },

  _nextEra: function() {
    if (!this._mounted) return;
    var prev = this._eraIdx;
    this._eraIdx = (this._eraIdx + 1) % City3D.ERA_ORDER.length;
    var era = City3D.ERA_ORDER[this._eraIdx];
    if (this._fallback) { this._setTag(this._eraIdx); return; }
    City3D.setEra(era, 1800);
    var props = this._props(this._eraIdx), old = this._props(prev);
    for (var i = 0; i < props.length; i++) {
      var a = props[i], b = old[i];
      if (a.model3d !== b.model3d || a.isListing !== b.isListing || !!a.renovation !== !!b.renovation) City3D.updateProperty(a, { animate: true });
    }
    this._setTag(this._eraIdx);
    if (this._opts.onEra) this._opts.onEra(era, City3D.ERAS[era]);
  },

  _setTag: function(idx) {
    var era = City3D.ERA_ORDER[idx], def = City3D.ERAS[era];
    var tag = this._el && this._el.querySelector('.sp-era-tag'); if (!tag) return;
    tag.classList.remove('sp-era-tag--in'); void tag.offsetWidth;
    tag.querySelector('.sp-era-year').textContent = def.years;
    tag.querySelector('.sp-era-name').textContent = def.label;
    tag.classList.add('sp-era-tag--in');
    this._el.setAttribute('data-era', era);
  },

  _startFallback: function() {
    this._fallback = true;
    this._el.classList.add('sp-hero--fallback');
    this._setTag(this._eraIdx);
    this._timer = setInterval(this._nextEra.bind(this), this._opts.eraCycleMs);
  },

  currentEra: function() { return City3D.ERA_ORDER[this._eraIdx]; },

  unmount: function() {
    if (!this._mounted) return;
    this._mounted = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (!this._fallback && typeof City3D !== 'undefined') City3D.destroy();
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null; this._host = null; this._fallback = false;
  },
};

// Backward-compatible shim for app.js (IntroScene.start/stop)
var IntroScene = {
  start: function() {
    var screen = document.getElementById('screen-splash');
    if (!screen || Splash._mounted) return;
    var old = document.getElementById('splash-canvas'); if (old) old.style.display = 'none';
    Splash.mount(screen);
  },
  stop: function() { Splash.unmount(); },
};

document.addEventListener('DOMContentLoaded', function() {
  var screen = document.getElementById('screen-splash');
  if (screen && screen.getAttribute('data-splash') !== 'manual') IntroScene.start();
});
