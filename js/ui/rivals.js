/* PEUI rivals — the leaderboard as a cast of characters: rank with movement,
   crests, relation meters, voiced lines, and a rival sheet (holdings, relation
   history, taunts) so no rival is only a number (bible §5, P3.1). */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  var snap = { year: null, ranks: {}, prev: {} };
  function PE() { return root.PE; }

  var WHY = {
    'refused marriage': 'refused our marriage proposal', 'marriage': 'a marriage joined the houses',
    'evictions': 'evictions in their streets', 'relationOutbid': 'we outbid them at auction',
    'accepted offer': 'we accepted their offer', 'declined offer': 'we declined their offer'
  };
  function whyText(why) { return WHY[why] || (why ? why.replace(/_/g, ' ') : 'an incident'); }

  function relationTier(relScore, allied) {
    if (allied) return { label: 'Allied', kind: 'gold' };
    if (relScore <= -40) return { label: 'Hostile', kind: 'danger' };
    if (relScore <= -15) return { label: 'Tense', kind: 'warn' };
    if (relScore < 25) return { label: 'Neutral', kind: 'info' };
    if (relScore < 55) return { label: 'Warm', kind: 'success' };
    return { label: 'Friendly', kind: 'success' };
  }
  /* Relation meter on the raw −100..100 scale; marks at −20 and +30. */
  function relationMeter(relScore, allied) {
    var tier = relationTier(relScore, allied);
    var frac = (relScore + 100) / 200;
    var bar = h('div', { class: 'relbar', role: 'progressbar', 'aria-label': 'Relation ' + relScore, 'aria-valuemin': -100, 'aria-valuemax': 100, 'aria-valuenow': relScore });
    bar.appendChild(h('div', { class: 'relbar__zero' }));
    bar.appendChild(h('div', { class: 'relbar__mark relbar__mark--ally', title: 'Alliance holds above 30' }));
    var fill = h('div', { class: 'relbar__fill relbar__fill--' + tier.kind, style: (relScore >= 0 ? 'left:50%;width:' + ((frac - 0.5) * 100).toFixed(1) + '%' : 'left:' + (frac * 100).toFixed(1) + '%;width:' + ((0.5 - frac) * 100).toFixed(1) + '%') });
    bar.appendChild(fill);
    return h('div', { class: 'relwrap' }, [bar, h('span', { class: 'relwrap__label text--' + tier.kind, text: tier.label + ' · ' + relScore })]);
  }

  function rows() {
    var lb = PE().Rivals.leaderboard(), s = PEUI.summary(); if (!lb.ok) return [];
    if (snap.year !== s.year) { snap.prev = snap.year === s.year - 1 ? snap.ranks : {}; snap.ranks = {}; snap.year = s.year; for (var i = 0; i < lb.leaderboard.length; i++) snap.ranks[lb.leaderboard[i].id] = lb.leaderboard[i].rank; }
    return lb.leaderboard;
  }
  function row(r) {
    var prev = snap.prev[r.id], move = prev ? prev - r.rank : 0;
    var c = h('div', { class: 'card rival' + (r.isPlayer ? ' rival--player' : ''), 'data-action': r.isPlayer ? null : 'open-rival', 'data-id': r.id, role: r.isPlayer ? null : 'button', tabindex: r.isPlayer ? null : '0', 'aria-label': r.name + ', rank ' + r.rank + (r.isPlayer ? '' : ', tap for details') });
    c.appendChild(h('div', {}, [h('div', { class: 'rival__rank', text: '#' + r.rank }), h('div', { class: 'rival__move ' + (move > 0 ? 'pos' : move < 0 ? 'neg' : 'muted') }, [icon(move > 0 ? 'arrow-up' : move < 0 ? 'arrow-down' : 'arrow-flat', 'ic--sm', move > 0 ? 'Up ' + move : move < 0 ? 'Down ' + (-move) : 'No change'), move ? String(Math.abs(move)) : ''])]));
    c.appendChild(PEUI.crest(r.isPlayer ? { id: PE().S().familyId, name: r.name, color: r.color } : { id: r.id, name: r.name, color: r.color }, { size: 40 }));
    var name = h('div', { class: 'rival__name' }, [r.name]);
    if (r.isPlayer) name.appendChild(PEUI.badge('You', 'gold'));
    if (r.allied) name.appendChild(PEUI.badge('Allied', 'gold'));
    if (r.bankrupt) name.appendChild(PEUI.badge('Bankrupt', 'danger'));
    var sub = h('div', { class: 'rival__sub', text: (r.archetype ? r.archetype + ' · ' : '') + r.properties + ' building' + (r.properties === 1 ? '' : 's') + ' · ' + r.cities + ' cit' + (r.cities === 1 ? 'y' : 'ies') });
    var mid = h('div', { class: 'grow' }, [name, sub]);
    if (!r.isPlayer && !r.bankrupt) mid.appendChild(relationMeter(r.relationScore || 0, r.allied));
    c.appendChild(mid);
    c.appendChild(h('div', { class: 'rival__nw', text: fmt.money(r.netWorth) }));
    if (r.lastAction) c.appendChild(h('div', { class: 'rival__action', text: '“' + r.lastAction + '”' }));
    return c;
  }
  PEUI.register('rivals', {
    mount: function (el) {
      PEUI.empty(el);
      var sc = h('div', { class: 'screen__scroll', tabindex: '0' }), inner = h('div', { class: 'screen__inner' });
      inner.appendChild(h('div', { class: 'section-head span' }, [h('h2', { text: 'The families' }), h('span', { class: 'small muted', id: 'rv-sub' })]));
      inner.appendChild(h('div', { class: 'list span', id: 'rv-list' }));
      inner.appendChild(h('p', { class: 'small muted span', text: 'Rivals appraise the same board, bid in auctions, make offers on your buildings and suffer the same cycles. Tap a family to see what they hold and how they feel about you. A bankrupt family is absorbed by the strongest.' }));
      sc.appendChild(inner); el.appendChild(sc);
      this.update(el);
    },
    update: function (el) {
      var rs = rows(), s = PEUI.summary();
      PEUI.setText(el.querySelector('#rv-sub'), s.year + ' · you are #' + s.rank);
      PEUI.patchList(el.querySelector('#rv-list'), rs, function (r) { return r.id; }, function (r) { return [r.rank, r.netWorth, r.properties, r.cities, r.lastAction, r.bankrupt, r.relationScore, r.allied, snap.prev[r.id]].join('|'); }, row);
    }
  });

  /* ---------- Rival sheet ---------- */
  PEUI.actions['open-rival'] = function (b, d) {
    var lb = PE().Rivals.leaderboard(); if (!lb.ok) return;
    var r = null; for (var i = 0; i < lb.leaderboard.length; i++) if (lb.leaderboard[i].id === d.id) r = lb.leaderboard[i];
    if (!r) return;
    var def = PE().Data.rivalById(r.id);
    var body = [];
    body.push(h('div', { class: 'rival-hero' }, [
      PEUI.crest({ id: r.id, name: r.name, color: r.color }, { size: 76, motto: true }),
      h('div', { class: 'rival-hero__meta' }, [
        h('div', { class: 'rival__name rival-hero__name', text: r.name }),
        h('div', { class: 'small muted', text: def.archetype + ' · ' + (def.prefers === 'any' ? 'plays every market' : 'wants ' + def.prefers + ' buildings') + (r.bankrupt ? ' · bankrupt' : '') }),
        r.lastAction ? h('div', { class: 'rival-hero__quote', text: '“' + r.lastAction + '”' }) : null
      ])
    ]));
    body.push(h('div', { class: 'stat-grid stat-grid--3' }, [
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: 'Net worth' }), h('span', { class: 'stat__value num', text: fmt.money(r.netWorth) })]),
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: 'Buildings' }), h('span', { class: 'stat__value num', text: String(r.properties) })]),
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: 'Cities' }), h('span', { class: 'stat__value num', text: String(r.cities) })])
    ]));
    if (!r.bankrupt) {
      body.push(h('div', { class: 'kicker', text: 'Relation' }));
      body.push(relationMeter(r.relationScore || 0, r.allied));
      body.push(h('p', { class: 'small muted', text: r.allied ? 'Marriage alliance: they never contest your deals and reveal one true value a year in their city.' : 'Marriage needs relation 0+ and reputation 50+. Outbidding them at auction costs relation; accepting their offers builds it.' }));
      if (r.relationLog && r.relationLog.length) {
        var ul = h('ul', { class: 'lines' });
        for (var k = r.relationLog.length - 1; k >= 0; k--) {
          var e = r.relationLog[k];
          ul.appendChild(h('li', {}, [icon(e.delta > 0 ? 'arrow-up' : 'arrow-down'), h('span', { text: e.year + ' · ' + (e.delta > 0 ? '+' : '') + e.delta + ' — ' + whyText(e.why) })]));
        }
        body.push(ul);
      }
    }
    if (r.holdings && r.holdings.length) {
      body.push(h('div', { class: 'kicker', text: 'What they hold' }));
      var list = h('div', { class: 'stack' });
      for (var j = 0; j < r.holdings.length; j++) {
        var p = r.holdings[j];
        var kids = [h('span', { class: 'grow', text: p.name + ' · ' + p.district + ', ' + PEUI.cityName(p.cityId) }), h('span', { class: 'num', text: fmt.money(p.value) }), p.listed ? PEUI.badge('For sale', 'gold') : (p.conditionLabel ? PEUI.chip(p.conditionLabel, PEUI.conditionKind(60)) : null)];
        list.appendChild(p.listed ? h('button', { type: 'button', class: 'holding holding--tap', 'data-action': 'open-listing', 'data-id': p.id }, kids) : h('div', { class: 'holding' }, kids));
      }
      body.push(list);
      body.push(h('p', { class: 'small muted', text: '“For sale” lots are on the deal board — make an offer before someone else does.' }));
    } else if (!r.bankrupt) {
      body.push(h('p', { class: 'small muted', text: 'They hold no buildings yet. Their money is in cash, waiting.' }));
    }
    PEUI.sheet.open({ id: 'rival', title: r.name.replace('The ', ''), body: body });
  };
})(window);
