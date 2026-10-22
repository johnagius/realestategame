/* PROPERTY EMPIRE — São Paulo: Paulista Avenue, Ibirapuera */
var CityDef_SaoPaulo = {
  name:'São Paulo', id:'sao_paulo',

  // Project Skyline profile (SKYLINE-5): tropical warm, saturated greens — humid
  // haze, amber sun, blue-green water, lush palm parks. Resolved by City3D._prof:
  // era key > base > ERAS palette. Victorian/Gilded get gas lamps + warmed dusk,
  // Digital gets neon lamps + dark mirror water.
  profile:{
    base:{ skyline: 0x1b2836, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure:1.08, sunDay:0xffdc9e, sunDusk:0xd88a5e,
      ambDay:0x3a4034, ambDusk:0x201c2a, hemiSky:0xc4dcc0, hemiGround:0x4a4634,
      wallJitter:0.09, water:{ color:0x1a6a74, specular:0xa8e0d4, opacity:0.9 },
      trees:'palm', lamps:'modern' },
    victorian:{ sky:['#242048','#7a5a58','#f0b26c'], fog:0x5c4a50, haze:0.3, lamps:'gas',
      sunDusk:0xe89a58, ambDusk:0x2a2028, ground:0x2e2a22, road:0x26221f, side:0x4a4038, park:0x2e5626 },
    gilded:{ sky:['#20244c','#7a5e64','#f4b878'], fog:0x584e58, haze:0.26, lamps:'gas',
      sunDusk:0xe89a58, ambDusk:0x28222c, ground:0x302c26, road:0x282422, side:0x4e443c, park:0x305c28 },
    crisis:{ sky:['#1a2038','#4e5a6e','#d8a878'], fog:0x40484e, haze:0.32,
      ground:0x2c2b28, road:0x232323, side:0x44423e, park:0x2c5028 },
    boom:{ sky:['#182a4e','#5a6a8a','#f8b06a'], fog:0x46526a, haze:0.2,
      ground:0x2d2d28, road:0x252524, side:0x4a4842, park:0x2f662c },
    modern:{ sky:['#142c4c','#3f6a8c','#f2b26e'], fog:0x2e4658, haze:0.24,
      ground:0x2a2b28, road:0x222322, side:0x464640, park:0x2d602e },
    digital:{ sky:['#0a1434','#20487a','#c05a8e'], fog:0x1c3050, haze:0.18, lamps:'neon',
      water:{ color:0x0e3a44, specular:0xd0f4ea, opacity:0.86 },
      ground:0x20241f, road:0x181a18, side:0x363a34, park:0x245428 },
  },

  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['SK','RD','SK','RD','PAV','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['CM','RD','MN','RD','SK','RD','HO'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['VI','RD','ST','RD','CM','RD','WR'],
    ['CP','CP','IBP','MUR','CP','CT','CT'],
  ],
  landmarkNames:{PAV:'🏙️ Paulista Towers',IBP:'🌳 Ibirapuera Park',MUR:'Mural Terrace Wall'},
  landmarks:{
    PAV:function(){
      var g=new THREE.Group(),E=City3D;
      var Mg=new THREE.MeshPhongMaterial({color:0x6888a8,transparent:true,opacity:0.92,shininess:90});
      // MASP-inspired: building on red stilts
      var stilts=new THREE.MeshPhongMaterial({color:0xc03020,shininess:50});
      [-6,6].forEach(function(sx){
        var s=E.bx(2,16,2,stilts);s.position.set(sx,8,0);g.add(s);
      });
      var body=E.bx(18,10,12,Mg);body.position.y=16+5;g.add(body);
      E._addWinSimple(g,18,10,12,2,3,16);
      // Adjacent towers
      [-12,12].forEach(function(tx){
        var t=E.bx(6,35+Math.abs(tx),5,Mg);t.position.set(tx,(35+Math.abs(tx))/2,0);g.add(t);
        E._addWinSimple(g,6,35+Math.abs(tx),5,Math.floor((35+Math.abs(tx))/8),1,0);
      });
      var lb=E.makeLabel('Paulista Avenue');lb.position.set(0,52,0);g.add(lb);
      return g;
    },
    IBP:function(){
      var g=new THREE.Group(),E=City3D;
      g.add(E.flatPlane(28,28,E.M.PARK));
      // Ibirapuera auditorium (white wedge)
      var aud=E.bx(10,6,8,new THREE.MeshPhongMaterial({color:0xf0ece0,shininess:50}));
      aud.position.set(-4,3,0);g.add(aud);
      var awning=E.bx(14,0.5,12,new THREE.MeshPhongMaterial({color:0xf0ece0,shininess:50}));
      awning.position.set(-4,6.5,0);g.add(awning);
      // Lake
      var lake=E.cy(5,5,0.5,12,E.M.WATER);lake.position.set(6,0.25,4);g.add(lake);
      // Trees scattered
      [[-8,-8],[8,-6],[-6,6],[4,-4],[-3,8],[9,2]].forEach(function(p){
        var tr=E.cy(0.3,0.4,5,5,E.M.HOt);tr.position.set(p[0],2.5,p[1]);g.add(tr);
        var lv=E.sphr(3.5,5,E.M.PARKD);lv.position.set(p[0],6.5,p[1]);g.add(lv);
      });
      // Paths
      var path=E.bx(24,0.15,2.5,E.M.SIDEW);path.position.set(0,0.08,0);g.add(path);
      var lb=E.makeLabel('Ibirapuera Park');lb.position.set(0,12,0);g.add(lb);
      return g;
    },
    // SKYLINE-5 signature: colourful mural terrace wall on the park edge
    // (Beco do Batman street-art colours) — 7 meshes, ~90 tris.
    MUR:function(){
      var g=new THREE.Group(),E=City3D;
      var panels=[0xe8c028,0xd04828,0x2a88c8,0x38a048,0xe080a8];
      var foot=E.bx(26,1,4,E.M.SIDEW);foot.position.y=0.5;g.add(foot);
      for(var i=0;i<5;i++){
        var p=E.bx(4.8,6.5,1.2,new THREE.MeshPhongMaterial({color:panels[i],shininess:25}));
        p.position.set(-9.6+i*4.8,1+3.25,0);g.add(p);
      }
      var cap=E.bx(26,0.8,2,E.M.CONC);cap.position.set(0,7.9,0);g.add(cap);
      var lb=E.makeLabel('Mural Terrace');lb.position.set(0,12,0);g.add(lb);
      return g;
    },
  },
};
