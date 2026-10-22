/* PROPERTY EMPIRE — Hong Kong: ICC Tower, Victoria Peak Tram */
var CityDef_HongKong = {
  name:'Hong Kong', id:'hong_kong',

  // Project Skyline profile (SKYLINE-5): dense neon energy — cyan/magenta
  // digital split, rose-magenta dusk horizon, teal harbour. Victorian gets A's
  // warm gas-lit dusk; Digital gets C's neon lamps + darkest mirror water.
  profile: {
    base: { skyline: 0x262840, surroundings: 'hills', // SKYLINE-5: skyline-edge tint + slab kind exposure: 1.08, sunDay: 0xffe8c8, sunDusk: 0xf08ab0,
      ambDay: 0x323c58, ambDusk: 0x1c1a38, hemiSky: 0xbcccf2, hemiGround: 0x3c4048,
      wallJitter: 0.06, sky: ['#101c42', '#3a3a7c', '#c87a9e'], fog: 0x4c4672, haze: 0.19,
      water: { color: 0x14506e, specular: 0xa8ecf4, opacity: 0.9 },
      ground: 0x232733, road: 0x1b1f2a, side: 0x3d4250, park: 0x2a5230,
      trees: 'palm', lamps: 'modern' },
    victorian: { lamps: 'gas', sunDusk: 0xd88a5a, ambDusk: 0x241c2c, haze: 0.27 },
    digital: { lamps: 'neon', sky: ['#060a24', '#1a2a70', '#7e3ab0'], fog: 0x141c46, haze: 0.12,
      sunDusk: 0xe85ec8, water: { color: 0x082a44, specular: 0xdaf6ff, opacity: 0.84 } },
  },

  layout:[
    ['CT','HIL','CT','VPK','CT','HIL','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['SK','RD','ICC','RD','SK','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['CM','RD','MN','RD','VI','RD','CM'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','ST','RD','WR','RD','TH'],
    ['W','HB','HB','W','W','HB','W'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); the ridge keeps its country tile
  landmarkGround: { HIL:'CT' },
  landmarkNames:{ICC:'🏙️ ICC Tower',VPK:'⛰️ Victoria Peak',HIL:'Peak Ridge'},
  landmarks:{
    ICC:function(){
      var g=new THREE.Group(),E=City3D;
      var Mg=new THREE.MeshPhongMaterial({color:0x5878a0,transparent:true,opacity:0.93,shininess:100});
      var Mf=new THREE.MeshPhongMaterial({color:0x80a8d0,shininess:60});
      var sections=[[16,45,14],[13,35,11],[10,25,8],[7,18,6],[4,12,3.5]];
      var y=0;
      sections.forEach(function(s,i){
        var sec=E.bx(s[0],s[1],s[2],Mg);sec.position.y=y+s[1]/2;g.add(sec);
        for(var j=1;j<4;j++){var mu=E.bx(0.25,s[1],0.25,Mf,false);mu.position.set(-s[0]/2+j*(s[0]/4),y+s[1]/2,s[2]/2+0.12);g.add(mu);}
        if(i<3)E._addWinSimple(g,s[0],s[1],s[2],Math.floor(s[1]/7),Math.min(3,Math.floor(s[0]/5)),y);
        y+=s[1];
      });
      var spire=E.cy(0,1,20,4,Mf);spire.position.y=y+10;g.add(spire);
      var lb=E.makeLabel('ICC Tower');lb.position.set(0,y+26,0);g.add(lb);
      return g;
    },
    VPK:function(){
      var g=new THREE.Group(),E=City3D;
      var Mrock=new THREE.MeshPhongMaterial({color:0x5a7848,shininess:15});
      // Mountain
      var mtn=E.cy(0,14,28,6,Mrock);mtn.position.y=14;g.add(mtn);
      // Second layer
      var mtn2=E.sphr(10,6,new THREE.MeshPhongMaterial({color:0x4a6838,shininess:10}));
      mtn2.position.y=18;mtn2.scale.set(1.2,0.7,1.2);g.add(mtn2);
      // Peak tower (viewing platform)
      var tower=E.bx(4,8,4,E.M.CONC);tower.position.y=28+4;g.add(tower);
      var deck=E.bx(8,1,8,E.M.CONC);deck.position.y=28+8.5;g.add(deck);
      // Trees on slopes
      [-6,6,-4,5].forEach(function(tx){
        var t=E.sphr(3,5,E.M.PARKD);t.position.set(tx,12+Math.abs(tx)*0.3,tx*0.5);g.add(t);
      });
      // Tram track (line going up)
      var track=E.bx(0.5,24,0.8,E.M.CONC,false);track.rotation.z=0.6;track.position.set(-8,12,0);g.add(track);
      var lb=E.makeLabel('Victoria Peak');lb.position.set(0,40,0);g.add(lb);
      return g;
    },
    // SKYLINE-5 signature: hillside silhouette ridge behind the grid (backdrop plane)
    HIL:function(){
      var g=new THREE.Group(),E=City3D;
      var Mridge=new THREE.MeshPhongMaterial({color:0x2e4038,shininess:8});
      // Ridge silhouette: two overlapping cones
      var r1=E.cy(0,15,20,6,Mridge);r1.position.set(-3,10,2);g.add(r1);
      var r2=E.cy(0,10,15,6,Mridge);r2.position.set(7,7.5,-3);g.add(r2);
      // Dark tower silhouettes rising off the slope
      [[-6,10,4],[0,14,3],[5,11,5]].forEach(function(t){
        var tw=E.bx(2.2,t[1],2.2,Mridge,false);tw.position.set(t[0],t[1]/2+4,t[2]);g.add(tw);
      });
      var lb=E.makeLabel('Peak Ridge');lb.position.set(0,26,0);g.add(lb);
      return g;
    },
  },
};
