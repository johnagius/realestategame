/* PEUI HUD and bottom nav — 60px safe-area aware bar with cash, net worth,
   year + era, rank, reputation, cycle/rate chips and the primary "End year"
   button; a year menu with "Skip quiet years". Text nodes are patched. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt;

  function stat(id, label) { return h('div', { class: 'hud__stat' }, [h('span', { class: 'hud__label', text: label }), h('span', { class: 'hud__value num', id: id, text: '—' })]); }
  function chip(id, icon, cls) { var c = h('span', { class: 'hud__chip' + (cls ? ' ' + cls : ''), id: id }); if (icon) c.appendChild(PEUI.icon(icon)); c.appendChild(h('span', { text: '' })); return c; }

  PEUI.buildHUD = function () {
    var hud = document.getElementById('hud'); if (!hud || hud.children.length) return;
    var inner = h('div', { class: 'hud__inner' });
    var stats = h('div', { class: 'hud__stats' });
    stats.appendChild(h('div', { class: 'hud__row' }, [stat('hud-cash', 'Cash'), stat('hud-nw', 'Net worth')]));
    var chips = h('div', { class: 'hud__chips' });
    chips.appendChild(chip('hud-year', 'calendar', 'hud__chip--gold'));
    chips.appendChild(chip('hud-rank', 'trophy'));
    chips.appendChild(chip('hud-rep', 'star'));
    chips.appendChild(chip('hud-cycle', 'chart'));
    stats.appendChild(chips);
    inner.appendChild(stats);
    var acts = h('div', { class: 'hud__actions' });
    var end = h('button', { type: 'button', class: 'hud__end', id: 'hud-end', 'data-action': 'end-year', 'aria-label': 'End year' });
    end.appendChild(PEUI.icon('skip')); end.appendChild(h('span', { text: 'End year' }));
    acts.appendChild(end);
    var menu = h('button', { type: 'button', class: 'hud__menu', 'data-action': 'year-menu', 'aria-label': 'Year menu', 'aria-haspopup': 'true', 'aria-expanded': 'false' });
    menu.appendChild(PEUI.icon('menu'));
    acts.appendChild(menu);
    inner.appendChild(acts);
    hud.appendChild(inner);
    var pop = h('div', { class: 'popover', id: 'year-menu', role: 'menu' });
    pop.appendChild(menuItem('Skip quiet years', 'Up to 5 years; stops when something needs you', 'skip', 'skip-quiet'));
    pop.appendChild(menuItem('Prestige store', 'Spend legacy points on permanent perks', 'sparkle', 'open-perks'));
    pop.appendChild(menuItem('Save game', 'Also saved automatically every year', 'download', 'save-now'));
    pop.appendChild(menuItem('Settings', 'Sound, 3D quality, theme, save data', 'settings', 'open-settings'));
    pop.appendChild(menuItem('Main menu', 'Back to the title screen', 'home', 'to-start'));
    hud.appendChild(pop);
  };
  function menuItem(label, sub, icon, action) {
    var b = h('button', { type: 'button', class: 'popover__item', role: 'menuitem', 'data-action': action });
    b.appendChild(PEUI.icon(icon)); b.appendChild(h('span', {}, [label, h('small', { text: sub })]));
    return b;
  }

  var cycleCls = { boom: 'hud__chip--warn', growth: '', stagnation: '', recession: 'hud__chip--danger', depression: 'hud__chip--danger' };
  PEUI.updateHUD = function () {
    var s = PEUI.summary(); if (!s.ok) return;
    var cash = document.getElementById('hud-cash'); if (!cash) return;
    PEUI.setText(cash, fmt.money(s.cash)); cash.classList.toggle('hud__value--neg', s.cash < 0);
    PEUI.setText(document.getElementById('hud-nw'), fmt.money(s.netWorth));
    PEUI.setText(document.querySelector('#hud-year span'), s.year + ' · ' + s.era + (s.challenge ? ' · ' + fmt.int(s.challenge.score) : ''));
    PEUI.setText(document.querySelector('#hud-rank span'), '#' + s.rank);
    PEUI.setText(document.querySelector('#hud-rep span'), 'Rep ' + Math.round(s.reputation));
    var cyc = document.getElementById('hud-cycle');
    PEUI.setText(cyc.querySelector('span'), s.cycleName + ' · ' + (s.baseRate * 100).toFixed(1) + '%');
    cyc.className = 'hud__chip ' + (cycleCls[s.cycle] || '');
    var end = document.getElementById('hud-end');
    var blocked = s.status !== 'playing';
    end.disabled = blocked;
    PEUI.setText(end.querySelector('span'), s.pendingEvents ? 'Decide' : 'End year');
    document.documentElement.style.setProperty('--player', s.color);
    var eraId = s.eraId || 'victorian';
    if (document.documentElement.getAttribute('data-era') !== eraId) document.documentElement.setAttribute('data-era', eraId);
  };

  PEUI.buildNav = function () {
    var nav = document.getElementById('nav'); if (!nav || nav.children.length) return;
    var inner = h('div', { class: 'nav__inner' });
    var items = [['deals', 'Deals', 'tag'], ['city', 'City', 'city'], ['portfolio', 'Portfolio', 'building'], ['dynasty', 'Dynasty', 'crown'], ['rivals', 'Rivals', 'users']];
    for (var i = 0; i < items.length; i++) {
      var b = h('button', { type: 'button', class: 'nav__btn', 'data-action': 'nav', 'data-screen': items[i][0], id: 'nav-' + items[i][0] });
      b.appendChild(PEUI.icon(items[i][2])); b.appendChild(h('span', { text: items[i][1] }));
      inner.appendChild(b);
    }
    nav.appendChild(inner);
  };
  function dot(id, on, label) {
    var b = document.getElementById(id); if (!b) return;
    var d = b.querySelector('.nav__dot');
    if (on && !d) { d = h('span', { class: 'nav__dot' }, h('span', { class: 'sr-only', text: label })); b.appendChild(d); }
    else if (!on && d) b.removeChild(d);
  }
  PEUI.updateNav = function () {
    var s = PEUI.summary(); if (!s.ok) return;
    dot('nav-portfolio', s.offers > 0, s.offers + ' rival offers waiting');
    dot('nav-deals', !!s.auction, 'Auction in progress');
    var fs = root.PE.Finance.summary();
    dot('nav-portfolio', s.offers > 0 || (fs.ok && fs.covenantWarnings.some(function (w) { return w.kind === 'margin_call'; })), 'Attention needed');
  };

  PEUI.actions.nav = function (btn, d) { if (PEUI.sheet.isOpen()) PEUI.sheet.close(); PEUI.render(d.screen); };
  PEUI.actions['year-menu'] = function (btn) {
    var pop = document.getElementById('year-menu'), open = !pop.classList.contains('is-open');
    pop.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open));
    if (open) { var first = pop.querySelector('button'); if (first) first.focus(); setTimeout(function () { document.addEventListener('click', closeOnOutside); }, 0); }
  };
  function closeOnOutside(e) { var pop = document.getElementById('year-menu'); if (!pop.contains(e.target)) { pop.classList.remove('is-open'); document.removeEventListener('click', closeOnOutside); var m = document.querySelector('.hud__menu'); if (m) m.setAttribute('aria-expanded', 'false'); } }
  PEUI.closeMenu = function () { var pop = document.getElementById('year-menu'); if (pop) pop.classList.remove('is-open'); document.removeEventListener('click', closeOnOutside); };
  PEUI.actions['save-now'] = function () { PEUI.closeMenu(); var r = PEUI.call(root.PE.Game.save); if (r.ok) PEUI.toast('Saved.', 'success'); };
  PEUI.actions['to-start'] = function () { PEUI.closeMenu(); PEUI.save(); PEUI.leaveGame(); };
  PEUI.actions['open-settings'] = function () { PEUI.closeMenu(); if (PEUI.openSettings) PEUI.openSettings(); };
})(window);
