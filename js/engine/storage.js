/* PE.Storage — save/load abstraction. localStorage in the browser, an in-memory
   map in Node. Saves carry saveVersion; migrations run in order on load so an
   old save never crashes a newer engine.

   P6.3: three save slots (pe_v8_save_1/2/3). Omitting the slot argument keeps
   the pre-P6.3 behaviour, which now means "slot 1"; a save written by an older
   build under the legacy key pe_v8_save is migrated into slot 1 on first access.
   A string argument is still treated as a verbatim storage key (back-compat).
   PE.Storage.importSave(json, slot) validates and writes an exported save.
   PE.Analytics is a local-only event ring buffer (see docs/analytics.md). */
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
    /* P6.3 save slots. */
    SLOTS: 3,
    LEGACY_KEY: 'pe_v8_save',
    SLOT_KEYS: ['pe_v8_save_1', 'pe_v8_save_2', 'pe_v8_save_3'],
    DEFAULT_SLOT: 1,
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
          var defaults = { steals: 0, countersClosed: 0, marginCallsCleared: 0, highLtvYears: 0, rank1Years: 0, educated: 0, marriages: 0, mergers: 0, vultures: 0, cashKingYears: 0, trustSuccessions: 0, evictions: 0, yearlyGoalsDone: 0, rothschildLoans: 0, outbidRivals: 0 };
          for (var k in defaults) if (st.stats[k] === undefined) st.stats[k] = defaults[k];
          if (!st.stats.outbidRivals) st.stats.outbidRivals = {};
        }
        if (st.flags) { if (st.flags.insuredUntil === undefined) st.flags.insuredUntil = 0; if (st.flags.allyRevealId === undefined) st.flags.allyRevealId = null; }
        return st;
      }
    },
    useBackend: function (b) { backend = b; },
    /* Which storage key a slot argument means. undefined/null → the default slot (1);
       1..3 → that slot's key; a string → verbatim key (back-compat). Invalid → null. */
    resolveKey: function (slot) {
      if (slot === undefined || slot === null) return Storage.SLOT_KEYS[Storage.DEFAULT_SLOT - 1];
      if (typeof slot === 'string') return slot;
      var n = Math.floor(Number(slot));
      return (n >= 1 && n <= Storage.SLOTS) ? Storage.SLOT_KEYS[n - 1] : null;
    },
    slotOf: function (slot) {
      var n = Math.floor(Number(slot));
      return (n >= 1 && n <= Storage.SLOTS) ? n : null;
    },
    /* Copy a pre-P6.3 save from the legacy key into slot 1 (once). Returns true when it migrated. */
    migrateLegacy: function () {
      if (backend.get(Storage.SLOT_KEYS[0])) return false;
      var raw = backend.get(Storage.LEGACY_KEY);
      if (!raw) return false;
      backend.set(Storage.SLOT_KEYS[0], raw);
      backend.remove(Storage.LEGACY_KEY);
      return true;
    },
    /* Persist a JSON-serialisable state. slot: undefined → slot 1, 1..3 → slot, string → verbatim key. */
    save: function (state, slot) {
      var key = Storage.resolveKey(slot);
      if (!key) return false;
      var payload = { saveVersion: Storage.SAVE_VERSION, savedAt: state.year, state: state };
      return backend.set(key, JSON.stringify(payload));
    },
    load: function (slot) {
      Storage.migrateLegacy();
      var key = Storage.resolveKey(slot);
      if (!key) return null;
      var raw = backend.get(key);
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
    has: function (slot) {
      Storage.migrateLegacy();
      var key = Storage.resolveKey(slot);
      return key !== null && backend.get(key) !== null;
    },
    remove: function (slot) {
      Storage.migrateLegacy();
      var key = Storage.resolveKey(slot);
      if (!key) return;
      backend.remove(key);
    },
    /* All three slots with their stored meta, for a slot-picker UI (PEUI start screen wires it).
       Shape: [{ slot, key, exists, year, familyName, mode, corrupt }]. Corrupt entries exist but carry no meta. */
    listSaves: function () {
      Storage.migrateLegacy();
      var out = [];
      for (var i = 0; i < Storage.SLOT_KEYS.length; i++) {
        var key = Storage.SLOT_KEYS[i], raw = backend.get(key), row = { slot: i + 1, key: key, exists: raw !== null, year: null, familyName: null, mode: null, corrupt: false };
        if (raw) {
          try {
            var p = JSON.parse(raw);
            row.year = p.state ? p.state.year : null;
            row.familyName = p.state ? (p.state.familyName || (p.state.dynasty ? p.state.dynasty.surname : null)) : null;
            row.mode = p.state ? p.state.mode || 'campaign' : null;
          } catch (e) { row.corrupt = true; }
        }
        out.push(row);
      }
      return out;
    },
    /* Import an exported save (the JSON produced by the settings "Export save as JSON" button,
       i.e. { saveVersion, savedAt?, state }). Validates the payload and the slot choice, then
       writes it verbatim — version migrations run later, on load, as for any save.
       Returns { ok, message, slot? } and never throws. */
    importSave: function (json, slot) {
      var n = (slot === undefined || slot === null) ? Storage.DEFAULT_SLOT : Math.floor(Number(slot));
      if (!(n >= 1 && n <= Storage.SLOTS)) return { ok: false, message: 'Choose a save slot between 1 and ' + Storage.SLOTS + '.' };
      var payload;
      try { payload = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return { ok: false, message: 'That file is not valid JSON.' }; }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { ok: false, message: 'That is not a Property Empire save file.' };
      var v = Number(payload.saveVersion);
      if (!isFinite(v) || v < 0 || Math.floor(v) !== v) return { ok: false, message: 'That is not a Property Empire save file (no saveVersion).' };
      if (v > Storage.SAVE_VERSION) return { ok: false, message: 'That save is from a newer version of the game and cannot be imported.' };
      if (!payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)) return { ok: false, message: 'That is not a Property Empire save file (no game state).' };
      if (payload.state.familyId === undefined && !payload.state.dynasty) return { ok: false, message: 'That is not a Property Empire save file.' };
      backend.set(Storage.SLOT_KEYS[n - 1], JSON.stringify({ saveVersion: v, savedAt: payload.savedAt !== undefined ? payload.savedAt : payload.state.year, state: payload.state }));
      return { ok: true, slot: n, message: 'Imported into save slot ' + n + '.' };
    },
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

  /* ---------- PE.Analytics (P6.7) ----------
     Soft-launch telemetry, local only: events accumulate in a JSON ring buffer
     (localStorage key pe_v8_analytics, newest 200 kept). No analytics run in web
     builds; nothing leaves the device until a future backend assigns
     PE.Analytics.onFlush. See docs/analytics.md for the event taxonomy. */
  var Analytics = PE.Analytics = {
    KEY: 'pe_v8_analytics',
    CAP: 200,
    onFlush: null, /* optional deliver hook: function (events) → boolean delivered */
    _read: function () {
      var raw = backend.get(Analytics.KEY);
      var q = raw ? JSON.parse(raw) : [];
      return Array.isArray(q) ? q : [];
    },
    _write: function (q) { backend.set(Analytics.KEY, JSON.stringify(q)); },
    /* Record an event. props is an optional flat object. Returns true when stored. Never throws. */
    track: function (event, props) {
      if (!event || typeof event !== 'string') return false;
      var q = Analytics._read();
      q.push({ e: event, p: props && typeof props === 'object' && !Array.isArray(props) ? props : {}, t: new Date().toISOString() });
      if (q.length > Analytics.CAP) q = q.slice(q.length - Analytics.CAP);
      Analytics._write(q);
      return true;
    },
    events: function () { return Analytics._read(); },
    count: function () { return Analytics._read().length; },
    clear: function () { Analytics._write([]); },
    /* Deliver the buffered events through PE.Analytics.onFlush; on success the buffer
       is cleared, otherwise events are kept for the next attempt. Returns delivered count. */
    flush: function () {
      var q = Analytics._read();
      if (!q.length) return 0;
      if (typeof Analytics.onFlush !== 'function') return 0;
      var ok = false;
      try { ok = Analytics.onFlush(q.slice()) === true; } catch (e) { ok = false; }
      if (ok) Analytics._write([]);
      return ok ? q.length : 0;
    }
  };
})(typeof window !== 'undefined' ? window : global);
