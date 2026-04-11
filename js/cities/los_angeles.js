/* PROPERTY EMPIRE — Los Angeles: Hollywood Sign, Griffith Observatory */
var CityDef_LosAngeles = {
  name:'Los Angeles', id:'los_angeles',
  layout:[
    ['CT','CT','HWS','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','VI'],
    ['CM','RD','SK','RD','GRF','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','SK','RD','AP'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','TH'],
    ['W','W','HB','W','W','HB','W'],
  ],
  landmarkNames:{HWS:'🎬 Hollywood Sign',GRF:'🔭 Griffith Observatory'},
  landmarks:{
    HWS:function(){
      var g=new THREE.Group(),E=City3D;
      // Hill
      var hill=E.sphr(12,6,new THREE.MeshPhongMaterial({color:0x6a8838,shininess:8}));
      hill.scale.set(1.2,0.4,1);hill.position.y=4.8;g.add(hill);
      // Letters
      var Mwhite=new THREE.MeshPhongMaterial({color:0xf0f0f0,shininess:40});
      var letters='HOLLYWOOD';
      for(var i=0;i<letters.length;i++){
        var letter=E.bx(2,6,0.5,Mwhite);
        letter.position.set(-10+i*2.5,8,-2);g.add(letter);
      }
      // Trees on hill
      [-8,8,-4,6].forEach(function(tx){
        var t=E.sphr(2.5,4,E.M.PARKD);t.position.set(tx,5,4);g.add(t);
      });
      var lb=E.makeLabel('Hollywood');lb.position.set(0,16,0);g.add(lb);
      return g;
    },
    GRF:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xd8d0c0,shininess:40});
      var Mc=new THREE.MeshPhongMaterial({color:0x607868,shininess:30});
      // Hill base
      var hill=E.sphr(10,6,new THREE.MeshPhongMaterial({color:0x5a7838,shininess:8}));
      hill.scale.set(1.2,0.35,1);hill.position.y=3.5;g.add(hill);
      // Main building
      var body=E.bx(16,6,10,Ms);body.position.set(0,7+3,0);g.add(body);
      // Central dome
      var dome=E.sphr(4,10,Mc);dome.scale.y=0.6;dome.position.y=13+2.4;g.add(dome);
      // Side domes
      [-8,8].forEach(function(dx){
        var sd=E.sphr(2.5,8,Mc);sd.scale.y=0.6;sd.position.set(dx,13+1.5,0);g.add(sd);
      });
      // Telescope slit
      var slit=E.bx(1,3,0.3,E.M.WINOFF,false);slit.position.set(0,14,0);g.add(slit);
      // Warm lighting
      var wl=new THREE.PointLight(0xffddaa,0.8,25);wl.position.set(0,10,0);g.add(wl);
      var lb=E.makeLabel('Griffith Observatory');lb.position.set(0,20,0);g.add(lb);
      return g;
    },
  },
};
