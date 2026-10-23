/* PEUI deals — morning paper, goals strip, deal board (per city), listing
   sheet with appraisal panel, offer sheet (price + LTV sliders, live quote,
   acceptance band), counters, and the auction sheet. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  var view = { city: null, sort: 'price', affordable: false };
  var offer = { id: null, price: 0, ltv: 0, type: 'io', fixed: false };

  function PE() { return root.PE; }
  function isForeshadow(t) { return /whisper|expects|coming boom|trouble|losing its shine|comes of age|succession/i.test(t); }

  /* ---------- Morning paper ---------- */
  function paper(s) {
    var bleak = s.cycle === 'recession' || s.cycle === 'depression';
    var p = h('section', { class: 'paper' + (bleak ? ' paper--crash' : ''), 'aria-label': 'Morning paper' });
    p.appendChild(h('div', { class: 'paper__mast' }, [h('span', { class: 'paper__name', text: 'The ' + PEUI.cityName('london') + ' Gazette' }), h('span', { class: 'paper__date', text: '1 January ' + s.year })]));
    p.appendChild(h('div', { class: 'paper__ornament', 'aria-hidden': 'true' }, h('i')));
    var lines = h('div', { class: 'paper__lines' });
    var arr = s.paper || [];
    if (!arr.length) lines.appendChild(h('div', { class: 'paper__line muted', text: 'Nothing of note this morning.' }));
    for (var i = 0; i < arr.length; i++) {
      var L = arr[i], cls = 'paper__line' + (L.kind === 'headline' ? ' paper__line--headline' : (L.prewarn || isForeshadow(L.text)) ? ' paper__line--foreshadow' : '');
      var ic = L.kind === 'headline' ? 'warning' : L.kind === 'city' ? 'city' : L.kind === 'dynasty' ? 'crown' : isForeshadow(L.text) ? 'info' : 'bank';
      lines.appendChild(h('div', { class: cls }, [icon(ic), h('span', { text: L.text })]));
    }
    p.appendChild(lines);
    return p;
  }

  /* ---------- Goals strip ---------- */
  function goals() {
    var g = PE().Goals.current(); if (!g.ok) return h('div');
    var wrap = h('section', { class: 'goals', 'aria-label': 'Goals' });
    if (g.yearly) wrap.appendChild(goal(g.yearly.comeback ? 'Rebuild · step ' + (g.yearly.stage + 1) + ' of 3' : 'This year', g.yearly.desc, 'Reward ' + fmt.money(g.yearly.reward), g.yearly.satisfied, g.yearly.comeback ? 'refresh' : 'flag'));
    if (g.era) wrap.appendChild(goal('Era goal · by ' + g.era.deadline, g.era.desc, g.era.done ? 'Done' : g.era.failed ? 'Missed' : g.era.progress, g.era.done, 'star'));
    var c = g.campaign;
    wrap.appendChild(goal('Campaign · tier ' + (c.tier + 1) + (c.next ? ' ' + c.next.name : ''), c.next ? c.next.desc : 'All tiers complete', c.completed.length ? 'Done: ' + c.completed.join(', ') : 'No tiers yet', !c.next, 'trophy'));
    return wrap;
  }
  function goal(k, d, p, done, ic) {
    var el = h('div', { class: 'goal' + (done ? ' goal--done' : '') });
    el.appendChild(icon(done ? 'check' : ic));
    el.appendChild(h('div', {}, [h('div', { class: 'goal__k', text: k }), h('div', { class: 'goal__d', text: d }), h('div', { class: 'goal__p', text: p })]));
    return el;
  }

  /* ---------- Deal board ---------- */
  function affordability(l, cash) {
    var q = PE().Finance.mortgageQuote(l.id, l.maxLtv, 'io');
    var need = q.ok ? q.cashNeeded : l.askingPrice + l.stampDuty;
    if (cash >= l.askingPrice + l.stampDuty) return { kind: 'success', text: 'Cash buy' };
    if (cash >= need) return { kind: 'info', text: 'With mortgage' };
    return { kind: 'warn', text: 'Stretch deal' };
  }
  function dealCard(l, cash) {
    var ap = PE().Market.appraise(l.id), yld = ap.ok ? ap.grossYield : 0;
    var c = h('div', { class: 'card card--tap deal', 'data-action': 'open-listing', 'data-id': l.id, role: 'button', tabindex: '0', 'aria-label': l.typeName + ' in ' + l.district + ', asking ' + fmt.money(l.askingPrice) });
    c.appendChild(h('div', {}, [h('div', { class: 'deal__type', text: l.typeName }), h('div', { class: 'deal__loc' }, [h('span', { text: l.district + ' · ' + l.sqm + ' m²' }), PEUI.trend(l.districtTrend)])]));
    var diff = l.districtPricePerSqm > 0 ? (l.pricePerSqm / l.districtPricePerSqm - 1) : 0;
    c.appendChild(h('div', { class: 'deal__price' }, [h('div', { class: 'deal__ask num', text: fmt.money(l.askingPrice) }), h('div', { class: 'deal__psqm', text: fmt.psqm(l.pricePerSqm) + ' · ' + (diff >= 0 ? '+' : '−') + Math.abs(Math.round(diff * 100)) + '% vs district' })]));
    var meta = h('div', { class: 'deal__meta' });
    meta.appendChild(PEUI.chip(l.conditionLabel, PEUI.conditionKind(l.condition)));
    if (yld) meta.appendChild(PEUI.chip(yld.toFixed(1) + '% yield', null, 'percent'));
    meta.appendChild(PEUI.chip(l.sellerName, l.seller === 'auction' ? 'gold' : null, l.seller === 'auction' ? 'gavel' : 'person'));
    if (l.yearsListed > 0) meta.appendChild(PEUI.chip('Listed ' + l.yearsListed + ' yr' + (l.yearsListed > 1 ? 's' : ''), 'outline', 'calendar'));
    var aff = affordability(l, cash); meta.appendChild(PEUI.badge(aff.text, aff.kind));
    if (l.revealed) meta.appendChild(PEUI.badge('True value known', 'gold'));
    if (l.counterPrice) meta.appendChild(PEUI.badge('Counter ' + fmt.money(l.counterPrice), 'info'));
    c.appendChild(meta);
    c.appendChild(estimateRow(l));
    return c;
  }
  function estimateRow(l) {
    var lo = l.lowEstimate, hi = l.highEstimate, ask = l.askingPrice, min = Math.min(lo, ask) * 0.85, max = Math.max(hi, ask) * 1.15, span = max - min || 1;
    var row = h('div', { class: 'deal__est is-drawn' });
    row.appendChild(h('span', { class: 'num', text: 'Est. ' + fmt.money(lo) }));
    var bar = h('div', { class: 'bar', 'aria-label': 'Estimate band ' + fmt.money(lo) + ' to ' + fmt.money(hi) + '; asking ' + fmt.money(ask) });
    bar.appendChild(h('div', { class: 'bar__band', style: 'left:' + ((lo - min) / span * 100).toFixed(1) + '%;width:' + ((hi - lo) / span * 100).toFixed(1) + '%' }));
    bar.appendChild(h('div', { class: 'bar__ask', style: 'left:' + ((ask - min) / span * 100).toFixed(1) + '%', title: 'Asking' }));
    row.appendChild(bar);
    row.appendChild(h('span', { class: 'num', text: fmt.money(hi) }));
    return row;
  }
  function sortListings(arr) {
    var out = arr.slice();
    if (view.sort === 'price') out.sort(function (a, b) { return a.askingPrice - b.askingPrice; });
    else if (view.sort === 'value') out.sort(function (a, b) { return a.askingPrice / ((a.lowEstimate + a.highEstimate) / 2) - b.askingPrice / ((b.lowEstimate + b.highEstimate) / 2); });
    else if (view.sort === 'yield') out.sort(function (a, b) { return (b.rentAnnual / b.askingPrice) - (a.rentAnnual / a.askingPrice); });
    return out;
  }
  function snappedCard(sp) {
    var c = h('div', { class: 'card deal deal--snapped', 'aria-label': sp.typeName + ' in ' + sp.district + ', snapped up by ' + sp.rivalName });
    c.appendChild(h('div', {}, [h('div', { class: 'deal__type', text: sp.typeName }), h('div', { class: 'deal__loc' }, [h('span', { text: sp.name + ' · ' + sp.district })])]));
    c.appendChild(h('div', { class: 'deal__price' }, [h('div', { class: 'deal__ask deal__ask--struck num', text: fmt.money(sp.askingPrice) }), h('div', { class: 'deal__psqm', text: 'Gone before the board opened' })]));
    c.appendChild(h('div', { class: 'deal__meta' }, [PEUI.chip('Snapped up by ' + sp.rivalName, 'outline', 'person')]));
    return c;
  }
  function board(el) {
    var s = PEUI.summary(), cities = s.cities;
    if (view.city === null || cities.indexOf(view.city) < 0) view.city = cities[0];
    var tabs = el.querySelector('#deal-tabs');
    PEUI.patchList(tabs, cities, function (c) { return c; }, function (c) { return c + (c === view.city ? ':on' : ''); }, function (c) {
      return h('button', { type: 'button', class: 'tab', role: 'tab', 'aria-selected': String(c === view.city), 'data-action': 'deal-city', 'data-id': c, text: PEUI.cityName(c) });
    });
    var r = PE().Market.listings(view.city), list = el.querySelector('#deal-list');
    if (!r.ok) { PEUI.empty(list); list.appendChild(h('div', { class: 'empty', text: r.message })); return; }
    var snapBox = el.querySelector('#deal-snapped'), snapped = (r.snappedUp || []).filter(function (sp) { return sp.cityId === view.city; }).slice(0, 2);
    PEUI.patchList(snapBox, snapped, function (sp) { return 'snap:' + sp.id; }, function (sp) { return [sp.askingPrice, sp.rivalId].join('|'); }, snappedCard);
    var items = sortListings(r.listings);
    if (view.affordable) items = items.filter(function (l) { return affordability(l, s.cash).text !== 'Stretch deal'; });
    PEUI.setText(el.querySelector('#deal-count'), items.length + ' listing' + (items.length === 1 ? '' : 's') + ' in ' + PEUI.cityName(view.city));
    var segs = el.querySelectorAll('#deal-sort .seg__btn'); for (var i = 0; i < segs.length; i++) segs[i].setAttribute('aria-pressed', String(segs[i].dataset.sort === view.sort));
    el.querySelector('#deal-afford').setAttribute('aria-pressed', String(view.affordable));
    if (!items.length) { PEUI.empty(list); list.appendChild(h('div', { class: 'empty' }, [icon('tag'), h('div', { text: 'Nothing on the board here. End the year for fresh listings.' })])); return; }
    PEUI.patchList(list, items, function (l) { return l.id; }, function (l) { return [l.askingPrice, l.condition, l.yearsListed, l.counterPrice, l.revealed, l.lowEstimate, s.cash, l.districtTrend].join('|'); }, function (l) { return dealCard(l, s.cash); });
    var auc = el.querySelector('#deal-auction');
    auc.classList.toggle('hidden', !s.auction);
  }

  PEUI.register('deals', {
    mount: function (el) {
      PEUI.empty(el);
      var sc = h('div', { class: 'screen__scroll', tabindex: '0' }), inner = h('div', { class: 'screen__inner' });
      inner.appendChild(h('div', { id: 'deal-paper', class: 'span' }));
      inner.appendChild(h('div', { id: 'deal-goals', class: 'span' }));
      var boardWrap = h('section', { class: 'stack span', 'aria-label': 'Deal board' });
      boardWrap.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Deal board' }), h('span', { class: 'muted small', id: 'deal-count' })]));
      boardWrap.appendChild(h('div', { id: 'deal-guide', class: 'stack' }));
      boardWrap.appendChild(h('div', { class: 'tabs', id: 'deal-tabs', role: 'tablist' }));
      var tools = h('div', { class: 'board-tools' });
      var seg = h('div', { class: 'seg', id: 'deal-sort', role: 'group', 'aria-label': 'Sort' });
      [['price', 'Price'], ['value', 'Best value'], ['yield', 'Yield']].forEach(function (o) { seg.appendChild(h('button', { type: 'button', class: 'seg__btn', 'data-action': 'deal-sort', 'data-sort': o[0], 'aria-pressed': 'false', text: o[1] })); });
      tools.appendChild(seg);
      tools.appendChild(h('button', { type: 'button', class: 'chip chip--tap chip--outline', id: 'deal-afford', 'data-action': 'deal-afford', 'aria-pressed': 'false' }, [icon('coin'), 'Affordable only']));
      boardWrap.appendChild(tools);
      var auc = h('div', { class: 'note note--warn hidden', id: 'deal-auction' }, [icon('gavel'), h('span', { class: 'grow', text: 'An auction is in progress.' }), PEUI.btn('Resume', { cls: 'btn--primary btn--sm', action: 'resume-auction' })]);
      boardWrap.appendChild(auc);
      boardWrap.appendChild(h('div', { class: 'list', id: 'deal-snapped' }));
      boardWrap.appendChild(h('div', { class: 'list', id: 'deal-list' }));
      inner.appendChild(boardWrap);
      sc.appendChild(inner); el.appendChild(sc);
      this.update(el);
    },
    update: function (el) {
      var s = PEUI.summary(); if (!s.ok) return;
      var pp = el.querySelector('#deal-paper'), key = s.year + ':' + (s.paper || []).length;
      if (pp.dataset.key !== key) { PEUI.empty(pp); pp.appendChild(paper(s)); pp.dataset.key = key; }
      var gg = el.querySelector('#deal-goals'); PEUI.empty(gg); gg.appendChild(goals());
      var dg = el.querySelector('#deal-guide'); PEUI.empty(dg);
      if (PEUI.guide) { var c1 = PEUI.guide.callout('end'); if (c1) dg.appendChild(c1); var c2 = PEUI.guide.callout('board'); if (c2) dg.appendChild(c2); }
      board(el);
    }
  });
  PEUI.actions['deal-city'] = function (b, d) { view.city = d.id; PEUI.refresh(); };
  PEUI.actions['deal-sort'] = function (b, d) { view.sort = d.sort; PEUI.refresh(); };
  PEUI.actions['deal-afford'] = function () { view.affordable = !view.affordable; PEUI.refresh(); };
  PEUI.actions['resume-auction'] = function () { var s = PEUI.summary(); if (s.auction) openAuction(s.auction, 'Bid again or withdraw.'); };

  /* ---------- Listing sheet ---------- */
  function listingData(id) { var r = PE().Game.property(id); return r.ok && r.property.listing ? r.property : null; }

  function statsGrid(l, ap) {
    var g = h('div', { class: 'stat-grid stat-grid--3' });
    function st(label, value, cls) { g.appendChild(h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: label }), h('span', { class: 'stat__value num' + (cls ? ' ' + cls : ''), text: value })])); }
    st('Asking', fmt.money(l.askingPrice));
    st('Size', l.sqm + ' m²');
    st('Price / m²', fmt.psqm(l.pricePerSqm));
    st('District avg', fmt.psqm(l.districtPricePerSqm));
    st('Gross yield', ap.grossYield ? ap.grossYield.toFixed(1) + '%' : (l.type === 'land' ? 'No rent' : '—'));
    st('Listed', l.yearsListed ? l.yearsListed + ' yr' + (l.yearsListed > 1 ? 's' : '') : 'New');
    return g;
  }
  function appraisalPanel(l, ap) {
    var box = h('section', { class: 'appraisal', 'aria-label': 'Appraisal' });
    box.appendChild(h('div', { class: 'kicker', text: 'Appraisal' }));
    var cond = h('div', { class: 'meter' }, [h('span', { text: 'Condition' }), PEUI.bar(l.condition / 100, PEUI.conditionKind(l.condition)), h('span', { text: l.conditionLabel + ' · ' + Math.round(l.condition) })]);
    box.appendChild(cond);
    box.appendChild(h('div', { class: 'row row--wrap' }, [h('span', { class: 'small muted', text: l.district + ' trend:' }), PEUI.trend(ap.districtTrend)]));
    var cues = h('ul', { class: 'lines' });
    for (var i = 0; i < ap.cues.length; i++) cues.appendChild(h('li', { class: i === 0 ? 'cue-note' : '', style: i ? '' : null }, [i ? icon('info') : icon('paper'), h('span', { text: ap.cues[i] })]));
    box.appendChild(cues);
    box.appendChild(h('div', { class: 'kicker', text: 'Comparable sales' }));
    var comps = h('div', { class: 'stack stack--2' });
    for (var j = 0; j < ap.comps.length; j++) {
      var c = ap.comps[j], target = PEUI.appraisal ? PEUI.appraisal.compTarget(c) : null;
      var kids = [h('span', { class: 'comp__t', text: c.district + ' · ' + PE().Data.propertyTypes[c.type].name }), h('span', { class: 'comp__v', text: fmt.psqm(c.pricePerSqm) }), h('span', { class: 'comp__s', text: c.sqm + ' m² · sold ' + c.year + ' · about ' + fmt.money(c.pricePerSqm * c.sqm) + (target ? ' · tap to see it on the map' : '') })];
      var compEl = target ? h('button', { type: 'button', class: 'comp comp--tap', 'data-action': 'comp-focus', 'data-id': target, 'aria-label': 'Show ' + c.district + ' comparable on the city map' }, kids) : h('div', { class: 'comp' }, kids);
      compEl.classList.add('is-stamping'); compEl.style.setProperty('--i', j);
      comps.appendChild(compEl);
    }
    box.appendChild(comps);
    if (PEUI.guide) { var gc = PEUI.guide.callout('appraisal', { listing: l, appraisal: ap }); if (gc) box.appendChild(gc); }
    var est = h('div', { class: 'est-band' + (ap.revealed ? ' est-band--revealed' : '') });
    if (ap.revealed) est.appendChild(h('div', { style: 'grid-column:1/-1;text-align:center' }, [h('div', { class: 'est-band__l', text: 'True value (revealed)' }), h('div', { class: 'est-band__v', text: fmt.money(ap.estimate) })]));
    else {
      est.appendChild(h('div', {}, [h('div', { class: 'est-band__l', text: 'Low' }), h('div', { class: 'est-band__v', text: fmt.money(ap.lowEstimate) })]));
      est.appendChild(h('div', {}, [h('div', { class: 'est-band__l', text: 'Estimate' }), h('div', { class: 'est-band__v', text: fmt.money(ap.estimate) })]));
      est.appendChild(h('div', {}, [h('div', { class: 'est-band__l', text: 'High' }), h('div', { class: 'est-band__v', text: fmt.money(ap.highEstimate) })]));
    }
    box.appendChild(est);
    if (!ap.revealed && PEUI.appraisal) box.appendChild(PEUI.appraisal.field(l, ap));
    var ratio = l.askingPrice / ap.estimate;
    box.appendChild(h('div', { class: 'note ' + (ratio < 0.93 ? 'note--success' : ratio > 1.07 ? 'note--warn' : '') }, [icon(ratio < 0.93 ? 'sparkle' : 'info'), h('span', { text: 'Asking is ' + Math.abs(Math.round((ratio - 1) * 100)) + '% ' + (ratio < 1 ? 'below' : 'above') + ' your estimate.' })]));
    if (!ap.revealed) box.appendChild(PEUI.btn('Insider tip: reveal true value (1 per year)', { cls: 'btn--secondary btn--block', icon: 'key', action: 'insider-tip', 'data-id': l.id }));
    return box;
  }

  function quoteFor(l) {
    var q = PE().Finance.mortgageQuote(l.id, offer.ltv, offer.type, offer.fixed, offer.price);
    if (!q.ok) return null;
    return { principal: q.principal, rate: q.rate, annualPayment: q.annualPayment, lender: q.lender, duty: q.duty, cash: q.cashNeeded, ltv: q.ltv, maxLtv: q.maxLtv, fixedAvailable: q.fixedAvailable, type: q.type, fixed: q.fixed, lenderCapped: q.lenderCapped, message: q.message };
  }
  function oddsFor(l) {
    if (l.seller === 'auction') return { text: 'Opens the auction', frac: 0.5, kind: 'gold' };
    var r = offer.price / l.askingPrice, floor = PE().Data.sellers[l.seller].floor;
    if (l.counterPrice && offer.price >= l.counterPrice) return { text: 'Meets the counter', frac: 1, kind: 'success' };
    if (r >= floor + 0.04) return { text: 'Very likely accepted', frac: 0.95, kind: 'success' };
    if (r >= floor) return { text: 'Likely accepted', frac: 0.75, kind: 'success' };
    if (r >= floor - 0.06) return { text: 'Coin flip; may counter', frac: 0.45, kind: 'warn' };
    if (r >= floor - 0.2) return { text: 'Expect a counter', frac: 0.2, kind: 'warn' };
    return { text: 'Insulting; costs reputation', frac: 0.05, kind: 'danger' };
  }
  function offerPanel(l) {
    var fs = PE().Finance.summary(), q = quoteFor(l), s = PEUI.summary();
    var box = h('section', { class: 'stack', id: 'offer-panel', 'aria-label': 'Make an offer' });
    box.appendChild(h('div', { class: 'kicker', text: l.seller === 'auction' ? 'Opening bid' : 'Your offer' }));
    if (l.counterPrice) box.appendChild(h('div', { class: 'note note--info' }, [icon('info'), h('span', { text: 'The seller has countered at ' + fmt.money(l.counterPrice) + '. Offer that or more to close.' })]));
    var pf = h('div', { class: 'field' });
    pf.appendChild(h('label', { class: 'field__label', for: 'offer-price' }, [h('span', { text: 'Offer price' }), h('strong', { id: 'offer-price-v', text: fmt.money(offer.price) + ' (' + Math.round(offer.price / l.askingPrice * 100) + '% of asking)' })]));
    pf.appendChild(PEUI.range({ id: 'offer-price', min: Math.round(l.askingPrice * 0.6), max: Math.round(l.askingPrice * 1.2), step: Math.max(1, Math.round(l.askingPrice / 200)), value: offer.price, 'data-input': 'offer-price', 'aria-valuetext': fmt.money(offer.price) }));
    box.appendChild(pf);
    var odds = oddsFor(l);
    box.appendChild(h('div', { class: 'odds', id: 'offer-odds' }, [h('span', { text: 'Odds' }), PEUI.bar(odds.frac, odds.kind), h('span', { text: odds.text })]));
    box.appendChild(h('div', { class: 'kicker', text: 'Financing' }));
    var lf = h('div', { class: 'field' });
    lf.appendChild(h('label', { class: 'field__label', for: 'offer-ltv' }, [h('span', { text: 'Mortgage (loan to value)' }), h('strong', { id: 'offer-ltv-v', text: Math.round(offer.ltv * 100) + '%' })]));
    lf.appendChild(PEUI.range({ id: 'offer-ltv', min: 0, max: Math.round((q ? q.maxLtv : l.maxLtv) * 100), step: 5, value: Math.round(offer.ltv * 100), 'data-input': 'offer-ltv' }));
    box.appendChild(lf);
    box.appendChild(h('div', { id: 'offer-guide' }, PEUI.guide ? PEUI.guide.callout('ltv', { listing: l, quote: q }) : null));
    var seg = h('div', { class: 'seg seg--block', role: 'group', 'aria-label': 'Mortgage type' });
    seg.appendChild(h('button', { type: 'button', class: 'seg__btn', 'data-action': 'offer-type', 'data-type': 'io', 'aria-pressed': String(offer.type === 'io' && !offer.fixed), text: 'Interest-only' }));
    seg.appendChild(h('button', { type: 'button', class: 'seg__btn', 'data-action': 'offer-type', 'data-type': 'amort', 'aria-pressed': String(offer.type === 'amort' && !offer.fixed), text: 'Amortising 25y' }));
    if (q && q.fixedAvailable) seg.appendChild(h('button', { type: 'button', class: 'seg__btn', 'data-action': 'offer-type', 'data-type': 'fixed', 'aria-pressed': String(offer.fixed), text: 'Fixed rate' }));
    box.appendChild(seg);
    box.appendChild(h('div', { id: 'offer-quote' }, quotePanel(l, q, fs, s)));
    return box;
  }
  function quotePanel(l, q, fs, s) {
    var dl = h('dl', { class: 'quote' });
    function row(k, v, cls) { dl.appendChild(h('dt', { text: k })); dl.appendChild(h('dd', { class: 'num' + (cls ? ' ' + cls : ''), text: v })); }
    if (q && q.principal > 0) {
      row('Loan from ' + q.lender, fmt.money(q.principal) + ' at ' + (q.rate * 100).toFixed(2) + '%' + (q.fixed ? ' fixed' : ''));
      row('Annual payment', fmt.money(q.annualPayment), 'neg');
    } else row('Loan', 'None (cash purchase)');
    row('Expected rent / yr', l.type === 'land' ? 'None (plot)' : fmt.money(l.rentAnnual), l.rentAnnual > (q ? q.annualPayment : 0) ? 'pos' : 'neg');
    row('Stamp duty', fmt.money(q ? q.duty : l.stampDuty), 'neg');
    if (q && q.lenderCapped && q.message) dl.appendChild(h('div', { class: 'quote__total' }, [h('dt', { text: 'Lender' }), h('dd', { class: 'num neg', text: q.message })]));
    var cash = q ? q.cash : offer.price + l.stampDuty;
    var assets = fs.ok ? fs.assets : 0, debt = fs.ok ? fs.debt : 0, newLtv = (debt + (q ? q.principal : 0)) / Math.max(1, assets + offer.price);
    row('Portfolio LTV after', Math.round(newLtv * 100) + '%', newLtv > 0.78 ? 'neg' : '');
    dl.appendChild(h('div', { class: 'quote__total' }, [h('dt', { text: 'Cash needed' }), h('dd', { class: 'num ' + (cash > s.cash ? 'neg' : ''), text: fmt.money(cash) + ' of ' + fmt.money(s.cash) })]));
    return dl;
  }
  function offerFoot(l) {
    var q = quoteFor(l), s = PEUI.summary(), cash = q ? q.cash : offer.price + l.stampDuty;
    var row = h('div', { class: 'btn-row' });
    if (l.counterPrice && offer.price < l.counterPrice) row.appendChild(PEUI.btn('Accept ' + fmt.money(l.counterPrice), { cls: 'btn--secondary', action: 'offer-accept-counter', 'data-id': l.id, icon: 'check' }));
    var label = l.seller === 'auction' ? 'Bid ' + fmt.money(offer.price) : 'Offer ' + fmt.money(offer.price);
    var b = PEUI.btn(label, { cls: 'btn--primary', action: 'offer-submit', 'data-id': l.id, icon: l.seller === 'auction' ? 'gavel' : 'key', disabled: cash > s.cash });
    b.id = 'offer-submit';
    row.appendChild(b);
    return row;
  }
  function refreshOffer(l) {
    var q = quoteFor(l), fs = PE().Finance.summary(), s = PEUI.summary();
    PEUI.setText(document.getElementById('offer-price-v'), fmt.money(offer.price) + ' (' + Math.round(offer.price / l.askingPrice * 100) + '% of asking)');
    PEUI.setText(document.getElementById('offer-ltv-v'), Math.round(offer.ltv * 100) + '%');
    var o = document.getElementById('offer-odds'), odds = oddsFor(l); if (o) { PEUI.empty(o); o.appendChild(h('span', { text: 'Odds' })); o.appendChild(PEUI.bar(odds.frac, odds.kind)); o.appendChild(h('span', { text: odds.text })); }
    var qp = document.getElementById('offer-quote'); if (qp) { PEUI.empty(qp); qp.appendChild(quotePanel(l, q, fs, s)); }
    var og = document.getElementById('offer-guide'); if (og && PEUI.guide) { PEUI.empty(og); PEUI.append(og, PEUI.guide.callout('ltv', { listing: l, quote: q })); }
    var segs = document.querySelectorAll('#offer-panel .seg__btn'); for (var i = 0; i < segs.length; i++) { var t = segs[i].dataset.type; segs[i].setAttribute('aria-pressed', String(t === 'fixed' ? offer.fixed : (offer.type === t && !offer.fixed))); }
    var foot = PEUI.sheet.foot(); if (foot) { PEUI.empty(foot); foot.appendChild(offerFoot(l)); }
  }

  PEUI.openListing = function (id, note) {
    var l = listingData(id); if (!l) { PEUI.toast('That listing is gone.', 'danger'); return; }
    var ap = PE().Market.appraise(id); if (!ap.ok) { PEUI.toast(ap.message, 'danger'); return; }
    if (offer.id !== id) {
      var mid = l.revealed ? l.trueValue : Math.round((l.lowEstimate + l.highEstimate) / 2);
      offer.id = id; offer.price = Math.max(Math.round(l.askingPrice * 0.6), Math.min(Math.round(l.askingPrice * 1.2), l.counterPrice || Math.min(mid, l.askingPrice)));
      if (l.seller === 'auction') offer.price = l.askingPrice;
      offer.ltv = Math.round(l.maxLtv * 20) / 20; offer.type = 'io'; offer.fixed = false;
    }
    var body = [];
    if (PEUI.advisor) { if (affordability(l, PEUI.summary().cash).text === 'Stretch deal') PEUI.advisor.trigger('stretch', 'listing'); body.push(PEUI.advisor.mount('listing')); }
    if (note) body.push(h('div', { class: 'note note--info' }, [icon('info'), h('span', { text: note })]));
    body.push(statsGrid(l, ap));
    body.push(h('div', { class: 'chips' }, [PEUI.chip(l.sellerName, l.seller === 'auction' ? 'gold' : null, l.seller === 'auction' ? 'gavel' : 'person'), PEUI.chip(l.era.charAt(0).toUpperCase() + l.era.slice(1) + ' · built ' + l.builtYear, 'outline')]));
    body.push(appraisalPanel(l, ap));
    body.push(h('div', { class: 'divider' }));
    body.push(offerPanel(l));
    PEUI.sheet.open({ id: 'listing:' + id, title: l.name, sub: l.typeName + ' · ' + l.district + ', ' + l.cityName, body: body, foot: offerFoot(l), onClose: function () { if (PEUI.current === 'city' && root.City3D) root.City3D.setSelected(null); } });
    PEUI.sound('stamp');
  };
  PEUI.actions['open-listing'] = function (b, d) { PEUI.openListing(d.id); };
  /* Bought sheet: close and jump to the 3D city, where focusNewPurchase pushes in on the new building. */
  PEUI.actions['bought-goto-city'] = function (b, d) {
    PEUI.sheet.close();
    PEUI.render('city', { city: d.city });
  };
  PEUI.actions['insider-tip'] = function (b, d) {
    var r = PEUI.call(PE().Market.insiderTip, d.id); if (!r.ok) return;
    PEUI.toast('True value: ' + fmt.money(r.trueValue), 'success'); PEUI.save();
    offer.id = null; PEUI.openListing(d.id); PEUI.refresh();
  };
  PEUI.inputs['offer-price'] = function (el) { offer.price = +el.value; el.setAttribute('aria-valuetext', fmt.money(offer.price)); var l = listingData(offer.id); if (l) refreshOffer(l); };
  PEUI.inputs['offer-ltv'] = function (el) { offer.ltv = (+el.value) / 100; var l = listingData(offer.id); if (l) refreshOffer(l); };
  PEUI.actions['offer-type'] = function (b, d) {
    if (d.type === 'fixed') { offer.fixed = !offer.fixed; } else { offer.type = d.type; offer.fixed = false; }
    var l = listingData(offer.id); if (l) refreshOffer(l);
  };
  PEUI.actions['offer-accept-counter'] = function (b, d) { var l = listingData(d.id); if (!l || !l.counterPrice) return; offer.price = l.counterPrice; submitOffer(l); };
  PEUI.actions['offer-submit'] = function (b, d) { var l = listingData(d.id); if (l) submitOffer(l); };

  function financing() { return offer.ltv > 0 ? { ltv: offer.ltv, type: offer.type, fixed: offer.fixed } : null; }
  function submitOffer(l) {
    var r = PEUI.call(PE().Market.makeOffer, l.id, offer.price, financing());
    if (!r.ok) return;
    PEUI.save();
    handleOutcome(r, l);
  }
  function handleOutcome(r, l) {
    if (r.outcome === 'accepted' || r.outcome === 'won') {
      PEUI.sound('purchase'); PEUI.confetti(40); PEUI.toast(r.message, 'success'); if (r.outcome === 'won') PEUI.sound('gavel');
      // a hidden defect: the engine reports it on offers; on auction wins compare the listing's condition with the property's
      var defect = r.defect || (l && r.property.condition < l.condition ? Math.round(l.condition - r.property.condition) : 0);
      var reveal = PEUI.appraisal ? PEUI.appraisal.reveal(r.property.id, null, r.property.trueValue, PEUI.summary().year, { defect: defect }) : null;
      var body = PEUI.sheet.open({ id: 'bought', title: 'Yours', sub: r.property.name, body: [
        h('div', { class: 'note note--success' }, [icon('check'), h('span', { text: r.message })]),
        reveal ? h('div', { class: 'note note--info reveal' }, [icon('percent'), h('span', { text: reveal.text })]) : null,
        h('div', { class: 'stat-grid' }, [stat('Paid', fmt.money(r.price)), stat('Now worth', fmt.money(r.property.trueValue)), stat('Condition', r.property.conditionLabel + (defect ? ' (defect −' + defect + ')' : '')), stat('Mortgage', r.property.mortgage ? fmt.money(r.property.mortgage.principal) : 'None')]),
        defect ? h('div', { class: 'note note--warn' }, [icon('warning'), h('span', { text: 'The survey found hidden problems: condition dropped by ' + defect + '.' })]) : null
      ], foot: h('div', { class: 'btn-row' }, [PEUI.btn('Back to deals', { cls: 'btn--secondary', action: 'sheet-close' }), PEUI.btn('See it in the city', { cls: 'btn--secondary', icon: 'city', action: 'bought-goto-city', 'data-city': r.property.cityId }), PEUI.btn('Open property', { cls: 'btn--primary', action: 'open-property', 'data-id': r.property.id, icon: 'building' })]) });
      body.appendChild(h('div', { class: 'stamp', 'aria-hidden': 'true', text: 'YOURS' }));
      offer.id = null;
      PEUI.refresh();
      if (PEUI.current === 'city' && PEUI.cityUpdateProperty) PEUI.cityUpdateProperty(r.property.id);
      return;
    }
    if (r.outcome === 'countered') {
      PEUI.sound('decision');
      offer.price = r.counterPrice;
      PEUI.openListing(l.id, 'The seller counters at ' + fmt.money(r.counterPrice) + '. Accept it, re-offer, or walk away.');
      PEUI.refresh(); return;
    }
    if (r.outcome === 'rejected') { PEUI.sound('negative'); PEUI.toast(r.message, 'danger'); offer.id = null; PEUI.openListing(l.id, r.message); PEUI.refresh(); return; }
    if (r.outcome === 'auction' || r.outcome === 'continue') { PEUI.sound('decision'); openAuction(r.auction, r.message, r.taunt); PEUI.refresh(); return; }
    if (r.outcome === 'outbid') { PEUI.sound('negative'); PEUI.sound('gavel'); PEUI.sheet.close(); offer.id = null; PEUI.refresh(); openBeaten(r); return; }
    PEUI.toast(r.message);
  }
  function stat(label, value) { return h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: label }), h('span', { class: 'stat__value num', text: value })]); }

  /* ---------- Auction sheet ---------- */
  var bidState = { id: null, bid: 0 };
  function openAuction(a, message, taunt) {
    var s = PEUI.summary();
    bidState.id = a.id;
    var step = Math.max(1, Math.round(a.currentBid * 0.03));
    if (bidState.bid <= a.currentBid) bidState.bid = Math.round(a.currentBid * 1.05);
    var rounds = h('div', { class: 'auction-rounds', 'aria-label': 'Round ' + a.round + ' of ' + a.maxRounds });
    for (var i = 0; i < a.maxRounds; i++) rounds.appendChild(h('span', { class: i < (a.round - 1) ? 'is-done' : '' }));
    var log = h('div', { class: 'auction-log', 'aria-live': 'polite' });
    for (var j = 0; j < a.log.length; j++) {
      var entry = a.log[j];
      if (entry.who === 'player') log.appendChild(h('div', { class: 'logline' }, [h('span', { class: 'grow', text: 'You bid ' + fmt.money(entry.bid) })]));
      else log.appendChild(h('div', { class: 'logline is-stamping', style: '--i:' + j }, [PEUI.portrait({ id: entry.who, name: PEUI.rivalName('rival:' + entry.who) }, { size: 24 }), h('span', { class: 'grow', text: PEUI.rivalName('rival:' + entry.who) + ' bid ' + fmt.money(entry.bid) }), entry.taunt ? h('span', { class: 'logline__taunt', text: '“' + entry.taunt + '”' }) : null]));
    }
    if (PEUI.advisor) PEUI.advisor.trigger('auction', 'auction');
    var body = [
      PEUI.advisor ? PEUI.advisor.mount('auction') : null,
      message ? h('div', { class: 'note note--warn' }, [icon('gavel'), h('span', { text: message })]) : null,
      taunt ? h('div', { class: 'note taunt-note' }, [h('span', { class: 'grow', text: '“' + taunt + '”' })]) : null,
      h('div', { class: 'kicker', style: 'text-align:center', text: 'Current bid · ' + a.leaderName }),
      h('div', { class: 'auction-bid num', text: fmt.money(a.currentBid) }),
      rounds,
      h('div', { class: 'small muted', style: 'text-align:center', text: 'Round ' + Math.min(a.round, a.maxRounds) + ' of ' + a.maxRounds + ' · bidding against ' + (a.bidders.length ? a.bidders.join(', ') : 'no one') }),
      log,
      h('div', { class: 'field' }, [
        h('label', { class: 'field__label', for: 'bid-amount' }, [h('span', { text: 'Your bid' }), h('strong', { id: 'bid-amount-v', text: fmt.money(bidState.bid) })]),
        h('div', { class: 'row' }, [
          PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'arrow-down', action: 'bid-step', 'data-step': String(-step), ariaLabel: 'Lower bid' }),
          h('input', { class: 'input num', id: 'bid-amount', type: 'number', inputmode: 'numeric', min: a.currentBid + 1, step: step, value: bidState.bid, 'data-input': 'bid-amount', 'aria-label': 'Bid amount' }),
          PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'arrow-up', action: 'bid-step', 'data-step': String(step), ariaLabel: 'Raise bid' })
        ])
      ]),
      h('div', { class: 'small muted', text: 'Cash on hand ' + fmt.money(s.cash) + '. Financing as set in your offer.' })
    ];
    PEUI.sheet.open({ id: 'auction', title: 'Auction: ' + a.name, sub: 'Highest bid after ' + a.maxRounds + ' rounds wins', body: body, foot: h('div', { class: 'btn-row' }, [PEUI.btn('Withdraw', { cls: 'btn--ghost', action: 'auction-withdraw', 'data-id': a.id }), PEUI.btn('Bid', { cls: 'btn--primary', icon: 'gavel', action: 'auction-bid', 'data-id': a.id })]) });
  }
  function openBeaten(r) {
    var wid = r.winner ? String(r.winner).replace('rival:', '') : null;
    var def = wid && PE().Data.rivalById(wid);
    var body = [
      def ? h('div', { class: 'rival-hero' }, [PEUI.portrait({ id: wid, name: def.name }, { size: 64 }), h('div', { class: 'rival-hero__meta' }, [h('div', { class: 'rival-hero__name rival__name', text: def.name }), h('div', { class: 'small muted', text: 'Takes it at ' + fmt.money(r.currentBid) })])]) : h('div', { class: 'note note--warn', text: r.message }),
      r.taunt ? h('div', { class: 'note taunt-note' }, [h('span', { class: 'grow', text: '“' + r.taunt + '”' })]) : null,
      h('p', { class: 'small muted', text: 'There will be other lots. The board refreshes every year.' })
    ];
    PEUI.sheet.open({ id: 'beaten', title: 'Outbid', body: body, foot: h('div', { class: 'btn-row' }, [PEUI.btn('Back to the board', { cls: 'btn--primary', action: 'sheet-close' })]) });
  }

  PEUI.inputs['bid-amount'] = function (el) { bidState.bid = Math.round(+el.value || 0); PEUI.setText(document.getElementById('bid-amount-v'), fmt.money(bidState.bid)); };
  PEUI.actions['bid-step'] = function (b, d) { bidState.bid = Math.max(0, bidState.bid + (+d.step)); var inp = document.getElementById('bid-amount'); if (inp) inp.value = bidState.bid; PEUI.setText(document.getElementById('bid-amount-v'), fmt.money(bidState.bid)); };
  PEUI.actions['auction-bid'] = function (b, d) {
    var s = PEUI.summary(), auc = s.auction; if (!auc) { PEUI.sheet.close(); return; }
    var l = listingData(auc.listingId);
    var r = PEUI.call(PE().Market.bid, d.id, bidState.bid); if (!r.ok) return;
    PEUI.save();
    if (r.outcome === 'continue') { bidState.bid = Math.round(r.currentBid * 1.05); openAuction(r.auction, r.message); PEUI.refresh(); return; }
    handleOutcome(r, l);
  };
  PEUI.actions['auction-withdraw'] = function (b, d) {
    var r = PEUI.call(PE().Market.withdraw, d.id); if (!r.ok) return;
    PEUI.save(); PEUI.sheet.close(); PEUI.toast(r.message); offer.id = null; PEUI.refresh();
  };
  PEUI.openAuction = openAuction;
})(window);
