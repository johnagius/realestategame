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
    var famDef = PE().Data.familyById(PE().S().familyId);
    head.appendChild(h('div', { class: 'head-card' }, [PEUI.crest({ id: PE().S().familyId, name: 'House ' + d.surname, color: s.color, motto: famDef ? famDef.motto : '' }, { size: 46, motto: true }), h('div', { class: 'head-card__name', text: d.head.name + ' ' + d.surname }), h('div', { class: 'small muted', text: 'Head of the family · age ' + d.head.age + ' · ' + fmt.ordinal(d.generation) + ' generation' + (d.head.educated ? ' · educated' : '') })]));
    if (d.merger && (d.merger.allies.length || d.alliances.length)) {
      var mg = h('section', { class: 'card stack', 'aria-label': 'Marriage alliances' });
      mg.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Marriage alliances' }), h('span', { class: 'small muted', text: d.alliances.length ? d.alliances.length + ' allied' : 'None yet' })]));
      if (d.alliances.length) {
        for (var al = 0; al < d.alliances.length; al++) {
          var a2 = d.alliances[al], aDef = PE().Data.rivalById(a2.rivalId);
          mg.appendChild(h('div', { class: 'member' }, [PEUI.crest({ id: a2.rivalId, name: aDef.name, color: aDef.color }, { size: 34 }), h('div', { class: 'member__name' }, [aDef.name, ' ', PEUI.badge('Allied', 'gold')]), h('div', { class: 'member__acts' }), h('div', { class: 'member__traits', text: 'Married in ' + a2.year + ' · reveals one true value a year in their city · never contests your deals' })]));
        }
      } else mg.appendChild(h('p', { class: 'small muted', text: 'Propose a marriage below. An alliance shares one true value a year and opens the door to a late-game merger.' }));
      for (var mi = 0; mi < d.merger.allies.length; mi++) {
        var mAlly = d.merger.allies[mi];
        mg.appendChild(h('div', { class: 'note note--gold row row--between' }, [h('span', { class: 'grow' }, [icon('crown'), ' Merger with ' + mAlly.name + ': their ' + mAlly.properties + ' building' + (mAlly.properties === 1 ? '' : 's') + ' and treasury fold into your house for ', h('strong', { text: fmt.money(mAlly.cost) }), '. Legacy score ×' + (1 + 0.25 * ((d.mergers || 0) + 1)).toFixed(2) + '.']), PEUI.btn('Merge houses', { cls: 'btn--gold btn--sm', action: 'dyn-merge', 'data-id': mAlly.rivalId, disabled: !mAlly.available })]));
        if (!mAlly.available) mg.appendChild(h('p', { class: 'small muted', text: mAlly.reason }));
      }
      if (!d.merger.allies.length && !d.merger.windowOpen) mg.appendChild(h('p', { class: 'small muted', text: 'A merger becomes possible in the last 20 years of the run, or when the head turns 65.' }));
      inner.appendChild(mg);
    }
    head.appendChild(traitChips(d.head.traits));
    head.appendChild(h('div', { class: 'stat-grid stat-grid--3' }, [stat('Reputation', Math.round(d.reputation) + ' / 100'), stat('Estate tax', Math.round(d.estateTaxRate * 100) + '%' + (d.trust ? ' (trust)' : '')), stat('Risk this year', d.mortality.toFixed(1) + '%', d.mortality > 8 ? 'neg' : '')]));
    head.appendChild(h('div', { class: 'meter' }, [h('span', { text: 'Reputation' }), PEUI.bar(d.reputation / 100, d.reputation >= 70 ? 'success' : d.reputation >= 40 ? 'info' : 'danger'), h('span', { text: d.reputation >= 70 ? 'Respected' : d.reputation >= 40 ? 'Known' : 'Suspect' })]));
    head.appendChild(h('div', { class: 'row row--between' }, [h('span', { class: 'small muted grow', text: d.trust ? 'A family trust halves estate tax and costs 2% of net worth each year.' : 'A family trust halves estate tax for 2% of net worth a year. Plan for death before it plans for you.' }), PEUI.btn(d.trust ? 'Dissolve trust' : 'Set up trust', { cls: 'btn--secondary btn--sm', icon: 'bank', action: d.trust ? 'dyn-trust-off' : 'dyn-trust-on' })]));
    head.appendChild(h('div', { class: 'row row--between' }, [h('span', { class: 'small muted grow', text: d.charity ? 'The family endowment: 1% of net worth each year, goodwill, 5 points off estate tax.' : 'An endowment costs 1% of net worth a year, builds reputation, and shaves 5 points off estate tax.' }), PEUI.btn(d.charity ? 'Wind down endowment' : 'Endow a charity', { cls: 'btn--secondary btn--sm', icon: 'star', action: 'dyn-charity' })]));
    inner.appendChild(head);

    var fam = h('section', { class: 'card', 'aria-label': 'Family' });
    fam.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Heirs and family' }), h('span', { class: 'small muted', text: 'Education ' + fmt.money(d.educationCost) })]));
    var members = d.members.filter(function (m) { return m.relation !== 'head'; });
    if (!members.length) fam.appendChild(h('p', { class: 'small muted', style: 'padding:8px 0', text: 'No children yet. Births happen while the head is 22–45. Without an heir, a cousin inherits with a tax penalty.' }));
    else fam.appendChild(h('p', { class: 'small muted', style: 'padding:8px 0', text: 'Children grow up watching how you run the empire — the last decade shapes their traits.' }));
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
      ach.appendChild(h('div', { class: 'section-head' }, [h('h2', { text: 'Achievements' }), h('div', { class: 'row' }, [h('span', { class: 'small muted', text: earned + ' of ' + g.achievements.length + ' · legacy ' + fmt.int(g.legacyScore) }), PEUI.btn('Trophy room', { cls: 'btn--ghost btn--sm', icon: 'trophy', action: 'open-achievements' })])]));
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
  PEUI.actions['dyn-charity'] = function () { var r = PEUI.call(PE().Dynasty.toggleCharity); if (r.ok) { PEUI.save(); PEUI.sound('coin'); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };
  PEUI.actions['dyn-heir'] = function (b, d) { var r = PEUI.call(PE().Dynasty.chooseHeir, d.id); if (r.ok) { PEUI.save(); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };
  PEUI.actions['dyn-educate'] = function (b, d) { var r = PEUI.call(PE().Dynasty.educate, d.id); if (r.ok) { PEUI.save(); PEUI.sound('coin'); PEUI.moneyFloat(b, -r.cost); PEUI.toast(r.message, 'success'); PEUI.refresh(); } };
  PEUI.actions['dyn-marry'] = function (b, d) {
    var ds = PE().Dynasty.summary(); if (!ds.ok) return;
    var cands = ds.marriageCandidates || [];
    var body = [h('p', { class: 'small muted', text: 'An alliance shares one true value a year, never contests your deals, and opens the door to a late-game merger. Acceptance: 35% plus a little for every point of relation (0+ needed), minus for a richer rival. A refusal costs reputation and relation.' })];
    var any = false;
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i]; if (c.allied) continue;
      any = true;
      var rDef = PE().Data.rivalById(c.rivalId);
      body.push(h('button', { type: 'button', class: 'reno' + (c.eligible ? '' : ' reno--off'), 'data-action': 'dyn-marry-pick', 'data-id': d.id, 'data-rival': c.rivalId, disabled: !c.eligible }, [
        PEUI.crest({ id: c.rivalId, name: c.name, color: rDef.color }, { size: 34 }),
        h('span', { class: 'reno__n', text: c.name }),
        h('span', { class: 'reno__c', text: c.eligible ? '≈ ' + Math.round(c.chance * 100) + '% yes · relation ' + c.relation : (c.reason || 'Not interested') }),
        h('span', { class: 'reno__d', text: rDef.archetype })
      ]));
    }
    if (!any) body.push(h('p', { class: 'small muted', text: 'No eligible houses right now. Improve a relation (accept their offers, avoid outbidding them) and reputation 50+.' }));
    PEUI.sheet.open({ id: 'marry', title: 'Propose a marriage', body: body });
  };
  PEUI.actions['dyn-marry-pick'] = function (b, d) {
    var r = PEUI.call(PE().Dynasty.proposeMarriage, d.id, d.rival);
    if (!r.ok) return;
    PEUI.save();
    var rDef = PE().Data.rivalById(d.rival);
    var body;
    if (r.accepted) {
      PEUI.sound('fanfare'); PEUI.confetti(60);
      body = [
        h('div', { class: 'rival-hero' }, [PEUI.portrait({ id: d.rival, name: rDef.name }, { size: 72 }), h('div', { class: 'rival-hero__meta' }, [h('div', { class: 'rival-hero__name rival__name', text: 'A marriage joins the houses' }), h('div', { class: 'small muted', text: r.message })])]),
        h('div', { class: 'note note--gold' }, [icon('star'), h('span', { text: 'Alliance: ' + rDef.name + ' reveals one true value a year in their city and never bids against you. A merger becomes possible when the head turns 65 or in the last 20 years.' })])
      ];
    } else {
      PEUI.sound('negative');
      body = [
        h('div', { class: 'rival-hero' }, [PEUI.portrait({ id: d.rival, name: rDef.name }, { size: 72 }), h('div', { class: 'rival-hero__meta' }, [h('div', { class: 'rival-hero__name rival__name', text: 'They refuse' }), h('div', { class: 'small muted', text: r.message })])]),
        h('div', { class: 'note note--warn' }, [icon('users'), h('span', { text: 'Refusal cost ' + (r.reputationChange || 0) + ' reputation and cooled relations. Their house waits ' + PE().Data.balance.marriageCooldownYears + ' years before another proposal.' })])
      ];
    }
    PEUI.sheet.open({ id: 'marry-result', title: r.accepted ? 'An alliance' : 'Refused', body: body, foot: h('div', { class: 'btn-row' }, [PEUI.btn('Back to the family', { cls: 'btn--primary', action: 'sheet-close' })]) });
    PEUI.refresh();
  };
  PEUI.actions['dyn-merge'] = function (b, d) {
    var ds = PE().Dynasty.summary(); if (!ds.ok) return;
    var ally = null; for (var i = 0; i < ds.merger.allies.length; i++) if (ds.merger.allies[i].rivalId === d.id) ally = ds.merger.allies[i];
    if (!ally) return;
    PEUI.sheet.open({
      id: 'merge-confirm', title: 'Merge the houses?', back: 'sheet-close',
      body: [
        h('p', { text: 'The ' + ally.name.replace(/^The /, '') + ' fold ' + ally.properties + ' building' + (ally.properties === 1 ? '' : 's') + ' and their treasury into your house for ' + fmt.money(ally.cost) + ' in stamp and duties.' }),
        h('div', { class: 'note note--gold' }, [icon('trophy'), h('span', { text: 'Legacy score multiplier rises to ×' + (1 + 0.25 * ((ds.mergers || 0) + 1)).toFixed(2) + '. They leave the leaderboard for good.' })])
      ],
      foot: h('div', { class: 'btn-row' }, [PEUI.btn('Not yet', { cls: 'btn--ghost', action: 'sheet-close' }), PEUI.btn('Merge houses', { cls: 'btn--gold', icon: 'crown', action: 'dyn-merge-confirm', 'data-id': d.id })])
    });
  };
  PEUI.actions['dyn-merge-confirm'] = function (b, d) {
    var r = PEUI.call(PE().Dynasty.mergeWithAlly, d.id); if (!r.ok) return;
    PEUI.save(); PEUI.sound('fanfare'); PEUI.confetti(80);
    PEUI.sheet.close();
    PEUI.sheet.open({ id: 'merge-done', title: 'One house now', body: [h('div', { class: 'note note--success' }, [icon('check'), h('span', { text: r.message })])], foot: h('div', { class: 'btn-row' }, [PEUI.btn('To the city', { cls: 'btn--primary', action: 'sheet-close' })]) });
    PEUI.refresh();
  };

  /* ---------- Settings ---------- */
  function seg(name, opts, cur, action) { var s = h('div', { class: 'seg', role: 'group', 'aria-label': name }); for (var i = 0; i < opts.length; i++) s.appendChild(h('button', { type: 'button', class: 'seg__btn', 'data-action': action, 'data-v': opts[i][0], 'aria-pressed': String(cur === opts[i][0]), text: opts[i][1] })); return s; }
  PEUI.openSettings = function () {
    var p = PEUI.prefs, body = [];
    body.push(h('button', { type: 'button', class: 'toggle', 'data-action': 'set-sound', 'aria-pressed': String(!!p.sound) }, [h('span', {}, [icon('sound'), ' Sound effects']), h('span', { class: 'toggle__knob' })]));
    body.push(h('p', { class: 'small muted', text: 'Sound is on by default for new players; turn it off here any time.' }));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: '3D quality' }), seg('3D quality', [['auto', 'Auto'], ['low', 'Low'], ['high', 'High']], p.quality, 'set-quality')]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: 'Theme' }), seg('Theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], p.theme, 'set-theme')]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: 'First-years guide' }), PEUI.btn('Show again', { cls: 'btn--secondary btn--sm', icon: 'sparkle', action: 'guide-reset' })]));
    body.push(h('div', { class: 'settings__row' }, [h('span', { text: 'Export current game as JSON' }), PEUI.btn('Export', { cls: 'btn--secondary btn--sm', icon: 'download', action: 'set-export' })]));
    /* Save slots (P6.3): play, delete and import per slot. Export above always
       exports the running game; slots below are the three on-device saves. */
    body.push(h('div', { class: 'kicker', text: 'Save slots' }));
    var cur = PE().Game.state(), activeSlot = cur ? (cur.saveSlot || 1) : 0;
    var slots = PE().Storage.listSaves();
    for (var si = 0; si < slots.length; si++) {
      var sl = slots[si], isActive = sl.slot === activeSlot;
      var row = h('div', { class: 'list-row' });
      var title = h('div', { class: 'list-row__title' }, [h('span', { text: 'Slot ' + sl.slot + ' ' })]);
      if (isActive) title.appendChild(PEUI.chip('Playing', 'success'));
      var sub;
      if (sl.corrupt) sub = h('div', { class: 'list-row__sub' }, [PEUI.chip('corrupt save', 'warn', 'warning')]);
      else if (sl.exists) sub = h('div', { class: 'list-row__sub', text: (sl.familyName || 'A house') + ' · ' + (sl.year !== null ? sl.year : '?') + ' · ' + (sl.mode || 'campaign') });
      else sub = h('div', { class: 'list-row__sub', text: 'Empty' });
      row.appendChild(h('div', { class: 'list-row__main' }, [title, sub]));
      var btns = h('div', { class: 'btn-row' });
      if (sl.exists && !sl.corrupt && !isActive) btns.appendChild(PEUI.btn('Play', { cls: 'btn--secondary btn--sm', icon: 'check', action: 'slot-play', 'data-slot': sl.slot }));
      btns.appendChild(PEUI.btn('Import', { cls: 'btn--ghost btn--sm', icon: 'download', action: 'slot-import', 'data-slot': sl.slot }));
      if (sl.exists) btns.appendChild(PEUI.btn('Delete', { cls: 'btn--ghost btn--sm', icon: 'trash', action: 'slot-delete', 'data-slot': sl.slot }));
      row.appendChild(btns);
      body.push(row);
    }
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

  /* ---------- Save slots (P6.3) ---------- */
  function slotRow(slot) { var slots = PE().Storage.listSaves(); for (var i = 0; i < slots.length; i++) if (slots[i].slot === slot) return slots[i]; return null; }
  function activeSlot() { var s = PE().Game.state(); return s ? (s.saveSlot || 1) : 0; }
  function slotName(sl) { return (sl && sl.familyName) || 'that house'; }

  PEUI.actions['slot-play'] = function (b, d) {
    var slot = +d.slot, sl = slotRow(slot); if (!sl || !sl.exists) return;
    PEUI.sheet.open({
      id: 'slot-play-confirm', title: 'Load slot ' + slot + '?', back: 'open-settings',
      body: [h('p', { text: 'Load the ' + slotName(sl) + ' save from ' + (sl.year !== null ? sl.year : '?') + '? Your current game is saved first.' })],
      foot: h('div', { class: 'btn-row' }, [PEUI.btn('Keep playing', { cls: 'btn--ghost', action: 'open-settings' }), PEUI.btn('Load save', { cls: 'btn--primary', icon: 'check', action: 'slot-play-confirm', 'data-slot': slot })])
    });
  };
  PEUI.actions['slot-play-confirm'] = function (b, d) {
    PEUI.call(PE().Game.save);
    var r = PEUI.call(PE().Game.load, +d.slot); if (!r.ok) return;
    PEUI.sheet.close(); PEUI.enterGame();
  };
  PEUI.actions['slot-delete'] = function (b, d) {
    var slot = +d.slot;
    if (slot === activeSlot()) { PEUI.toast('Finish or abandon this game from the start screen instead.', 'warn'); return; }
    var sl = slotRow(slot); if (!sl || !sl.exists) return;
    PEUI.sheet.open({
      id: 'slot-delete-confirm', title: 'Delete slot ' + slot + '?', back: 'open-settings',
      body: [h('p', { text: (sl.corrupt ? 'That corrupt save' : 'The ' + slotName(sl) + ' save from ' + (sl.year !== null ? sl.year : '?')) + ' is removed from this device. This cannot be undone.' })],
      foot: h('div', { class: 'btn-row' }, [PEUI.btn('Keep it', { cls: 'btn--ghost', action: 'open-settings' }), PEUI.btn('Delete save', { cls: 'btn--danger', icon: 'trash', action: 'slot-delete-confirm', 'data-slot': slot })])
    });
  };
  PEUI.actions['slot-delete-confirm'] = function (b, d) {
    var r = PEUI.call(PE().Game.deleteSave, +d.slot); if (!r.ok) return;
    PEUI.toast(r.message); PEUI.openSettings();
  };
  /* Import: a hidden file input behind the Import button; occupied slots confirm first. */
  function pickImportFile(slot) {
    var inp = h('input', { type: 'file', accept: '.json,application/json', style: 'position:absolute;left:-9999px;top:0' });
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var r = PEUI.call(PE().Storage.importSave, String(rd.result), slot); if (!r.ok) return;
        PEUI.toast(r.message, 'success'); PEUI.openSettings();
      };
      rd.onerror = function () { PEUI.toast('Could not read that file.', 'danger'); };
      rd.readAsText(f);
    });
    root.document.body.appendChild(inp);
    inp.click();
  }
  PEUI.actions['slot-import'] = function (b, d) {
    var slot = +d.slot, sl = slotRow(slot);
    if (!sl || !sl.exists) { pickImportFile(slot); return; }
    var msg = 'Slot ' + slot + ' holds the ' + slotName(sl) + ' save' + (sl.year !== null ? ' from ' + sl.year : '') + '. Importing a file overwrites it.';
    if (slot === activeSlot()) msg += ' Your running game is untouched until you load this slot.';
    PEUI.sheet.open({
      id: 'slot-import-confirm', title: 'Import into slot ' + slot + '?', back: 'open-settings',
      body: [h('p', { text: msg })],
      foot: h('div', { class: 'btn-row' }, [PEUI.btn('Cancel', { cls: 'btn--ghost', action: 'open-settings' }), PEUI.btn('Choose file', { cls: 'btn--primary', icon: 'download', action: 'slot-import-pick', 'data-slot': slot })])
    });
  };
  PEUI.actions['slot-import-pick'] = function (b, d) { pickImportFile(+d.slot); };
})(window);
