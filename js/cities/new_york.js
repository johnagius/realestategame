/* ========================================
   PROPERTY EMPIRE — New York City Definition
   Layout grid + landmark factories for City3D engine
   ======================================== */

var CityDef_NewYork = {

  name: 'New York',
  id: 'new_york',

  // Project Skyline profile (SKYLINE-5): cool steel blue-grey, crisp — slate skies
  // with a silver-peach horizon, steel harbour water, asphalt ground, deep Central
  // Park green. Resolved by City3D._prof: era key > base > ERAS palette.
  // Victorian/Gilded get gas lamps + coal-smog dusk, Digital neon + dark mirror water.
  profile: {
    base: { skyline: 0x1a243c, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.07, sunDay: 0xf2e6d2, sunDusk: 0x8ea2d2,
      ambDay: 0x303a4e, ambDusk: 0x182034, hemiSky: 0xb4ccea, hemiGround: 0x3c404a,
      wallJitter: 0.05, water: { color: 0x1c4a6e, specular: 0x92badc, opacity: 0.9 },
      trees: 'plane', lamps: 'modern' },
    victorian: { sky: ['#1e2038', '#5a5a72', '#d89a6a'], fog: 0x464656, haze: 0.3, lamps: 'gas',
      sunDusk: 0xd8905c, ambDusk: 0x201c2c, ground: 0x26262a, road: 0x1f2024, side: 0x3e3e44, park: 0x2a4a26 },
    gilded:    { sky: ['#1e2240', '#5c5e78', '#e0a071'], fog: 0x484a5c, haze: 0.26, lamps: 'gas',
      sunDusk: 0xd8905c, ambDusk: 0x201e2e, ground: 0x28282c, road: 0x212226, side: 0x404046, park: 0x2b4e27 },
    crisis:    { sky: ['#181e34', '#4a5474', '#c8a078'], fog: 0x3c4258, haze: 0.3,
      ground: 0x27282c, road: 0x1e1f24, side: 0x3d3e46, park: 0x2a4826 },
    boom:      { sky: ['#162148', '#565e8e', '#eeaa6e'], fog: 0x424a70, haze: 0.18,
      ground: 0x292b31, road: 0x22232a, side: 0x434651, park: 0x2c522a },
    modern:    { sky: ['#12234a', '#3f568e', '#e2a26e'], fog: 0x2c3c66, haze: 0.2,
      ground: 0x272a32, road: 0x21232b, side: 0x434650, park: 0x2a542c },
    digital:   { sky: ['#081230', '#22346e', '#8a5aa0'], fog: 0x1a2650, haze: 0.14, lamps: 'neon',
      water: { color: 0x0c2440, specular: 0xcce4fa, opacity: 0.87 },
      ground: 0x1e222c, road: 0x171a22, side: 0x333746, park: 0x224a28 },
  },

  // Grid layout: 7 columns × 8 rows
  // W=water, HB=harbor, RD=road, CP=central park, CT=countryside
  // HO/ST/AP/PH/TH/VI/MN/CM/WR/SK = building types
  // ESB/CHR/OWT/SOL = landmarks
  layout: [
    ['W',  'CT', 'BST','CP', 'CP', 'CT', 'W' ],
    ['W',  'AP', 'RD', 'CP', 'CP', 'MN', 'W' ],
    ['W',  'RD', 'RD', 'RD', 'RD', 'RD', 'W' ],
    ['W',  'TH', 'RD', 'ESB','CHR','PH', 'W' ],
    ['W',  'CM', 'SK', 'RD', 'SK', 'CM', 'W' ],
    ['W',  'RD', 'RD', 'RD', 'RD', 'RD', 'W' ],
    ['W',  'HO', 'VI', 'RD', 'OWT','ST', 'W' ],
    ['HB', 'HB', 'SOL','HB', 'HB', 'HB', 'HB'],
  ],

  // Landmark display names
    landmarkEras: { ESB:'crisis', CHR:'crisis', OWT:'digital' },

  landmarkNames: {
    ESB: '🏛 Empire State Building',
    CHR: '✦ Chrysler Building',
    OWT: '🏙 One World Trade Center',
    SOL: '🗽 Statue of Liberty',
    BST: 'Brownstone Stoop Row',
  },

  // Landmark factory functions — called with City3D as `this`
  landmarks: {

    ESB: function() {
      var g = new THREE.Group(), E = City3D;
      var M = { w: E.M.CONC, t: new THREE.MeshPhongMaterial({ color: 0x9098a8, shininess: 60 }),
                b: new THREE.MeshPhongMaterial({ color: 0xc4b8a0, shininess: 40 }) };
      var stacks = [[18,44,16],[14,30,12],[10,20,9],[7,13,6.5],[4.5,8,4.2],[2,5,2],[1,16,1]];
      var y = 0;
      stacks.forEach(function(s, i) {
        var m = E.bx(s[0], s[1], s[2], i < 4 ? M.b : M.t); m.position.y = y + s[1] / 2; g.add(m);
        if (i < 4) { var c = E.bx(s[0] + 0.8, 0.9, s[2] + 0.8, M.t, false); c.position.y = y + s[1] + 0.45; g.add(c); }
        if (i < 3) E._addWinSimple(g, s[0], s[1], s[2], Math.floor(s[1] / 7), Math.min(3, Math.floor(s[0] / 5)), y);
        y += s[1];
      });
      var needle = E.cy(0, 0.7, 16, 4, M.t); needle.position.y = y + 8; g.add(needle);
      var lb = E.makeLabel('Empire State'); lb.position.set(0, y + 25, 0); g.add(lb);
      return g;
    },

    CHR: function() {
      var g = new THREE.Group(), E = City3D;
      var Mw = new THREE.MeshPhongMaterial({ color: 0x7a5a48, shininess: 40 });
      var Mc = new THREE.MeshPhongMaterial({ color: 0xb8b0b8, shininess: 130 });
      var stacks = [[16,40,14],[13,32,11],[10,22,9],[8,15,7],[6,10,5.5],[4.5,8,4]];
      var y = 0;
      stacks.forEach(function(s, i) {
        var m = E.bx(s[0], s[1], s[2], i < 3 ? Mw : Mc); m.position.y = y + s[1] / 2; g.add(m);
        var c = E.bx(s[0] + 0.6, 0.7, s[2] + 0.6, Mc, false); c.position.y = y + s[1] + 0.35; g.add(c);
        if (i < 2) E._addWinSimple(g, s[0], s[1], s[2], Math.floor(s[1] / 7), Math.floor(s[0] / 4.5), y);
        y += s[1];
      });
      [-6, 6].forEach(function(ox) { var e = E.bx(2, 2, 4, Mc, false); e.position.set(ox, y + 2, 0); g.add(e); });
      var crown = E.cy(0, 5, 22, 8, Mc); crown.position.y = y + 11; g.add(crown); y += 22;
      var needle = E.cy(0, 0.5, 15, 4, Mc); needle.position.y = y + 7.5; g.add(needle);
      var lb = E.makeLabel('Chrysler'); lb.position.set(0, y + 18, 0); g.add(lb);
      return g;
    },

    OWT: function() {
      var g = new THREE.Group(), E = City3D;
      var Mw = new THREE.MeshPhongMaterial({ color: 0x6090b8, transparent: true, opacity: 0.95, shininess: 60 });
      var Mt = new THREE.MeshPhongMaterial({ color: 0x90c0e0, shininess: 50 });
      var stacks = [[18,55,18],[16,40,16],[14,28,14],[11,18,11],[8,12,8],[5,8,5]];
      var y = 0;
      stacks.forEach(function(s, i) {
        var m = E.bx(s[0], s[1], s[2], Mw); m.position.y = y + s[1] / 2; g.add(m);
        for (var j = 1; j < 4; j++) { var mu = E.bx(0.3, s[1], 0.3, Mt, false); mu.position.set(-s[0] / 2 + j * (s[0] / 4), y + s[1] / 2, s[2] / 2 + 0.14); g.add(mu); }
        if (i < 3) E._addWinSimple(g, s[0], s[1], s[2], Math.floor(s[1] / 8), Math.floor(s[0] / 4), y);
        y += s[1];
      });
      var spire = E.cy(0, 0.9, 52, 4, Mt); spire.position.y = y + 26; g.add(spire);
      var lb = E.makeLabel('One World Trade'); lb.position.set(0, y + 58, 0); g.add(lb);
      return g;
    },

    SOL: function() {
      var g = new THREE.Group(), E = City3D;
      var Ms = E.M.SOL;
      var ped = E.bx(8, 16, 8, E.M.CONC); ped.position.y = 8; g.add(ped);
      for (var i = 0; i < 3; i++) { var b = E.bx(8 + i * 0.5, 0.45, 8 + i * 0.5, E.M.CONC, false); b.position.y = i * 4 + 2; g.add(b); }
      var robe = E.cy(3.2, 4.5, 24, 10, Ms); robe.position.y = 16 + 12; g.add(robe);
      var head = E.sphr(3.5, 8, Ms); head.position.y = 16 + 24 + 3.5; g.add(head);
      // Crown spikes
      for (var i = 0; i < 7; i++) {
        var a = i / 7 * Math.PI * 2;
        var sp = E.cy(0, 0.4, 5.5, 4, Ms);
        sp.position.set(Math.cos(a) * 2.8, 16 + 24 + 7, Math.sin(a) * 2.8);
        sp.rotation.z = Math.sin(a) * 0.4; sp.rotation.x = Math.cos(a) * 0.4;
        g.add(sp);
      }
      // Arm + torch
      var arm = E.cy(0.55, 0.55, 11, 6, Ms); arm.rotation.z = -0.4; arm.position.set(4.5, 16 + 24 + 5, 0); g.add(arm);
      var torch = E.cy(1, 0.8, 3.5, 8, Ms); torch.position.set(7.8, 16 + 24 + 9, 0); g.add(torch);
      var flame = E.sphr(1.5, 6, new THREE.MeshPhongMaterial({ color: 0xffaa22, emissive: 0xff6000 }));
      flame.position.set(7.8, 16 + 24 + 12.5, 0); g.add(flame);
      var fl = new THREE.PointLight(0xffaa22, 1.5, 42); fl.position.set(7.8, 16 + 24 + 13, 0); g.add(fl);
      var lb = E.makeLabel('🗽 Statue of Liberty'); lb.position.set(0, 16 + 24 + 22, 0); g.add(lb);
      return g;
    },

    // SKYLINE-5 signature: brownstone stoop row on the Central Park edge
    // (Central Park West) — three facades with concrete stoops. 6 meshes, ~72 tris.
    BST: function() {
      var g = new THREE.Group(), E = City3D;
      var browns = [0x6e4530, 0x7a4e34, 0x653f2c];
      for (var i = 0; i < 3; i++) {
        var h = 16 + i * 1.5;
        var bld = E.bx(8, h, 10, new THREE.MeshPhongMaterial({ color: browns[i], shininess: 15 }));
        bld.position.set(-8.5 + i * 8.5, h / 2, -2); g.add(bld);
        var stoop = E.bx(3, 2.5, 3.5, E.M.CONC);
        stoop.position.set(-8.5 + i * 8.5, 1.25, 4.5); g.add(stoop);
      }
      var lb = E.makeLabel('Brownstone Row'); lb.position.set(0, 24, 0); g.add(lb);
      return g;
    },
  },
};
