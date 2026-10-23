/* ========================================
   PROPERTY EMPIRE — Dubai City Definition
   Layout + landmarks: Burj Khalifa, Burj Al Arab
   ======================================== */

var CityDef_Dubai = {

  name: 'Dubai',
  id: 'dubai',

  // Project Skyline profile (SKYLINE-5): clear-hot bright — azure-to-gold sky,
  // cyan gulf water, sand ground, gold/white/cyan glass accents, heat shimmer haze
  // kept low. Resolved by City3D._prof: era key > base > ERAS palette.
  // Victorian/Gilded get gas lamps + warmed dusk, Digital neon + dark mirror water.
  profile: {
    base: { skyline: 0x1b2a38, surroundings: 'desert', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.1, sunDay: 0xfff4d0, sunDusk: 0xe8a45c,
      ambDay: 0x4a4238, ambDusk: 0x262030, hemiSky: 0xc0e8fa, hemiGround: 0x6a5a3e,
      wallJitter: 0.05, water: { color: 0x18a4c4, specular: 0xd0f2fa, opacity: 0.88 },
      trees: 'scrub', lamps: 'modern' },
    victorian: { sky: ['#2c2848', '#8a705c', '#e8b078'], fog: 0x665848, haze: 0.24, lamps: 'gas',
      sunDusk: 0xf09a50, ambDusk: 0x2c2430, ground: 0x423a30, road: 0x342e28, side: 0x584e40, park: 0x37562c },
    gilded:    { sky: ['#282c50', '#8a7662', '#ecb67e'], fog: 0x645c50, haze: 0.2, lamps: 'gas',
      sunDusk: 0xf09a50, ambDusk: 0x2a2432, ground: 0x443c32, road: 0x36302a, side: 0x5a5042, park: 0x385a2e },
    crisis:    { sky: ['#1c2440', '#5a6a7a', '#dcae7e'], fog: 0x4a524e, haze: 0.26,
      ground: 0x3e3830, road: 0x2e2a26, side: 0x504840, park: 0x34542c },
    boom:      { sky: ['#16284e', '#5a7a92', '#f6c07e'], fog: 0x465862, haze: 0.16,
      ground: 0x403a32, road: 0x322e2a, side: 0x564e44, park: 0x3a6030 },
    modern:    { sky: ['#12305a', '#3f7a9e', '#fac884'], fog: 0x2e4c5c, haze: 0.18,
      ground: 0x3e3a34, road: 0x302c28, side: 0x544c42, park: 0x3a5e32 },
    digital:   { sky: ['#08102c', '#1c3a72', '#c07840'], fog: 0x182c4c, haze: 0.12, lamps: 'neon',
      water: { color: 0x083048, specular: 0xe0f8ff, opacity: 0.85 },
      ground: 0x2c2822, road: 0x211e1a, side: 0x403a32, park: 0x2a522c },
  },

  layout: [
    ['CT', 'CT', 'CT', 'CT', 'CT', 'CT', 'CT'],
    ['CT', 'RD', 'RD', 'RD', 'RD', 'RD', 'CM'],
    ['MN', 'RD', 'SK', 'RD', 'BKH', 'RD', 'PH'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['VI', 'RD', 'CM', 'RD', 'SK', 'RD', 'AP'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['TH', 'RD', 'BAA', 'RD', 'HO', 'RD', 'ST'],
    ['W',  'W',  'HB', 'FNT', 'W',  'HB', 'W' ],
  ],

  // Terrain tile drawn under a landmark (default 'LOT'); water landmarks keep their water

  landmarkGround: { BAA:'W', FNT:'W' },

    landmarkEras: { BKH:'digital', BAA:'digital', FNT:'digital' },

  landmarkNames: {
    BKH: 'Burj Khalifa',
    BAA: 'Burj Al Arab',
    FNT: 'Fountain Jets',
  },

  landmarks: {

    BKH: function() {
      var g = new THREE.Group(), E = City3D;
      var Mglass = new THREE.MeshPhongMaterial({ color: 0x88a8c8, transparent: true, opacity: 0.93, shininess: 100 });
      var Mframe = new THREE.MeshPhongMaterial({ color: 0xa0c0e0, shininess: 70 });

      // Y-shaped cross-section tower — tallest in the world
      var H = 120;
      // Main shaft (tapered)
      var sections = [[12, 40, 10], [10, 30, 8], [8, 22, 6.5], [6, 16, 5], [4, 12, 3.5]];
      var y = 0;
      sections.forEach(function(s, i) {
        var sec = E.bx(s[0], s[1], s[2], Mglass);
        sec.position.y = y + s[1] / 2; g.add(sec);
        // Setback cornice
        var cor = E.bx(s[0] + 0.6, 0.8, s[2] + 0.6, Mframe, false);
        cor.position.y = y + s[1] + 0.4; g.add(cor);
        if (i < 3) E._addWinSimple(g, s[0], s[1], s[2], Math.floor(s[1] / 7), Math.min(3, Math.floor(s[0] / 4)), y);
        y += s[1];
      });

      // Spire
      var spire = E.cy(0, 1.5, 30, 6, Mframe);
      spire.position.y = y + 15; g.add(spire);

      // Aircraft warning light
      var al = new THREE.PointLight(0xff2200, 1, 30);
      al.position.set(0, y + 30, 0); g.add(al);

      var lb = E.makeLabel('Burj Khalifa'); lb.position.set(0, y + 38, 0); g.add(lb);
      return g;
    },

    BAA: function() {
      var g = new THREE.Group(), E = City3D;
      var Mwhite = new THREE.MeshPhongMaterial({ color: 0xe8e4e0, shininess: 60 });
      var Msail = new THREE.MeshPhongMaterial({ color: 0xd0e8f8, transparent: true, opacity: 0.85, shininess: 90, side: THREE.DoubleSide });
      var Mblue = new THREE.MeshPhongMaterial({ color: 0x3080c0, shininess: 50 });

      // Island platform
      var island = E.cy(12, 14, 2, 12, E.M.CONC);
      island.position.y = 1; g.add(island);

      // Main tower (curved shape approximated)
      var tower = E.bx(10, 50, 8, Mwhite);
      tower.position.y = 2 + 25; g.add(tower);

      // Sail (the iconic fabric facade) — large tilted plane
      var sailGeo = new THREE.PlaneGeometry(18, 45);
      var sail = new THREE.Mesh(sailGeo, Msail);
      sail.position.set(0, 2 + 22.5, 6);
      sail.rotation.y = 0;
      sail.castShadow = true;
      g.add(sail);

      // Helipad on top
      var heli = E.cy(4, 4, 1, 12, Mblue);
      heli.position.y = 52 + 0.5; g.add(heli);

      // Mast/spire
      var mast = E.cy(0, 0.6, 15, 4, Mwhite);
      mast.position.y = 52 + 7.5; g.add(mast);

      // Lights
      var bl = new THREE.PointLight(0x4488ff, 1.2, 40);
      bl.position.set(0, 30, 8); g.add(bl);

      // Water around
      g.add(E.flatPlane(28, 28, E.M.WATER));

      var lb = E.makeLabel('Burj Al Arab'); lb.position.set(0, 70, 0); g.add(lb);
      return g;
    },

    // SKYLINE-5 signature: fountain jets on a gulf water tile (Dubai Fountain) —
    // basin + three translucent jets. 6 meshes, ~250 tris.
    FNT: function() {
      var g = new THREE.Group(), E = City3D;
      var Mjet = new THREE.MeshPhongMaterial({ color: 0xd8f2fa, transparent: true, opacity: 0.75, shininess: 100, specular: 0xffffff });

      // Water stays (landmarkGround FNT:'W'); redraw the plane like BAA does
      g.add(E.flatPlane(28, 28, E.M.WATER));

      // Basin ring
      var basin = E.cy(7, 8, 1.2, 12, E.M.CONC); basin.position.y = 0.6; g.add(basin);

      // Jets — tall centre, two flanking
      [[0, 26, 1.1], [-3.4, 15, 0.8], [3.4, 15, 0.8]].forEach(function(j) {
        var jet = E.cy(0.25, j[2], j[1], 6, Mjet);
        jet.position.set(j[0], 1.2 + j[1] / 2, 0); g.add(jet);
      });
      var crown = E.sphr(1.6, 6, Mjet); crown.position.set(0, 28.5, 0); g.add(crown);

      var lb = E.makeLabel('Fountain Jets'); lb.position.set(0, 34, 0); g.add(lb);
      return g;
    },
  },
};
