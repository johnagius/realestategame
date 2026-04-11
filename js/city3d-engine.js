/* ========================================
   PROPERTY EMPIRE — 3D City Engine (Part 1)
   Shared materials, geometry, building factories
   Requires: Three.js r128+ from CDN
   ======================================== */

const City3D = {

  // ── Materials ──
  M: null,

  initMaterials: function() {
    if (this.M) return;
    var DS = THREE.DoubleSide;
    function ph(c, o) { return new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 40 }, o || {})); }
    function lb(c, o) { return new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }

    this.M = {
      // House
      HOw: ph(0xb87050), HOr: ph(0xa83020, { side: DS }), HOt: ph(0xd09060),
      // Studio
      STw: ph(0x9898a8), STr: ph(0x787888, { side: DS }),
      // Apartment
      APw: ph(0x906878), APr: ph(0x8a80a8), APt: ph(0xc0a0b8),
      // Penthouse
      PHw: ph(0x6078a0, { transparent: true, opacity: 0.94 }),
      PHr: ph(0x80a0c8, { transparent: true, opacity: 0.94 }), PHt: ph(0xa0c0e0),
      // Townhouse
      THw: ph(0x8a5c3a), THr: ph(0x4a280e, { side: DS }), THt: ph(0xe0b850),
      // Villa
      VIw: ph(0xe0c890), VIr: ph(0xc07828, { side: DS }),
      // Mansion
      MNw: ph(0xddd8c0), MNr: ph(0x607858, { side: DS }), MNt: ph(0xfafaf0, { emissive: 0x080808 }),
      // Commercial
      CMw: ph(0xc87840), CMt: ph(0xffa040),
      // Warehouse
      WRw: ph(0x6a7868), WRr: ph(0x7a9880, { side: DS }),
      // Skyscraper
      SKw: ph(0x7090b0, { transparent: true, opacity: 0.95 }),
      SKr: ph(0x90b0d0, { transparent: true, opacity: 0.95 }), SKt: ph(0xc0e0f8),
      // Generic structural
      CONC: ph(0x888090), BRICK: ph(0x905a38), SOL: ph(0x70a870),
      // Windows
      WIN: lb(0xd8f0ff, { emissive: 0x3a5070, transparent: true, opacity: 0.9 }),
      WINLIT: lb(0xffe8a0, { emissive: 0x503800, transparent: true, opacity: 0.92 }),
      WINOFF: lb(0x1a2838),
      // Terrain
      GND: lb(0x1c1c2a), ROAD: lb(0x1c1c28),
      LANE: lb(0x888800, { transparent: true, opacity: 0.4 }),
      SIDEW: lb(0x28283a),
      PARK: lb(0x1c5a1c), PARKD: lb(0x145014), PARKL: lb(0x286028),
      WATER: ph(0x0c2440, { transparent: true, opacity: 0.88, shininess: 110 }),
      HARBOR: ph(0x071830, { transparent: true, opacity: 0.9 }),
      COUNTRY: lb(0x5a8830), COUNTRYD: lb(0x3a6818),
      // FX
      SCAFFOLD: ph(0xc89020, { transparent: true, opacity: 0.7 }),
      FLOOD_FX: ph(0x1050e0, { emissive: 0x001880, transparent: true, opacity: 0.48 }),
    };
  },

  // ── Geometry helpers ──
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

  addWindows: function(g, bw, bh, bd, floors, wpf, startY) {
    var M = this.M;
    var wm = Math.random() > 0.35 ? M.WIN : M.WINLIT;
    var fh = bh / floors, ws = Math.min(2.8, fh * 0.5), wd = 0.22;
    startY = startY || 0;
    for (var f = 0; f < floors; f++) {
      var fy = startY + fh * (f + 0.5);
      for (var i = 0; i < wpf; i++) {
        var u = (i + 1) / (wpf + 1), wx = -bw / 2 + u * bw;
        g.add(this.bx(ws, fh * 0.52, wd, wm, false).tap(function(a) { a.position.set(wx, fy, -bd / 2 - 0.12); }));
        g.add(this.bx(ws, fh * 0.52, wd, wm, false).tap(function(b) { b.position.set(wx, fy, bd / 2 + 0.12); }));
      }
      for (var i = 0; i < wpf; i++) {
        var u = (i + 1) / (wpf + 1), wz = -bd / 2 + u * bd;
        g.add(this.bx(wd, fh * 0.52, ws, wm, false).tap(function(a) { a.position.set(-bw / 2 - 0.12, fy, wz); }));
        g.add(this.bx(wd, fh * 0.52, ws, wm, false).tap(function(b) { b.position.set(bw / 2 + 0.12, fy, wz); }));
      }
    }
  },

  // Sprite label
  makeLabel: function(text) {
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 52;
    var c2 = cv.getContext('2d');
    c2.fillStyle = 'rgba(0,0,0,.84)';
    c2.fillRect(2, 2, 252, 48);
    c2.strokeStyle = 'rgba(200,158,48,.9)';
    c2.lineWidth = 2;
    c2.strokeRect(2, 2, 252, 48);
    c2.fillStyle = '#f0d860';
    c2.font = 'bold 18px sans-serif';
    c2.textAlign = 'center';
    c2.textBaseline = 'middle';
    c2.fillText(text, 128, 26);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false
    }));
    s.scale.set(15, 3, 1);
    return s;
  },

  // ── Building factories ──
  // Each returns a THREE.Group. s = random seed 0-1 for variation.

  buildHouse: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 13, H = 7 + s * 4, D = 11;
    var body = this.bx(W, H, D, M.HOw); body.position.y = H / 2; g.add(body);
    for (var i = 1; i < 4; i++) { var b = this.bx(W + 0.1, 0.35, D + 0.1, M.BRICK, false); b.position.y = i * (H / 4); g.add(b); }
    var roof = this.gabledRoof(W, H * 0.55, D, M.HOr); roof.position.y = H; g.add(roof);
    var ridge = this.bx(W, 0.32, 0.45, M.HOt, false); ridge.position.set(0, H + H * 0.55 - 0.1, 0); g.add(ridge);
    var ch = this.bx(2, 5.5, 2, M.BRICK); ch.position.set(W * 0.22, H + H * 0.55 * 0.48, 0); g.add(ch);
    var chC = this.bx(2.6, 0.45, 2.6, M.CONC, false); chC.position.set(W * 0.22, H + H * 0.55 * 0.48 + 3, 0); g.add(chC);
    var door = this.bx(1.8, 2.6, 0.25, M.WINOFF, false); door.position.set(0, 1.3, -D / 2 - 0.13); g.add(door);
    var step = this.bx(2.8, 0.45, 1.5, M.CONC); step.position.set(0, 0.23, -D / 2 - 1.2); g.add(step);
    this._addWinSimple(g, W, H, D, Math.max(1, Math.floor(H / 5)), 2);
    return g;
  },

  buildStudio: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 12, H = 12 + s * 3, D = 12;
    var body = this.bx(W, H, D, M.STw); body.position.y = H / 2; g.add(body);
    var par = this.bx(W + 0.8, 1.2, D + 0.8, M.STr); par.position.y = H + 0.6; g.add(par);
    var slab = this.bx(W - 0.4, 0.45, D - 0.4, M.CONC); slab.position.y = H + 1.2 + 0.22; g.add(slab);
    var pole = this.cy(0.18, 0.18, 3, 4, M.CONC); pole.position.set(W * 0.24, H + 2.5, D * 0.24); g.add(pole);
    var dish = this.bx(2, 0.28, 2, M.CONC, false); dish.rotation.x = 0.4; dish.position.set(W * 0.24, H + 4, D * 0.24); g.add(dish);
    this._addWinSimple(g, W, H, D, Math.max(2, Math.floor(H / 6)), 2);
    return g;
  },

  buildApartment: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 15, H = 28 + s * 12, D = 13;
    var body = this.bx(W, H, D, M.APw); body.position.y = H / 2; g.add(body);
    var sb = this.bx(W * 0.78, H * 0.26, D * 0.78, M.APr); sb.position.y = H + H * 0.26 / 2; g.add(sb);
    var cor = this.bx(W + 0.9, 1.1, D + 0.9, M.APt, false); cor.position.y = H + 0.55; g.add(cor);
    var wtP = this.cy(0.2, 0.2, 4, 4, M.HOt); wtP.position.set(W * 0.28, H + 2.75, D * 0.28); g.add(wtP);
    var wtT = this.cy(2.2, 2.2, 4.5, 8, M.HOt); wtT.position.set(W * 0.28, H + 4.5 + 2.25, D * 0.28); g.add(wtT);
    var wtR = this.cy(0, 2.6, 2.5, 8, M.HOr); wtR.position.set(W * 0.28, H + 4.5 + 4.5 + 1.25, D * 0.28); g.add(wtR);
    this._addWinSimple(g, W, H, D, Math.floor(H / 6.5), 3);
    return g;
  },

  buildPenthouse: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 17, H = 44 + s * 16, D = 15;
    var body = this.bx(W, H, D, M.PHw); body.position.y = H / 2; g.add(body);
    for (var i = 1; i < 5; i++) { var mu = this.bx(0.28, H, 0.28, M.PHt, false); mu.position.set(-W / 2 + i * (W / 5), H / 2, D / 2 + 0.14); g.add(mu); }
    var mid = this.bx(W * 0.74, H * 0.32, D * 0.74, M.PHr); mid.position.y = H + H * 0.32 / 2; g.add(mid);
    var top = this.bx(W * 0.46, H * 0.16, D * 0.46, M.PHt); top.position.y = H + H * 0.32 + H * 0.16 / 2; g.add(top);
    var spire = this.cy(0, 0.9, 22, 4, M.CONC); spire.position.y = H + H * 0.32 + H * 0.16 + 11; g.add(spire);
    this._addWinSimple(g, W, H, D, Math.floor(H / 7), 4);
    return g;
  },

  buildTownhouse: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 11, H = 20 + s * 8, D = 13;
    var body = this.bx(W, H, D, M.THw); body.position.y = H / 2; g.add(body);
    for (var i = 1; i <= 3; i++) { var b = this.bx(W + 0.1, 0.32, D + 0.1, M.HOt, false); b.position.y = i * (H / 4); g.add(b); }
    var roof = this.gabledRoof(W, H * 0.3, D, M.THr); roof.position.y = H; g.add(roof);
    var stoop = this.bx(W * 0.6, 1.4, 3.5, M.CONC); stoop.position.set(0, 0.7, -D / 2 - 1.75); g.add(stoop);
    var rail = this.bx(W * 0.6, 2, 0.28, M.THt, false); rail.position.set(0, 1.4 + 1, -D / 2 - 3.5); g.add(rail);
    this._addWinSimple(g, W, H, D, Math.floor(H / 5.5), 2);
    return g;
  },

  buildVilla: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 18, H = 16 + s * 6, D = 15;
    var body = this.bx(W, H, D, M.VIw); body.position.y = H / 2; g.add(body);
    var roof = this.hipRoof(W, H * 0.46, D, M.VIr); roof.position.y = H; g.add(roof);
    var ch = this.bx(2.2, 5.5, 2.2, M.BRICK); ch.position.set(W * 0.24, H + H * 0.46 * 0.42, 0); g.add(ch);
    var self = this;
    [-W * 0.3, W * 0.3].forEach(function(px) {
      var col = self.cy(0.55, 0.55, H * 0.44, 10, M.MNt); col.position.set(px, H * 0.22, -D / 2); g.add(col);
    });
    this._addWinSimple(g, W, H, D, Math.floor(H / 6), 2);
    return g;
  },

  buildMansion: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 22, H = 26 + s * 8, D = 18;
    var body = this.bx(W, H, D, M.MNw); body.position.y = H / 2; g.add(body);
    var self = this;
    [[-W * 0.54, 0], [W * 0.54, 0]].forEach(function(a) {
      var wing = self.bx(W * 0.38, H * 0.6, D * 0.66, M.MNw); wing.position.set(a[0], H * 0.6 / 2, 0); g.add(wing);
      var wr = self.hipRoof(W * 0.38, H * 0.17, D * 0.66, M.MNr); wr.position.set(a[0], H * 0.6, 0); g.add(wr);
    });
    var mainRoof = this.hipRoof(W, H * 0.22, D, M.MNr); mainRoof.position.y = H; g.add(mainRoof);
    var cor = this.bx(W + 0.8, 0.9, D + 0.8, M.MNt, false); cor.position.y = H + 0.45; g.add(cor);
    for (var i = 0; i < 5; i++) {
      var u = (i + 0.5) / 5;
      var col = this.cy(0.65, 0.65, H * 0.38, 10, M.MNt); col.position.set(-W / 2 + u * W, H * 0.19, -D / 2); g.add(col);
    }
    var entab = this.bx(W + 0.4, 1.8, 2, M.MNt, false); entab.position.set(0, H * 0.38 + 0.55 + 0.9, -D / 2); g.add(entab);
    this._addWinSimple(g, W, H, D, Math.floor(H / 7), 3);
    return g;
  },

  buildCommercial: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 18, H = 9 + s * 3, D = 15;
    var body = this.bx(W, H, D, M.CMw); body.position.y = H / 2; g.add(body);
    var par = this.bx(W + 0.5, 1.5, D + 0.5, M.CMt, false); par.position.y = H + 0.75; g.add(par);
    var awn = this.bx(W * 0.88, 0.65, 4, M.CMt); awn.rotation.x = 0.2; awn.position.set(0, H * 0.4, -D / 2 - 1.8); g.add(awn);
    var sign = this.bx(W * 0.8, H * 0.2, 0.32, M.CMt, false); sign.position.set(0, H * 0.72, -D / 2 - 0.16); g.add(sign);
    var glass = this.bx(W * 0.85, H * 0.32, 0.18, M.WIN, false); glass.position.set(0, H * 0.16, -D / 2 - 0.09); g.add(glass);
    return g;
  },

  buildWarehouse: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 21, H = 12 + s * 4, D = 19;
    var body = this.bx(W, H, D, M.WRw); body.position.y = H / 2; g.add(body);
    for (var i = 0; i < 7; i++) { var b = this.bx(W, 0.18, D + 0.1, M.WRr, false); b.position.y = i * (H / 7); g.add(b); }
    var roof = this.gabledRoof(W, H * 0.3, D, M.WRr); roof.position.y = H; g.add(roof);
    var dock = this.bx(W * 0.36, 2.5, 4.5, M.CONC); dock.position.set(-W * 0.2, 1.25, -D / 2 - 2.25); g.add(dock);
    var dockD = this.bx(W * 0.28, 2.2, 0.28, M.WINOFF, false); dockD.position.set(-W * 0.2, 1.1, -D / 2 - 0.14); g.add(dockD);
    return g;
  },

  buildSkyscraper: function(s) {
    var g = new THREE.Group(), M = this.M;
    var W = 16, H = 50 + s * 18, D = 14;
    var body = this.bx(W, H, D, M.SKw); body.position.y = H / 2; g.add(body);
    for (var i = 1; i < 5; i++) { var mu = this.bx(0.28, H, 0.28, M.SKt, false); mu.position.set(-W / 2 + i * (W / 5), H / 2, D / 2 + 0.14); g.add(mu); }
    var s1 = this.bx(W * 0.76, H * 0.3, D * 0.76, M.SKr); s1.position.y = H + H * 0.3 / 2; g.add(s1);
    var s2 = this.bx(W * 0.5, H * 0.18, D * 0.5, M.SKt); s2.position.y = H + H * 0.3 + H * 0.18 / 2; g.add(s2);
    var spire = this.cy(0, 1.2, 22, 4, M.CONC); spire.position.y = H + H * 0.3 + H * 0.18 + 11; g.add(spire);
    this._addWinSimple(g, W, H, D, Math.floor(H / 8), 4);
    return g;
  },

  // Simplified window adder (doesn't use .tap — compatible with vanilla Three.js)
  _addWinSimple: function(g, bw, bh, bd, floors, wpf, startY) {
    var M = this.M;
    var wm = Math.random() > 0.35 ? M.WIN : M.WINLIT;
    var fh = bh / floors, ws = Math.min(2.8, fh * 0.5), wd = 0.22;
    startY = startY || 0;
    for (var f = 0; f < floors; f++) {
      var fy = startY + fh * (f + 0.5);
      for (var i = 0; i < wpf; i++) {
        var u = (i + 1) / (wpf + 1), wx = -bw / 2 + u * bw;
        var a = this.bx(ws, fh * 0.52, wd, wm, false); a.position.set(wx, fy, -bd / 2 - 0.12); g.add(a);
        var b = this.bx(ws, fh * 0.52, wd, wm, false); b.position.set(wx, fy, bd / 2 + 0.12); g.add(b);
      }
      for (var i = 0; i < wpf; i++) {
        var u = (i + 1) / (wpf + 1), wz = -bd / 2 + u * bd;
        var a2 = this.bx(wd, fh * 0.52, ws, wm, false); a2.position.set(-bw / 2 - 0.12, fy, wz); g.add(a2);
        var b2 = this.bx(wd, fh * 0.52, ws, wm, false); b2.position.set(bw / 2 + 0.12, fy, wz); g.add(b2);
      }
    }
  },

  // Map building type key → factory function
  buildByType: function(typeKey, seed) {
    switch (typeKey) {
      case 'house': case 'HO': return this.buildHouse(seed);
      case 'studio': case 'ST': return this.buildStudio(seed);
      case 'apartment': case 'AP': return this.buildApartment(seed);
      case 'penthouse': case 'PH': return this.buildPenthouse(seed);
      case 'townhouse': case 'TH': return this.buildTownhouse(seed);
      case 'villa': case 'VI': return this.buildVilla(seed);
      case 'mansion': case 'MN': return this.buildMansion(seed);
      case 'commercial': case 'CM': return this.buildCommercial(seed);
      case 'warehouse': case 'WR': return this.buildWarehouse(seed);
      case 'skyscraper': case 'SK': return this.buildSkyscraper(seed);
      default: return this.buildStudio(seed);
    }
  },

  // Building type display names
  BNAMES: {
    HO: '🏠 House', ST: '🏢 Studio', AP: '🏬 Apartment', PH: '🌇 Penthouse',
    TH: '🏘️ Townhouse', VI: '🏡 Villa', MN: '🏰 Mansion', CM: '🏪 Commercial',
    WR: '🏭 Warehouse', SK: '🏙️ Skyscraper'
  },

  // Tile types that contain buildings
  BLDG_TYPES: new Set(['HO', 'ST', 'AP', 'PH', 'TH', 'VI', 'MN', 'CM', 'WR', 'SK']),

  // Event definitions
  EVENTS: {
    FIRE:       { c: '#ff6010', n: 'Fire',       em: '🔥', d: [8000, 14000] },
    FLOOD:      { c: '#2090ff', n: 'Flood',      em: '🌊', d: [10000, 20000] },
    STORM:      { c: '#8090e0', n: 'Storm',      em: '⛈',  d: [6000, 12000] },
    EARTHQUAKE: { c: '#c09050', n: 'Earthquake', em: '🌍', d: [3000, 7000] },
    RENOVATION: { c: '#e0a020', n: 'Renovation', em: '🏗',  d: [12000, 25000] },
    BURGLARY:   { c: '#a040f0', n: 'Burglary',   em: '🚨', d: [5000, 10000] },
  },
};
