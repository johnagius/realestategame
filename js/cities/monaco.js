/* PROPERTY EMPIRE — Monaco: Casino, Grand Prix Circuit */
var CityDef_Monaco = {
  name:'Monaco', id:'monaco',
  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['MN','RD','RD','RD','RD','RD','PH'],
    ['RD','RD','CAS','RD','SK','RD','RD'],
    ['VI','RD','RD','RD','RD','RD','AP'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['CM','RD','TH','RD','HO','RD','ST'],
    ['W','W','HB','YHT','HB','W','W'],
    ['W','W','W','W','W','W','W'],
  ],
  landmarkNames:{CAS:'🎰 Monte Carlo Casino',YHT:'🛥️ Yacht Harbor'},
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
      g.add(E.flatPlane(28,28,E.M.HARBOR));
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
  },
};
