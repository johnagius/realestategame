/* ========================================
   PROPERTY EMPIRE — Sydney City Definition
   Layout + landmarks: Opera House, Harbour Bridge
   ======================================== */

var CityDef_Sydney = {

  name: 'Sydney',
  id: 'sydney',

  // Project Skyline profile (SKYLINE-5): bright blue harbour, crisp white
  // (sails/sandstone) against saturated water, palms. Victorian gets A's warm
  // gas-lit dusk; Digital gets C's neon lamps + darkest mirror water.
  // Signature set-piece: the harbour bridge arch (HBR, already canonical).
  profile: {
    base: { skyline: 0x2d4257, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.1, sunDay: 0xfff6e2, sunDusk: 0xffb27a,
      ambDay: 0x364868, ambDusk: 0x1a2440, hemiSky: 0xd2eaff, hemiGround: 0x46524a,
      wallJitter: 0.07, sky: ['#123a6e', '#3f8ed2', '#c6ecf4'], fog: 0x5e8aae, haze: 0.12,
      water: { color: 0x1a7ec0, specular: 0x9fd8f0, opacity: 0.9 },
      ground: 0x32363c, road: 0x2a2d33, side: 0x8e8a80, park: 0x2f6434,
      trees: 'palm', lamps: 'modern' },
    victorian: { lamps: 'gas', sunDusk: 0xff9652, ambDusk: 0x262032, haze: 0.2 },
    digital: { lamps: 'neon', water: { color: 0x0c3e66, specular: 0xbfe8ff, opacity: 0.86 } },
  },

  layout: [
    ['W',  'W',  'W',  'RD', 'W',  'W',  'W' ],
    ['W',  'HB', 'OPH', 'HBR', 'HB', 'HB', 'W' ],
    ['TH', 'RD', 'RD', 'RD', 'RD', 'RD', 'SK'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['AP', 'RD', 'MN', 'RD', 'PH', 'RD', 'HO'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['CM', 'RD', 'VI', 'RD', 'ST', 'RD', 'WR'],
    ['CT', 'CT', 'CP', 'CP', 'CP', 'CT', 'CT'],
  ],

  // Terrain tile drawn under a landmark (default 'LOT'); water landmarks keep their water

  landmarkGround: { OPH:'W', HBR:'W' },

    landmarkEras: { OPH:'boom', HBR:'crisis' },

  landmarkNames: {
    OPH: 'Sydney Opera House',
    HBR: 'Harbour Bridge',
  },

  landmarks: {

    OPH: function() {
      var g = new THREE.Group(), E = City3D;
      var Mwhite = new THREE.MeshPhongMaterial({ color: 0xf0ece0, shininess: 80 });
      var Mbase = new THREE.MeshPhongMaterial({ color: 0xb0a890, shininess: 30 });

      // Water base (aligned with terrain water at y=-0.3)
      var wb = E.flatPlane(28, 28, E.M.WATER); wb.position.y = -0.3; g.add(wb);

      // Podium (two steps down to the water)
      var podium = E.bx(24, 2.5, 17, Mbase);
      podium.position.y = 1.25; g.add(podium);
      var upper = E.bx(18, 2, 13, Mbase);
      upper.position.set(-1, 3.5, -1); g.add(upper);

      // Sail shells — elongated ellipsoids, thin in depth, half-sunk into the
      // podium and leaning into each other so they interleave like the real
      // fans: a tall four-shell fan descending back-left to front-right, plus
      // the small restaurant pair at the front point.
      var shells = [
        { x: -7,   z: -3.5, sx: 7.5, sy: 12,  sz: 3,   ry: 0.3,  rz: 0.3 },
        { x: -3.5, z: -2.5, sx: 6.5, sy: 10,  sz: 2.7, ry: 0.25, rz: 0.3 },
        { x: 0,    z: -1.5, sx: 5.4, sy: 8.2, sz: 2.4, ry: 0.2,  rz: 0.3 },
        { x: 3.5,  z: -1,   sx: 4.4, sy: 6.5, sz: 2.1, ry: 0.15, rz: 0.3 },
        { x: 6.5,  z: 4.5,  sx: 3.4, sy: 4.8, sz: 1.9, ry: -0.6, rz: 0.2 },
        { x: 9.5,  z: 4,    sx: 2.6, sy: 3.8, sz: 1.6, ry: -0.5, rz: 0.2 },
      ];

      shells.forEach(function(s) {
        var shell = E.sphr(1, 10, Mwhite);
        shell.scale.set(s.sx, s.sy, s.sz);
        shell.position.set(s.x, 4.5, s.z);
        shell.rotation.y = s.ry;
        shell.rotation.z = s.rz;
        g.add(shell);
      });

      // Warm interior glow
      var gl = new THREE.PointLight(0xffcc66, 1.2, 30);
      gl.position.set(0, 5, 0); g.add(gl);

      var lb = E.makeLabel('Opera House'); lb.position.set(0, 19, 0); g.add(lb);
      return g;
    },

    // Harbour Bridge — the coathanger runs along z from the north-shore headland
    // road (0,3) across the harbour row to the RD at (2,3)
    HBR: function() {
      var g = new THREE.Group(), E = City3D;
      var Msteel = new THREE.MeshPhongMaterial({ color: 0x505858, shininess: 50 });
      var Mdeck = new THREE.MeshPhongMaterial({ color: 0x484848, shininess: 25 });

      // Water base (aligned with terrain water at y=-0.3)
      var wb = E.flatPlane(28, 28, E.M.WATER); wb.position.y = -0.3; g.add(wb);

      // Arch — the "coathanger" shape, spanning z
      // Approximate with a series of segments forming an arc
      var archPts = 12;
      var archW = 44, archH = 28;
      for (var i = 0; i < archPts; i++) {
        var t1 = i / archPts * Math.PI;
        var t2 = (i + 1) / archPts * Math.PI;
        var z1 = -archW / 2 + (i / archPts) * archW;
        var y1 = Math.sin(t1) * archH;
        var z2 = -archW / 2 + ((i + 1) / archPts) * archW;
        var y2 = Math.sin(t2) * archH;

        var len = Math.sqrt((z2 - z1) * (z2 - z1) + (y2 - y1) * (y2 - y1));
        var ang = Math.atan2(y2 - y1, z2 - z1);

        var seg = E.bx(2, 1.2, len, Msteel, false);
        seg.position.set(0, (y1 + y2) / 2 + 8, (z1 + z2) / 2);
        seg.rotation.x = -ang;
        g.add(seg);
      }

      // Vertical hangers from arch to deck
      for (var i = 1; i < archPts; i++) {
        var t = i / archPts * Math.PI;
        var hz = -archW / 2 + (i / archPts) * archW;
        var hy = Math.sin(t) * archH + 8;
        var hangerH = hy - 8;
        if (hangerH > 2) {
          var hanger = E.bx(0.3, hangerH, 0.3, Msteel, false);
          hanger.position.set(0, 8 + hangerH / 2, hz);
          g.add(hanger);
        }
      }

      // Bridge deck along z — reaches the headland road (0,3) and the city road (2,3)
      var deck = E.bx(6, 1.6, 54, Mdeck);
      deck.position.y = 8; g.add(deck);

      // Approach ramps sloping down onto both roads
      [-1, 1].forEach(function(s) {
        var ramp = E.bx(6, 1.2, 14, Mdeck);
        ramp.position.set(0, 3.7, s * 33); ramp.rotation.x = s * 0.55; g.add(ramp);
      });

      // Pylons near both banks
      [-13, 13].forEach(function(pz) {
        var pylon = E.bx(4, 18, 3, E.M.CONC);
        pylon.position.set(0, 9, pz); g.add(pylon);
      });

      // Flag on south pylon
      var flag = E.bx(3, 2, 0.2, new THREE.MeshPhongMaterial({ color: 0x0033aa, shininess: 20 }), false);
      flag.position.set(0, 20, 14.6); g.add(flag);

      var lb = E.makeLabel('Harbour Bridge'); lb.position.set(0, archH + 14, 0); g.add(lb);
      return g;
    },
  },
};
