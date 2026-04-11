/* PROPERTY EMPIRE — Rome: Colosseum, St. Peter's Basilica */
var CityDef_Rome = {
  name:'Rome', id:'rome',
  layout:[
    ['CP','CP','CP','CT','CT','CP','CP'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','COL','RD','PH','RD','SK'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','SPB','RD','VI'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','TH','RD','WR'],
    ['CT','CT','CT','CT','CT','CT','CT'],
  ],
  landmarkNames:{COL:'🏛️ Colosseum',SPB:'⛪ St. Peter\'s'},
  landmarks:{
    COL:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xc8b890,shininess:25});
      var Md=new THREE.MeshPhongMaterial({color:0xa89868,shininess:20});
      // Elliptical base (outer wall) — approximated with cylinder
      var outer=E.cy(12,12,20,16,Ms);outer.position.y=10;g.add(outer);
      // Inner cavity (dark center — the arena floor)
      var inner=E.cy(8,8,18,16,new THREE.MeshPhongMaterial({color:0xd0c4a0,shininess:10}));
      inner.position.y=9;g.add(inner);
      // Arena floor
      var floor=E.cy(7,7,1,16,new THREE.MeshPhongMaterial({color:0xc8a868,shininess:5}));
      floor.position.y=1;g.add(floor);
      // Arch openings (dark bands around exterior)
      for(var i=0;i<3;i++){
        var band=E.cy(12.3,12.3,1.5,16,Md);band.position.y=4+i*6;
        g.add(band);
      }
      // Broken section (the famous missing quarter)
      var broken=E.bx(8,12,6,Ms);broken.position.set(8,6,6);
      // Don't add — leave a gap by not filling that section
      // Warm lighting
      var wl=new THREE.PointLight(0xffcc88,1,35);wl.position.set(0,8,0);g.add(wl);
      var lb=E.makeLabel('Colosseum');lb.position.set(0,26,0);g.add(lb);
      return g;
    },
    SPB:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xe0d8c8,shininess:35});
      var Mr=new THREE.MeshPhongMaterial({color:0x5a7a6a,shininess:25,side:THREE.DoubleSide});
      // Main basilica body
      var body=E.bx(20,20,16,Ms);body.position.y=10;g.add(body);
      // Grand dome (Michelangelo's)
      var dome=E.sphr(8,12,Mr);dome.scale.set(1,0.7,1);dome.position.y=20+5.6;g.add(dome);
      // Lantern on dome
      var lant=E.cy(2,2,5,8,Ms);lant.position.y=26+2.5;g.add(lant);
      var cross=E.bx(0.4,4,0.4,new THREE.MeshPhongMaterial({color:0xd0a830,shininess:80}));
      cross.position.y=31+2;g.add(cross);
      var crossH=E.bx(2,0.4,0.4,new THREE.MeshPhongMaterial({color:0xd0a830,shininess:80}));
      crossH.position.y=31+3;g.add(crossH);
      // Facade columns
      for(var i=0;i<6;i++){
        var col=E.cy(0.6,0.6,16,8,Ms);col.position.set(-8+i*3.2,8,-8.2);g.add(col);
      }
      // Pediment
      var ped=E.bx(20,3,2,Ms);ped.position.set(0,18,-8);g.add(ped);
      // Bernini's colonnade (curved arms)
      [-14,14].forEach(function(cx){
        for(var j=0;j<5;j++){
          var c=E.cy(0.4,0.4,10,6,Ms);c.position.set(cx,5,-12+j*3);g.add(c);
        }
      });
      var lb=E.makeLabel("St. Peter's");lb.position.set(0,38,0);g.add(lb);
      return g;
    },
  },
};
