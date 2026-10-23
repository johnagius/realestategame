/* ========================================
   PROPERTY EMPIRE — London City Definition
   Layout + landmarks: Big Ben, Tower Bridge, The Shard
   ======================================== */

var CityDef_London = {

  name: 'London',
  id: 'london',

  // Project Skyline art direction (SKYLINE-4): direction B "Glass Commonwealth"
  // (docs/SKYLINE.md §2), with A's warm gas-lit dusk for the Victorian/Gilded
  // evenings and C's neon lamps + mirror water for the Digital night. Resolved by
  // City3D._prof: era key > base > ERAS palette. Ground/park authored per era (R6 ramps).
  profile: {
    base: { skyline: 0x1e2337, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.1, sunDay: 0xffe2b8, sunDusk: 0x9ab2e0,
      ambDay: 0x323a4e, ambDusk: 0x1a2238, hemiSky: 0xbcd4ff, hemiGround: 0x3c4a3c,
      wallJitter: 0.07, water: { color: 0x1d5a8a, specular: 0x99ccee, opacity: 0.9 },
      trees: 'plane', lamps: 'modern' },
    victorian: { sky: ['#1c1c44', '#6a4a6e', '#e89a5a'], fog: 0x4c3c5e, haze: 0.22, lamps: 'gas',
      sunDusk: 0xd88a5a, ambDusk: 0x241c2c, ground: 0x2a2824, road: 0x232120, side: 0x413b34, park: 0x2f4a26 },
    gilded:    { sky: ['#201c4a', '#7a4a78', '#f0a868'], fog: 0x584064, haze: 0.2, lamps: 'gas',
      sunDusk: 0xd88a5a, ambDusk: 0x262030, ground: 0x2c2a28, road: 0x262321, side: 0x47403a, park: 0x2f5228 },
    crisis:    { sky: ['#181c34', '#4a5480', '#c8a078'], fog: 0x3c4262, haze: 0.28,
      ground: 0x2a2b2e, road: 0x202125, side: 0x3f4046, park: 0x2e4628 },
    boom:      { sky: ['#16204a', '#5a5a9a', '#f4a860'], fog: 0x444880, haze: 0.16,
      ground: 0x2b2d33, road: 0x24262c, side: 0x474a52, park: 0x2f5a2c },
    modern:    { sky: ['#12224a', '#3f5590', '#e8a06a'], fog: 0x2c3c6e, haze: 0.18,
      ground: 0x272a33, road: 0x22242b, side: 0x454851, park: 0x2c5a30 },
    digital:   { sky: ['#081230', '#243a7e', '#8a5ec0'], fog: 0x1c2a5e, haze: 0.14, lamps: 'neon',
      water: { color: 0x0e2c58, specular: 0xd0e8ff, opacity: 0.86 },
      ground: 0x1e2230, road: 0x171a24, side: 0x343846, park: 0x24502e },
  },

  // 7×8 grid — Thames runs through middle
  layout: [
    ['CP', 'CP', 'CT', 'CT', 'CT', 'CP', 'CP'],
    ['TH', 'RD', 'RD', 'RD', 'RD', 'RD', 'AP'],
    ['CM', 'RD', 'MN', 'RD', 'BIG', 'RD', 'SK'],
    ['W',  'W',  'W',  'TBR', 'W',  'W',  'W' ],
    ['HO', 'RD', 'RD', 'RD', 'RD', 'RD', 'SHD'],
    ['ST', 'RD', 'VI', 'RD', 'PH', 'RD', 'CM'],
    ['CT', 'WR', 'RD', 'CP', 'CP', 'RD', 'TH'],
    ['CT', 'CT', 'CT', 'CP', 'CP', 'CT', 'CT'],
  ],

  // Terrain tile drawn under a landmark (default 'LOT'); water landmarks keep their water

  landmarkGround: { TBR:'W' },

  // Era gating (DESIGN-DIRECTION §4): the city grows with the eras. Tower Bridge
  // opens 1894 (gilded+), The Shard rises 2012 (digital only); Big Ben stands from 1859.
  landmarkEras: { TBR:'gilded', SHD:'digital' },

  landmarkNames: {
    BIG: 'Big Ben & Parliament',
    TBR: 'Tower Bridge',
    SHD: 'The Shard',
  },

  landmarks: {

    // Big Ben — clock tower + Parliament
    BIG: function() {
      var g = new THREE.Group(), E = City3D;
      var Mstone = new THREE.MeshPhongMaterial({ color: 0xc8b888, shininess: 30 });
      var Mroof = new THREE.MeshPhongMaterial({ color: 0x4a6848, shininess: 20 });
      var Mclock = new THREE.MeshPhongMaterial({ color: 0xf0e8c0, emissive: 0x302810, shininess: 80 });

      // Parliament building (wide, low)
      var parl = E.bx(22, 14, 14, Mstone); parl.position.set(-8, 7, 0); g.add(parl);
      var parlR = E.hipRoof(22, 5, 14, Mroof); parlR.position.set(-8, 14, 0); g.add(parlR);
      // Parliament windows
      E._addWinSimple(g, 22, 14, 14, 3, 4, 0);

      // Clock tower
      var tower = E.bx(7, 48, 7, Mstone); tower.position.set(8, 24, 0); g.add(tower);
      // Clock faces (4 sides)
      [[-3.6, 0], [3.6, 0], [0, -3.6], [0, 3.6]].forEach(function(a) {
        var face = E.bx(a[0] === 0 ? 0.3 : 4.5, 4.5, a[1] === 0 ? 0.3 : 4.5, Mclock, false);
        face.position.set(8 + a[0], 40, a[1]);
        g.add(face);
      });
      // Spire
      var spire = E.cy(0, 2.5, 14, 4, Mroof); spire.position.set(8, 48 + 7, 0); g.add(spire);
      var tip = E.cy(0, 0.3, 6, 4, Mstone); tip.position.set(8, 48 + 14 + 3, 0); g.add(tip);

      // Clock light
      var cl = new THREE.PointLight(0xffeebb, 1.2, 30);
      cl.position.set(8, 40, 0); g.add(cl);

      var lb = E.makeLabel('Big Ben'); lb.position.set(5, 72, 0); g.add(lb);
      return g;
    },

    // Tower Bridge — spanning water
    TBR: function() {
      var g = new THREE.Group(), E = City3D;
      var Mstone = new THREE.MeshPhongMaterial({ color: 0xa09878, shininess: 25 });
      var Mblue = new THREE.MeshPhongMaterial({ color: 0x4070a0, shininess: 40 });
      var Mcable = new THREE.MeshPhongMaterial({ color: 0x606058, shininess: 20 });

      // Water base
      g.add(E.flatPlane(28, 28, E.M.WATER));

      // Two towers
      [-8, 8].forEach(function(tx) {
        var base = E.bx(6, 32, 6, Mstone); base.position.set(tx, 16, 0); g.add(base);
        var top = E.bx(7, 8, 7, Mblue); top.position.set(tx, 32 + 4, 0); g.add(top);
        var spire = E.cy(0, 1.5, 10, 4, Mstone); spire.position.set(tx, 40 + 5, 0); g.add(spire);
        // Windows
        E._addWinSimple(g, 6, 32, 6, 5, 1, 0);
      });

      // Bridge deck
      var deck = E.bx(24, 2, 6, Mblue); deck.position.set(0, 10, 0); g.add(deck);
      // Upper walkway
      var walk = E.bx(16, 1, 3, Mblue); walk.position.set(0, 34, 0); g.add(walk);

      // Cables
      [-12, 12].forEach(function(cx) {
        var cable = E.cy(0.15, 0.15, 20, 4, Mcable);
        cable.rotation.z = cx > 0 ? 0.5 : -0.5;
        cable.position.set(cx, 28, 0); g.add(cable);
      });

      var lb = E.makeLabel('Tower Bridge'); lb.position.set(0, 52, 0); g.add(lb);
      return g;
    },

    // The Shard — tall glass pyramid
    SHD: function() {
      var g = new THREE.Group(), E = City3D;
      var Mglass = new THREE.MeshPhongMaterial({ color: 0x6898c0, transparent: true, opacity: 0.92, shininess: 100 });
      var Mframe = new THREE.MeshPhongMaterial({ color: 0x90b8d8, shininess: 60 });

      // Tapered glass tower (multiple sections getting narrower)
      var sections = [[14, 30, 12], [11, 25, 9], [8, 20, 7], [5, 15, 4.5], [3, 12, 2.5], [1.5, 8, 1.2]];
      var y = 0;
      sections.forEach(function(s, i) {
        var sec = E.bx(s[0], s[1], s[2], Mglass);
        sec.position.y = y + s[1] / 2; g.add(sec);
        // Vertical frame lines
        for (var j = 1; j < 3; j++) {
          var mu = E.bx(0.2, s[1], 0.2, Mframe, false);
          mu.position.set(-s[0] / 2 + j * (s[0] / 3), y + s[1] / 2, s[2] / 2 + 0.1);
          g.add(mu);
        }
        if (i < 3) E._addWinSimple(g, s[0], s[1], s[2], Math.floor(s[1] / 8), Math.min(3, Math.floor(s[0] / 4)), y);
        y += s[1];
      });

      // Spire
      var spire = E.cy(0, 0.8, 18, 4, Mframe);
      spire.position.y = y + 9; g.add(spire);

      // Light at top
      var tl = new THREE.PointLight(0x88bbff, 0.8, 40);
      tl.position.set(0, y + 18, 0); g.add(tl);

      var lb = E.makeLabel('The Shard'); lb.position.set(0, y + 24, 0); g.add(lb);
      return g;
    },
  },
};
