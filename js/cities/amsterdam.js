/* PROPERTY EMPIRE — Amsterdam: Canal Houses, Windmill */
var CityDef_Amsterdam = {
  name:'Amsterdam', id:'amsterdam',
  // Project Skyline art direction (SKYLINE-5): canal-blue water dominant, gabled-house
  // brick tint variance, plane trees. Era key > base > ERAS (City3D._prof); Victorian/Gilded
  // gas-lit warm dusk, Digital neon + dark mirror canals (docs/SKYLINE.md §2, direction B).
  profile:{
    base:{ skyline: 0x242a39, surroundings: 'flat', // SKYLINE-5: skyline-edge tint + slab kind exposure:1.07, sunDay:0xffe2b2, sunDusk:0x96a6d6,
      ambDay:0x323c4e, ambDusk:0x1a2236, hemiSky:0xb6d0f0, hemiGround:0x3c4640,
      wallJitter:0.08, water:{color:0x1d6a8c,specular:0xa8dcf0,opacity:0.9},
      sky:['#121c40','#46587e','#e0a172'], fog:0x464c60, haze:0.2,
      ground:0x27272b, road:0x222327, side:0x40424a, park:0x2d4e2a,
      trees:'plane', lamps:'modern' },
    victorian:{ sky:['#1a1a3c','#6a5266','#e89c64'], fog:0x4c4256, haze:0.27, lamps:'gas',
      sunDusk:0xd88e56, ambDusk:0x24202e },
    gilded:{ lamps:'gas', sunDusk:0xd88e56 },
    digital:{ sky:['#081026','#1f3670','#3f5aa8'], fog:0x16244a, haze:0.14, lamps:'neon',
      water:{color:0x0e2f42,specular:0xd0f0ff,opacity:0.87} },
  },
  layout:[
    ['CP','CP','CT','CT','CT','CP','CP'],
    ['TH','RD','RD','RD','RD','RD','TH'],
    ['W','W','W','WFA','W','CNL','WML'],
    ['AP','RD','RD','RD','RD','RD','CM'],
    ['RD','RD','SK','RD','MN','RD','RD'],
    ['HO','RD','RD','RD','RD','RD','PH'],
    ['ST','RD','VI','RD','CM','RD','WR'],
    ['CT','CT','CP','CP','CP','CT','CT'],
  ],
  // Terrain tile drawn under a landmark (default 'LOT'); canal-row landmarks keep their water
  landmarkGround:{WFA:'W',CNL:'W',WML:'W'},
  landmarkNames:{CNL:'Canal Houses',WML:'Windmill',WFA:'Waterfront Arcade'},
  landmarks:{
    CNL:function(){
      var g=new THREE.Group(),E=City3D;
      var Mstone=new THREE.MeshPhongMaterial({color:0xb8a888,shininess:25});
      // Water base (canal tile keeps its water, aligned with terrain water at y=-0.3)
      var wb=E.flatPlane(28,28,E.M.WATER);wb.position.y=-0.3;g.add(wb);
      // Stone quay podium the canal houses stand on, fronting the water
      var quay=E.bx(26,1.6,13,Mstone);quay.position.set(0,0.8,2.5);g.add(quay);
      // Row of narrow canal houses (Amsterdam style — different colors, gables)
      var row=new THREE.Group();row.position.set(0,1.6,2);g.add(row);
      var colors=[0xb03020,0x2860a0,0x308830,0x885828,0xc07030];
      for(var i=0;i<5;i++){
        var w=4,h=14+Math.sin(i*2.3)*3,d=8;
        var house=E.bx(w,h,d,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}));
        house.position.set(-8+i*4.5,h/2,0);row.add(house);
        // Stepped gable top
        var gable=E.bx(w-1,3,d-2,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}));
        gable.position.set(-8+i*4.5,h+1.5,0);row.add(gable);
        var peak=E.bx(w-2.5,2,d-4,new THREE.MeshPhongMaterial({color:colors[i],shininess:30}));
        peak.position.set(-8+i*4.5,h+3.5,0);row.add(peak);
        // Windows
        E._addWinSimple(row,w,h,d,Math.floor(h/5),1,0);
      }
      var lb=E.makeLabel('Canal Houses');lb.position.set(0,22,0);g.add(lb);
      return g;
    },
    WML:function(){
      var g=new THREE.Group(),E=City3D;
      var Mwood=new THREE.MeshPhongMaterial({color:0x5a3818,shininess:15});
      var Mstone=new THREE.MeshPhongMaterial({color:0x9a9284,shininess:20});
      // Water base (canal tile keeps its water, aligned with terrain water at y=-0.3)
      var wb=E.flatPlane(28,28,E.M.WATER);wb.position.y=-0.3;g.add(wb);
      // Small round dyke island the mill stands on
      var isl=E.cy(10.5,11.5,1.6,12,Mstone);isl.position.y=0.5;g.add(isl);
      var grass=E.cy(9.6,10.2,0.7,12,E.M.PARK);grass.position.y=1.55;g.add(grass);
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
      var door=E.bx(2,3,0.3,E.M.WINOFF,false);door.position.set(0,2.9,-5.6);g.add(door);
      // Tulip garden (on the dyke island)
      for(var i=0;i<8;i++){
        var tulip=E.sphr(0.6,4,new THREE.MeshPhongMaterial({color:[0xe02040,0xe8d020,0xff6080,0xe05020][i%4],shininess:30}));
        tulip.position.set(-5.6+i*1.6,2.3,-6.5);g.add(tulip);
      }
      var lb=E.makeLabel('Windmill');lb.position.set(0,28,0);g.add(lb);
      return g;
    },
    // Waterfront arcade — stone quay + brick colonnade where the canal meets the lots
    WFA:function(){
      var g=new THREE.Group(),E=City3D;
      var Mstone=new THREE.MeshPhongMaterial({color:0xb8a888,shininess:25});
      // Water base (canal tile keeps its water, aligned with terrain water at y=-0.3)
      var wb=E.flatPlane(28,28,E.M.WATER);wb.position.y=-0.3;g.add(wb);
      // Stone quay along the landward edge
      var quay=E.bx(24,1.2,9,Mstone);quay.position.set(0,0.6,-7);g.add(quay);
      // Arcade colonnade
      [-8,-4,0,4,8].forEach(function(cx){
        var col=E.cy(0.55,0.7,5.5,6,E.M.BRICK);col.position.set(cx,3.95,-7);g.add(col);
      });
      // Entablature beam
      var beam=E.bx(22,1.4,2.2,Mstone);beam.position.set(0,7.4,-7);g.add(beam);
      var lb=E.makeLabel('Waterfront Arcade');lb.position.set(0,12,-7);g.add(lb);
      return g;
    },
  },
};
