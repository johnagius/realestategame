/* PROPERTY EMPIRE — Cape Town: Table Mountain, Bo-Kaap Houses */
var CityDef_CapeTown = {
  name:'Cape Town', id:'cape_town',
  layout:[
    ['CT','CT','TBM','TBM','TBM','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['BOK','RD','SK','RD','PH','RD','CM'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','VI','RD','ST'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['CM','RD','WR','RD','TH','RD','AP'],
    ['W','W','HB','HB','HB','W','W'],
  ],
  landmarkNames:{TBM:'⛰️ Table Mountain',BOK:'🏠 Bo-Kaap Houses'},
  landmarks:{
    TBM:function(){
      var g=new THREE.Group(),E=City3D;
      var Mr=new THREE.MeshPhongMaterial({color:0x6a7858,shininess:12});
      var Mrock=new THREE.MeshPhongMaterial({color:0x8a7e68,shininess:8});
      // Flat-topped mountain
      var base=E.bx(26,18,18,Mr);base.position.y=9;g.add(base);
      // Flat top
      var top=E.bx(22,2,14,new THREE.MeshPhongMaterial({color:0x5a6848,shininess:10}));
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
  },
};
