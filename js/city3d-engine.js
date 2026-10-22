/* ========================================
   PROPERTY EMPIRE — 3D City Engine v2
   Orthographic isometric city on a tile grid.
   Requires: Three.js r128 (js/vendor/three.min.js)

   Public API
     City3D.renderCity(cityDef, container, properties, opts)
       opts = { era, playerColor, rivalColors, onSelect, quality, night, autoOrbit, ambientEvents,
                profile }   // profile: optional per-city art direction, era keys over base (see _prof)
     City3D.setSelected(propertyId)
     City3D.updateProperty(prop, { animate })
     City3D.focus(propertyId)
     City3D.setEra(era, fadeMs)
     City3D.setNight(0..1)
     City3D.setAutoOrbit(bool|speed)
     City3D.destroy()

   Property shape (all optional — missing fields fall back):
     { id, type, model3d, era, ownerId:'player'|'rival:<id>'|null, condition:0..100|string,
       renovation:{tier,yearsLeft}|null, isListing, name }

   City definition helpers used by js/cities/*.js are preserved:
     bx, cy, sphr, gabledRoof, hipRoof, flatPlane, makeLabel, _addWinSimple, M.*
   ======================================== */

var City3D = {

  // ───────────────────────────── Era palettes ─────────────────────────────
  ERA_ORDER: ['victorian', 'gilded', 'crisis', 'boom', 'modern', 'digital'],

  ERAS: {
    victorian: { label: 'Victorian', years: '1850',
      walls: [0x6e4034, 0x7c4a3b, 0x5c3b32, 0x86563f], lux: [0xcdbfa3, 0xbfb094, 0xd6c8ac],
      roofs: [0x3a3a44, 0x45444f, 0x2f2e36], trim: 0xd6c6a2, accent: 0x3c2822,
      glass: 0x55606c, glassOp: 1.0, led: null,
      ground: 0x2a2521, road: 0x242120, side: 0x3e3a34, park: 0x2d4a24,
      sky: ['#1d1630', '#6f3a2c', '#c8723b'], fog: 0x3a2c2a, haze: 0.55 },
    gilded: { label: 'Gilded Age', years: '1900',
      walls: [0xd9ccae, 0xcbbd9c, 0xe4d8bc, 0xbfae8c], lux: [0xf0e8d2, 0xe8dcbf, 0xf4ecd8],
      roofs: [0x4a5a60, 0x6b5a48, 0x3e4a52], trim: 0xe9c66a, accent: 0xb8923a,
      glass: 0x6c7c8c, glassOp: 1.0, led: null,
      ground: 0x2e2a26, road: 0x2a2724, side: 0x4a443c, park: 0x2f5228,
      sky: ['#1a1838', '#7a3f5a', '#e2955a'], fog: 0x3b2f3c, haze: 0.4 },
    crisis: { label: 'The Crisis', years: '1930',
      walls: [0x7d7d80, 0x6c6c70, 0x8e8c88, 0x5f5e62], lux: [0xa9a7a2, 0x9b9994, 0xb5b2ac],
      roofs: [0x3c3c40, 0x484848, 0x33343a], trim: 0x9c9a94, accent: 0x4b4a4e,
      glass: 0x4f5760, glassOp: 1.0, led: null,
      ground: 0x24242a, road: 0x202026, side: 0x38383e, park: 0x2a3e26,
      sky: ['#121420', '#3b3d4e', '#8b8a7e'], fog: 0x2f3038, haze: 0.7 },
    boom: { label: 'Post-war Boom', years: '1960',
      walls: [0xd8c6b0, 0xbfd3c8, 0xe3c9b6, 0xc9d2e4], lux: [0xf1e6d6, 0xf4dfc8, 0xe5ecf1],
      roofs: [0x8a7e74, 0x6f8a8c, 0x9c8a7c], trim: 0xf5efe4, accent: 0xd9a26b,
      glass: 0x6f93b4, glassOp: 0.95, led: null,
      ground: 0x2c2a2c, road: 0x25252a, side: 0x4c4a48, park: 0x2f5a2a,
      sky: ['#162040', '#5e4f7e', '#f0a060'], fog: 0x3a3450, haze: 0.3 },
    modern: { label: 'Modern', years: '2000',
      walls: [0x5f7489, 0x6f8294, 0x4f6478, 0x8c98a4], lux: [0xcfd8e0, 0xbcc8d4, 0xdfe6ec],
      roofs: [0x3c4a58, 0x4c5a68, 0x2e3a48], trim: 0xd8e2ea, accent: 0x9fb3c4,
      glass: 0x5a8ab8, glassOp: 0.9, led: null,
      ground: 0x1f2230, road: 0x1c1f2a, side: 0x3a3e4c, park: 0x2a5230,
      sky: ['#0c1430', '#3a3f70', '#d4845a'], fog: 0x1c2240, haze: 0.25 },
    digital: { label: 'Digital', years: '2030',
      walls: [0x26303c, 0x2d3844, 0x1f2a36, 0x344050], lux: [0xa9b9c9, 0x93a6b8, 0xbccbd8],
      roofs: [0x1b232c, 0x242d38, 0x161c24], trim: 0x9fe8ff, accent: 0x3ad6ff,
      glass: 0x2d6fb0, glassOp: 0.82, led: 0x37e2ff,
      ground: 0x151a26, road: 0x12161f, side: 0x2c3140, park: 0x22482c,
      sky: ['#05081a', '#1b2a66', '#8a4ea8'], fog: 0x101830, haze: 0.2 },
  },

  // City profiles (SKYLINE): optional per-city art direction. Resolved as
  // era-specific key > base > ERAS palette. Set via opts.profile or cityDef.profile.
  _profile: null, _profCache: null,

  _prof: function(era) {
    var p = this._profile;
    if (!p) return null;
    var c = this._profCache || (this._profCache = {});
    if (!c[era]) {
      var e = {}, k;
      if (p.base) for (k in p.base) e[k] = p.base[k];
      if (p[era]) for (k in p[era]) e[k] = p[era][k];
      if (e.water && p[era] && p[era].water) e.water = Object.assign({}, e.water, p[era].water);
      c[era] = e;
    }
    return c[era];
  },

  // Window colours
  WIN_LIT_PLAYER: 0xffd082,   // warm (SKYLINE-4: warmed so player windows read at deep dusk)
  WIN_LIT_RIVAL: 0xbfe2ff,    // cool
  WIN_LIT_NONE: 0xf2d6a4,     // neutral
  WIN_DIM: 0x1c2733,
  WIN_BOARD: 0x4a3826,
  WIN_BROKEN: 0x07090c,

  // ───────────────────────────── Shared materials ─────────────────────────────
  M: null,

  initMaterials: function() {
    if (this.M) return;
    var DS = THREE.DoubleSide;
    function ph(c, o) { return new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 40 }, o || {})); }
    function lb(c, o) { return new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }
    this.M = {
      // Legacy type materials (kept for city files that reference them)
      HOw: ph(0xb87050), HOr: ph(0xa83020, { side: DS }), HOt: ph(0x8a6a48),
      STw: ph(0x9898a8), STr: ph(0x787888, { side: DS }),
      APw: ph(0x906878), APr: ph(0x8a80a8), APt: ph(0xc0a0b8),
      PHw: ph(0x6078a0, { transparent: true, opacity: 0.94 }), PHr: ph(0x80a0c8, { transparent: true, opacity: 0.94 }), PHt: ph(0xa0c0e0),
      THw: ph(0x8a5c3a), THr: ph(0x4a280e, { side: DS }), THt: ph(0xe0b850),
      VIw: ph(0xe0c890), VIr: ph(0xc07828, { side: DS }),
      MNw: ph(0xddd8c0), MNr: ph(0x607858, { side: DS }), MNt: ph(0xfafaf0, { emissive: 0x080808 }),
      CMw: ph(0xc87840), CMt: ph(0xffa040),
      WRw: ph(0x6a7868), WRr: ph(0x7a9880, { side: DS }),
      SKw: ph(0x7090b0, { transparent: true, opacity: 0.95 }), SKr: ph(0x90b0d0, { transparent: true, opacity: 0.95 }), SKt: ph(0xc0e0f8),
      CONC: ph(0x8a8690, { shininess: 10 }), BRICK: ph(0x905a38), SOL: ph(0x70a870),
      WIN: lb(0xd8f0ff, { emissive: 0x3a5070 }),
      WINLIT: lb(0xffe8a0, { emissive: 0x503800 }),
      WINOFF: lb(0x131c26),
      // Terrain (colours are re-tinted per era)
      GND: lb(0x1f2230), ROAD: lb(0x1c1f2a), LANE: lb(0xb0a070, { transparent: true, opacity: 0.35 }),
      SIDEW: lb(0x3a3e4c), CURB: lb(0x50546a),
      PARK: lb(0x2a5230), PARKD: lb(0x1e4426), PARKL: lb(0x3a6a38),
      PARKBLOSSOM: lb(0xd989ad),
      WATER: ph(0x0e2a48, { transparent: true, opacity: 0.9, shininess: 120, specular: 0x6688aa }),
      HARBOR: ph(0x081c34, { transparent: true, opacity: 0.92, shininess: 120, specular: 0x6688aa }),
      COUNTRY: lb(0x4e7a30), COUNTRYD: lb(0x3a5c20),
      LOT: lb(0x2b2e3a),
      LAMP: new THREE.MeshBasicMaterial({ color: 0xffe2a0 }),
      LAMPNEON_C: new THREE.MeshBasicMaterial({ color: 0x37e2ff }),
      LAMPNEON_M: new THREE.MeshBasicMaterial({ color: 0xff3ad6 }),
      // FX
      SCAFFOLD: ph(0xd0a040, { shininess: 60 }),
      NET: lb(0x9fbf8a, { transparent: true, opacity: 0.32, side: DS, depthWrite: false }),
      CRANE: ph(0xe8c030, { shininess: 50 }),
      FLOOD_FX: ph(0x1050e0, { emissive: 0x001880, transparent: true, opacity: 0.48 }),
      FLAGPOLE: ph(0xd8d8e0, { shininess: 90 }),
      SIGNPOST: lb(0x5a4a3a),
    };
    this._eraTerrainKeys = { ground: 'GND', road: 'ROAD', side: 'SIDEW', park: 'PARK' };
    // Original water colours, restored whenever no profile overrides them
    this._waterDefaults = {
      WATER: { color: this.M.WATER.color.getHex(), specular: this.M.WATER.specular.getHex(), opacity: this.M.WATER.opacity },
      HARBOR: { color: this.M.HARBOR.color.getHex(), specular: this.M.HARBOR.specular.getHex(), opacity: this.M.HARBOR.opacity },
    };
  },

  // ───────────────────────────── Geometry helpers ─────────────────────────────
  bx: function(w, h, d, m, sh) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    if (sh !== false) { mesh.castShadow = true; mesh.receiveShadow = true; }
    return mesh;
  },
  cy: function(rt, rb, h, seg, m) {
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    mesh.castShadow = true;
    return mesh;
  },
  sphr: function(r, seg, m) {
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.ceil(seg * 0.6)), m);
    mesh.castShadow = true;
    return mesh;
  },
  gabledRoof: function(w, h, d, m) {
    var sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath();
    var geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    var mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = true;
    return mesh;
  },
  hipRoof: function(w, h, d, m) {
    var hw = w / 2, hd = d / 2;
    var pos = new Float32Array([
      -hw, 0, -hd, hw, 0, -hd, 0, h, 0,
      hw, 0, -hd, hw, 0, hd, 0, h, 0,
      hw, 0, hd, -hw, 0, hd, 0, h, 0,
      -hw, 0, hd, -hw, 0, -hd, 0, h, 0
    ]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    var mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = true;
    return mesh;
  },
  flatPlane: function(w, d, m) {
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  },

  // Merge a list of meshes (same material) into one BufferGeometry, applying each mesh's local matrix.
  _mergeMeshes: function(meshes) {
    var pos = [], nor = [], uv = [];
    var tmpN = new THREE.Matrix3();
    meshes.forEach(function(m) {
      m.updateMatrix();
      var g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
      var p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      tmpN.getNormalMatrix(m.matrix);
      var v = new THREE.Vector3();
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m.matrix); pos.push(v.x, v.y, v.z);
        if (n) { v.fromBufferAttribute(n, i).applyMatrix3(tmpN).normalize(); nor.push(v.x, v.y, v.z); } else nor.push(0, 1, 0);
        if (u) uv.push(u.getX(i), u.getY(i)); else uv.push(0, 0);
      }
      if (g !== m.geometry) g.dispose();
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geo;
  },

  // Flatten a group of meshes into per-material batches (static geometry only).
  _batchGroup: function(group, batches) {
    group.updateMatrixWorld(true);
    var self = this;
    group.traverse(function(m) {
      if (!m.isMesh) return;
      var key = m.material.uuid;
      if (!batches[key]) batches[key] = { mat: m.material, meshes: [], shadow: false };
      var clone = new THREE.Mesh(m.geometry, m.material);
      clone.matrix.copy(m.matrixWorld);
      clone.matrixAutoUpdate = false;
      clone.updateMatrix = function() {};
      batches[key].meshes.push(clone);
      if (m.castShadow) batches[key].shadow = true;
    });
  },

  _flushBatches: function(batches, parent) {
    var out = [];
    for (var k in batches) {
      var b = batches[k];
      var geo = this._mergeMeshes(b.meshes);
      var mesh = new THREE.Mesh(geo, b.mat);
      mesh.receiveShadow = true; mesh.castShadow = b.shadow;
      mesh.userData.terrain = true;
      parent.add(mesh); out.push(mesh);
    }
    return out;
  },

  // ───────────────────────────── Canvas textures ─────────────────────────────
  _canvasTex: function(cv) {
    var t = new THREE.CanvasTexture(cv);
    t.anisotropy = 4; t.minFilter = THREE.LinearFilter; t.encoding = THREE.sRGBEncoding;
    if (this._textures) this._textures.push(t);
    return t;
  },

  // Landmark label sprite (dark pill, gold hairline, serif caption)
  makeLabel: function(text) {
    text = String(text).replace(/^[^\w(]+/, '');
    var cv = document.createElement('canvas');
    cv.width = 320; cv.height = 72;
    var c2 = cv.getContext('2d');
    c2.font = '700 30px "Playfair Display", Georgia, serif';
    var tw = Math.min(300, c2.measureText(text).width + 44);
    var x0 = (320 - tw) / 2;
    c2.fillStyle = 'rgba(8,10,18,.82)';
    c2.beginPath(); c2.roundRect ? c2.roundRect(x0, 14, tw, 44, 8) : c2.rect(x0, 14, tw, 44); c2.fill();
    c2.strokeStyle = 'rgba(214,176,86,.85)'; c2.lineWidth = 1.5;
    c2.beginPath(); c2.roundRect ? c2.roundRect(x0 + 0.75, 14.75, tw - 1.5, 42.5, 7) : c2.rect(x0, 14, tw, 44); c2.stroke();
    c2.fillStyle = '#f3e3b0'; c2.textAlign = 'center'; c2.textBaseline = 'middle';
    c2.fillText(text, 160, 37);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._canvasTex(cv), transparent: true, depthTest: false, depthWrite: false }));
    s.scale.set(30, 6.75, 1);
    s.userData.label = true;
    s.renderOrder = 10;
    return s;
  },

  _glowTex: function() {
    if (this._glowTexCache) return this._glowTexCache;
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var c = cv.getContext('2d'); var g = c.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    this._glowTexCache = this._canvasTex(cv); this._glowTexCache._keep = true;
    return this._glowTexCache;
  },

  // FOR SALE board texture
  _saleTex: function() {
    if (this._saleTexCache) return this._saleTexCache;
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    var c = cv.getContext('2d');
    c.fillStyle = '#f7f1e4'; c.fillRect(0, 0, 256, 128);
    c.strokeStyle = '#8c1d1d'; c.lineWidth = 10; c.strokeRect(5, 5, 246, 118);
    c.fillStyle = '#8c1d1d'; c.fillRect(14, 14, 228, 56);
    c.fillStyle = '#fff8ea'; c.font = '800 40px Nunito, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('FOR SALE', 128, 43);
    c.fillStyle = '#2b2b2b'; c.font = '700 24px Nunito, Arial, sans-serif';
    c.fillText('ENQUIRE WITHIN', 128, 96);
    this._saleTexCache = this._canvasTex(cv);
    this._saleTexCache._keep = true;
    return this._saleTexCache;
  },

  // ───────────────────────────── Skins ─────────────────────────────
  LUX_TYPES: { MN: 1, VI: 1, PH: 1 },
  GLASS_TYPES: { SK: 1, PH: 1 },

  _condNum: function(c) {
    if (typeof c === 'number') return Math.max(0, Math.min(100, c));
    var map = { derelict: 10, poor: 35, fair: 60, good: 75, excellent: 92, prime: 95 };
    return map[c] != null ? map[c] : 70;
  },

  _hash: function(a, b) { var h = (a * 73856093) ^ (b * 19349663); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },

  // Target colours for a building's roles in a given era
  _skinColors: function(era, typeKey, seed, cond) {
    var P = this.ERAS[era] || this.ERAS.modern;
    var vi = Math.floor(seed * 3.999);
    var lux = !!this.LUX_TYPES[typeKey];
    var glassy = !!this.GLASS_TYPES[typeKey] && (era === 'modern' || era === 'digital' || era === 'boom');
    var wall = new THREE.Color(lux ? P.lux[vi % P.lux.length] : P.walls[vi]);
    var roof = new THREE.Color(P.roofs[vi % P.roofs.length]);
    var trim = new THREE.Color(P.trim), accent = new THREE.Color(P.accent), glass = new THREE.Color(P.glass);
    if (glassy) { wall.copy(glass).lerp(new THREE.Color(0xffffff), 0.08); }
    // Condition: desaturate + darken when poor
    var c = this._condNum(cond);
    if (c < 50) {
      var k = (50 - c) / 50;   // 0..1
      [wall, roof, trim, accent].forEach(function(col) {
        var hsl = {}; col.getHSL(hsl);
        col.setHSL(hsl.h, hsl.s * (1 - 0.75 * k), hsl.l * (1 - 0.35 * k));
      });
    }
    // profile wall-tint variance (toy-model directions): jitter lightness by seed
    var pr = this._prof(era);
    if (pr && pr.wallJitter) {
      var hj = {}; wall.getHSL(hj);
      wall.setHSL(hj.h, hj.s, Math.max(0, Math.min(1, hj.l + (seed - 0.5) * pr.wallJitter)));
    }
    return { wall: wall, roof: roof, trim: trim, accent: accent, glass: glass, glassOp: glassy ? P.glassOp : 1, led: P.led, glassy: glassy };
  },

  _makeSkin: function(era, typeKey, seed, cond) {
    var c = this._skinColors(era, typeKey, seed, cond);
    var mk = function(col, o) { var m = new THREE.MeshPhongMaterial(Object.assign({ color: col, shininess: 30 }, o || {})); m.userData.role = true; return m; };
    var sk = {
      wall: mk(c.wall, c.glassy ? { transparent: true, opacity: c.glassOp, shininess: 110, specular: 0x88aacc } : { shininess: 18 }),
      roof: mk(c.roof, { side: THREE.DoubleSide, shininess: 12 }),
      trim: mk(c.trim, { shininess: 60 }),
      accent: mk(c.accent, { shininess: 50 }),
      glass: mk(c.glass, { transparent: true, opacity: 0.9, shininess: 120, specular: 0x99bbdd }),
      led: null,
      era: era, typeKey: typeKey, seed: seed, cond: cond,
    };
    if (c.led) sk.led = new THREE.MeshBasicMaterial({ color: c.led });
    sk.list = [sk.wall, sk.roof, sk.trim, sk.accent, sk.glass];
    return sk;
  },

  // Re-target a skin's colours to a new era (lerped by the animation loop)
  _retargetSkin: function(sk, era, ms) {
    var c = this._skinColors(era, sk.typeKey, sk.seed, sk.cond);
    var pairs = [[sk.wall, c.wall], [sk.roof, c.roof], [sk.trim, c.trim], [sk.accent, c.accent], [sk.glass, c.glass]];
    var fades = this._fades;
    pairs.forEach(function(p) {
      fades.push({ m: p[0], from: p[0].color.clone(), to: p[1], t: 0, ms: ms });
    });
    if (sk.wall.transparent) fades.push({ m: sk.wall, fromOp: sk.wall.opacity, toOp: c.glassOp, t: 0, ms: ms });
    sk.era = era;
  },

  // ───────────────────────────── Windows (merged quads, vertex colours) ─────────────────────────────
  // Adds one merged window mesh to g covering 4 faces. Preserved signature for city files.
  _addWinSimple: function(g, bw, bh, bd, floors, wpf, startY, litColor) {
    startY = startY || 0;
    var fh = bh / floors, ws = Math.min(2.8, fh * 0.5), wh = fh * 0.52, off = 0.14;
    var pos = [], nor = [], col = [], idx = [];
    var count = 0;
    var rng = this._winRng || Math.random;
    var states = [];
    function quad(cx, cy, cz, ax, ay, az, bxx, byy, bzz, nx, ny, nz) {
      // centre c, half axes a (width) and b (height)
      var base = pos.length / 3;
      pos.push(cx - ax - bxx, cy - ay - byy, cz - az - bzz,
               cx + ax - bxx, cy + ay - byy, cz + az - bzz,
               cx + ax + bxx, cy + ay + byy, cz + az + bzz,
               cx - ax + bxx, cy - ay + byy, cz - az + bzz);
      for (var k = 0; k < 4; k++) { nor.push(nx, ny, nz); col.push(0.1, 0.15, 0.2); }
      if (nx + nz > 0) idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
      count++;
    }
    for (var f = 0; f < floors; f++) {
      var fy = startY + fh * (f + 0.5);
      for (var i = 0; i < wpf; i++) {
        var u = (i + 1) / (wpf + 1), wx = -bw / 2 + u * bw, wz = -bd / 2 + u * bd;
        quad(wx, fy, -bd / 2 - off, ws / 2, 0, 0, 0, wh / 2, 0, 0, 0, -1);
        quad(wx, fy, bd / 2 + off, ws / 2, 0, 0, 0, wh / 2, 0, 0, 0, 1);
        quad(-bw / 2 - off, fy, wz, 0, 0, ws / 2, 0, wh / 2, 0, -1, 0, 0);
        quad(bw / 2 + off, fy, wz, 0, 0, ws / 2, 0, wh / 2, 0, 1, 0, 0);
      }
    }
    for (var w = 0; w < count; w++) states.push({ th: 0.08 + rng() * 0.7, kind: 0, on: 0, fl: 0 }); // SKYLINE-4: ~75% lit at night 0.6, ~90% at 0.72
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    var mat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: true, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.userData.win = { states: states, lit: new THREE.Color(litColor || this.WIN_LIT_NONE), dirty: true, boarded: false };
    mesh.userData.role = 'win';
    g.add(mesh);
    if (this._winMeshes) this._winMeshes.push(mesh);
    return mesh;
  },

  // Configure a window mesh for owner / condition
  _dressWindows: function(mesh, litHex, cond) {
    var W = mesh.userData.win; if (!W) return;
    W.lit.setHex(litHex);
    var c = this._condNum(cond);
    var rng = this._winRng || Math.random;
    W.boarded = c < 20;
    W.states.forEach(function(s) {
      s.kind = 0;
      if (c < 20) s.kind = 1;                         // boarded
      else if (c < 50 && rng() < (50 - c) / 50 * 0.6) s.kind = 2; // broken
      else if (rng() < 0.12) s.kind = 3;              // permanently dark (tenant away)
    });
    W.dirty = true;
  },

  _updateWindows: function(night, ts) {
    var meshes = this._winMeshes; if (!meshes) return;
    var dim = new THREE.Color(this.WIN_DIM), board = new THREE.Color(this.WIN_BOARD), broken = new THREE.Color(this.WIN_BROKEN);
    var tmp = new THREE.Color();
    // SKYLINE-4: deep dusk (night >= 0.6) makes lit windows burn brighter (intensity only,
    // no sprites — the lit ratio itself is set at build time via the threshold range)
    var glow = night >= 0.6 ? 1.3 : 1;
    for (var mi = 0; mi < meshes.length; mi++) {
      var mesh = meshes[mi], W = mesh.userData.win;
      var attr = mesh.geometry.attributes.color;
      var changed = W.dirty;
      for (var i = 0; i < W.states.length; i++) {
        var s = W.states[i], want;
        if (s.kind === 1) want = -1;           // boarded
        else if (s.kind === 2) want = -2;      // broken
        else if (s.kind === 3) want = 0;
        else want = night > s.th ? 1 : 0;
        var cur = s.on;
        if (want === 1 && cur < 1) {
          // flicker on over ~400ms
          if (!s.fl) s.fl = ts;
          var p = (ts - s.fl) / 420;
          cur = p >= 1 ? 1 : (Math.sin(p * 37) > 0.1 ? 0.6 + 0.4 * p : 0.08);
          changed = true;
        } else if (want === 0 && cur !== 0) { cur = 0; s.fl = 0; changed = true; }
        else if (want === 1 && cur === 1 && W.dirty) { changed = true; }
        if (want < 0) { cur = want; s.fl = 0; }
        if (cur !== s.on || W.dirty) {
          s.on = cur;
          if (cur === -1) tmp.copy(board);
          else if (cur === -2) tmp.copy(broken);
          else if (cur <= 0) tmp.copy(dim);
          else { tmp.copy(dim).lerp(W.lit, cur); if (glow > 1) tmp.multiplyScalar(glow); }
          for (var k = 0; k < 4; k++) attr.setXYZ(i * 4 + k, tmp.r, tmp.g, tmp.b);
          changed = true;
        }
      }
      if (changed) attr.needsUpdate = true;
      W.dirty = false;
    }
  },

  // ───────────────────────────── Building factories ─────────────────────────────
  // Each returns a THREE.Group. s = seed 0-1, sk = skin materials.
  _bands: function(g, W, D, ys, h, mat) {
    var self = this, meshes = [];
    ys.forEach(function(y) { var b = self.bx(W + 0.12, h, D + 0.12, mat, false); b.position.y = y; meshes.push(b); });
    var m = new THREE.Mesh(this._mergeMeshes(meshes), mat); m.castShadow = false; g.add(m);
    meshes.forEach(function(b) { b.geometry.dispose(); });
    return m;
  },

  _mullions: function(g, W, H, D, n, mat, y0) {
    var self = this, meshes = [];
    y0 = y0 || 0;
    for (var i = 1; i < n; i++) {
      var x = -W / 2 + i * (W / n), z = -D / 2 + i * (D / n);
      [[x, D / 2 + 0.1], [x, -D / 2 - 0.1]].forEach(function(a) { var mu = self.bx(0.26, H, 0.26, mat, false); mu.position.set(a[0], y0 + H / 2, a[1]); meshes.push(mu); });
      [[W / 2 + 0.1, z], [-W / 2 - 0.1, z]].forEach(function(a) { var mu = self.bx(0.26, H, 0.26, mat, false); mu.position.set(a[0], y0 + H / 2, a[1]); meshes.push(mu); });
    }
    var m = new THREE.Mesh(this._mergeMeshes(meshes), mat); m.castShadow = false; g.add(m);
    meshes.forEach(function(b) { b.geometry.dispose(); });
    return m;
  },

  buildHouse: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 13, H = 7 + s * 3, D = 11;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    this._bands(g, W, D, [H * 0.5], 0.3, sk.accent);
    var roof = this.gabledRoof(W + 1, H * 0.6, D + 1, sk.roof); roof.position.y = H; g.add(roof);
    var ridge = this.bx(W + 1, 0.3, 0.5, sk.trim, false); ridge.position.set(0, H + H * 0.6 - 0.1, 0); g.add(ridge);
    var ch = this.bx(1.8, 5, 1.8, sk.accent); ch.position.set(W * 0.25, H + H * 0.3, 0); g.add(ch);
    var door = this.bx(1.8, 2.8, 0.25, M.WINOFF, false); door.position.set(0, 1.4, -D / 2 - 0.13); g.add(door);
    var step = this.bx(2.8, 0.4, 1.6, M.CONC); step.position.set(0, 0.2, -D / 2 - 1.2); g.add(step);
    this._addWinSimple(g, W, H, D, Math.max(1, Math.floor(H / 5)), 2);
    g.userData.dims = { W: W, H: H + H * 0.6, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildStudio: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 12, H = 12 + s * 3, D = 12;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    var par = this.bx(W + 0.8, 1.1, D + 0.8, sk.trim); par.position.y = H + 0.55; g.add(par);
    var slab = this.bx(W - 0.6, 0.4, D - 0.6, sk.roof); slab.position.y = H + 1.3; g.add(slab);
    var box = this.bx(3.5, 2.4, 3, sk.accent); box.position.set(W * 0.22, H + 2.3, D * 0.22); g.add(box);
    this._bands(g, W, D, [H * 0.33, H * 0.66], 0.26, sk.accent);
    this._addWinSimple(g, W, H, D, Math.max(2, Math.floor(H / 5.5)), 2);
    g.userData.dims = { W: W, H: H + 2, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildApartment: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 15, H = 28 + s * 12, D = 13;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    var sb = this.bx(W * 0.78, H * 0.22, D * 0.78, sk.wall); sb.position.y = H + H * 0.11; g.add(sb);
    var cor = this.bx(W + 0.9, 1, D + 0.9, sk.trim, false); cor.position.y = H + 0.5; g.add(cor);
    var cor2 = this.bx(W * 0.78 + 0.8, 0.8, D * 0.78 + 0.8, sk.trim, false); cor2.position.y = H + H * 0.22 + 0.4; g.add(cor2);
    var ys = []; var floors = Math.floor(H / 6.5); for (var i = 1; i < floors; i++) ys.push(i * (H / floors));
    this._bands(g, W, D, ys, 0.22, sk.accent);
    var tank = this.cy(1.8, 1.8, 3.6, 10, sk.accent); tank.position.set(-W * 0.25, H + H * 0.22 + 1.8, -D * 0.2); g.add(tank);
    this._addWinSimple(g, W, H, D, floors, 3);
    g.userData.dims = { W: W, H: H + H * 0.22 + 4, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildPenthouse: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 17, H = 44 + s * 16, D = 15;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    this._mullions(g, W, H, D, 5, sk.trim);
    var mid = this.bx(W * 0.74, H * 0.3, D * 0.74, sk.wall); mid.position.y = H + H * 0.15; g.add(mid);
    var top = this.bx(W * 0.46, H * 0.14, D * 0.46, sk.trim); top.position.y = H + H * 0.3 + H * 0.07; g.add(top);
    var crown = this.bx(W * 0.74 + 1, 0.9, D * 0.74 + 1, sk.trim, false); crown.position.y = H + 0.45; g.add(crown);
    var spire = this.cy(0, 0.9, 18, 6, sk.trim); spire.position.y = H + H * 0.44 + 9; g.add(spire);
    this._addWinSimple(g, W, H, D, Math.floor(H / 7), 4);
    if (sk.led) { var led = this.bx(W + 0.3, 0.5, D + 0.3, sk.led, false); led.position.y = H - 0.5; g.add(led); led.userData.role = 'led'; }
    g.userData.dims = { W: W, H: H + H * 0.44 + 18, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildTownhouse: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 11, H = 20 + s * 6, D = 13;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    this._bands(g, W, D, [H * 0.25, H * 0.5, H * 0.75], 0.3, sk.trim);
    var roof = this.gabledRoof(W + 0.6, H * 0.28, D + 0.6, sk.roof); roof.position.y = H; g.add(roof);
    var ch = this.bx(1.6, 4, 1.6, sk.accent); ch.position.set(-W * 0.3, H + H * 0.14, 0); g.add(ch);
    var stoop = this.bx(W * 0.5, 1.4, 3.2, M.CONC); stoop.position.set(0, 0.7, -D / 2 - 1.6); g.add(stoop);
    var door = this.bx(1.8, 3, 0.25, M.WINOFF, false); door.position.set(0, 2.9, -D / 2 - 0.13); g.add(door);
    this._addWinSimple(g, W, H, D, Math.floor(H / 5.5), 2);
    g.userData.dims = { W: W, H: H + H * 0.28, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildVilla: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 18, H = 16 + s * 6, D = 15;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    var roof = this.hipRoof(W + 1.2, H * 0.42, D + 1.2, sk.roof); roof.position.y = H; g.add(roof);
    var ch = this.bx(2, 5, 2, sk.accent); ch.position.set(W * 0.24, H + H * 0.3, 0); g.add(ch);
    var self = this;
    [-W * 0.3, W * 0.3].forEach(function(px) {
      var col = self.cy(0.55, 0.55, H * 0.44, 10, sk.trim); col.position.set(px, H * 0.22, -D / 2 - 1); g.add(col);
    });
    var porch = this.bx(W * 0.72, 0.8, 3, sk.trim); porch.position.set(0, H * 0.44 + 0.4, -D / 2 - 1); g.add(porch);
    var terrace = this.bx(W + 4, 0.5, D + 4, M.CONC); terrace.position.y = 0.25; g.add(terrace);
    this._addWinSimple(g, W, H, D, Math.floor(H / 6), 2);
    g.userData.dims = { W: W + 4, H: H + H * 0.42, D: D + 4 }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildMansion: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 22, H = 26 + s * 6, D = 18;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    var self = this;
    [[-W * 0.54, 0], [W * 0.54, 0]].forEach(function(a) {
      var wing = self.bx(W * 0.38, H * 0.6, D * 0.66, sk.wall); wing.position.set(a[0], H * 0.3, 0); g.add(wing);
      var wr = self.hipRoof(W * 0.38 + 0.8, H * 0.17, D * 0.66 + 0.8, sk.roof); wr.position.set(a[0], H * 0.6, 0); g.add(wr);
    });
    var mainRoof = this.hipRoof(W + 1, H * 0.22, D + 1, sk.roof); mainRoof.position.y = H; g.add(mainRoof);
    var cor = this.bx(W + 1, 0.9, D + 1, sk.trim, false); cor.position.y = H + 0.45; g.add(cor);
    var cols = [];
    for (var i = 0; i < 5; i++) {
      var u = (i + 0.5) / 5;
      var col = this.cy(0.65, 0.65, H * 0.38, 10, sk.trim); col.position.set(-W / 2 + u * W, H * 0.19, -D / 2 - 1.2); cols.push(col);
    }
    var cm = new THREE.Mesh(this._mergeMeshes(cols), sk.trim); cm.castShadow = true; g.add(cm); cols.forEach(function(c) { c.geometry.dispose(); });
    var entab = this.bx(W + 0.4, 1.8, 2.6, sk.trim, false); entab.position.set(0, H * 0.38 + 0.9, -D / 2 - 1.2); g.add(entab);
    var ped = this.gabledRoof(W + 0.4, 3.5, 2.6, sk.trim); ped.position.set(0, H * 0.38 + 1.8, -D / 2 - 1.2); g.add(ped);
    this._addWinSimple(g, W, H, D, Math.floor(H / 7), 3);
    g.userData.dims = { W: W * 1.46, H: H + H * 0.22, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildCommercial: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 18, H = 9 + s * 3, D = 15;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    var par = this.bx(W + 0.5, 1.4, D + 0.5, sk.trim, false); par.position.y = H + 0.7; g.add(par);
    var awn = this.bx(W * 0.88, 0.5, 3.6, sk.accent); awn.rotation.x = 0.18; awn.position.set(0, H * 0.42, -D / 2 - 1.7); g.add(awn);
    var sign = this.bx(W * 0.8, H * 0.2, 0.3, sk.accent, false); sign.position.set(0, H * 0.72, -D / 2 - 0.15); g.add(sign);
    var glass = this.bx(W * 0.85, H * 0.32, 0.18, sk.glass, false); glass.position.set(0, H * 0.18, -D / 2 - 0.1); g.add(glass);
    this._addWinSimple(g, W, H * 0.5, D, 1, 3, H * 0.5);
    if (sk.led) { var led = this.bx(W * 0.8, 0.35, 0.35, sk.led, false); led.position.set(0, H * 0.72 + H * 0.1 + 0.2, -D / 2 - 0.2); g.add(led); }
    g.userData.dims = { W: W, H: H + 1.4, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildWarehouse: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 21, H = 12 + s * 4, D = 19;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    var ys = []; for (var i = 1; i < 6; i++) ys.push(i * (H / 6));
    this._bands(g, W, D, ys, 0.18, sk.accent);
    var roof = this.gabledRoof(W + 0.6, H * 0.3, D + 0.6, sk.roof); roof.position.y = H; g.add(roof);
    var sky = this.bx(W * 0.5, 0.3, 2.2, sk.glass, false); sky.rotation.x = 0.55; sky.position.set(0, H + H * 0.16, -2.2); g.add(sky);
    var dock = this.bx(W * 0.36, 2.4, 4.2, M.CONC); dock.position.set(-W * 0.2, 1.2, -D / 2 - 2.1); g.add(dock);
    var dockD = this.bx(W * 0.28, 2.2, 0.28, M.WINOFF, false); dockD.position.set(-W * 0.2, 1.1, -D / 2 - 0.14); g.add(dockD);
    var ch = this.cy(0.9, 1.1, 10, 8, sk.accent); ch.position.set(W * 0.35, H + 4, D * 0.3); g.add(ch);
    this._addWinSimple(g, W, H * 0.5, D, 1, 4, H * 0.5);
    g.userData.dims = { W: W, H: H + H * 0.3, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildSkyscraper: function(s, sk) {
    var g = new THREE.Group(), M = this.M;
    var W = 16, H = 50 + s * 18, D = 14;
    var body = this.bx(W, H, D, sk.wall); body.position.y = H / 2; g.add(body);
    this._mullions(g, W, H, D, 5, sk.trim);
    var s1 = this.bx(W * 0.76, H * 0.28, D * 0.76, sk.wall); s1.position.y = H + H * 0.14; g.add(s1);
    var s2 = this.bx(W * 0.5, H * 0.16, D * 0.5, sk.wall); s2.position.y = H + H * 0.28 + H * 0.08; g.add(s2);
    var c1 = this.bx(W + 0.8, 0.8, D + 0.8, sk.trim, false); c1.position.y = H + 0.4; g.add(c1);
    var c2 = this.bx(W * 0.76 + 0.8, 0.7, D * 0.76 + 0.8, sk.trim, false); c2.position.y = H + H * 0.28 + 0.35; g.add(c2);
    var spire = this.cy(0, 1.1, 20, 6, sk.trim); spire.position.y = H + H * 0.44 + 10; g.add(spire);
    this._addWinSimple(g, W, H, D, Math.floor(H / 8), 4);
    this._addWinSimple(g, W * 0.76, H * 0.28, D * 0.76, 2, 3, H);
    if (sk.led) {
      [H, H + H * 0.28].forEach(function(y, i) { var w = i ? W * 0.76 : W, d = i ? D * 0.76 : D; var led = City3D.bx(w + 0.3, 0.45, d + 0.3, sk.led, false); led.position.y = y - 0.6; g.add(led); });
    }
    g.userData.dims = { W: W, H: H + H * 0.44 + 20, D: D }; g.userData.roofY = H; g.userData.bodyW = W; g.userData.bodyD = D;
    return g;
  },

  buildByType: function(typeKey, seed, skin) {
    var sk = skin || this._makeSkin(this._era || 'modern', this._normType(typeKey), seed, 80);
    switch (typeKey) {
      case 'house': case 'HO': return this.buildHouse(seed, sk);
      case 'studio': case 'ST': return this.buildStudio(seed, sk);
      case 'apartment': case 'AP': return this.buildApartment(seed, sk);
      case 'penthouse': case 'PH': return this.buildPenthouse(seed, sk);
      case 'townhouse': case 'TH': return this.buildTownhouse(seed, sk);
      case 'villa': case 'VI': return this.buildVilla(seed, sk);
      case 'mansion': case 'MN': return this.buildMansion(seed, sk);
      case 'commercial': case 'CM': return this.buildCommercial(seed, sk);
      case 'warehouse': case 'WR': return this.buildWarehouse(seed, sk);
      case 'skyscraper': case 'SK': return this.buildSkyscraper(seed, sk);
      default: return this.buildStudio(seed, sk);
    }
  },

  _normType: function(k) { return this.PROP_TO_3D[k] || k; },

  BNAMES: {
    HO: 'House', ST: 'Studio', AP: 'Apartment', PH: 'Penthouse',
    TH: 'Townhouse', VI: 'Villa', MN: 'Mansion', CM: 'Commercial',
    WR: 'Warehouse', SK: 'Skyscraper'
  },
  BLDG_TYPES: new Set(['HO', 'ST', 'AP', 'PH', 'TH', 'VI', 'MN', 'CM', 'WR', 'SK']),
  PROP_TO_3D: { house: 'HO', studio: 'ST', apartment: 'AP', penthouse: 'PH',
    townhouse: 'TH', villa: 'VI', mansion: 'MN', commercial: 'CM', warehouse: 'WR',
    land: 'CT', skyscraper: 'SK' },

  EVENTS: {
    FIRE:       { c: '#ff6010', n: 'Fire',       d: [8000, 14000] },
    FLOOD:      { c: '#2090ff', n: 'Flood',      d: [10000, 20000] },
    STORM:      { c: '#8090e0', n: 'Storm',      d: [6000, 12000] },
    EARTHQUAKE: { c: '#c09050', n: 'Earthquake', d: [3000, 7000] },
    RENOVATION: { c: '#e0a020', n: 'Renovation', d: [12000, 25000] },
    BURGLARY:   { c: '#a040f0', n: 'Burglary',   d: [5000, 10000] },
  },

  // ───────────────────────────── Dressing: ownership, listing, renovation, condition ─────────────────────────────
  _ownerColor: function(prop) {
    var o = this._opts || {};
    if (!prop || !prop.ownerId) return null;
    if (prop.ownerId === 'player') return o.playerColor || '#d4a84b';
    var rid = prop.ownerId.indexOf('rival:') === 0 ? prop.ownerId.slice(6) : prop.ownerId;
    return (o.rivalColors && (o.rivalColors[rid] || o.rivalColors[prop.ownerId])) || '#6b8fbf';
  },

  _dressBuilding: function(bg, prop, cell) {
    var dims = bg.userData.dims || { W: 14, H: 20, D: 14 };
    var M = this.M, self = this;
    var ownerCol = this._ownerColor(prop);
    var cond = prop ? this._condNum(prop.condition) : 80;
    var lit = !prop || !prop.ownerId ? this.WIN_LIT_NONE : (prop.ownerId === 'player' ? this.WIN_LIT_PLAYER : this.WIN_LIT_RIVAL);
    bg.traverse(function(m) { if (m.userData && m.userData.win) self._dressWindows(m, lit, cond); });
    var fx = new THREE.Group(); fx.userData.fx = true;
    bg.add(fx);

    // Ownership: lot frame, facade banner, roof flag
    if (ownerCol) {
      var col = new THREE.Color(ownerCol);
      var T = this.TILE;
      var frameMat = new THREE.MeshBasicMaterial({ color: col, toneMapped: false });
      var fw = T - 3.2, ft = 1.3;
      var fr = [];
      [[0, -fw / 2, fw, ft], [0, fw / 2, fw, ft], [-fw / 2, 0, ft, fw], [fw / 2, 0, ft, fw]].forEach(function(a) {
        var p = self.flatPlane(a[2], a[3], frameMat); p.position.set(a[0], 0.32, a[1]); fr.push(p);
      });
      var frame = new THREE.Mesh(this._mergeMeshes(fr), frameMat); frame.userData.ownerMat = true; fx.add(frame);
      fr.forEach(function(p) { p.geometry.dispose(); });
      // Banner (hanging from the top of the front face)
      var bh = Math.min(dims.H * 0.3, 14), bw = 2.6;
      var bMat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, toneMapped: false });
      var banner = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), bMat);
      banner.position.set(-dims.W * 0.25, dims.H * 0.62 - bh / 2 + 2, -dims.D / 2 - 0.45);
      fx.add(banner);
      var bar = this.bx(bw + 0.8, 0.3, 0.6, M.FLAGPOLE, false); bar.position.set(-dims.W * 0.25, dims.H * 0.62 + 2.1, -dims.D / 2 - 0.4); fx.add(bar);
      // Crown band around the roofline in the owner colour (readable from above)
      var top = bg.userData.roofY != null ? bg.userData.roofY : dims.H * 0.92;
      var bw2 = bg.userData.bodyW || dims.W, bd2 = bg.userData.bodyD || dims.D;
      var crown = this.bx(bw2 + 0.5, 1.1, bd2 + 0.5, bMat, false); crown.position.y = top - 0.9; fx.add(crown);
      // Flag on the roof
      var pole = this.cy(0.22, 0.22, 11, 5, M.FLAGPOLE); pole.position.set(bw2 * 0.3, top + 5.5, bd2 * 0.3); fx.add(pole);
      var flag = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 3.6), bMat);
      flag.position.set(bw2 * 0.3 + 3.2, top + 9.2, bd2 * 0.3);
      flag.userData.flag = true; fx.add(flag);
      var knob = this.sphr(0.45, 6, new THREE.MeshBasicMaterial({ color: 0xffe9a8 })); knob.position.set(bw2 * 0.3, top + 11.2, bd2 * 0.3); fx.add(knob);
      if (this._animated) this._animated.push(flag);
    }

    // Listing: FOR SALE board on a post, billboarded about Y, with pulse
    if (prop && prop.isListing) {
      var sg = new THREE.Group();
      var board = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: this._saleTex(), side: THREE.DoubleSide }));
      board.position.y = 10; sg.add(board);
      var back = this.bx(12.3, 6.3, 0.4, M.SIGNPOST, false); back.position.set(0, 10, -0.25); sg.add(back);
      [-4.2, 4.2].forEach(function(x) { var leg = self.bx(0.5, 7.2, 0.5, M.SIGNPOST); leg.position.set(x, 3.6, -0.25); sg.add(leg); });
      sg.userData.radius = Math.max(dims.W, dims.D) * 0.5 + 5;
      sg.userData.sign = true; sg.userData.phase = Math.random() * 6.28;
      fx.add(sg);
      if (this._signs) this._signs.push(sg);
    }

    // Renovation: scaffolding wrap (+ crane for rebuild)
    if (prop && prop.renovation) {
      var sw = dims.W + 2.4, sd = dims.D + 2.4, sh = Math.max(8, dims.H * (prop.renovation.tier === 'rebuild' ? 0.55 : 0.85));
      var parts = [];
      [[-sw / 2, -sd / 2], [sw / 2, -sd / 2], [sw / 2, sd / 2], [-sw / 2, sd / 2]].forEach(function(a) {
        var pp = self.bx(0.34, sh, 0.34, M.SCAFFOLD, false); pp.position.set(a[0], sh / 2, a[1]); parts.push(pp);
      });
      [[-sw / 4, -sd / 2], [sw / 4, -sd / 2], [-sw / 4, sd / 2], [sw / 4, sd / 2], [-sw / 2, 0], [sw / 2, 0]].forEach(function(a) {
        var pp = self.bx(0.3, sh, 0.3, M.SCAFFOLD, false); pp.position.set(a[0], sh / 2, a[1]); parts.push(pp);
      });
      var lv = Math.max(2, Math.ceil(sh / 6));
      for (var l = 1; l <= lv; l++) {
        var y = l * (sh / lv);
        [[sw, 0.26, 0.26, 0, -sd / 2], [sw, 0.26, 0.26, 0, sd / 2], [0.26, 0.26, sd, -sw / 2, 0], [0.26, 0.26, sd, sw / 2, 0]].forEach(function(a) {
          var h1 = self.bx(a[0], a[1], a[2], M.SCAFFOLD, false); h1.position.set(a[3], y, a[4]); parts.push(h1);
        });
        var deck = self.bx(sw, 0.18, 1.6, M.SCAFFOLD, false); deck.position.set(0, y - 0.1, -sd / 2 + 0.8); parts.push(deck);
      }
      var sm = new THREE.Mesh(this._mergeMeshes(parts), M.SCAFFOLD); sm.castShadow = true; fx.add(sm);
      parts.forEach(function(p) { p.geometry.dispose(); });
      // Netting on two faces
      var n1 = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), M.NET); n1.position.set(0, sh / 2, -sd / 2 - 0.2); fx.add(n1);
      var n2 = new THREE.Mesh(new THREE.PlaneGeometry(sd, sh), M.NET); n2.rotation.y = Math.PI / 2; n2.position.set(-sw / 2 - 0.2, sh / 2, 0); fx.add(n2);
      if (prop.renovation.tier === 'rebuild') {
        var cg = new THREE.Group();
        var mastH = (bg.userData.roofY || dims.H * 0.7) + 18;
        var mast = this.bx(1.6, mastH, 1.6, M.CRANE); mast.position.set(0, mastH / 2, 0); cg.add(mast);
        var jibG = new THREE.Group(); jibG.position.y = mastH;
        var jib = this.bx(30, 1.2, 1.2, M.CRANE); jib.position.x = 9; jibG.add(jib);
        var cjib = this.bx(9, 1.2, 1.2, M.CRANE); cjib.position.x = -7; jibG.add(cjib);
        var cw = this.bx(3, 2.4, 2, M.CONC); cw.position.set(-10, -1.2, 0); jibG.add(cw);
        var cab = this.bx(2.6, 2.4, 2.4, M.CONC); cab.position.set(1.8, 1.4, 1.4); jibG.add(cab);
        var cable = this.bx(0.14, mastH * 0.45, 0.14, M.WINOFF, false); cable.position.set(16, -mastH * 0.225, 0); jibG.add(cable);
        var hook = this.bx(2.6, 1.6, 1.8, M.CONC); hook.position.set(16, -mastH * 0.45 - 0.8, 0); jibG.add(hook);
        var tip = this.bx(0.14, 6, 0.14, M.CRANE, false); tip.position.set(0, 4, 0); jibG.add(tip);
        var tieA = this.bx(24, 0.12, 0.12, M.CRANE, false); tieA.rotation.z = -0.25; tieA.position.set(11, 4, 0); jibG.add(tieA);
        jibG.userData.jib = true; jibG.userData.phase = Math.random() * 6.28;
        cg.add(jibG);
        cg.position.set(dims.W * 0.5 + 4, 0, dims.D * 0.5 + 4);
        fx.add(cg);
        if (this._animated) this._animated.push(jibG);
      }
    }

    // Prime condition: subtle rim light (inverted hull, additive)
    if (cond >= 85) {
      if (bg.userData.skin) { bg.userData.skin.trim.emissive = new THREE.Color(0x4a3a18); bg.userData.skin.wall.emissive = new THREE.Color(0x100c06); }
      var glow = new THREE.Mesh(new THREE.PlaneGeometry(this.TILE * 1.15, this.TILE * 1.15), new THREE.MeshBasicMaterial({ map: this._glowTex(), color: 0xffd9a0, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.34; glow.userData.rim = true; fx.add(glow);
    }
    // Derelict: ground debris + soot haze
    if (cond < 20) {
      var deb = new THREE.Mesh(new THREE.PlaneGeometry(this.TILE - 4, this.TILE - 4), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
      deb.rotation.x = -Math.PI / 2; deb.position.y = 0.28; fx.add(deb);
    }
  },

  // ───────────────────────────── Scene state ─────────────────────────────
  TILE: 28,
  _scene: null, _cam: null, _renderer: null, _pivot: null, _grid: null, _animId: null,
  _container: null, _canvas: null, _selCell: null, _evLog: [], _nxtE: 6000,
  _dragState: { active: false, prevX: 0, prevY: 0, startX: 0, startY: 0, moved: false },
  _cityDef: null, _onBuildingClick: null, _opts: null, _era: 'modern', _night: 0.55,
  _fades: [], _winMeshes: null, _signs: null, _animated: null, _textures: null, _skins: null,
  _paused: false, _visible: true, _tabVisible: true, _orbit: 0,
  _camTarget: null, _camGoal: null, _zoomGoal: 1, _lastTs: 0, _frameMs: 0,

  _eraOrder: ['victorian', 'gilded', 'crisis', 'boom', 'modern', 'digital'],
  _eraIdx: function(era) { var i = this._eraOrder.indexOf(era); return i < 0 ? 99 : i; },

  _mkRng: function(s) { var sd = s; return function() { sd = ((sd * 1664525) + 1013904223) & 0xffffffff; return (sd >>> 0) / 0xffffffff; }; },

  /* Landmark cell: era-gated landmarks stand as ordinary period buildings until their era. */
  _placeLandmarkCell: function(cell, cityDef, t, tileType, prop, x, z) {
    var self = this, lmFn = cityDef.landmarks[t];
    var gate = cityDef.landmarkEras && cityDef.landmarkEras[t];
    var lmEraOk = !gate || self._eraIdx(self._era) >= self._eraIdx(gate);
    if (typeof lmFn === 'function' && lmEraOk) {
      try {
        var bg = lmFn.call(self, self._era || 'victorian');
        if (bg) {
          bg.position.set(x, 0, z);
          bg.traverse(function(m) { if (m.isMesh) m.userData.cell = cell; });
          self._bldgGroup.add(bg); cell.bGrp = bg; cell.landmark = true;
          self.BNAMES[t] = t;
          return;
        }
      } catch (e) { console.warn('landmark failed', t, e); }
    }
    cell.landmark = false; cell.filler = !prop;
    self._placeBuilding(cell, prop ? tileType : (self.BLDG_TYPES.has(t) ? t : 'ST'), prop, false);
  },

  // Sky gradient texture (as scene.background — camera-independent)
  _makeSky: function() {
    var cv = document.createElement('canvas'); cv.width = 2; cv.height = 256;
    this._skyCanvas = cv;
    var tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.encoding = THREE.sRGBEncoding;
    this._skyTex = tex;
    this._paintSky();
    return tex;
  },

  _paintSky: function() {
    var cv = this._skyCanvas; if (!cv) return;
    var P = this.ERAS[this._era] || this.ERAS.modern, n = this._night;
    var pr = this._prof(this._era);
    var sky = pr && pr.sky ? pr.sky : P.sky;
    var fogHex = pr && pr.fog != null ? pr.fog : P.fog;
    var c = cv.getContext('2d');
    var top = new THREE.Color(sky[0]), mid = new THREE.Color(sky[1]), bot = new THREE.Color(sky[2]);
    var nightTop = new THREE.Color(0x03050f), nightMid = new THREE.Color(0x0b1230), nightBot = new THREE.Color(0x1a1a3a);
    top.lerp(nightTop, n); mid.lerp(nightMid, n * 0.9); bot.lerp(nightBot, n * 0.85);
    var g = c.createLinearGradient(0, 0, 0, 256);
    var deep = bot.clone().lerp(new THREE.Color(0x000000), 0.5), floor = new THREE.Color(P.ground).lerp(new THREE.Color(0x000000), 0.6);
    var hz = this._horizon != null ? this._horizon : 0.42;
    g.addColorStop(0, '#' + top.getHexString()); g.addColorStop(hz * 0.6, '#' + mid.getHexString()); g.addColorStop(hz, '#' + bot.getHexString());
    g.addColorStop(Math.min(1, hz + 0.18), '#' + deep.getHexString()); g.addColorStop(1, '#' + floor.getHexString());
    c.fillStyle = g; c.fillRect(0, 0, 2, 256);
    if (this._skyTex) this._skyTex.needsUpdate = true;
    // SKYLINE-4 (critique fix 2): clouds take the sky's mid hue, never grey-white
    if (this._clouds && pr) { var ct = mid.clone().lerp(new THREE.Color(0xffffff), 0.55); for (var ci = 0; ci < this._clouds.length; ci++) this._clouds[ci].material.color.copy(ct); }
    if (this._scene && this._scene.fog) {
      this._scene.fog.color.copy(bot).lerp(new THREE.Color(fogHex), 0.25);
      // weather tint: rain cools and thickens the air, fog goes milk-white
      if (this._weather === 'rain' && this._weatherK > 0) this._scene.fog.color.lerp(new THREE.Color(0x5d6c7e), 0.35 * this._weatherK);
      else if (this._weather === 'fog') this._scene.fog.color.lerp(new THREE.Color(0xb9c2c6), this._profile ? 0.28 : 0.55);
    }
    // profile haze: 0..1 pulls the fog bank in around the city (clear weather only)
    if (pr && pr.haze != null) {
      var far = Math.round(1320 - pr.haze * 560), base = { near: far - 580, far: far };
      this._fogBase = base;
      if (this._weather === 'clear') this._fogGoal = { near: base.near, far: base.far };
    }
  },

  _applyExposure: function() {
    if (!this._renderer) return;
    var pr = this._prof(this._era);
    this._renderer.toneMappingExposure = pr && pr.exposure != null ? pr.exposure : (this._profile ? 1.08 : 1.0);
  },

  _applyLighting: function() {
    var n = this._night, P = this.ERAS[this._era] || this.ERAS.modern;
    var pr = this._prof(this._era);
    var sInt = pr && pr.sunIntensity != null ? pr.sunIntensity : 1;
    var aInt = pr && pr.ambIntensity != null ? pr.ambIntensity : 1;
    var hInt = pr && pr.hemiIntensity != null ? pr.hemiIntensity : 1;
    if (this._sun) {
      var sunDay = pr && pr.sunDay != null ? pr.sunDay : 0xffc78a;
      var sunDusk = pr && pr.sunDusk != null ? pr.sunDusk : 0x8ea4d6;
      this._sun.color.set(sunDay).lerp(new THREE.Color(sunDusk), n);
      this._sun.intensity = (1.9 - n * 1.3) * sInt;
      var a = 0.55 + n * 0.5;
      this._sun.position.set(Math.cos(a) * 240, 110 + n * 120, Math.sin(a) * 240);
    }
    if (this._amb) {
      var ambDay = pr && pr.ambDay != null ? pr.ambDay : 0x4a3e58;
      var ambDusk = pr && pr.ambDusk != null ? pr.ambDusk : 0x182038;
      this._amb.color.set(ambDay).lerp(new THREE.Color(ambDusk), n);
      this._amb.intensity = (0.7 - n * 0.2) * aInt;
    }
    if (this._hemi) {
      var hemiSky = pr && pr.hemiSky != null ? pr.hemiSky : 0xffd2a0;
      var hemiGnd = pr && pr.hemiGround != null ? pr.hemiGround : 0x3a2a28;
      this._hemi.color.set(hemiSky).lerp(new THREE.Color(0x203050), n);
      this._hemi.groundColor.set(hemiGnd).lerp(new THREE.Color(0x101418), n);
      this._hemi.intensity = (0.5 - n * 0.2) * hInt;
    }
    if (this._stars) this._stars.material.opacity = Math.max(0, n - 0.3) * 1.4;
    if (this._moon) this._moon.material.opacity = Math.max(0, n - 0.2) * 1.2;
    this._applyExposure();
    this._paintSky();
  },

  // ───────────────────────────── Scene setup ─────────────────────────────
  initScene: function(container, opts) {
    if (typeof THREE === 'undefined') { console.warn('Three.js not loaded'); return false; }
    this.initMaterials();
    opts = opts || {};
    this._opts = opts;
    this._quality = opts.quality || (window.devicePixelRatio > 2 || (navigator.hardwareConcurrency || 4) < 6 ? 'low' : 'high');
    var low = this._quality === 'low';
    this._era = opts.era || 'modern';
    this._night = opts.night != null ? opts.night : 0.55;
    this._horizon = opts.horizon != null ? opts.horizon : 0.42;
    this._weather = 'clear';
    this._weatherK = 0;
    this._rain = null;
    this._fogBase = { near: 560, far: 1150 };
    this._fogGoal = { near: 560, far: 1150 };
    this._camDist = 700;
    this._fades = []; this._winMeshes = []; this._signs = []; this._animated = []; this._textures = []; this._skins = [];
    this._winRng = this._mkRng(2718);

    container.offsetHeight;
    var VW = container.clientWidth || 800, VH = container.clientHeight || 400;
    if (VH < 50) VH = 400;

    var scene = new THREE.Scene();
    scene.background = this._makeSky();
    scene.fog = new THREE.Fog(0x1c2240, 560, 1150);
    this._scene = scene;

    // Camera
    var asp = VW / VH;
    var cam = new THREE.OrthographicCamera(-100 * asp, 100 * asp, 100, -100, 1, 2200);
    this._camDir = new THREE.Vector3(1, 0.86, 1).normalize();
    this._camTarget = new THREE.Vector3(0, this.TY, 0); this._camGoal = this._camTarget.clone();
    this._cam = cam;
    this._fitCamera(asp);

    // Renderer
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
    container.appendChild(canvas);
    this._canvas = canvas; this._container = container;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: low ? 'low-power' : 'high-performance' });
    renderer.setSize(VW, VH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2));
    renderer.shadowMap.enabled = !low;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;
    this._renderer = renderer;
    this._applyExposure();

    // Lights
    this._amb = new THREE.AmbientLight(0x5a4a60, 1.0); scene.add(this._amb);
    var sun = new THREE.DirectionalLight(0xffc78a, 1.6);
    sun.position.set(130, 220, 90);
    sun.castShadow = !low;
    sun.shadow.camera.left = -240; sun.shadow.camera.right = 240; sun.shadow.camera.top = 240; sun.shadow.camera.bottom = -240;
    sun.shadow.camera.near = 10; sun.shadow.camera.far = 900;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.6;
    scene.add(sun); scene.add(sun.target); this._sun = sun;
    this._hemi = new THREE.HemisphereLight(0xffd2a0, 0x3a2a28, 0.7); scene.add(this._hemi);

    // Stars + moon (sky dome objects, fog disabled)
    var sp = [], nStars = low ? 350 : 1100;
    var cd = this._camDir;
    while (sp.length < nStars * 3) {
      var t = Math.random() * Math.PI * 2, p = Math.acos(Math.random() * 0.92), r = 900 + Math.random() * 150;
      var sx = r * Math.sin(p) * Math.cos(t), sy = r * Math.cos(p), sz = r * Math.sin(p) * Math.sin(t);
      if (sx * cd.x + sy * cd.y + sz * cd.z < -r * 0.15) sp.push(sx, sy, sz);
    }
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3));
    this._stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdbe6ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
    scene.add(this._stars);
    var moonCv = document.createElement('canvas'); moonCv.width = moonCv.height = 128;
    var mc = moonCv.getContext('2d'); var mg = mc.createRadialGradient(56, 52, 4, 64, 64, 64);
    mg.addColorStop(0, 'rgba(255,250,230,1)'); mg.addColorStop(0.35, 'rgba(250,236,190,1)'); mg.addColorStop(0.42, 'rgba(250,236,190,.35)'); mg.addColorStop(1, 'rgba(250,236,190,0)');
    mc.fillStyle = mg; mc.fillRect(0, 0, 128, 128);
    this._moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._canvasTex(moonCv), transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this._moon.position.set(-520, 460, -380); this._moon.scale.set(70, 70, 1);
    scene.add(this._moon);

    // Pivot (rotation) + clouds
    var pivot = new THREE.Group(); scene.add(pivot); this._pivot = pivot;
    if (opts.clouds !== false) this._makeClouds(opts.clouds || (low ? 4 : 7));

    // Selection ring (flat, gold)
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.5, 48), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 5;
    pivot.add(ring); this._selRing = ring;

    this._bindInput(canvas, cam, pivot);
    this._bindVisibility(canvas);
    this._applyLighting();
    this.setWeather(opts.weather || 'clear');
    this._rng = this._mkRng(31415);
    return true;
  },

  _fitCamera: function(asp) {
    var def = this._cityDef, T = this.TILE;
    var GW = def ? def.layout[0].length : 7, GH = def ? def.layout.length : 8;
    var diag = (GW + GH) * T / Math.SQRT2 * 0.5 + T * 0.4; // half width of the rotated diamond
    var elev = Math.atan2(this._camDir.y, Math.hypot(this._camDir.x, this._camDir.z));
    var depth = diag * Math.sin(elev) + 20; // vertical half extent incl. building headroom
    var needV = Math.max(depth, diag * 0.74 / asp);
    this._CS = needV; this._asp = asp;
    this._updateCam();
  },

  TY: 14, // camera target height (lifts the city so tall buildings have headroom)

  _updateCam: function() {
    var cam = this._cam, CS = this._CS, asp = this._asp || 1;
    cam.left = -CS * asp; cam.right = CS * asp; cam.top = CS; cam.bottom = -CS;
    cam.updateProjectionMatrix();
    var pos = this._camTarget.clone().addScaledVector(this._camDir, 700);
    cam.position.copy(pos); cam.lookAt(this._camTarget);
  },

  _makeClouds: function(n) {
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    var c = cv.getContext('2d');
    var puffs = [[70, 78, 34], [110, 62, 42], [150, 70, 38], [190, 82, 30], [128, 86, 48], [90, 90, 30], [170, 90, 32]];
    puffs.forEach(function(pf) {
      var g = c.createRadialGradient(pf[0], pf[1], pf[2] * 0.15, pf[0], pf[1], pf[2]);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.55, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, 256, 128);
    });
    var tex = this._canvasTex(cv);
    this._clouds = [];
    for (var i = 0; i < n; i++) {
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: (this._profile ? 0.16 : 0.07) + Math.random() * 0.07, depthWrite: false, fog: false, color: 0xe6d8e4 }); // SKYLINE-4: profiles get visible, sky-tinted clouds
      var s = new THREE.Sprite(mat);
      var w = 60 + Math.random() * 70;
      s.scale.set(w, w * 0.32, 1);
      s.position.set((Math.random() - 0.5) * 520, 150 + Math.random() * 70, (Math.random() - 0.5) * 520);
      s.userData.speed = 0.4 + Math.random() * 0.6;
      this._pivot.add(s); this._clouds.push(s);
    }
  },

  // ───────────────────────────── Input ─────────────────────────────
  _bindInput: function(canvas, cam, pivot) {
    var ds = this._dragState, self = this;
    var pinch = { active: false, dist: 0, cx: 0, cy: 0 };
    function worldPerPx() { return (2 * self._CS / cam.zoom) / Math.max(1, canvas.clientHeight); }
    function pan(dx, dy) {
      var wpp = worldPerPx();
      var right = new THREE.Vector3(); var up = new THREE.Vector3();
      right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
      self._camGoal.addScaledVector(right, -dx * wpp).addScaledVector(up, dy * wpp);
      self._camTarget.copy(self._camGoal);
      self._clampTarget();
      self._updateCam();
    }
    this._h = {};
    this._h.mousedown = function(e) { ds.active = true; ds.moved = false; ds.prevX = ds.startX = e.clientX; ds.prevY = ds.startY = e.clientY; self._userTouched(); };
    this._h.mouseup = function() { ds.active = false; };
    this._h.mousemove = function(e) {
      if (!ds.active || !self._pivot) return;
      if (e.shiftKey || e.buttons === 2) pan(e.clientX - ds.prevX, e.clientY - ds.prevY);
      else self._pivot.rotation.y -= (e.clientX - ds.prevX) * 0.006;
      if (Math.abs(e.clientX - ds.startX) + Math.abs(e.clientY - ds.startY) > 6) ds.moved = true;
      ds.prevX = e.clientX; ds.prevY = e.clientY;
    };
    this._h.wheel = function(e) { e.preventDefault(); self._zoomGoal = Math.max(0.6, Math.min(3, self._zoomGoal * (e.deltaY > 0 ? 0.9 : 1.1))); };
    this._h.contextmenu = function(e) { e.preventDefault(); };
    this._h.touchstart = function(e) {
      self._userTouched();
      if (e.touches.length === 1) { ds.active = true; ds.moved = false; ds.prevX = ds.startX = e.touches[0].clientX; ds.prevY = ds.startY = e.touches[0].clientY; pinch.active = false; }
      else if (e.touches.length === 2) {
        ds.active = false; pinch.active = true;
        pinch.dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        pinch.cx = (e.touches[0].clientX + e.touches[1].clientX) / 2; pinch.cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    };
    this._h.touchmove = function(e) {
      if (pinch.active && e.touches.length === 2) {
        e.preventDefault();
        var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        if (pinch.dist > 0) { var z = Math.max(0.6, Math.min(3, cam.zoom * (d / pinch.dist))); cam.zoom = z; self._zoomGoal = z; cam.updateProjectionMatrix(); }
        pan(cx - pinch.cx, cy - pinch.cy);
        pinch.dist = d; pinch.cx = cx; pinch.cy = cy; ds.moved = true;
      } else if (ds.active && e.touches.length === 1 && self._pivot) {
        var x = e.touches[0].clientX, y = e.touches[0].clientY;
        self._pivot.rotation.y -= (x - ds.prevX) * 0.006;
        if (Math.abs(x - ds.startX) + Math.abs(y - ds.startY) > 8) ds.moved = true;
        ds.prevX = x; ds.prevY = y;
      }
    };
    this._h.touchend = function(e) { if (e.touches.length < 2) pinch.active = false; if (e.touches.length === 0) ds.active = false; };
    var rc = new THREE.Raycaster(), mouse = new THREE.Vector2();
    this._h.click = function(e) {
      if (ds.moved) return;
      var rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      rc.setFromCamera(mouse, cam);
      var hits = rc.intersectObjects(pivot.children, true).filter(function(h) { return h.object.userData.cell && h.object.visible; });
      if (hits.length) {
        var cell = hits[0].object.userData.cell;
        self._select(cell);
        if (self._opts && self._opts.onSelect && cell.property) self._opts.onSelect(cell.property, cell);
        if (self._onBuildingClick) self._onBuildingClick(cell);
      } else self._select(null);
    };
    canvas.addEventListener('mousedown', this._h.mousedown);
    canvas.addEventListener('wheel', this._h.wheel, { passive: false });
    canvas.addEventListener('contextmenu', this._h.contextmenu);
    canvas.addEventListener('click', this._h.click);
    canvas.addEventListener('touchstart', this._h.touchstart, { passive: true });
    canvas.addEventListener('touchmove', this._h.touchmove, { passive: false });
    canvas.addEventListener('touchend', this._h.touchend, { passive: true });
    window.addEventListener('mouseup', this._h.mouseup);
    window.addEventListener('mousemove', this._h.mousemove);
    this._h.resize = function() {
      if (!self._container || !self._renderer) return;
      var nW = self._container.clientWidth, nH = self._container.clientHeight;
      if (nW < 1 || nH < 1) return;
      self._renderer.setSize(nW, nH);
      self._fitCamera(nW / nH);
    };
    window.addEventListener('resize', this._h.resize);
  },

  _userTouched: function() { if (this._opts && this._opts.autoOrbit === 'untilTouch') this._orbit = 0; },

  _clampTarget: function() {
    var lim = this._CS * 0.9;
    this._camGoal.x = Math.max(-lim, Math.min(lim, this._camGoal.x));
    this._camGoal.z = Math.max(-lim, Math.min(lim, this._camGoal.z));
  },

  _bindVisibility: function(canvas) {
    var self = this;
    this._h.vis = function() { self._tabVisible = document.visibilityState !== 'hidden'; self._checkPause(); };
    document.addEventListener('visibilitychange', this._h.vis);
    if (typeof IntersectionObserver !== 'undefined') {
      this._io = new IntersectionObserver(function(entries) {
        self._visible = entries[0].isIntersecting; self._checkPause();
      }, { threshold: 0.02 });
      this._io.observe(canvas);
    }
  },

  _checkPause: function() {
    var shouldRun = this._visible && this._tabVisible && !!this._scene;
    if (shouldRun && !this._animId) this.startAnimation();
    else if (!shouldRun && this._animId) { cancelAnimationFrame(this._animId); this._animId = null; }
  },

  // ───────────────────────────── Tiles ─────────────────────────────
  // Tree variants (profile.trees); all stay close to the classic trunk+2-spheres
  // triangle budget and reuse the shared park materials so batching is unchanged.
  _tree: function(kind, s) {
    var M = this.M, out = [];
    function add(m, x, y, z) { m.position.set(x, y, z); out.push(m); }
    switch (kind) {
      case 'palm':
        add(this.cy(0.26, 0.42, 9 * s, 5, M.HOt), 0, 4.5 * s, 0);
        var f1 = this.sphr(2.3 * s, 6, M.PARKD); f1.scale.set(1.9, 0.4, 1.9); add(f1, 0, 9.2 * s, 0);
        var f2 = this.sphr(1.6 * s, 5, M.PARKL); f2.scale.set(1.5, 0.32, 1.5); f2.rotation.z = 0.55; add(f2, -1.9 * s, 8.6 * s, 0.4 * s);
        var f3 = this.sphr(1.6 * s, 5, M.PARKL); f3.scale.set(1.5, 0.32, 1.5); f3.rotation.z = -0.55; add(f3, 1.9 * s, 8.6 * s, -0.4 * s);
        break;
      case 'conifer':
        add(this.cy(0.22, 0.34, 2.8 * s, 5, M.HOt), 0, 1.4 * s, 0);
        add(this.cy(0.06, 2.5 * s, 5.6 * s, 7, M.PARKD), 0, 4.8 * s, 0);
        add(this.cy(0.04, 1.6 * s, 4.2 * s, 7, M.PARKL), 0, 8.4 * s, 0);
        break;
      case 'cherry':
        add(this.cy(0.3, 0.42, 4.2 * s, 5, M.HOt), 0, 2.1 * s, 0);
        var b1 = this.sphr(3.1 * s, 7, M.PARKBLOSSOM); b1.scale.y = 1.1; add(b1, 0, 5.6 * s, 0);
        add(this.sphr(2 * s, 6, M.PARKBLOSSOM), 1 * s, 7.2 * s, 0.6 * s);
        break;
      case 'acacia':
        add(this.cy(0.3, 0.46, 6.4 * s, 5, M.HOt), 0, 3.2 * s, 0);
        var u1 = this.sphr(3.6 * s, 7, M.PARKD); u1.scale.set(2.1, 0.5, 2.1); add(u1, 0, 7.4 * s, 0);
        var u2 = this.sphr(2.2 * s, 6, M.PARKL); u2.scale.set(1.8, 0.42, 1.8); add(u2, 0.8 * s, 7.9 * s, 0.5 * s);
        break;
      case 'scrub':
        add(this.sphr(1.5 * s, 5, M.PARKL), 0, 1.1 * s, 0);
        if (s > 1.05) add(this.sphr(1 * s, 5, M.PARKD), 1.2 * s, 0.8 * s, 0.5 * s);
        break;
      default: // 'plane' — the original London plane tree
        add(this.cy(0.4, 0.6, 5 * s, 5, M.HOt), 0, 2.5 * s, 0);
        var l2 = this.sphr(4.4 * s, 7, M.PARKD); l2.scale.y = 1.25; add(l2, 0, 7.2 * s, 0);
        add(this.sphr(2.8 * s, 6, M.PARKL), 1.2 * s, 9.6 * s, 0.8 * s);
    }
    return out;
  },

  makeTile: function(t, r, c) {
    var g = new THREE.Group(), T = this.TILE, M = this.M, self = this;
    var pr = this._prof(this._era);
    var treeKind = pr && pr.trees ? pr.trees : 'plane';
    var lampKind = pr && pr.lamps ? pr.lamps : 'modern';
    switch (t) {
      case 'W': { var w = this.flatPlane(T, T, M.WATER); w.position.y = -0.3; g.add(w); break; }
      case 'HB': { var hb = this.flatPlane(T, T, M.HARBOR); hb.position.y = -0.3; g.add(hb); break; }
      case 'RD': {
        var rp = this.flatPlane(T, T, M.ROAD); rp.position.y = 0.02; g.add(rp);
        [-T / 2 + 1.6, T / 2 - 1.6].forEach(function(a) {
          var sw = self.bx(3.2, 0.3, T, M.SIDEW, false); sw.position.set(a, 0.15, 0); g.add(sw);
          var sw2 = self.bx(T, 0.3, 3.2, M.SIDEW, false); sw2.position.set(0, 0.15, a); g.add(sw2);
        });
        var lane = this.flatPlane(0.7, T * 0.5, M.LANE); lane.position.y = 0.06; g.add(lane);
        var lane2 = this.flatPlane(T * 0.5, 0.7, M.LANE); lane2.position.y = 0.06; g.add(lane2);
        if (lampKind === 'neon') {
          // every intersection gets a slim pole; bulb colour alternates by parity
          var npole = this.cy(0.13, 0.18, 9, 5, M.CONC); npole.position.set(T * 0.36, 4.5, T * 0.36); g.add(npole);
          var nbulb = this.sphr(0.62, 5, (r + c) % 2 === 0 ? M.LAMPNEON_C : M.LAMPNEON_M);
          nbulb.position.set(T * 0.36, 9.2, T * 0.36); g.add(nbulb);
        } else if (lampKind === 'gas') {
          if ((r + c) % 2 === 0) {
            var gpost = this.cy(0.16, 0.24, 5.4, 5, M.SIGNPOST); gpost.position.set(T * 0.36, 2.7, T * 0.36); g.add(gpost);
            var gcap = this.bx(0.9, 0.55, 0.9, M.SIGNPOST, false); gcap.position.set(T * 0.36, 5.6, T * 0.36); g.add(gcap);
            var gbulb = this.sphr(0.55, 5, M.LAMP); gbulb.position.set(T * 0.36, 5.3, T * 0.36); g.add(gbulb);
          }
        } else if ((r + c) % 2 === 0) {
          var pole = this.cy(0.2, 0.26, 8, 5, M.CONC); pole.position.set(T * 0.36, 4, T * 0.36); g.add(pole);
          var arm = this.bx(2.6, 0.2, 0.2, M.CONC, false); arm.position.set(T * 0.36 - 1.3, 8, T * 0.36); g.add(arm);
          var bulb = this.bx(1.1, 0.5, 0.7, M.LAMP, false); bulb.position.set(T * 0.36 - 2.4, 7.8, T * 0.36); g.add(bulb);
        }
        break;
      }
      case 'LOT': {
        var lp = this.flatPlane(T, T, M.LOT); lp.position.y = 0.02; g.add(lp);
        var kerb = [];
        [[0, -T / 2 + 1, T, 2], [0, T / 2 - 1, T, 2], [-T / 2 + 1, 0, 2, T], [T / 2 - 1, 0, 2, T]].forEach(function(a) {
          var k = self.bx(a[2], 0.26, a[3], M.SIDEW, false); k.position.set(a[0], 0.13, a[1]); g.add(k);
        });
        break;
      }
      case 'CP': {
        var pp = this.flatPlane(T, T, M.PARK); pp.position.y = 0.04; g.add(pp);
        var pv = this.bx(2.4, 0.14, T * 0.86, M.SIDEW, false); pv.position.set(T * 0.08, 0.1, 0); g.add(pv);
        var rng = this._mkRng(r * 97 + c * 13 + 7);
        [[-7, -7], [6, -8], [7, 6], [-8, 6], [0, 9]].forEach(function(a, i) {
          if (i === 4 && rng() < 0.5) return;
          var s = 0.8 + rng() * 0.5;
          self._tree(treeKind, s).forEach(function(m) { m.position.x += a[0]; m.position.z += a[1]; g.add(m); });
        });
        break;
      }
      case 'CT': {
        g.add(this.flatPlane(T, T, (r + c) % 2 === 0 ? M.COUNTRY : M.COUNTRYD));
        for (var i = -2; i <= 2; i++) { var row = this.bx(T * 0.86, 0.36, 1.2, M.COUNTRYD, false); row.position.set(0, 0.18, i * 4.8); g.add(row); }
        var fence = this.bx(T * 0.9, 0.3, 0.2, M.HOt, false); fence.position.set(0, 1.1, -T * 0.42); g.add(fence);
        for (var j = -3; j <= 3; j++) { var post = this.bx(0.36, 1.8, 0.2, M.HOt, false); post.position.set(j * (T / 7), 0.9, -T * 0.42); g.add(post); }
        if ((r * 3 + c * 5) % 4 === 0) {
          this._tree(treeKind, 1.15).forEach(function(m) { m.position.x += -8; m.position.z += -7; g.add(m); });
        }
        break;
      }
      default: g.add(this.flatPlane(T, T, M.GND)); break;
    }
    return g;
  },

  /* Contact grounding (Skylines-style): one merged radial-gradient quad under every
     building/landmark lot. One shared material + one draw call; skipped on low quality. */
  _buildContactShadows: function(cells) {
    this._contactShadow = null;
    if (!cells || !cells.length || this._quality === 'low' || !this._terrainGroup) return;
    var M = this.M;
    if (!M.SHADOW) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 128;
      var c2 = cv.getContext('2d');
      var g = c2.createRadialGradient(64, 64, 6, 64, 64, 64);
      g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(0.55, 'rgba(0,0,0,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c2.fillStyle = g; c2.fillRect(0, 0, 128, 128);
      var tex = this._canvasTex(cv); tex._keep = true;
      M.SHADOW = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    }
    var quads = [];
    for (var i = 0; i < cells.length; i++) {
      var q = new THREE.Mesh(new THREE.PlaneGeometry(this.TILE * 0.98, this.TILE * 0.98), M.SHADOW);
      q.rotation.x = -Math.PI / 2; q.position.set(cells[i].x, 0.08, cells[i].z);
      quads.push(q);
    }
    var mesh = new THREE.Mesh(this._mergeMeshes(quads), M.SHADOW);
    mesh.renderOrder = 2; mesh.userData.contactShadow = true;
    this._terrainGroup.add(mesh); this._contactShadow = mesh;
    quads.forEach(function(q) { q.geometry.dispose(); });
  },

  // ───────────────────────────── Build the city ─────────────────────────────
  buildCity: function(cityDef, properties) {
    if (!this._pivot) return;
    this._cityDef = cityDef;
    this._properties = properties || [];
    var layout = cityDef.layout, GH = layout.length, GW = layout[0].length, T = this.TILE;
    var OX = -(GW - 1) * T / 2, OZ = -(GH - 1) * T / 2;
    var grid = [], self = this;
    var buildingSlots = [];
    layout.forEach(function(row, r) { row.forEach(function(t, c) { if (t === 'B' || self.BLDG_TYPES.has(t)) buildingSlots.push({ r: r, c: c, origType: t }); }); });
    var slotAssignments = {};
    this._properties.forEach(function(p, i) { if (i < buildingSlots.length) slotAssignments[buildingSlots[i].r + ',' + buildingSlots[i].c] = p; });

    var batches = {};
    var shadowCells = [];
    this._terrainGroup = new THREE.Group(); this._pivot.add(this._terrainGroup);
    this._bldgGroup = new THREE.Group(); this._pivot.add(this._bldgGroup);
    this._fitCamera(this._container.clientWidth / Math.max(1, this._container.clientHeight));

    layout.forEach(function(row, r) {
      grid[r] = [];
      row.forEach(function(t, c) {
        var x = OX + c * T, z = OZ + r * T;
        var prop = slotAssignments[r + ',' + c] || null;
        var isLandmark = !!(cityDef.landmarks && cityDef.landmarks[t]);
        var isSlot = t === 'B' || self.BLDG_TYPES.has(t);
        var tileType = isSlot ? (prop ? (prop.model3d || self.PROP_TO_3D[prop.type] || (self.BLDG_TYPES.has(t) ? t : 'ST')) : (t === 'B' ? 'ST' : t)) : t;
        var terrainType = (isSlot || isLandmark) ? 'LOT' : tileType;
        if (isLandmark && cityDef.landmarkGround) terrainType = cityDef.landmarkGround[t] || 'LOT';
        if ((isSlot || isLandmark) && terrainType === 'LOT' && self._quality !== 'low') shadowCells.push({ x: x, z: z });
        var tg = self.makeTile(terrainType, r, c); tg.position.set(x, 0, z);
        self._batchGroup(tg, batches);
        tg.traverse(function(m) { if (m.isMesh && m.geometry) m.geometry.dispose(); });

        var cell = { t: tileType, ev: null, evEnd: 0, sp: 1, demo: false, r: r, c: c, x: x, z: z, bGrp: null, evMesh: null, evLight: null,
          propertyId: prop ? prop.id : null, property: prop, filler: isSlot && !prop, landmark: isLandmark };
        if (isSlot) self._placeBuilding(cell, tileType, prop, false);
        else if (isLandmark) self._placeLandmarkCell(cell, cityDef, t, tileType, prop, x, z);
        grid[r][c] = cell;
      });
    });
    this._terrain = this._flushBatches(batches, this._terrainGroup);
    this._buildContactShadows(shadowCells);
    this._applyEraTerrain(this._era, 0);
    if (cityDef.landmarkNames) for (var k in cityDef.landmarkNames) this.BNAMES[k] = cityDef.landmarkNames[k].replace(/^[^\w]+/, '');
    this._grid = grid; this._evLog = []; this._nxtE = 6000;
    // Cap label heights so nothing floats off-screen
    var showLabels = !(this._opts && this._opts.labels === false);
    this._bldgGroup.traverse(function(o) { if (o.userData.label) { o.position.y = Math.min(o.position.y, 96); o.visible = showLabels; } });
  },

  _placeBuilding: function(cell, tileType, prop, animate) {
    var seed = this._hash(cell.r + 1, cell.c + 1);
    var era = (prop && prop.era && this.ERAS[prop.era]) ? prop.era : this._era;
    var cond = prop ? prop.condition : 70 + seed * 25;
    var sk = this._makeSkin(era, tileType, seed, cond);
    sk.ownEra = !!(prop && prop.era && this.ERAS[prop.era]);
    var bg = this.buildByType(tileType, seed, sk);
    bg.userData.skin = sk; bg.userData.typeKey = tileType;
    this._skins.push(sk);
    this._dressBuilding(bg, prop, cell);
    bg.position.set(cell.x, 0, cell.z); bg.rotation.y = Math.PI;
    bg.traverse(function(m) { if (m.isMesh) m.userData.cell = cell; });
    this._bldgGroup.add(bg);
    cell.bGrp = bg; cell.t = tileType; cell.property = prop; cell.propertyId = prop ? prop.id : null; cell.filler = !prop;
    if (animate) { cell.sp = 0.02; bg.scale.y = 0.02; }
    return bg;
  },

  _disposeObj: function(obj) {
    var self = this;
    obj.traverse(function(o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function(m) {
          if (self._sharedMats && self._sharedMats.has(m)) return;
          if (m.map && !m.map._keep) m.map.dispose();
          m.dispose();
        });
      }
    });
    if (obj.parent) obj.parent.remove(obj);
  },

  _removeBuilding: function(cell) {
    if (!cell.bGrp) return;
    var bg = cell.bGrp, self = this;
    bg.traverse(function(m) {
      if (m.userData.win) { var i = self._winMeshes.indexOf(m); if (i >= 0) self._winMeshes.splice(i, 1); }
      if (m.userData.sign) { var j = self._signs.indexOf(m); if (j >= 0) self._signs.splice(j, 1); }
      var k = self._animated.indexOf(m); if (k >= 0) self._animated.splice(k, 1);
    });
    if (bg.userData.skin) { var si = this._skins.indexOf(bg.userData.skin); if (si >= 0) this._skins.splice(si, 1); }
    this._fades = this._fades.filter(function(f) { return !bg.userData.skin || bg.userData.skin.list.indexOf(f.m) < 0; });
    this._clearEvFX(cell);
    this._disposeObj(bg);
    cell.bGrp = null;
    if (this._selCell === cell) this._select(null);
  },

  _findCell: function(propertyId) {
    if (!this._grid) return null;
    for (var r = 0; r < this._grid.length; r++) for (var c = 0; c < this._grid[r].length; c++) {
      var cell = this._grid[r][c]; if (cell && cell.propertyId === propertyId) return cell;
    }
    return null;
  },

  // ───────────────────────────── Public: selection / update / focus / era ─────────────────────────────
  _select: function(cell) {
    this._selCell = cell;
    if (!this._selRing) return;
    if (cell && cell.bGrp) {
      this._selRing.visible = true;
      this._selRing.position.set(cell.x, 0.4, cell.z);
      this._selRing.scale.set(this.TILE * 1.05, this.TILE * 1.05, 1);
    } else this._selRing.visible = false;
  },

  setSelected: function(propertyId) { this._select(propertyId == null ? null : this._findCell(propertyId)); },

  updateProperty: function(prop, o) {
    var cell = this._findCell(prop.id);
    if (!cell) {
      // Place in the first free filler slot
      if (this._grid) for (var r = 0; r < this._grid.length && !cell; r++) for (var c = 0; c < this._grid[r].length; c++) { var cc = this._grid[r][c]; if (cc.filler) { cell = cc; break; } }
      if (!cell) return false;
      this._properties.push(prop);
    } else {
      var idx = -1; this._properties.forEach(function(p, i) { if (p.id === prop.id) idx = i; });
      if (idx >= 0) this._properties[idx] = prop;
    }
    var typeKey = prop.model3d || this.PROP_TO_3D[prop.type] || cell.t;
    var wasSel = this._selCell === cell;
    var animate = o && o.animate;
    if (animate && cell.bGrp) {
      var old = cell.bGrp; cell.bGrp = null;
      var self = this;
      old.userData.dying = true; this._dying = this._dying || []; this._dying.push({ g: old, cell: cell });
      old.traverse(function(m) { if (m.userData.win) { var i = self._winMeshes.indexOf(m); if (i >= 0) self._winMeshes.splice(i, 1); } if (m.userData.sign) { var j = self._signs.indexOf(m); if (j >= 0) self._signs.splice(j, 1); } });
      if (old.userData.skin) { var si = this._skins.indexOf(old.userData.skin); if (si >= 0) this._skins.splice(si, 1); }
    } else this._removeBuilding(cell);
    this._placeBuilding(cell, typeKey, prop, animate);
    if (wasSel) this._select(cell);
    return true;
  },

  focus: function(propertyId, zoom) {
    var cell = typeof propertyId === 'object' ? propertyId : this._findCell(propertyId);
    if (!cell || !this._pivot) return false;
    var v = new THREE.Vector3(cell.x, this.TY, cell.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), this._pivot.rotation.y);
    this._camGoal.copy(v); this._zoomGoal = zoom || 1.6;
    return true;
  },

  resetView: function() { this._camGoal.set(0, this.TY, 0); this._zoomGoal = 1; },

  // Framing helper: { x, y, z } camera target (world units), zoom, rot (pivot rotation, radians), immediate
  setView: function(v) {
    v = v || {};
    if (!this._cam) return;
    if (v.x != null || v.z != null || v.y != null) this._camGoal.set(v.x != null ? v.x : this._camGoal.x, v.y != null ? v.y : this._camGoal.y, v.z != null ? v.z : this._camGoal.z);
    if (v.zoom != null) this._zoomGoal = Math.max(0.3, Math.min(4, v.zoom));
    if (v.rot != null && this._pivot) this._pivot.rotation.y = v.rot;
    if (v.horizon != null) { this._horizon = v.horizon; this._paintSky(); }
    if (v.immediate) { this._camTarget.copy(this._camGoal); this._cam.zoom = this._zoomGoal; this._updateCam(); }
  },

  setEra: function(era, fadeMs) {
    if (!this.ERAS[era]) return;
    var ms = fadeMs == null ? 1200 : fadeMs;
    var prevEra = this._era;
    this._era = era;
    var self = this;
    (this._skins || []).forEach(function(sk) { if (!sk.ownEra) self._retargetSkin(sk, era, ms); });
    this._applyEraTerrain(era, ms);
    this._applyLighting();
    // Era-gated landmarks: plots that gain or lose their monument rebuild (city grows with the era)
    var cityDef = this._cityDef, grid = this._grid;
    if (cityDef && cityDef.landmarks && grid && this._eraIdx(era) !== this._eraIdx(prevEra)) {
      for (var r = 0; r < grid.length; r++) for (var c = 0; c < grid[r].length; c++) {
        var cell = grid[r][c], t = cell.t;
        if (!cityDef.landmarks[t]) continue;
        var gate = cityDef.landmarkEras && cityDef.landmarkEras[t];
        var shouldLandmark = !(gate && this._eraIdx(era) < this._eraIdx(gate));
        if (shouldLandmark !== !!cell.landmark && !cell.propertyId) {
          if (cell.bGrp) this._removeBuilding(cell);
          cell.ev = null; this._clearEvFX(cell); cell.demo = false; cell.sp = 1;
          this._placeLandmarkCell(cell, cityDef, t, this.BLDG_TYPES.has(t) ? t : 'ST', null, cell.x, cell.z);
        }
      }
    }
  },

  _applyEraTerrain: function(era, ms) {
    var P = this.ERAS[era], M = this.M, keys = this._eraTerrainKeys, fades = this._fades;
    var pr = this._prof(era);
    for (var k in keys) {
      var m = M[keys[k]];
      var to = pr && pr[k] != null ? pr[k] : P[k];
      if (ms > 0) fades.push({ m: m, from: m.color.clone(), to: new THREE.Color(to), t: 0, ms: ms }); else m.color.set(to);
    }
    var lot = new THREE.Color(pr && pr.ground != null ? pr.ground : P.ground).lerp(new THREE.Color(0xffffff), 0.06);
    if (ms > 0) fades.push({ m: M.LOT, from: M.LOT.color.clone(), to: lot, t: 0, ms: ms }); else M.LOT.color.copy(lot);
    // Water / harbour: retint through the same fade mechanism so era changes restore
    // the palette (or the factory default) instead of leaking the previous profile.
    var wd = pr && pr.water, self = this;
    ['WATER', 'HARBOR'].forEach(function(nm) {
      var wm = M[nm], d = self._waterDefaults[nm];
      var col = wd && wd.color != null ? wd.color : d.color;
      var op = wd && wd.opacity != null ? wd.opacity : d.opacity;
      var sp = wd && wd.specular != null ? wd.specular : d.specular;
      if (ms > 0) {
        fades.push({ m: wm, from: wm.color.clone(), to: new THREE.Color(col), t: 0, ms: ms });
        if (wm.opacity !== op) fades.push({ m: wm, fromOp: wm.opacity, toOp: op, t: 0, ms: ms });
      } else { wm.color.set(col); wm.opacity = op; }
      wm.specular.set(sp);
    });
  },

  setNight: function(n) { this._night = Math.max(0, Math.min(1, n)); this._applyLighting(); },
  setAutoOrbit: function(v) { this._orbit = v === true ? 0.08 : (v || 0); },

  /* Weather: 'clear' | 'rain' | 'fog'. Rain lerps in with falling streak points and a
     closing fog bank; fog is a milky Victorian blanket. Driven per frame in animate. */
  setWeather: function(kind) {
    kind = (kind === 'rain' || kind === 'fog') ? kind : 'clear';
    this._weather = kind;
    if (kind === 'rain') this._fogGoal = { near: 640, far: 1010 };
    else if (kind === 'fog') this._fogGoal = this._profile
      ? { near: Math.max(560, this._fogBase.near - 160), far: Math.max(980, this._fogBase.far - 160) } // SKYLINE-4: capped so 1850 still reads
      : { near: 500, far: 860 };
    else this._fogGoal = { near: this._fogBase.near, far: this._fogBase.far };
    if (kind === 'rain') this._ensureRain();
    this._paintSky();
  },
  _ensureRain: function() {
    if (this._rain || !this._scene) return;
    var low = this._quality === 'low';
    var n = low ? 1100 : 2400, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 560; pos[i * 3 + 1] = Math.random() * 220; pos[i * 3 + 2] = (Math.random() - 0.5) * 560; }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this._rain = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbdd5ea, size: low ? 1.8 : 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false }));
    this._rain.frustumCulled = false;
    this._scene.add(this._rain);
  },
  _tickWeather: function(dt) {
    var target = this._weather === 'rain' ? 1 : 0;
    if (this._weatherK !== target) this._weatherK += (target - this._weatherK) * Math.min(1, dt * 1.6);
    if (Math.abs(this._weatherK - target) < 0.01) this._weatherK = target;
    var fog = this._scene && this._scene.fog;
    if (fog && this._fogGoal) {
      var k = Math.min(1, dt * 1.4);
      fog.near += (this._fogGoal.near - fog.near) * k;
      fog.far += (this._fogGoal.far - fog.far) * k;
    }
    if (this._rain) {
      var show = this._weather === 'rain' && this._weatherK > 0.02;
      this._rain.visible = show;
      if (show) {
        this._rain.material.opacity = 0.65 * this._weatherK;
        var attr = this._rain.geometry.attributes.position, arr = attr.array;
        var fall = 230 * dt;
        for (var i = 1; i < arr.length; i += 3) { arr[i] -= fall; if (arr[i] < 0) arr[i] = 200; }
        attr.needsUpdate = true;
      }
    }
  },

  // ───────────────────────────── Events (ambient FX) ─────────────────────────────
  _addLog: function(txt, col) { this._evLog.unshift({ txt: txt, col: col }); if (this._evLog.length > 5) this._evLog.pop(); },
  _clearEvFX: function(cell) {
    if (cell.evMesh) { this._disposeObj(cell.evMesh); cell.evMesh = null; }
    if (cell.evLight) { this._scene.remove(cell.evLight); cell.evLight = null; }
  },
  triggerEvent: function(ts, evName, cellIn) {
    var grid = this._grid; if (!grid) return;
    var self = this;
    var cell = cellIn;
    if (!cell) {
      var bl = grid.flat().filter(function(c) { return c.bGrp && !c.demo && !c.landmark; });
      if (!bl.length) return;
      cell = bl[Math.floor(Math.random() * bl.length)];
    }
    var keys = Object.keys(this.EVENTS);
    var ev = evName || keys[Math.floor(Math.random() * keys.length)];
    this._clearEvFX(cell);
    cell.ev = ev;
    var d = this.EVENTS[ev].d;
    cell.evEnd = ts + d[0] + Math.random() * (d[1] - d[0]);
    var sz = (cell.bGrp.userData.dims || { H: 20 });
    if (ev === 'FIRE') { var fl = new THREE.PointLight(0xff5500, 3, 75); fl.position.set(cell.x, sz.H * 0.65, cell.z); this._pivot.add(fl); cell.evLight = fl; }
    else if (ev === 'BURGLARY' || ev === 'STORM') { var pl = new THREE.PointLight(ev === 'BURGLARY' ? 0x6010ff : 0x4060e0, 1.8, 60); pl.position.set(cell.x, sz.H + 8, cell.z); this._pivot.add(pl); cell.evLight = pl; }
    else if (ev === 'FLOOD') { var fm = this.bx(this.TILE * 0.86, 0.55, this.TILE * 0.86, this.M.FLOOD_FX); fm.position.set(cell.x, 1.5, cell.z); this._pivot.add(fm); cell.evMesh = fm; }
    this._addLog(this.EVENTS[ev].n + ' → ' + (this.BNAMES[cell.t] || cell.t), this.EVENTS[ev].c);
  },

  // ───────────────────────────── Animation loop ─────────────────────────────
  startAnimation: function() {
    var self = this;
    if (this._animId) cancelAnimationFrame(this._animId);
    this._lastTs = 0;
    function animate(ts) {
      self._animId = requestAnimationFrame(animate);
      if (!self._grid || !self._renderer) return;
      var t0 = performance.now();
      var dt = self._lastTs ? Math.min(0.1, (ts - self._lastTs) / 1000) : 0.016; self._lastTs = ts;

      // Orbit
      if (self._orbit) self._pivot.rotation.y += self._orbit * dt;

      // Camera easing
      var ct = self._camTarget, cg = self._camGoal;
      if (ct.distanceToSquared(cg) > 0.01 || Math.abs(self._cam.zoom - self._zoomGoal) > 0.002) {
        ct.lerp(cg, 1 - Math.pow(0.002, dt));
        self._cam.zoom += (self._zoomGoal - self._cam.zoom) * (1 - Math.pow(0.002, dt));
        self._updateCam();
      }

      // Colour fades (era cross-fade)
      if (self._fades.length) {
        var keep = [];
        for (var i = 0; i < self._fades.length; i++) {
          var f = self._fades[i]; f.t += dt * 1000; var k = f.ms > 0 ? Math.min(1, f.t / f.ms) : 1; var e = k * k * (3 - 2 * k);
          if (f.to) f.m.color.copy(f.from).lerp(f.to, e);
          if (f.toOp != null) f.m.opacity = f.fromOp + (f.toOp - f.fromOp) * e;
          if (k < 1) keep.push(f);
        }
        self._fades = keep;
      }

      // Windows
      self._updateWindows(self._night, ts);

      // Signs: billboard about Y + pulse
      if (self._signs.length) {
        var camAng = Math.atan2(self._cam.position.x - ct.x, self._cam.position.z - ct.z) - self._pivot.rotation.y;
        for (var si = 0; si < self._signs.length; si++) {
          var sg = self._signs[si], owner = sg.parent && sg.parent.parent, la = camAng - (owner ? owner.rotation.y : 0), rr = sg.userData.radius;
          sg.rotation.y = la; sg.position.set(Math.sin(la) * rr, 0, Math.cos(la) * rr);
          var p = 1 + Math.sin(ts * 0.004 + sg.userData.phase) * 0.04; sg.scale.set(p, p, p);
        }
      }
      // Flags & crane jibs
      for (var ai = 0; ai < self._animated.length; ai++) {
        var a = self._animated[ai];
        if (a.userData.flag) { a.rotation.y = Math.sin(ts * 0.004 + a.position.x) * 0.35; a.scale.x = 0.85 + Math.sin(ts * 0.006) * 0.15; }
        else if (a.userData.jib) a.rotation.y = Math.sin(ts * 0.0003 + a.userData.phase) * 1.2;
      }
      // Clouds drift (counter the pivot so they drift in world space)
      if (self._clouds) for (var ci = 0; ci < self._clouds.length; ci++) {
        var cl = self._clouds[ci]; cl.position.x += cl.userData.speed * dt * 4; if (cl.position.x > 300) cl.position.x = -300;
      }
      // Water shimmer
      self.M.WATER.shininess = 100 + Math.sin(ts * 0.002) * 30;

      // Weather (rain in, fog banks, rain fall)
      self._tickWeather(dt);

      // Grid cells: events, growth, demolition
      var grid = self._grid;
      for (var r = 0; r < grid.length; r++) for (var c = 0; c < grid[r].length; c++) {
        var cell = grid[r][c];
        if (cell.ev && ts > cell.evEnd) { self._clearEvFX(cell); cell.ev = null; }
        if (cell.ev === 'FIRE' && cell.evLight) cell.evLight.intensity = 2.4 + Math.sin(ts * 0.016) * 0.8 + Math.random() * 0.5;
        if (cell.ev === 'BURGLARY' && cell.evLight) cell.evLight.color.setHex(Math.floor(ts / 500) % 2 ? 0xff1010 : 0x1010ff);
        if (cell.bGrp) {
          if (cell.ev === 'EARTHQUAKE') { cell.bGrp.position.x = cell.x + Math.sin(ts * 0.055) * 1.5; cell.bGrp.position.z = cell.z + Math.cos(ts * 0.04) * 0.9; }
          else { cell.bGrp.position.x = cell.x; cell.bGrp.position.z = cell.z; }
          if (cell.ev === 'FLOOD' && cell.evMesh) cell.evMesh.position.y = 1.5 + Math.sin(ts * 0.0014) * 1.4;
          if (!cell.demo && cell.sp < 1) { cell.sp = Math.min(1, cell.sp + dt * 0.9); var e2 = 1 - Math.pow(1 - cell.sp, 3); cell.bGrp.scale.y = e2; }
          if (cell.demo) { cell.sp = Math.max(0, cell.sp - dt * 0.8); cell.bGrp.scale.y = cell.sp; if (cell.sp <= 0) { self._removeBuilding(cell); cell.demo = false; cell.t = 'EMPTY'; cell.sp = 1; } }
        }
      }
      // Dying buildings (replaced with animation)
      if (self._dying && self._dying.length) {
        var dl = [];
        for (var di = 0; di < self._dying.length; di++) {
          var d = self._dying[di]; d.g.scale.y = Math.max(0, d.g.scale.y - dt * 1.4); d.g.scale.x = d.g.scale.z = 0.5 + d.g.scale.y * 0.5;
          if (d.g.scale.y <= 0) self._disposeObj(d.g); else dl.push(d);
        }
        self._dying = dl;
      }
      // Ambient events
      if (self._opts && self._opts.ambientEvents && ts >= self._nxtE) { self.triggerEvent(ts); self._nxtE = ts + 4500 + Math.random() * 5000; }
      // Selection ring pulse
      if (self._selRing && self._selRing.visible) { var sp = self.TILE * (1.03 + Math.sin(ts * 0.005) * 0.03); self._selRing.scale.set(sp, sp, 1); }
      // Rim pulse
      self._renderer.render(self._scene, self._cam);
      self._frameMs = self._frameMs * 0.9 + (performance.now() - t0) * 0.1;
    }
    this._animId = requestAnimationFrame(animate);
  },

  stopAnimation: function() { if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; } },
  getStats: function() { var i = this._renderer ? this._renderer.info.render : {}; return { frameMs: this._frameMs, calls: i.calls, triangles: i.triangles, quality: this._quality }; },
  /* Photo mode: render one frame synchronously and return a PNG data URL (share-card source). */
  photo: function() {
    if (!this._renderer || !this._scene || !this._cam) return null;
    this._renderer.render(this._scene, this._cam);
    try { return this._canvas.toDataURL('image/png'); } catch (e) { return null; }
  },

  // ───────────────────────────── Cleanup ─────────────────────────────
  destroy: function() {
    this.stopAnimation();
    var self = this;
    if (this._h) {
      var h = this._h, cv = this._canvas;
      if (cv) { ['mousedown', 'wheel', 'contextmenu', 'click', 'touchstart', 'touchmove', 'touchend'].forEach(function(k) { cv.removeEventListener(k, h[k]); }); }
      window.removeEventListener('mouseup', h.mouseup); window.removeEventListener('mousemove', h.mousemove); window.removeEventListener('resize', h.resize);
      document.removeEventListener('visibilitychange', h.vis);
      this._h = null;
    }
    if (this._io) { this._io.disconnect(); this._io = null; }
    if (this._scene) {
      this._sharedMats = this.M ? new Set(Object.keys(this.M).map(function(k) { return self.M[k]; })) : new Set();
      var objs = []; this._scene.traverse(function(o) { objs.push(o); });
      objs.forEach(function(o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { var mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(function(m) { if (!self._sharedMats.has(m)) { if (m.map && !m.map._keep) m.map.dispose(); m.dispose(); } }); }
      });
    }
    if (this._textures) { this._textures.forEach(function(t) { if (!t._keep) t.dispose(); }); }
    if (this._skyTex) { this._skyTex.dispose(); this._skyTex = null; }
    if (this._renderer) { this._renderer.dispose(); try { this._renderer.forceContextLoss(); } catch (e) {} }
    if (this._canvas && this._canvas.parentNode) this._canvas.parentNode.removeChild(this._canvas);
    this._scene = null; this._cam = null; this._renderer = null; this._pivot = null; this._grid = null; this._canvas = null;
    this._container = null; this._selCell = null; this._selRing = null; this._sun = null; this._amb = null; this._hemi = null;
    this._stars = null; this._moon = null; this._clouds = null; this._cityDef = null; this._onBuildingClick = null; this._opts = null;
    this._fades = []; this._winMeshes = null; this._signs = null; this._animated = null; this._textures = null; this._skins = null; this._dying = null;
    this._rain = null; this._weather = 'clear'; this._weatherK = 0; this._fogGoal = null;
    this._terrain = null; this._terrainGroup = null; this._bldgGroup = null; this._orbit = 0; this._zoomGoal = 1; this._frameMs = 0;
    this._profile = null; this._profCache = null; this._contactShadow = null;
    this._dragState = { active: false, prevX: 0, prevY: 0, startX: 0, startY: 0, moved: false };
    this._visible = true; this._tabVisible = true;
  },

  // ───────────────────────────── Entry point ─────────────────────────────
  renderCity: function(cityDef, container, properties, opts) {
    this.destroy();
    opts = opts || {};
    this._profile = opts.profile || cityDef.profile || null;
    this._profCache = {};
    if (!this.initScene(container, opts)) return false;
    this._cityDef = cityDef;
    this.buildCity(cityDef, properties);
    if (opts.autoOrbit) this.setAutoOrbit(opts.autoOrbit === true || opts.autoOrbit === 'untilTouch' ? 0.08 : opts.autoOrbit);
    this._tabVisible = document.visibilityState !== 'hidden';
    this.startAnimation();
    return true;
  },
};
