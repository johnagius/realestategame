/* PROPERTY EMPIRE — Los Angeles: Hollywood Sign, Griffith Observatory */
var CityDef_LosAngeles = {
  name:'Los Angeles', id:'los_angeles',

  // Project Skyline profile (SKYLINE-5): dry warm sand ground bounce under a pale
  // sky; the boom era runs smoggy golden dusk (haze up, amber horizon). Palm trees.
  // Resolved by City3D._prof: era key > base > ERAS palette.
  profile: {
    base: { skyline: 0x20273c, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.1, sunDay: 0xffe8b4, sunDusk: 0xb88a80,
      ambDay: 0x3c3838, ambDusk: 0x241e28, hemiSky: 0xd0ccdc, hemiGround: 0x584a34,
      wallJitter: 0.08, water: { color: 0x1c5478, specular: 0xa8d0e8, opacity: 0.9 },
      trees: 'palm', lamps: 'modern' },
    victorian: { sky: ['#242038', '#7a5a62', '#f0a460'], fog: 0x584c58, haze: 0.24, lamps: 'gas',
      sunDusk: 0xe08c58, ambDusk: 0x282028, ground: 0x383026, road: 0x2a2622, side: 0x504638, park: 0x3a5228 },
    gilded:    { sky: ['#282440', '#846268', '#f8ac66'], fog: 0x605460, haze: 0.22, lamps: 'gas',
      sunDusk: 0xe08c58, ambDusk: 0x2a222a, ground: 0x3a3228, road: 0x2c2824, side: 0x524a3a, park: 0x3c582a },
    crisis:    { sky: ['#202038', '#585c74', '#d0a074'], fog: 0x444858, haze: 0.28,
      ground: 0x34322c, road: 0x282624, side: 0x4a463e, park: 0x384e2a },
    boom:      { sky: ['#2a2240', '#a06a58', '#fcb45c'], fog: 0x6a5548, haze: 0.26,
      sunDusk: 0xf09a50, ground: 0x3c362a, road: 0x2e2a24, side: 0x584e3c, park: 0x3e5c2c },
    modern:    { sky: ['#182448', '#5a5c90', '#f2a468'], fog: 0x3c4468, haze: 0.2,
      ground: 0x38362e, road: 0x2a2826, side: 0x524e44, park: 0x3a5e2e },
    digital:   { sky: ['#0c1030', '#34346e', '#a05a9a'], fog: 0x242a58, haze: 0.15, lamps: 'neon',
      water: { color: 0x102a4c, specular: 0xd0e4ff, opacity: 0.86 },
      ground: 0x26242e, road: 0x1c1a22, side: 0x3c3a46, park: 0x2c542c },
  },

  layout:[
    ['CT','CT','HWS','CT','CT','CT','HIL'],
    ['TH','RD','RD','RD','RD','RD','VI'],
    ['CM','RD','SK','RD','GRF','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','SK','RD','AP'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','TH'],
    ['W','W','HB','W','W','HB','W'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); the ridge keeps countryside
  landmarkGround: { HIL:'CT' },
  landmarkNames:{HWS:'Hollywood Sign',GRF:'Griffith Observatory',HIL:'Hollywood Hills'},
  landmarks:{
    HWS:function(){
      var g=new THREE.Group(),E=City3D;
      // Hill
      var hill=E.sphr(12,6,new THREE.MeshPhongMaterial({color:0x6a8838,shininess:8}));
      hill.scale.set(1.2,0.4,1);hill.position.y=4.8;g.add(hill);
      // Letters
      var Mwhite=new THREE.MeshPhongMaterial({color:0xf0f0f0,shininess:40});
      var letters='HOLLYWOOD';
      for(var i=0;i<letters.length;i++){
        var letter=E.bx(2,6,0.5,Mwhite);
        letter.position.set(-10+i*2.5,8,-2);g.add(letter);
      }
      // Trees on hill
      [-8,8,-4,6].forEach(function(tx){
        var t=E.sphr(2.5,4,E.M.PARKD);t.position.set(tx,5,4);g.add(t);
      });
      var lb=E.makeLabel('Hollywood');lb.position.set(0,16,0);g.add(lb);
      return g;
    },
    GRF:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xd8d0c0,shininess:40});
      var Mc=new THREE.MeshPhongMaterial({color:0x607868,shininess:30});
      // Hill base
      var hill=E.sphr(10,6,new THREE.MeshPhongMaterial({color:0x5a7838,shininess:8}));
      hill.scale.set(1.2,0.35,1);hill.position.y=3.5;g.add(hill);
      // Main building
      var body=E.bx(16,6,10,Ms);body.position.set(0,7+3,0);g.add(body);
      // Central dome
      var dome=E.sphr(4,10,Mc);dome.scale.y=0.6;dome.position.y=13+2.4;g.add(dome);
      // Side domes
      [-8,8].forEach(function(dx){
        var sd=E.sphr(2.5,8,Mc);sd.scale.y=0.6;sd.position.set(dx,13+1.5,0);g.add(sd);
      });
      // Telescope slit
      var slit=E.bx(1,3,0.3,E.M.WINOFF,false);slit.position.set(0,14,0);g.add(slit);
      // Warm lighting
      var wl=new THREE.PointLight(0xffddaa,0.8,25);wl.position.set(0,10,0);g.add(wl);
      var lb=E.makeLabel('Griffith Observatory');lb.position.set(0,20,0);g.add(lb);
      return g;
    },
    // Signature (SKYLINE-5): hillside letters sign silhouette against the dusk sky
    HIL:function(){
      var g=new THREE.Group(),E=City3D;
      // Dark hill silhouette
      var hill=E.sphr(13,6,new THREE.MeshLambertMaterial({color:0x3a3438}));
      hill.scale.set(1.2,0.35,0.9);hill.position.y=4.5;g.add(hill);
      // Letter blocks standing on the ridge line
      [-5,0,5].forEach(function(lx){
        var letter=E.bx(2.4,5,0.6,E.M.MNt);letter.position.set(lx,8.6,-3);g.add(letter);
      });
      // Dry scrub on the slope
      [-9,8].forEach(function(tx){
        var bush=E.sphr(1.5,5,E.M.PARKD);bush.position.set(tx,2.4,4);g.add(bush);
      });
      var lb=E.makeLabel('Hollywood Hills');lb.position.set(0,14,0);g.add(lb);
      return g;
    },
  },
};
