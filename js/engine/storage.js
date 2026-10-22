/* PE.Storage — save/load abstraction. localStorage in the browser, an in-memory
   map in Node. Saves carry saveVersion; migrations run in order on load so an
   old save never crashes a newer engine. Save key: pe_v8_save. */
(function (root) {
  var PE = root.PE = root.PE || {};
  var mem = {};
  var backend = {
    get: function (k) { try { if (root.localStorage) return root.localStorage.getItem(k); } catch (e) {} return mem.hasOwnProperty(k) ? mem[k] : null; },
    set: function (k, v) { try { if (root.localStorage) { root.localStorage.setItem(k, v); return true; } } catch (e) {} mem[k] = v; return true; },
    remove: function (k) { try { if (root.localStorage) root.localStorage.removeItem(k); } catch (e) {} delete mem[k]; }
  };

  var Storage = {
    SAVE_KEY: 'pe_v8_save',
    META_KEY: 'pe_v8_meta',
    SAVE_VERSION: 2,
    /* migrations[n] upgrades a save from version n to n+1 */
    migrations: {
      // 0: function (s) { ... ; return s; }
      /* 1 -> 2 (engine 8.1): relations, rank history, perks, scenarios/challenges, family goal track, new stats and flags. */
      1: function (st) {
        if (!st || typeof st !== 'object') return st;
        var id;
        st.mode = st.mode || 'campaign';
        if (st.scenario === undefined) st.scenario = null;
        if (st.challenge === undefined) st.challenge = null;
        if (st.legacyRecorded === undefined) st.legacyRecorded = false;
        if (!st.perks) st.perks = [];
        if (!st.relations) { st.relations = {}; if (st.rivals) for (id in st.rivals) st.relations[id] = Math.round(((st.rivals[id].relation === undefined ? 50 : st.rivals[id].relation) - 50) * 2); }
        if (st.rivals) for (id in st.rivals) { var rv = st.rivals[id]; if (rv.merged === undefined) rv.merged = false; if (rv.mergedYear === undefined) rv.mergedYear = null; if (rv.allied === undefined) rv.allied = false; }
        if (!st.ranks) st.ranks = { year: st.year, byId: {}, prevYear: null, prevById: {} };
        if (st.goals && st.goals.family === undefined) st.goals.family = null;
        if (st.dynasty) { if (!st.dynasty.alliances) st.dynasty.alliances = []; if (!st.dynasty.proposals) st.dynasty.proposals = []; if (st.dynasty.mergers === undefined) st.dynasty.mergers = 0; }
        if (st.stats) {
          var defaults = { steals: 0, countersClosed: 0, marginCallsCleared: 0, highLtvYears: 0, rank1Years: 0, educated: 0, marriages: 0, mergers: 0, vultures: 0, cashKingYears: 0, trustSuccessions: 0, evictions: 0, yearlyGoalsDone: 0, rothschildLoans: 0 };
          for (var k in defaults) if (st.stats[k] === undefined) st.stats[k] = defaults[k];
          if (!st.stats.outbidRivals) st.stats.outbidRivals = {};
        }
        if (st.flags) { if (st.flags.insuredUntil === undefined) st.flags.insuredUntil = 0; if (st.flags.allyRevealId === undefined) st.flags.allyRevealId = null; }
        return st;
      }
    },
    useBackend: function (b) { backend = b; },
    /* Persist a JSON-serialisable state. */
    save: function (state, key) {
      var payload = { saveVersion: Storage.SAVE_VERSION, savedAt: state.year, state: state };
      return backend.set(key || Storage.SAVE_KEY, JSON.stringify(payload));
    },
    load: function (key) {
      var raw = backend.get(key || Storage.SAVE_KEY);
      if (!raw) return null;
      var payload = JSON.parse(raw);
      var v = payload.saveVersion || 0, st = payload.state;
      while (v < Storage.SAVE_VERSION) {
        var m = Storage.migrations[v];
        if (typeof m === 'function') st = m(st);
        v++;
      }
      st.saveVersion = Storage.SAVE_VERSION;
      return st;
    },
    has: function (key) { return backend.get(key || Storage.SAVE_KEY) !== null; },
    remove: function (key) { backend.remove(key || Storage.SAVE_KEY); },
    /* Meta (prestige/legacy) is separate from the run save. */
    /* Meta shape: { legacyPoints, runs[], perks[] (owned perk ids), modes[] (selected 'mode' perks for the next run), challenges: { '<week>': { best, runs, lastYear } } }. */
    loadMeta: function () {
      var raw = backend.get(Storage.META_KEY), m = raw ? JSON.parse(raw) : {};
      if (typeof m.legacyPoints !== 'number') m.legacyPoints = 0;
      if (!m.runs) m.runs = [];
      if (!m.perks) m.perks = [];
      if (!m.modes) m.modes = [];
      if (!m.challenges) m.challenges = {};
      return m;
    },
    saveMeta: function (meta) { return backend.set(Storage.META_KEY, JSON.stringify(meta)); }
  };
  PE.Storage = Storage;
})(typeof window !== 'undefined' ? window : global);
