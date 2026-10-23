/* ========================================
   PROPERTY EMPIRE — Tokyo City Definition
   Layout + landmarks: Tokyo Tower, Temple, Crossing
   ======================================== */

var CityDef_Tokyo = {

  name: 'Tokyo',
  id: 'tokyo',

  // Project Skyline profile (SKYLINE-5): soft pink-grey day (pale mauve mid-sky,
  // gentle bloom horizon) that turns hard neon at digital night. Cherry trees.
  // Resolved by City3D._prof: era key > base > ERAS palette.
  profile: {
    base: { skyline: 0x1c243e, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.07, sunDay: 0xf2dcd0, sunDusk: 0x9a90b8,
      ambDay: 0x3a3444, ambDusk: 0x1c1c30, hemiSky: 0xd0c8e0, hemiGround: 0x44403c,
      wallJitter: 0.06, water: { color: 0x1c4260, specular: 0xa8c4e0, opacity: 0.9 },
      trees: 'cherry', lamps: 'modern' },
    victorian: { sky: ['#241c38', '#7a5468', '#e8987a'], fog: 0x544250, haze: 0.26, lamps: 'gas',
      sunDusk: 0xd89060, ambDusk: 0x261e2a, ground: 0x2b2826, road: 0x232120, side: 0x423c38, park: 0x32482a },
    gilded:    { sky: ['#282040', '#845c70', '#f0a07e'], fog: 0x5c4856, haze: 0.24, lamps: 'gas',
      sunDusk: 0xd89060, ambDusk: 0x28202c, ground: 0x2d2a28, road: 0x252321, side: 0x443e3a, park: 0x344e2c },
    crisis:    { sky: ['#1e2038', '#585c7c', '#cc9a80'], fog: 0x42465c, haze: 0.3,
      ground: 0x2b2b2e, road: 0x222225, side: 0x403f44, park: 0x30482c },
    boom:      { sky: ['#1a2048', '#6a5c94', '#f4a088'], fog: 0x484a78, haze: 0.18,
      ground: 0x2c2d33, road: 0x24252c, side: 0x484952, park: 0x31582e },
    modern:    { sky: ['#16224a', '#54588e', '#eaa088'], fog: 0x323c6c, haze: 0.2,
      ground: 0x282b34, road: 0x22242b, side: 0x464852, park: 0x2f5c32 },
    digital:   { sky: ['#0a0e30', '#2c2a72', '#d84a9a'], fog: 0x20245a, haze: 0.14, lamps: 'neon',
      water: { color: 0x0e2244, specular: 0xe0ccff, opacity: 0.85 },
      ground: 0x201f2e, road: 0x171823, side: 0x363748, park: 0x26502e },
  },

  layout: [
    ['CHL', 'CP', 'TMP', 'CT', 'CT', 'CT', 'CP'],
    ['CP', 'RD', 'RD', 'RD', 'RD', 'RD', 'TH'],
    ['AP', 'RD', 'SK', 'RD', 'PH', 'RD', 'SK'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['CM', 'RD', 'TTW', 'RD', 'MN', 'RD', 'HO'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['VI', 'RD', 'ST', 'RD', 'CM', 'RD', 'WR'],
    ['W',  'HB', 'HB', 'W',  'W',  'HB', 'W' ],
  ],

    landmarkEras: { TTW:'boom', TMP:'gilded' },

  landmarkNames: {
    TTW: 'Tokyo Tower',
    TMP: 'Meiji Shrine',
    CHL: 'Cherry Lane',
  },

  landmarks: {

    TTW: function() {
      var g = new THREE.Group(), E = City3D;
      var Mred = new THREE.MeshPhongMaterial({ color: 0xcc3030, shininess: 50 });
      var Mwhite = new THREE.MeshPhongMaterial({ color: 0xe8e0d0, shininess: 40 });

      // Four legs converging to a point — lattice tower
      var H = 80;
      // Main legs
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(d) {
        var leg = E.cy(0.3, 2.5, H, 6, Mred);
        leg.position.set(d[0] * 1.5, H / 2, d[1] * 1.5);
        g.add(leg);
      });

      // Platforms
      [0.35, 0.55, 0.75].forEach(function(pct) {
        var pw = 12 * (1 - pct) + 3;
        var plat = E.bx(pw, 2, pw, pct > 0.6 ? Mwhite : Mred);
        plat.position.y = H * pct; g.add(plat);
      });

      // Cross braces
      for (var i = 0; i < 12; i++) {
        var by = i * (H / 12);
        var bw = 12 * (1 - by / H) + 2;
        var brace = E.bx(bw, 0.3, 0.3, i % 2 === 0 ? Mred : Mwhite, false);
        brace.position.y = by; g.add(brace);
        var brace2 = E.bx(0.3, 0.3, bw, i % 2 === 0 ? Mred : Mwhite, false);
        brace2.position.y = by; g.add(brace2);
      }

      // Antenna
      var ant = E.cy(0, 0.5, 20, 4, Mwhite);
      ant.position.y = H + 10; g.add(ant);

      // Observation light
      var ol = new THREE.PointLight(0xff4422, 1.5, 50);
      ol.position.set(0, H * 0.55, 0); g.add(ol);

      var lb = E.makeLabel('Tokyo Tower'); lb.position.set(0, H + 26, 0); g.add(lb);
      return g;
    },

    TMP: function() {
      var g = new THREE.Group(), E = City3D;
      var Mwood = new THREE.MeshPhongMaterial({ color: 0x6a3818, shininess: 20 });
      var Mroof = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, shininess: 30, side: THREE.DoubleSide });
      var Mred = new THREE.MeshPhongMaterial({ color: 0xc03020, shininess: 30 });

      // Park base
      g.add(E.flatPlane(28, 28, E.M.PARK));

      // Torii gate
      [-4, 4].forEach(function(px) {
        var post = E.cy(0.6, 0.6, 12, 6, Mred);
        post.position.set(px, 6, -10); g.add(post);
      });
      var beam1 = E.bx(12, 0.8, 1, Mred); beam1.position.set(0, 11, -10); g.add(beam1);
      var beam2 = E.bx(10, 0.5, 0.8, Mred); beam2.position.set(0, 9.5, -10); g.add(beam2);

      // Temple building
      var base = E.bx(16, 1.5, 12, Mwood); base.position.set(0, 0.75, 2); g.add(base);
      var body = E.bx(14, 10, 10, Mwood); body.position.set(0, 1.5 + 5, 2); g.add(body);

      // Curved roof (approximated with hip roof)
      var roof = E.hipRoof(18, 6, 14, Mroof);
      roof.position.set(0, 11.5, 2); g.add(roof);

      // Ridge ornaments
      var ridge = E.bx(0.4, 3, 0.4, Mred);
      ridge.position.set(0, 17.5, 2); g.add(ridge);

      // Trees around temple
      [-9, 9].forEach(function(tx) {
        var trunk = E.cy(0.35, 0.45, 5, 6, E.M.HOt);
        trunk.position.set(tx, 2.5, 5); g.add(trunk);
        var canopy = E.sphr(4, 7, E.M.PARKD);
        canopy.position.set(tx, 7, 5); g.add(canopy);
      });

      var lb = E.makeLabel('Meiji Shrine'); lb.position.set(0, 22, 0); g.add(lb);
      return g;
    },

    // Signature (SKYLINE-5): cherry-canopy lane with lantern posts
    CHL: function() {
      var g = new THREE.Group(), E = City3D;
      // Park base
      g.add(E.flatPlane(28, 28, E.M.PARK));
      // Two cherry trees flanking the lane
      [-6, 6].forEach(function(tx) {
        var trunk = E.cy(0.3, 0.42, 4.2, 5, E.M.HOt); trunk.position.set(tx, 2.1, -4); g.add(trunk);
        var bloom = E.sphr(3.1, 6, E.M.PARKBLOSSOM); bloom.scale.y = 1.1; bloom.position.set(tx, 5.6, -4); g.add(bloom);
      });
      // Stone lantern T-post with two glowing lanterns
      var post = E.cy(0.22, 0.3, 5, 5, E.M.SIGNPOST); post.position.set(0, 2.5, 6); g.add(post);
      [-1.2, 1.2].forEach(function(lx) {
        var lantern = E.bx(0.9, 1.1, 0.9, E.M.LAMP, false); lantern.position.set(lx, 5.4, 6); g.add(lantern);
      });
      var lb = E.makeLabel('Cherry Lane'); lb.position.set(0, 11, 0); g.add(lb);
      return g;
    },
  },
};
