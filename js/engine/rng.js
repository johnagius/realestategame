/* PE.RNG — seeded deterministic randomness (mulberry32).
   Every random draw in the engine goes through here and advances state.rng,
   so the same seed + the same action sequence always yields the same state.
   Never call Math.random anywhere in js/engine. */
(function (root) {
  var PE = root.PE = root.PE || {};

  function hashSeed(seed) {
    // Accept numbers or strings; produce a uint32.
    if (typeof seed === 'number') return (seed >>> 0) || 1;
    var s = String(seed), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }

  function step(st) {
    // mulberry32 core; st.rng is a uint32 stored in the game state.
    var t = (st.rng = (st.rng + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  var RNG = {
    hashSeed: hashSeed,
    /* Bind to a state object; all draws mutate state.rng. */
    _st: null,
    bind: function (state) { RNG._st = state; },
    _s: function (st) { st = st || RNG._st; if (!st) throw new Error('RNG not bound'); return st; },
    /* float in [0,1) */
    next: function (st) { return step(RNG._s(st)); },
    /* float in [a,b) */
    range: function (a, b, st) { return a + (b - a) * step(RNG._s(st)); },
    /* integer in [a,b] inclusive */
    int: function (a, b, st) { return a + Math.floor(step(RNG._s(st)) * (b - a + 1)); },
    chance: function (p, st) { return step(RNG._s(st)) < p; },
    pick: function (arr, st) { return arr[Math.floor(step(RNG._s(st)) * arr.length)]; },
    /* weighted pick: items [{w, ...}] or parallel weights */
    weighted: function (items, weights, st) {
      var total = 0, i;
      for (i = 0; i < weights.length; i++) total += weights[i];
      var r = step(RNG._s(st)) * total;
      for (i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; }
      return items[items.length - 1];
    },
    /* approx normal via sum of 3 uniforms (cheap, bounded in [-1.5,1.5]*sd*2) */
    normal: function (mean, sd, st) {
      var s = RNG._s(st);
      var u = step(s) + step(s) + step(s);
      return mean + (u - 1.5) * sd * 1.6330;
    },
    /* Fisher-Yates in place */
    shuffle: function (arr, st) {
      var s = RNG._s(st);
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(step(s) * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }
  };
  PE.RNG = RNG;
})(typeof window !== 'undefined' ? window : global);
