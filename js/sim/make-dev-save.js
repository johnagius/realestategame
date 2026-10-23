#!/usr/bin/env node
/* Builds the developed save for the P8.7 playtest (docs/audit/05-playtest.md,
   Session B): a Chen campaign played ~22 years by the competent bot, with at
   least one London visitor-district property already on short let so the owner
   can inspect both letting strategies immediately.
   Output: tools/playtest-save.json — import via Dynasty tab → Settings → slot import. */
var fs = require('fs'), path = require('path');
var load = require('./load.js');
var PE = load();
var r = PE.Game.newGame({ familyId: 'chen', seed: 42 });
if (!r.ok) throw new Error(r.message);
var players = require('./players.js')(PE);
var s = PE.S();
for (var y = 0; y < 22 && s.status === 'playing'; y++) {
  players.competent.play();
  var rep = PE.Game.endYear();
  if (!rep.ok) { players.resolveEvents('competent'); rep = PE.Game.endYear(); }
  if (!rep.ok) throw new Error('endYear failed: ' + rep.message);
}
// Guarantee the slice is on show: one eligible London visitor property on short let.
var D = PE.Data, short = null, eligible = null;
PE.State.playerProps().forEach(function (p) {
  if (p.cityId !== 'london' || D.shortLetTypes.indexOf(p.type) < 0) return;
  if (PE.Property.visitorRating(p.cityId, p.district) < 1) return;
  var info = PE.Property.lettingInfo(p.id);
  if (!info.ok || !info.eligible) return;
  if ((p.letMode || 'long') === 'short') short = p; else if (info.canSwitch) eligible = eligible || p;
});
if (!short && eligible) {
  var sw = PE.Property.setLetMode(eligible.id, 'short');
  if (!sw.ok) throw new Error('setLetMode failed: ' + sw.message);
  short = eligible;
}
if (!short) {
  // no eligible property owned: buy one from the current London board outright
  var l = PE.Market.listingArray('london').filter(function (x) {
    return D.shortLetTypes.indexOf(x.type) >= 0 && PE.Property.visitorRating('london', x.district) >= 1;
  })[0];
  if (l) {
    PE.S().cash += PE.Market.cashNeeded(l, l.askingPrice, null).cash; // playtest fixture, not a balance run
    var buy = PE.Market.makeOffer(l.id, l.askingPrice, null);
    if (buy.ok && buy.outcome === 'accepted') {
      var p = PE.State.playerProps().filter(function (x) { return x.id === l.id; })[0];
      if (p && PE.Property.lettingInfo(p.id).canSwitch) { PE.Property.setLetMode(p.id, 'short'); short = p; }
    }
  }
}
var st = PE.S();
console.log('year', st.year, '| props', PE.State.propertyCount('player'), '| cities', PE.State.unlockedCities().join(','),
  '| cash', st.cash, '| short-let property:', short ? short.name + ' (' + short.district + ')' : 'NONE');
var out = { saveVersion: PE.Storage.SAVE_VERSION, state: JSON.parse(JSON.stringify(st)) };
var file = path.join(__dirname, '..', '..', 'tools', 'playtest-save.json');
fs.writeFileSync(file, JSON.stringify(out));
console.log('wrote', file);
