/* PEUI extras — Phase 5 retention surfaces, all bottom sheets so they work
   from the title screen and inside a game:
   - openPerks():        prestige store (legacy points; passive perks + mode selection)
   - openChallenge():    weekly seeded challenge lobby (this week, live run, past weeks)
   - openScenarios():    era-start crisis scenario select
   - openAchievements(): trophy room (earned state lives in the save) */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  function PE() { return root.PE; }
  function stat(label, value) { return h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: label }), h('span', { class: 'stat__value num', text: value })]); }
  function beginRun(r) {
    PEUI.prefs.gameStartedAt = Date.now(); PEUI.prefs.lastAdYear = -99; PEUI.savePrefs();
    PEUI.save();
    PEUI.sheet.close();
    PEUI.sound('fanfare');
    PEUI.enterGame();
    PEUI.toast(r.message, 'success');
  }

  /* ---------- Prestige store ---------- */
  function perkCard(p) {
    var card = h('div', { class: 'card stack stack--2' });
    var head = h('div', { class: 'row row--between' });
    head.appendChild(h('div', { class: 'card__title', text: p.name }));
    if (p.owned) head.appendChild(PEUI.badge('Owned', p.active ? 'success' : 'neutral'));
    else head.appendChild(PEUI.chip(fmt.int(p.cost) + (p.cost === 1 ? ' point' : ' points'), null, 'coin'));
    card.appendChild(head);
    card.appendChild(h('p', { class: 'small muted', text: p.desc }));
    if (!p.owned) {
      card.appendChild(PEUI.btn('Buy', { cls: 'btn--gold btn--sm', icon: 'coin', action: 'perk-buy', 'data-id': p.id, disabled: !p.affordable, ariaLabel: 'Buy ' + p.name + ' for ' + p.cost + ' prestige points' }));
    } else if (p.kind === 'passive') {
      card.appendChild(PEUI.chip('Active in every dynasty', 'success', 'check'));
    } else {
      var row = h('div', { class: 'row row--between' });
      row.appendChild(h('button', { type: 'button', class: 'toggle', 'data-action': 'perk-mode', 'data-id': p.id, 'aria-pressed': String(p.selected), 'aria-label': 'Include ' + p.name + ' in your next dynasty' },
        [h('span', {}, [icon('flag'), ' On for your next dynasty']), h('span', { class: 'toggle__knob' })]));
      if (p.active) row.appendChild(PEUI.chip('Active now', 'success', 'check'));
      card.appendChild(row);
    }
    return card;
  }
  PEUI.openPerks = function () {
    var pay = PEUI.call(PE().Game.perks); if (!pay.ok) return;
    var sc = 0, old = PEUI.sheet.body(); if (PEUI.sheet.id() === 'perks' && old) sc = old.scrollTop;
    var passive = pay.perks.filter(function (p) { return p.kind === 'passive'; });
    var modes = pay.perks.filter(function (p) { return p.kind === 'mode'; });
    var body = [];
    body.push(h('div', { class: 'card stack stack--2' }, [
      h('div', { class: 'row row--between' }, [h('span', { class: 'stat__label' }, [icon('sparkle'), ' Prestige points']), h('strong', { class: 'stat__value num', text: fmt.int(pay.legacyPoints) })]),
      h('p', { class: 'small muted', text: 'A dynasty’s legacy is worth one point per 500 legacy score when it is recorded — at least one point for a run of ten years. Spend them below.' })
    ]));
    body.push(h('div', { class: 'kicker' }, 'Always on'));
    body.push(h('p', { class: 'small muted', text: 'Passive perks apply to every dynasty you start, once owned.' }));
    for (var i = 0; i < passive.length; i++) body.push(perkCard(passive[i]));
    body.push(h('div', { class: 'kicker' }, 'Ways to play'));
    body.push(h('p', { class: 'small muted', text: 'Mode perks bend the rules of one dynasty at a time. Buy one, then switch it on for your next run — combine them if you dare.' }));
    for (var m = 0; m < modes.length; m++) body.push(perkCard(modes[m]));
    PEUI.sheet.open({ id: 'perks', title: 'Prestige', sub: 'Permanent advantages bought with legacy', body: body });
    var nb = PEUI.sheet.body(); if (nb && sc) nb.scrollTop = sc;
  };
  PEUI.actions['open-perks'] = function () { PEUI.closeMenu(); PEUI.openPerks(); };
  PEUI.actions['perk-buy'] = function (b, d) {
    var r = PEUI.call(PE().Game.buyPerk, d.id); if (!r.ok) return;
    PEUI.sound('purchase'); PEUI.confetti(24); PEUI.toast(r.message, 'success');
    PEUI.openPerks();
  };
  PEUI.actions['perk-mode'] = function (b, d) {
    var cur = PEUI.call(PE().Game.perks); if (!cur.ok) return;
    var sel = cur.perks.filter(function (p) { return p.selected; }).map(function (p) { return p.id; });
    var i = sel.indexOf(d.id);
    if (i >= 0) sel.splice(i, 1); else sel.push(d.id);
    var r = PEUI.call(PE().Game.setModes, sel); if (!r.ok) return;
    PEUI.sound('decision');
    PEUI.openPerks();
  };

  /* ---------- Weekly challenge lobby ---------- */
  PEUI.openChallenge = function () {
    var info = PEUI.call(PE().Game.challengeInfo); if (!info.ok) return;
    var chen = PE().Data.familyById('chen');
    var body = [];
    body.push(h('div', { class: 'card stack' }, [
      h('div', { class: 'row' }, [
        PEUI.crest({ id: 'chen', name: 'House of Chen', color: chen.color, motto: chen.motto }, { size: 44, motto: true }),
        h('div', { class: 'grow' }, [
          h('div', { class: 'card__title', text: 'House of Chen' }),
          h('div', { class: 'card__sub', text: 'Same seed, family and board for everyone this week' })
        ])
      ]),
      h('div', { class: 'stat-grid stat-grid--3' }, [
        stat('Sprint', info.startYear + '–' + info.endYear),
        stat('Best', info.best ? fmt.int(info.best) : '—'),
        stat('Runs', fmt.int(info.runs))
      ]),
      h('p', { class: 'small muted', text: 'Thirty years from ' + info.startYear + ' on a fixed seed. The score counts growth, reputation, achievements and generations — the only difference is how you play it.' })
    ]));
    if (info.current) {
      body.push(h('div', { class: 'note note--info' }, [icon('flag'), h('span', {}, [
        'Your run is live: year ', h('strong', { class: 'num', text: info.current.year }), ' of ' + (info.endYear - info.startYear + 1) + ' (',
        h('strong', { class: 'num', text: info.current.yearsLeft }), ' to go), score ', h('strong', { class: 'num', text: fmt.int(info.current.score) }), '.'
      ])]));
    }
    var weeks = Object.keys(info.history).sort().reverse().slice(0, 8);
    body.push(h('div', { class: 'kicker' }, 'Past weeks'));
    if (weeks.length) {
      var list = h('div', { class: 'list' });
      for (var i = 0; i < weeks.length; i++) {
        var w = weeks[i], c = info.history[w];
        list.appendChild(h('div', { class: 'list-row' }, [
          h('div', { class: 'list-row__main' }, [
            h('div', { class: 'list-row__title num', text: w }),
            h('div', { class: 'list-row__sub', text: fmt.int(c.runs) + (c.runs === 1 ? ' run' : ' runs') + (c.lastYear ? ' · last seen in ' + c.lastYear : '') })
          ]),
          h('div', { class: 'row' }, [c.best ? icon('trophy', 'ic--sm') : null, h('span', { class: 'num', text: c.best ? fmt.int(c.best) : '—' })])
        ]));
      }
      body.push(list);
    } else {
      body.push(h('div', { class: 'empty' }, [icon('calendar'), h('p', { text: 'No weeks on record yet. Every Monday the board deals a fresh hand.' })]));
    }
    var foot;
    if (info.current) {
      foot = h('div', { class: 'btn-row' }, [
        PEUI.btn('Restart', { cls: 'btn--ghost', action: 'challenge-play' }),
        PEUI.btn('Continue the run', { cls: 'btn--primary', icon: 'flag', action: 'challenge-continue' })
      ]);
    } else {
      foot = h('div', { class: 'btn-row' }, [PEUI.btn('Play this week’s challenge', { cls: 'btn--primary', icon: 'flag', action: 'challenge-play' })]);
    }
    PEUI.sheet.open({ id: 'challenge', title: 'Weekly challenge', sub: 'Week ' + info.week + ' · seed ' + info.seed, body: body, foot: foot });
  };
  PEUI.actions['open-challenge'] = function () { PEUI.openChallenge(); };
  PEUI.actions['challenge-play'] = function () {
    var r = PEUI.call(PE().Game.newChallenge); if (!r.ok) return;
    beginRun(r);
  };
  PEUI.actions['challenge-continue'] = function () { PEUI.sheet.close(); PEUI.enterGame(); };

  /* ---------- Era-start scenarios ---------- */
  PEUI.openScenarios = function () {
    var r = PEUI.call(PE().Game.scenarios); if (!r.ok) return;
    var body = [h('div', { class: 'note note--warn' }, [icon('warning'), h('span', { text: 'Skip the slow start: inherit a leveraged portfolio on the very eve of a crash, then hold on. Everyone starts equal; the market does not care.' })])];
    for (var i = 0; i < r.scenarios.length; i++) {
      (function (sc) {
        var card = h('div', { class: 'card stack' });
        card.appendChild(h('div', { class: 'card__head' }, [
          h('div', { class: 'card__title', text: sc.name }),
          PEUI.chip(String(sc.startYear), null, 'calendar')
        ]));
        card.appendChild(h('p', { class: 'small muted', text: sc.intro }));
        card.appendChild(h('div', { class: 'chips' }, [
          PEUI.chip('Starts with ' + sc.props + ' buildings', null, 'building'),
          PEUI.chip(Math.round(sc.ltv * 100) + '% leverage', null, 'bank'),
          PEUI.chip(sc.years + '-year test', null, 'calendar')
        ]));
        card.appendChild(h('div', { class: 'note note--success' }, [icon('trophy'), h('span', { text: 'Win: hold net worth at or above your starting line for ' + sc.years + ' years.' })]));
        card.appendChild(PEUI.btn('Begin here', { cls: 'btn--primary btn--block', action: 'scen-start', 'data-id': sc.id }));
        body.push(card);
      })(r.scenarios[i]);
    }
    PEUI.sheet.open({ id: 'scenarios', title: 'Begin in a crisis', sub: 'Era-start scenarios', body: body });
  };
  PEUI.actions['open-scenarios'] = function () { PEUI.openScenarios(); };
  PEUI.actions['scen-start'] = function (b, d) {
    var seed = Math.floor(Math.random() * 1e9);
    var r = PEUI.call(PE().Game.newGame, { familyId: 'chen', seed: seed, scenario: d.id });
    if (!r.ok) return;
    beginRun(r);
  };

  /* ---------- Trophy room ---------- */
  var ACH_CATS = [['deals', 'Deals', 'gavel'], ['finance', 'Finance', 'bank'], ['survival', 'Survival', 'refresh'], ['dynasty', 'Dynasty', 'crown'], ['cities', 'Cities', 'city'], ['rivals', 'Rivals', 'users']];
  PEUI.openAchievements = function () {
    var G = PE().Game;
    if (!G.state()) { var hs = G.hasSave(); if (hs.ok && hs.hasSave) { var l = PEUI.call(G.load); if (!l.ok) return; } }
    var list = null;
    if (G.state()) { var cur = PE().Goals.current(); if (cur.ok) list = cur.achievements; }
    if (!list) list = PE().Data.achievements.map(function (a) { return { id: a.id, name: a.name, desc: a.desc, category: a.category, rare: !!a.rare, earned: false }; });
    var total = list.length, earned = list.filter(function (a) { return a.earned; }).length;
    var body = [];
    body.push(h('div', { class: 'card stack stack--2' }, [
      h('div', { class: 'row row--between' }, [h('span', { class: 'stat__label' }, [icon('trophy'), ' Trophies']), h('strong', { class: 'stat__value num', text: earned + ' / ' + total })]),
      PEUI.bar(total ? earned / total : 0, 'gold', null, 'Trophies earned'),
      h('p', { class: 'small muted', text: earned === 0 ? 'The cabinet is polished and the shelves are bare. Go make some history.' : 'Trophies shine in gold; the rare ones are the stuff of legend.' })
    ]));
    for (var c = 0; c < ACH_CATS.length; c++) {
      (function (cat) {
        var items = list.filter(function (a) { return a.category === cat[0]; });
        if (!items.length) return;
        var got = items.filter(function (a) { return a.earned; }).length;
        body.push(h('div', { class: 'kicker kicker--row' }, [icon(cat[2]), cat[1] + ' · ' + got + ' / ' + items.length]));
        var grid = h('div', { class: 'achgrid' });
        for (var i = 0; i < items.length; i++) {
          (function (a) {
            var tile = h('div', { class: 'ach' + (a.earned ? ' ach--earned' : ' ach--locked') });
            tile.appendChild(icon(a.earned ? 'trophy' : 'lock'));
            tile.appendChild(h('div', { class: 'ach__name', text: a.name }));
            tile.appendChild(h('div', { class: 'ach__desc', text: a.desc }));
            if (a.rare) tile.appendChild(PEUI.badge('Rare', 'gold'));
            grid.appendChild(tile);
          })(items[i]);
        }
        body.push(grid);
      })(ACH_CATS[c]);
    }
    body.push(h('p', { class: 'small muted', text: 'Earned trophies are recorded in your save; each dynasty polishes the cabinet afresh.' }));
    PEUI.sheet.open({ id: 'achievements', title: 'Trophy room', body: body });
  };
  PEUI.actions['open-achievements'] = function () { PEUI.openAchievements(); };
})(window);
