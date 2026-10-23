/* PEUI portfolio — grouped by city with per-property condition, rent setting,
   occupancy, LTV bar + covenant warnings and cash flow; totals per city;
   management capacity and managers; rival offers. Property sheet: renovate,
   rent, refinance/borrow, repay, sell (market vs quick), rival offers. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  function PE() { return root.PE; }
  var ps = { id: null, refiLtv: null, repay: 0, rent: null };
  var mcSeen = {}; /* margin calls already alarmed, so the sound fires once per call */

  function stat(label, value, cls) { return h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: label }), h('span', { class: 'stat__value num' + (cls ? ' ' + cls : ''), text: value })]); }
  function warningsFor(id, fs) { var out = []; if (fs.ok) for (var i = 0; i < fs.covenantWarnings.length; i++) if (fs.covenantWarnings[i].propertyId === id) out.push(fs.covenantWarnings[i]); return out; }

  function propCard(p, mgmt, fs) {
    var pay = p.mortgage ? PE().Finance.annualPayment(p.mortgage) : 0, rent = Math.round(p.rentAnnual * (p.occupancy || 0)), cf = rent - pay;
    var c = h('div', { class: 'card card--tap prop', 'data-action': 'open-property', 'data-id': p.id, role: 'button', tabindex: '0', 'aria-label': p.name });
    c.appendChild(h('div', {}, [h('div', { class: 'prop__name', text: p.name }), h('div', { class: 'prop__sub', text: p.typeName + ' · ' + p.district + ' · worth ' + fmt.money(p.trueValue) })]));
    c.appendChild(h('div', { class: 'prop__cf ' + (cf >= 0 ? 'pos' : 'neg') }, [h('small', { text: 'Rent − mortgage' }), fmt.signed(cf) + '/yr']));
    var bars = h('div', { class: 'prop__bars' });
    bars.appendChild(h('div', { class: 'prop__bar' }, [h('b', {}, [h('span', { text: 'Condition' }), h('span', { text: p.conditionLabel })]), PEUI.bar(p.condition / 100, PEUI.conditionKind(p.condition))]));
    var ws = warningsFor(p.id, fs);
    bars.appendChild(h('div', { class: 'prop__bar' }, [h('b', {}, [h('span', { text: 'Mortgage LTV' }), h('span', { text: p.mortgage ? Math.round(p.ltv * 100) + '%' : 'None' })]), PEUI.bar(p.ltv, PEUI.ltvKind(p.ltv), [0.85])]));
    c.appendChild(bars);
    var flags = h('div', { class: 'chips prop__flags' });
    flags.appendChild(PEUI.chip('Rent ' + Math.round((p.lease ? p.lease.setting : p.rentSetting) * 100) + '%', null, 'coin'));
    flags.appendChild(PEUI.chip(p.type === 'land' ? 'Plot' : 'Occupancy ' + Math.round((p.occupancy || 0) * 100) + '%', p.occupancy < 0.7 && p.type !== 'land' ? 'warn' : null, 'users'));
    var m = mgmt[p.id]; flags.appendChild(PEUI.chip(m ? (m.mgmt === 'manager' ? 'Managed' : m.mgmt === 'self' ? 'Self-managed' : 'Unmanaged') : '', m && m.mgmt === 'none' ? 'danger' : null, 'person'));
    if (p.renovation) flags.appendChild(PEUI.chip(PE().Data.renovation[p.renovation.tier].name + ' · ' + p.renovation.yearsLeft + ' yr left', 'info', 'hammer'));
    if (p.forSale) flags.appendChild(PEUI.chip('On the market', 'gold', 'tag'));
    if (p.lease) flags.appendChild(PEUI.chip('Lease ' + p.lease.yearsLeft + ' yrs', 'info'));
    for (var i = 0; i < ws.length; i++) flags.appendChild(PEUI.chip(ws[i].kind === 'margin_call' ? 'Margin call: repay ' + fmt.money(ws[i].shortfall) : 'LTV high', ws[i].kind === 'margin_call' ? 'danger' : 'warn', 'warning'));
    c.appendChild(flags);
    return c;
  }
  function offersBlock(el) {
    var r = PE().Market.offersOnMyProperties(), box = el.querySelector('#pf-offers'); PEUI.empty(box);
    if (!r.ok || !r.offers.length) return;
    box.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Rival offers' })]));
    for (var i = 0; i < r.offers.length; i++) {
      var o = r.offers[i], rd = PE().Data.rivalById(o.rivalId);
      var c = h('div', { class: 'card stack stack--2' });
      c.appendChild(h('div', { class: 'row' }, [h('span', { class: 'crest', style: 'background:' + rd.color, text: PEUI.crestLetter(rd.name) }), h('div', { class: 'grow' }, [h('div', { class: 'list-row__title', text: o.rivalName + ' offers ' + fmt.money(o.price) }), h('div', { class: 'list-row__sub', text: 'for ' + o.name + ' · ' + (o.premium >= 0 ? '+' : '') + o.premium + '% over value' })])]));
      c.appendChild(h('div', { class: 'small muted num', text: 'After fees ' + fmt.money(o.quote.fees) + (o.quote.tax ? ', tax ' + fmt.money(o.quote.tax) : '') + (o.quote.debtRepaid ? ', mortgage ' + fmt.money(o.quote.debtRepaid) : '') + ' you receive ' + fmt.money(o.quote.cashGained) + '.' }));
      c.appendChild(h('div', { class: 'btn-row' }, [PEUI.btn('Decline', { cls: 'btn--ghost', action: 'offer-respond', 'data-id': o.id, 'data-accept': '0' }), PEUI.btn('Accept ' + fmt.money(o.price), { cls: 'btn--primary', icon: 'check', action: 'offer-respond', 'data-id': o.id, 'data-accept': '1' })]));
      box.appendChild(c);
    }
  }
  function managersBlock(el) {
    var s = PEUI.summary(), cl = PE().Cities.list(), box = el.querySelector('#pf-mgmt'); PEUI.empty(box);
    var cap = s.capacity, B = PE().Data.balance;
    var card = h('section', { class: 'card stack stack--2', 'aria-label': 'Management' });
    card.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Management' }), h('span', { class: 'small muted', text: 'You manage ' + B.personalCapacity + '; a manager covers ' + B.managerCapacity + ' per city' })]));
    card.appendChild(h('div', { class: 'chips' }, [PEUI.chip(cap.self + ' self-managed', null, 'person'), PEUI.chip(cap.manager + ' managed', 'success', 'users'), PEUI.chip(cap.none + ' unmanaged', cap.none ? 'danger' : null, 'warning')]));
    if (cap.none) card.appendChild(h('div', { class: 'note note--warn' }, [icon('warning'), h('span', { text: 'Unmanaged buildings suffer extra vacancy, decay and random fines. Hire a manager in that city.' })]));
    if (cl.ok) for (var i = 0; i < cl.cities.length; i++) {
      var c = cl.cities[i]; if (!c.unlocked) continue;
      var m = c.managerId ? PE().Data.managerById(c.managerId) : null;
      var row = h('div', { class: 'list-row' });
      row.appendChild(h('div', { class: 'list-row__main' }, [h('div', { class: 'list-row__title', text: c.name }), h('div', { class: 'list-row__sub', text: m ? m.name + ' · quality ' + Math.round(m.quality * 100) + ' · ' + Math.round(m.fee * 100) + '% of rent' : 'No manager · ' + c.properties + ' building' + (c.properties === 1 ? '' : 's') })]));
      row.appendChild(m ? PEUI.btn('Dismiss', { cls: 'btn--ghost btn--sm', action: 'mgr-fire', 'data-city': c.id }) : PEUI.btn('Hire', { cls: 'btn--secondary btn--sm', icon: 'users', action: 'mgr-hire', 'data-city': c.id }));
      card.appendChild(row);
    }
    box.appendChild(card);
  }

  PEUI.register('portfolio', {
    mount: function (el) {
      PEUI.empty(el);
      var sc = h('div', { class: 'screen__scroll', tabindex: '0' }), inner = h('div', { class: 'screen__inner' });
      inner.appendChild(h('div', { id: 'pf-summary', class: 'span' }));
      inner.appendChild(h('div', { id: 'pf-warn', class: 'span stack stack--2' }));
      inner.appendChild(h('div', { id: 'pf-offers', class: 'span stack' }));
      inner.appendChild(h('div', { id: 'pf-groups', class: 'span stack stack--4' }));
      inner.appendChild(h('div', { id: 'pf-mgmt', class: 'span' }));
      sc.appendChild(inner); el.appendChild(sc);
      this.update(el);
    },
    update: function (el) {
      var r = PE().Game.portfolio(), fs = PE().Finance.summary(), s = PEUI.summary(); if (!r.ok) return;
      var sm = el.querySelector('#pf-summary'); PEUI.empty(sm);
      sm.appendChild(h('section', { class: 'card stat-grid stat-grid--3', 'aria-label': 'Portfolio summary' }, [stat('Properties', String(r.properties.length)), stat('Assets', fmt.money(fs.assets)), stat('Debt', fmt.money(fs.debt), fs.debt ? 'neg' : ''), stat('Portfolio LTV', Math.round(fs.ltv * 100) + '%', fs.ltv > 0.78 ? 'neg' : ''), stat('Debt service', fmt.money(fs.annualDebtService) + '/yr'), stat('Quote rate', (fs.quoteRate * 100).toFixed(2) + '%')]));
      var wb = el.querySelector('#pf-warn'); PEUI.empty(wb);
      if (PEUI.advisor) { if (s.offers > 0) PEUI.advisor.trigger('rival_offer', 'portfolio'); var bub = PEUI.advisor.mount('portfolio'); if (bub) wb.appendChild(bub); }
      if (PEUI.guide) { var gc = PEUI.guide.callout('portfolio'); if (gc) wb.appendChild(gc); }
      var mcNow = {};
      for (var w = 0; w < fs.covenantWarnings.length; w++) {
        var cw = fs.covenantWarnings[w];
        if (cw.kind === 'margin_call') { mcNow[cw.propertyId] = 1; if (!mcSeen[cw.propertyId]) PEUI.sound('alarm'); }
        wb.appendChild(h('div', { class: 'note ' + (cw.kind === 'margin_call' ? 'note--danger' : 'note--warn') }, [icon('warning'), h('span', { class: 'grow', text: cw.text }), PEUI.btn('Open', { cls: 'btn--secondary btn--sm', action: 'open-property', 'data-id': cw.propertyId })]));
      }
      mcSeen = mcNow;
      if (s.cash < 0) wb.appendChild(h('div', { class: 'note note--danger' }, [icon('warning'), h('span', { text: 'Cash is negative. Two years without cash and nothing to sell means bankruptcy.' })]));
      offersBlock(el);
      var groups = el.querySelector('#pf-groups'), byCity = {}, order = [];
      for (var i = 0; i < r.properties.length; i++) { var p = r.properties[i]; if (!byCity[p.cityId]) { byCity[p.cityId] = []; order.push(p.cityId); } byCity[p.cityId].push(p); }
      if (!r.properties.length) { PEUI.empty(groups); groups.appendChild(h('div', { class: 'empty' }, [icon('building'), h('div', { text: 'You own nothing yet. Find a mispriced listing on the deal board.' })])); }
      else PEUI.patchList(groups, order, function (c) { return c; }, function (c) { return c + ':' + byCity[c].map(function (p) { return [p.id, p.condition | 0, p.rentSetting, p.occupancy, p.ltv.toFixed(2), p.trueValue, !!p.renovation, !!p.forSale, p.marginCall ? 1 : 0].join(','); }).join(';') + ':' + fs.covenantWarnings.length; }, function (c) {
        var arr = byCity[c], g = h('section', { class: 'stack stack--2', 'aria-label': PEUI.cityName(c) });
        var val = 0, debt = 0, rent = 0; for (var k = 0; k < arr.length; k++) { val += arr[k].trueValue; debt += arr[k].mortgage ? arr[k].mortgage.principal : 0; rent += Math.round(arr[k].rentAnnual * (arr[k].occupancy || 0)); }
        g.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: PEUI.cityName(c) }), h('span', { class: 'small muted', text: arr.length + ' building' + (arr.length === 1 ? '' : 's') })]));
        for (var j = 0; j < arr.length; j++) g.appendChild(propCard(arr[j], r.management, fs));
        g.appendChild(h('div', { class: 'city-total' }, [h('span', { html: 'Value <strong>' + fmt.money(val) + '</strong>' }), h('span', { html: 'Debt <strong>' + fmt.money(debt) + '</strong>' }), h('span', { html: 'Rent <strong>' + fmt.money(rent) + '</strong>/yr' })]));
        return g;
      });
      managersBlock(el);
    }
  });

  PEUI.actions['offer-respond'] = function (b, d) {
    var r = PEUI.call(PE().Market.respondToOffer, d.id, d.accept === '1'); if (!r.ok) return;
    PEUI.save(); if (r.accepted) { PEUI.sound('sale'); PEUI.moneyFloat(b, r.cashGained); }
    PEUI.toast(r.message, r.accepted ? 'success' : null); PEUI.refresh();
    if (PEUI.sheet.isOpen() && PEUI.sheet.id() && PEUI.sheet.id().indexOf('property:') === 0) { if (r.accepted) PEUI.sheet.close(); else PEUI.openProperty(ps.id); }
  };
  PEUI.actions['mgr-fire'] = function (b, d) { var r = PEUI.call(PE().Property.fireManager, d.city); if (r.ok) { PEUI.save(); PEUI.toast(r.message); PEUI.refresh(); } };
  PEUI.actions['mgr-hire'] = function (b, d) {
    var r = PE().Property.availableManagers(), s = PEUI.summary(); if (!r.ok) return;
    var body = [h('p', { class: 'muted small', text: 'A manager covers up to ' + PE().Data.balance.managerCapacity + ' buildings in ' + PEUI.cityName(d.city) + ' for a share of rent. Quality reduces vacancy and decay.' })];
    var all = PE().Data.managers;
    for (var i = 0; i < all.length; i++) {
      var m = all[i], ok = m.minReputation <= s.reputation;
      body.push(h('button', { type: 'button', class: 'reno', 'data-action': 'mgr-pick', 'data-city': d.city, 'data-id': m.id, disabled: !ok }, [h('span', { class: 'reno__n', text: m.name }), h('span', { class: 'reno__c', text: Math.round(m.fee * 100) + '% of rent' }), h('span', { class: 'reno__d', text: 'Quality ' + Math.round(m.quality * 100) + ' · ' + m.desc + (ok ? '' : ' · needs reputation ' + m.minReputation) })]));
    }
    PEUI.sheet.open({ id: 'hire', title: 'Hire a manager', sub: PEUI.cityName(d.city), body: body });
  };
  PEUI.actions['mgr-pick'] = function (b, d) { var r = PEUI.call(PE().Property.hireManager, d.city, d.id); if (r.ok) { PEUI.save(); PEUI.sheet.close(); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };

  /* ---------- Property sheet ---------- */
  function propData(id) { var r = PE().Game.property(id); return r.ok && !r.property.listing && r.property.ownerId === 'player' ? r.property : null; }
  function rawProp(id) { return PE().Game.state().properties[id]; }

  PEUI.openProperty = function (id) {
    var p = propData(id); if (!p) { PEUI.toast('Not your property.', 'danger'); return; }
    var s = PEUI.summary(), fs = PE().Finance.summary(), B = PE().Data.balance;
    if (ps.id !== id) { ps.id = id; ps.refiLtv = null; ps.repay = 0; ps.rent = null; }
    if (ps.refiLtv === null) ps.refiLtv = Math.min(B.refinanceLtv, fs.maxLtv);
    var body = [];
    var pay = p.mortgage ? PE().Finance.annualPayment(p.mortgage) : 0;
    body.push(h('div', { class: 'stat-grid stat-grid--3' }, [stat('Value', fmt.money(p.trueValue)), stat('Equity', fmt.money(p.equity), p.equity < 0 ? 'neg' : ''), stat('Rent / yr', p.type === 'land' ? 'None' : fmt.money(Math.round(p.rentAnnual * (p.occupancy || 0)))), stat('Occupancy', p.type === 'land' ? '—' : Math.round((p.occupancy || 0) * 100) + '%'), stat('Paid', p.purchasePrice ? fmt.money(p.purchasePrice) + ' (' + p.purchaseYear + ')' : 'Inherited'), stat('Size', p.sqm + ' m² · built ' + p.builtYear)]));
    body.push(h('div', { class: 'meter' }, [h('span', { text: 'Condition' }), PEUI.bar(p.condition / 100, PEUI.conditionKind(p.condition)), h('span', { text: p.conditionLabel + ' · ' + Math.round(p.condition) })]));
    body.push(h('div', { class: 'meter' }, [h('span', { text: 'LTV' }), PEUI.bar(p.ltv, PEUI.ltvKind(p.ltv), [0.85]), h('span', { text: p.mortgage ? Math.round(p.ltv * 100) + '% · covenant 85%' : 'No mortgage' })]));
    var ws = warningsFor(id, fs);
    for (var w = 0; w < ws.length; w++) body.push(h('div', { class: 'note ' + (ws[w].kind === 'margin_call' ? 'note--danger' : 'note--warn') }, [icon('warning'), h('span', { text: ws[w].text })]));
    if (p.renovation) body.push(h('div', { class: 'note note--info' }, [icon('hammer'), h('span', { text: PE().Data.renovation[p.renovation.tier].name + ' in progress: ready in ' + p.renovation.yearsLeft + ' year' + (p.renovation.yearsLeft > 1 ? 's' : '') + '. No rent meanwhile.' })]));
    if (p.forSale) body.push(h('div', { class: 'note note--warn' }, [icon('tag'), h('span', { class: 'grow', text: 'On the market since ' + p.forSale.year + '; a buyer is expected by year end.' }), PEUI.btn('Withdraw', { cls: 'btn--ghost btn--sm', action: 'prop-sell', 'data-id': id, 'data-mode': 'cancel' })]));
    if (p.mortgage) body.push(h('dl', { class: 'quote' }, [h('dt', { text: 'Mortgage · ' + p.mortgage.lender }), h('dd', { class: 'num', text: fmt.money(p.mortgage.principal) }), h('dt', { text: (p.mortgage.type === 'amort' ? 'Amortising, ' + p.mortgage.yearsLeft + ' yrs left' : 'Interest-only') + (p.mortgage.fixed ? ', fixed' : ', variable') }), h('dd', { class: 'num', text: (p.mortgage.rate * 100).toFixed(2) + '%' }), h('dt', { text: 'Annual payment' }), h('dd', { class: 'num neg', text: fmt.money(pay) })]));
    // rival offers on this property
    var offers = PE().Market.offersOnMyProperties(); if (offers.ok) for (var o = 0; o < offers.offers.length; o++) if (offers.offers[o].propertyId === id) {
      var off = offers.offers[o];
      body.push(h('div', { class: 'card card--flat stack stack--2' }, [h('div', { class: 'list-row__title', text: off.rivalName + ' offers ' + fmt.money(off.price) + ' (' + (off.premium >= 0 ? '+' : '') + off.premium + '%)' }), h('div', { class: 'small muted', text: 'You would receive ' + fmt.money(off.quote.cashGained) + ' after fees, tax and mortgage.' }), h('div', { class: 'btn-row' }, [PEUI.btn('Decline', { cls: 'btn--ghost', action: 'offer-respond', 'data-id': off.id, 'data-accept': '0' }), PEUI.btn('Accept', { cls: 'btn--primary', icon: 'check', action: 'offer-respond', 'data-id': off.id, 'data-accept': '1' })])]));
    }
    // Renovate
    body.push(h('div', { class: 'kicker', text: 'Renovate' }));
    if (PEUI.guide) body.push(PEUI.guide.callout('renovate', { property: p }));
    var ro = p.renovationOptions || [];
    if (!ro.length) body.push(h('p', { class: 'small muted', text: 'Nothing to do here.' }));
    for (var i = 0; i < ro.length; i++) {
      var t = ro[i], can = !p.renovation && s.cash >= t.cost;
      var desc = (t.tier === 'rebuild' ? 'To Prime, new era style' : '+' + t.conditionGain + ' condition') + ' · +' + Math.round(t.uplift * 100) + '% value · ' + (t.years ? t.years + ' yr' + (t.years > 1 ? 's' : '') + ', no rent' : 'same year') + (t.risk ? ' · ' + Math.round(t.risk * 100) + '% ' + (t.riskKind === 'overrun' ? 'overrun (+50% cost)' : 'delay (+1 yr)') : ' · no risk');
      body.push(h('button', { type: 'button', class: 'reno', 'data-action': 'prop-renovate', 'data-id': id, 'data-tier': t.tier, disabled: !can, 'aria-label': t.name + ' for ' + fmt.money(t.cost) }, [h('span', { class: 'reno__n' }, [icon('hammer', 'ic--sm'), ' ' + t.name]), h('span', { class: 'reno__c', text: fmt.money(t.cost) }), h('span', { class: 'reno__d', text: desc })]));
    }
    // Rent
    if (p.type !== 'land') {
      var rentNow = p.lease ? p.lease.setting : p.rentSetting;
      body.push(h('div', { class: 'kicker', text: 'Rent' }));
      body.push(h('div', { class: 'field' }, [h('label', { class: 'field__label', for: 'rent-setting' }, [h('span', { text: 'Rent setting (80–120% of market)' }), h('strong', { id: 'rent-v', text: Math.round(rentNow * 100) + '% · ' + fmt.money(p.rentAnnual) + '/yr' })]), PEUI.range({ id: 'rent-setting', min: 80, max: 120, step: 5, value: Math.round(rentNow * 100), 'data-input': 'rent-setting', 'data-id': id, disabled: !!p.lease || (p.rentLockUntil && s.year < p.rentLockUntil) })]));
      body.push(h('p', { class: 'small muted', text: p.lease ? 'Fixed by a lease for ' + p.lease.yearsLeft + ' more years.' : 'Higher rent: more income, more vacancy and faster wear. Lower rent: long, careful tenants.' }));
    }
    // Finance
    if (!p.renovation) {
      body.push(h('div', { class: 'kicker', text: p.mortgage ? 'Refinance' : 'Borrow against it' }));
      if (PEUI.guide) body.push(PEUI.guide.callout('refinance', { property: p }));
      var q = PE().Finance.mortgageQuote(id, ps.refiLtv, p.mortgage ? p.mortgage.type : 'io');
      var maxRefi = Math.min(B.refinanceLtv, fs.maxLtv);
      body.push(h('div', { class: 'field' }, [h('label', { class: 'field__label', for: 'refi-ltv' }, [h('span', { text: 'New loan to value' }), h('strong', { id: 'refi-v', text: Math.round(ps.refiLtv * 100) + '%' })]), PEUI.range({ id: 'refi-ltv', min: 0, max: Math.round(maxRefi * 100), step: 5, value: Math.round(ps.refiLtv * 100), 'data-input': 'refi-ltv' })]));
      body.push(h('div', { id: 'refi-quote' }, refiQuote(p, q)));
      var can = q.ok && q.principal !== (p.mortgage ? p.mortgage.principal : 0);
      body.push(PEUI.btn(p.mortgage ? 'Refinance' : 'Borrow', { cls: 'btn--secondary btn--block', icon: 'bank', action: 'prop-refi', 'data-id': id, disabled: !can }));
      if (p.mortgage) {
        body.push(h('div', { class: 'kicker', text: 'Repay' }));
        var def = Math.min(Math.max(0, s.cash), p.mortgage.principal); if (!ps.repay) ps.repay = ws.length && ws[0].shortfall ? Math.min(def, ws[0].shortfall) : Math.round(def / 2);
        body.push(h('div', { class: 'row' }, [h('input', { class: 'input num', type: 'number', inputmode: 'numeric', min: 0, max: p.mortgage.principal, step: 1, value: ps.repay, 'data-input': 'repay-amount', 'aria-label': 'Amount to repay' }), PEUI.btn('Repay', { cls: 'btn--secondary', action: 'prop-repay', 'data-id': id })]));
      }
      // Sell
      body.push(h('div', { class: 'kicker', text: 'Sell' }));
      var raw = rawProp(id), qm = PE().Market.saleQuote(raw, 1), qf = PE().Market.quickSaleFactor(), qq = PE().Market.saleQuote(raw, qf);
      body.push(h('div', { class: 'stat-grid' }, [sellStat('Market sale', qm, 'Likely by year end; price moves with the cycle'), sellStat('Quick sale', qq, 'Cash now at ' + Math.round(qf * 100) + '% of value')]));
      body.push(h('div', { class: 'btn-row' }, [PEUI.btn('List on market', { cls: 'btn--secondary', icon: 'tag', action: 'prop-sell', 'data-id': id, 'data-mode': 'market', disabled: !!p.forSale }), PEUI.btn('Quick sale', { cls: 'btn--danger', action: 'prop-sell-confirm', 'data-id': id })]));
    }
    PEUI.sheet.open({ id: 'property:' + id, title: p.name, sub: p.typeName + ' · ' + p.district + ', ' + p.cityName, body: body, onClose: function () { if (PEUI.current === 'city' && root.City3D) root.City3D.setSelected(null); } });
  };
  function sellStat(label, q, sub) { return h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: label }), h('span', { class: 'stat__value num', text: fmt.money(q.price) }), h('span', { class: 'small muted num', text: 'Fees ' + fmt.money(q.fees) + (q.tax ? ' · tax ' + fmt.money(q.tax) : '') + (q.debtRepaid ? ' · loan ' + fmt.money(q.debtRepaid) : '') + ' → ' + fmt.money(q.cashGained) }), h('span', { class: 'small muted', text: sub })]); }
  function refiQuote(p, q) {
    var dl = h('dl', { class: 'quote' });
    function row(k, v, cls) { dl.appendChild(h('dt', { text: k })); dl.appendChild(h('dd', { class: 'num' + (cls ? ' ' + cls : ''), text: v })); }
    if (!q.ok) { row('Quote', q.message); return dl; }
    var old = p.mortgage ? p.mortgage.principal : 0, delta = q.principal - old;
    row('New loan from ' + q.lender, fmt.money(q.principal) + ' at ' + (q.rate * 100).toFixed(2) + '%');
    row('Annual payment', fmt.money(q.annualPayment), 'neg');
    row(delta >= 0 ? 'Cash out' : 'Cash in', fmt.signed(delta), delta >= 0 ? 'pos' : 'neg');
    if (p.mortgage) row('Refinance allowed', 'every ' + PE().Data.balance.refinanceEveryYears + ' yrs (last ' + (p.mortgage.lastRefi || p.mortgage.since) + ')');
    return dl;
  }
  PEUI.actions['open-property'] = function (b, d) { PEUI.openProperty(d.id); };
  PEUI.inputs['rent-setting'] = function (el, d, e) {
    var p = propData(d.id); if (!p) return;
    PEUI.setText(document.getElementById('rent-v'), el.value + '%');
    if (e.type !== 'change') return;
    var r = PEUI.call(PE().Property.setRent, d.id, (+el.value) / 100); if (!r.ok) { el.value = Math.round(p.rentSetting * 100); return; }
    PEUI.save(); PEUI.setText(document.getElementById('rent-v'), Math.round(r.rentSetting * 100) + '% · ' + fmt.money(r.rentAnnual) + '/yr'); el.value = Math.round(r.rentSetting * 100); PEUI.refresh();
  };
  PEUI.inputs['refi-ltv'] = function (el) {
    ps.refiLtv = (+el.value) / 100; var p = propData(ps.id); if (!p) return;
    PEUI.setText(document.getElementById('refi-v'), el.value + '%');
    var q = PE().Finance.mortgageQuote(ps.id, ps.refiLtv, p.mortgage ? p.mortgage.type : 'io'), box = document.getElementById('refi-quote'); if (box) { PEUI.empty(box); box.appendChild(refiQuote(p, q)); }
    var btn = document.querySelector('[data-action="prop-refi"]'); if (btn) btn.disabled = !(q.ok && q.principal !== (p.mortgage ? p.mortgage.principal : 0));
  };
  PEUI.inputs['repay-amount'] = function (el) { ps.repay = Math.round(+el.value || 0); };
  PEUI.actions['prop-renovate'] = function (b, d) {
    var before = propData(d.id);
    var r = PEUI.call(PE().Property.renovate, d.id, d.tier); if (!r.ok) return;
    PEUI.save(); PEUI.sound('stamp'); PEUI.moneyFloat(b, -r.cost); PEUI.toast(r.message, 'success');
    PEUI.openProperty(d.id);
    /* Same-year works finish now: show the transformation (before → after from
       the engine payload) and sweep the condition bar across. */
    var after = r.property;
    if (before && after && !after.renovation && Math.round(after.condition) !== Math.round(before.condition)) {
      var body = PEUI.sheet.body();
      if (body) {
        body.insertBefore(h('div', { class: 'note note--success' }, [icon('check'), h('span', { text: 'Condition ' + Math.round(before.condition) + ' → ' + Math.round(after.condition) + ' · Value ' + fmt.money(before.trueValue) + ' → ' + fmt.money(after.trueValue) })]), body.firstChild);
        var fill = body.querySelector('.meter .bar__fill');
        if (fill) {
          fill.style.transition = 'none';
          fill.style.width = (Math.max(0, Math.min(1, before.condition / 100)) * 100).toFixed(1) + '%';
          void fill.offsetWidth;
          fill.style.transition = '';
          fill.style.width = (Math.max(0, Math.min(1, after.condition / 100)) * 100).toFixed(1) + '%';
        }
      }
    }
    PEUI.refresh(); if (PEUI.cityUpdateProperty) PEUI.cityUpdateProperty(d.id);
  };
  PEUI.actions['prop-refi'] = function (b, d) {
    var p = propData(d.id); if (!p) return;
    var r = p.mortgage ? PEUI.call(PE().Finance.refinance, d.id, ps.refiLtv, p.mortgage.type) : PEUI.call(PE().Finance.takeMortgage, d.id, ps.refiLtv, 'io');
    if (!r.ok) return;
    PEUI.save(); PEUI.sound('coin'); PEUI.moneyFloat(b, r.cashDelta !== undefined ? r.cashDelta : (r.mortgage ? r.mortgage.principal : 0)); PEUI.toast(r.message, 'success'); ps.refiLtv = null; PEUI.openProperty(d.id); PEUI.refresh();
  };
  PEUI.actions['prop-repay'] = function (b, d) {
    var r = PEUI.call(PE().Finance.repay, d.id, ps.repay); if (!r.ok) return;
    PEUI.save(); PEUI.sound('coin'); PEUI.toast(r.message, 'success'); ps.repay = 0; PEUI.openProperty(d.id); PEUI.refresh();
  };
  PEUI.actions['prop-sell'] = function (b, d) {
    var r = PEUI.call(PE().Market.sell, d.id, d.mode); if (!r.ok) return;
    PEUI.save(); PEUI.toast(r.message, r.sold ? 'success' : null);
    if (r.sold) { PEUI.sound('sale'); PEUI.sheet.close(); } else PEUI.openProperty(d.id);
    PEUI.refresh(); if (PEUI.cityUpdateProperty) PEUI.cityUpdateProperty(d.id);
  };
  PEUI.actions['prop-sell-confirm'] = function (b, d) {
    var raw = rawProp(d.id); if (!raw) return;
    var q = PE().Market.saleQuote(raw, PE().Market.quickSaleFactor());
    PEUI.sheet.open({ id: 'confirm-sell', title: 'Quick sale?', sub: raw.name, back: 'open-property-back', body: [h('p', { text: 'Sell now for ' + fmt.money(q.price) + '. After fees' + (q.tax ? ' and tax' : '') + (q.debtRepaid ? ' and repaying the mortgage' : '') + ' you receive ' + fmt.money(q.cashGained) + '. This cannot be undone.' })], foot: h('div', { class: 'btn-row' }, [PEUI.btn('Keep it', { cls: 'btn--ghost', action: 'open-property', 'data-id': d.id }), PEUI.btn('Sell for ' + fmt.money(q.price), { cls: 'btn--danger', action: 'prop-sell', 'data-id': d.id, 'data-mode': 'quick' })]) });
  };
  PEUI.actions['open-property-back'] = function () { if (ps.id) PEUI.openProperty(ps.id); };
})(window);
