/* PROPERTY EMPIRE — Cape Town: Table Mountain, Bo-Kaap Houses */
var CityDef_CapeTown = {
  name:'Cape Town', id:'cape_town',

  // Project Skyline profile (SKYLINE-5): warm sandstone ground bounce under a
  // bright saturated azure sky; haze stays low — Cape air is clear. Acacia trees.
  // Resolved by City3D._prof: era key > base > ERAS palette.
  profile: {
    base: { exposure: 1.1, sunDay: 0xffedc0, sunDusk: 0xb08498,
      ambDay: 0x3c3a4e, ambDusk: 0x20203a, hemiSky: 0xc8dcff, hemiGround: 0x5a4a34,
      wallJitter: 0.08, water: { color: 0x16608a, specular: 0xaadcee, opacity: 0.9 },
      trees: 'acacia', lamps: 'modern' },
    victorian: { sky: ['#1c2450', '#6a5278', '#f0a05e'], fog: 0x524a66, haze: 0.24, lamps: 'gas',
      sunDusk: 0xe08c54, ambDusk: 0x28202e, ground: 0x332c24, road: 0x282422, side: 0x4c4136, park: 0x37502a },
    gilded:    { sky: ['#202858', '#785a80', '#f8a866'], fog: 0x5c526e, haze: 0.22, lamps: 'gas',
      sunDusk: 0xe08c54, ambDusk: 0x2a2230, ground: 0x352e26, road: 0x2a2624, side: 0x4e4438, park: 0x39562c },
    crisis:    { sky: ['#1c2444', '#4e5c84', '#d4a478'], fog: 0x3e4862, haze: 0.28,
      ground: 0x302f2c, road: 0x252427, side: 0x474442, park: 0x324c2a },
    boom:      { sky: ['#16265a', '#4a62a8', '#fcae60'], fog: 0x3e5080, haze: 0.15,
      ground: 0x33302c, road: 0x282726, side: 0x4e4c48, park: 0x365e2e },
    modern:    { sky: ['#102a5a', '#3f66a8', '#f2a468'], fog: 0x2c4a78, haze: 0.16,
      ground: 0x2f2f30, road: 0x26272a, side: 0x4a4a4c, park: 0x326232 },
    digital:   { sky: ['#081430', '#28407e', '#a85ea8'], fog: 0x1c2e5c, haze: 0.13, lamps: 'neon',
      water: { color: 0x0c3050, specular: 0xd0ecff, opacity: 0.86 },
      ground: 0x23242e, road: 0x1a1c24, side: 0x383a46, park: 0x28522e },
  },

  layout:[
    ['CT','CT','TBM','TBM','TBM','CT','RGE'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['BOK','RD','SK','RD','PH','RD','CM'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','VI','RD','ST'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['CM','RD','WR','RD','TH','RD','AP'],
    ['W','W','HB','HB','HB','W','W'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); the ridge keeps countryside
  landmarkGround: { RGE:'CT' },
  landmarkNames:{TBM:'⛰️ Table Mountain',BOK:'🏠 Bo-Kaap Houses',RGE:'Twelve Apostles Ridge'},
  landmarks:{
    TBM:function(){
      var g=new THREE.Group(),E=City3D;
      var Mr=new THREE.MeshPhongMaterial({color:0x4a5840,shininess:12});
      var Mrock=new THREE.MeshPhongMaterial({color:0x6e6250,shininess:8});
      // Flat-topped mountain
      var base=E.bx(26,18,18,Mr);base.position.y=9;g.add(base);
      // Flat top
      var top=E.bx(22,2,14,new THREE.MeshPhongMaterial({color:0x42503a,shininess:10}));
      top.position.y=18+1;g.add(top);
      // Rocky sides
      [-12,12].forEach(function(sx){
        var cliff=E.bx(4,14,16,Mrock);cliff.position.set(sx,7,0);g.add(cliff);
      });
      // Cable car station
      var station=E.bx(4,3,4,E.M.CONC);station.position.y=19+1.5;g.add(station);
      // Cable line
      var cable=E.bx(0.1,0.1,28,E.M.WINOFF,false);cable.rotation.x=0.6;cable.position.set(0,14,14);g.add(cable);
      // Vegetation
      [-8,0,8].forEach(function(tx){
        var bush=E.sphr(3,5,E.M.PARKD);bush.position.set(tx,19.5,3);g.add(bush);
      });
      var lb=E.makeLabel('Table Mountain');lb.position.set(0,26,0);g.add(lb);
      return g;
    },
    BOK:function(){
      var g=new THREE.Group(),E=City3D;
      // Colorful Bo-Kaap houses — Cape Malay quarter
      var colors=[0x2080d0,0xe04040,0x40b040,0xe0c020,0xd060a0,0xf08020];
      for(var i=0;i<6;i++){
        var h=8+Math.sin(i*1.7)*2;
        var house=E.bx(3.5,h,6,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}));
        house.position.set(-8+i*3.2,h/2,0);g.add(house);
        // Flat roof with parapet
        var par=E.bx(3.7,0.8,6.2,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}),false);
        par.position.set(-8+i*3.2,h+0.4,0);g.add(par);
        // Door
        var door=E.bx(1,2.5,0.2,E.M.WINOFF,false);door.position.set(-8+i*3.2,1.25,-3.1);g.add(door);
        // Window
        E._addWinSimple(g,3.5,h,6,Math.floor(h/4),1,0);
      }
      // Cobblestone street in front
      var street=E.bx(22,0.15,4,E.M.SIDEW);street.position.set(-0.4,0.08,-5);g.add(street);
      var lb=E.makeLabel('Bo-Kaap');lb.position.set(0,14,0);g.add(lb);
      return g;
    },
    // Signature (SKYLINE-5): flat-topped mountain silhouette backdrop
    RGE:function(){
      var g=new THREE.Group(),E=City3D;
      var Msil=new THREE.MeshLambertMaterial({color:0x2e3450});
      // Distant flat-topped ridge, layered dark against the sky
      var ridge=E.bx(30,12,7,Msil);ridge.position.set(0,6,-7);g.add(ridge);
      var cap=E.bx(24,2,8,Msil,false);cap.position.set(0,13,-7);g.add(cap);
      var peak=E.bx(14,16,6,Msil);peak.position.set(-8,8,-8);g.add(peak);
      // Scrub at the foot
      [-6,4,10].forEach(function(tx){
        var bush=E.sphr(1.6,5,E.M.PARKD);bush.position.set(tx,1.1,-1);g.add(bush);
      });
      var lb=E.makeLabel('Twelve Apostles');lb.position.set(0,19,0);g.add(lb);
      return g;
    },
  },
};
