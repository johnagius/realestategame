/* PEUI guide — the first three years, taught by doing. A tiny state machine
   whose stage is a pure function of engine facts (purchases, year offset,
   renovations, refinances, LTV), never of time. Every callout carries
   "Skip guide"; the skip and the finish are remembered in prefs. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  function PE() { return root.PE; }
  function prefs() { var p = PEUI.prefs; if (!p.guide) p.guide = { skipped: false, done: false, started: false }; return p.guide; }

  var G = PEUI.guide = {};

  G.active = function () {
    var s = PE().Game.state(); if (!s || s.status !== 'playing') return false;
    var g = prefs(); return !g.skipped && !g.done;
  };

  /* Facts the stage is derived from; all from engine payloads. */
  function facts() {
    var s = PE().Game.state(), pf = PE().Game.portfolio(), props = pf.ok ? pf.properties : [];
    var reno = null, refi = null;
    for (var i = 0; i < props.length; i++) {
      var p = props[i]; if (p.renovation) continue;
      if (!reno && p.type !== 'land' && p.condition < 85 && p.renovationOptions.length) reno = p;
      if (!refi && p.ltv < 0.5 && p.trueValue > 0) refi = p;
    }
    return { yr: s.year - s.startYear, bought: s.stats.bought, renovations: s.stats.renovations, refinances: s.stats.refinances, reno: reno, refi: refi, props: props };
  }

  /* 'buy' → 'endyear' → 'renovate' → 'refinance' | 'buy' → 'end' */
  G.stage = function () {
    if (!G.active()) return null;
    var f = facts();
    if (f.yr >= 3) return 'end';
    if (f.bought === 0) return 'buy';
    if (f.yr === 0) return 'endyear';
    if (f.renovations === 0 && f.reno) return 'renovate';
    if (f.yr >= 2 && f.refinances === 0 && f.refi) return 'refinance';
    return 'buy';
  };
  G.facts = facts;

  function mark() { var g = prefs(); if (!g.started) { g.started = true; PEUI.savePrefs(); } }
  function callout(text, opts) {
    opts = opts || {};
    mark();
    var el = h('div', { class: 'callout' + (opts.cls ? ' ' + opts.cls : ''), role: 'note', 'aria-label': 'Guide' });
    el.appendChild(icon('sparkle'));
    el.appendChild(h('div', { class: 'callout__text', text: text }));
    el.appendChild(h('button', { type: 'button', class: 'callout__skip', 'data-action': 'guide-skip', text: 'Skip guide' }));
    return el;
  }

  /* Slots: board, appraisal, ltv, endyear, renovate, refinance, portfolio, report, end. Returns an element or null. */
  G.callout = function (slot, ctx) {
    var st = G.stage(); if (!st) return null;
    ctx = ctx || {};
    var f, s = PE().Game.state();
    switch (slot) {
      case 'board':
        if (st !== 'buy') return null;
        f = facts();
        return callout(f.bought === 0 ? 'One of these is underpriced. Compare £/m² with the district.' : 'Find the next one: the cheapest £/m² against the district average is usually the deal.');
      case 'appraisal':
        if (st !== 'buy' || !ctx.listing || !ctx.appraisal) return null;
        if (ctx.listing.askingPrice >= ctx.appraisal.lowEstimate) return null;
        return callout('Asking is below even the low estimate. That gap is your profit on day one.');
      case 'ltv':
        if (st !== 'buy' || !ctx.listing) return null;
        var q = ctx.quote, l = ctx.listing;
        if (q && q.principal > 0) return callout('The bank lends ' + Math.round(q.ltv * 100) + '%; you pay ' + fmt.money(q.annualPayment) + ' a year, the tenant pays you ' + (l.type === 'land' ? 'nothing until it is built on' : fmt.money(l.rentAnnual)) + '.');
        return callout('Slide right to borrow: the bank lends up to ' + Math.round((l.maxLtv || 0.7) * 100) + '% and the tenant\'s rent helps pay for it.');
      case 'endyear':
        if (st !== 'endyear') return null;
        return callout('Bought. Now End year: rent comes in, values move, and you see what you built.', { cls: 'callout--hud' });
      case 'portfolio':
        f = facts();
        if (st === 'renovate' && f.reno) return callout('Open ' + f.reno.name + ' and renovate it. Condition is the lever you control.');
        if (st === 'refinance' && f.refi) return callout('Open ' + f.refi.name + ': its loan is under 50% of value. Pull cash out and buy the next one.');
        return null;
      case 'renovate':
        if (st !== 'renovate' || !ctx.property) return null;
        var p = ctx.property, opt = null;
        for (var i = 0; i < p.renovationOptions.length; i++) if (p.renovationOptions[i].tier === 'refurbish') opt = p.renovationOptions[i];
        if (!opt || p.renovation) return null;
        var next = PE().Data.conditionBand(Math.min(100, p.condition + opt.conditionGain)).name;
        return callout(p.conditionLabel + ' to ' + next + ' adds about ' + Math.round(opt.uplift * 100) + '% value for ' + Math.round(opt.cost / Math.max(1, p.trueValue) * 100) + '% cost.');
      case 'refinance':
        if (st !== 'refinance' || !ctx.property || ctx.property.ltv >= 0.5) return null;
        return callout('Pull cash out and buy the next one. The rent still covers the payment.');
      case 'report':
        if (!ctx.report || ctx.report.year !== s.startYear || prefs().skipped) return null;
        return null; // the equity line is rendered by G.equityLine
      case 'end':
        if (st !== 'end') return null;
        if (!prefs().started) { prefs().done = true; PEUI.savePrefs(); return null; }
        var card = h('section', { class: 'card guide-end', 'aria-label': 'Guide complete' });
        card.appendChild(h('div', { class: 'kicker', text: 'Three years in' }));
        card.appendChild(h('h2', { text: 'You now know the loop' }));
        card.appendChild(h('p', { text: 'Buy under value, improve, borrow, repeat. The rest is nerve and timing.' }));
        card.appendChild(PEUI.btn('Got it', { cls: 'btn--primary', icon: 'check', action: 'guide-done' }));
        return card;
    }
    return null;
  };

  /* Year-1 report line: equity created = net worth now − what the family started with. */
  G.equityLine = function (r) {
    var s = PE().Game.state(); if (!s || prefs().skipped || r.year !== s.startYear) return null;
    mark();
    var created = r.netWorthAfter - s.startNetWorth;
    var el = h('div', { class: 'equity-line', role: 'note' });
    el.appendChild(h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: 'Equity you created' }), h('span', { class: 'stat__value stat__value--lg num ' + (created >= 0 ? 'pos' : 'neg'), text: fmt.signed(created) })]));
    el.appendChild(h('p', { class: 'small muted', text: 'Net worth now minus what the family started with: the value you bought below the market, plus rent kept, minus what the year cost you.' }));
    return el;
  };

  /* HUD callout under the End year button. */
  G.syncHud = function () {
    var hud = document.getElementById('hud'), inner = hud && hud.querySelector('.hud__inner'); if (!inner) return;
    var old = inner.querySelector('.callout--hud'), el = hud.classList.contains('hidden') ? null : G.callout('endyear');
    if (old && !el) old.parentNode.removeChild(old);
    else if (!old && el) inner.appendChild(el);
  };

  PEUI.actions['guide-skip'] = function () {
    prefs().skipped = true; PEUI.savePrefs();
    var all = document.querySelectorAll('.callout'); for (var i = 0; i < all.length; i++) all[i].parentNode.removeChild(all[i]);
    G.syncHud(); PEUI.refresh(); PEUI.toast('Guide skipped. You can bring it back in Settings.');
  };
  PEUI.actions['guide-done'] = function () { prefs().done = true; PEUI.savePrefs(); PEUI.refresh(); };
  PEUI.actions['guide-reset'] = function () { PEUI.prefs.guide = { skipped: false, done: false, started: false }; PEUI.savePrefs(); PEUI.toast('The guide will show for the next three years of play.', 'success'); if (PEUI.sheet.isOpen()) PEUI.sheet.close(); PEUI.refresh(); G.syncHud(); };
})(window);
