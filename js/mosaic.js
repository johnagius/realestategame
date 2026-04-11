/* ========================================
   PROPERTY EMPIRE — D3 World Map Renderer
   Natural Earth projection with terrain
   Requires: d3.js + topojson.js from CDN
   ======================================== */

const Mosaic = {

  MAP_W: 1400,
  MAP_H: 680,
  _rendered: false,

  // Game country styling (ISO numeric → colors)
  GAME_COUNTRIES: {
    840:{n:'United States',  c:'#38784a',h:'#52a864',gl:'#60e880'},
    826:{n:'United Kingdom', c:'#304898',h:'#4868c0',gl:'#6090f0'},
    250:{n:'France',         c:'#883050',h:'#b04870',gl:'#e06090'},
    392:{n:'Japan',          c:'#a82030',h:'#cc3848',gl:'#f05870'},
    784:{n:'UAE',            c:'#c09030',h:'#e0b048',gl:'#ffd060'},
    702:{n:'Singapore',      c:'#188068',h:'#28a888',gl:'#40d8b0'},
    156:{n:'China',          c:'#1e7850',h:'#2a9866',gl:'#40c888'},
     36:{n:'Australia',      c:'#a85820',h:'#cc7030',gl:'#f09050'},
    724:{n:'Spain',          c:'#a84028',h:'#c85840',gl:'#f07860'},
    380:{n:'Italy',          c:'#788020',h:'#98a030',gl:'#c0cc50'},
    276:{n:'Germany',        c:'#307868',h:'#409888',gl:'#60c8b0'},
    528:{n:'Netherlands',    c:'#b86820',h:'#d88830',gl:'#ffb040'},
    124:{n:'Canada',         c:'#2c6070',h:'#3c8890',gl:'#58b8c0'},
    492:{n:'Monaco',         c:'#583888',h:'#7050a8',gl:'#9878e0'},
    356:{n:'India',          c:'#a86820',h:'#c88838',gl:'#f0b050'},
     76:{n:'Brazil',         c:'#389830',h:'#50b840',gl:'#70e858'},
    710:{n:'South Africa',   c:'#887020',h:'#a89030',gl:'#d0b840'},
  },

  PALETTE: ['#6e6448','#766c50','#706648','#786e52','#6a6244','#726a4e','#7a7054','#6e6446','#746c50','#7c7258','#686040','#706848','#746a50','#7c7258','#6c6446'],

  RIVERS: [
    {w:1.3,c:[[-73,-4],[-69,-4],[-64,-2.5],[-58,-2],[-52,-1],[-49.5,-0.5]]},
    {w:1.0,c:[[33,0],[33,5],[32,10],[34,15],[33,20],[32,26],[31.5,30],[32,31.3]]},
    {w:1.0,c:[[27,-5],[23,-4],[18,-3],[15,-4],[13,-4.5],[12,-6]]},
    {w:0.8,c:[[-93,47],[-92,43],[-91,38],[-90,34],[-89.5,30]]},
    {w:0.9,c:[[91,32],[98,31],[104,29],[110,29],[115,30],[118,31],[121.5,31.5]]},
    {w:0.8,c:[[79,31],[82,28],[86,26],[89,24],[90,22.5]]},
    {w:0.7,c:[[76,33],[72,30],[70,27],[68,25],[67,24]]},
    {w:0.6,c:[[9.5,47.5],[8,48],[7.5,50],[6.5,51.5],[4.8,52]]},
    {w:0.7,c:[[35,57],[43,53],[50,48],[50.5,46]]},
    {w:0.7,c:[[84,51],[78,55],[72,60],[68,65],[67,67]]},
    {w:0.8,c:[[-13,12],[-5,15],[2,15],[4,14],[5,10],[6,5]]},
    {w:0.7,c:[[22,-13],[26,-15],[30,-17],[34,-18],[36,-20]]},
    {w:0.7,c:[[147,-37],[143,-36],[140,-35.5],[139,-35.7]]},
    {w:0.7,c:[[-117,59],[-122,62],[-127,65],[-133,68]]},
    {w:0.7,c:[[94,22],[100,22],[102,20],[104,18],[105,15],[105,11],[106,10]]},
    {w:0.6,c:[[13,48],[16,48],[19,47],[22,46],[26,44],[29,45.5],[30,45]]},
    {w:0.6,c:[[-65,10],[-64,8],[-63,8],[-62,7.5],[-61,8]]},
    {w:0.7,c:[[37,-3],[38,-5],[40,-8],[42,-10],[44,-11]]},
  ],

  MOUNTAINS: [
    [10.5,46.5,1.2,1],[8,46.8,1.0,1],[12.5,47.2,.9,1],[7,45.9,.85,1],
    [0,42.5,.9,1],[2.5,42.6,.8,0],[13.5,43.5,.65,0],[14,41,.6,0],
    [14,63,.8,1],[16,68,.7,1],[15,70,.6,1],
    [24,49,.8,0],[23,47,.7,0],[25,47,.65,0],
    [44,42.5,1.0,1],[41,43,.9,1],[46,43,.85,1],
    [60,57,.8,0],[59,62,.7,0],[49,33,.9,0],[47,30,.8,0],
    [80,29,1.4,1],[84,28,1.5,1],[88,27.5,1.3,1],[92,27,1.2,1],[96,26.5,1.0,1],
    [90,32,1.0,1],[85,31,1.0,1],[95,30,.95,1],
    [72,36,1.2,1],[75,35,1.1,1],[71,37,.9,1],[74,38,1.0,1],
    [88,50,.9,1],[86,52,.8,1],
    [-4,33,.9,0],[2,31,.8,0],[5,33,.75,0],
    [38,9,.8,0],[36,11,.7,0],[29,-30,.8,0],[37,-3,.75,1],
    [-110,43,1.1,1],[-113,48,1.0,1],[-107,38,.9,0],[-120,49,.85,1],
    [-119,37,.9,1],[-121,45,.8,1],[-122,48,.8,1],
    [-81,38,.7,0],[-79,35,.7,0],[-77,40,.65,0],
    [-104,24,.8,0],[-103,20,.7,0],
    [-70,-15,1.2,1],[-68,-20,1.1,1],[-66,-28,1.0,0],[-72,-40,1.0,1],[-75,-10,1.1,1],
    [-153,67,.8,1],[-148,65,.75,1],[148,-32,.7,0],[147,-36,.7,0],
  ],

  // Projection + path generator (created once)
  _proj: null,
  _path: null,

  getProjection: function() {
    if (!this._proj) {
      this._proj = d3.geoNaturalEarth1().scale(220).translate([this.MAP_W / 2, this.MAP_H / 2 + 18]);
      this._path = d3.geoPath().projection(this._proj);
    }
    return this._proj;
  },

  // Convert lon/lat to percentage position for the game's pin overlay
  lonLatToPercent: function(lon, lat) {
    var proj = this.getProjection();
    var p = proj([lon, lat]);
    if (!p) return null;
    return { x: Math.round(p[0] / this.MAP_W * 100), y: Math.round(p[1] / this.MAP_H * 100) };
  },

  // Draw a mountain at a projected position
  _drawMtn: function(g, proj, lon, lat, s, snow) {
    var p = proj([lon, lat]);
    if (!p) return;
    var x = p[0], y = p[1];
    g.append('path').attr('d', 'M'+(x+2*s)+','+(y+.5*s)+'L'+(x+8*s)+','+(y-8*s)+'L'+(x+14*s)+','+(y+.5*s)+'Z')
      .attr('fill','#4a4438').attr('stroke','#2a2418').attr('stroke-width',.3).attr('opacity',.65);
    g.append('path').attr('d', 'M'+(x-6*s)+','+y+'L'+x+','+(y-12*s)+'L'+(x+6*s)+','+y+'Z')
      .attr('fill','#5e5548').attr('stroke','#2a2418').attr('stroke-width',.4).attr('opacity',.75);
    g.append('line').attr('x1',x).attr('y1',y-12*s).attr('x2',x+8*s).attr('y2',y-8*s)
      .attr('stroke','rgba(20,16,10,.35)').attr('stroke-width',.5);
    if (snow) g.append('path').attr('d', 'M'+(x-2.2*s)+','+(y-8*s)+'L'+x+','+(y-12*s)+'L'+(x+2.2*s)+','+(y-8*s)+'Z')
      .attr('fill','rgba(235,242,255,.9)');
  },

  // ========== MAIN RENDER ==========
  renderWorldMap: function(svgEl) {
    if (this._rendered) return; // Only render once
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
      console.warn('D3/TopoJSON not loaded, skipping world map render');
      return;
    }

    var W = this.MAP_W, H = this.MAP_H;
    var self = this;
    var GAME = this.GAME_COUNTRIES;
    var PAL = this.PALETTE;
    var GID = new Set(Object.keys(GAME).map(Number));

    svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    var svg = d3.select(svgEl);
    svg.selectAll('*').remove(); // Clear any existing content

    var proj = this.getProjection();
    var pg = this._path;

    // ── DEFS ──
    var defs = svg.append('defs');

    // Ocean gradient
    var og = defs.append('linearGradient').attr('id','og').attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    og.append('stop').attr('offset','0%').attr('stop-color','#14263e');
    og.append('stop').attr('offset','50%').attr('stop-color','#0c1a2e');
    og.append('stop').attr('offset','100%').attr('stop-color','#060c1a');
    var rc = defs.append('radialGradient').attr('id','rc').attr('cx','50%').attr('cy','43%').attr('r','58%');
    rc.append('stop').attr('offset','0%').attr('stop-color','#1e3a5a').attr('stop-opacity',.45);
    rc.append('stop').attr('offset','100%').attr('stop-color','#04080e').attr('stop-opacity',0);

    // Vignette
    var vig = defs.append('radialGradient').attr('id','vig').attr('cx','50%').attr('cy','50%').attr('r','72%');
    vig.append('stop').attr('offset','48%').attr('stop-color','transparent');
    vig.append('stop').attr('offset','100%').attr('stop-color','rgba(0,0,0,.72)');

    // Filters
    function mkS(id,dx,dy,std,op) {
      var f = defs.append('filter').attr('id',id).attr('x','-15%').attr('y','-15%').attr('width','130%').attr('height','140%');
      f.append('feDropShadow').attr('dx',dx).attr('dy',dy).attr('stdDeviation',std).attr('flood-color','rgba(0,0,0,'+op+')');
    }
    mkS('s0',1,2,2,.55); mkS('s1',2,5,4,.75); mkS('sg',1,3,2.5,.6); mkS('sg1',3,7,7,.85);

    var cf = defs.append('filter').attr('id','coast').attr('x','-8%').attr('y','-8%').attr('width','116%').attr('height','116%');
    cf.append('feGaussianBlur').attr('in','SourceGraphic').attr('stdDeviation','5');

    var gbF = defs.append('filter').attr('id','gbg').attr('x','-20%').attr('y','-20%').attr('width','140%').attr('height','140%');
    gbF.append('feGaussianBlur').attr('in','SourceGraphic').attr('stdDeviation','4').attr('result','blur');
    var gbM = gbF.append('feMerge');
    gbM.append('feMergeNode').attr('in','blur'); gbM.append('feMergeNode').attr('in','SourceGraphic');

    var rvF = defs.append('filter').attr('id','rvf').attr('x','-5%').attr('y','-5%').attr('width','110%').attr('height','110%');
    rvF.append('feGaussianBlur').attr('in','SourceGraphic').attr('stdDeviation','.7');

    // ── OCEAN ──
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','url(#og)');
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','url(#rc)');

    // Ocean scan lines
    for (var y = 6; y < H; y += 9)
      svg.append('line').attr('x1',0).attr('y1',y).attr('x2',W).attr('y2',y)
        .attr('stroke','rgba(80,160,255,1)').attr('stroke-width',.55).attr('class','ow');

    // Ocean particles
    var seed = 12345;
    function srand() { seed = ((seed*1664525)+1013904223)&0xffffffff; return (seed>>>0)/0xffffffff; }
    for (var i = 0; i < 220; i++) {
      var ox = srand()*W, oy = srand()*H, os = srand();
      svg.append('circle').attr('cx',ox).attr('cy',oy).attr('r',.7+os*.5)
        .attr('fill','rgba(140,200,255,'+(0.025+os*0.055)+')');
    }

    // Graticule + sphere
    svg.append('path').datum(d3.geoGraticule()()).attr('d',pg)
      .attr('fill','none').attr('stroke','rgba(80,140,200,.065)').attr('stroke-width',.4);
    svg.append('path').datum({type:'Sphere'}).attr('d',pg)
      .attr('fill','none').attr('stroke','rgba(80,140,200,.2)').attr('stroke-width',1);

    // ── LOAD TOPOJSON ──
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(function(world) {
      var t0 = performance.now();

      var features = topojson.feature(world, world.objects.countries).features;

      // Coastal glow
      var land = topojson.merge(world, world.objects.countries.geometries);
      svg.append('path').datum(land).attr('d',pg)
        .attr('fill','none').attr('stroke','rgba(40,120,220,.55)').attr('stroke-width',7)
        .attr('filter','url(#coast)').attr('pointer-events','none');

      // Country fills
      var cg = svg.append('g');
      cg.selectAll('path').data(features).join('path')
        .attr('class','country').attr('d',pg)
        .attr('fill', function(d) { var id = +d.id; return GAME[id] ? GAME[id].c : PAL[id % PAL.length]; })
        .attr('stroke','rgba(0,0,0,.5)').attr('stroke-width',.4)
        .attr('filter', function(d) { return GID.has(+d.id) ? 'url(#sg)' : 'url(#s0)'; })
        .on('mouseover', function(ev, d) {
          var id = +d.id, g = GAME[id]; if (!g) return;
          d3.select(this).raise().attr('fill', g.h).attr('filter','url(#sg1)').attr('transform','translate(0,-2)');
        })
        .on('mouseout', function(ev, d) {
          var id = +d.id, g = GAME[id]; if (!g) return;
          d3.select(this).attr('fill', g.c).attr('filter','url(#sg)').attr('transform',null);
        });

      // Fog of war on non-game countries
      svg.append('g').selectAll('path')
        .data(features.filter(function(d) { return !GID.has(+d.id); })).join('path')
        .attr('d',pg).attr('fill','rgba(0,0,0,.28)').attr('pointer-events','none');

      // Borders
      svg.append('path')
        .datum(topojson.mesh(world, world.objects.countries, function(a,b) { return a !== b; }))
        .attr('d',pg).attr('fill','none')
        .attr('stroke','rgba(0,0,0,.6)').attr('stroke-width',.55).attr('pointer-events','none');

      // Rivers
      var rvg = svg.append('g').attr('pointer-events','none');
      self.RIVERS.forEach(function(r) {
        rvg.append('path')
          .datum({type:'Feature',geometry:{type:'LineString',coordinates:r.c}})
          .attr('d',pg).attr('fill','none')
          .attr('stroke','rgba(55,115,210,'+(0.28+r.w*0.12)+')')
          .attr('stroke-width', r.w * 0.8)
          .attr('filter','url(#rvf)');
      });

      // Animated glow borders on game countries
      svg.append('g').selectAll('path')
        .data(features.filter(function(d) { return GID.has(+d.id); })).join('path')
        .attr('d',pg).attr('fill','none')
        .attr('stroke', function(d) { return GAME[+d.id].gl; }).attr('stroke-width',1.7)
        .attr('class','gborder').attr('filter','url(#gbg)').attr('pointer-events','none');

      // Mountains
      var mg = svg.append('g').attr('pointer-events','none');
      self.MOUNTAINS.forEach(function(m) { self._drawMtn(mg, proj, m[0], m[1], m[2], m[3]); });

      // Vignette
      svg.append('rect').attr('width',W).attr('height',H)
        .attr('fill','url(#vig)').attr('pointer-events','none');

      // Compass rose
      var cr = svg.append('g').attr('transform','translate('+(W-66)+','+(H-66)+')');
      [0,90,180,270].forEach(function(a) {
        var r = a * Math.PI / 180;
        cr.append('line').attr('x1',0).attr('y1',0)
          .attr('x2',Math.sin(r)*26).attr('y2',-Math.cos(r)*26)
          .attr('stroke','rgba(200,158,48,.7)').attr('stroke-width',1.5);
      });
      ['N','E','S','W'].forEach(function(l,i) {
        var a = i * 90 * Math.PI / 180, o = 37;
        cr.append('text').attr('x',Math.sin(a)*o).attr('y',-Math.cos(a)*o+4)
          .attr('text-anchor','middle').attr('font-size','11px')
          .attr('fill','#c8a030').attr('font-family','Palatino Linotype,serif').text(l);
      });
      cr.append('circle').attr('r',4).attr('fill','#c8a030').attr('stroke','#5a3c08').attr('stroke-width',1);

      // Corner ornaments
      [[14,14,0],[W-14,14,90],[W-14,H-14,180],[14,H-14,270]].forEach(function(o) {
        var cc = svg.append('g').attr('transform','translate('+o[0]+','+o[1]+') rotate('+o[2]+')');
        cc.append('line').attr('x1',0).attr('y1',0).attr('x2',36).attr('y2',0)
          .attr('stroke','rgba(200,155,45,.5)').attr('stroke-width',1.2);
        cc.append('line').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',36)
          .attr('stroke','rgba(200,155,45,.5)').attr('stroke-width',1.2);
        cc.append('circle').attr('r',2.5).attr('fill','rgba(200,155,45,.6)');
      });

      self._rendered = true;

    }).catch(function(err) {
      console.error('Mosaic: Failed to load world map data:', err);
      // Fallback: show a simple message
      svg.append('text').attr('x', W/2).attr('y', H/2).attr('text-anchor','middle')
        .attr('fill','#c8a030').attr('font-size','16px').attr('font-family','Palatino Linotype,serif')
        .text('World map requires internet connection');
    });
  }
};
