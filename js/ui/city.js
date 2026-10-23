/* PEUI city — the 3D city (City3D.renderCity) fed with owned, listed and
   rival properties; city tabs for unlocked cities; locked cities show the
   expansion cost and reputation gate with an Expand action. The renderer is
   kept alive across tabs (it pauses itself when not visible) and re-renders
   only when the city changes. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  var cs = { id: null, renderedId: null, era: null, shapes: {}, mounted: false };
  var DEF = { london: 'CityDef_London', paris: 'CityDef_Paris', new_york: 'CityDef_NewYork', amsterdam: 'CityDef_Amsterdam', berlin: 'CityDef_Berlin', rome: 'CityDef_Rome', barcelona: 'CityDef_Barcelona', monaco: 'CityDef_Monaco', sydney: 'CityDef_Sydney', hong_kong: 'CityDef_HongKong', mumbai: 'CityDef_Mumbai', toronto: 'CityDef_Toronto', shanghai: 'CityDef_Shanghai', cape_town: 'CityDef_CapeTown', tokyo: 'CityDef_Tokyo', singapore: 'CityDef_Singapore', los_angeles: 'CityDef_LosAngeles', sao_paulo: 'CityDef_SaoPaulo', miami: 'CityDef_Miami', dubai: 'CityDef_Dubai' };

  function PE() { return root.PE; }
  function shape(p, isListing) {
    var t = PE().Data.propertyTypes[p.type];
    return { id: p.id, type: p.type, model3d: t ? t.model3d : p.model3d, era: p.era, ownerId: p.ownerId, condition: p.condition, renovation: p.renovation || null, isListing: !!isListing, name: p.name };
  }
  function cityProps(cityId) {
    var st = PE().Game.state(), out = [], k;
    for (k in st.properties) if (st.properties[k].cityId === cityId && st.properties[k].ownerId === 'player') out.push(shape(st.properties[k], false));
    for (k in st.listings) if (st.listings[k].cityId === cityId) out.push(shape(st.listings[k], true));
    for (k in st.properties) if (st.properties[k].cityId === cityId && st.properties[k].ownerId !== 'player') out.push(shape(st.properties[k], false));
    return out;
  }
  function hashShape(s) { return [s.model3d, s.ownerId, Math.round(s.condition / 5), s.renovation ? s.renovation.tier : '', s.isListing].join('|'); }

  /* Atmosphere (DESIGN-DIRECTION §4): dusk by default, rain in recessions, fog in the
     Victorian smog, and the Digital era glows after dark. */
  var ERA_NIGHT = { victorian: 0.3, gilded: 0.32, crisis: 0.36, boom: 0.3, modern: 0.38, digital: 0.6 };
  function nightFor(eraId) { return ERA_NIGHT[eraId] != null ? ERA_NIGHT[eraId] : 0.35; }
  function weatherFor(s) { return (s.cycle === 'recession' || s.cycle === 'depression') ? 'rain' : (s.eraId === 'victorian' ? 'fog' : 'clear'); }

  function render3D(el) {
    var host = el.querySelector('.city-view__canvas'), fb = el.querySelector('.city-view__fallback');
    var def = root[DEF[cs.id]], s = PEUI.summary();
    if (!root.City3D || !root.THREE || !def) { fb.classList.remove('hidden'); PEUI.setText(fb, 'The 3D view is not available on this device.'); return; }
    var props = cityProps(cs.id), q = PEUI.prefs.quality === 'auto' ? undefined : PEUI.prefs.quality;
    var ok = false;
    try {
      ok = root.City3D.renderCity(def, host, props, { era: s.eraId, playerColor: s.color, rivalColors: PEUI.rivalColors(), quality: q, night: nightFor(s.eraId), weather: weatherFor(s), autoOrbit: false, labels: true, ambientEvents: false,
        onSelect: function (p) { if (!p) return; if (p.isListing) PEUI.openListing(p.id); else if (p.ownerId === 'player') PEUI.openProperty(p.id); else PEUI.toast(p.name + ' · owned by ' + PEUI.rivalName(p.ownerId)); } });
    } catch (e) { console.warn('3D failed', e); ok = false; }
    fb.classList.toggle('hidden', !!ok);
    if (!ok) PEUI.setText(fb, 'The 3D view could not start (WebGL unavailable).');
    cs.renderedId = ok ? cs.id : null; cs.era = s.eraId; cs.cycle = s.cycle; cs.shapes = {};
    for (var i = 0; i < props.length; i++) cs.shapes[props[i].id] = hashShape(props[i]);
  }
  function syncProps() {
    if (!cs.renderedId || !root.City3D) return;
    var props = cityProps(cs.id), seen = {};
    for (var i = 0; i < props.length; i++) {
      var p = props[i], hh = hashShape(p); seen[p.id] = 1;
      if (cs.shapes[p.id] !== hh) { try { root.City3D.updateProperty(p, { animate: true }); } catch (e) {} cs.shapes[p.id] = hh; }
    }
    var s = PEUI.summary();
    if (s.eraId !== cs.era) { try { root.City3D.setEra(s.eraId, 1200); root.City3D.setNight(nightFor(s.eraId)); } catch (e) {} cs.era = s.eraId; }
    if (s.cycle !== cs.cycle) { try { root.City3D.setWeather(weatherFor(s)); } catch (e) {} cs.cycle = s.cycle; }
  }
  /* Camera language: a slow push-in on the newest purchase the first time it shows. */
  function focusNewPurchase() {
    if (!cs.renderedId || !root.City3D) return;
    var st = PE().Game.state(); if (!st) return;
    for (var k in st.properties) {
      var p = st.properties[k];
      if (p.ownerId === 'player' && p.cityId === cs.id && p.purchaseYear === st.year && cs.focusedId !== p.id) {
        cs.focusedId = p.id;
        try { root.City3D.focus(p.id); } catch (e) {}
        break;
      }
    }
  }
  PEUI.cityUpdateProperty = function () { if (cs.renderedId) syncProps(); };
  /* Era change from outside the city screen (year.js titlecard): shift the live
     renderer immediately instead of waiting for a city-tab visit. No-op when the
     renderer is not up. */
  PEUI.cityEraNow = function (eraId) {
    if (!cs.renderedId || !root.City3D || !eraId || cs.era === eraId) return;
    try { root.City3D.setEra(eraId, 1200); root.City3D.setNight(nightFor(eraId)); } catch (e) {}
    cs.era = eraId;
  };
  PEUI.cityHas = function (id) { return !!(cs.renderedId && cs.shapes[id] !== undefined); };

  /* Pull-up district sheet (phones only; CSS gates the layout to ≤640px). The
     sheet overlays the full-bleed city: dragging the handle sets an inline
     pixel height, releasing snaps to the collapsed peek or the open height. */
  function phoneLayout() { return window.innerWidth <= 640; }
  function setSheet(el, open) {
    var sheet = el.querySelector('.city-bottom'), handle = el.querySelector('.city-sheet__handle');
    if (!sheet || !handle) return;
    cs.sheetOpen = !!open;
    sheet.style.height = '';
    sheet.classList.toggle('is-open', cs.sheetOpen);
    handle.setAttribute('aria-expanded', String(cs.sheetOpen));
  }
  function bindSheet(el) {
    var sheet = el.querySelector('.city-bottom'), handle = el.querySelector('.city-sheet__handle');
    if (!sheet || !handle || handle._sheetBound) return;
    handle._sheetBound = true;
    var startY = 0, startH = 0, maxH = 0, dragging = false, moved = false;
    function peek() { return handle.getBoundingClientRect().height || 72; }
    handle.addEventListener('pointerdown', function (e) {
      if (!phoneLayout()) return;
      dragging = true; moved = false; startY = e.clientY;
      maxH = Math.min(el.clientHeight * 0.72, 560);
      startH = sheet.getBoundingClientRect().height;
      sheet.classList.add('is-dragging');
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    });
    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dy = startY - e.clientY;
      if (Math.abs(dy) > 6) moved = true;
      if (moved) sheet.style.height = Math.max(peek(), Math.min(maxH, startH + dy)) + 'px';
    });
    function drop() {
      if (!dragging) return;
      dragging = false;
      sheet.classList.remove('is-dragging');
      if (moved) { cs.suppressSheetTap = true; setSheet(el, sheet.getBoundingClientRect().height > (maxH + peek()) / 2); }
    }
    handle.addEventListener('pointerup', drop);
    handle.addEventListener('pointercancel', drop);
  }
  /* The 3D renderer only refits on window resize; the canvas host can change
     size without one (screen toggles, the pull-up sheet, rotation), so forward
     container resize events to the engine's existing handler. */
  function bindCanvasResize(el) {
    if (!root.ResizeObserver || cs.ro) return;
    var host = el.querySelector('.city-view__canvas'), raf = 0;
    cs.ro = new ResizeObserver(function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (cs.renderedId && root.City3D) window.dispatchEvent(new Event('resize'));
      });
    });
    cs.ro.observe(host);
  }

  function cityPanel(el) {
    var list = PE().Cities.list(); if (!list.ok) return;
    var info = null; for (var i = 0; i < list.cities.length; i++) if (list.cities[i].id === cs.id) info = list.cities[i];
    var s = PEUI.summary(), box = el.querySelector('#city-panel'); PEUI.empty(box);
    if (!info) return;
    var sum = el.querySelector('#city-sheet-summary');
    if (sum) PEUI.setText(sum, info.unlocked ? info.name + ' · you own ' + info.properties + ' · avg ' + fmt.psqm(info.avgPricePerSqm) : info.name + (info.available ? ' · locked' : ' · from ' + info.availableFrom));
    var card = h('section', { class: 'card city-card', 'aria-label': info.name });
    card.appendChild(h('div', {}, [h('div', { class: 'city-card__name', text: info.name }), h('div', { class: 'small muted', text: info.country + ' · ' + info.traitName })]));
    card.appendChild(info.unlocked ? PEUI.badge('Open since ' + info.unlockedYear, 'success') : PEUI.badge(info.available ? 'Locked' : 'From ' + info.availableFrom, 'neutral'));
    card.appendChild(h('div', { class: 'city-card__facts' }, [
      h('span', { html: 'Avg <strong>' + fmt.psqm(info.avgPricePerSqm) + '</strong>' }),
      h('span', { html: 'Gross yield <strong>' + (info.grossYield * 100).toFixed(1) + '%</strong>' }),
      h('span', { html: 'Property tax <strong>' + (info.taxRate * 100).toFixed(1) + '%</strong>' }),
      h('span', { html: 'You own <strong>' + info.properties + '</strong>' })
    ]));
    card.appendChild(h('div', { class: 'small muted', style: 'grid-column:1/-1', text: info.traitDesc }));
    if (!info.unlocked) {
      var gate = h('div', { class: 'stack stack--2', style: 'grid-column:1/-1' });
      gate.appendChild(h('div', { class: 'note ' + (info.canUnlock ? 'note--success' : 'note--warn') }, [icon(info.canUnlock ? 'expand' : 'lock'), h('span', { text: 'Expansion costs ' + fmt.money(info.cost) + ' and needs reputation ' + info.repRequired + ' (yours: ' + Math.round(s.reputation) + ', cash ' + fmt.money(s.cash) + ').' })]));
      gate.appendChild(PEUI.btn('Expand to ' + info.name + ' for ' + fmt.money(info.cost), { cls: 'btn--primary btn--block', icon: 'expand', action: 'city-unlock', 'data-id': info.id, disabled: !info.canUnlock }));
      card.appendChild(gate);
    }
    box.appendChild(card);
    var dl = h('section', { class: 'card card--flat', 'aria-label': 'Districts' });
    dl.appendChild(h('div', { class: 'kicker', text: 'Districts' }));
    for (var j = 0; j < info.districts.length; j++) {
      var d = info.districts[j];
      dl.appendChild(h('div', { class: 'district-row' }, [h('span', { text: d.name + (d.playerShare ? ' · you own ' + d.playerShare + '%' : '') }), h('span', { class: 'num muted small', text: fmt.psqm(d.pricePerSqm) }), PEUI.trend(d.trend)]));
    }
    box.appendChild(dl);
  }
  function tabs(el) {
    var list = PE().Cities.list(); if (!list.ok) return;
    var cities = list.cities.filter(function (c) { return c.unlocked || c.available; }).sort(function (a, b) { return (b.unlocked - a.unlocked) || (a.cost - b.cost); });
    PEUI.patchList(el.querySelector('#city-tabs'), cities, function (c) { return c.id; }, function (c) { return c.id + (c.id === cs.id ? ':on' : '') + c.unlocked; }, function (c) {
      var b = h('button', { type: 'button', class: 'tab' + (c.unlocked ? '' : ' tab--locked'), role: 'tab', 'aria-selected': String(c.id === cs.id), 'data-action': 'city-tab', 'data-id': c.id });
      if (!c.unlocked) b.appendChild(icon('lock', 'ic--sm', 'Locked'));
      b.appendChild(h('span', { text: c.name })); return b;
    });
  }

  PEUI.register('city', {
    mount: function (el, ctx) {
      var s = PEUI.summary();
      if (ctx && ctx.city) cs.id = ctx.city;
      if (!cs.id) cs.id = s.cities[0];
      if (!cs.mounted) {
        PEUI.empty(el);
        var sc = h('div', { class: 'screen__scroll' });
        sc.appendChild(h('div', { class: 'city-top' }, h('div', { class: 'city-top__inner' }, h('div', { class: 'tabs', id: 'city-tabs', role: 'tablist', 'aria-label': 'Cities' }))));
        var view = h('div', { class: 'city-view' });
        view.appendChild(h('div', { class: 'city-view__canvas', role: 'img', 'aria-label': 'City map' }));
        view.appendChild(h('div', { class: 'city-view__fallback hidden' }));
        view.appendChild(h('div', { class: 'city-view__tools' }, [PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'refresh', action: 'city-reset', ariaLabel: 'Reset view' }), PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'download', action: 'city-photo', ariaLabel: 'Save a photo of the city' })]));
        var leg = h('div', { class: 'city-view__legend', id: 'city-legend' });
        view.appendChild(leg);
        sc.appendChild(view);
        var bottom = h('div', { class: 'city-bottom', tabindex: '0' });
        bottom.appendChild(h('button', { type: 'button', class: 'city-sheet__handle', 'data-action': 'city-sheet-toggle', 'aria-expanded': 'false', 'aria-controls': 'city-panel' }, [h('span', { class: 'sheet__grip' }), h('span', { class: 'city-sheet__summary', id: 'city-sheet-summary' })]));
        bottom.appendChild(h('div', { class: 'city-bottom__inner', id: 'city-panel', tabindex: '0' }));
        sc.appendChild(bottom);
        el.appendChild(sc);
        cs.mounted = true;
        bindSheet(el);
        bindCanvasResize(el);
      }
      var leg2 = el.querySelector('#city-legend'); PEUI.empty(leg2);
      leg2.appendChild(h('span', {}, [h('i', { style: 'background:' + s.color }), 'You']));
      leg2.appendChild(h('span', {}, [h('i', { style: 'background:#6b8fbf' }), 'Rivals']));
      leg2.appendChild(h('span', {}, [h('i', { style: 'background:#d9b45c' }), 'For sale']));
      this.update(el);
    },
    update: function (el) {
      tabs(el); cityPanel(el);
      if (cs.renderedId !== cs.id) { var self = this; requestAnimationFrame(function () { if (PEUI.current === 'city') { render3D(el); focusNewPurchase(); } }); }
      else { syncProps(); focusNewPurchase(); }
    },
    unmount: function () { /* renderer stays alive; it pauses itself while hidden */ }
  });
  PEUI.destroyCity = function () { if (root.City3D && cs.renderedId) { try { root.City3D.destroy(); } catch (e) {} } if (cs.ro) { cs.ro.disconnect(); cs.ro = null; } cs.renderedId = null; cs.mounted = false; cs.id = null; cs.sheetOpen = false; };
  PEUI.actions['city-tab'] = function (b, d) { cs.id = d.id; PEUI.refresh(); };
  PEUI.actions['city-sheet-toggle'] = function () {
    if (cs.suppressSheetTap) { cs.suppressSheetTap = false; return; }
    if (!phoneLayout()) return;
    var el = document.getElementById('screen-city'); if (!el) return;
    setSheet(el, !cs.sheetOpen); PEUI.sound('page');
  };
  PEUI.actions['city-reset'] = function () { if (root.City3D && cs.renderedId) root.City3D.resetView(); };
  PEUI.actions['city-photo'] = function () {
    if (!root.City3D || !cs.renderedId) return;
    var url = root.City3D.photo();
    if (!url) { PEUI.toast('Photo is not available on this device.'); return; }
    var a = h('a', { href: url, download: 'property-empire-' + cs.id + '-' + PEUI.summary().year + '.png' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    PEUI.sound('page'); PEUI.toast('Photo saved.', 'success');
  };
  PEUI.actions['city-unlock'] = function (b, d) {
    var r = PEUI.call(PE().Cities.unlock, d.id); if (!r.ok) return;
    PEUI.save(); PEUI.sound('fanfare'); PEUI.confetti(30); PEUI.toast(r.message, 'success');
    cs.renderedId = null; PEUI.refresh();
  };
})(window);
