/* PROPERTY EMPIRE — Miami: Art Deco District, Freedom Tower */
var CityDef_Miami = {
  name:'Miami', id:'miami',
  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','FTW','RD','SK','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ADC','RD','MN','RD','VI','RD','HO'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','TH'],
    ['W','W','HB','W','W','HB','W'],
  ],
  landmarkNames:{FTW:'🗽 Freedom Tower',ADC:'🌴 Art Deco District'},
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
  },
};
