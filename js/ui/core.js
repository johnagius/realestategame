/* PEUI core — formatting, DOM helpers, icon sprite, toast (single, coalesced),
   bottom sheet (scrim, focus trap, Escape), screen registry/render, event
   delegation (data-action / data-input / data-change), preferences, save.
   Plain script; everything hangs off window.PEUI. State lives in the engine. */
(function (root) {
  var PEUI = root.PEUI = root.PEUI || {};
  var doc = root.document;

  PEUI.VERSION = 'v8.10';
  PEUI.SPRITE = 'assets/icons.svg';

  /* ---------- Formatting (one money formatter, engine currency) ---------- */
  function cur() { return (root.PE && root.PE.Data && root.PE.Data.currency) || '£'; }
  function trim(s) { return s.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1'); }
  PEUI.fmt = {
    money: function (v, full) {
      if (v === null || v === undefined || isNaN(v)) return '—';
      var neg = v < 0, a = Math.abs(Math.round(v)), s;
      if (full || a < 10000) s = a.toLocaleString('en-GB');
      else if (a < 1e6) s = trim((a / 1e3).toFixed(a < 1e5 ? 1 : 0)) + 'K';
      else if (a < 1e9) s = trim((a / 1e6).toFixed(a < 1e8 ? 1 : 0)) + 'M';
      else s = trim((a / 1e9).toFixed(a < 1e11 ? 1 : 0)) + 'B';
      return (neg ? '−' : '') + cur() + s;
    },
    signed: function (v) { return (v >= 0 ? '+' : '') + PEUI.fmt.money(v); },
    pct: function (x, d) { return (x * 100).toFixed(d || 0) + '%'; },
    int: function (v) { return Math.round(v).toLocaleString('en-GB'); },
    psqm: function (v) { return cur() + (v >= 100 ? Math.round(v).toLocaleString('en-GB') : v.toFixed(v >= 10 ? 1 : 2)) + '/m²'; },
    ordinal: function (n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  };

  /* ---------- DOM ---------- */
  var SVG = 'http://www.w3.org/2000/svg', XLINK = 'http://www.w3.org/1999/xlink';
  PEUI.h = function (tag, attrs, children) {
    var el = doc.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    if (children !== undefined) PEUI.append(el, children);
    return el;
  };
  PEUI.append = function (el, children) {
    if (children === null || children === undefined || children === false) return el;
    if (Array.isArray(children)) { for (var i = 0; i < children.length; i++) PEUI.append(el, children[i]); return el; }
    if (typeof children === 'string' || typeof children === 'number') el.appendChild(doc.createTextNode(String(children)));
    else el.appendChild(children);
    return el;
  };
  PEUI.icon = function (name, cls, label) {
    var svg = doc.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
    if (label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); } else svg.setAttribute('aria-hidden', 'true');
    var use = doc.createElementNS(SVG, 'use');
    use.setAttribute('href', PEUI.SPRITE + '#icon-' + name);
    use.setAttributeNS(XLINK, 'xlink:href', PEUI.SPRITE + '#icon-' + name);
    svg.appendChild(use);
    return svg;
  };
  PEUI.setText = function (el, text) { if (el && el.textContent !== String(text)) el.textContent = text; };
  PEUI.empty = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  PEUI.btn = function (label, opts) {
    opts = opts || {};
    var b = PEUI.h('button', { type: 'button', class: 'btn ' + (opts.cls || 'btn--secondary'), 'data-action': opts.action, 'aria-label': opts.ariaLabel, disabled: opts.disabled });
    for (var k in opts) if (k.indexOf('data-') === 0) b.setAttribute(k, opts[k]);
    if (opts.icon) b.appendChild(PEUI.icon(opts.icon));
    if (label) b.appendChild(PEUI.h('span', { text: label }));
    return b;
  };
  PEUI.chip = function (text, kind, icon) { var c = PEUI.h('span', { class: 'chip' + (kind ? ' chip--' + kind : '') }); if (icon) c.appendChild(PEUI.icon(icon)); c.appendChild(doc.createTextNode(text)); return c; };
  PEUI.badge = function (text, kind) { return PEUI.h('span', { class: 'badge badge--' + (kind || 'neutral'), text: text }); };
  PEUI.bar = function (frac, kind, marks, label) {
    var b = label ? PEUI.h('div', { class: 'bar', role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(Math.max(0, Math.min(1, frac)) * 100) }) : PEUI.h('div', { class: 'bar', 'aria-hidden': 'true' });
    b.appendChild(PEUI.h('div', { class: 'bar__fill' + (kind ? ' bar__fill--' + kind : ''), style: 'width:' + (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + '%' }));
    if (marks) for (var i = 0; i < marks.length; i++) b.appendChild(PEUI.h('div', { class: 'bar__mark', style: 'left:' + (marks[i] * 100).toFixed(1) + '%' }));
    return b;
  };
  PEUI.trend = function (t) {
    var cls = t >= 4 ? 'up' : t <= 2 ? 'down' : 'flat', name = { up: 'arrow-up', down: 'arrow-down', flat: 'arrow-flat' }[cls];
    var label = ['', 'Declining', 'Softening', 'Stable', 'Up-and-coming', 'Hot'][t] || 'Stable';
    var el = PEUI.h('span', { class: 'trend trend--' + cls, title: label });
    el.appendChild(PEUI.icon(name, null, label)); el.appendChild(doc.createTextNode(label));
    return el;
  };
  PEUI.conditionKind = function (c) { return c >= 65 ? 'success' : c >= 40 ? 'info' : c >= 20 ? 'warn' : 'danger'; };
  PEUI.ltvKind = function (l) { return l > 0.85 ? 'danger' : l > 0.78 ? 'warn' : 'info'; };

  /* Keyed list patching: reuse unchanged cards, replace changed ones, drop missing. */
  PEUI.patchList = function (container, items, keyFn, hashFn, renderFn) {
    var byKey = {}, i, k, child;
    for (i = 0; i < container.children.length; i++) { child = container.children[i]; if (child.dataset.key) byKey[child.dataset.key] = child; }
    var order = [];
    for (i = 0; i < items.length; i++) {
      k = String(keyFn(items[i])); var hash = String(hashFn(items[i])), el = byKey[k];
      if (!el || el.dataset.hash !== hash) {
        var fresh = renderFn(items[i]); fresh.dataset.key = k; fresh.dataset.hash = hash;
        if (el) container.replaceChild(fresh, el); else container.appendChild(fresh);
        el = fresh;
      }
      delete byKey[k]; order.push(el);
    }
    for (k in byKey) container.removeChild(byKey[k]);
    for (i = 0; i < order.length; i++) if (container.children[i] !== order[i]) container.insertBefore(order[i], container.children[i] || null);
  };

  /* ---------- Preferences (per device; game state is in the engine) ---------- */
  var PREF_KEY = 'pe_v8_prefs';
  PEUI.prefs = { sound: true, quality: 'auto', theme: 'auto', lastAdAt: 0, gameStartedAt: 0, lastAdYear: -99 };
  PEUI.loadPrefs = function () { try { var raw = root.localStorage.getItem(PREF_KEY); if (raw) { var p = JSON.parse(raw); for (var k in p) PEUI.prefs[k] = p[k]; } } catch (e) {} PEUI.applyPrefs(); };
  PEUI.savePrefs = function () { try { root.localStorage.setItem(PREF_KEY, JSON.stringify(PEUI.prefs)); } catch (e) {} PEUI.applyPrefs(); };
  PEUI.applyPrefs = function () {
    if (root.GameAudio) root.GameAudio.muted = !PEUI.prefs.sound;
    if (PEUI.prefs.theme === 'auto') doc.documentElement.removeAttribute('data-theme'); else doc.documentElement.setAttribute('data-theme', PEUI.prefs.theme);
  };
  PEUI.sound = function (name) { try { if (root.GameAudio && !root.GameAudio.muted && root.GameAudio[name]) root.GameAudio[name](); } catch (e) {} };

  /* ---------- Engine call wrapper: every result checked, failure = one toast ---------- */
  PEUI.call = function (fn) {
    var args = Array.prototype.slice.call(arguments, 1), r;
    try { r = fn.apply(null, args); } catch (e) { r = { ok: false, message: 'Internal error: ' + e.message }; }
    if (!r || !r.ok) PEUI.toast((r && r.message) || 'Something went wrong', 'danger');
    return r || { ok: false, message: 'No result' };
  };
  PEUI.save = function () { try { if (root.PE && root.PE.Game && root.PE.Game.state()) root.PE.Game.save(); } catch (e) {} };

  /* ---------- Rewarded ads: one helper for every placement.
     Callers decide button visibility; this only plays the ad, grants on a true
     reward, and reports the watch to analytics. skip_quiet_years stays unwired
     by design (the 5-year free skip is the only time skip). ---------- */
  PEUI.rewarded = function (placement, grant) {
    var AM = root.AdManager;
    if (!AM || typeof AM.rewarded !== 'function') { PEUI.toast('Ads are not available here.'); return; }
    AM.rewarded(placement, function (res) {
      if (res && res.rewarded === true) {
        try { if (root.PE && root.PE.Analytics) root.PE.Analytics.track('rewarded_watched', { placement: placement }); } catch (e) {}
        try { grant(); } catch (e) { console.error('reward grant', e); PEUI.toast('Something went wrong: ' + e.message, 'danger'); }
      } else {
        PEUI.toast('No reward — the ad was not completed.');
      }
    });
  };
  PEUI.adsRemoved = function () { return !!(root.AdManager && root.AdManager.isAdsRemoved && root.AdManager.isAdsRemoved()); };

  /* ---------- Toast: one element, aria-live, coalesced ---------- */
  var toastEl = null, toastTimer = null, toastLast = { text: '', count: 0, at: 0 };
  PEUI.toast = function (text, kind) {
    if (!text) return;
    if (kind !== 'danger' && document.getElementById('titlecard') && document.getElementById('titlecard').classList.contains('is-open')) return;
    if (!toastEl) { toastEl = PEUI.h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }); doc.body.appendChild(toastEl); }
    var now = Date.now();
    if (toastLast.text === text && now - toastLast.at < 4000) toastLast.count++; else { toastLast.text = text; toastLast.count = 1; }
    toastLast.at = now;
    PEUI.empty(toastEl);
    toastEl.className = 'toast' + (kind ? ' toast--' + kind : '');
    toastEl.appendChild(doc.createTextNode(text));
    if (toastLast.count > 1) toastEl.appendChild(PEUI.h('span', { class: 'toast__count', text: '×' + toastLast.count }));
    // restart the transition
    toastEl.classList.remove('is-on'); void toastEl.offsetWidth; toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, kind === 'danger' ? 4200 : 3000);
  };

  /* ---------- Sheet ---------- */
  var sheet = { el: null, scrim: null, open: false, onClose: null, returnTo: null, id: null };
  function sheetEls() {
    if (sheet.el) return;
    sheet.scrim = PEUI.h('div', { class: 'scrim hidden', 'data-action': 'sheet-close' });
    sheet.el = PEUI.h('div', { class: 'sheet hidden', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title', tabindex: '-1' });
    doc.body.appendChild(sheet.scrim); doc.body.appendChild(sheet.el);
    sheet.el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); PEUI.sheet.close(); return; }
      if (e.key !== 'Tab') return;
      var f = sheet.el.querySelectorAll('button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])');
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  PEUI.sheet = {
    open: function (o) {
      sheetEls();
      var wasOpen = sheet.open;
      if (!wasOpen) sheet.returnTo = doc.activeElement;
      if (sheet.onClose && wasOpen) { var cb = sheet.onClose; sheet.onClose = null; cb(); }
      sheet.onClose = o.onClose || null; sheet.id = o.id || null;
      PEUI.empty(sheet.el);
      sheet.el.appendChild(PEUI.h('div', { class: 'sheet__grip' }));
      var head = PEUI.h('div', { class: 'sheet__head' });
      if (o.back) head.appendChild(PEUI.btn('', { cls: 'btn--ghost btn-icon', icon: 'back', action: o.back, ariaLabel: 'Back' }));
      var t = PEUI.h('div', { class: 'sheet__title', id: 'sheet-title' }, o.title || '');
      if (o.sub) t.appendChild(PEUI.h('div', { class: 'sheet__sub', text: o.sub }));
      head.appendChild(t);
      head.appendChild(PEUI.btn('', { cls: 'btn--ghost btn-icon', icon: 'close', action: 'sheet-close', ariaLabel: 'Close' }));
      sheet.el.appendChild(head);
      var body = PEUI.h('div', { class: 'sheet__body', tabindex: '0' }, o.body);
      sheet.el.appendChild(body);
      if (o.foot) sheet.el.appendChild(PEUI.h('div', { class: 'sheet__foot' }, o.foot));
      sheet.scrim.classList.remove('hidden'); sheet.el.classList.remove('hidden');
      void sheet.el.offsetWidth;
      sheet.scrim.classList.add('is-open'); sheet.el.classList.add('is-open');
      sheet.open = true;
      var focusable = sheet.el.querySelector('.sheet__body button:not(:disabled), .sheet__body input, .sheet__foot button:not(:disabled)');
      (focusable || sheet.el).focus({ preventScroll: true });
      return body;
    },
    close: function () {
      if (!sheet.open) return;
      sheet.open = false; sheet.id = null;
      sheet.scrim.classList.remove('is-open'); sheet.el.classList.remove('is-open');
      var el = sheet.el, sc = sheet.scrim;
      setTimeout(function () { if (!sheet.open) { el.classList.add('hidden'); sc.classList.add('hidden'); } }, 300);
      var cb = sheet.onClose; sheet.onClose = null;
      if (sheet.returnTo && sheet.returnTo.focus && doc.body.contains(sheet.returnTo)) { try { sheet.returnTo.focus({ preventScroll: true }); } catch (e) {} }
      sheet.returnTo = null;
      if (cb) cb();
    },
    isOpen: function () { return sheet.open; },
    id: function () { return sheet.id; },
    body: function () { return sheet.el ? sheet.el.querySelector('.sheet__body') : null; },
    foot: function () { return sheet.el ? sheet.el.querySelector('.sheet__foot') : null; }
  };

  /* ---------- Screens ---------- */
  PEUI.screens = {};
  PEUI.current = null;
  PEUI.register = function (name, def) { PEUI.screens[name] = def; };
  PEUI.render = function (name, ctx) {
    var def = PEUI.screens[name]; if (!def) return;
    if (PEUI.current && PEUI.screens[PEUI.current].unmount && PEUI.current !== name) PEUI.screens[PEUI.current].unmount();
    var all = doc.querySelectorAll('.screen');
    for (var i = 0; i < all.length; i++) all[i].classList.toggle('is-active', all[i].id === 'screen-' + name);
    var el = doc.getElementById('screen-' + name);
    PEUI.current = name;
    if (def.mount) def.mount(el, ctx || {});
    var nav = doc.querySelectorAll('.nav__btn');
    for (var j = 0; j < nav.length; j++) { if (nav[j].dataset.screen === name) nav[j].setAttribute('aria-current', 'page'); else nav[j].removeAttribute('aria-current'); }
    doc.body.setAttribute('data-screen', name);
    if (PEUI.updateHUD) PEUI.updateHUD();
    if (PEUI.updateNav) PEUI.updateNav();
    if (PEUI.guide) PEUI.guide.syncTop();
  };
  /* After every engine mutation: patch HUD, nav badges and the active screen. */
  PEUI.refresh = function () {
    if (!root.PE.Game.state()) return;
    if (PEUI.updateHUD) PEUI.updateHUD();
    if (PEUI.updateNav) PEUI.updateNav();
    var def = PEUI.current && PEUI.screens[PEUI.current];
    if (def && def.update) def.update(doc.getElementById('screen-' + PEUI.current));
    if (PEUI.guide) PEUI.guide.syncTop();
  };

  /* ---------- Event delegation ---------- */
  PEUI.actions = {};
  PEUI.inputs = {};
  function closestAction(e, attr) { var t = e.target; while (t && t !== doc) { if (t.getAttribute && t.hasAttribute(attr)) return t; t = t.parentNode; } return null; }
  doc.addEventListener('click', function (e) {
    var el = closestAction(e, 'data-action'); if (!el) return;
    var name = el.getAttribute('data-action'), fn = PEUI.actions[name];
    if (!fn) return;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    e.preventDefault();
    try { fn(el, el.dataset, e); } catch (err) { console.error('action ' + name, err); PEUI.toast('Something went wrong: ' + err.message, 'danger'); }
  });
  function onInput(e) {
    var el = closestAction(e, 'data-input'); if (!el) return;
    var fn = PEUI.inputs[el.getAttribute('data-input')]; if (!fn) return;
    if (el.type === 'range') { var pct = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--pct', pct.toFixed(1) + '%'); }
    try { fn(el, el.dataset, e); } catch (err) { console.error('input', err); }
  }
  doc.addEventListener('input', onInput);
  doc.addEventListener('change', onInput);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var pop = doc.querySelector('.popover.is-open'); if (pop) pop.classList.remove('is-open'); } });
  PEUI.actions['sheet-close'] = function () { PEUI.sheet.close(); };
  PEUI.range = function (attrs) { var r = PEUI.h('input', attrs); r.type = 'range'; r.className = 'range'; var pct = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--pct', pct.toFixed(1) + '%'); return r; };

  /* ---------- Feedback: confetti and money floats (only for things the player caused) ---------- */
  PEUI.confetti = function (n) {
    if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var box = PEUI.h('div', { class: 'confetti', 'aria-hidden': 'true' }), colors = ['#D9B45C', '#2C6E49', '#3D5A80', '#C41E3A', '#F3D98A', '#2A9D8F'];
    for (var i = 0; i < (n || 40); i++) box.appendChild(PEUI.h('i', { style: 'left:' + (Math.random() * 100).toFixed(1) + '%;background:' + colors[i % colors.length] + ';animation-delay:' + (Math.random() * 0.5).toFixed(2) + 's;animation-duration:' + (1.2 + Math.random()).toFixed(2) + 's' }));
    doc.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 2600);
  };
  PEUI.moneyFloat = function (anchor, amount) {
    if (!anchor || !anchor.getBoundingClientRect) return;
    var r = anchor.getBoundingClientRect();
    var el = PEUI.h('div', { class: 'money-float ' + (amount >= 0 ? 'pos' : 'neg'), text: PEUI.fmt.signed(amount), style: 'left:' + Math.round(r.left + r.width / 2 - 30) + 'px;top:' + Math.round(r.top) + 'px' });
    doc.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
  };

  /* ---------- Helpers shared by screens ---------- */
  PEUI.summary = function () { return root.PE.Game.summary(); };
  PEUI.cityName = function (id) { var c = root.PE.Data.cityById[id]; return c ? c.name : id; };
  PEUI.rivalName = function (ownerId) { if (!ownerId) return 'Unowned'; if (ownerId === 'player') return 'You'; var rd = root.PE.Data.rivalById(String(ownerId).replace('rival:', '')); return rd ? rd.name : ownerId; };
  PEUI.rivalColors = function () { var out = {}, rs = root.PE.Data.rivals; for (var i = 0; i < rs.length; i++) out[rs[i].id] = rs[i].color; return out; };
  PEUI.crestLetter = function (name) { return (name || '?').replace(/^The /, '').charAt(0).toUpperCase(); };
  PEUI.download = function (filename, text) {
    var blob = new Blob([text], { type: 'application/json' }), url = URL.createObjectURL(blob);
    var a = PEUI.h('a', { href: url, download: filename }); doc.body.appendChild(a); a.click(); doc.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };
})(window);
