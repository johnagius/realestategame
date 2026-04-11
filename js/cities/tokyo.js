/* ========================================
   PROPERTY EMPIRE — Tokyo City Definition
   Layout + landmarks: Tokyo Tower, Temple, Crossing
   ======================================== */

var CityDef_Tokyo = {

  name: 'Tokyo',
  id: 'tokyo',

  layout: [
    ['CP', 'CP', 'TMP', 'CT', 'CT', 'CT', 'CP'],
    ['CP', 'RD', 'RD', 'RD', 'RD', 'RD', 'TH'],
    ['AP', 'RD', 'SK', 'RD', 'PH', 'RD', 'SK'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['CM', 'RD', 'TTW', 'RD', 'MN', 'RD', 'HO'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['VI', 'RD', 'ST', 'RD', 'CM', 'RD', 'WR'],
    ['W',  'HB', 'HB', 'W',  'W',  'HB', 'W' ],
  ],

  landmarkNames: {
    TTW: '🗼 Tokyo Tower',
    TMP: '⛩️ Meiji Shrine',
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
  },
};
