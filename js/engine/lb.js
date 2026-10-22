/* PE.LB — the online weekly leaderboard, today local-first (P7 live-ops).
   Scores from the seeded weekly challenge land here via a wrapper around
   PE.Game.recordChallenge, so no other engine file changes when this loads
   after js/engine/game.js:
     <script src="js/engine/lb.js" defer></script>

   BACKEND REPLACEMENT CONTRACT (docs/live-ops.md): a server backend replaces
   exactly two functions — PE.LB.submit and PE.LB.board — keeping their names,
   signatures and return shapes. The UI (and the recordChallenge wrapper) only
   ever call these two, plus PE.LB.hook to observe submissions, so the swap
   needs no UI changes. Storage contract until then: localStorage key
   "pe_v8_lb" = { weeks: { "YYYY-Www": [{name, score, year, gens, ts}] } },
   top MAX_PER_WEEK entries per week, newest MAX_WEEKS weeks kept. */
(function (root) {
  var PE = root.PE = root.PE || {};

  var KEY = 'pe_v8_lb', MAX_PER_WEEK = 100, MAX_WEEKS = 12;
  var mem = null; // in-memory fallback when localStorage is unavailable (Node harness)
  var hooks = [];

  function store() {
    try { if (root.localStorage) { var raw = root.localStorage.getItem(KEY); return raw ? JSON.parse(raw) : { weeks: {} }; } } catch (e) {}
    return mem || (mem = { weeks: {} });
  }
  function save(data) {
    try { if (root.localStorage) { root.localStorage.setItem(KEY, JSON.stringify(data)); return; } } catch (e) {}
    mem = data;
  }
  function normWeek(week) {
    if (week) return String(week);
    return (PE.Game && PE.Game.isoWeek) ? PE.Game.isoWeek() : '0000-W00';
  }

  var LB = {};

  /* submit(entry) with entry = { name?, score, year?, gens?, week? } →
     { ok, message, week, entry, rank }. rank is 1-based on the stored board. */
  LB.submit = function (entry) {
    try {
      entry = entry || {};
      var name = (typeof entry.name === 'string' && entry.name.trim()) ? entry.name.trim().slice(0, 24) : 'You';
      var score = Number(entry.score);
      if (!isFinite(score)) return PE.fail('Leaderboard entry needs a numeric score');
      score = Math.round(score);
      var week = normWeek(entry.week);
      var rec = {
        name: name,
        score: score,
        year: isFinite(Number(entry.year)) ? Math.round(Number(entry.year)) : null,
        gens: isFinite(Number(entry.gens)) ? Math.round(Number(entry.gens)) : null,
        ts: (typeof Date === 'function' && Date.now) ? Date.now() : null
      };
      var data = store();
      data.weeks[week] = data.weeks[week] || [];
      data.weeks[week].push(rec);
      data.weeks[week].sort(function (a, b) { return b.score - a.score; });
      if (data.weeks[week].length > MAX_PER_WEEK) data.weeks[week].length = MAX_PER_WEEK;
      var weeks = Object.keys(data.weeks).sort();
      while (weeks.length > MAX_WEEKS) { delete data.weeks[weeks[0]]; weeks.shift(); }
      save(data);
      return PE.ok({ message: 'Score submitted for ' + week + '.', week: week, entry: rec, rank: data.weeks[week].indexOf(rec) + 1 });
    } catch (e) { return PE.fail('Leaderboard submit failed: ' + (e && e.message ? e.message : e)); }
  };

  /* board(week?) → { ok, week, board: [{rank, name, score, year, gens}], top, you }.
     Sorted by score descending; you is the local player's best row (or null). */
  LB.board = function (week) {
    try {
      var w = normWeek(week), data = store();
      var rows = (data.weeks[w] || []).map(function (r, i) { return { rank: i + 1, name: r.name, score: r.score, year: r.year, gens: r.gens }; });
      var you = null;
      for (var i = 0; i < rows.length; i++) if (rows[i].name === 'You') { you = rows[i]; break; }
      return PE.ok({ week: w, board: rows, top: rows[0] || null, you: you });
    } catch (e) { return PE.fail('Leaderboard read failed: ' + (e && e.message ? e.message : e)); }
  };

  /* Observe submissions (toasts, sync-to-server later). fn(resultOfSubmit). */
  LB.hook = function (fn) {
    if (typeof fn !== 'function') return PE.fail('hook needs a function');
    if (hooks.indexOf(fn) < 0) hooks.push(fn);
    return PE.ok({ message: 'Hook registered.', hooks: hooks.length });
  };

  /* Self-contained integration: wrap PE.Game.recordChallenge so every finished
     challenge run is submitted without touching game.js. Idempotent per run
     (recordChallenge itself is). */
  function install() {
    var G = PE.Game;
    if (!G || typeof G.recordChallenge !== 'function' || G.recordChallenge.__lb) return;
    var orig = G.recordChallenge;
    var wrapped = function () {
      var c = orig.apply(G, arguments);
      try {
        if (c) {
          var s = PE.S(), entry = s && s.challenge ? { name: 'You', score: s.challenge.score, year: s.year, gens: s.dynasty ? s.dynasty.generation : null, week: s.challenge.week } : null;
          var r = entry ? LB.submit(entry) : PE.fail('No challenge to submit');
          for (var i = 0; i < hooks.length; i++) { try { hooks[i](r); } catch (e) {} }
        }
      } catch (e) {}
      return c;
    };
    wrapped.__lb = true;
    G.recordChallenge = wrapped;
  }
  LB.install = install;
  install();

  PE.LB = LB;
})(typeof window !== 'undefined' ? window : global);
