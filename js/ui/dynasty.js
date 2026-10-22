/* PEUI dynasty — head of the family, heirs with educate/choose-heir/marriage,
   family trust vs estate tax, reputation, generation, deaths, achievements.
   Also the Settings sheet (sound, 3D quality, theme, export/delete save). */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  function PE() { return root.PE; }
  function traitChips(traits) { var c = h('div', { class: 'chips' }); for (var i = 0; i < traits.length; i++) { var t = PE().Data.traits[traits[i]]; c.appendChild(PEUI.chip(t.name, t.positive ? 'gold' : 'danger', t.positive ? 'star' : 'warning')); } return c; }
  function stat(label, value, cls) { return h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: label }), h('span', { class: 'stat__value num' + (cls ? ' ' + cls : ''), text: value })]); }

  function build(el) {
    var d = PE().Dynasty.summary(), s = PEUI.summary(), g = PE().Goals.current(); if (!d.ok) return;
    var inner = el.querySelector('.screen__inner'); PEUI.empty(inner);
    var head = h('section', { class: 'card stack', 'aria-label': 'Head of the family' });
    head.appendChild(h('div', { class: 'head-card' }, [h('span', { class: 'crest', style: 'background:' + s.color, text: PEUI.crestLetter(d.surname) }), h('div', { class: 'head-card__name', text: d.head.name + ' ' + d.surname }), h('div', { class: 'small muted', text: 'Head of the family · age ' + d.head.age + ' · ' + fmt.ordinal(d.generation) + ' generation' + (d.head.educated ? ' · educated' : '') })]));
    head.appendChild(traitChips(d.head.traits));
    head.appendChild(h('div', { class: 'stat-grid stat-grid--3' }, [stat('Reputation', Math.round(d.reputation) + ' / 100'), stat('Estate tax', Math.round(d.estateTaxRate * 100) + '%' + (d.trust ? ' (trust)' : '')), stat('Risk this year', d.mortality.toFixed(1) + '%', d.mortality > 8 ? 'neg' : '')]));
    head.appendChild(h('div', { class: 'meter' }, [h('span', { text: 'Reputation' }), PEUI.bar(d.reputation / 100, d.reputation >= 70 ? 'success' : d.reputation >= 40 ? 'info' : 'danger'), h('span', { text: d.reputation >= 70 ? 'Respected' : d.reputation >= 40 ? 'Known' : 'Suspect' })]));
    head.appendChild(h('div', { class: 'row row--between' }, [h('span', { class: 'small muted grow', text: d.trust ? 'A family trust halves estate tax and costs 2% of net worth each year.' : 'A family trust halves estate tax for 2% of net worth a year. Plan for death before it plans for you.' }), PEUI.btn(d.trust ? 'Dissolve trust' : 'Set up trust', { cls: 'btn--secondary btn--sm', icon: 'bank', action: d.trust ? 'dyn-trust-off' : 'dyn-trust-on' })]));
    inner.appendChild(head);

    var fam = h('section', { class: 'card', 'aria-label': 'Family' });
    fam.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Heirs and family' }), h('span', { class: 'small muted', text: 'Education ' + fmt.money(d.educationCost) })]));
    var members = d.members.filter(function (m) { return m.relation !== 'head'; });
    if (!members.length) fam.appendChild(h('p', { class: 'small muted', style: 'padding:8px 0', text: 'No children yet. Births happen while the head is 22–45. Without an heir, a cousin inherits with a tax penalty.' }));
    for (var i = 0; i < members.length; i++) {
      var m = members[i], row = h('div', { class: 'member' });
      row.appendChild(h('span', { class: 'crest', style: 'background:' + (m.disgraced ? '#777' : s.color), text: m.name.charAt(0) }));
      var title = h('div', { class: 'member__name' }, [m.name + ', ' + m.age + ' ']);
      if (d.heirId === m.id) title.appendChild(PEUI.badge('Heir', 'gold'));
      if (m.married) title.appendChild(PEUI.badge('Married: ' + PEUI.rivalName('rival:' + m.married), 'info'));
      if (m.disgraced) title.appendChild(PEUI.badge('Disgraced', 'danger'));
      if (m.educated) title.appendChild(PEUI.badge('Educated', 'neutral'));
      row.appendChild(title);
      var acts = h('div', { class: 'member__acts' });
      if (m.relation === 'child' && !m.disgraced && m.age >= PE().Data.balance.adultAge && d.heirId !== m.id) acts.appendChild(PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'crown', action: 'dyn-heir', 'data-id': m.id, ariaLabel: 'Make ' + m.name + ' the heir' }));
      if (!m.educated && m.age >= 10 && m.age <= 30) acts.appendChild(PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'star', action: 'dyn-educate', 'data-id': m.id, ariaLabel: 'Educate ' + m.name + ' for ' + fmt.money(d.educationCost) }));
      if (m.relation === 'child' && m.age >= PE().Data.balance.adultAge && !m.married && !m.disgraced) acts.appendChild(PEUI.btn('', { cls: 'btn--secondary btn-icon', icon: 'users', action: 'dyn-marry', 'data-id': m.id, ariaLabel: 'Propose a marriage for ' + m.name }));
      row.appendChild(acts);
      row.appendChild(h('div', { class: 'member__traits', text: (m.relation === 'child' ? 'Child' : 'Sibling') + ' · ' + m.traits.map(function (t) { return PE().Data.traits[t].name; }).join(', ') }));
      fam.appendChild(row);
    }
    inner.appendChild(fam);
    if (PEUI.appraisal) inner.appendChild(PEUI.appraisal.card());

    if (d.deaths.length) {
      var hist = h('section', { class: 'card card--flat', 'aria-label': 'Past heads' });
      hist.appendChild(h('div', { class: 'kicker', text: 'Those who came before' }));
      var ul = h('ul', { class: 'lines' });
      for (var k = d.deaths.length - 1; k >= 0; k--) ul.appendChild(h('li', {}, [icon('crown'), h('span', { text: d.deaths[k].name + ', generation ' + d.deaths[k].generation + ', died ' + d.deaths[k].year + ' aged ' + d.deaths[k].age + (d.deaths[k].disgraced ? ' (the house fell)' : '') })]));
      hist.appendChild(ul); inner.appendChild(hist);
    }
    if (g.ok) {
      var ach = h('section', { class: 'card card--flat', 'aria-label': 'Achievements' });
      var earned = g.achievements.filter(function (a) { return a.earned; }).length;
      ach.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Achievements' }), h('span', { class: 'small muted', text: earned + ' of ' + g.achievements.length + ' · legacy ' + fmt.int(g.legacyScore) })]));
      var chips = h('div', { class: 'chips', style: 'margin-top:8px' });
      for (var a = 0; a < g.achievements.length; a++) { var A = g.achievements[a]; var c = PEUI.chip(A.name, A.earned ? 'gold' : 'outline', A.earned ? 'check' : 'lock'); c.title = A.desc; chips.appendChild(c); }
      ach.appendChild(chips); inner.appendChild(ach);
    }
  }

  PEUI.register('dynasty', {
    mount: function (el) {
      PEUI.empty(el);
      var sc = h('div', { class: 'screen__scroll', tabindex: '0' }), inner = h('div', { class: 'screen__inner' });
      sc.appendChild(h('div', { class: 'section-head', style: 'max-width:var(--content-max);margin:0 auto 12px' }, [h('h2', { text: 'Dynasty' }), PEUI.btn('Settings', { cls: 'btn--ghost btn--sm', icon: 'settings', action: 'open-settings' })]));
      sc.appendChild(inner); el.appendChild(sc);
      this.update(el);
    },
    update: function (el) { build(el); }
  });
  PEUI.actions['dyn-trust-on'] = function () { var r = PEUI.call(PE().Dynasty.setupTrust); if (r.ok) { PEUI.save(); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };
  PEUI.actions['dyn-trust-off'] = function () { var r = PEUI.call(PE().Dynasty.dissolveTrust); if (r.ok) { PEUI.save(); PEUI.toast(r.message); PEUI.refresh(); } };
  PEUI.actions['dyn-heir'] = function (b, d) { var r = PEUI.call(PE().Dynasty.chooseHeir, d.id); if (r.ok) { PEUI.save(); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };
  PEUI.actions['dyn-educate'] = function (b, d) { var r = PEUI.call(PE().Dynasty.educate, d.id); if (r.ok) { PEUI.save(); PEUI.sound('coin'); PEUI.moneyFloat(b, -r.cost); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };
  PEUI.actions['dyn-marry'] = function (b, d) {
    var lb = PE().Rivals.leaderboard(); if (!lb.ok) return;
    var body = [h('p', { class: 'small muted', text: 'An alliance shares one true value a year. Families need relation 55 or better to consider it.' })];
    for (var i = 0; i < lb.leaderboard.length; i++) {
      var r = lb.leaderboard[i]; if (r.isPlayer || r.bankrupt) continue;
      body.push(h('button', { type: 'button', class: 'reno', 'data-action': 'dyn-marry-pick', 'data-id': d.id, 'data-rival': r.id, disabled: r.relation < 55 }, [h('span', { class: 'reno__n', text: r.name }), h('span', { class: 'reno__c', text: 'Relation ' + r.relation }), h('span', { class: 'reno__d', text: r.archetype + ' · ' + fmt.money(r.netWorth) })]));
    }
    PEUI.sheet.open({ id: 'marry', title: 'Propose a marriage', body: body });
  };
  PEUI.actions['dyn-marry-pick'] = function (b, d) { var r = PEUI.call(PE().Dynasty.proposeMarriage, d.id, d.rival); if (r.ok) { PEUI.save(); PEUI.sheet.close(); PEUI.sound('fanfare'); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };

  /* ---------- Settings ---------- */
  function seg(name, opts, cur, action) { var s = h('div', { class: 'seg', role: 'group', 'aria-label': name }); for (var i = 0; i < opts.length; i++) s.appendChild(h('button', { type: 'button', class: 'seg__btn', 'data-action': action, 'data-v': opts[i][0], 'aria-pressed': String(cur === opts[i][0]), text: opts[i][1] })); return s; }
  PEUI.openSettings = function () {
    var p = PEUI.prefs, body = [];
    body.push(h('button', { type: 'button', class: 'toggle', 'data-action': 'set-sound', 'aria-pressed': String(!!p.sound) }, [h('span', {}, [icon('sound'), ' Sound effects']), h('span', { class: 'toggle__knob' })]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: '3D quality' }), seg('3D quality', [['auto', 'Auto'], ['low', 'Low'], ['high', 'High']], p.quality, 'set-quality')]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: 'Theme' }), seg('Theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], p.theme, 'set-theme')]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: 'First-years guide' }), PEUI.btn('Show again', { cls: 'btn--secondary btn--sm', icon: 'sparkle', action: 'guide-reset' })]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: 'Export save as JSON' }), PEUI.btn('Export', { cls: 'btn--secondary btn--sm', icon: 'download', action: 'set-export' })]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: 'Delete the saved game' }), PEUI.btn('Delete', { cls: 'btn--danger btn--sm', icon: 'trash', action: 'set-delete' })]));
    body.push(h('p', { class: 'small muted', text: 'Property Empire ' + PEUI.VERSION + ' · engine ' + PE().Game.version + '. Saves live on this device.' }));
    PEUI.sheet.open({ id: 'settings', title: 'Settings', body: body });
  };
  PEUI.actions['set-sound'] = function (b) { PEUI.prefs.sound = !PEUI.prefs.sound; PEUI.savePrefs(); b.setAttribute('aria-pressed', String(PEUI.prefs.sound)); if (PEUI.prefs.sound) PEUI.sound('coin'); };
  PEUI.actions['set-quality'] = function (b, d) { PEUI.prefs.quality = d.v; PEUI.savePrefs(); PEUI.openSettings(); if (PEUI.destroyCity) PEUI.destroyCity(); };
  PEUI.actions['set-theme'] = function (b, d) { PEUI.prefs.theme = d.v; PEUI.savePrefs(); PEUI.openSettings(); };
  PEUI.actions['set-export'] = function () { var s = PE().Game.state(); if (!s) { PEUI.toast('No game to export.'); return; } PEUI.download('property-empire-' + s.familyId + '-' + s.year + '.json', JSON.stringify({ saveVersion: PE().Storage.SAVE_VERSION, state: s })); PEUI.toast('Save exported.', 'success'); };
  PEUI.actions['set-delete'] = function () {
    PEUI.sheet.open({ id: 'confirm-delete', title: 'Delete the save?', back: 'open-settings', body: [h('p', { text: 'This removes the saved game from this device. The current run ends and cannot be recovered.' })], foot: h('div', { class: 'btn-row' }, [PEUI.btn('Keep it', { cls: 'btn--ghost', action: 'open-settings' }), PEUI.btn('Delete save', { cls: 'btn--danger', icon: 'trash', action: 'set-delete-confirm' })]) });
  };
  PEUI.actions['set-delete-confirm'] = function () { var r = PEUI.call(PE().Game.deleteSave); if (!r.ok) return; PEUI.sheet.close(); PE()._state = null; PEUI.toast('Save deleted.'); PEUI.leaveGame(); };
})(window);
