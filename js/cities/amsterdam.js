/* PROPERTY EMPIRE — Amsterdam: Canal Houses, Windmill */
var CityDef_Amsterdam = {
  name:'Amsterdam', id:'amsterdam',
  layout:[
    ['CP','CP','CT','CT','CT','CP','CP'],
    ['TH','RD','RD','RD','RD','RD','TH'],
    ['CNL','W','W','W','W','W','WML'],
    ['AP','RD','RD','RD','RD','RD','CM'],
    ['RD','RD','SK','RD','MN','RD','RD'],
    ['HO','RD','RD','RD','RD','RD','PH'],
    ['ST','RD','VI','RD','CM','RD','WR'],
    ['CT','CT','CP','CP','CP','CT','CT'],
  ],
  landmarkNames:{CNL:'🏠 Canal Houses',WML:'🌷 Windmill'},
  landmarks:{
    CNL:function(){
      var g=new THREE.Group(),E=City3D;
      // Row of narrow canal houses (Amsterdam style — different colors, gables)
      var colors=[0xb03020,0x2860a0,0x308830,0x885828,0xc07030];
      for(var i=0;i<5;i++){
        var w=4,h=14+Math.sin(i*2.3)*3,d=8;
        var house=E.bx(w,h,d,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}));
        house.position.set(-8+i*4.5,h/2,0);g.add(house);
        // Stepped gable top
        var gable=E.bx(w-1,3,d-2,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}));
        gable.position.set(-8+i*4.5,h+1.5,0);g.add(gable);
        var peak=E.bx(w-2.5,2,d-4,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}));
        peak.position.set(-8+i*4.5,h+3.5,0);g.add(peak);
        // Windows
        E._addWinSimple(g,w,h,d,Math.floor(h/5),1,0);
      }
      var lb=E.makeLabel('Canal Houses');lb.position.set(0,22,0);g.add(lb);
      return g;
    },
    WML:function(){
      var g=new THREE.Group(),E=City3D;
      var Mwood=new THREE.MeshPhongMaterial({color:0x5a3818,shininess:15});
      // Base
      var base=E.cy(5,6,16,8,Mwood);base.position.y=8;g.add(base);
      // Cap (rotating top)
      var cap=E.cy(0,5.5,6,8,new THREE.MeshPhongMaterial({color:0x4a4a48,shininess:20}));
      cap.position.y=16+3;g.add(cap);
      // Blades (4 sails)
      for(var i=0;i<4;i++){
        var a=i*Math.PI/2;
        var blade=E.bx(1.5,18,0.3,new THREE.MeshPhongMaterial({color:0xe8e0d0,shininess:10,side:THREE.DoubleSide}),false);
        blade.position.set(Math.cos(a)*0.5,19+9*Math.cos(a-Math.PI/4),Math.sin(a)*0.5+6);
        blade.rotation.z=a;g.add(blade);
      }
      // Door
      var door=E.bx(2,3,0.3,E.M.WINOFF,false);door.position.set(0,1.5,-6);g.add(door);
      // Tulip garden
      for(var i=0;i<8;i++){
        var tulip=E.sphr(0.6,4,new THREE.MeshPhongMaterial({color:[0xe02040,0xe8d020,0xff6080,0xe05020][i%4],shininess:30}));
        tulip.position.set(-6+i*1.8,0.6,-9);g.add(tulip);
      }
      var lb=E.makeLabel('Windmill');lb.position.set(0,28,0);g.add(lb);
      return g;
    },
  },
};
