/* PE.Events demo pack (P7 live-ops) — a sample event pack in the exact JSON
   shape ops would ship (docs/live-ops.md). OFF by default: it registers only
   when the meta flag packsEnabled is set (PE.Storage.loadMeta().flags) or the
   URL carries ?packs=1. Every choice set mirrors a built-in event shape that
   passes js/sim/eventsmc.js, so the pack passes the Monte-Carlo pillar-1 check.
   Load after js/engine/game.js: <script src="js/engine/pack-demo.js" defer></script> */
(function (root) {
  var PE = root.PE = root.PE || {};

  var pack = {
    id: 'demo',
    name: "The Surveyor's Notebook",
    events: [
      {
        id: 'demo:charity_ball', kind: 'random', weight: 2, minProps: 1, minYear: 1850, maxYear: 2030,
        title: 'The hospital ball',
        text: 'The governors of the infirmary ask the family to sponsor the winter ball, and the newspapers will print the list of patrons.',
        choices: [
          { label: 'Sponsor the ball (pay 1.5% of net worth; +5 reputation)', fx: { cashPctNW: -0.015, reputation: 5 } },
          { label: 'Send regrets (−1 reputation)', fx: { reputation: -1 } }
        ]
      },
      {
        id: 'demo:wiring', kind: 'random', weight: 2, minProps: 1, minYear: 1880, maxYear: 2030,
        title: "The electrician's report",
        text: 'The electrician calls the wiring at {prop} a fire waiting to happen, and says so loudly, in front of the tenants.',
        choices: [
          { label: 'Rewire at once (pay 6% of its value; condition +4)', fx: { propCostPct: 0.06, propCondition: 4 } },
          { label: 'Patch the worst runs (pay 1%; 60%: it holds; 40%: condition −15 after a scare)', fx: { propCostPct: 0.01, propGamble: { p: 0.6, loseCond: 15 } } }
        ]
      },
      {
        id: 'demo:terminus', kind: 'random', weight: 1, minProps: 1, minYear: 1850, maxYear: 1930,
        title: 'A terminus for {district}',
        text: 'The omnibus company wants to build a terminus in {district}, {city}, and asks the landlords along the route to subscribe to the works.',
        choices: [
          { label: 'Subscribe 2% of net worth (the district trends up for 4 years)', fx: { cashPctNW: -0.02, districtMomentum: 4 } },
          { label: 'Let others pay (−1 reputation; 55%: it is built anyway)', fx: { reputation: -1, districtMomentumChance: { p: 0.55, years: 4 } } }
        ]
      },
      {
        id: 'demo:visitors', kind: 'random', weight: 1, minProps: 1, minYear: 1850, maxYear: 2030,
        title: 'Visitors for the season',
        text: '{city} is full of visitors this season — an exhibition, a trial, a wedding — and every clean room in town is wanted.',
        choices: [
          { label: 'Let short to visitors (rents +10% this year; tenants churn: every building −2 condition)', fx: { rentBoost: 0.10, decay: 2 } },
          { label: 'Keep your tenants (+1 reputation)', fx: { reputation: 1 } }
        ]
      },
      {
        id: 'demo:bank_lease', kind: 'random', weight: 1, minProps: 1, minYear: 1850, maxYear: 2030,
        title: 'The bank wants {prop}',
        text: 'A bank would take {prop} on a long lease for its clerks, at a firm rent, paid on the first of the month without fail.',
        choices: [
          { label: 'Ten years at 105% (never vacant, no rises)', fx: { lease: { years: 10, setting: 1.05 } } },
          { label: 'Three years at 95%, then re-let', fx: { lease: { years: 3, setting: 0.95 } } }
        ]
      }
    ]
  };

  function enabled() {
    try { if (root.location && /[?&]packs=1\b/.test(root.location.search || '')) return true; } catch (e) {}
    try { var meta = PE.Storage && PE.Storage.loadMeta(); if (meta && meta.flags && meta.flags.packsEnabled) return true; } catch (e) {}
    return false;
  }

  if (PE.Events) {
    PE.Events.DEMO_PACK = pack;             // tests use the raw pack; registration is flag-gated
    if (PE.Events.registerPack && enabled()) PE.Events.registerPack(pack);
  }
})(typeof window !== 'undefined' ? window : global);
