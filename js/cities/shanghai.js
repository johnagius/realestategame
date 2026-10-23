/* PROPERTY EMPIRE — Shanghai: Oriental Pearl Tower, The Bund */
var CityDef_Shanghai = {
  name:'Shanghai', id:'shanghai',

  // Project Skyline profile (SKYLINE-5): warm + neon mix with gold-trim accents.
  // Huangpu water carries a warm gold specular; dusk horizons run peach into plum.
  // Resolved by City3D._prof: era key > base > ERAS palette.
  profile: {
    base: { skyline: 0x1b253d, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.08, sunDay: 0xffe0b0, sunDusk: 0xc088a0,
      ambDay: 0x36304a, ambDusk: 0x1e1c30, hemiSky: 0xc0d0f0, hemiGround: 0x4a4038,
      wallJitter: 0.07, water: { color: 0x1a4a6e, specular: 0xe8c888, opacity: 0.9 },
      trees: 'plane', lamps: 'modern' },
    victorian: { sky: ['#241a3e', '#7a4a58', '#f0a45c'], fog: 0x584050, haze: 0.24, lamps: 'gas',
      sunDusk: 0xe08a52, ambDusk: 0x2a1e28, ground: 0x2c2724, road: 0x242020, side: 0x453b33, park: 0x2f4a28 },
    gilded:    { sky: ['#281e44', '#8a4a60', '#f8ac62'], fog: 0x604458, haze: 0.22, lamps: 'gas',
      sunDusk: 0xe08a52, ambDusk: 0x2c202c, ground: 0x2e2926, road: 0x272321, side: 0x483e36, park: 0x30522a },
    crisis:    { sky: ['#1c1c34', '#525878', '#c89878'], fog: 0x424258, haze: 0.3,
      ground: 0x2a2929, road: 0x222124, side: 0x413e42, park: 0x2d4628 },
    boom:      { sky: ['#181e48', '#605a92', '#f8a85c'], fog: 0x4a4878, haze: 0.17,
      ground: 0x2b2b31, road: 0x25252b, side: 0x484850, park: 0x2e5a2e },
    modern:    { sky: ['#142048', '#3f5a90', '#f0a068'], fog: 0x2f3f6a, haze: 0.18,
      ground: 0x282932, road: 0x23242a, side: 0x464752, park: 0x2c5a30 },
    digital:   { sky: ['#0a1030', '#2a2a72', '#c04898'], fog: 0x1e2458, haze: 0.14, lamps: 'neon',
      water: { color: 0x0c2448, specular: 0xffd890, opacity: 0.86 },
      ground: 0x201f2c, road: 0x181722, side: 0x353646, park: 0x24502e },
  },

  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['AP','RD','RD','RD','RD','RD','SK'],
    ['RD','RD','OPT','RD','SK','RD','RD'],
    ['CM','RD','RD','RD','RD','RD','PH'],
    ['W','W','W','BLR','W','W','W'],
    ['BND','RD','RD','RD','RD','RD','MN'],
    ['TH','RD','VI','RD','HO','RD','CM'],
    ['CT','CT','CP','CP','CP','CT','CT'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); water landmarks keep their water
  landmarkGround: { BLR:'W' },
  landmarkNames:{OPT:'Oriental Pearl Tower',BND:'The Bund',BLR:'Bund Lamp Row'},
  landmarks:{
    OPT:function(){
      var g=new THREE.Group(),E=City3D;
      var Mpink=new THREE.MeshPhongMaterial({color:0xd06080,shininess:60});
      var Msilver=new THREE.MeshPhongMaterial({color:0xa0a8b0,shininess:70});
      // Three legs at base
      for(var i=0;i<3;i++){
        var a=i*Math.PI*2/3;
        var leg=E.cy(1.5,2.5,25,6,Msilver);
        leg.position.set(Math.cos(a)*4,12.5,Math.sin(a)*4);
        leg.rotation.z=Math.cos(a)*0.12;leg.rotation.x=Math.sin(a)*0.12;
        g.add(leg);
      }
      // Lower sphere
      var ls=E.sphr(7,10,Mpink);ls.position.y=20;g.add(ls);
      // Middle shaft
      var ms=E.cy(1.8,1.8,30,8,Msilver);ms.position.y=20+15;g.add(ms);
      // Upper sphere (bigger)
      var us=E.sphr(9,10,Mpink);us.position.y=55;g.add(us);
      // Top shaft + small sphere
      var ts=E.cy(1,1,20,6,Msilver);ts.position.y=55+10;g.add(ts);
      var top=E.sphr(3,8,Mpink);top.position.y=78;g.add(top);
      // Antenna
      var ant=E.cy(0,0.4,18,4,Msilver);ant.position.y=78+9;g.add(ant);
      // Lights
      var pl=new THREE.PointLight(0xff4488,1.5,40);pl.position.set(0,55,0);g.add(pl);
      var lb=E.makeLabel('Oriental Pearl');lb.position.set(0,100,0);g.add(lb);
      return g;
    },
    BND:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xc8bca0,shininess:35});
      // Row of colonial-era buildings along waterfront
      var heights=[18,22,16,20,24,18];
      for(var i=0;i<6;i++){
        var bld=E.bx(4,heights[i],8,Ms);bld.position.set(-10+i*4.2,heights[i]/2,0);g.add(bld);
        var cor=E.bx(4.4,1,8.4,Ms,false);cor.position.set(-10+i*4.2,heights[i],0);g.add(cor);
        E._addWinSimple(g,4,heights[i],8,Math.floor(heights[i]/6),1,0);
      }
      // Clock tower on center building
      var clock=E.bx(3,8,3,Ms);clock.position.set(-1.8,24+4,0);g.add(clock);
      var face=E.cy(1.5,1.5,0.3,10,new THREE.MeshPhongMaterial({color:0xf0e8c0,emissive:0x302810,shininess:60}));
      face.rotation.x=Math.PI/2;face.position.set(-1.8,30,-1.6);g.add(face);
      var lb=E.makeLabel('The Bund');lb.position.set(0,34,0);g.add(lb);
      return g;
    },
    // Signature (SKYLINE-5): Bund-style lamp row along the river
    BLR:function(){
      var g=new THREE.Group(),E=City3D;
      var Mgold=new THREE.MeshPhongMaterial({color:0xc8a858,shininess:60});
      // Water stays (landmarkGround 'W'), promenade strip on the quay edge
      g.add(E.flatPlane(28,28,E.M.WATER));
      var quay=E.bx(24,0.5,5,E.M.SIDEW);quay.position.set(0,0.25,-9);g.add(quay);
      // Three ornate gold lamp posts along the quay
      [-7,0,7].forEach(function(lx){
        var post=E.cy(0.18,0.3,6.5,5,Mgold);post.position.set(lx,3.25,-9);g.add(post);
        var globe=E.sphr(0.62,5,E.M.LAMP);globe.position.set(lx,6.8,-9);g.add(globe);
      });
      var lb=E.makeLabel('Bund Lamps');lb.position.set(0,11,0);g.add(lb);
      return g;
    },
  },
};
