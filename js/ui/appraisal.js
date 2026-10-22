/* PEUI appraisal — the mini-skill. "Your estimate" per listing (prefs), a
   reveal when the building's true value becomes known (bought by you or by
   a rival), and a running accuracy stat: median absolute error over the last
   ten reveals with a label. Every value is an engine payload. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  function PE() { return root.PE; }
  function prefs() { var p = PEUI.prefs; if (!p.appraisal) p.appraisal = { estimates: {}, reveals: [] }; if (!p.appraisal.estimates) p.appraisal.estimates = {}; if (!p.appraisal.reveals) p.appraisal.reveals = []; return p.appraisal; }

  var AP = PEUI.appraisal = {};
  AP.KEEP = 10;
  AP.LABELS = [[0.04, 'Expert'], [0.08, 'Sharp'], [0.15, 'Fair'], [Infinity, 'Novice']];

  AP.get = function (id) { var v = prefs().estimates[id]; return v === undefined ? null : v; };
  AP.set = function (id, v) { v = Math.max(1, Math.round(+v || 0)); prefs().estimates[id] = v; PEUI.savePrefs(); return v; };
  AP.forget = function (id) { delete prefs().estimates[id]; PEUI.savePrefs(); };

  /* Record a reveal; returns { est, worth, pct, text } or null when no estimate was made.
     opts.defect: a hidden defect was found after purchase, so the true value moved after the
     appraisal; the reveal is shown but not counted against the player's accuracy. */
  AP.reveal = function (id, name, worth, year, opts) {
    var est = AP.get(id); if (est === null || !worth) { if (est !== null) AP.forget(id); return null; }
    var pct = (est - worth) / worth, p = prefs(), defect = opts && opts.defect;
    if (!defect) { p.reveals.push({ year: year, name: name, est: est, worth: worth, err: Math.abs(pct) }); while (p.reveals.length > AP.KEEP) p.reveals.shift(); }
    delete p.estimates[id]; PEUI.savePrefs();
    var ab = Math.round(Math.abs(pct) * 100), who = name ? name : 'it';
    var text = defect ? 'You estimated ' + fmt.money(est) + '; after the survey\'s findings ' + who + ' is worth ' + fmt.money(worth) + '. Hidden defects are not counted against your appraisal skill.'
      : 'You estimated ' + fmt.money(est) + '; ' + who + ' was worth ' + fmt.money(worth) + ' (you were ' + (ab === 0 ? 'spot on' : ab + '% ' + (pct > 0 ? 'high' : 'low')) + ').';
    return { est: est, worth: worth, pct: pct, defect: !!defect, text: text };
  };

  /* After a year ends: listings you priced that are no longer on the board. Bought by a rival →
     the property view carries its true value. Expired listings are gone with the engine, so no reveal. */
  AP.sweep = function (year) {
    var s = PE().Game.state(), p = prefs(), out = [];
    for (var id in p.estimates) {
      if (s.listings[id]) continue;
      var r = PE().Game.property(id);
      if (r.ok && r.property && !r.property.listing && r.property.trueValue) { var rv = AP.reveal(id, r.property.name, r.property.trueValue, year); if (rv) out.push(rv); }
      else AP.forget(id);
    }
    return out;
  };

  AP.stats = function () {
    var rs = prefs().reveals, n = rs.length;
    if (!n) return { n: 0, median: null, label: 'Novice', frac: 0 };
    var errs = rs.map(function (r) { return r.err; }).sort(function (a, b) { return a - b; });
    var med = n % 2 ? errs[(n - 1) / 2] : (errs[n / 2 - 1] + errs[n / 2]) / 2, label = 'Novice';
    for (var i = 0; i < AP.LABELS.length; i++) if (med <= AP.LABELS[i][0]) { label = AP.LABELS[i][1]; break; }
    return { n: n, median: med, label: label, frac: Math.max(0, 1 - med / 0.2) };
  };

  /* The "Your estimate" field for the listing sheet. */
  AP.field = function (l, ap) {
    var mid = ap.estimate, cur = AP.get(l.id); if (cur === null) cur = mid;
    var step = Math.max(1, Math.round(mid / 100));
    var box = h('div', { class: 'estimate', id: 'estimate-field' });
    box.appendChild(h('label', { class: 'field__label', for: 'est-input' }, [h('span', { text: 'Your estimate' }), h('strong', { id: 'est-v', text: fmt.money(cur) })]));
    box.appendChild(h('div', { class: 'row' }, [
      PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'arrow-down', action: 'est-step', 'data-id': l.id, 'data-step': String(-step), ariaLabel: 'Lower estimate by ' + fmt.money(step) }),
      h('input', { class: 'input num', id: 'est-input', type: 'number', inputmode: 'numeric', min: 1, step: step, value: cur, 'data-input': 'est-input', 'data-id': l.id, 'aria-label': 'Your estimate of the value' }),
      PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'arrow-up', action: 'est-step', 'data-id': l.id, 'data-step': String(step), ariaLabel: 'Raise estimate by ' + fmt.money(step) })
    ]));
    box.appendChild(h('p', { class: 'small muted', text: 'Write down what you think it is worth. When it sells you will see how close you were.' }));
    return box;
  };
  function sync(id, v) { v = AP.set(id, v); PEUI.setText(document.getElementById('est-v'), fmt.money(v)); var inp = document.getElementById('est-input'); if (inp && +inp.value !== v) inp.value = v; }
  PEUI.inputs['est-input'] = function (el, d) { if (+el.value > 0) sync(d.id, +el.value); };
  PEUI.actions['est-step'] = function (b, d) { var cur = AP.get(d.id); if (cur === null) { var inp = document.getElementById('est-input'); cur = inp ? +inp.value : 0; } sync(d.id, Math.max(1, cur + (+d.step))); };

  /* Dynasty screen card. */
  AP.card = function () {
    var st = AP.stats(), card = h('section', { class: 'card card--flat stack stack--2', 'aria-label': 'Appraisal skill' });
    card.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Appraisal skill' }), PEUI.badge(st.label, st.label === 'Expert' ? 'gold' : st.label === 'Sharp' ? 'success' : st.label === 'Fair' ? 'info' : 'neutral')]));
    card.appendChild(h('div', { class: 'meter' }, [h('span', { text: 'Accuracy' }), PEUI.bar(st.frac, st.label === 'Novice' ? 'warn' : 'success', null, 'Appraisal accuracy'), h('span', { class: 'num', text: st.n ? Math.round(st.median * 100) + '% off' : 'No reveals yet' })]));
    card.appendChild(h('p', { class: 'small muted', text: st.n ? 'Median error over your last ' + st.n + ' reveal' + (st.n === 1 ? '' : 's') + '. Under 4% is Expert, under 8% Sharp, under 15% Fair.' : 'Enter your own estimate on a listing. When it sells, to you or to a rival, you learn how close you were.' }));
    return card;
  };

  /* Comp → building on the 3D map (only when the engine gives the comp a property id that is in the rendered city). */
  AP.compTarget = function (c) { var id = c.propertyId || c.id; return id && PEUI.cityHas && PEUI.cityHas(id) ? id : null; };
  PEUI.actions['comp-focus'] = function (b, d) {
    if (!root.City3D || !PEUI.cityHas || !PEUI.cityHas(d.id)) return;
    try { root.City3D.setSelected(d.id); root.City3D.focus(d.id, 1.8); } catch (e) { return; }
    setTimeout(function () { try { if (PEUI.current === 'city') root.City3D.setSelected(null); } catch (e) {} }, 1600);
  };
})(window);
