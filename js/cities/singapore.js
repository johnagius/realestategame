/* PROPERTY EMPIRE — Singapore: Marina Bay Sands, Merlion */
var CityDef_Singapore = {
  name:'Singapore', id:'singapore',

  // Project Skyline profile (SKYLINE-5): lush green against glass and tropical teal
  // water; heavy humid haze softens every era. Palm trees. Resolved by City3D._prof:
  // era key > base > ERAS palette.
  profile: {
    base: { skyline: 0x1a263b, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.09, sunDay: 0xffecc4, sunDusk: 0xa090b0,
      ambDay: 0x36403e, ambDusk: 0x1c2030, hemiSky: 0xc4dcd8, hemiGround: 0x3c4a34,
      wallJitter: 0.07, water: { color: 0x12586a, specular: 0xa8e0d8, opacity: 0.9 },
      trees: 'palm', lamps: 'modern' },
    victorian: { sky: ['#202040', '#5a5878', '#e8a06a'], fog: 0x484860, haze: 0.3, lamps: 'gas',
      sunDusk: 0xd88a58, ambDusk: 0x242028, ground: 0x272822, road: 0x21211e, side: 0x3f4036, park: 0x2c5226 },
    gilded:    { sky: ['#242448', '#686080', '#f0a870'], fog: 0x50506a, haze: 0.28, lamps: 'gas',
      sunDusk: 0xd88a58, ambDusk: 0x26222a, ground: 0x292a24, road: 0x232320, side: 0x414238, park: 0x2e5828 },
    crisis:    { sky: ['#1c2038', '#4c5c74', '#c8a078'], fog: 0x3c4456, haze: 0.32,
      ground: 0x292b2a, road: 0x212224, side: 0x3e403e, park: 0x2c502a },
    boom:      { sky: ['#162448', '#486088', '#f2a668'], fog: 0x3c4a6e, haze: 0.24,
      ground: 0x2a2c2c, road: 0x232526, side: 0x454844, park: 0x2d5c2c },
    modern:    { sky: ['#122448', '#3c5a80', '#e8a268'], fog: 0x2c4064, haze: 0.22,
      ground: 0x282b2e, road: 0x222326, side: 0x434640, park: 0x2c6030 },
    digital:   { sky: ['#081028', '#1e3a6a', '#7a58b0'], fog: 0x182850, haze: 0.18, lamps: 'neon',
      water: { color: 0x0a2c44, specular: 0xc0f0e8, opacity: 0.86 },
      ground: 0x1e2228, road: 0x171a20, side: 0x323840, park: 0x24502c },
  },

  layout:[
    ['CP','CP','CT','CT','CT','SUP','CP'],
    ['SK','RD','RD','RD','RD','RD','PH'],
    ['RD','RD','MBS','RD','SK','RD','RD'],
    ['AP','RD','RD','RD','RD','RD','CM'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['TH','RD','MN','RD','VI','RD','HO'],
    ['W','W','MRL','W','W','HB','W'],
    ['W','W','W','W','W','W','W'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); water landmarks keep their water
  landmarkGround: { MRL:'W' },
  // Supertrees are a 2012 Gardens-by-the-Bay piece — digital era only
  landmarkEras: { SUP:'digital' },
  landmarkNames:{MBS:'Marina Bay Sands',MRL:'Merlion',SUP:'Supertree Grove'},
  landmarks:{
    MBS:function(){
      var g=new THREE.Group(),E=City3D;
      var Mgold=new THREE.MeshPhongMaterial({color:0xc8a858,shininess:70});
      var Mglass=new THREE.MeshPhongMaterial({color:0x6898b8,transparent:true,opacity:0.92,shininess:90});
      // Three towers
      [-8,0,8].forEach(function(tx){
        var tower=E.bx(5,55,5,Mglass);tower.position.set(tx,27.5,0);g.add(tower);
        E._addWinSimple(g,5,55,5,Math.floor(55/7),1,0);
        // Slight lean outward
        if(tx!==0){var lean=E.bx(5,55,5,Mglass);lean.position.set(tx*1.08,27.5,0);lean.visible=false;}
      });
      // Sky park (the boat on top)
      var park=E.bx(28,2,8,Mgold);park.position.y=56;g.add(park);
      // Cantilever extension
      var cant=E.bx(6,1.5,8,Mgold);cant.position.set(14,56,0);g.add(cant);
      // Pool on top (blue)
      var pool=E.bx(22,0.5,4,new THREE.MeshPhongMaterial({color:0x2080c0,shininess:100}));
      pool.position.set(2,57.3,0);g.add(pool);
      // Trees on sky park
      [-8,-2,4,10].forEach(function(tx2){
        var t=E.sphr(1.8,5,E.M.PARKD);t.position.set(tx2,58.5,3);g.add(t);
      });
      var lb=E.makeLabel('Marina Bay Sands');lb.position.set(0,65,0);g.add(lb);
      return g;
    },
    MRL:function(){
      var g=new THREE.Group(),E=City3D;
      var Mstone=new THREE.MeshPhongMaterial({color:0xc8c0b0,shininess:40});
      var wb=E.flatPlane(28,28,E.M.WATER);wb.position.y=-0.3;g.add(wb);
      // Pedestal
      var ped=E.bx(6,4,6,E.M.CONC);ped.position.y=2;g.add(ped);
      // Body
      var body=E.cy(2.5,3.5,14,8,Mstone);body.position.y=4+7;g.add(body);
      // Head (lion)
      var head=E.sphr(3.5,7,Mstone);head.position.y=18+3.5;g.add(head);
      // Mane
      var mane=E.sphr(4,6,new THREE.MeshPhongMaterial({color:0xa89870,shininess:20}));
      mane.position.y=18+3;g.add(mane);
      // Water spout (emissive blue)
      var spout=E.cy(0.8,0.3,8,6,new THREE.MeshPhongMaterial({color:0x3090e0,emissive:0x1050a0,transparent:true,opacity:0.7}));
      spout.rotation.x=Math.PI/4;spout.position.set(0,18,-5);g.add(spout);
      var wl=new THREE.PointLight(0x3090e0,1.2,25);wl.position.set(0,16,-6);g.add(wl);
      var lb=E.makeLabel('Merlion');lb.position.set(0,28,0);g.add(lb);
      return g;
    },
    // Signature (SKYLINE-5): Gardens-by-the-Bay-style supertree grove
    SUP:function(){
      var g=new THREE.Group(),E=City3D;
      // Park base
      g.add(E.flatPlane(28,28,E.M.PARK));
      // Two supertrees: steel trunk, planted funnel canopy, neon collar
      [-6,6].forEach(function(tx){
        var trunk=E.cy(0.6,1.4,16,6,E.M.CONC);trunk.position.set(tx,8,0);g.add(trunk);
        var funnel=E.cy(5.2,0.9,4.5,8,E.M.PARKL);funnel.position.set(tx,18.2,0);g.add(funnel);
        var collar=E.cy(5.4,5.4,0.5,8,E.M.LAMPNEON_M);collar.position.set(tx,16.1,0);g.add(collar);
      });
      // Elevated skyway between them
      var walk=E.bx(13,0.6,1.6,E.M.CONC);walk.position.set(0,13,0);g.add(walk);
      var lb=E.makeLabel('Supertree Grove');lb.position.set(0,25,0);g.add(lb);
      return g;
    },
  },
};
