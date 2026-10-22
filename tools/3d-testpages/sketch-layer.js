/* Project Skyline — TARGET SKETCH layer. Prototype only, never shipped.
   Adds the layers the shipped renderer lacks on top of a live City3D scene so
   the target look can be photographed with the real engine:
     1. ground plane to the horizon      4. lamp light pools at night
     2. suburb band + skyline silhouette  5. cars on roads, boats on water
     3. distant hills in the haze         6. clouds with presence, camera pulled back
   Everything is merged into a handful of draw calls. Load from city.html?sketch=1.
   Rolling this into js/city3d-engine.js is SKYLINE-5/6 (see docs/SKYLINE-TARGET.md). */
var SkylineSketch = {
  apply: function(opts) {
    opts = opts || {};
    var E = City3D, T = E.TILE, piv = E._pivot, scene = E._scene;
    if (!piv || !scene) return false;
    if (E._sketchGroup) { piv.remove(E._sketchGroup); E._sketchGroup = null; }
    var grp = new THREE.Group(); grp.name = 'sketch'; piv.add(grp); E._sketchGroup = grp;
    var def = E._cityDef, GW = def.layout[0].length, GH = def.layout.length;
    var HX = GW * T / 2, HZ = GH * T / 2, OX = -(GW - 1) * T / 2, OZ = -(GH - 1) * T / 2;
    var n = E._night, fogC = scene.fog.color.clone();
    var rng = E._mkRng(4242);
    var lam = function(c) { return new THREE.MeshLambertMaterial({ color: c }); };

    // 1+2. Surroundings. The camera is ORTHOGRAPHIC, so it has no horizon: anything
    //    that extends behind the city climbs the screen and eats the sky. So the
    //    surroundings are a rotated slab aligned to the view: it runs far to the
    //    front and sides (filling the void under and beside the island) but stops at
    //    a skyline edge BACK_D units behind the centre, where the tallest silhouettes
    //    stand against the sky and the ground fades into the haze.
    var BACK_D = 250, FRONT_D = 900, SIDE = 800;
    var pr = E._prof(E._era) || {}, gHex = pr.ground != null ? pr.ground : (E.ERAS[E._era] || E.ERAS.modern).ground;
    var gcol = new THREE.Color(gHex).lerp(fogC, 0.45).lerp(new THREE.Color(0x05070c), 0.25);
    var slab = new THREE.Group(); slab.rotation.y = Math.PI / 4; grp.add(slab); // local +z = toward camera
    var gcv = document.createElement('canvas'); gcv.width = 4; gcv.height = 256;
    var gc = gcv.getContext('2d'), gg = gc.createLinearGradient(0, 0, 0, 256);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.16, 'rgba(255,255,255,1)'); gg.addColorStop(1, 'rgba(255,255,255,1)');
    gc.fillStyle = gg; gc.fillRect(0, 0, 4, 256);
    var gnd = new THREE.Mesh(new THREE.PlaneGeometry(SIDE * 2, BACK_D + FRONT_D), new THREE.MeshLambertMaterial({ color: gcol, map: E._canvasTex(gcv), transparent: true, depthWrite: false }));
    gnd.rotation.x = -Math.PI / 2; gnd.position.set(0, -0.9, (FRONT_D - BACK_D) / 2); gnd.receiveShadow = true; gnd.renderOrder = -1; slab.add(gnd);

    var buckets = [[], [], []], cs = Math.cos(Math.PI / 4), sn = Math.sin(Math.PI / 4);
    function toWorld(lx, lz) { return { x: lx * cs + lz * sn, z: -lx * sn + lz * cs }; }
    for (var i = 0; i < 2600; i++) {
      var lx = (rng() * 2 - 1) * SIDE, lz = -BACK_D + 20 + rng() * (FRONT_D - 60);
      var w = toWorld(lx, lz);
      if (Math.abs(w.x) < HX + T * 0.55 && Math.abs(w.z) < HZ + T * 0.55) continue;
      var d = -lz; // distance behind the centre (negative = in front)
      var h = 3 + rng() * 7;
      if (d > 40) h += rng() * rng() * (14 + 52 * Math.min(1, (d - 40) / 180));
      if (d < -60) h = 2 + rng() * 4;
      var m = new THREE.Mesh(new THREE.BoxGeometry(5 + rng() * 11, h, 5 + rng() * 11));
      m.position.set(lx, h / 2 - 0.9, lz); m.rotation.y = (rng() < 0.5 ? 0 : Math.PI / 2) + (rng() - 0.5) * 0.12;
      buckets[Math.floor(rng() * 3)].push(m);
    }
    for (var k = 0; k < 14; k++) { // skyline spires on the back edge
      var h2 = 34 + rng() * 60, sp = new THREE.Mesh(new THREE.BoxGeometry(8 + rng() * 10, h2, 8 + rng() * 10));
      sp.position.set((rng() * 2 - 1) * 520, h2 / 2, -BACK_D + 10 + rng() * 60); buckets[1].push(sp);
    }
    var base = gcol.clone().lerp(new THREE.Color(0x2a3242), 0.45).multiplyScalar(0.88); // cool, recessive
    [0.8, 0.9, 1.0].forEach(function(t, bi) {
      if (!buckets[bi].length) return;
      var mesh = new THREE.Mesh(E._mergeMeshes(buckets[bi]), lam(base.clone().multiplyScalar(t)));
      slab.add(mesh); buckets[bi].forEach(function(m) { m.geometry.dispose(); });
    });

    // 3. Hills: dropped — beyond the disc they sit in 100% fog and vanish under an ortho camera.

    // 4. Lamp light pools (night only): one additive mesh for every lamp position.
    if (n > 0.35) {
      var pools = [], warm = (E._prof(E._era) || {}).lamps === 'neon';
      def.layout.forEach(function(row, rr) { row.forEach(function(t, cc) {
        if (t !== 'RD' || (!warm && (rr + cc) % 2 !== 0)) return;
        var p = new THREE.Mesh(new THREE.PlaneGeometry(24, 24)); p.rotation.x = -Math.PI / 2;
        p.position.set(OX + cc * T + T * 0.36 - 1.5, 0.5, OZ + rr * T + T * 0.36); pools.push(p);
      }); });
      if (pools.length) {
        var pm = new THREE.Mesh(E._mergeMeshes(pools), new THREE.MeshBasicMaterial({ map: E._glowTex(), color: warm ? 0x9fdcff : 0xffc27a, transparent: true, opacity: 0.22 + 0.2 * n, blending: THREE.AdditiveBlending, depthWrite: false }));
        pm.renderOrder = 4; grp.add(pm); pools.forEach(function(m) { m.geometry.dispose(); });
      }
    }

    // 5. Street life: cars on roads (merged per colour), boats on water.
    var carCols = [0xd9d9df, 0x2b2f36, 0xb33a3a, 0x3b5fa8, 0xe3b53a, 0x6b7280], cars = carCols.map(function() { return []; });
    var roads = [], waters = [];
    def.layout.forEach(function(row, rr) { row.forEach(function(t, cc) { if (t === 'RD') roads.push([rr, cc]); if (t === 'W' || t === 'HB') waters.push([rr, cc]); }); });
    for (var ci = 0; ci < Math.min(18, roads.length * 2); ci++) {
      var rc = roads[Math.floor(rng() * roads.length)], along = rng() < 0.5, off = (rng() < 0.5 ? -1 : 1) * T * 0.09, u = (rng() - 0.5) * T * 0.7;
      var car = new THREE.Mesh(new THREE.BoxGeometry(along ? 3.4 : 1.7, 1.2, along ? 1.7 : 3.4));
      car.position.set(OX + rc[1] * T + (along ? u : off), 0.95, OZ + rc[0] * T + (along ? off : u));
      cars[Math.floor(rng() * carCols.length)].push(car);
      var roof = new THREE.Mesh(new THREE.BoxGeometry(along ? 1.8 : 1.4, 0.8, along ? 1.4 : 1.8)); roof.position.copy(car.position); roof.position.y += 0.9; cars[1].push(roof);
    }
    cars.forEach(function(list, i) { if (!list.length) return; var cm = new THREE.Mesh(E._mergeMeshes(list), new THREE.MeshPhongMaterial({ color: carCols[i], shininess: 90 })); cm.castShadow = true; grp.add(cm); list.forEach(function(m) { m.geometry.dispose(); }); });
    if (waters.length) {
      var hulls = [], cabins = [], wakes = [];
      for (var bi2 = 0; bi2 < 3; bi2++) {
        var wc = waters[Math.floor(rng() * waters.length)], bx = OX + wc[1] * T + (rng() - 0.5) * T * 0.5, bz = OZ + wc[0] * T + (rng() - 0.5) * T * 0.5, ang = rng() * Math.PI;
        var hull = new THREE.Mesh(new THREE.BoxGeometry(9, 1.3, 3.2)); hull.position.set(bx, 0.35, bz); hull.rotation.y = ang; hulls.push(hull);
        var cab = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 2.2)); cab.position.set(bx, 1.6, bz); cab.rotation.y = ang; cabins.push(cab);
        var wk = new THREE.Mesh(new THREE.PlaneGeometry(16, 5)); wk.rotation.x = -Math.PI / 2; wk.rotation.z = -ang; wk.position.set(bx - Math.cos(ang) * 8, 0.05, bz + Math.sin(ang) * 8); wakes.push(wk);
      }
      grp.add(new THREE.Mesh(E._mergeMeshes(hulls), new THREE.MeshPhongMaterial({ color: 0xf0ece4, shininess: 60 })));
      grp.add(new THREE.Mesh(E._mergeMeshes(cabins), new THREE.MeshPhongMaterial({ color: 0x2a3a4a, shininess: 60 })));
      grp.add(new THREE.Mesh(E._mergeMeshes(wakes), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false })));
      hulls.concat(cabins, wakes).forEach(function(m) { m.geometry.dispose(); });
    }

    // 6. Clouds with presence (critique fix #2) and the camera pulled back so the world shows.
    (E._clouds || []).forEach(function(s) { s.material.opacity = Math.min(0.3, s.material.opacity * 2.4); s.material.color.set(fogC.clone().lerp(new THREE.Color(0xffffff), 0.65)); });
    E.setView({ zoom: opts.zoom || 0.88, immediate: true });
    // Stronger shadow contact: a touch more sun, a touch less ambient.
    if (E._sun) E._sun.intensity *= 1.12;
    if (E._amb) E._amb.intensity *= 0.9;
    return true;
  },
};
