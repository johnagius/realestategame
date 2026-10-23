/* PEUI start screen — hero splash (Splash.mount), title block, Continue with
   the dynasty card, New Dynasty → family select (4 cards with real differences)
   and a trait picker; seed from ?seed= or random. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt;
  var sel = { familyId: 'chen', traitId: null, seed: null };

  function querySeed() { try { var q = new URLSearchParams(root.location.search).get('seed'); if (q !== null && q !== '') return isNaN(+q) ? q : +q; } catch (e) {} return null; }

  function dynastyCard(s) {
    var card = h('div', { class: 'sp-dynasty' });
    var st0 = root.PE.Game.state();
    card.appendChild(h('div', { class: 'sp-dynasty-crest' }, PEUI.portrait({ id: st0 ? st0.familyId : 'chen', name: 'House ' + (st0 && st0.dynasty ? st0.dynasty.surname : s.family) }, { size: 48 })));
    var st = root.PE.Game.state();
    card.appendChild(h('div', { class: 'sp-dynasty-name', text: 'House of ' + (st && st.dynasty ? st.dynasty.surname : s.family) }));
    card.appendChild(h('div', { class: 'sp-dynasty-sub', text: s.year + ' · ' + s.era + ' · ' + fmt.ordinal(s.generation) + ' generation' }));
    if (s.lastReport && s.lastReport.cliffhanger) card.appendChild(h('div', { class: 'sp-dynasty-sub', style: 'font-style:italic', text: s.lastReport.cliffhanger }));
    card.appendChild(h('div', { class: 'sp-dynasty-worth num', text: fmt.money(s.netWorth) }));
    card.appendChild(h('div', { class: 'sp-dynasty-rank', text: 'Rank ' + s.rank + ' of ' + (Object.keys(root.PE.Game.state().rivals).length + 1) }));
    return card;
  }

  function overlay(hasSave, s) {
    var ov = h('div', { class: 'sp-overlay' });
    ov.appendChild(h('div', { class: 'sp-title-block' }, [
      h('p', { class: 'sp-kicker', text: 'A dynasty in bricks and glass' }),
      h('h1', { class: 'sp-title', html: 'Property <em>Empire</em>' }),
      h('div', { class: 'sp-rule' }),
      h('p', { class: 'sp-tagline', text: 'From one shabby room in 1850 London to a family name on the skyline.' })
    ]));
    var acts = h('div', { class: 'sp-actions' });
    if (hasSave && s) {
      acts.appendChild(dynastyCard(s));
      acts.appendChild(h('button', { type: 'button', class: 'sp-cta sp-cta--primary', 'data-action': 'start-continue', text: 'Continue' }));
      acts.appendChild(h('button', { type: 'button', class: 'sp-cta sp-cta--secondary', 'data-action': 'start-new', text: 'New dynasty' }));
    } else {
      acts.appendChild(h('button', { type: 'button', class: 'sp-cta sp-cta--primary', 'data-action': 'start-new', text: 'New dynasty' }));
    }
    var links = h('div', { class: 'sp-links' });
    links.appendChild(spLink('Prestige', 'open-perks', 'sparkle'));
    links.appendChild(spLink('Weekly challenge', 'open-challenge', 'flag'));
    links.appendChild(spLink('Begin in a crisis', 'open-scenarios', 'warning'));
    if (hasSave) links.appendChild(spLink('Trophy room', 'open-achievements', 'trophy'));
    acts.appendChild(links);
    ov.appendChild(acts);
    return ov;
  }

  function spLink(label, action, ic) {
    var b = h('button', { type: 'button', class: 'sp-link', 'data-action': action });
    b.appendChild(PEUI.icon(ic));
    b.appendChild(h('span', { text: label }));
    return b;
  }

  function famCard(f) {
    var starts = { free_derelict: 'A derelict terrace in Shoreditch', merchant_network: 'One true value revealed every year', aristocrat: 'Two mortgaged houses in Kensington and Camden', old_money: 'Deep pockets, +20% estate tax' }[f.perk] || '';
    var trait = f.trait ? root.PE.Data.traits[f.trait].name : 'Your choice';
    var b = h('button', { type: 'button', class: 'fam', 'data-action': 'start-family', 'data-id': f.id, 'aria-pressed': String(sel.familyId === f.id) });
    b.appendChild(h('div', { class: 'fam__crest' }, PEUI.portrait({ id: f.id, name: f.name }, { size: 64 })));
    b.appendChild(h('div', { class: 'fam__name' }, [h('span', { text: f.name }), h('span', { class: 'fam__diff', text: f.difficulty })]));
    b.appendChild(h('div', { class: 'fam__motto', text: '“' + f.motto + '”' }));
    b.appendChild(h('div', { class: 'fam__desc', text: f.desc }));
    b.appendChild(h('div', { class: 'fam__facts' }, [
      h('span', { html: 'Cash <strong>' + fmt.money(f.startCash) + '</strong>' }),
      h('span', { html: 'Trait <strong>' + trait + '</strong>' }),
      h('span', { html: 'Reputation <strong>' + f.reputation + '</strong>' }),
      h('span', { html: 'Starts with <strong>' + starts + '</strong>' })
    ]));
    return b;
  }

  function traitGrid(fam) {
    var g = h('div', { class: 'trait-grid', role: 'group', 'aria-label': 'Second trait' }), D = root.PE.Data;
    for (var i = 0; i < D.traitIds.length; i++) {
      var id = D.traitIds[i], t = D.traits[id], fixed = fam.trait === id;
      var b = h('button', { type: 'button', class: 'trait' + (t.positive ? '' : ' trait--neg'), 'data-action': 'start-trait', 'data-id': id, 'aria-pressed': String(sel.traitId === id), disabled: fixed });
      b.appendChild(h('div', { class: 'trait__name', text: t.name + (fixed ? ' (family trait)' : '') }));
      b.appendChild(h('div', { class: 'trait__desc', text: t.desc }));
      g.appendChild(b);
    }
    return g;
  }

  function panel() {
    var fam = root.PE.Data.familyById(sel.familyId);
    var p = h('div', { class: 'start-panel', role: 'dialog', 'aria-label': 'New dynasty' });
    var inner = h('div', { class: 'start-panel__inner' });
    inner.appendChild(h('div', { class: 'start-panel__head' }, [PEUI.btn('', { cls: 'btn--ghost btn-icon', icon: 'back', action: 'start-back', ariaLabel: 'Back' }), h('h2', { text: 'Choose your family' })]));
    var grid = h('div', { class: 'fam-grid', id: 'fam-grid' });
    for (var i = 0; i < root.PE.Data.families.length; i++) grid.appendChild(famCard(root.PE.Data.families[i]));
    inner.appendChild(grid);
    inner.appendChild(h('h2', { text: fam.trait ? 'Pick a second trait' : 'Pick a trait', id: 'trait-head' }));
    inner.appendChild(h('div', { id: 'trait-grid' }, traitGrid(fam)));
    inner.appendChild(h('button', { type: 'button', class: 'sp-cta sp-cta--primary', 'data-action': 'start-begin', text: 'Begin in London, 1850', style: 'align-self:center' }));
    inner.appendChild(h('p', { class: 'seed', text: sel.seed !== null && sel.seed !== undefined ? 'Challenge seed ' + sel.seed : 'Random world' }));
    p.appendChild(h('div', { class: 'start-panel__scroll' }, inner));
    return p;
  }

  PEUI.register('start', {
    mount: function (el) {
      PEUI.empty(el);
      var hs = root.PE.Game.hasSave(), has = hs.ok && hs.hasSave, s = null;
      if (has) { var l = root.PE.Game.load(); if (l.ok) { var sm = root.PE.Game.summary(); if (sm.ok) s = sm; } else has = false; }
      el.appendChild(overlay(has, s));
      el.appendChild(h('div', { class: 'sp-version', text: PEUI.VERSION }));
      sel.seed = querySeed();
      if (root.Splash && !root.Splash._mounted) {
        var q = PEUI.prefs.quality === 'auto' ? null : PEUI.prefs.quality;
        try { root.Splash.mount(el, { quality: q || 'low', eraCycleMs: 8000 }); } catch (e) { console.warn('splash', e); }
      }
    },
    unmount: function () { if (root.Splash && root.Splash._mounted) root.Splash.unmount(); }
  });

  PEUI.actions['start-continue'] = function () {
    var s = root.PE.Game.state();
    if (!s) { var l = PEUI.call(root.PE.Game.load); if (!l.ok) return; }
    PEUI.enterGame();
  };
  PEUI.actions['start-new'] = function () {
    var el = document.getElementById('screen-start');
    sel.familyId = 'chen'; sel.traitId = null;
    var old = el.querySelector('.start-panel'); if (old) old.parentNode.removeChild(old);
    el.appendChild(panel());
    var first = el.querySelector('.start-panel .fam'); if (first) first.focus();
  };
  PEUI.actions['start-back'] = function () { var p = document.querySelector('.start-panel'); if (p) p.parentNode.removeChild(p); };
  PEUI.actions['start-family'] = function (btn, d) {
    sel.familyId = d.id; var fam = root.PE.Data.familyById(d.id);
    if (sel.traitId === fam.trait) sel.traitId = null;
    var cards = document.querySelectorAll('#fam-grid .fam'); for (var i = 0; i < cards.length; i++) cards[i].setAttribute('aria-pressed', String(cards[i].dataset.id === d.id));
    PEUI.setText(document.getElementById('trait-head'), fam.trait ? 'Pick a second trait' : 'Pick a trait');
    var tg = document.getElementById('trait-grid'); PEUI.empty(tg); tg.appendChild(traitGrid(fam));
  };
  PEUI.actions['start-trait'] = function (btn, d) {
    sel.traitId = sel.traitId === d.id ? null : d.id;
    var ts = document.querySelectorAll('#trait-grid .trait'); for (var i = 0; i < ts.length; i++) ts[i].setAttribute('aria-pressed', String(ts[i].dataset.id === sel.traitId));
  };
  PEUI.actions['start-begin'] = function () {
    var seed = sel.seed !== null && sel.seed !== undefined ? sel.seed : Math.floor(Math.random() * 1e9);
    var r = PEUI.call(root.PE.Game.newGame, { familyId: sel.familyId, traitId: sel.traitId, seed: seed });
    if (!r.ok) return;
    PEUI.prefs.gameStartedAt = Date.now(); PEUI.prefs.lastAdYear = -99; PEUI.savePrefs();
    PEUI.save();
    PEUI.sound('fanfare');
    PEUI.enterGame();
    PEUI.toast(r.message, 'success');
  };
})(window);
