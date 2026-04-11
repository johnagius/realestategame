/* PROPERTY EMPIRE — Berlin: Brandenburg Gate, TV Tower */
var CityDef_Berlin = {
  name:'Berlin', id:'berlin',
  layout:[
    ['CP','CP','CP','CP','CP','CP','CP'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','BRG','RD','TVT','RD','SK'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','PH','RD','VI'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','TH'],
    ['CT','CT','CT','CP','CP','CT','CT'],
  ],
  landmarkNames:{BRG:'🚪 Brandenburg Gate',TVT:'📡 TV Tower'},
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
  },
};
