/* PROPERTY EMPIRE — Monaco: Casino, Grand Prix Circuit */
var CityDef_Monaco = {
  name:'Monaco', id:'monaco',

  // Project Skyline profile (SKYLINE-5): luxury marina — white + azur, bright
  // saturated water (R6 pastel-against-water), palms. Victorian gets A's warm
  // gas-lit dusk; Digital gets C's neon lamps + darkest mirror water.
  profile: {
    base: { skyline: 0x2d3d51, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.09, sunDay: 0xfff2da, sunDusk: 0xffb784,
      ambDay: 0x3a4c68, ambDusk: 0x1c2642, hemiSky: 0xcfe6ff, hemiGround: 0x4c5a4e,
      wallJitter: 0.08, sky: ['#14305e', '#3f7ec2', '#cfeaf2'], fog: 0x5e7e9e, haze: 0.13,
      water: { color: 0x1f8fc0, specular: 0xd8f6ff, opacity: 0.88 },
      ground: 0x34383e, road: 0x2a2e34, side: 0x7e7e78, park: 0x3e6a3a,
      trees: 'palm', lamps: 'modern' },
    victorian: { lamps: 'gas', sunDusk: 0xff9a58, ambDusk: 0x2a2238, haze: 0.21 },
    digital: { lamps: 'neon', water: { color: 0x0c4a66, specular: 0xeafdff, opacity: 0.85 } },
  },

  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['MN','RD','RD','RD','RD','RD','PH'],
    ['RD','RD','CAS','RD','SK','RD','RD'],
    ['VI','RD','RD','RD','RD','RD','AP'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['CM','RD','TH','RD','HO','RD','ST'],
    ['W','W','YMC','YHT','HB','W','W'],
    ['W','W','W','W','W','W','W'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); water landmarks keep their water
  landmarkGround: { YHT:'HB', YMC:'HB' },
  landmarkNames:{CAS:'Monte Carlo Casino',YHT:'Yacht Harbor',YMC:'Yacht Marina'},
  landmarks:{
    CAS:function(){
      var g=new THREE.Group(),E=City3D;
      var Mcream=new THREE.MeshPhongMaterial({color:0xe8dcc0,shininess:50});
      var Mgold=new THREE.MeshPhongMaterial({color:0xc8a030,shininess:80});
      var Mroof=new THREE.MeshPhongMaterial({color:0x3a6a4a,shininess:25,side:THREE.DoubleSide});
      // Main building
      var body=E.bx(22,16,14,Mcream);body.position.y=8;g.add(body);
      // Mansard roof
      var roof=E.hipRoof(22,6,14,Mroof);roof.position.y=16;g.add(roof);
      // Central tower/dome
      var dome=E.sphr(5,10,Mroof);dome.scale.set(1,0.6,1);dome.position.y=22+3;g.add(dome);
      var lantern=E.cy(1,1,4,6,Mcream);lantern.position.y=25+2;g.add(lantern);
      // Wings
      [-14,14].forEach(function(wx){
        var wing=E.bx(8,12,10,Mcream);wing.position.set(wx,6,0);g.add(wing);
        var wr=E.hipRoof(8,4,10,Mroof);wr.position.set(wx,12,0);g.add(wr);
      });
      // Gold trim
      var trim=E.bx(24,0.8,14.5,Mgold,false);trim.position.y=16;g.add(trim);
      // Entrance columns
      for(var i=0;i<4;i++){var col=E.cy(0.5,0.5,12,8,Mcream);col.position.set(-3+i*2,6,-7.2);g.add(col);}
      // Awning
      var awn=E.bx(10,0.5,4,new THREE.MeshPhongMaterial({color:0xa02020,shininess:30}));awn.position.set(0,10,-9);g.add(awn);
      var lb=E.makeLabel('Monte Carlo Casino');lb.position.set(0,32,0);g.add(lb);
      return g;
    },
    YHT:function(){
      var g=new THREE.Group(),E=City3D;
      var wb=E.flatPlane(28,28,E.M.HARBOR);wb.position.y=-0.3;g.add(wb);
      // Dock/pier
      var pier=E.bx(22,1.5,4,E.M.CONC);pier.position.set(0,0.75,-8);g.add(pier);
      // Yachts (3)
      [-7,0,7].forEach(function(yx,i){
        var hull=E.bx(3+i,1.5,8+i*2,new THREE.MeshPhongMaterial({color:0xf0f0f0,shininess:80}));
        hull.position.set(yx,1,2);g.add(hull);
        var cabin=E.bx(2+i*0.5,2,4+i,new THREE.MeshPhongMaterial({color:0xe0e0e8,shininess:60}));
        cabin.position.set(yx,2.5,2);g.add(cabin);
        var mast=E.cy(0.15,0.15,6+i,4,E.M.CONC);mast.position.set(yx,4+i*0.5,2);g.add(mast);
      });
      // Water lights
      var wl=new THREE.PointLight(0x3080c0,0.6,20);wl.position.set(0,2,0);g.add(wl);
      var lb=E.makeLabel('Yacht Harbor');lb.position.set(0,12,0);g.add(lb);
      return g;
    },
    // SKYLINE-5 signature: yacht-mast cluster — a dense mast forest on the marina
    YMC:function(){
      var g=new THREE.Group(),E=City3D;
      var wb=E.flatPlane(28,28,E.M.HARBOR);wb.position.y=-0.3;g.add(wb);
      // White hulls (shared mansion-trim white)
      var h1=E.bx(3,1.2,9,E.M.MNt);h1.position.set(-5,0.6,3);g.add(h1);
      var h2=E.bx(3.5,1.3,10,E.M.MNt);h2.position.set(5,0.65,-2);g.add(h2);
      // Mast forest (shared flagpole material)
      [[-8,-4,15],[-2,3,18],[4,-6,14],[9,2,16]].forEach(function(m){
        var mast=E.cy(0.1,0.16,m[2],4,E.M.FLAGPOLE);mast.position.set(m[0],m[2]/2,m[1]);g.add(mast);
      });
      var lb=E.makeLabel('Yacht Marina');lb.position.set(0,22,0);g.add(lb);
      return g;
    },
  },
};
