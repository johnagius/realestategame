/* PEUI year flow — End year → pending event cards (Events.pending/resolve)
   → era / succession title cards → full-screen year report → Continue.
   Skip quiet years shows a stacked summary. Bankruptcy and 2030 end screens
   with legacy and a net-worth sparkline. Interstitials only here, capped. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  function PE() { return root.PE; }
  var AD = { firstMinutes: 15, everyYears: 6, everyMinutes: 4 };

  /* ---------- Event card ---------- */
  function showEvent(done) {
    var r = PE().Events.pending(); if (!r.ok || !r.event) { if (done) done(); return false; }
    var ev = r.event, body = h('div', { class: 'event-card' });
    body.appendChild(PEUI.badge(ev.kind === 'historical' ? ev.year + ' · history' : 'Event · ' + ev.year, ev.kind === 'historical' ? 'gold' : 'info'));
    body.appendChild(h('p', { class: 'event-card__text', text: ev.text }));
    body.appendChild(h('div', { class: 'kicker', text: 'Your decision' }));
    for (var i = 0; i < ev.choices.length; i++) body.appendChild(h('button', { type: 'button', class: 'choice', 'data-action': 'event-choose', 'data-uid': ev.uid, 'data-i': ev.choices[i].index }, [h('span', { class: 'choice__n', text: String(i + 1) }), h('span', { text: ev.choices[i].label })]));
    if (r.remaining > 1) body.appendChild(h('p', { class: 'small muted', text: (r.remaining - 1) + ' more decision' + (r.remaining > 2 ? 's' : '') + ' waiting.' }));
    PEUI.sound('decision');
    PEUI.sheet.open({ id: 'event', title: ev.title, sub: 'A decision is needed before the year can end', body: body });
    pendingDone = done || null;
    return true;
  }
  var pendingDone = null;
  PEUI.actions['event-choose'] = function (b, d) {
    var r = PEUI.call(PE().Events.resolve, d.uid, +d.i); if (!r.ok) return;
    PEUI.save(); PEUI.sound('decision'); PEUI.toast(r.message, 'success');
    var done = pendingDone; pendingDone = null;
    PEUI.sheet.close();
    PEUI.refresh();
    if (r.remaining > 0) showEvent(done); else if (done) done();
  };
  PEUI.showPendingEvent = function (done) { return showEvent(done); };

  /* ---------- End year ---------- */
  PEUI.actions['end-year'] = function () {
    if (PEUI.sheet.isOpen()) PEUI.sheet.close();
    PEUI.closeMenu();
    endYear();
  };
  /* Leaderboard snapshot before the year resolves, so the report can name who you passed or lost to. */
  function ranksNow() { var lb = PE().Rivals.leaderboard(), out = {}; if (lb.ok) for (var i = 0; i < lb.leaderboard.length; i++) out[lb.leaderboard[i].id] = { rank: lb.leaderboard[i].rank, name: lb.leaderboard[i].name }; return out; }
  function rankMoves(before) {
    var lb = PE().Rivals.leaderboard(), out = { passed: [], lostTo: [] }; if (!lb.ok) return out;
    var rows = lb.leaderboard, me = null; for (var i = 0; i < rows.length; i++) if (rows[i].isPlayer) me = rows[i];
    if (!me) return out;
    // the engine's own end-of-year snapshot (prevRank) when it carries one, else the UI snapshot taken before endYear
    var fromEngine = !!me.prevRank, was = fromEngine ? me.prevRank : (before.player ? before.player.rank : me.rank), now = me.rank;
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j]; if (r.isPlayer) continue;
      var b = fromEngine ? r.prevRank : (before[r.id] ? before[r.id].rank : null); if (!b) continue;
      if (b < was && r.rank > now) out.passed.push(r.name); if (b > was && r.rank < now) out.lostTo.push(r.name);
    }
    return out;
  }
  function endYear() {
    var s = PE().Game.state(); if (!s) return;
    if (s.status === 'bankrupt') { showEnd(); return; }
    if (s.status === 'ended') { showEnd(); return; }
    var before = ranksNow();
    var r = PE().Game.endYear();
    if (!r.ok) {
      if (r.needsDecision) { showEvent(function () { endYear(); }); return; }
      if (r.bankrupt || r.ended) { showEnd(); return; }
      PEUI.toast(r.message, 'danger'); return;
    }
    r.rankMoves = rankMoves(before);
    PEUI.save();
    if (root.AdManager && root.AdManager.countMonth) root.AdManager.countMonth();
    if (r.eraChanged) PEUI.sound('eraChange'); else if (r.equityChange > 0) PEUI.sound('coin'); else PEUI.sound('negative');
    presentReport(r, function () { afterReport(r); });
  }
  function afterReport(r) {
    PEUI.refresh();
    if (r.bankrupt || r.ended) { showEnd(); return; }
    maybeAd();
    showEvent(function () { PEUI.refresh(); });
    if (PEUI.current !== 'deals') PEUI.render('deals'); else PEUI.refresh();
  }

  /* ---------- Count-up for money figures (skipped under reduced motion) ---------- */
  function reducedMotion() { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function countUp(el, value, format) {
    el.classList.add('count');
    if (reducedMotion() || !isFinite(value) || Math.abs(value) < 10) { el.textContent = format(value); return; }
    var start = null, dur = 900, from = 0;
    el.textContent = format(0);
    function step(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = format(Math.round(from + (value - from) * e));
      if (k < 1) requestAnimationFrame(step); else el.classList.add('count--done');
    }
    requestAnimationFrame(step);
  }

  /* ---------- Headline illustration: one of six scenes chosen by the dominant event ---------- */
  function sceneKind(r) {
    var s = PE().Game.state();
    if (r.bankrupt || r.warnings.length) return 'warning';
    if (r.succession) return 'succession';
    if (r.eraChanged) return 'era';
    var pct = r.netWorthBefore > 0 ? r.equityChange / r.netWorthBefore : 0;
    if (r.cycle === 'depression' || pct <= -0.1 || r.deals.some(function (d) { return d.kind === 'forced_sale'; })) return 'crash';
    var bought = false; if (s) for (var id in s.properties) { var p = s.properties[id]; if (p.ownerId === 'player' && p.purchaseYear === r.year && p.purchasePrice) { bought = true; break; } }
    if (bought || r.deals.some(function (d) { return d.kind === 'sale'; }) || r.goals.achieved.length) return 'deal';
    return 'quiet';
  }
  var SCENE_LABEL = { deal: 'A deal done: keys change hands', crash: 'A crash: the market falls', succession: 'A succession: the next generation', era: 'A new era: the skyline changes', warning: 'A warning from the bank', quiet: 'A quiet year in the city' };
  function scene(kind) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'scene scene--' + kind); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', SCENE_LABEL[kind]); svg.setAttribute('viewBox', '0 0 240 120');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', 'assets/report/' + kind + '.svg#scene'); use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'assets/report/' + kind + '.svg#scene');
    svg.appendChild(use); return svg;
  }
  function presentReport(r, done) {
    var steps = [];
    if (r.eraChanged) steps.push(function (next) { var ne = PE().Data.eraFor(r.year + 1); titleCard('A new era', ne.name, 'Year ' + (r.year + 1) + '. New property types, finance tools and a new skyline.', next, ne.id); });
    if (r.succession) { var sc = r.dynasty.filter(function (d) { return d.kind === 'succession'; })[0]; steps.push(function (next) { ceremony(sc, next); }); }
    steps.push(function (next) { showReport(r, next); });
    (function run(i) { if (i >= steps.length) { done(); return; } steps[i](function () { run(i + 1); }); })(0);
  }

  /* ---------- Title card ---------- */
  function titleCard(kicker, title, sub, next, plateEra) {
    var el = document.getElementById('titlecard'); PEUI.empty(el);
    var kids = [];
    if (plateEra) { var img = document.createElement('img'); img.src = 'assets/era/' + plateEra + '.svg'; img.className = 'titlecard__plate'; img.alt = title + ' era engraving'; kids.push(img); }
    kids.push(h('div', { class: 'titlecard__k', text: kicker }), h('h1', { class: 'titlecard__t', text: title }), h('p', { class: 'titlecard__s', text: sub }));
    var inner = h('div', { class: 'titlecard__inner' }, kids);
    var btn = PEUI.btn('Continue', { cls: 'btn--gold btn--lg', icon: 'skip', action: 'titlecard-next' });
    inner.appendChild(btn); el.appendChild(inner);
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    PEUI.confetti(80);
    titleNext = function () {
      el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); titleNext = null;
      /* Shift the 3D city into the new era now, not on the next city-tab visit. */
      if (PEUI.cityEraNow) { var s = PEUI.summary(); if (s.ok && s.eraId) PEUI.cityEraNow(s.eraId); }
      next();
    };
    btn.focus();
  }
  /* ---------- Succession ceremony (P3.3): ink tree, wax-seal reveal, estate-tax breakdown ---------- */
  function ceremony(sc, next) {
    var el = document.getElementById('titlecard'); PEUI.empty(el);
    var b = (sc && sc.breakdown) || {};
    var inner = h('div', { class: 'titlecard__inner ceremony' });
    inner.appendChild(h('div', { class: 'titlecard__k', text: 'The next generation' }));
    /* ink tree: the old head struck through, the line of succession drawn to the heir */
    var NS = 'http://www.w3.org/2000/svg';
    var tree = document.createElementNS(NS, 'svg');
    tree.setAttribute('viewBox', '0 0 260 74'); tree.setAttribute('class', 'ceremony__tree'); tree.setAttribute('aria-hidden', 'true');
    tree.innerHTML = '<path d="M130 6 C 96 22, 78 34, 74 52" class="ink"/><path d="M130 6 C 164 22, 182 34, 186 52" class="ink ink--to-heir"/><circle cx="130" cy="7" r="4" class="inkdot"/><circle cx="74" cy="56" r="4" class="inkdot inkdot--old"/><circle cx="186" cy="56" r="4" class="inkdot inkdot--heir"/><text x="130" y="-2" class="inktext" text-anchor="middle"></text>';
    inner.appendChild(tree);
    inner.appendChild(h('div', { class: 'ceremony__names' }, [
      h('div', { class: 'ceremony__old' }, [h('span', { class: 'ceremony__oldname', text: (b.oldHead || 'The old head') + ', ' + (b.oldAge || '') }), h('span', { class: 'ceremony__strike', 'aria-hidden': 'true' })]),
      h('div', { class: 'ceremony__arrow', text: 'the house passes to' })
    ]));
    /* wax seal over the heir reveal */
    var seal = h('div', { class: 'waxseal', 'aria-hidden': 'true' }, [h('i', { class: 'waxseal__half waxseal__half--l' }), h('i', { class: 'waxseal__half waxseal__half--r' }), h('span', { class: 'waxseal__initial', text: PEUI.crestLetter(sc ? sc.heir : '?') })]);
    var traitChips = h('div', { class: 'chips chips--center' });
    (b.heirTraits || []).forEach(function (t) { var td = PE().Data.traits[t]; if (td) traitChips.appendChild(PEUI.chip(td.name, td.positive ? 'gold' : 'danger', td.positive ? 'star' : 'warning')); });
    var reveal = h('div', { class: 'ceremony__reveal' }, [
      h('h1', { class: 'titlecard__t', text: sc ? sc.heir : 'The heir' }),
      h('p', { class: 'titlecard__s', text: 'Head of the family · generation ' + (sc ? sc.generation : '') + (b.heirAge ? ' · age ' + b.heirAge : '') + (b.regent ? ' · a cousin, with a regent’s tax' : '') }),
      traitChips
    ]);
    inner.appendChild(h('div', { class: 'sealwrap' }, [seal, reveal]));
    /* estate tax breakdown, gross struck through when planning paid off */
    if (b.tax !== undefined) {
      var dl = h('dl', { class: 'quote ceremony__tax' });
      function trow(k, v, cls, strike) { var dd = h('dd', { class: 'num ' + (cls || ''), text: fmt.money(v) }); if (strike) dd.appendChild(h('s', { class: 'strike', text: '' })); dl.appendChild(h('div', { class: 'quote__row' + (strike ? ' quote__row--struck' : '') }, [h('dt', { text: k }), dd])); }
      var saved = (b.trustSaved || 0) + (b.charitySaved || 0);
      trow('Estate tax at ' + (b.baseRate || 0) + '%', Math.round((b.netWorth || 0) * (b.baseRate || 0) / 100), saved ? 'struck' : '', !!saved);
      if (b.trustSaved) trow('Family trust', -b.trustSaved, 'pos');
      if (b.charitySaved) trow('Charity endowment', -b.charitySaved, 'pos');
      trow('Paid to the Crown', b.tax, 'neg');
      inner.appendChild(dl);
      if (b.trustSaved || b.charitySaved) inner.appendChild(h('p', { class: 'ceremony__planning', text: 'The planners earned their fee: ' + fmt.money(saved) + ' kept in the family.' }));
    }
    var btn = PEUI.btn('Turn the page', { cls: 'btn--gold btn--lg', icon: 'skip', action: 'titlecard-next' });
    inner.appendChild(btn); el.appendChild(inner);
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    titleNext = function () { el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); titleNext = null; next(); };
    btn.focus();
    /* seal breaks after a beat, then the fanfare */
    setTimeout(function () { if (!titleNext) return; seal.classList.add('is-cracked'); PEUI.sound('decision'); }, 900);
    setTimeout(function () { if (!titleNext) return; reveal.classList.add('is-revealed'); PEUI.sound('fanfare'); }, 1400);
  }

  var titleNext = null;
  PEUI.actions['titlecard-next'] = function () { if (titleNext) titleNext(); };

  /* ---------- Year report ---------- */
  function money(v, cls) { return h('td', { class: 'num ' + (cls || ''), text: fmt.money(v) }); }
  function cashFlowTable(cf) {
    var t = h('table', { class: 'table', 'aria-label': 'Cash flow' });
    var tb = h('tbody');
    function tr(k, v, cls) { tb.appendChild(h('tr', {}, [h('td', { text: k }), money(v, cls)])); }
    tr('Rent collected', cf.rent, 'pos'); tr('Operating costs', -cf.costs, 'neg'); tr('Debt service', -cf.debtService, cf.debtService ? 'neg' : ''); tr('Taxes', -cf.taxes, cf.taxes ? 'neg' : '');
    if (cf.interest) tr('Savings interest', cf.interest, 'pos');
    tb.appendChild(h('tr', { class: 'total' }, [h('td', { text: 'Net cash flow' }), money(cf.net, cf.net >= 0 ? 'pos' : 'neg')]));
    t.appendChild(tb); return t;
  }
  function section(title, items, ic, clsFn) {
    if (!items || !items.length) return null;
    var s = h('section', { class: 'card card--flat stack stack--2' }, h('div', { class: 'kicker', text: title }));
    var ul = h('ul', { class: 'lines' });
    for (var i = 0; i < items.length; i++) {
      var txt = typeof items[i] === 'string' ? items[i] : items[i].text;
      var li = h('li', {}, [icon(ic || 'info'), h('span', { text: txt })]);
      var extra = clsFn ? clsFn(txt) : null; if (extra) li.classList.add(extra);
      ul.appendChild(li);
    }
    s.appendChild(ul); return s;
  }
  function reportBody(r) {
    var inner = h('div', { class: 'report__inner' });
    var head = h('div', { class: 'report__head' });
    head.appendChild(scene(sceneKind(r)));
    head.appendChild(h('div', { class: 'report__year', text: String(r.year) }));
    head.appendChild(h('div', { class: 'report__era', text: r.eraName + ' · ' + PE().Data.cycles[r.cycle].name }));
    head.appendChild(h('h1', { class: 'report__headline', text: r.headline }));
    inner.appendChild(head);
    if (PEUI.advisor) { var bub = PEUI.advisor.mount('report'); if (bub) inner.appendChild(bub); }
    var warns = r.warnings.map(function (w) { if (w === 'negative_cash') return 'Cash is negative. Sell or borrow before next year.'; if (w.indexOf('margin_call:') === 0) { var p = PE().Game.state().properties[w.split(':')[1]]; return 'Margin call on ' + (p ? p.name : 'a property') + ': inject cash this year or the bank force-sells it.'; } return w; });
    for (var i = 0; i < warns.length; i++) inner.appendChild(h('div', { class: 'note note--danger', role: 'alert' }, [icon('warning'), h('span', { text: warns[i] })]));
    var eq = h('section', { class: 'card stack' });
    var nwEl = h('span', { class: 'stat__value num' }), eqEl = h('span', { class: 'stat__value num ' + (r.equityChange >= 0 ? 'pos' : 'neg') }), cashEl = h('span', { class: 'stat__value num ' + (r.cashAfter < 0 ? 'neg' : '') });
    eq.appendChild(h('div', { class: 'stat-grid stat-grid--3' }, [
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: 'Net worth' }), nwEl]),
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: 'Equity change' }), eqEl]),
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', text: 'Cash' }), cashEl])
    ]));
    countUp(nwEl, r.netWorthAfter, fmt.money); countUp(eqEl, r.equityChange, fmt.signed); countUp(cashEl, r.cashAfter, fmt.money);
    if (PEUI.guide) { var eqLine = PEUI.guide.equityLine(r); if (eqLine) eq.appendChild(eqLine); }
    var mv = r.rank.before - r.rank.after, rm = r.rankMoves || { passed: [], lostTo: [] };
    var rank = h('div', { class: 'rank-move ' + (mv > 0 ? 'pos' : mv < 0 ? 'neg' : '') }, [h('span', { text: 'Rank #' + r.rank.before }), icon(mv > 0 ? 'arrow-up' : mv < 0 ? 'arrow-down' : 'arrow-flat', null, mv > 0 ? 'up' : mv < 0 ? 'down' : 'unchanged'), h('span', { text: '#' + r.rank.after })]);
    eq.appendChild(rank);
    var who = mv > 0 && rm.passed.length ? 'You passed ' + rm.passed.join(' and ') + '.' : mv < 0 && rm.lostTo.length ? 'You lost ground to ' + rm.lostTo.join(' and ') + '.' : mv ? (mv > 0 ? 'Up ' + mv + ' place' + (mv > 1 ? 's' : '') + '.' : 'Down ' + (-mv) + ' place' + (mv < -1 ? 's' : '') + '.') : 'Rank unchanged.';
    eq.appendChild(h('div', { class: 'rank-move__who small ' + (mv > 0 ? 'pos' : mv < 0 ? 'neg' : 'muted'), text: who }));
    var cft = cashFlowTable(r.cashFlow);
    var cells = cft.querySelectorAll('td.num'); if (cells.length) { countUp(cells[0], r.cashFlow.rent, fmt.money); countUp(cells[cells.length - 1], r.cashFlow.net, fmt.money); }
    eq.appendChild(cft);
    var vc = h('div', { class: 'chips' }); for (var c in r.valuesByCity) vc.appendChild(PEUI.chip(PEUI.cityName(c) + ' ' + (r.valuesByCity[c] >= 0 ? '+' : '') + r.valuesByCity[c] + '%', r.valuesByCity[c] >= 0 ? 'success' : 'danger', r.valuesByCity[c] >= 0 ? 'arrow-up' : 'arrow-down'));
    eq.appendChild(h('div', { class: 'row row--wrap' }, [h('span', { class: 'small muted', text: 'Values:' }), vc]));
    eq.appendChild(h('div', { class: 'small muted', text: 'Next year: ' + PE().Data.cycles[r.cycleAfter].name + ', bank rate ' + (r.baseRateAfter * 100).toFixed(1) + '%' }));
    inner.appendChild(eq);
    var achieved = r.goals.achieved.map(function (g) { return g.desc + (g.reward ? ' (+' + fmt.money(g.reward) + ')' : ''); });
    var ach = section('Goals achieved', achieved, 'check'); if (ach) { ach.classList.add('goal--done'); inner.appendChild(ach); if (achieved.length) PEUI.confetti(30); }
    var prog = r.goals.progress.map(function (g) {
      if (g.kind === 'yearly') return 'Yearly goal missed: ' + g.desc;
      if (g.kind === 'family') return g.failed ? 'Family goal failed: ' + g.desc : g.desc + ' — ' + (g.progress || 'not yet');
      return g.failed ? 'Era goal missed: ' + g.desc : g.desc + ' — ' + (g.progress || 'not yet');
    });
    var ps = section('Goals in progress', prog, 'flag'); if (ps) inner.appendChild(ps);
    var deals = section('Deals', r.deals.map(function (d) { return d.text; }), 'tag'); if (deals) inner.appendChild(deals);
    var dyn = section('The family', r.lines, 'crown', function (t) { return /visitor|short let/i.test(t) ? 'line--visitor' : null; }); if (dyn) inner.appendChild(dyn);
    var evs = section('Events', r.events.map(function (e) { return e.title + (e.kind === 'historical' ? ' (history)' : ''); }), 'warning'); if (evs) inner.appendChild(evs);
    var rvMoves = r.rivalsMoves || [];
    if (rvMoves.length) {
      var rvSec = h('section', { class: 'card card--flat stack stack--2' }, h('div', { class: 'kicker', text: 'The rivals' }));
      var rvUl = h('ul', { class: 'lines' });
      for (var mi = 0; mi < rvMoves.length; mi++) {
        var m = rvMoves[mi], mDef = m.id !== 'player' ? PE().Data.rivalById(m.id) : null;
        rvUl.appendChild(h('li', {}, [mDef ? PEUI.crest({ id: m.id, name: m.name, color: mDef.color }, { size: 22 }) : icon('users'), h('span', { text: m.name + ': ' + m.text })]));
      }
      rvSec.appendChild(rvUl); inner.appendChild(rvSec);
    }
    if (PEUI.appraisal) { var reveals = r.appraisalReveals || (r.appraisalReveals = PEUI.appraisal.sweep(r.year)); var ap = section('Your appraisals', reveals.map(function (x) { return x.text; }), 'percent'); if (ap) inner.appendChild(ap); }
    inner.appendChild(h('p', { class: 'report__cliff', text: r.cliffhanger }));
    return inner;
  }
  function showReport(r, next) {
    var el = document.getElementById('report'); PEUI.empty(el);
    PEUI.shownReport = r; if (!r.preview) PEUI.lastReport = r;
    if (PEUI.advisor && !r.preview) PEUI.advisor.onReport(r);
    var sc = h('div', { class: 'report__scroll', tabindex: '0' }, reportBody(r)); el.appendChild(sc);
    /* The crash (DESIGN-DIRECTION §3.4): depression years print on grey newsprint. */
    if (r.cycle === 'depression' || sceneKind(r) === 'crash') sc.classList.add('report--newsprint');
    var label = r.bankrupt ? 'See what remains' : r.ended ? 'The end of the campaign' : 'Continue to ' + (r.year + 1);
    var foot = h('div', { class: 'report__foot' }), row = h('div', { class: 'btn-row report__foot-row' });
    if (r.eraChanged || r.ended) row.appendChild(PEUI.btn('Share card', { cls: 'btn--secondary btn--lg', icon: 'download', action: 'share-card' }));
    row.appendChild(PEUI.btn(label, { cls: 'btn--primary btn--lg', icon: 'skip', action: 'report-next' }));
    foot.appendChild(row); el.appendChild(foot);
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false'); sc.scrollTop = 0;
    sc.classList.add('is-turning');
    PEUI.sound('page');
    /* Margin calls and forced sales get the alarm, a beat after the page turn. */
    var alarmDue = r.deals.some(function (d) { return d.kind === 'forced_sale'; }) || r.warnings.some(function (w) { return w.indexOf('margin_call:') === 0; });
    if (alarmDue) setTimeout(function () { if (el.classList.contains('is-open')) PEUI.sound('alarm'); }, 350);
    /* Rent payoff: a small staggered burst of money floats on the rent row,
       decoupled from the equity direction (a good rent year in a falling
       market should not sound like failure). */
    if (!r.preview && r.cashFlow && r.cashFlow.rent > 0 && !reducedMotion()) {
      var rentCell = el.querySelector('.table tbody td.num');
      if (rentCell) {
        var floats = 3, per = Math.round(r.cashFlow.rent / floats);
        for (var fi = 0; fi < floats; fi++) {
          (function (k) {
            setTimeout(function () {
              if (!el.classList.contains('is-open')) return;
              PEUI.moneyFloat(rentCell, k === floats - 1 ? r.cashFlow.rent - per * (floats - 1) : per);
              PEUI.sound('coin');
            }, 600 + k * 320);
          })(fi);
        }
      }
    }
    reportNext = function () { el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); reportNext = null; next(); };
    var b = el.querySelector('.report__foot [data-action="report-next"]'); if (b) b.focus();
  }
  var reportNext = null;
  PEUI.actions['report-next'] = function () { if (reportNext) reportNext(); };
  /* Preview a report object without advancing the game (screenshots, QA). */
  PEUI._previewReport = function (r, done) { r.preview = true; showReport(r, done || function () {}); };

  /* ---------- Skip quiet years ---------- */
  PEUI.actions['skip-quiet'] = function () {
    PEUI.closeMenu(); if (PEUI.sheet.isOpen()) PEUI.sheet.close();
    var s = PE().Game.state(); if (!s || s.status !== 'playing') { endYear(); return; }
    if (s.events.pending.length) { showEvent(function () { PEUI.actions['skip-quiet'](); }); return; }
    var before = ranksNow();
    var r = PE().Game.skipQuietYears(5); if (!r.ok) { PEUI.toast(r.message, 'danger'); return; }
    if (r.reports.length) r.reports[r.reports.length - 1].rankMoves = rankMoves(before);
    PEUI.save();
    if (root.AdManager && root.AdManager.countMonth) for (var k = 0; k < r.reports.length; k++) root.AdManager.countMonth();
    if (!r.reports.length) { PEUI.toast(r.stopped || 'Something needs your decision first.'); showEvent(function () { PEUI.refresh(); }); return; }
    var last = r.reports[r.reports.length - 1];
    showStack(r, function () { presentReport(last, function () { afterReport(last); }); });
  };
  function showStack(r, next) {
    var el = document.getElementById('report'); PEUI.empty(el);
    var inner = h('div', { class: 'report__inner' });
    var first = r.reports[0], last = r.reports[r.reports.length - 1];
    inner.appendChild(h('div', { class: 'report__head' }, [h('div', { class: 'report__era', text: 'Quiet years' }), h('div', { class: 'report__year', text: first.year + (r.reports.length > 1 ? '–' + last.year : '') }), h('h1', { class: 'report__headline', text: r.needsDecision ? 'Stopped: ' + (r.stopped || 'something needs you').replace(/_/g, ' ').replace(/,/g, ', ') + '.' : 'Five quiet years pass.' })]));
    var t = h('table', { class: 'table', 'aria-label': 'Years skipped' }), tb = h('tbody');
    t.appendChild(h('thead', {}, h('tr', {}, [h('th', { text: 'Year' }), h('th', { text: 'Headline' }), h('th', { class: 'num', text: 'Equity' }), h('th', { class: 'num', text: 'Rank' })])));
    var total = 0;
    for (var i = 0; i < r.reports.length; i++) { var rep = r.reports[i]; total += rep.equityChange; tb.appendChild(h('tr', {}, [h('td', { class: 'num', text: rep.year }), h('td', { text: rep.headline }), h('td', { class: 'num ' + (rep.equityChange >= 0 ? 'pos' : 'neg'), text: fmt.signed(rep.equityChange) }), h('td', { class: 'num', text: '#' + rep.rank.after })])); }
    tb.appendChild(h('tr', { class: 'total' }, [h('td', { text: 'Total' }), h('td'), h('td', { class: 'num ' + (total >= 0 ? 'pos' : 'neg'), text: fmt.signed(total) }), h('td')]));
    t.appendChild(tb); inner.appendChild(h('section', { class: 'card' }, t));
    var lines = []; for (var j = 0; j < r.reports.length; j++) { var rp = r.reports[j]; rp.deals.forEach(function (d) { lines.push(rp.year + ': ' + d.text); }); rp.lines.forEach(function (l) { lines.push(rp.year + ': ' + l); }); rp.goals.achieved.forEach(function (g) { lines.push(rp.year + ': ' + g.desc); }); }
    var sec = section('What happened', lines, 'info'); if (sec) inner.appendChild(sec);
    el.appendChild(h('div', { class: 'report__scroll', tabindex: '0' }, inner));
    el.appendChild(h('div', { class: 'report__foot' }, PEUI.btn('See ' + last.year + ' in full', { cls: 'btn--primary btn--lg', icon: 'skip', action: 'report-next' })));
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    reportNext = function () { el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); reportNext = null; next(); };
    PEUI.sound('coin');
  }

  /* ---------- End screens ---------- */
  function sparkline(timeline) {
    var w = 320, hh = 64, vals = timeline.map(function (t) { return t.netWorth; }), min = Math.min.apply(null, vals.concat([0])), max = Math.max.apply(null, vals.concat([1]));
    var pts = vals.map(function (v, i) { return [(i / Math.max(1, vals.length - 1) * w).toFixed(1), (hh - 4 - (v - min) / (max - min || 1) * (hh - 8)).toFixed(1)]; });
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hh); svg.setAttribute('class', 'sparkline'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Net worth over time');
    var area = document.createElementNS('http://www.w3.org/2000/svg', 'path'); area.setAttribute('class', 'area'); area.setAttribute('d', 'M0,' + hh + ' ' + pts.map(function (p) { return 'L' + p[0] + ',' + p[1]; }).join(' ') + ' L' + w + ',' + hh + ' Z');
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'path'); line.setAttribute('d', pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' '));
    svg.appendChild(area); svg.appendChild(line); return svg;
  }
  function showEnd() {
    var L = PE().Game.legacy(), s = PE().Game.state(), st = PE().Game.summary(); if (!L.ok) return;
    var fallen = s.status === 'bankrupt', el = document.getElementById('titlecard'); PEUI.empty(el);
    var scen = L.mode === 'scenario' ? (L.scenario || s.scenario) : null, chall = L.mode === 'challenge' ? (L.challenge || s.challenge) : null;
    var scenWon = scen && scen.result === 'won', lost = fallen || (scen && !scenWon);
    var inner = h('div', { class: 'titlecard__inner' });
    inner.appendChild(h('div', { class: 'titlecard__k', text: fallen ? 'The end of a chapter' : scen ? scen.name : chall ? 'Weekly challenge · ' + chall.week : 'The year ' + s.endYear }));
    inner.appendChild(h('h1', { class: 'titlecard__t', text: fallen ? 'The House of ' + s.dynasty.surname + ' has fallen' : scen ? (scenWon ? 'The House of ' + s.dynasty.surname + ' endures' : 'The ' + scen.name + ' beats the House of ' + s.dynasty.surname) : 'The House of ' + s.dynasty.surname + ' endures' }));
    var years = 'From ' + s.startYear + ' to ' + Math.min(s.year - 1, s.endYear) + ': ';
    inner.appendChild(h('p', { class: 'titlecard__s', text: fallen ? (s.endReason || '') + '. ' + L.generation + ' generation' + (L.generation > 1 ? 's' : '') + ', ' + L.cities + ' cit' + (L.cities === 1 ? 'y' : 'ies') + ', reputation ' + Math.round(L.reputation) + '.' :
      scen ? (scenWon ? 'You came through with the house intact. ' : 'The house is beaten, but the name survives. ') + years + 'net worth ' + fmt.money(L.netWorth) + ' (started at ' + fmt.money(s.startNetWorth) + ').' :
      chall ? years + 'net worth ' + fmt.money(L.netWorth) + '. Final score ' + fmt.int((s.challenge && s.challenge.score) || 0) + '.' :
      years + L.generation + ' generations, ' + L.cities + ' cities, net worth ' + fmt.money(L.netWorth) + ', rank #' + st.rank + '.' }));
    var absorbed = s.lastReport && s.lastReport.absorbed;
    if (fallen && absorbed) {
      var absDef = PE().Data.rivalById(absorbed.rivalId);
      inner.appendChild(h('div', { class: 'note taunt-note', style: 'text-align:left' }, [PEUI.crest({ id: absorbed.rivalId, name: absorbed.rivalName, color: absDef ? absDef.color : '#888' }, { size: 34 }), h('span', { class: 'grow', text: absorbed.rivalName + ' strip ' + absorbed.count + ' building' + (absorbed.count > 1 ? 's' : '') + ' from the portfolio. On the map, the city changes hands.' })]));
    }
    inner.appendChild(sparkline(L.timeline));
    inner.appendChild(h('div', { class: 'stat-grid stat-grid--3', style: 'width:100%;text-align:left' }, [
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', style: 'color:var(--hud-ink-2)', text: 'Legacy score' }), h('span', { class: 'stat__value num', text: fmt.int(L.score) })]),
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', style: 'color:var(--hud-ink-2)', text: 'Achievements' }), h('span', { class: 'stat__value num', text: String(L.achievements) })]),
      h('div', { class: 'stat' }, [h('span', { class: 'stat__label', style: 'color:var(--hud-ink-2)', text: 'Legacy points' }), h('span', { class: 'stat__value num', text: fmt.int((L.meta && L.meta.legacyPoints) || 0) + ' + ' + fmt.int(L.pointsIfRecorded) })])
    ]));
    var row = h('div', { class: 'btn-row', style: 'width:100%' });
    if (fallen) row.appendChild(PEUI.btn('Continue as the heir', { cls: 'btn--secondary btn--lg', icon: 'crown', action: 'end-heir' }));
    row.appendChild(PEUI.btn('Start a new dynasty', { cls: 'btn--gold btn--lg', icon: 'sparkle', action: 'end-new' }));
    inner.appendChild(row);
    el.appendChild(inner); el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    if (!lost) { PEUI.confetti(80); PEUI.sound('fanfare'); } else PEUI.sound('alarm');
  }
  PEUI.showEnd = showEnd;
  PEUI.actions['end-heir'] = function () {
    var r = PEUI.call(PE().Game.continueAsHeir); if (!r.ok) return;
    PEUI.save(); document.getElementById('titlecard').classList.remove('is-open');
    PEUI.toast(r.message, 'success'); if (PEUI.destroyCity) PEUI.destroyCity(); PEUI.render('deals'); showEvent(function () { PEUI.refresh(); });
  };
  PEUI.actions['end-new'] = function () {
    var slot = (PE().Game.state() || {}).saveSlot || 1;
    var r = PEUI.call(PE().Game.newDynasty, {}); if (!r.ok) return;
    document.getElementById('titlecard').classList.remove('is-open');
    PE().Game.deleteSave(slot); PE()._state = null;
    PEUI.toast('Legacy recorded: ' + fmt.int(r.legacyPointsEarned || 0) + ' prestige point' + (r.legacyPointsEarned === 1 ? '' : 's') + '.', 'success');
    PEUI.leaveGame();
  };

  /* ---------- Interstitials: only at the year report, capped ---------- */
  function maybeAd() {
    var A = root.AdManager; if (!A || !A.tryShowAd || A.isAdsRemoved && A.isAdsRemoved()) return;
    var now = Date.now(), p = PEUI.prefs, s = PE().Game.state();
    if (!p.gameStartedAt || now - p.gameStartedAt < AD.firstMinutes * 60000) return;
    if (p.lastAdAt && now - p.lastAdAt < AD.everyMinutes * 60000) return;
    if (s.year - (p.lastAdYear || -99) < AD.everyYears) return;
    if (A._monthsSinceAd !== undefined && A._monthsSinceAd < A.MONTHS_BETWEEN_ADS) return;
    if (A.tryShowAd()) { p.lastAdAt = now; p.lastAdYear = s.year; PEUI.savePrefs(); }
  }
})(window);
