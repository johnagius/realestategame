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

  // ========== PART 2: Scene, Grid, Events, Animation ==========

  TILE: 28,
  _scene: null,
  _cam: null,
  _renderer: null,
  _pivot: null,
  _grid: null,
  _animId: null,
  _container: null,
  _canvas: null,
  _selCell: null,
  _selWire: null,
  _evLog: [],
  _nxtE: 6000,
  _nxtSD: 16000,
  _rng: null,
  _dragState: { active: false, prevX: 0, startX: 0 },
  _cityDef: null, // current city definition
  _onBuildingClick: null, // callback(cell) when a building is clicked

  // Seeded RNG
  _mkRng: function(s) {
    var sd = s;
    return function() { sd = ((sd * 1664525) + 1013904223) & 0xffffffff; return (sd >>> 0) / 0xffffffff; };
  },

  // ── Scene setup ──
  initScene: function(container) {
    if (typeof THREE === 'undefined') { console.warn('Three.js not loaded'); return false; }
    this.initMaterials();

    var VW = container.clientWidth || 800;
    var VH = container.clientHeight || 500;

    // Scene
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c1a);
    scene.fog = new THREE.Fog(0x060c1a, 340, 680);
    this._scene = scene;

    // Camera — isometric orthographic
    var asp = VW / VH, CS = 108;
    var cam = new THREE.OrthographicCamera(-CS * asp, CS * asp, CS, -CS, 1, 1500);
    cam.position.set(200, 168, 200);
    cam.lookAt(0, 8, 0);
    this._cam = cam;

    // Renderer
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(canvas);
    this._canvas = canvas;
    this._container = container;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(VW, VH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    this._renderer = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0x2a2438, 1.1));
    var sun = new THREE.DirectionalLight(0xfff0e0, 1.9);
    sun.position.set(130, 220, 90);
    sun.castShadow = true;
    sun.shadow.camera.left = -260; sun.shadow.camera.right = 260;
    sun.shadow.camera.top = 260; sun.shadow.camera.bottom = -260;
    sun.shadow.camera.far = 700;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.001;
    scene.add(sun);
    this._sun = sun;
    scene.add(new THREE.HemisphereLight(0x182840, 0x201808, 0.72));

    // Stars
    var sp = [];
    for (var i = 0; i < 1200; i++) {
      var t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 640 + Math.random() * 140;
      sp.push(r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
    }
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xddeeff, size: 1.4, sizeAttenuation: false })));

    // Pivot for rotation
    var pivot = new THREE.Group();
    scene.add(pivot);
    this._pivot = pivot;

    // Selection wireframe
    var selWire = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.9 })
    );
    selWire.visible = false;
    scene.add(selWire);
    this._selWire = selWire;

    // Drag rotation — store refs for cleanup in destroy()
    var ds = this._dragState;
    var self = this;
    canvas.addEventListener('mousedown', function(e) { ds.active = true; ds.prevX = ds.startX = e.clientX; });
    this._onMouseUp = function() { ds.active = false; };
    this._onMouseMove = function(e) {
      if (ds.active && self._pivot) { self._pivot.rotation.y -= (e.clientX - ds.prevX) * 0.006; ds.prevX = e.clientX; }
    };
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('mousemove', this._onMouseMove);

    // Touch support
    canvas.addEventListener('touchstart', function(e) { if (e.touches.length === 1) { ds.active = true; ds.prevX = ds.startX = e.touches[0].clientX; } }, { passive: true });
    this._onTouchEnd = function() { ds.active = false; };
    this._onTouchMove = function(e) {
      if (ds.active && e.touches.length === 1 && self._pivot) { self._pivot.rotation.y -= (e.touches[0].clientX - ds.prevX) * 0.006; ds.prevX = e.touches[0].clientX; }
    };
    window.addEventListener('touchend', this._onTouchEnd);
    window.addEventListener('touchmove', this._onTouchMove, { passive: true });

    // Click / tap selection
    var rc = new THREE.Raycaster(), mouse = new THREE.Vector2();
    canvas.addEventListener('click', function(e) {
      if (Math.abs(e.clientX - ds.startX) > 6) return;
      var rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      rc.setFromCamera(mouse, cam);
      var hits = rc.intersectObjects(pivot.children, true).filter(function(h) { return h.object.userData.cell; });
      if (hits.length) {
        var cell = hits[0].object.userData.cell;
        self._selCell = cell;
        selWire.visible = true;
        // Fire click callback if registered
        if (self._onBuildingClick) self._onBuildingClick(cell);
      } else {
        self._selCell = null;
        selWire.visible = false;
      }
    });

    // Window resize handler
    var self2 = this;
    this._onResize = function() {
      if (!self2._container || !self2._renderer || !self2._cam) return;
      var nW = self2._container.clientWidth, nH = self2._container.clientHeight;
      if (nW < 1 || nH < 1) return;
      var nA = nW / nH;
      self2._cam.left = -CS * nA; self2._cam.right = CS * nA;
      self2._cam.top = CS; self2._cam.bottom = -CS;
      self2._cam.updateProjectionMatrix();
      self2._renderer.setSize(nW, nH);
    };
    window.addEventListener('resize', this._onResize);

    this._rng = this._mkRng(31415);
    return true;
  },

  // ── Tile factory ──
  makeTile: function(t, r, c) {
    var g = new THREE.Group(), T = this.TILE, M = this.M;
    switch (t) {
      case 'W': g.add(this.flatPlane(T, T, M.WATER)); break;
      case 'HB': g.add(this.flatPlane(T, T, M.HARBOR)); break;
      case 'RD': {
        var rp = this.flatPlane(T, T, M.ROAD); rp.position.y = 0.04; g.add(rp);
        // Sidewalks
        var self = this;
        [[-T / 2 + 1.75], [T / 2 - 1.75]].forEach(function(a) {
          var sw = self.bx(3.5, 0.22, T, M.SIDEW); sw.position.set(a[0], 0.11, 0); g.add(sw);
          var sw2 = self.bx(T, 0.22, 3.5, M.SIDEW); sw2.position.set(0, 0.11, a[0]); g.add(sw2);
        });
        // Lane markings
        var lv = this.flatPlane(1.2, T * 0.82, M.LANE); lv.position.y = 0.1; g.add(lv);
        var lh = this.flatPlane(T * 0.82, 1.2, M.LANE); lh.position.y = 0.1; g.add(lh);
        // Street lamp
        var pole = this.cy(0.22, 0.22, 9, 6, M.CONC); pole.position.set(T * 0.32, 4.5, T * 0.32); g.add(pole);
        var armB = this.bx(3.8, 0.24, 0.24, M.CONC, false); armB.position.set(T * 0.32 + 1.9, 9, T * 0.32); g.add(armB);
        var bulb = new THREE.PointLight(0xffe8a0, 0.88, 36); bulb.position.set(T * 0.32 + 3.8, 9.3, T * 0.32); g.add(bulb);
        // Power pole (every other intersection)
        if ((r + c) % 2 === 0) {
          var pp = this.cy(0.28, 0.28, 14, 6, M.HOt); pp.position.set(-T * 0.34, 7, -T * 0.34); g.add(pp);
          var cr = this.bx(9, 0.4, 0.4, M.HOt, false); cr.position.set(-T * 0.34, 12, -T * 0.34); g.add(cr);
          var wire = this.bx(18, 0.1, 0.1, M.WINOFF, false); wire.position.set(-T * 0.34, 12, -T * 0.34); g.add(wire);
        }
        break;
      }
      case 'CP': {
        var pp = this.flatPlane(T, T, M.PARK); pp.position.y = 0.05; g.add(pp);
        var pv = this.bx(2.8, 0.16, T * 0.88, M.SIDEW); pv.position.set(T * 0.06, 0.08, 0); g.add(pv);
        var self = this;
        [[-7, -7], [6, -7], [6, 6], [-7, 6]].forEach(function(a) {
          var trunk = self.cy(0.4, 0.55, 5, 6, M.HOt); trunk.position.set(a[0], 2.5, a[1]); g.add(trunk);
          var lv2 = self.sphr(4.8, 7, M.PARKD); lv2.position.set(a[0], 7.5, a[1]); g.add(lv2);
          var lv3 = self.sphr(3.2, 6, M.PARKL); lv3.position.set(a[0] + 1.2, 9.8, a[1] + 0.8); g.add(lv3);
        });
        var bench = this.bx(4.5, 0.38, 1.2, M.CONC); bench.position.set(2, 0.38, -T * 0.3); g.add(bench);
        break;
      }
      case 'CT': {
        g.add(this.flatPlane(T, T, (r + c) % 2 === 0 ? M.COUNTRY : M.COUNTRYD));
        for (var i = -2; i <= 2; i++) { var row = this.bx(T * 0.88, 0.38, 1.2, M.COUNTRYD); row.position.set(0, 0.19, i * 4.8); g.add(row); }
        var fence = this.bx(T * 0.9, 0.38, 0.2, M.HOt); fence.position.set(0, 0.38, -T * 0.42); g.add(fence);
        for (var i = -3; i <= 3; i++) { var post = this.bx(0.38, 1.8, 0.2, M.HOt); post.position.set(i * (T / 7), 1, -T * 0.42); g.add(post); }
        if ((r * 3 + c * 5) % 4 === 0) {
          var trunk = this.cy(0.5, 0.6, 7, 7, M.HOt); trunk.position.set(-8, 3.5, -7); g.add(trunk);
          var lv2 = this.sphr(5.5, 7, M.PARKD); lv2.position.set(-8, 9.5, -7); g.add(lv2);
        }
        break;
      }
      default: g.add(this.flatPlane(T, T, M.GND)); break;
    }
    return g;
  },

  // ── Build the full grid from a city definition ──
  buildCity: function(cityDef) {
    if (!this._pivot) return;
    this._cityDef = cityDef;

    var layout = cityDef.layout;
    var GH = layout.length, GW = layout[0].length;
    var T = this.TILE;
    var OX = -(GW - 1) * T / 2, OZ = -(GH - 1) * T / 2;
    var grid = [];
    var self = this;
    var rng = this._rng;

    layout.forEach(function(row, r) {
      grid[r] = [];
      row.forEach(function(t, c) {
        var x = OX + c * T, z = OZ + r * T;

        // Place tile
        var tg = self.makeTile(t, r, c);
        tg.position.set(x, 0, z);
        self._pivot.add(tg);

        var cell = { t: t, ev: null, evEnd: 0, sp: 1, demo: false, r: r, c: c, x: x, z: z, bGrp: null, evMesh: null, evLight: null };

        // Place building if tile is a building type
        var isBuilding = self.BLDG_TYPES.has(t);
        // Also check if it's a landmark key
        var isLandmark = cityDef.landmarks && cityDef.landmarks[t];

        if (isBuilding) {
          var seed = rng();
          var bg = self.buildByType(t, seed);
          bg.position.set(x, 0, z);
          bg.traverse(function(m) { if (m.isMesh) m.userData.cell = cell; });
          self._pivot.add(bg);
          cell.bGrp = bg;
        } else if (isLandmark) {
          var lmFn = cityDef.landmarks[t];
          if (typeof lmFn === 'function') {
            try {
              var bg = lmFn.call(self);
              bg.position.set(x, 0, z);
              bg.traverse(function(m) { if (m.isMesh) m.userData.cell = cell; });
              self._pivot.add(bg);
              cell.bGrp = bg;
              self.BNAMES[t] = t;
            } catch(e) {
              // Landmark failed to build — render ground tile instead
              var fallback = self.flatPlane(self.TILE, self.TILE, self.M.GND);
              fallback.position.set(x, 0, z);
              self._pivot.add(fallback);
            }
          }
        }

        grid[r][c] = cell;
      });
    });

    // Merge landmark names from city def
    if (cityDef.landmarkNames) {
      for (var k in cityDef.landmarkNames) {
        this.BNAMES[k] = cityDef.landmarkNames[k];
      }
    }

    this._grid = grid;
    this._evLog = [];
    this._nxtE = 6000;
    this._nxtSD = 16000;
  },

  // ── Event system ──
  _addLog: function(txt, col) {
    this._evLog.unshift({ txt: txt, col: col });
    if (this._evLog.length > 5) this._evLog.pop();
  },

  _clearEvFX: function(cell) {
    if (cell.evMesh) { this._pivot.remove(cell.evMesh); cell.evMesh = null; }
    if (cell.evLight) { this._scene.remove(cell.evLight); cell.evLight = null; }
  },

  triggerEvent: function(ts) {
    var grid = this._grid;
    if (!grid) return;
    var self = this;
    var bl = grid.flat().filter(function(c) { return (self.BLDG_TYPES.has(c.t) || (self._cityDef && self._cityDef.landmarks && self._cityDef.landmarks[c.t])) && !c.demo && c.bGrp; });
    if (!bl.length) return;

    var cell = bl[Math.floor(Math.random() * bl.length)];
    var keys = Object.keys(this.EVENTS);
    var ev = keys[Math.floor(Math.random() * keys.length)];
    this._clearEvFX(cell);
    cell.ev = ev;
    var d = this.EVENTS[ev].d;
    cell.evEnd = ts + d[0] + Math.random() * (d[1] - d[0]);

    if (cell.bGrp) {
      var bb = new THREE.Box3().setFromObject(cell.bGrp);
      var sz = new THREE.Vector3(); bb.getSize(sz);

      if (ev === 'FIRE') {
        var fl = new THREE.PointLight(0xff5500, 3, 75);
        fl.position.set(cell.x, sz.y * 0.65, cell.z);
        this._scene.add(fl); cell.evLight = fl;
      } else if (ev === 'BURGLARY' || ev === 'STORM') {
        var pl = new THREE.PointLight(ev === 'BURGLARY' ? 0x6010ff : 0x4060e0, 1.8, 60);
        pl.position.set(cell.x, sz.y + 8, cell.z);
        this._scene.add(pl); cell.evLight = pl;
      } else if (ev === 'RENOVATION') {
        var sg = new THREE.Group();
        var sw = sz.x + 2, sd2 = sz.z + 2, sh = sz.y;
        var M = this.M;
        [[-sw / 2, -sd2 / 2], [sw / 2, -sd2 / 2], [sw / 2, sd2 / 2], [-sw / 2, sd2 / 2]].forEach(function(a) {
          var pp = self.cy(0.26, 0.26, sh, 4, M.SCAFFOLD);
          pp.position.set(cell.x + a[0], sh / 2, cell.z + a[1]); sg.add(pp);
        });
        for (var lv = 0; lv < Math.ceil(sh / 10); lv++) {
          var y = lv * 10 + 5;
          var h1 = self.bx(sw, 0.28, 0.28, M.SCAFFOLD, false); h1.position.set(cell.x, y, cell.z - sd2 / 2); sg.add(h1);
          var h2 = self.bx(sw, 0.28, 0.28, M.SCAFFOLD, false); h2.position.set(cell.x, y, cell.z + sd2 / 2); sg.add(h2);
          var h3 = self.bx(0.28, 0.28, sd2, M.SCAFFOLD, false); h3.position.set(cell.x - sw / 2, y, cell.z); sg.add(h3);
          var h4 = self.bx(0.28, 0.28, sd2, M.SCAFFOLD, false); h4.position.set(cell.x + sw / 2, y, cell.z); sg.add(h4);
        }
        this._pivot.add(sg); cell.evMesh = sg;
      } else if (ev === 'FLOOD') {
        var T = this.TILE;
        var fm = this.bx(T * 0.86, 0.55, T * 0.86, this.M.FLOOD_FX);
        fm.position.set(cell.x, 1.5, cell.z);
        this._pivot.add(fm); cell.evMesh = fm;
      }
    }

    this._addLog(this.EVENTS[ev].em + ' ' + this.EVENTS[ev].n + ' → ' + (this.BNAMES[cell.t] || cell.t), this.EVENTS[ev].c);
  },

  // ── Animation loop ──
  startAnimation: function() {
    var self = this;
    if (this._animId) cancelAnimationFrame(this._animId);

    function animate(ts) {
      self._animId = requestAnimationFrame(animate);
      if (!self._grid) return;

      // Update events + building animations
      self._grid.flat().forEach(function(cell) {
        if (cell.ev && ts > cell.evEnd) { self._clearEvFX(cell); cell.ev = null; }
        if (cell.ev === 'FIRE' && cell.evLight) cell.evLight.intensity = 2.4 + Math.sin(ts * 0.016) * 0.8 + Math.random() * 0.5;
        if (cell.ev === 'BURGLARY' && cell.evLight) cell.evLight.color.setHex(Math.floor(ts / 500) % 2 ? 0xff1010 : 0x1010ff);
        if (cell.ev === 'EARTHQUAKE' && cell.bGrp) {
          cell.bGrp.position.x = cell.x + Math.sin(ts * 0.055) * 1.5;
          cell.bGrp.position.z = cell.z + Math.cos(ts * 0.04) * 0.9;
        } else if (cell.bGrp) {
          cell.bGrp.position.x = cell.x;
          cell.bGrp.position.z = cell.z;
        }
        if (cell.ev === 'FLOOD' && cell.evMesh) cell.evMesh.position.y = 1.5 + Math.sin(ts * 0.0014) * 1.4;
        // Construction animation (scale up from 0)
        if (!cell.demo && cell.sp < 1 && cell.bGrp) { cell.sp = Math.min(1, cell.sp + 0.006); cell.bGrp.scale.y = cell.sp; }
        // Demolition animation (scale down to 0)
        if (cell.demo && cell.bGrp) {
          cell.sp = Math.max(0, cell.sp - 0.007);
          cell.bGrp.scale.y = cell.sp;
          if (cell.sp <= 0) { self._pivot.remove(cell.bGrp); cell.bGrp = null; cell.demo = false; cell.t = 'EMPTY'; cell.sp = 1; self._clearEvFX(cell); }
        }
      });

      // Periodic events
      if (ts >= self._nxtE) { self.triggerEvent(ts); self._nxtE = ts + 4500 + Math.random() * 5000; }

      // Update selection wireframe
      if (self._selCell && self._selCell.bGrp) {
        var bb = new THREE.Box3().setFromObject(self._selCell.bGrp);
        var sz = new THREE.Vector3(), ctr = new THREE.Vector3();
        bb.getSize(sz); bb.getCenter(ctr);
        self._selWire.position.copy(ctr);
        self._selWire.scale.set(sz.x + 1.5, sz.y + 1.5, sz.z + 1.5);
      }

      // Sun variation
      if (self._sun) self._sun.intensity = 1.6 + Math.sin(ts * 0.0001) * 0.3;

      if (self._renderer && self._scene && self._cam) self._renderer.render(self._scene, self._cam);
    }

    requestAnimationFrame(animate);
  },

  stopAnimation: function() {
    if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; }
  },

  // ── Cleanup ──
  destroy: function() {
    this.stopAnimation();
    // Remove all window-level event listeners
    if (this._onResize) { window.removeEventListener('resize', this._onResize); this._onResize = null; }
    if (this._onMouseUp) { window.removeEventListener('mouseup', this._onMouseUp); this._onMouseUp = null; }
    if (this._onMouseMove) { window.removeEventListener('mousemove', this._onMouseMove); this._onMouseMove = null; }
    if (this._onTouchEnd) { window.removeEventListener('touchend', this._onTouchEnd); this._onTouchEnd = null; }
    if (this._onTouchMove) { window.removeEventListener('touchmove', this._onTouchMove); this._onTouchMove = null; }
    // Dispose Three.js geometries but preserve shared City3D.M materials
    // Materials in City3D.M are reused across cities — disposing them breaks subsequent renders
    if (this._scene) {
      var shared = this.M ? new Set(Object.keys(this.M).map(function(k) { return City3D.M[k]; })) : new Set();
      this._scene.traverse(function(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(function(m) { if (!shared.has(m)) m.dispose(); });
        }
      });
    }
    if (this._renderer) this._renderer.dispose();
    if (this._canvas && this._canvas.parentNode) this._canvas.parentNode.removeChild(this._canvas);
    this._scene = null; this._cam = null; this._renderer = null;
    this._pivot = null; this._grid = null; this._canvas = null;
    this._container = null; this._selCell = null; this._selWire = null;
    this._sun = null; this._cityDef = null; this._onBuildingClick = null;
    this._dragState = { active: false, prevX: 0, startX: 0 };
  },

  // ── Main entry point: render a city into a container ──
  renderCity: function(cityDef, container) {
    this.destroy();
    if (!this.initScene(container)) return;
    this.buildCity(cityDef);
    this.startAnimation();
  },
};
