/* PROPERTY EMPIRE — Barcelona: Sagrada Família, Park Güell */
var CityDef_Barcelona = {
  name:'Barcelona', id:'barcelona',
  layout:[
    ['CP','CP','PGU','CT','CT','CP','CP'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','SAG','RD','SK','RD','HO'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['VI','RD','MN','RD','PH','RD','CM'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','WR','RD','TH','RD','AP'],
    ['W','W','HB','W','W','HB','W'],
  ],
  landmarkNames:{SAG:'⛪ Sagrada Família',PGU:'🦎 Park Güell'},
  landmarks:{
    SAG:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xc8b890,shininess:30});
      var Mr=new THREE.MeshPhongMaterial({color:0xa09068,shininess:20});
      // Main body
      var body=E.bx(16,24,12,Ms);body.position.y=12;g.add(body);
      // 6 towers at varying heights (Gaudí's vision)
      var towers=[[-6,-4,38],[-6,4,35],[6,-4,36],[6,4,33],[0,-5,42],[0,5,40]];
      towers.forEach(function(t){
        var tw=E.cy(1.5,2,t[2],8,Ms);tw.position.set(t[0],t[2]/2,t[1]);g.add(tw);
        // Organic spire tops
        var tip=E.cy(0,1.8,6,6,new THREE.MeshPhongMaterial({color:0xd0a840,shininess:60}));
        tip.position.set(t[0],t[2]+3,t[1]);g.add(tip);
        var orb=E.sphr(1.2,6,new THREE.MeshPhongMaterial({color:0xe0c050,emissive:0x302000,shininess:80}));
        orb.position.set(t[0],t[2]+6.5,t[1]);g.add(orb);
      });
      // Central tower (tallest — Jesus tower)
      var central=E.cy(2,2.5,52,8,Ms);central.position.y=26;g.add(central);
      var cross=E.bx(0.5,8,0.5,new THREE.MeshPhongMaterial({color:0xe0c050,shininess:80}));
      cross.position.y=52+4;g.add(cross);
      var crossH=E.bx(4,0.5,0.5,new THREE.MeshPhongMaterial({color:0xe0c050,shininess:80}));
      crossH.position.y=52+6;g.add(crossH);
      // Rose window
      var rose=E.cy(3,3,0.4,10,new THREE.MeshPhongMaterial({color:0x4878a8,emissive:0x102840,shininess:60}));
      rose.rotation.x=Math.PI/2;rose.position.set(0,18,-6.1);g.add(rose);
      var lb=E.makeLabel('Sagrada Família');lb.position.set(0,62,0);g.add(lb);
      return g;
    },
    PGU:function(){
      var g=new THREE.Group(),E=City3D;
      g.add(E.flatPlane(28,28,E.M.PARK));
      // Mosaic bench (serpentine)
      var Mmos=new THREE.MeshPhongMaterial({color:0x2080c0,shininess:60});
      for(var i=0;i<8;i++){
        var bx2=E.bx(3,2,2,new THREE.MeshPhongMaterial({color:[0x2080c0,0xe04020,0xe0c020,0x20a040][i%4],shininess:50}));
        bx2.position.set(-10+i*3,1,8);g.add(bx2);
      }
      // Gingerbread houses
      [-6,6].forEach(function(hx){
        var house=E.bx(5,7,5,new THREE.MeshPhongMaterial({color:0xd0a860,shininess:30}));
        house.position.set(hx,3.5,-5);g.add(house);
        var roof=E.cy(0,4,5,4,new THREE.MeshPhongMaterial({color:0xc05020,shininess:20}));
        roof.position.set(hx,7+2.5,-5);g.add(roof);
        var cross2=E.bx(2,2,0.3,Mmos,false);cross2.position.set(hx,12.5,-5);g.add(cross2);
      });
      // Dragon/lizard fountain
      var dragon=E.bx(2,2,5,Mmos);dragon.position.set(0,1,-1);g.add(dragon);
      // Trees
      [-9,9,-5,5].forEach(function(tx){
        var tr=E.cy(0.3,0.4,4,5,E.M.HOt);tr.position.set(tx,2,tx*0.4);g.add(tr);
        var lv=E.sphr(3.5,5,E.M.PARKD);lv.position.set(tx,5.5,tx*0.4);g.add(lv);
      });
      var lb=E.makeLabel('Park Güell');lb.position.set(0,16,0);g.add(lb);
      return g;
    },
  },
};
