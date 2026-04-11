/* ========================================
   PROPERTY EMPIRE — Paris City Definition
   Layout + landmarks: Eiffel Tower, Notre-Dame, Arc de Triomphe
   ======================================== */

var CityDef_Paris = {

  name: 'Paris',
  id: 'paris',

  layout: [
    ['CP', 'CP', 'CP', 'ARC', 'CP', 'CP', 'CP'],
    ['TH', 'RD', 'RD', 'RD', 'RD', 'RD', 'AP'],
    ['CM', 'RD', 'MN', 'RD', 'SK', 'RD', 'PH'],
    ['RD', 'RD', 'RD', 'EIF', 'RD', 'RD', 'RD'],
    ['W',  'W',  'W',  'W',  'NTD', 'W',  'W' ],
    ['HO', 'RD', 'RD', 'RD', 'RD', 'RD', 'VI'],
    ['ST', 'RD', 'CM', 'RD', 'TH', 'RD', 'WR'],
    ['CT', 'CT', 'CT', 'CP', 'CP', 'CT', 'CT'],
  ],

  landmarkNames: {
    EIF: '🗼 Eiffel Tower',
    NTD: '⛪ Notre-Dame',
    ARC: '🏛️ Arc de Triomphe',
  },

  landmarks: {

    EIF: function() {
      var g = new THREE.Group(), E = City3D;
      var Mbrown = new THREE.MeshPhongMaterial({ color: 0x5a4838, shininess: 30 });
      var Mdark = new THREE.MeshPhongMaterial({ color: 0x4a3828, shininess: 25 });
      var H = 90;

      // Four legs — thick at base, converge at top
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(d) {
        var leg = E.cy(0.4, 3.5, H * 0.7, 6, Mbrown);
        leg.position.set(d[0] * 2, H * 0.35, d[1] * 2); g.add(leg);
      });

      // Arch between legs
      var arch = E.bx(14, 3, 14, Mdark);
      arch.position.y = H * 0.7; g.add(arch);

      // Second platform
      var plat2 = E.bx(8, 2.5, 8, Mbrown);
      plat2.position.y = H * 0.5; g.add(plat2);

      // First platform (wider)
      var plat1 = E.bx(16, 3, 16, Mbrown);
      plat1.position.y = H * 0.3; g.add(plat1);

      // Upper shaft
      var shaft = E.bx(4, H * 0.28, 4, Mbrown);
      shaft.position.y = H * 0.7 + H * 0.14; g.add(shaft);

      // Lattice detail — horizontal rings
      for (var i = 0; i < 15; i++) {
        var ly = i * (H / 15);
        var lw = 14 * (1 - ly / H) + 2;
        var ring = E.bx(lw, 0.25, lw, Mdark, false);
        ring.position.y = ly; g.add(ring);
      }

      // Antenna/spire
      var antenna = E.cy(0, 0.5, 16, 4, Mbrown);
      antenna.position.y = H + 8; g.add(antenna);

      // Observation light
      var ol = new THREE.PointLight(0xffdd88, 1.5, 50);
      ol.position.set(0, H * 0.5, 0); g.add(ol);

      var lb = E.makeLabel('Eiffel Tower'); lb.position.set(0, H + 22, 0); g.add(lb);
      return g;
    },

    NTD: function() {
      var g = new THREE.Group(), E = City3D;
      var Mstone = new THREE.MeshPhongMaterial({ color: 0xc0b498, shininess: 25 });
      var Mroof = new THREE.MeshPhongMaterial({ color: 0x4a5a6a, shininess: 20, side: THREE.DoubleSide });
      var Mrose = new THREE.MeshPhongMaterial({ color: 0x5888a8, emissive: 0x182838, shininess: 60 });

      // Water base (it's on an island in the Seine)
      g.add(E.flatPlane(28, 28, E.M.WATER));

      // Main nave
      var nave = E.bx(18, 22, 12, Mstone);
      nave.position.set(0, 11, 0); g.add(nave);

      // Gabled roof
      var roof = E.gabledRoof(18, 8, 12, Mroof);
      roof.position.set(0, 22, 0); g.add(roof);

      // Twin towers
      [-6, 6].forEach(function(tx) {
        var tower = E.bx(5, 30, 5, Mstone);
        tower.position.set(tx, 15, -6); g.add(tower);
        var tTop = E.bx(5.5, 2, 5.5, Mstone, false);
        tTop.position.set(tx, 30 + 1, -6); g.add(tTop);
      });

      // Rose window
      var rose = E.cy(3.5, 3.5, 0.5, 12, Mrose);
      rose.rotation.x = Math.PI / 2;
      rose.position.set(0, 16, -6.3); g.add(rose);

      // Spire (rebuilt)
      var spire = E.cy(0, 1.2, 18, 6, Mroof);
      spire.position.set(0, 22 + 8 + 9, 0); g.add(spire);

      // Flying buttresses (simplified)
      [-10, 10].forEach(function(bx2) {
        var butt = E.bx(1, 12, 1, Mstone, false);
        butt.rotation.z = bx2 > 0 ? 0.3 : -0.3;
        butt.position.set(bx2, 10, 0); g.add(butt);
      });

      var lb = E.makeLabel('Notre-Dame'); lb.position.set(0, 50, 0); g.add(lb);
      return g;
    },

    ARC: function() {
      var g = new THREE.Group(), E = City3D;
      var Mstone = new THREE.MeshPhongMaterial({ color: 0xd0c4a8, shininess: 30 });
      var Mdark = new THREE.MeshPhongMaterial({ color: 0xa09878, shininess: 20 });

      // Park base (Place de l'Etoile)
      g.add(E.flatPlane(28, 28, E.M.PARK));

      // Main arch structure — 4 pillars + top
      var W = 14, H = 22, D = 8;

      // Four pillars
      [[-W / 2, -D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [W / 2, D / 2]].forEach(function(a) {
        var pil = E.bx(3, H, 3, Mstone);
        pil.position.set(a[0], H / 2, a[1]); g.add(pil);
      });

      // Top slab
      var top = E.bx(W + 2, 4, D + 2, Mstone);
      top.position.y = H + 2; g.add(top);

      // Attic (raised center)
      var attic = E.bx(W - 2, 3, D - 2, Mdark);
      attic.position.y = H + 4 + 1.5; g.add(attic);

      // Cornice detail
      var cornice = E.bx(W + 3, 1, D + 3, Mdark, false);
      cornice.position.y = H + 4; g.add(cornice);

      // Internal vault (arch opening — dark void)
      var vault = E.bx(W - 6, H - 4, 0.5, E.M.WINOFF, false);
      vault.position.set(0, (H - 4) / 2, -D / 2 - 0.26); g.add(vault);
      var vault2 = E.bx(W - 6, H - 4, 0.5, E.M.WINOFF, false);
      vault2.position.set(0, (H - 4) / 2, D / 2 + 0.26); g.add(vault2);

      // Warm uplighting
      var ul = new THREE.PointLight(0xffddaa, 1, 25);
      ul.position.set(0, 5, 0); g.add(ul);

      var lb = E.makeLabel('Arc de Triomphe'); lb.position.set(0, H + 12, 0); g.add(lb);
      return g;
    },
  },
};
