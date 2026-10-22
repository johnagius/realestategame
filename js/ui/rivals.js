/* PEUI rivals — the leaderboard: rank with movement since last year, family
   colour, net worth, properties, cities, relation and "what they did this year". */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  var snap = { year: null, ranks: {}, prev: {} };
  function PE() { return root.PE; }

  function rows() {
    var lb = PE().Rivals.leaderboard(), s = PEUI.summary(); if (!lb.ok) return [];
    if (snap.year !== s.year) { snap.prev = snap.year === s.year - 1 ? snap.ranks : {}; snap.ranks = {}; snap.year = s.year; for (var i = 0; i < lb.leaderboard.length; i++) snap.ranks[lb.leaderboard[i].id] = lb.leaderboard[i].rank; }
    return lb.leaderboard;
  }
  function row(r) {
    var prev = snap.prev[r.id], move = prev ? prev - r.rank : 0;
    var c = h('div', { class: 'card rival' + (r.isPlayer ? ' rival--player' : ''), 'aria-label': r.name + ', rank ' + r.rank });
    c.appendChild(h('div', {}, [h('div', { class: 'rival__rank', text: '#' + r.rank }), h('div', { class: 'rival__move ' + (move > 0 ? 'pos' : move < 0 ? 'neg' : 'muted') }, [icon(move > 0 ? 'arrow-up' : move < 0 ? 'arrow-down' : 'arrow-flat', 'ic--sm', move > 0 ? 'Up ' + move : move < 0 ? 'Down ' + (-move) : 'No change'), move ? String(Math.abs(move)) : ''])]));
    c.appendChild(PEUI.crest(r.isPlayer ? { id: PE().S().familyId, name: r.name, color: r.color } : { id: r.id, name: r.name, color: r.color }, { size: 40 }));
    var name = h('div', { class: 'rival__name' }, [r.name]);
    if (r.isPlayer) name.appendChild(PEUI.badge('You', 'gold'));
    if (r.bankrupt) name.appendChild(PEUI.badge('Bankrupt', 'danger'));
    c.appendChild(h('div', { class: 'grow' }, [name, h('div', { class: 'rival__sub', text: (r.archetype ? r.archetype + ' · ' : '') + r.properties + ' building' + (r.properties === 1 ? '' : 's') + ' · ' + r.cities + ' cit' + (r.cities === 1 ? 'y' : 'ies') + (r.relation !== undefined ? ' · relation ' + r.relation : '') })]));
    c.appendChild(h('div', { class: 'rival__nw', text: fmt.money(r.netWorth) }));
    c.appendChild(h('div', { class: 'rival__action', text: '“' + r.lastAction + '”' }));
    return c;
  }
  PEUI.register('rivals', {
    mount: function (el) {
      PEUI.empty(el);
      var sc = h('div', { class: 'screen__scroll', tabindex: '0' }), inner = h('div', { class: 'screen__inner' });
      inner.appendChild(h('div', { class: 'section-head span' }, [h('h2', { text: 'The families' }), h('span', { class: 'small muted', id: 'rv-sub' })]));
      inner.appendChild(h('div', { class: 'list span', id: 'rv-list' }));
      inner.appendChild(h('p', { class: 'small muted span', text: 'Rivals appraise the same board, bid in auctions, make offers on your buildings and suffer the same cycles. A bankrupt family is absorbed by the strongest.' }));
      sc.appendChild(inner); el.appendChild(sc);
      this.update(el);
    },
    update: function (el) {
      var rs = rows(), s = PEUI.summary();
      PEUI.setText(el.querySelector('#rv-sub'), s.year + ' · you are #' + s.rank);
      PEUI.patchList(el.querySelector('#rv-list'), rs, function (r) { return r.id; }, function (r) { return [r.rank, r.netWorth, r.properties, r.cities, r.lastAction, r.bankrupt, r.relation, snap.prev[r.id]].join('|'); }, row);
    }
  });
})(window);
