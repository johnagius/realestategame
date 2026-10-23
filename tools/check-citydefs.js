/* City-definition sanity check (Skyline roll-out): loads every js/cities/*.js,
   verifies profile shape, layout tokens, landmark wiring and value sanity.
   Usage: node tools/check-citydefs.js   (exit 1 on any finding) */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CITY_DIR = path.join(ROOT, 'js', 'cities');

// id -> expected global, mirrors js/ui/city.js
const IDS = {
  london: 'CityDef_London', paris: 'CityDef_Paris', new_york: 'CityDef_NewYork',
  amsterdam: 'CityDef_Amsterdam', berlin: 'CityDef_Berlin', rome: 'CityDef_Rome',
  barcelona: 'CityDef_Barcelona', monaco: 'CityDef_Monaco', sydney: 'CityDef_Sydney',
  hong_kong: 'CityDef_HongKong', mumbai: 'CityDef_Mumbai', toronto: 'CityDef_Toronto',
  shanghai: 'CityDef_Shanghai', cape_town: 'CityDef_CapeTown', tokyo: 'CityDef_Tokyo',
  singapore: 'CityDef_Singapore', los_angeles: 'CityDef_LosAngeles',
  sao_paulo: 'CityDef_SaoPaulo', miami: 'CityDef_Miami', dubai: 'CityDef_Dubai',
};
const ERA_ORDER = ['victorian', 'gilded', 'crisis', 'boom', 'modern', 'digital'];
const TERRAIN = new Set(['W', 'HB', 'RD', 'LOT', 'CP', 'CT', 'B']);           // 'B' = open building slot
const BLDG = new Set(['HO', 'ST', 'AP', 'PH', 'TH', 'VI', 'MN', 'CM', 'WR', 'SK']);
const TREES = new Set(['plane', 'palm', 'conifer', 'cherry', 'acacia', 'scrub']);
const LAMPS = new Set(['gas', 'modern', 'neon']);
const SURROUNDINGS = new Set(['hills', 'flat', 'desert', 'dense']);
const HEX = /^#([0-9a-f]{6})$/i;

// Multi-tile silhouette landmarks are intentional (range/ridge built from repeated
// tile-local cells). Anything repeating outside this list is a likely accident.
const REPEAT_OK = { cape_town: new Set(['TBM']), hong_kong: new Set(['HIL']) };

let findings = 0;
const bad = (city, msg) => { console.log(`FAIL ${city}: ${msg}`); findings++; };

function loadDef(file, globalName) {
  const code = fs.readFileSync(path.join(CITY_DIR, file), 'utf8');
  const fn = new Function('City3D', 'THREE', code + `\n;return typeof ${globalName} !== 'undefined' ? ${globalName} : null;`);
  return fn({}, {}); // landmark fns are not invoked at load time
}

function checkProfile(city, def) {
  const p = def.profile;
  if (!p) return bad(city, 'no profile');
  if (!p.base || typeof p.base !== 'object') return bad(city, 'profile.base missing');
  const eras = ERA_ORDER.filter(e => p[e]);
  if (!eras.length) bad(city, 'profile has no era keys (base only)');
  const hexNum = v => typeof v === 'number' && v >= 0 && v <= 0xffffff;
  const checkWater = (w, where) => {
    if (!w) return;
    if (w.color != null && !hexNum(w.color)) bad(city, `${where}.water.color not a hex number (${w.color})`);
    if (w.specular != null && !hexNum(w.specular)) bad(city, `${where}.water.specular invalid`);
    if (w.opacity != null && (w.opacity < 0 || w.opacity > 1)) bad(city, `${where}.water.opacity out of 0..1`);
  };
  checkWater(p.base.water, 'base');
  if (p.base.trees != null && !TREES.has(p.base.trees)) bad(city, `base.trees '${p.base.trees}' unknown`);
  if (p.base.lamps != null && !LAMPS.has(p.base.lamps)) bad(city, `base.lamps '${p.base.lamps}' unknown`);
  if (p.base.skyline != null && !hexNum(p.base.skyline)) bad(city, `base.skyline not a hex number (${p.base.skyline})`);
  if (p.base.surroundings != null && !SURROUNDINGS.has(p.base.surroundings)) bad(city, `base.surroundings '${p.base.surroundings}' unknown`);
  if (p.base.carColors != null && (!Array.isArray(p.base.carColors) || !p.base.carColors.every(hexNum))) bad(city, 'base.carColors not an array of hex numbers');
  for (const e of eras) {
    const pe = p[e];
    if (pe.sky != null && (!Array.isArray(pe.sky) || pe.sky.length !== 3 || !pe.sky.every(s => HEX.test(s)))) bad(city, `${e}.sky not a 3-string hex triad`);
    if (pe.fog != null && !hexNum(pe.fog)) bad(city, `${e}.fog invalid`);
    if (pe.haze != null && (pe.haze < 0 || pe.haze > 1)) bad(city, `${e}.haze out of 0..1`);
    if (pe.sunDay != null && !hexNum(pe.sunDay)) bad(city, `${e}.sunDay invalid`);
    if (pe.sunDusk != null && !hexNum(pe.sunDusk)) bad(city, `${e}.sunDusk invalid`);
    if (pe.ambDay != null && !hexNum(pe.ambDay)) bad(city, `${e}.ambDay invalid`);
    if (pe.ambDusk != null && !hexNum(pe.ambDusk)) bad(city, `${e}.ambDusk invalid`);
    if (pe.hemiSky != null && !hexNum(pe.hemiSky)) bad(city, `${e}.hemiSky invalid`);
    if (pe.hemiGround != null && !hexNum(pe.hemiGround)) bad(city, `${e}.hemiGround invalid`);
    ['ground', 'road', 'side', 'park'].forEach(k => { if (pe[k] != null && !hexNum(pe[k])) bad(city, `${e}.${k} invalid`); });
    if (pe.trees != null && !TREES.has(pe.trees)) bad(city, `${e}.trees '${pe.trees}' unknown`);
    if (pe.lamps != null && !LAMPS.has(pe.lamps)) bad(city, `${e}.lamps '${pe.lamps}' unknown`);
    checkWater(pe.water, e);
  }
}

function checkLayout(city, def) {
  if (!def.layout || !def.layout.length) return bad(city, 'no layout');
  const w = def.layout[0].length;
  const seen = new Map();
  def.layout.forEach((row, r) => {
    if (row.length !== w) bad(city, `layout row ${r} width ${row.length} != ${w}`);
    row.forEach((t, c) => {
      const isLm = def.landmarks && def.landmarks[t];
      if (!TERRAIN.has(t) && !BLDG.has(t) && !isLm) bad(city, `layout token '${t}' at ${r},${c} unknown`);
      if (isLm) seen.set(t, (seen.get(t) || 0) + 1);
    });
  });
  seen.forEach((n, t) => {
    if (n > 1 && !(REPEAT_OK[city] && REPEAT_OK[city].has(t))) bad(city, `landmark token '${t}' appears ${n}x in layout`);
  });
  if (def.landmarkEras) for (const t in def.landmarkEras) {
    if (!def.landmarks[t]) bad(city, `landmarkEras.${t} has no landmarks.${t}`);
    if (ERA_ORDER.indexOf(def.landmarkEras[t]) < 0) bad(city, `landmarkEras.${t} = '${def.landmarkEras[t]}' not an era`);
  }
  if (def.landmarkGround) for (const t in def.landmarkGround) {
    if (!def.landmarks[t]) bad(city, `landmarkGround.${t} has no landmarks.${t}`);
  }
}

// Water geometry rules (caught the grey-pads-in-harbour / slot-in-harbour / bridge-to-
// nowhere class of defects): landmarks surrounded by water must keep water ground,
// building slots must not sit inside water bodies, and bridge landmarks must connect.
function checkWaterGeometry(city, def) {
  const lay = def.layout, H = lay.length, W = lay[0].length;
  const isW = t => t === 'W' || t === 'HB';
  const at = (r, c) => (r >= 0 && r < H && c >= 0 && c < W) ? lay[r][c] : null;
  const lg = def.landmarkGround || {};
  lay.forEach((row, r) => row.forEach((t, c) => {
    const waterN = [at(r - 1, c), at(r + 1, c), at(r, c - 1), at(r, c + 1)].filter(isW).length;
    if (def.landmarks && def.landmarks[t]) {
      if (waterN >= 2 && lg[t] !== 'W' && lg[t] !== 'HB')
        bad(city, `landmark '${t}' at ${r},${c} has ${waterN} water neighbours but landmarkGround is '${lg[t] || 'LOT'}'`);
      const nm = def.landmarkNames && def.landmarkNames[t];
      if (nm && /bridge/i.test(nm)) {
        // walk from the bridge cell across contiguous water on each axis; the far side
        // must be road/land in BOTH directions of at least one axis
        const spans = [[[-1, 0], [1, 0]], [[0, -1], [0, 1]]].some(dirs => dirs.every(([dr, dc]) => {
          let r2 = r + dr, c2 = c + dc;
          while (isW(at(r2, c2))) { r2 += dr; c2 += dc; }
          const far = at(r2, c2);
          return far !== null && !isW(far);
        }));
        if (!spans) bad(city, `bridge landmark '${t}' (${nm}) at ${r},${c} has no road/land on both sides across the water`);
      }
    } else if ((t === 'B' || BLDG.has(t)) && waterN >= 3) {
      bad(city, `buildable slot '${t}' at ${r},${c} has ${waterN} water neighbours`);
    }
  }));
}

// LOCATION-SLICE §2: a cityDef's districtZones ("r,c" -> engine district name) must
// cover every buildable/landmark cell, and every name must be a real engine district.
// District names come from js/engine/data.js (an IIFE that sets PE.Data on window).
const districtCache = new Map();
function engineDistricts(city) {
  if (!districtCache.has(city)) {
    let set = null;
    try {
      const code = fs.readFileSync(path.join(ROOT, 'js', 'engine', 'data.js'), 'utf8');
      const D = new Function('window', code + '\n;return window.PE && window.PE.Data;')({});
      const c = D && D.cities && D.cities.find(x => x.id === city);
      if (c) set = new Set(c.districts.map(d => d.name));
    } catch (e) { /* reported below */ }
    districtCache.set(city, set);
  }
  return districtCache.get(city);
}
function checkDistrictZones(city, def) {
  const dz = def.districtZones;
  if (!dz) {
    if (city === 'london') bad(city, 'districtZones missing (LOCATION-SLICE requires it for London)');
    return;
  }
  const names = engineDistricts(city);
  if (!names) return bad(city, 'could not load engine districts (js/engine/data.js) to validate districtZones');
  const zoned = new Set();
  for (const k in dz) {
    const m = /^(\d+),(\d+)$/.exec(k);
    if (!m) { bad(city, `districtZones key '${k}' is not 'r,c'`); continue; }
    const r = +m[1], c = +m[2];
    if (!def.layout[r] || def.layout[r][c] === undefined) { bad(city, `districtZones key '${k}' is outside the layout`); continue; }
    const t = def.layout[r][c];
    const isLm = def.landmarks && def.landmarks[t];
    if (!(t === 'B' || BLDG.has(t) || isLm)) bad(city, `districtZones key '${k}' covers non-buildable cell '${t}'`);
    zoned.add(k);
    if (!names.has(dz[k])) bad(city, `districtZones ${k} = '${dz[k]}' is not an engine district`);
  }
  def.layout.forEach((row, r) => row.forEach((t, c) => {
    const isLm = def.landmarks && def.landmarks[t];
    if ((t === 'B' || BLDG.has(t) || isLm) && !zoned.has(r + ',' + c)) bad(city, `districtZones missing cell ${r},${c} ('${t}')`);
  }));
}

const files = fs.readdirSync(CITY_DIR).filter(f => f.endsWith('.js'));
const missing = Object.entries(IDS).filter(([id, g]) => !files.includes(id + '.js'));
missing.forEach(([id]) => bad('registry', `no file for city id '${id}'`));

for (const [id, g] of Object.entries(IDS)) {
  const file = id + '.js';
  if (!files.includes(file)) continue;
  let def;
  try { def = loadDef(file, g); } catch (e) { bad(id, `load threw: ${e.message}`); continue; }
  if (!def) { bad(id, `global ${g} not defined`); continue; }
  if (def.id !== id) bad(id, `def.id '${def.id}' != file id`);
  checkProfile(id, def);
  checkLayout(id, def);
  checkWaterGeometry(id, def);
  checkDistrictZones(id, def);
  if (!findings) process.stdout.write(`ok ${id}  `);
}
console.log('');
if (findings) { console.log(`${findings} finding(s)`); process.exit(1); }
console.log(`all ${Object.keys(IDS).length} city defs OK`);
