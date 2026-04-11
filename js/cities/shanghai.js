/* PROPERTY EMPIRE — Shanghai: Oriental Pearl Tower, The Bund */
var CityDef_Shanghai = {
  name:'Shanghai', id:'shanghai',
  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['AP','RD','RD','RD','RD','RD','SK'],
    ['RD','RD','OPT','RD','SK','RD','RD'],
    ['CM','RD','RD','RD','RD','RD','PH'],
    ['W','W','W','W','W','W','W'],
    ['BND','RD','RD','RD','RD','RD','MN'],
    ['TH','RD','VI','RD','HO','RD','CM'],
    ['CT','CT','CP','CP','CP','CT','CT'],
  ],
  landmarkNames:{OPT:'🏯 Oriental Pearl Tower',BND:'🏛️ The Bund'},
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
  },
};
