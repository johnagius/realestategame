/* PROPERTY EMPIRE — Berlin: Brandenburg Gate, TV Tower */
var CityDef_Berlin = {
  name:'Berlin', id:'berlin',
  // Project Skyline art direction (SKYLINE-5): cooler grey-green city under a steel-blue
  // sky triad, plane/linden trees. Era key > base > ERAS (City3D._prof); Victorian/Gilded
  // gas-lit warm dusk, Digital neon + dark mirror Spree (docs/SKYLINE.md §2, direction B).
  profile:{
    base:{ skyline: 0x262a33, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure:1.06, sunDay:0xf2e2c4, sunDusk:0x8ea2d4,
      ambDay:0x303842, ambDusk:0x1a2030, hemiSky:0xacc4e2, hemiGround:0x3a443e,
      wallJitter:0.06, water:{color:0x1c4c68,specular:0x9cc6e2,opacity:0.9},
      sky:['#0f1830','#3a5478','#b8a084'], fog:0x4a4c50, haze:0.18,
      ground:0x27282b, road:0x222429, side:0x3f434b, park:0x2c4e2d,
      trees:'plane', lamps:'modern' },
    victorian:{ sky:['#181838','#5c5064','#dda06a'], fog:0x484456, haze:0.26, lamps:'gas',
      sunDusk:0xd48e58, ambDusk:0x221f2c },
    gilded:{ lamps:'gas', sunDusk:0xd48e58 },
    digital:{ sky:['#070c24','#1c2e66','#3a4a9c'], fog:0x14203f, haze:0.13, lamps:'neon',
      water:{color:0x0c2438,specular:0xc8e4f8,opacity:0.86} },
  },
  layout:[
    ['CP','CP','CP','VIC','CP','CP','CP'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','BRG','RD','TVT','RD','SK'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','PH','RD','VI'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','TH'],
    ['CT','CT','CT','CP','CP','CT','CT'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); the column keeps its park
  landmarkGround:{VIC:'CP'},
  landmarkNames:{BRG:'Brandenburg Gate',TVT:'TV Tower',VIC:'Victory Column'},
  landmarks:{
    BRG:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xd0c4a8,shininess:35});
      g.add(E.flatPlane(28,28,E.M.PARK));
      // 6 Doric columns
      for(var i=0;i<6;i++){var col=E.cy(0.8,0.8,18,8,Ms);col.position.set(-5+i*2,9,-0.5);g.add(col);}
      // Entablature
      var ent=E.bx(14,3,4,Ms);ent.position.set(0,19.5,0);g.add(ent);
      // Attic
      var att=E.bx(12,4,3,new THREE.MeshPhongMaterial({color:0xb8a888,shininess:25}));att.position.y=23;g.add(att);
      // Quadriga (chariot on top — simplified)
      var chariot=E.bx(4,3,2,new THREE.MeshPhongMaterial({color:0xc8a830,shininess:70}));chariot.position.y=26.5;g.add(chariot);
      var horse=E.bx(2,2.5,1,new THREE.MeshPhongMaterial({color:0xc8a830,shininess:70}));horse.position.set(-1,27,2);g.add(horse);
      var lb=E.makeLabel('Brandenburg Gate');lb.position.set(0,32,0);g.add(lb);
      return g;
    },
    TVT:function(){
      var g=new THREE.Group(),E=City3D;
      var Mc=new THREE.MeshPhongMaterial({color:0x909098,shininess:50});
      // Shaft
      var shaft=E.cy(1.5,3,70,8,Mc);shaft.position.y=35;g.add(shaft);
      // Sphere (observation deck)
      var sphere=E.sphr(6,10,new THREE.MeshPhongMaterial({color:0xa0a8b0,shininess:80}));sphere.position.y=55;g.add(sphere);
      // Antenna
      var ant=E.cy(0,0.5,30,4,Mc);ant.position.y=70+15;g.add(ant);
      // Red light at top
      var rl=new THREE.PointLight(0xff2200,1,25);rl.position.set(0,100,0);g.add(rl);
      var lb=E.makeLabel('TV Tower');lb.position.set(0,105,0);g.add(lb);
      return g;
    },
    // Victory Column — tiered plinth, fluted column, gilded statue (Tiergarten park tile)
    VIC:function(){
      var g=new THREE.Group(),E=City3D;
      var Mgold=new THREE.MeshPhongMaterial({color:0xc8a830,shininess:70});
      // Tiered plinth (offset clear of the park path)
      var plinth=E.bx(7,1.6,7,E.M.CONC);plinth.position.set(-3,0.8,0);g.add(plinth);
      var base=E.cy(2.8,3.4,2.4,8,E.M.CONC);base.position.set(-3,2.8,0);g.add(base);
      // Fluted column + capital ring
      var col=E.cy(1.3,2,24,8,E.M.CONC);col.position.set(-3,16,0);g.add(col);
      var ring=E.cy(2.1,2.1,1.2,8,E.M.CONC);ring.position.set(-3,28.4,0);g.add(ring);
      // Gilded Victoria
      var stat=E.sphr(1.7,7,Mgold);stat.position.set(-3,31.2,0);g.add(stat);
      var lb=E.makeLabel('Victory Column');lb.position.set(-3,36,0);g.add(lb);
      return g;
    },
  },
};
