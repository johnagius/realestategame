/* PROPERTY EMPIRE — Toronto: CN Tower, Rogers Centre */
var CityDef_Toronto = {
  name:'Toronto', id:'toronto',

  // Project Skyline profile (SKYLINE-5): cool clear blue, conifers; modern and
  // digital go snow-pale on ground/side (city identity: frozen quays).
  // Victorian gets A's warm gas-lit dusk; Digital gets C's neon lamps +
  // darkest mirror water.
  profile: {
    base: { exposure: 1.08, sunDay: 0xf2f6ff, sunDusk: 0x9aa8d8,
      ambDay: 0x323e58, ambDusk: 0x1a2238, hemiSky: 0xc6daf6, hemiGround: 0x3e4c4a,
      wallJitter: 0.06, sky: ['#12224c', '#3a5e96', '#bcdaea'], fog: 0x4c648c, haze: 0.15,
      water: { color: 0x1c507a, specular: 0xcae6fa, opacity: 0.9 },
      ground: 0x282c36, road: 0x21252e, side: 0x464d59, park: 0x2b4c34,
      trees: 'conifer', lamps: 'modern' },
    victorian: { lamps: 'gas', sunDusk: 0xd8905e, ambDusk: 0x211d2e, haze: 0.23 },
    modern: { ground: 0x4e5866, road: 0x38404c, side: 0x7e8896, park: 0x3e5a50 },
    digital: { lamps: 'neon', ground: 0x424c5c, road: 0x323a46, side: 0x6e7887, park: 0x34504a,
      water: { color: 0x0e3048, specular: 0xe6f6ff, opacity: 0.87 } },
  },

  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','CNT','RD','SK','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','VI','RD','SK'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','TH'],
    ['W','W','FRQ','W','W','HB','W'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); water landmarks keep their water
  landmarkGround: { FRQ:'HB' },
  // CN Tower rises 1976 — era-gated like London's Shard (DESIGN-DIRECTION §4)
  landmarkEras: { CNT:'modern' },
  landmarkNames:{CNT:'🗼 CN Tower',FRQ:'Frozen Quay'},
  landmarks:{
    CNT:function(){
      var g=new THREE.Group(),E=City3D;
      var Mc=new THREE.MeshPhongMaterial({color:0xc0b8a8,shininess:50});
      // Main shaft (very tall, thin)
      var shaft=E.cy(1.2,3,80,8,Mc);shaft.position.y=40;g.add(shaft);
      // Pod (observation/restaurant level)
      var pod=E.cy(6,5.5,8,12,new THREE.MeshPhongMaterial({color:0xa8a098,shininess:60}));
      pod.position.y=58;g.add(pod);
      // Sky pod (smaller, higher)
      var sky=E.cy(3,2.8,4,10,Mc);sky.position.y=68;g.add(sky);
      // Antenna
      var ant=E.cy(0,0.8,32,6,Mc);ant.position.y=80+16;g.add(ant);
      // Red warning light
      var rl=new THREE.PointLight(0xff2200,0.8,20);rl.position.set(0,112,0);g.add(rl);
      // Base supports (3 legs)
      for(var i=0;i<3;i++){
        var a=i*Math.PI*2/3;
        var leg=E.cy(0.5,1.5,12,6,Mc);
        leg.position.set(Math.cos(a)*3,6,Math.sin(a)*3);
        leg.rotation.z=Math.cos(a)*0.15;leg.rotation.x=Math.sin(a)*0.15;
        g.add(leg);
      }
      var lb=E.makeLabel('CN Tower');lb.position.set(0,118,0);g.add(lb);
      return g;
    },
    // SKYLINE-5 signature: frozen-quay cluster — ice sheet + snow-pale quay blocks
    FRQ:function(){
      var g=new THREE.Group(),E=City3D;
      var Mice=new THREE.MeshPhongMaterial({color:0xd6e4ee,shininess:70});
      g.add(E.flatPlane(28,28,E.M.HARBOR));
      // Partial ice sheet (harbour water stays visible around it)
      var ice=E.bx(18,0.5,12,Mice,false);ice.position.set(-3,0.05,3);g.add(ice);
      // Snow-pale quay block + crates (shared mansion-trim white)
      var quay=E.bx(8,2,4,E.M.MNt);quay.position.set(6,1,-6);g.add(quay);
      var c1=E.bx(2.4,2.4,2.4,E.M.MNt);c1.position.set(9,1.2,0);g.add(c1);
      var c2=E.bx(1.8,1.8,1.8,E.M.MNt);c2.position.set(6.6,0.9,2);g.add(c2);
      // Beacon (shared flagpole + lamp materials)
      var pole=E.cy(0.16,0.24,7,5,E.M.FLAGPOLE);pole.position.set(10,3.5,-8);g.add(pole);
      var bulb=E.sphr(0.6,5,E.M.LAMP);bulb.position.set(10,7.2,-8);g.add(bulb);
      var lb=E.makeLabel('Frozen Quay');lb.position.set(0,14,0);g.add(lb);
      return g;
    },
  },
};
