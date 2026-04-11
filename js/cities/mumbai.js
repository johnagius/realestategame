/* PROPERTY EMPIRE — Mumbai: Gateway of India, Taj Mahal Palace */
var CityDef_Mumbai = {
  name:'Mumbai', id:'mumbai',
  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','SK','RD','PH','RD','HO'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['MN','RD','TAJ','RD','VI','RD','CM'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','WR','RD','TH','RD','AP'],
    ['W','W','GWI','HB','HB','W','W'],
  ],
  landmarkNames:{GWI:'🕌 Gateway of India',TAJ:'🏨 Taj Palace Hotel'},
  landmarks:{
    GWI:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xc8b080,shininess:35});
      g.add(E.flatPlane(28,28,E.M.HARBOR));
      // Main arch
      var base=E.bx(16,4,10,Ms);base.position.y=2;g.add(base);
      var body=E.bx(14,18,8,Ms);body.position.y=4+9;g.add(body);
      // Central arch (dark opening)
      var arch=E.bx(6,12,0.5,E.M.WINOFF,false);arch.position.set(0,8,-4.3);g.add(arch);
      var arch2=E.bx(6,12,0.5,E.M.WINOFF,false);arch2.position.set(0,8,4.3);g.add(arch2);
      // 4 turrets
      [[-7,-4],[-7,4],[7,-4],[7,4]].forEach(function(p){
        var t=E.cy(1.5,1.5,24,8,Ms);t.position.set(p[0],12,p[1]);g.add(t);
        var dome=E.sphr(2,6,Ms);dome.position.set(p[0],24+2,p[1]);g.add(dome);
      });
      // Main dome
      var dome=E.sphr(4,8,new THREE.MeshPhongMaterial({color:0xb8a070,shininess:30}));
      dome.scale.y=0.6;dome.position.y=22+2.4;g.add(dome);
      var lb=E.makeLabel('Gateway of India');lb.position.set(0,30,0);g.add(lb);
      return g;
    },
    TAJ:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xe0d4b8,shininess:40});
      var Mr=new THREE.MeshPhongMaterial({color:0xc03028,shininess:25,side:THREE.DoubleSide});
      // Main building
      var body=E.bx(22,20,14,Ms);body.position.y=10;g.add(body);
      // Red dome
      var dome=E.sphr(7,10,Mr);dome.scale.y=0.65;dome.position.y=20+4.5;g.add(dome);
      // Wings
      [-14,14].forEach(function(wx){
        var wing=E.bx(8,16,12,Ms);wing.position.set(wx,8,0);g.add(wing);
        var wd=E.sphr(4,8,Mr);wd.scale.y=0.5;wd.position.set(wx,16+2,0);g.add(wd);
      });
      // Corner turrets
      [[-11,-7],[11,-7],[-11,7],[11,7]].forEach(function(p){
        var t=E.cy(1.2,1.2,22,6,Ms);t.position.set(p[0],11,p[1]);g.add(t);
        var td=E.sphr(1.8,6,Mr);td.position.set(p[0],22+1.8,p[1]);g.add(td);
      });
      E._addWinSimple(g,22,20,14,3,4,0);
      var lb=E.makeLabel('Taj Palace Hotel');lb.position.set(0,30,0);g.add(lb);
      return g;
    },
  },
};
