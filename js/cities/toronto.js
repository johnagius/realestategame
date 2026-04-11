/* PROPERTY EMPIRE — Toronto: CN Tower, Rogers Centre */
var CityDef_Toronto = {
  name:'Toronto', id:'toronto',
  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['CM','RD','CNT','RD','SK','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['HO','RD','MN','RD','VI','RD','SK'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['ST','RD','CM','RD','WR','RD','TH'],
    ['W','W','HB','W','W','HB','W'],
  ],
  landmarkNames:{CNT:'🗼 CN Tower'},
  landmarks:{
    CNT:function(){
      var g=new THREE.Group(),E=City3D;
      var Mc=new THREE.MeshPhongMaterial({color:0xc0b8a8,shininess:50});
      // Main shaft (very tall, thin)
      var shaft=E.cy(1.2,3,80,8,Mc);shaft.position.y=40;g.add(shaft);
      // Pod (observation/restaurant level)
      var pod=E.cy(6,5.5,8,12,new THREE.MeshPhongMaterial({color:0xa8a098,shininess:60}));
      pod.position.y=58;g.add(pod);
      // Sky pod (smaller, higher)
      var sky=E.cy(3,2.8,4,10,Mc);sky.position.y=68;g.add(sky);
      // Antenna
      var ant=E.cy(0,0.8,32,6,Mc);ant.position.y=80+16;g.add(ant);
      // Red warning light
      var rl=new THREE.PointLight(0xff2200,0.8,20);rl.position.set(0,112,0);g.add(rl);
      // Base supports (3 legs)
      for(var i=0;i<3;i++){
        var a=i*Math.PI*2/3;
        var leg=E.cy(0.5,1.5,12,6,Mc);
        leg.position.set(Math.cos(a)*3,6,Math.sin(a)*3);
        leg.rotation.z=Math.cos(a)*0.15;leg.rotation.x=Math.sin(a)*0.15;
        g.add(leg);
      }
      var lb=E.makeLabel('CN Tower');lb.position.set(0,118,0);g.add(lb);
      return g;
    },
  },
};
