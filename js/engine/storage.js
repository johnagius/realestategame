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
    SAVE_VERSION: 1,
    /* migrations[n] upgrades a save from version n to n+1 */
    migrations: {
      // 0: function (s) { ... ; return s; }
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
    loadMeta: function () { var raw = backend.get(Storage.META_KEY); return raw ? JSON.parse(raw) : { legacyPoints: 0, runs: [], perks: [] }; },
    saveMeta: function (meta) { return backend.set(Storage.META_KEY, JSON.stringify(meta)); }
  };
  PE.Storage = Storage;
})(typeof window !== 'undefined' ? window : global);
