/* ========================================
   PROPERTY EMPIRE — Dubai City Definition
   Layout + landmarks: Burj Khalifa, Burj Al Arab
   ======================================== */

var CityDef_Dubai = {

  name: 'Dubai',
  id: 'dubai',

  layout: [
    ['CT', 'CT', 'CT', 'CT', 'CT', 'CT', 'CT'],
    ['CT', 'RD', 'RD', 'RD', 'RD', 'RD', 'CM'],
    ['MN', 'RD', 'SK', 'RD', 'BKH', 'RD', 'PH'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['VI', 'RD', 'CM', 'RD', 'SK', 'RD', 'AP'],
    ['RD', 'RD', 'RD', 'RD', 'RD', 'RD', 'RD'],
    ['TH', 'RD', 'BAA', 'RD', 'HO', 'RD', 'ST'],
    ['W',  'W',  'HB', 'W',  'W',  'HB', 'W' ],
  ],

  landmarkNames: {
    BKH: '🏗️ Burj Khalifa',
    BAA: '⛵ Burj Al Arab',
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
  },
};
