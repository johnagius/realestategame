/* PROPERTY EMPIRE — Rome: Colosseum, St. Peter's Basilica */
var CityDef_Rome = {
  name:'Rome', id:'rome',
  // Project Skyline art direction (SKYLINE-5): terracotta + ochre walls under a warm
  // golden sun, umbrella pines (acacia). Era key > base > ERAS (City3D._prof);
  // Victorian/Gilded gas-lit warm dusk, Digital neon + dark mirror water
  // (docs/SKYLINE.md §2, direction B).
  profile:{
    base:{ skyline: 0x2b2830, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure:1.1, sunDay:0xffd998, sunDusk:0xdf9a5c,
      ambDay:0x3a3346, ambDusk:0x221c2e, hemiSky:0xd4c8ea, hemiGround:0x4a3c30,
      wallJitter:0.08, water:{color:0x2a5e66,specular:0xb8dcd8,opacity:0.88},
      sky:['#1a1a3e','#7a567a','#f2a45c'], fog:0x584648, haze:0.15,
      ground:0x2e2a23, road:0x27221e, side:0x4d453a, park:0x33512a,
      trees:'acacia', lamps:'modern' },
    victorian:{ sky:['#1c1838','#7a4e62','#f0a05e'], fog:0x563f4c, haze:0.22, lamps:'gas',
      sunDusk:0xe09652, ambDusk:0x281e28 },
    gilded:{ lamps:'gas', sunDusk:0xe09652 },
    digital:{ sky:['#0c1030','#332e6e','#7a4a9a'], fog:0x201c44, haze:0.12, lamps:'neon',
      water:{color:0x14283c,specular:0xd8e8f0,opacity:0.85} },
  },
  layout:[
    ['CP','CP','AQD','CT','CT','CP','CP'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','COL','RD','PH','RD','SK'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','SPB','RD','VI'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','TH','RD','WR'],
    ['CT','CT','CT','CT','CT','CT','CT'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); the ruin keeps its park
  landmarkGround:{AQD:'CP'},
  landmarkNames:{COL:'Colosseum',SPB:'St. Peter\'s',AQD:'Aqueduct Ruin'},
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
    // Aqueduct ruin — three standing arches, one fallen span (park edge)
    AQD:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xc4ac84,shininess:20});
      // Standing piers + one broken stump
      [-7.5,-2.5,2.5].forEach(function(px){
        var pier=E.bx(2.4,9,2.4,Ms);pier.position.set(px,4.5,0);g.add(pier);
      });
      var stump=E.bx(2.4,4,2.4,Ms);stump.position.set(7.5,2,0);g.add(stump);
      // Two surviving arch lintels; the third span has fallen
      [-5,0].forEach(function(ax){
        var arch=E.bx(7.4,1.8,2.2,Ms);arch.position.set(ax,9.9,0);g.add(arch);
      });
      // Fallen block
      var fall=E.bx(2.2,1.6,2,Ms);fall.rotation.y=0.5;fall.position.set(7.6,0.8,3.4);g.add(fall);
      var lb=E.makeLabel('Aqueduct Ruin');lb.position.set(0,14,0);g.add(lb);
      return g;
    },
  },
};
