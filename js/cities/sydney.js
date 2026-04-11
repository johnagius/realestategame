/* ========================================
   PROPERTY EMPIRE — Sydney City Definition
   Layout + landmarks: Opera House, Harbour Bridge
   ======================================== */

var CityDef_Sydney = {

  name: 'Sydney',
  id: 'sydney',

  layout: [
    ['W',  'W',  'W',  'HBR', 'W',  'W',  'W' ],
    ['W',  'OPH', 'HB', 'HB', 'HB', 'CM', 'W' ],
    ['TH', 'RD', 'RD', 'RD', 'RD', 'RD', 'SK'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['AP', 'RD', 'MN', 'RD', 'PH', 'RD', 'HO'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['CM', 'RD', 'VI', 'RD', 'ST', 'RD', 'WR'],
    ['CT', 'CT', 'CP', 'CP', 'CP', 'CT', 'CT'],
  ],

  landmarkNames: {
    OPH: '🎭 Sydney Opera House',
    HBR: '🌉 Harbour Bridge',
  },

  landmarks: {

    OPH: function() {
      var g = new THREE.Group(), E = City3D;
      var Mwhite = new THREE.MeshPhongMaterial({ color: 0xf0ece0, shininess: 80 });
      var Mbase = new THREE.MeshPhongMaterial({ color: 0xb0a890, shininess: 30 });

      // Water base
      g.add(E.flatPlane(28, 28, E.M.WATER));

      // Platform/podium
      var podium = E.bx(20, 3, 16, Mbase);
      podium.position.y = 1.5; g.add(podium);

      // Sail shells — 3 groups of interlocking shells
      // Each shell is a half-sphere stretched vertically
      var shells = [
        { x: -5, z: -2, sx: 5, sy: 16, sz: 4, ry: 0 },
        { x: -5, z: -2, sx: 4, sy: 13, sz: 3.5, ry: 0.15 },
        { x: 2, z: -1, sx: 5.5, sy: 18, sz: 4.5, ry: -0.1 },
        { x: 2, z: -1, sx: 4.5, sy: 15, sz: 4, ry: 0.12 },
        { x: 7, z: 1, sx: 4, sy: 12, sz: 3, ry: -0.08 },
      ];

      shells.forEach(function(s) {
        var shell = E.sphr(1, 10, Mwhite);
        shell.scale.set(s.sx, s.sy, s.sz);
        shell.position.set(s.x, 3 + s.sy * 0.4, s.z);
        shell.rotation.y = s.ry;
        g.add(shell);
      });

      // Warm interior glow
      var gl = new THREE.PointLight(0xffcc66, 1.2, 30);
      gl.position.set(0, 5, 0); g.add(gl);

      var lb = E.makeLabel('Opera House'); lb.position.set(0, 28, 0); g.add(lb);
      return g;
    },

    HBR: function() {
      var g = new THREE.Group(), E = City3D;
      var Msteel = new THREE.MeshPhongMaterial({ color: 0x505858, shininess: 50 });
      var Mdeck = new THREE.MeshPhongMaterial({ color: 0x484848, shininess: 25 });

      // Water base
      g.add(E.flatPlane(28, 28, E.M.WATER));

      // Arch — the "coathanger" shape
      // Approximate with a series of segments forming an arc
      var archPts = 12;
      var archW = 24, archH = 28;
      for (var i = 0; i < archPts; i++) {
        var t1 = i / archPts * Math.PI;
        var t2 = (i + 1) / archPts * Math.PI;
        var x1 = -archW / 2 + (i / archPts) * archW;
        var y1 = Math.sin(t1) * archH;
        var x2 = -archW / 2 + ((i + 1) / archPts) * archW;
        var y2 = Math.sin(t2) * archH;

        var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        var ang = Math.atan2(y2 - y1, x2 - x1);

        var seg = E.bx(len, 1.2, 2, Msteel, false);
        seg.position.set((x1 + x2) / 2, (y1 + y2) / 2 + 8, 0);
        seg.rotation.z = ang;
        g.add(seg);
      }

      // Vertical hangers from arch to deck
      for (var i = 1; i < archPts; i++) {
        var t = i / archPts * Math.PI;
        var hx = -archW / 2 + (i / archPts) * archW;
        var hy = Math.sin(t) * archH + 8;
        var hangerH = hy - 8;
        if (hangerH > 2) {
          var hanger = E.bx(0.3, hangerH, 0.3, Msteel, false);
          hanger.position.set(hx, 8 + hangerH / 2, 0);
          g.add(hanger);
        }
      }

      // Bridge deck
      var deck = E.bx(archW + 2, 2, 6, Mdeck);
      deck.position.y = 8; g.add(deck);

      // Pylons at each end
      [-archW / 2 - 1, archW / 2 + 1].forEach(function(px) {
        var pylon = E.bx(3, 18, 4, E.M.CONC);
        pylon.position.set(px, 9, 0); g.add(pylon);
      });

      // Flag on south pylon
      var flag = E.bx(3, 2, 0.2, new THREE.MeshPhongMaterial({ color: 0x0033aa, shininess: 20 }), false);
      flag.position.set(archW / 2 + 1, 20, 0); g.add(flag);

      var lb = E.makeLabel('Harbour Bridge'); lb.position.set(0, archH + 14, 0); g.add(lb);
      return g;
    },
  },
};
