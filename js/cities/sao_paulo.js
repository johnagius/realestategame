/* PROPERTY EMPIRE — São Paulo: Paulista Avenue, Ibirapuera */
var CityDef_SaoPaulo = {
  name:'São Paulo', id:'sao_paulo',
  layout:[
    ['CT','CT','CT','CT','CT','CT','CT'],
    ['TH','RD','RD','RD','RD','RD','AP'],
    ['SK','RD','SK','RD','PAV','RD','PH'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['CM','RD','MN','RD','SK','RD','HO'],
    ['RD','RD','RD','RD','RD','RD','RD'],
    ['VI','RD','ST','RD','CM','RD','WR'],
    ['CP','CP','IBP','CP','CP','CT','CT'],
  ],
  landmarkNames:{PAV:'🏙️ Paulista Towers',IBP:'🌳 Ibirapuera Park'},
  landmarks:{
    PAV:function(){
      var g=new THREE.Group(),E=City3D;
      var Mg=new THREE.MeshPhongMaterial({color:0x6888a8,transparent:true,opacity:0.92,shininess:90});
      // MASP-inspired: building on red stilts
      var stilts=new THREE.MeshPhongMaterial({color:0xc03020,shininess:50});
      [-6,6].forEach(function(sx){
        var s=E.bx(2,16,2,stilts);s.position.set(sx,8,0);g.add(s);
      });
      var body=E.bx(18,10,12,Mg);body.position.y=16+5;g.add(body);
      E._addWinSimple(g,18,10,12,2,3,16);
      // Adjacent towers
      [-12,12].forEach(function(tx){
        var t=E.bx(6,35+Math.abs(tx),5,Mg);t.position.set(tx,(35+Math.abs(tx))/2,0);g.add(t);
        E._addWinSimple(g,6,35+Math.abs(tx),5,Math.floor((35+Math.abs(tx))/8),1,0);
      });
      var lb=E.makeLabel('Paulista Avenue');lb.position.set(0,52,0);g.add(lb);
      return g;
    },
    IBP:function(){
      var g=new THREE.Group(),E=City3D;
      g.add(E.flatPlane(28,28,E.M.PARK));
      // Ibirapuera auditorium (white wedge)
      var aud=E.bx(10,6,8,new THREE.MeshPhongMaterial({color:0xf0ece0,shininess:50}));
      aud.position.set(-4,3,0);g.add(aud);
      var awning=E.bx(14,0.5,12,new THREE.MeshPhongMaterial({color:0xf0ece0,shininess:50}));
      awning.position.set(-4,6.5,0);g.add(awning);
      // Lake
      var lake=E.cy(5,5,0.5,12,E.M.WATER);lake.position.set(6,0.25,4);g.add(lake);
      // Trees scattered
      [[-8,-8],[8,-6],[-6,6],[4,-4],[-3,8],[9,2]].forEach(function(p){
        var tr=E.cy(0.3,0.4,5,5,E.M.HOt);tr.position.set(p[0],2.5,p[1]);g.add(tr);
        var lv=E.sphr(3.5,5,E.M.PARKD);lv.position.set(p[0],6.5,p[1]);g.add(lv);
      });
      // Paths
      var path=E.bx(24,0.15,2.5,E.M.SIDEW);path.position.set(0,0.08,0);g.add(path);
      var lb=E.makeLabel('Ibirapuera Park');lb.position.set(0,12,0);g.add(lb);
      return g;
    },
  },
};
