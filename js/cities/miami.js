/* PROPERTY EMPIRE — Miami: Art Deco District, Freedom Tower */
var CityDef_Miami = {
  name:'Miami', id:'miami',

  // Project Skyline profile (SKYLINE-5): Art Deco pastels — pink/mint/cream triad
  // (Townscaper principle) against saturated turquoise water, powder-blue skies.
  // Resolved by City3D._prof: era key > base > ERAS palette. Victorian/Gilded get
  // gas lamps + warmed dusk, Digital gets neon lamps + dark mirror water.
  profile:{
    base:{ skyline: 0x1c2b3b, surroundings: 'dense', // SKYLINE-5: skyline-edge tint + slab kind exposure:1.1, sunDay:0xfff0d2, sunDusk:0xe89ab0,
      ambDay:0x404660, ambDusk:0x221e34, hemiSky:0xc2e2ee, hemiGround:0x4e4c44,
      wallJitter:0.08, water:{ color:0x17a0b4, specular:0xc0eef2, opacity:0.88 },
      trees:'palm', lamps:'modern' },
    victorian:{ sky:['#2a2650','#8a6a8c','#f6b492'], fog:0x5e5464, haze:0.28, lamps:'gas',
      sunDusk:0xe89a6a, ambDusk:0x2a2438, ground:0x34322c, road:0x2a2825, side:0x544f46, park:0x346234 },
    gilded:{ sky:['#282a54','#8a6e94','#f8ba96'], fog:0x5c586c, haze:0.24, lamps:'gas',
      sunDusk:0xe89a6a, ambDusk:0x282438, ground:0x36342e, road:0x2c2a27, side:0x565148, park:0x366636 },
    crisis:{ sky:['#1c2444','#5a6a88','#ecb09a'], fog:0x465064, haze:0.26,
      ground:0x323230, road:0x262625, side:0x4c4a48, park:0x326036 },
    boom:{ sky:['#1a2c58','#6a7aa0','#fcb498'], fog:0x4c566e, haze:0.18,
      ground:0x353431, road:0x292826, side:0x524f4a, park:0x386a38 },
    modern:{ sky:['#16305c','#4a7aa0','#f8b49a'], fog:0x324e64, haze:0.2,
      ground:0x33322f, road:0x272624, side:0x504d48, park:0x36683a },
    digital:{ sky:['#0a1236','#2a3a80','#d05a9c'], fog:0x1c2a56, haze:0.14, lamps:'neon',
      water:{ color:0x0b3c50, specular:0xd8f8ff, opacity:0.85 },
      ground:0x242428, road:0x1b1a1e, side:0x3a3a40, park:0x285a34 },
  },

  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','FTW','RD','SK','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ADC','RD','MN','RD','VI','RD','HO'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','PDR'],
    ['W','W','HB','W','W','HB','W'],
  ],
  // Pastel deco row is a 1930s style — era-gated to crisis (Art Deco period)
  landmarkEras:{PDR:'crisis'},
  landmarkNames:{FTW:'🗽 Freedom Tower',ADC:'🌴 Art Deco District',PDR:'Deco Waterfront Row'},
  landmarks:{
    FTW:function(){
      var g=new THREE.Group(),E=City3D;
      var Ms=new THREE.MeshPhongMaterial({color:0xd8c8a0,shininess:40});
      var Mt=new THREE.MeshPhongMaterial({color:0xc07830,shininess:30});
      // Base building
      var body=E.bx(14,28,12,Ms);body.position.y=14;g.add(body);
      // Tower section
      var tower=E.bx(8,16,6,Ms);tower.position.y=28+8;g.add(tower);
      // Cupola dome
      var dome=E.sphr(4,8,Mt);dome.scale.y=0.7;dome.position.y=44+2.8;g.add(dome);
      // Lantern
      var lant=E.cy(1,1,4,6,Ms);lant.position.y=47+2;g.add(lant);
      // Cornice details
      var cor1=E.bx(14.5,1.5,12.5,Mt,false);cor1.position.y=28;g.add(cor1);
      var cor2=E.bx(8.5,1,6.5,Mt,false);cor2.position.y=44;g.add(cor2);
      E._addWinSimple(g,14,28,12,4,3,0);
      var lb=E.makeLabel('Freedom Tower');lb.position.set(0,55,0);g.add(lb);
      return g;
    },
    ADC:function(){
      var g=new THREE.Group(),E=City3D;
      // Art Deco row — pastel buildings with neon accents
      var pastels=[0x88c8c0,0xf0a8b0,0xa8d8f0,0xf0d898,0xc0e8b0];
      for(var i=0;i<5;i++){
        var h=10+Math.sin(i*2)*2;
        var bld=E.bx(4.5,h,8,new THREE.MeshPhongMaterial({color:pastels[i],shininess:35}));
        bld.position.set(-9+i*4.5,h/2,0);g.add(bld);
        // Art Deco trim lines
        for(var j=1;j<=3;j++){
          var trim=E.bx(4.7,0.3,8.2,new THREE.MeshPhongMaterial({color:0xf0f0f0,shininess:50}),false);
          trim.position.set(-9+i*4.5,j*(h/4),0);g.add(trim);
        }
        // Neon sign (colored emissive strip)
        var neon=E.bx(3,0.5,0.3,new THREE.MeshPhongMaterial({color:pastels[i],emissive:pastels[i],shininess:80}),false);
        neon.position.set(-9+i*4.5,h*0.7,-4.2);g.add(neon);
      }
      // Palm trees
      [-12,12].forEach(function(tx){
        var trunk=E.cy(0.4,0.5,8,5,new THREE.MeshPhongMaterial({color:0x6a5028,shininess:10}));
        trunk.position.set(tx,4,5);g.add(trunk);
        var fronds=E.sphr(3.5,5,new THREE.MeshPhongMaterial({color:0x308828,shininess:15}));
        fronds.scale.y=0.5;fronds.position.set(tx,9,5);g.add(fronds);
      });
      var lb=E.makeLabel('Art Deco District');lb.position.set(0,16,0);g.add(lb);
      return g;
    },
    // SKYLINE-5 signature: pastel deco row on the waterfront — pink/mint/cream
    // triad with white deco eyebrows (shared trim material). 6 meshes, ~72 tris.
    PDR:function(){
      var g=new THREE.Group(),E=City3D;
      var triad=[0xf2b6c6,0xa8dcd2,0xf2ead2];
      for(var i=0;i<3;i++){
        var h=14+i*3;
        var bld=E.bx(7,h,10,new THREE.MeshPhongMaterial({color:triad[i],shininess:30}));
        bld.position.set(-8.5+i*8.5,h/2,0);g.add(bld);
        var brow=E.bx(7.4,0.6,10.4,E.M.MNt,false);
        brow.position.set(-8.5+i*8.5,h*0.72,0);g.add(brow);
      }
      var lb=E.makeLabel('Deco Waterfront');lb.position.set(0,26,0);g.add(lb);
      return g;
    },
  },
};
