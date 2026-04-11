/* PROPERTY EMPIRE — Singapore: Marina Bay Sands, Merlion */
var CityDef_Singapore = {
  name:'Singapore', id:'singapore',
  layout:[
    ['CP','CP','CT','CT','CT','CP','CP'],
    ['SK','RD','RD','RD','RD','RD','PH'],
    ['RD','RD','MBS','RD','SK','RD','RD'],
    ['AP','RD','RD','RD','RD','RD','CM'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['TH','RD','MN','RD','VI','RD','HO'],
    ['W','W','MRL','W','W','HB','W'],
    ['W','W','W','W','W','W','W'],
  ],
  landmarkNames:{MBS:'🏨 Marina Bay Sands',MRL:'🦁 Merlion'},
  landmarks:{
    MBS:function(){
      var g=new THREE.Group(),E=City3D;
      var Mgold=new THREE.MeshPhongMaterial({color:0xc8a858,shininess:70});
      var Mglass=new THREE.MeshPhongMaterial({color:0x6898b8,transparent:true,opacity:0.92,shininess:90});
      // Three towers
      [-8,0,8].forEach(function(tx){
        var tower=E.bx(5,55,5,Mglass);tower.position.set(tx,27.5,0);g.add(tower);
        E._addWinSimple(g,5,55,5,Math.floor(55/7),1,0);
        // Slight lean outward
        if(tx!==0){var lean=E.bx(5,55,5,Mglass);lean.position.set(tx*1.08,27.5,0);lean.visible=false;}
      });
      // Sky park (the boat on top)
      var park=E.bx(28,2,8,Mgold);park.position.y=56;g.add(park);
      // Cantilever extension
      var cant=E.bx(6,1.5,8,Mgold);cant.position.set(14,56,0);g.add(cant);
      // Pool on top (blue)
      var pool=E.bx(22,0.5,4,new THREE.MeshPhongMaterial({color:0x2080c0,shininess:100}));
      pool.position.set(2,57.3,0);g.add(pool);
      // Trees on sky park
      [-8,-2,4,10].forEach(function(tx2){
        var t=E.sphr(1.8,5,E.M.PARKD);t.position.set(tx2,58.5,3);g.add(t);
      });
      var lb=E.makeLabel('Marina Bay Sands');lb.position.set(0,65,0);g.add(lb);
      return g;
    },
    MRL:function(){
      var g=new THREE.Group(),E=City3D;
      var Mstone=new THREE.MeshPhongMaterial({color:0xc8c0b0,shininess:40});
      g.add(E.flatPlane(28,28,E.M.WATER));
      // Pedestal
      var ped=E.bx(6,4,6,E.M.CONC);ped.position.y=2;g.add(ped);
      // Body
      var body=E.cy(2.5,3.5,14,8,Mstone);body.position.y=4+7;g.add(body);
      // Head (lion)
      var head=E.sphr(3.5,7,Mstone);head.position.y=18+3.5;g.add(head);
      // Mane
      var mane=E.sphr(4,6,new THREE.MeshPhongMaterial({color:0xa89870,shininess:20}));
      mane.position.y=18+3;g.add(mane);
      // Water spout (emissive blue)
      var spout=E.cy(0.8,0.3,8,6,new THREE.MeshPhongMaterial({color:0x3090e0,emissive:0x1050a0,transparent:true,opacity:0.7}));
      spout.rotation.x=Math.PI/4;spout.position.set(0,18,-5);g.add(spout);
      var wl=new THREE.PointLight(0x3090e0,1.2,25);wl.position.set(0,16,-6);g.add(wl);
      var lb=E.makeLabel('Merlion');lb.position.set(0,28,0);g.add(lb);
      return g;
    },
  },
};
