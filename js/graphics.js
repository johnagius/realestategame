/* ========================================
   PROPERTY EMPIRE - SVG Graphics Engine
   Detailed hand-crafted SVG illustrations
   ======================================== */

const GameGraphics = {

  // ========== SPLASH SCREEN SCENE ==========
  renderSplash() {
    var el = document.getElementById('splash-scene');
    if (!el) return;
    el.innerHTML = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      this._splashDefs() +
      this._splashSky() +
      this._splashClouds() +
      this._splashMountains() +
      this._splashLake() +
      this._splashHillsFar() +
      this._splashTrees(180, 460, 0.8) +
      this._splashTrees(1350, 455, 0.9) +
      this._splashMansion() +
      this._splashGardens() +
      this._splashHillsNear() +
      this._splashForegroundTrees() +
      this._splashFence() +
      this._splashCarriage() +
    '</svg>';
  },

  _splashDefs() {
    return '<defs>' +
      '<linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#0a0620"/>' +
        '<stop offset="12%" stop-color="#1a0e38"/>' +
        '<stop offset="25%" stop-color="#2d1854"/>' +
        '<stop offset="38%" stop-color="#5a2a5c"/>' +
        '<stop offset="50%" stop-color="#8a3a4a"/>' +
        '<stop offset="60%" stop-color="#c45a3a"/>' +
        '<stop offset="70%" stop-color="#e08040"/>' +
        '<stop offset="78%" stop-color="#eaa050"/>' +
        '<stop offset="85%" stop-color="#f0c070"/>' +
        '<stop offset="92%" stop-color="#f5d898"/>' +
        '<stop offset="100%" stop-color="#fae8c0"/>' +
      '</linearGradient>' +
      '<linearGradient id="s-water" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#c08050" stop-opacity="0.6"/>' +
        '<stop offset="50%" stop-color="#5a7090" stop-opacity="0.7"/>' +
        '<stop offset="100%" stop-color="#304060" stop-opacity="0.8"/>' +
      '</linearGradient>' +
      '<linearGradient id="s-hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2a4a35"/><stop offset="100%" stop-color="#1a3825"/></linearGradient>' +
      '<linearGradient id="s-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e3e28"/><stop offset="100%" stop-color="#14301c"/></linearGradient>' +
      '<linearGradient id="s-hill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#142a1a"/><stop offset="100%" stop-color="#0c1e10"/></linearGradient>' +
      '<linearGradient id="s-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0e0c8"/><stop offset="100%" stop-color="#d0c0a0"/></linearGradient>' +
      '<linearGradient id="s-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5a4535"/><stop offset="100%" stop-color="#3a2a1a"/></linearGradient>' +
      '<linearGradient id="s-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a3020"/><stop offset="100%" stop-color="#2a1a0a"/></linearGradient>' +
      '<radialGradient id="s-sun" cx="0.5" cy="0.5" r="0.5">' +
        '<stop offset="0%" stop-color="#fff8e0" stop-opacity="0.9"/>' +
        '<stop offset="20%" stop-color="#f0c060" stop-opacity="0.5"/>' +
        '<stop offset="50%" stop-color="#e08040" stop-opacity="0.2"/>' +
        '<stop offset="100%" stop-color="#c05030" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="s-treeDk"><stop offset="0%" stop-color="#2a5a30"/><stop offset="100%" stop-color="#1a4020"/></radialGradient>' +
      '<radialGradient id="s-treeLt"><stop offset="0%" stop-color="#3a7040"/><stop offset="100%" stop-color="#2a5530"/></radialGradient>' +
      '<radialGradient id="s-glow"><stop offset="0%" stop-color="#f0c060" stop-opacity="0.5"/><stop offset="100%" stop-color="#f0c060" stop-opacity="0"/></radialGradient>' +
      '<filter id="s-blur"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="s-blur2"><feGaussianBlur stdDeviation="1.5"/></filter>' +
    '</defs>';
  },

  _splashSky() {
    var s = '<rect width="1600" height="900" fill="url(#s-sky)"/>';
    // Stars
    var stars = [[120,30,2],[250,65,1.2],[380,22,1.5],[520,50,1],[680,18,1.8],[820,42,1.3],
      [970,28,1.6],[1120,55,1],[1280,35,1.4],[1420,20,1.7],[180,100,0.8],[450,85,1],
      [630,72,0.9],[880,95,1.1],[1050,80,0.7],[1300,68,1.2],[100,140,0.6],[320,130,0.9],
      [560,115,0.7],[790,125,1],[1000,108,0.8],[1200,140,0.6],[1380,110,0.9],
      [200,170,0.5],[700,155,0.7],[1100,165,0.5],[400,160,0.6]];
    s += '<g opacity="0.9">';
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      s += '<circle cx="'+st[0]+'" cy="'+st[1]+'" r="'+st[2]+'" fill="#fff" opacity="'+(0.4+Math.random()*0.6)+'"/>';
    }
    s += '</g>';
    // Moon
    s += '<circle cx="1200" cy="90" r="35" fill="#ffeedd" opacity="0.9"/>';
    s += '<circle cx="1212" cy="82" r="33" fill="#1a0e38"/>';
    // Sun glow on horizon
    s += '<ellipse cx="500" cy="530" rx="350" ry="200" fill="url(#s-sun)"/>';
    return s;
  },

  _splashClouds() {
    var s = '<g opacity="0.25">';
    // Wispy clouds near horizon
    s += '<ellipse cx="300" cy="350" rx="120" ry="15" fill="#e0a060"/>';
    s += '<ellipse cx="500" cy="370" rx="80" ry="10" fill="#d09050"/>';
    s += '<ellipse cx="750" cy="340" rx="150" ry="12" fill="#e0a060"/>';
    s += '<ellipse cx="1000" cy="360" rx="100" ry="8" fill="#d09050"/>';
    s += '<ellipse cx="1250" cy="345" rx="130" ry="14" fill="#e0a060"/>';
    // Higher thin clouds
    s += '<ellipse cx="200" cy="250" rx="100" ry="6" fill="#8060a0" opacity="0.3"/>';
    s += '<ellipse cx="600" cy="230" rx="140" ry="5" fill="#8060a0" opacity="0.2"/>';
    s += '<ellipse cx="1100" cy="260" rx="120" ry="7" fill="#8060a0" opacity="0.25"/>';
    s += '</g>';
    return s;
  },

  _splashMountains() {
    // Distant purple mountains
    return '<path d="M0,520 Q80,460 160,490 Q240,440 340,475 Q440,430 540,465 Q640,420 740,458 ' +
      'Q840,428 940,462 Q1040,435 1140,468 Q1240,440 1340,472 Q1440,448 1540,475 L1600,480 L1600,540 L0,540Z" ' +
      'fill="#3a2548" opacity="0.7"/>' +
      '<path d="M0,530 Q100,490 200,510 Q320,475 440,505 Q560,470 680,500 Q800,478 920,508 ' +
      'Q1040,480 1160,505 Q1280,488 1400,510 L1600,500 L1600,550 L0,550Z" fill="#2a3a4a" opacity="0.6"/>';
  },

  _splashLake() {
    var s = '';
    s += '<path d="M350,540 Q550,528 750,535 Q950,525 1150,538 L1150,570 Q950,560 750,565 Q550,558 350,568Z" fill="url(#s-water)"/>';
    // Shimmer reflections
    s += '<g opacity="0.35" stroke="#f0c870" stroke-width="1" stroke-linecap="round">';
    for (var x = 400; x < 1100; x += 60) {
      var w = 15 + Math.random() * 25;
      var y = 542 + Math.random() * 20;
      s += '<line x1="'+x+'" y1="'+y+'" x2="'+(x+w)+'" y2="'+y+'"/>';
    }
    s += '</g>';
    return s;
  },

  _splashHillsFar() {
    return '<path d="M0,540 Q120,510 240,530 Q400,505 560,525 Q720,500 880,520 Q1040,508 1200,528 Q1360,510 1520,530 L1600,525 L1600,590 L0,590Z" fill="url(#s-hill1)"/>';
  },

  _splashTrees(cx, cy, scale) {
    var s = '<g transform="translate('+cx+','+cy+') scale('+scale+')">';
    // Cluster of trees
    s += '<rect x="-3" y="0" width="6" height="45" fill="#3a2818"/>';
    s += '<ellipse cx="0" cy="-15" rx="22" ry="32" fill="url(#s-treeDk)"/>';
    s += '<ellipse cx="-12" cy="-5" rx="16" ry="24" fill="url(#s-treeLt)" opacity="0.8"/>';
    s += '<rect x="35" y="5" width="5" height="38" fill="#3a2818"/>';
    s += '<ellipse cx="37" cy="-10" rx="18" ry="28" fill="url(#s-treeDk)"/>';
    s += '<rect x="-40" y="8" width="5" height="35" fill="#3a2818"/>';
    s += '<ellipse cx="-38" cy="-5" rx="20" ry="30" fill="url(#s-treeLt)" opacity="0.85"/>';
    s += '</g>';
    return s;
  },

  _splashMansion() {
    var s = '<g transform="translate(560, 465)">';

    // === Ground shadow ===
    s += '<ellipse cx="240" cy="130" rx="280" ry="18" fill="#0a1a0a" opacity="0.25"/>';

    // === Main building (center) ===
    s += '<rect x="120" y="30" width="240" height="100" fill="url(#s-wall)" stroke="#b0a080" stroke-width="1.2"/>';
    // Roof
    s += '<polygon points="105,30 240,0 375,30" fill="url(#s-roof)" stroke="#4a3a2a" stroke-width="1"/>';
    // Roof ridge ornament
    s += '<rect x="232" y="-5" width="16" height="8" fill="#8a7a5a" rx="2"/>';

    // Windows top floor (arched)
    var winX = [140,165,190,215,275,300,325];
    s += '<g fill="#3a4a6a" stroke="#a09070" stroke-width="0.8">';
    for (var i = 0; i < winX.length; i++) {
      s += '<rect x="'+winX[i]+'" y="42" width="14" height="22" rx="7" ry="7"/>';
      // Window panes
      s += '<line x1="'+(winX[i]+7)+'" y1="42" x2="'+(winX[i]+7)+'" y2="64" stroke="#607090" stroke-width="0.5"/>';
    }
    // Windows bottom floor (rectangular)
    var winX2 = [135,160,185,285,310,335];
    for (var i = 0; i < winX2.length; i++) {
      s += '<rect x="'+winX2[i]+'" y="80" width="16" height="22" rx="1"/>';
      // Sill
      s += '<rect x="'+(winX2[i]-2)+'" y="102" width="20" height="2" fill="#d0c0a0"/>';
    }
    s += '</g>';

    // Grand entrance with portico
    s += '<rect x="215" y="72" width="50" height="58" fill="url(#s-door)" rx="25" ry="25"/>';
    s += '<rect x="215" y="95" width="50" height="35" fill="url(#s-door)"/>';
    // Door split
    s += '<line x1="240" y1="95" x2="240" y2="130" stroke="#5a4030" stroke-width="1"/>';
    // Door handles
    s += '<circle cx="234" cy="112" r="1.5" fill="#c0a060"/>';
    s += '<circle cx="246" cy="112" r="1.5" fill="#c0a060"/>';

    // Portico columns
    s += '<rect x="208" y="68" width="5" height="62" fill="#e8d8c0" rx="2.5"/>';
    s += '<rect x="267" y="68" width="5" height="62" fill="#e8d8c0" rx="2.5"/>';
    // Column capitals
    s += '<rect x="206" y="66" width="9" height="4" fill="#d8c8b0" rx="1"/>';
    s += '<rect x="265" y="66" width="9" height="4" fill="#d8c8b0" rx="1"/>';
    // Pediment
    s += '<polygon points="200,66 240,48 280,66" fill="url(#s-roof)" stroke="#4a3a2a" stroke-width="0.8"/>';
    // Pediment ornament
    s += '<circle cx="240" cy="58" r="4" fill="#d0c0a0" stroke="#a09070" stroke-width="0.5"/>';

    // Steps
    s += '<rect x="210" y="130" width="60" height="4" fill="#d8d0c0" rx="1"/>';
    s += '<rect x="206" y="134" width="68" height="4" fill="#c8c0b0" rx="1"/>';
    s += '<rect x="202" y="138" width="76" height="4" fill="#b8b0a0" rx="1"/>';

    // === Left wing ===
    s += '<rect x="10" y="50" width="120" height="80" fill="url(#s-wall)" stroke="#b0a080" stroke-width="1"/>';
    s += '<polygon points="0,50 70,28 140,50" fill="url(#s-roof)" stroke="#4a3a2a" stroke-width="1"/>';
    // Left wing windows
    s += '<g fill="#3a4a6a" stroke="#a09070" stroke-width="0.6">';
    for (var x = 22; x <= 112; x += 30) {
      s += '<rect x="'+x+'" y="60" width="14" height="18" rx="7" ry="7"/>';
      s += '<rect x="'+(x+1)+'" y="92" width="12" height="16" rx="1"/>';
      s += '<rect x="'+(x-1)+'" y="108" width="16" height="2" fill="#d0c0a0"/>';
    }
    s += '</g>';

    // === Right wing ===
    s += '<rect x="350" y="50" width="120" height="80" fill="url(#s-wall)" stroke="#b0a080" stroke-width="1"/>';
    s += '<polygon points="340,50 410,28 480,50" fill="url(#s-roof)" stroke="#4a3a2a" stroke-width="1"/>';
    s += '<g fill="#3a4a6a" stroke="#a09070" stroke-width="0.6">';
    for (var x = 362; x <= 452; x += 30) {
      s += '<rect x="'+x+'" y="60" width="14" height="18" rx="7" ry="7"/>';
      s += '<rect x="'+(x+1)+'" y="92" width="12" height="16" rx="1"/>';
      s += '<rect x="'+(x-1)+'" y="108" width="16" height="2" fill="#d0c0a0"/>';
    }
    s += '</g>';

    // Chimneys
    s += '<g fill="#7a6a5a">';
    s += '<rect x="145" y="-8" width="10" height="25" /><rect x="143" y="-10" width="14" height="4" fill="#8a7a6a"/>';
    s += '<rect x="325" y="-8" width="10" height="25" /><rect x="323" y="-10" width="14" height="4" fill="#8a7a6a"/>';
    s += '<rect x="45" y="18" width="8" height="18"/><rect x="43" y="16" width="12" height="3" fill="#8a7a6a"/>';
    s += '<rect x="425" y="18" width="8" height="18"/><rect x="423" y="16" width="12" height="3" fill="#8a7a6a"/>';
    s += '</g>';

    // Chimney smoke
    s += '<g opacity="0.15" fill="none" stroke="#aaa" stroke-width="2">';
    s += '<path d="M150,-10 Q155,-25 148,-40 Q142,-55 150,-70"/>';
    s += '<path d="M330,-10 Q335,-28 328,-45"/>';
    s += '</g>';

    // Window warm glow (some lit)
    s += '<g opacity="0.3" fill="#f0c060">';
    s += '<rect x="216" y="96" width="48" height="30" rx="1"/>';
    s += '<rect x="136" y="81" width="14" height="20" rx="1"/>';
    s += '<rect x="312" y="81" width="14" height="20" rx="1"/>';
    s += '<rect x="53" y="93" width="10" height="14" rx="1"/>';
    s += '<rect x="393" y="93" width="10" height="14" rx="1"/>';
    s += '</g>';

    s += '</g>';
    return s;
  },

  _splashGardens() {
    var s = '';
    // Garden path from mansion
    s += '<path d="M800,600 Q800,620 800,640 Q780,660 760,680 Q800,700 840,680 Q820,660 800,640" fill="#c0a878" opacity="0.4"/>';

    // Fountain
    s += '<g transform="translate(800, 630)">';
    s += '<ellipse cx="0" cy="0" rx="20" ry="8" fill="#a0a8b0" stroke="#808890" stroke-width="1"/>';
    s += '<rect x="-3" y="-18" width="6" height="18" fill="#b0b8c0"/>';
    s += '<circle cx="0" cy="-20" r="5" fill="#b0b8c0"/>';
    // Water spray
    s += '<g opacity="0.4" stroke="#88c8e8" stroke-width="0.8" fill="none">';
    s += '<path d="M0,-25 Q-5,-35 -8,-30"/>';
    s += '<path d="M0,-25 Q5,-35 8,-30"/>';
    s += '<path d="M0,-25 Q0,-38 0,-32"/>';
    s += '</g>';
    s += '</g>';

    // Hedgerows
    s += '<g fill="#1a4020">';
    s += '<ellipse cx="720" cy="610" rx="40" ry="8"/>';
    s += '<ellipse cx="880" cy="610" rx="40" ry="8"/>';
    s += '<ellipse cx="720" cy="650" rx="35" ry="7"/>';
    s += '<ellipse cx="880" cy="650" rx="35" ry="7"/>';
    s += '</g>';

    // Flower beds
    s += '<g opacity="0.6">';
    var flowers = [[700,618,'#e06080'],[710,622,'#f0a0b0'],[730,616,'#e06080'],[870,620,'#8060c0'],[885,618,'#a080d0'],[895,624,'#8060c0']];
    for (var i = 0; i < flowers.length; i++) {
      var f = flowers[i];
      s += '<circle cx="'+f[0]+'" cy="'+f[1]+'" r="2.5" fill="'+f[2]+'"/>';
    }
    s += '</g>';

    return s;
  },

  _splashHillsNear() {
    return '<path d="M0,610 Q150,585 300,600 Q500,580 700,598 Q900,578 1100,595 Q1300,582 1500,600 L1600,598 L1600,900 L0,900Z" fill="url(#s-hill2)"/>' +
      '<path d="M0,660 Q200,640 400,655 Q600,638 800,652 Q1000,636 1200,650 Q1400,640 1600,655 L1600,900 L0,900Z" fill="url(#s-hill3)"/>';
  },

  _splashForegroundTrees() {
    var s = '';
    // Large detailed trees in foreground
    var trees = [[60,620,1.2],[150,630,0.9],[1400,615,1.3],[1520,625,1]];
    for (var i = 0; i < trees.length; i++) {
      var t = trees[i];
      s += '<g transform="translate('+t[0]+','+t[1]+') scale('+t[2]+')">';
      // Trunk
      s += '<path d="M-4,0 L-6,-15 L-3,-40 L0,-60 L3,-40 L6,-15 L4,0Z" fill="#3a2818"/>';
      // Branches
      s += '<line x1="-3" y1="-30" x2="-18" y2="-38" stroke="#3a2818" stroke-width="2"/>';
      s += '<line x1="3" y1="-25" x2="20" y2="-30" stroke="#3a2818" stroke-width="2"/>';
      s += '<line x1="-2" y1="-45" x2="-12" y2="-55" stroke="#3a2818" stroke-width="1.5"/>';
      // Foliage layers
      s += '<ellipse cx="0" cy="-55" rx="28" ry="22" fill="#1a4020"/>';
      s += '<ellipse cx="-15" cy="-42" rx="22" ry="18" fill="#2a5530"/>';
      s += '<ellipse cx="15" cy="-38" rx="20" ry="16" fill="#1a4520"/>';
      s += '<ellipse cx="0" cy="-65" rx="18" ry="14" fill="#2a5a30"/>';
      s += '<ellipse cx="-8" cy="-50" rx="15" ry="12" fill="#3a6a3a" opacity="0.7"/>';
      s += '</g>';
    }
    return s;
  },

  _splashFence() {
    var s = '<g stroke="#2a3818" opacity="0.3">';
    // Ornate fence posts
    s += '<line x1="0" y1="690" x2="400" y2="690" stroke-width="2"/>';
    s += '<line x1="1200" y1="690" x2="1600" y2="690" stroke-width="2"/>';
    for (var x = 30; x < 400; x += 35) {
      s += '<line x1="'+x+'" y1="678" x2="'+x+'" y2="700" stroke-width="2"/>';
      // Finial
      s += '<circle cx="'+x+'" cy="676" r="2.5" fill="#2a3818"/>';
    }
    for (var x = 1220; x < 1600; x += 35) {
      s += '<line x1="'+x+'" y1="678" x2="'+x+'" y2="700" stroke-width="2"/>';
      s += '<circle cx="'+x+'" cy="676" r="2.5" fill="#2a3818"/>';
    }
    s += '</g>';

    // Stone gate pillars
    s += '<g fill="#8a8070">';
    s += '<rect x="390" y="665" width="18" height="40" rx="2"/>';
    s += '<rect x="387" y="662" width="24" height="6" fill="#9a9080" rx="1"/>';
    s += '<circle cx="399" cy="658" r="6" fill="#9a9080"/>';
    s += '<rect x="1192" y="665" width="18" height="40" rx="2"/>';
    s += '<rect x="1189" y="662" width="24" height="6" fill="#9a9080" rx="1"/>';
    s += '<circle cx="1201" cy="658" r="6" fill="#9a9080"/>';
    s += '</g>';

    return s;
  },

  _splashCarriage() {
    // Horse-drawn carriage on the path
    var s = '<g transform="translate(680, 680)" opacity="0.6">';
    // Horse
    s += '<path d="M-30,-12 Q-35,-20 -28,-22 Q-22,-24 -18,-18 L-15,-10 L-12,-14 Q-8,-10 -5,-12 L0,-8" fill="#5a3a20" stroke="#4a2a15" stroke-width="0.8"/>';
    // Legs
    s += '<line x1="-25" y1="-10" x2="-27" y2="0" stroke="#5a3a20" stroke-width="1.5"/>';
    s += '<line x1="-15" y1="-10" x2="-13" y2="0" stroke="#5a3a20" stroke-width="1.5"/>';
    // Carriage body
    s += '<rect x="2" y="-18" width="28" height="16" fill="#3a1a0a" rx="3" stroke="#5a3a20" stroke-width="0.8"/>';
    // Wheels
    s += '<circle cx="8" cy="0" r="6" fill="none" stroke="#5a3a20" stroke-width="1.5"/>';
    s += '<circle cx="26" cy="0" r="6" fill="none" stroke="#5a3a20" stroke-width="1.5"/>';
    // Spokes
    s += '<line x1="8" y1="-6" x2="8" y2="6" stroke="#5a3a20" stroke-width="0.5"/>';
    s += '<line x1="2" y1="0" x2="14" y2="0" stroke="#5a3a20" stroke-width="0.5"/>';
    s += '<line x1="26" y1="-6" x2="26" y2="6" stroke="#5a3a20" stroke-width="0.5"/>';
    s += '<line x1="20" y1="0" x2="32" y2="0" stroke="#5a3a20" stroke-width="0.5"/>';
    // Driver
    s += '<circle cx="5" cy="-22" r="3" fill="#5a4a3a"/>';
    s += '<rect x="3" y="-19" width="4" height="6" fill="#4a3a2a"/>';
    s += '</g>';
    return s;
  },

  // ========== WORLD MAP ==========
  renderWorldMap(svgEl) {
    svgEl.setAttribute('viewBox', '0 0 1600 800');
    svgEl.innerHTML = this._worldDefs() + this._worldOcean() + this._worldContinents() + this._worldOceanDetails();
  },

  _worldDefs() {
    return '<defs>' +
      '<linearGradient id="w-ocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4A7A9B"/><stop offset="50%" stop-color="#3A6A88"/><stop offset="100%" stop-color="#2A5A78"/></linearGradient>' +
      '<linearGradient id="w-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7BAA68"/><stop offset="40%" stop-color="#5A8A4E"/><stop offset="100%" stop-color="#4A7A3E"/></linearGradient>' +
      '<linearGradient id="w-desert" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D4C090"/><stop offset="100%" stop-color="#C0A870"/></linearGradient>' +
      '<linearGradient id="w-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8EEF2"/><stop offset="100%" stop-color="#D0D8E0"/></linearGradient>' +
      '<linearGradient id="w-forest" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3A6A35"/><stop offset="100%" stop-color="#2A5A28"/></linearGradient>' +
      '<linearGradient id="w-mountain" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8A7A6A"/><stop offset="50%" stop-color="#6A6A5A"/><stop offset="100%" stop-color="#5A5A4A"/></linearGradient>' +
      '<filter id="w-sh"><feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#1A3A4A" flood-opacity="0.3"/></filter>' +
      '<filter id="w-glow"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<pattern id="w-waves" width="60" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-5)">' +
        '<path d="M0,10 Q15,5 30,10 Q45,15 60,10" fill="none" stroke="#5A8AA8" stroke-width="0.6" opacity="0.3"/>' +
      '</pattern>' +
    '</defs>';
  },

  _worldOcean() {
    var s = '<rect width="1600" height="800" fill="url(#w-ocean)"/>';
    s += '<rect width="1600" height="800" fill="url(#w-waves)"/>';
    // Depth shading
    s += '<ellipse cx="300" cy="700" rx="300" ry="150" fill="#1A4A68" opacity="0.15"/>';
    s += '<ellipse cx="1200" cy="500" rx="200" ry="250" fill="#1A4A68" opacity="0.1"/>';
    // Latitude/longitude grid
    s += '<g stroke="#6A9AB8" stroke-width="0.4" opacity="0.15">';
    for (var y = 100; y < 800; y += 100) s += '<line x1="0" y1="'+y+'" x2="1600" y2="'+y+'"/>';
    for (var x = 100; x < 1600; x += 100) s += '<line x1="'+x+'" y1="0" x2="'+x+'" y2="800"/>';
    // Equator
    s += '<line x1="0" y1="400" x2="1600" y2="400" stroke="#7ABADB" stroke-width="0.8" opacity="0.2" stroke-dasharray="10,5"/>';
    s += '</g>';
    return s;
  },

  _worldContinents() {
    var s = '<g filter="url(#w-sh)">';

    // ===== NORTH AMERICA =====
    s += '<path d="M80,110 C100,90 140,80 180,75 C220,70 260,72 300,80 C340,88 370,100 395,115 ' +
      'C420,130 435,150 440,170 C445,195 440,220 430,240 C420,260 410,278 420,295 ' +
      'C430,310 425,330 410,345 C395,358 375,365 358,370 C340,375 320,378 305,385 ' +
      'C290,392 275,398 258,395 C240,392 222,385 208,378 C192,370 178,375 162,382 ' +
      'C145,390 128,380 115,368 C100,355 88,338 78,318 C68,298 62,275 58,252 ' +
      'C55,228 55,205 58,182 C62,160 68,138 78,118Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.5"/>';
    // Rockies
    s += '<path d="M120,180 L135,160 L145,175 L155,155 L165,172 L175,150 L185,168 L190,185" fill="url(#w-mountain)" opacity="0.5" stroke="#7A7060" stroke-width="0.5"/>';
    // Great Lakes
    s += '<ellipse cx="280" cy="185" rx="22" ry="10" fill="#4A7A9B" opacity="0.6"/>';
    s += '<ellipse cx="260" cy="178" rx="15" ry="8" fill="#4A7A9B" opacity="0.5"/>';
    // Forest regions
    s += '<g fill="url(#w-forest)" opacity="0.3">';
    s += '<ellipse cx="200" cy="150" rx="40" ry="20"/>';
    s += '<ellipse cx="320" cy="160" rx="30" ry="15"/>';
    s += '</g>';

    // Greenland
    s += '<path d="M380,50 C420,35 455,42 480,58 C495,72 490,92 475,102 C458,110 435,108 418,98 C400,88 388,70 380,50Z" fill="url(#w-ice)" stroke="#B0B8C0" stroke-width="1"/>';
    // Ice texture
    s += '<g stroke="#C8D0D8" stroke-width="0.5" opacity="0.4"><line x1="400" y1="60" x2="440" y2="55"/><line x1="430" y1="70" x2="470" y2="68"/></g>';

    // Central America
    s += '<path d="M260,395 L278,388 L290,395 L302,405 L310,418 L305,428 L292,425 L278,418 L265,410 L258,402Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1"/>';
    // Caribbean islands
    s += '<ellipse cx="325" cy="375" rx="8" ry="3" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.5" transform="rotate(-20,325,375)"/>';
    s += '<ellipse cx="340" cy="380" rx="6" ry="2.5" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.5"/>';
    s += '<ellipse cx="350" cy="388" rx="5" ry="2" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.5"/>';

    // ===== SOUTH AMERICA =====
    s += '<path d="M310,430 C335,415 360,418 380,428 C400,440 415,458 425,480 C435,505 440,535 438,565 ' +
      'C435,595 425,625 410,650 C395,672 375,688 355,695 C335,700 315,692 300,678 ' +
      'C288,665 278,645 272,622 C266,598 262,572 260,545 C258,518 262,490 272,465 ' +
      'C282,445 295,435 310,430Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.5"/>';
    // Andes
    s += '<path d="M290,470 L298,455 L305,465 L312,448 L318,462 L325,445 L330,460 L335,480" fill="url(#w-mountain)" opacity="0.4" stroke="#7A7060" stroke-width="0.5"/>';
    // Amazon (forest)
    s += '<ellipse cx="360" cy="490" rx="35" ry="25" fill="url(#w-forest)" opacity="0.4"/>';
    // Amazon river
    s += '<path d="M310,490 Q340,485 370,492 Q390,488 410,495" fill="none" stroke="#4A7A9B" stroke-width="1.5" opacity="0.4"/>';

    // ===== EUROPE =====
    s += '<path d="M610,90 C645,78 680,82 710,88 C740,95 762,80 782,88 C800,96 812,112 808,132 ' +
      'C802,150 790,165 775,175 C758,183 740,180 722,185 C705,190 688,183 672,178 ' +
      'C655,172 640,180 625,175 C610,168 600,152 598,135 C596,118 600,102 610,90Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.5"/>';
    // Alps
    s += '<path d="M680,140 L690,128 L698,138 L708,125 L715,135" fill="url(#w-mountain)" opacity="0.5" stroke="#8A7A6A" stroke-width="0.5"/>';
    // Scandinavian peninsula
    s += '<path d="M690,45 C710,35 730,40 742,55 C750,70 745,90 735,82 C725,75 715,78 705,70 C695,62 688,52 690,45Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1"/>';
    // UK + Ireland
    s += '<path d="M598,100 C610,90 622,95 628,108 C632,120 625,132 615,135 C606,138 598,130 595,120 C592,110 594,104 598,100Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1"/>';
    s += '<ellipse cx="585" cy="115" rx="8" ry="12" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.8"/>';
    // Iceland
    s += '<ellipse cx="560" cy="65" rx="15" ry="10" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.8"/>';
    // Mediterranean islands
    s += '<ellipse cx="690" cy="178" rx="10" ry="4" fill="url(#w-land)" transform="rotate(15,690,178)" stroke="#4A7A3E" stroke-width="0.5"/>';
    s += '<ellipse cx="710" cy="182" rx="8" ry="5" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.5"/>';

    // ===== AFRICA =====
    s += '<path d="M640,245 C670,232 700,238 728,248 C755,260 778,280 795,305 ' +
      'C810,332 820,362 822,395 C824,428 818,462 808,492 C795,520 778,545 755,562 ' +
      'C730,578 702,585 678,575 C655,565 638,545 625,520 C615,498 608,472 605,445 ' +
      'C602,418 605,390 610,362 C615,335 625,310 640,288 C648,275 645,260 640,245Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.5"/>';
    // Sahara
    s += '<path d="M650,265 Q700,255 740,268 Q760,275 770,290 L760,300 Q720,285 680,292 Q660,298 650,290Z" fill="url(#w-desert)" opacity="0.6"/>';
    // Nile
    s += '<path d="M750,270 Q745,300 742,330 Q740,350 735,370" fill="none" stroke="#4A7A9B" stroke-width="1.2" opacity="0.5"/>';
    // Congo forest
    s += '<ellipse cx="700" cy="420" rx="30" ry="20" fill="url(#w-forest)" opacity="0.4"/>';
    // Kilimanjaro
    s += '<path d="M760,430 L770,418 L780,430" fill="url(#w-mountain)" opacity="0.5"/>';
    s += '<path d="M767,420 L770,414 L773,420" fill="#E8EEF2" opacity="0.6"/>';
    // Madagascar
    s += '<path d="M820,475 C828,465 835,470 835,485 C835,500 830,510 822,512 C815,505 812,490 820,475Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.8"/>';

    // ===== MIDDLE EAST =====
    s += '<path d="M790,218 C812,208 835,215 850,228 C862,242 868,260 862,278 ' +
      'C855,295 840,305 822,300 C805,295 792,280 785,262 C780,245 782,228 790,218Z" fill="url(#w-desert)" stroke="#B0A070" stroke-width="1.2"/>';

    // ===== RUSSIA / ASIA =====
    s += '<path d="M765,55 C820,38 890,30 960,35 C1030,42 1095,58 1155,52 ' +
      'C1200,48 1240,60 1260,78 C1275,95 1270,118 1255,135 C1238,152 1215,148 1192,155 ' +
      'C1168,162 1142,155 1118,162 C1092,168 1065,162 1038,168 C1012,172 985,165 958,170 ' +
      'C932,175 905,168 880,175 C855,180 830,172 808,180 C790,185 775,178 762,168 ' +
      'C748,155 742,138 740,118 C738,98 745,75 765,55Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.5"/>';
    // Siberian forests
    s += '<g fill="url(#w-forest)" opacity="0.3">';
    s += '<ellipse cx="1000" cy="80" rx="60" ry="20"/>';
    s += '<ellipse cx="1120" cy="90" rx="50" ry="18"/>';
    s += '</g>';
    // Ural mountains
    s += '<path d="M850,60 L855,48 L860,58 L865,45 L870,55 L875,42 L880,55" fill="url(#w-mountain)" opacity="0.4" stroke="#7A7060" stroke-width="0.5"/>';
    // Himalaya
    s += '<path d="M920,165 L930,148 L940,160 L950,142 L960,158 L970,140 L980,155 L990,145 L998,158" fill="url(#w-mountain)" opacity="0.5" stroke="#8A7A6A" stroke-width="0.8"/>';
    // Snow caps
    s += '<g fill="#E8EEF2" opacity="0.5">';
    s += '<path d="M928,150 L930,145 L932,150"/>';
    s += '<path d="M948,144 L950,138 L952,144"/>';
    s += '<path d="M968,142 L970,136 L972,142"/>';
    s += '</g>';

    // ===== INDIA =====
    s += '<path d="M910,260 C935,248 960,255 978,272 C992,290 1000,315 995,342 ' +
      'C988,368 972,388 952,395 C930,400 912,392 898,375 C885,358 878,335 880,310 ' +
      'C882,285 892,268 910,260Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.2"/>';
    // Sri Lanka
    s += '<ellipse cx="968" cy="400" rx="5" ry="8" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.6"/>';

    // ===== CHINA / EAST ASIA =====
    s += '<path d="M1020,175 C1050,165 1082,170 1108,182 C1130,195 1148,215 1155,238 ' +
      'C1162,262 1158,288 1145,305 C1130,320 1110,328 1090,325 C1070,322 1052,312 1038,298 ' +
      'C1025,285 1015,265 1010,245 C1005,225 1008,202 1020,175Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.2"/>';
    // Yellow River
    s += '<path d="M1050,200 Q1080,195 1100,205 Q1115,215 1120,230" fill="none" stroke="#4A7A9B" stroke-width="1" opacity="0.4"/>';

    // ===== SOUTHEAST ASIA =====
    s += '<path d="M1070,335 C1095,325 1120,332 1138,348 C1152,362 1158,382 1150,398 ' +
      'C1142,412 1125,420 1108,418 C1090,415 1075,405 1068,388 C1060,372 1062,350 1070,335Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1"/>';
    // Islands
    s += '<ellipse cx="1100" cy="430" rx="18" ry="6" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.6" transform="rotate(-10,1100,430)"/>';
    s += '<ellipse cx="1130" cy="435" rx="12" ry="5" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.6"/>';
    s += '<ellipse cx="1155" cy="440" rx="10" ry="4" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.5"/>';

    // ===== JAPAN =====
    s += '<path d="M1210,155 C1222,142 1238,148 1242,162 C1245,178 1240,198 1230,208 ' +
      'C1220,218 1208,215 1202,202 C1198,188 1200,170 1210,155Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1"/>';
    // Hokkaido
    s += '<ellipse cx="1225" cy="148" rx="10" ry="8" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.7"/>';

    // ===== AUSTRALIA =====
    s += '<path d="M1148,510 C1190,495 1235,502 1270,518 C1300,535 1318,560 1322,588 ' +
      'C1325,615 1315,640 1295,655 C1272,668 1245,672 1218,665 C1195,658 1175,642 1162,620 ' +
      'C1150,598 1145,572 1148,545 C1150,525 1148,515 1148,510Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="1.5"/>';
    // Desert interior
    s += '<ellipse cx="1230" cy="570" rx="50" ry="35" fill="url(#w-desert)" opacity="0.3"/>';
    // Great Barrier Reef hint
    s += '<path d="M1310,530 Q1320,550 1325,575 Q1328,600 1320,625" fill="none" stroke="#5ABADB" stroke-width="2" opacity="0.3" stroke-dasharray="4,3"/>';
    // Tasmania
    s += '<ellipse cx="1280" cy="675" rx="8" ry="6" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.6"/>';
    // New Zealand
    s += '<path d="M1380,620 C1385,610 1392,615 1390,628 C1388,640 1382,648 1378,642 C1374,635 1375,625 1380,620Z" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.8"/>';
    s += '<ellipse cx="1385" cy="652" rx="4" ry="6" fill="url(#w-land)" stroke="#4A7A3E" stroke-width="0.6"/>';

    // ===== ANTARCTICA hint =====
    s += '<path d="M200,780 Q400,770 600,775 Q800,768 1000,775 Q1200,770 1400,778" fill="url(#w-ice)" opacity="0.3" stroke="#C0C8D0" stroke-width="1"/>';

    s += '</g>';
    return s;
  },

  _worldOceanDetails() {
    var s = '';
    // Compass rose
    s += '<g transform="translate(1500,720)" opacity="0.5">';
    s += '<circle r="25" fill="none" stroke="#8AAABB" stroke-width="0.8"/>';
    s += '<circle r="20" fill="none" stroke="#8AAABB" stroke-width="0.5"/>';
    s += '<polygon points="0,-22 3,-8 -3,-8" fill="#8AAABB"/>';
    s += '<polygon points="0,22 3,8 -3,8" fill="#6A8A9B"/>';
    s += '<polygon points="-22,0 -8,3 -8,-3" fill="#6A8A9B"/>';
    s += '<polygon points="22,0 8,3 8,-3" fill="#6A8A9B"/>';
    s += '<text y="-28" text-anchor="middle" font-size="9" fill="#8AAABB" font-weight="700" font-family="serif">N</text>';
    s += '<text y="36" text-anchor="middle" font-size="7" fill="#7A9AAB" font-family="serif">S</text>';
    s += '<text x="32" y="4" text-anchor="middle" font-size="7" fill="#7A9AAB" font-family="serif">E</text>';
    s += '<text x="-32" y="4" text-anchor="middle" font-size="7" fill="#7A9AAB" font-family="serif">W</text>';
    s += '</g>';

    // Ocean labels
    s += '<g font-family="serif" font-style="italic" fill="#5A8AA8" opacity="0.2" font-weight="700">';
    s += '<text x="200" y="550" font-size="18" letter-spacing="8">ATLANTIC</text>';
    s += '<text x="480" y="700" font-size="14" letter-spacing="6">OCEAN</text>';
    s += '<text x="1050" y="480" font-size="16" letter-spacing="8">PACIFIC</text>';
    s += '<text x="850" y="650" font-size="14" letter-spacing="6">INDIAN OCEAN</text>';
    s += '</g>';

    // Shipping routes (dotted)
    s += '<g fill="none" stroke="#6A9AB8" stroke-width="0.8" opacity="0.12" stroke-dasharray="6,4">';
    s += '<path d="M350,350 Q450,400 580,280"/>';
    s += '<path d="M680,280 Q780,350 900,300"/>';
    s += '<path d="M950,350 Q1050,420 1150,380"/>';
    s += '</g>';

    return s;
  },

  // ========== CITY SCENES ==========
  // Each city gets a unique illustrated background

  renderCityScene(cityId, container) {
    var renderer = this['_city_' + cityId];
    if (!renderer) renderer = this._city_generic;
    var svg = '<svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">';
    svg += this._cityDefs();
    svg += renderer.call(this);
    svg += '</svg>';
    container.innerHTML = svg;
  },

  _cityDefs() {
    return '<defs>' +
      '<linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#87CEEB"/><stop offset="60%" stop-color="#B0D4E8"/><stop offset="100%" stop-color="#E8F0F5"/></linearGradient>' +
      '<linearGradient id="c-sky-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4A6E8B"/><stop offset="40%" stop-color="#C4654A"/><stop offset="70%" stop-color="#E8A050"/><stop offset="100%" stop-color="#F0D090"/></linearGradient>' +
      '<linearGradient id="c-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8BA868"/><stop offset="100%" stop-color="#6A8A50"/></linearGradient>' +
      '<linearGradient id="c-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9A9080"/><stop offset="100%" stop-color="#7A7068"/></linearGradient>' +
      '<linearGradient id="c-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5A8AAA"/><stop offset="100%" stop-color="#3A6A88"/></linearGradient>' +
      '<linearGradient id="c-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8DCC8"/><stop offset="100%" stop-color="#C8BCA8"/></linearGradient>' +
      '<linearGradient id="c-brick" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C4785A"/><stop offset="100%" stop-color="#A45840"/></linearGradient>' +
      '<linearGradient id="c-slate" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5A6A7A"/><stop offset="100%" stop-color="#3A4A5A"/></linearGradient>' +
      '<linearGradient id="c-copper" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5A8A7A"/><stop offset="100%" stop-color="#3A6A5A"/></linearGradient>' +
    '</defs>';
  },

  // Helper: Haussmann-style building
  _haussmann(x, y, w, h, floors) {
    var s = '';
    var floorH = h / floors;
    // Main facade
    s += '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="url(#c-stone)" stroke="#B0A890" stroke-width="0.8"/>';
    // Mansard roof
    s += '<path d="M'+(x-2)+','+(y)+' L'+(x+w*0.15)+','+(y-h*0.25)+' L'+(x+w*0.85)+','+(y-h*0.25)+' L'+(x+w+2)+','+(y)+'Z" fill="url(#c-slate)" stroke="#4A5A6A" stroke-width="0.6"/>';
    // Dormer windows
    for (var d = 0; d < 2; d++) {
      var dx = x + w * 0.3 + d * w * 0.35;
      s += '<rect x="'+(dx-3)+'" y="'+(y-h*0.18)+'" width="6" height="8" fill="#8AB0C8" stroke="#6A7A8A" stroke-width="0.4"/>';
      s += '<path d="M'+(dx-4)+','+(y-h*0.18)+' L'+dx+','+(y-h*0.25)+' L'+(dx+4)+','+(y-h*0.18)+'Z" fill="url(#c-slate)"/>';
    }
    // Floor lines and windows
    for (var f = 0; f < floors; f++) {
      var fy = y + f * floorH;
      if (f > 0) s += '<line x1="'+x+'" y1="'+fy+'" x2="'+(x+w)+'" y2="'+fy+'" stroke="#C0B8A0" stroke-width="0.5"/>';
      // Windows
      var numWin = Math.floor(w / 14);
      var winW = 8, winH = floorH * 0.6;
      var spacing = (w - numWin * winW) / (numWin + 1);
      for (var wi = 0; wi < numWin; wi++) {
        var wx = x + spacing + wi * (winW + spacing);
        var wy = fy + floorH * 0.15;
        // Arched windows on second floor, rectangular elsewhere
        if (f === 1) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="'+winW+'" height="'+winH+'" rx="'+(winW/2)+'" ry="'+(winW/2)+'" fill="#7A9AB0" stroke="#A09880" stroke-width="0.4"/>';
        } else {
          s += '<rect x="'+wx+'" y="'+wy+'" width="'+winW+'" height="'+winH+'" fill="#7A9AB0" stroke="#A09880" stroke-width="0.4"/>';
        }
        // Sill
        s += '<rect x="'+(wx-1)+'" y="'+(wy+winH)+'" width="'+(winW+2)+'" height="1.5" fill="#D0C8B0"/>';
        // Balcony rail on 2nd floor
        if (f === 1) {
          s += '<line x1="'+(wx-2)+'" y1="'+(wy+winH+2)+'" x2="'+(wx+winW+2)+'" y2="'+(wy+winH+2)+'" stroke="#4A4A4A" stroke-width="0.6"/>';
        }
      }
    }
    // Ground floor shop front
    var shopW = w * 0.4;
    var shopX = x + (w - shopW) / 2;
    s += '<rect x="'+shopX+'" y="'+(y+h-floorH*0.8)+'" width="'+shopW+'" height="'+(floorH*0.7)+'" fill="#3A5A4A" rx="1" stroke="#2A4A3A" stroke-width="0.5"/>';
    // Awning
    s += '<path d="M'+(shopX-3)+','+(y+h-floorH*0.82)+' L'+(shopX+shopW+3)+','+(y+h-floorH*0.82)+' L'+(shopX+shopW)+','+(y+h-floorH*0.65)+' L'+shopX+','+(y+h-floorH*0.65)+'Z" fill="#8A2020" opacity="0.8"/>';
    return s;
  },

  // ===== PARIS =====
  _city_paris() {
    var s = '';
    // Sky
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    // Soft clouds
    s += '<g opacity="0.4">';
    s += '<ellipse cx="200" cy="60" rx="80" ry="20" fill="#fff"/><ellipse cx="230" cy="55" rx="60" ry="18" fill="#fff"/>';
    s += '<ellipse cx="700" cy="40" rx="100" ry="22" fill="#fff"/><ellipse cx="740" cy="35" rx="70" ry="16" fill="#fff"/>';
    s += '<ellipse cx="1050" cy="70" rx="70" ry="18" fill="#fff"/>';
    s += '</g>';

    // Distant buildings silhouette
    s += '<g fill="#C0C8D0" opacity="0.4">';
    for (var bx = 0; bx < 1200; bx += 30 + Math.floor(bx * 0.01) * 5) {
      var bh = 15 + (Math.sin(bx * 0.05) * 10);
      s += '<rect x="'+bx+'" y="'+(280-bh)+'" width="25" height="'+bh+'"/>';
    }
    s += '</g>';

    // === EIFFEL TOWER (center) ===
    s += '<g transform="translate(550, 100)">';
    // Main structure
    s += '<path d="M-3,0 L-35,200 L-45,200 L-25,100 L-40,200" fill="none" stroke="#5A4A3A" stroke-width="2.5"/>';
    s += '<path d="M3,0 L35,200 L45,200 L25,100 L40,200" fill="none" stroke="#5A4A3A" stroke-width="2.5"/>';
    // Cross beams
    s += '<line x1="-18" y1="80" x2="18" y2="80" stroke="#5A4A3A" stroke-width="2"/>';
    s += '<line x1="-28" y1="140" x2="28" y2="140" stroke="#5A4A3A" stroke-width="2"/>';
    // First platform
    s += '<rect x="-22" y="78" width="44" height="6" fill="#6A5A4A" rx="1"/>';
    // Second platform
    s += '<rect x="-32" y="138" width="64" height="6" fill="#6A5A4A" rx="1"/>';
    // Arch at base
    s += '<path d="M-35,200 Q0,170 35,200" fill="none" stroke="#5A4A3A" stroke-width="2"/>';
    // Top antenna
    s += '<line x1="0" y1="0" x2="0" y2="-15" stroke="#5A4A3A" stroke-width="1.5"/>';
    // Lattice detail
    s += '<g stroke="#7A6A5A" stroke-width="0.5" opacity="0.6">';
    for (var ly = 10; ly < 200; ly += 12) {
      var lw = (ly / 200) * 35;
      s += '<line x1="'+(-lw)+'" y1="'+ly+'" x2="'+lw+'" y2="'+ly+'"/>';
    }
    // Diagonal lattice
    for (var ly = 0; ly < 180; ly += 8) {
      var lw1 = (ly / 200) * 35;
      var lw2 = ((ly+8) / 200) * 35;
      s += '<line x1="'+(-lw1)+'" y1="'+ly+'" x2="'+(-lw2)+'" y2="'+(ly+8)+'"/>';
      s += '<line x1="'+lw1+'" y1="'+ly+'" x2="'+lw2+'" y2="'+(ly+8)+'"/>';
    }
    s += '</g>';
    s += '</g>';

    // === SEINE RIVER ===
    s += '<path d="M0,340 Q200,330 400,338 Q600,345 800,335 Q1000,328 1200,340 L1200,370 Q1000,358 800,365 Q600,375 400,368 Q200,360 0,370Z" fill="url(#c-water)"/>';
    // River shimmer
    s += '<g opacity="0.2" stroke="#A0D0E8" stroke-width="0.8">';
    for (var rx = 50; rx < 1150; rx += 40) {
      s += '<line x1="'+rx+'" y1="'+(345+Math.sin(rx*0.03)*5)+'" x2="'+(rx+15)+'" y2="'+(345+Math.sin(rx*0.03)*5)+'"/>';
    }
    s += '</g>';
    // Bridges
    s += '<path d="M350,338 Q370,325 390,338" fill="none" stroke="#B0A890" stroke-width="3"/>';
    s += '<path d="M700,335 Q720,322 740,335" fill="none" stroke="#B0A890" stroke-width="3"/>';
    s += '<path d="M950,332 Q970,320 990,332" fill="none" stroke="#B0A890" stroke-width="3"/>';

    // === HAUSSMANN BUILDINGS (left bank) ===
    s += this._haussmann(30, 230, 70, 80, 5);
    s += this._haussmann(110, 240, 60, 70, 4);
    s += this._haussmann(180, 225, 75, 85, 5);
    s += this._haussmann(265, 235, 65, 75, 5);
    s += this._haussmann(340, 245, 55, 65, 4);

    // Right side buildings
    s += this._haussmann(700, 230, 70, 75, 5);
    s += this._haussmann(780, 240, 60, 65, 4);
    s += this._haussmann(850, 228, 75, 80, 5);
    s += this._haussmann(935, 238, 65, 70, 5);
    s += this._haussmann(1010, 245, 60, 60, 4);
    s += this._haussmann(1080, 235, 70, 70, 5);

    // === NOTRE-DAME silhouette (distance) ===
    s += '<g transform="translate(460, 240)" opacity="0.7">';
    s += '<rect x="0" y="10" width="50" height="50" fill="#B0A890" stroke="#9A8A70" stroke-width="0.8"/>';
    s += '<rect x="5" y="0" width="8" height="15" fill="#A09880"/>';
    s += '<rect x="37" y="0" width="8" height="15" fill="#A09880"/>';
    s += '<path d="M15,10 L25,-5 L35,10" fill="#A09880" stroke="#9A8A70" stroke-width="0.5"/>';
    // Rose window
    s += '<circle cx="25" cy="25" r="6" fill="#7090A8" stroke="#8A7A60" stroke-width="0.5"/>';
    s += '</g>';

    // === SACRE-COEUR (background hill) ===
    s += '<g transform="translate(900, 180)" opacity="0.5">';
    s += '<ellipse cx="30" cy="35" rx="60" ry="15" fill="#8BA868"/>';
    s += '<rect x="10" y="5" width="40" height="30" fill="#F0E8D8" rx="2"/>';
    s += '<ellipse cx="30" cy="5" rx="12" ry="10" fill="#F0E8D8"/>';
    s += '<ellipse cx="18" cy="8" rx="8" ry="7" fill="#F0E8D8"/>';
    s += '<ellipse cx="42" cy="8" rx="8" ry="7" fill="#F0E8D8"/>';
    s += '</g>';

    // Ground / quay
    s += '<rect x="0" y="370" width="1200" height="130" fill="url(#c-ground)"/>';
    // Cobblestone path
    s += '<rect x="0" y="370" width="1200" height="20" fill="url(#c-road)"/>';

    // Trees along the Seine
    s += '<g>';
    var treePositions = [50,120,200,380,420,650,760,850,1000,1100];
    for (var i = 0; i < treePositions.length; i++) {
      var tx = treePositions[i];
      s += '<rect x="'+(tx-1.5)+'" y="360" width="3" height="20" fill="#5A4030"/>';
      s += '<ellipse cx="'+tx+'" cy="350" rx="12" ry="16" fill="#4A7A38"/>';
      s += '<ellipse cx="'+(tx-5)+'" cy="355" rx="8" ry="12" fill="#5A8A48" opacity="0.7"/>';
    }
    s += '</g>';

    // Street lamps
    s += '<g stroke="#4A4A4A" stroke-width="1.5" fill="#4A4A4A">';
    for (var lx = 80; lx < 1200; lx += 150) {
      s += '<line x1="'+lx+'" y1="375" x2="'+lx+'" y2="395"/>';
      s += '<circle cx="'+lx+'" cy="373" r="2.5" fill="#F0D870" opacity="0.6"/>';
      s += '<path d="M'+(lx-4)+',375 Q'+lx+',370 '+(lx+4)+',375" fill="none"/>';
    }
    s += '</g>';

    // Pedestrians (tiny figures)
    s += '<g opacity="0.5">';
    var peds = [[100,388,'#3A4A6A'],[250,392,'#8A3A3A'],[500,385,'#4A6A4A'],[780,390,'#5A4A6A'],[1050,387,'#6A4A3A']];
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      s += '<circle cx="'+p[0]+'" cy="'+(p[1]-5)+'" r="2" fill="'+p[2]+'"/>';
      s += '<rect x="'+(p[0]-1.5)+'" y="'+(p[1]-3)+'" width="3" height="7" fill="'+p[2]+'" rx="1"/>';
    }
    s += '</g>';

    return s;
  },

  // ===== LONDON =====
  _city_london() {
    var s = '';
    // Overcast sky
    s += '<rect width="1200" height="500" fill="#C0C8D0"/>';
    s += '<rect width="1200" height="500" fill="url(#c-sky)" opacity="0.3"/>';
    // Heavy clouds
    s += '<g fill="#A8B0B8" opacity="0.6">';
    s += '<ellipse cx="150" cy="50" rx="120" ry="30" /><ellipse cx="400" cy="40" rx="150" ry="35"/>';
    s += '<ellipse cx="700" cy="55" rx="130" ry="28"/><ellipse cx="1000" cy="45" rx="140" ry="32"/>';
    s += '<ellipse cx="250" cy="35" rx="80" ry="25"/><ellipse cx="850" cy="30" rx="100" ry="28"/>';
    s += '</g>';

    // === BIG BEN / ELIZABETH TOWER ===
    s += '<g transform="translate(500, 80)">';
    // Main tower
    s += '<rect x="-12" y="0" width="24" height="200" fill="url(#c-stone)" stroke="#A09878" stroke-width="1"/>';
    // Clock section
    s += '<rect x="-16" y="20" width="32" height="35" fill="#D0C8B0" stroke="#A09878" stroke-width="0.8"/>';
    // Clock face
    s += '<circle cx="0" cy="37" r="12" fill="#F8F0E0" stroke="#8A7A60" stroke-width="1"/>';
    s += '<circle cx="0" cy="37" r="1" fill="#2A2A2A"/>';
    s += '<line x1="0" y1="37" x2="0" y2="28" stroke="#2A2A2A" stroke-width="1"/>';
    s += '<line x1="0" y1="37" x2="6" y2="37" stroke="#2A2A2A" stroke-width="0.8"/>';
    // Spire
    s += '<polygon points="-8,0 0,-30 8,0" fill="url(#c-slate)"/>';
    s += '<line x1="0" y1="-30" x2="0" y2="-40" stroke="#5A5A5A" stroke-width="1"/>';
    // Gothic details
    s += '<g stroke="#A09878" stroke-width="0.5" fill="none">';
    for (var gy = 60; gy < 200; gy += 15) {
      s += '<rect x="-8" y="'+gy+'" width="5" height="10" rx="2.5" ry="2.5"/>';
      s += '<rect x="3" y="'+gy+'" width="5" height="10" rx="2.5" ry="2.5"/>';
    }
    s += '</g>';
    s += '</g>';

    // === HOUSES OF PARLIAMENT ===
    s += '<g transform="translate(350, 210)">';
    s += '<rect x="0" y="0" width="260" height="70" fill="url(#c-stone)" stroke="#A09878" stroke-width="1"/>';
    // Roof
    s += '<rect x="-2" y="-8" width="264" height="10" fill="url(#c-slate)"/>';
    // Gothic windows
    s += '<g fill="#6A8098" stroke="#A09878" stroke-width="0.4">';
    for (var wx = 10; wx < 250; wx += 18) {
      s += '<rect x="'+wx+'" y="12" width="8" height="18" rx="4" ry="4"/>';
      s += '<rect x="'+wx+'" y="40" width="8" height="14" rx="1"/>';
    }
    s += '</g>';
    // Towers
    s += '<rect x="-5" y="-25" width="15" height="30" fill="url(#c-stone)" stroke="#A09878" stroke-width="0.5"/>';
    s += '<polygon points="-5,-25 2.5,-35 10,-25" fill="url(#c-slate)"/>';
    s += '<rect x="250" y="-25" width="15" height="30" fill="url(#c-stone)" stroke="#A09878" stroke-width="0.5"/>';
    s += '<polygon points="250,-25 257.5,-35 265,-25" fill="url(#c-slate)"/>';
    s += '</g>';

    // === THAMES ===
    s += '<path d="M0,320 Q300,310 600,318 Q900,325 1200,315 L1200,360 Q900,355 600,358 Q300,350 0,360Z" fill="url(#c-water)"/>';
    // Tower Bridge
    s += '<g transform="translate(850, 260)">';
    s += '<rect x="0" y="10" width="12" height="55" fill="url(#c-stone)" stroke="#8A7A60" stroke-width="0.8"/>';
    s += '<rect x="80" y="10" width="12" height="55" fill="url(#c-stone)" stroke="#8A7A60" stroke-width="0.8"/>';
    s += '<polygon points="0,10 6,0 12,10" fill="url(#c-slate)"/>';
    s += '<polygon points="80,10 86,0 92,10" fill="url(#c-slate)"/>';
    s += '<line x1="6" y1="20" x2="86" y2="20" stroke="#5A7A8A" stroke-width="2"/>';
    s += '<line x1="6" y1="0" x2="46" y2="-8" stroke="#5A7A8A" stroke-width="1.5"/>';
    s += '<line x1="86" y1="0" x2="46" y2="-8" stroke="#5A7A8A" stroke-width="1.5"/>';
    s += '</g>';

    // Brick buildings (left)
    for (var bx = 20; bx < 340; bx += 55) {
      var bh = 55 + Math.floor(Math.sin(bx * 0.1) * 15);
      var by = 280 - bh;
      s += '<rect x="'+bx+'" y="'+by+'" width="48" height="'+bh+'" fill="url(#c-brick)" stroke="#8A5A40" stroke-width="0.8"/>';
      s += '<rect x="'+(bx-1)+'" y="'+(by-4)+'" width="50" height="5" fill="url(#c-slate)"/>';
      // Chimneys
      s += '<rect x="'+(bx+10)+'" y="'+(by-12)+'" width="5" height="10" fill="#7A5A4A"/>';
      s += '<rect x="'+(bx+32)+'" y="'+(by-10)+'" width="5" height="8" fill="#7A5A4A"/>';
      // Windows
      for (var wy = by + 8; wy < by + bh - 10; wy += 16) {
        for (var wwx = bx + 6; wwx < bx + 42; wwx += 14) {
          s += '<rect x="'+wwx+'" y="'+wy+'" width="8" height="10" fill="#8AAABC" stroke="#7A5A48" stroke-width="0.3"/>';
        }
      }
    }

    // Right side buildings
    for (var bx = 680; bx < 840; bx += 50) {
      var bh = 50 + Math.floor(Math.cos(bx * 0.08) * 12);
      var by = 275 - bh;
      s += '<rect x="'+bx+'" y="'+by+'" width="44" height="'+bh+'" fill="url(#c-brick)" stroke="#8A5A40" stroke-width="0.8"/>';
      s += '<rect x="'+(bx-1)+'" y="'+(by-4)+'" width="46" height="5" fill="url(#c-slate)"/>';
      for (var wy = by + 8; wy < by + bh - 10; wy += 15) {
        for (var wwx = bx + 5; wwx < bx + 38; wwx += 13) {
          s += '<rect x="'+wwx+'" y="'+wy+'" width="7" height="9" fill="#8AAABC" stroke="#7A5A48" stroke-width="0.3"/>';
        }
      }
    }

    // Ground
    s += '<rect x="0" y="360" width="1200" height="140" fill="url(#c-ground)"/>';
    s += '<rect x="0" y="360" width="1200" height="15" fill="url(#c-road)"/>';

    // London Eye (background)
    s += '<g transform="translate(180, 240)" opacity="0.4">';
    s += '<circle cx="0" cy="0" r="45" fill="none" stroke="#8A8A8A" stroke-width="1.5"/>';
    for (var a = 0; a < 360; a += 24) {
      var rad = a * Math.PI / 180;
      var ex = Math.cos(rad) * 45, ey = Math.sin(rad) * 45;
      s += '<line x1="0" y1="0" x2="'+ex+'" y2="'+ey+'" stroke="#8A8A8A" stroke-width="0.5"/>';
      s += '<ellipse cx="'+ex+'" cy="'+ey+'" rx="4" ry="3" fill="#B0B8C0" stroke="#8A8A8A" stroke-width="0.3"/>';
    }
    s += '<line x1="0" y1="45" x2="0" y2="80" stroke="#8A8A8A" stroke-width="2"/>';
    s += '</g>';

    // Red double-decker bus
    s += '<g transform="translate(300, 362)">';
    s += '<rect x="0" y="0" width="30" height="12" fill="#CC2222" rx="2"/>';
    s += '<rect x="0" y="-10" width="30" height="10" fill="#CC2222" rx="2"/>';
    s += '<circle cx="6" cy="14" r="3" fill="#333" stroke="#555" stroke-width="0.5"/>';
    s += '<circle cx="24" cy="14" r="3" fill="#333" stroke="#555" stroke-width="0.5"/>';
    s += '<g fill="#AADDEE" stroke="#AA3333" stroke-width="0.3">';
    for (var bwx = 3; bwx < 28; bwx += 7) {
      s += '<rect x="'+bwx+'" y="-8" width="5" height="6"/>';
      s += '<rect x="'+bwx+'" y="2" width="5" height="6"/>';
    }
    s += '</g>';
    s += '</g>';

    // Black cab
    s += '<g transform="translate(900, 365)">';
    s += '<rect x="0" y="0" width="20" height="10" fill="#1A1A1A" rx="3"/>';
    s += '<circle cx="4" cy="12" r="2.5" fill="#333"/>';
    s += '<circle cx="16" cy="12" r="2.5" fill="#333"/>';
    s += '</g>';

    return s;
  },

  // ===== GENERIC CITY (fallback) =====
  _city_generic() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    s += '<g fill="#D0C8B8" opacity="0.5">';
    for (var x = 20; x < 1180; x += 40) {
      var h = 30 + Math.sin(x * 0.05) * 20 + Math.random() * 15;
      s += '<rect x="'+x+'" y="'+(300-h)+'" width="35" height="'+h+'" rx="1"/>';
    }
    s += '</g>';
    s += '<rect x="0" y="300" width="1200" height="200" fill="url(#c-ground)"/>';
    s += '<rect x="0" y="300" width="1200" height="15" fill="url(#c-road)"/>';
    return s;
  },

  // ===== NEW YORK =====
  _city_new_york() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    // Light clouds
    s += '<g opacity="0.3"><ellipse cx="300" cy="40" rx="100" ry="18" fill="#fff"/><ellipse cx="800" cy="55" rx="120" ry="20" fill="#fff"/></g>';

    // === SKYLINE - skyscrapers ===
    // Empire State Building (center)
    s += '<g transform="translate(550, 60)">';
    s += '<rect x="-18" y="30" width="36" height="220" fill="#A0A8B0" stroke="#808890" stroke-width="0.8"/>';
    s += '<rect x="-14" y="40" width="28" height="208" fill="#B0B8C0"/>';
    // Setbacks
    s += '<rect x="-22" y="120" width="44" height="4" fill="#C0C8D0"/>';
    s += '<rect x="-16" y="80" width="32" height="4" fill="#C0C8D0"/>';
    // Spire
    s += '<rect x="-2" y="0" width="4" height="35" fill="#C0C8D0"/>';
    s += '<polygon points="-6,30 0,15 6,30" fill="#B0B8C0"/>';
    // Windows grid
    s += '<g fill="#6A8AAA" opacity="0.7">';
    for (var wy = 45; wy < 245; wy += 8) {
      for (var wx = -12; wx < 12; wx += 6) {
        s += '<rect x="'+wx+'" y="'+wy+'" width="4" height="5"/>';
      }
    }
    s += '</g>';
    s += '</g>';

    // Chrysler Building
    s += '<g transform="translate(420, 90)">';
    s += '<rect x="-14" y="25" width="28" height="190" fill="#C8C0B0" stroke="#A09880" stroke-width="0.8"/>';
    // Art deco crown
    s += '<path d="M-14,25 L-10,15 L-6,22 L-2,8 L2,22 L6,15 L10,22 L14,25" fill="#D8D0C0" stroke="#A09880" stroke-width="0.5"/>';
    s += '<polygon points="-3,8 0,-5 3,8" fill="#E0D8C8"/>';
    // Windows
    s += '<g fill="#7090A8" opacity="0.6">';
    for (var wy = 32; wy < 210; wy += 7) {
      for (var wx = -10; wx < 10; wx += 5) {
        s += '<rect x="'+wx+'" y="'+wy+'" width="3" height="4"/>';
      }
    }
    s += '</g>';
    s += '</g>';

    // One WTC
    s += '<g transform="translate(680, 50)">';
    s += '<rect x="-16" y="0" width="32" height="230" fill="#A8B8C8" stroke="#8898A8" stroke-width="0.8"/>';
    // Glass panels
    s += '<g fill="#88A8C0" opacity="0.5">';
    for (var wy = 5; wy < 225; wy += 6) {
      s += '<rect x="-14" y="'+wy+'" width="13" height="4"/>';
      s += '<rect x="1" y="'+wy+'" width="13" height="4"/>';
    }
    s += '</g>';
    // Spire
    s += '<line x1="0" y1="0" x2="0" y2="-25" stroke="#B0C0D0" stroke-width="1.5"/>';
    s += '</g>';

    // Other skyscrapers
    var buildings = [
      [100,140,30,140,'#8A9AA8'], [150,120,35,160,'#9AA8B8'], [200,155,28,128,'#A8B0B8'],
      [260,130,32,150,'#98A0A8'], [310,145,26,138,'#B0B8C0'], [360,160,24,122,'#A0A8B0'],
      [750,120,30,160,'#A0B0C0'], [800,145,28,138,'#B0B8C0'], [850,130,34,150,'#98A8B8'],
      [910,155,26,128,'#A8B0B8'], [960,140,30,142,'#90A0B0'], [1010,125,32,155,'#A0A8B8'],
      [1060,150,28,132,'#B0B8C8'], [1110,135,30,148,'#98A0B0']
    ];
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      s += '<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" fill="'+b[4]+'" stroke="#7A8A9A" stroke-width="0.5"/>';
      // Windows
      s += '<g fill="#6A88A8" opacity="0.5">';
      for (var wy = b[1]+5; wy < b[1]+b[3]-5; wy += 7) {
        for (var wx = b[0]+3; wx < b[0]+b[2]-3; wx += 6) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="3" height="4"/>';
        }
      }
      s += '</g>';
    }

    // === STATUE OF LIBERTY (small, in harbor) ===
    s += '<g transform="translate(50, 250)" opacity="0.5">';
    s += '<rect x="-3" y="5" width="6" height="20" fill="#6A9A7A"/>';
    s += '<rect x="-8" y="25" width="16" height="8" fill="#7A8A7A"/>';
    s += '<circle cx="0" cy="2" r="4" fill="#6A9A7A"/>';
    s += '<line x1="3" y1="-2" x2="8" y2="-12" stroke="#6A9A7A" stroke-width="1.5"/>';
    s += '<rect x="6" y="-15" width="4" height="5" fill="#E8D870" rx="1"/>';
    s += '</g>';

    // === HUDSON/EAST RIVER ===
    s += '<path d="M0,310 Q300,305 600,312 Q900,318 1200,308 L1200,340 Q900,335 600,340 Q300,335 0,340Z" fill="url(#c-water)"/>';
    // Brooklyn Bridge
    s += '<g transform="translate(600, 280)">';
    s += '<rect x="0" y="0" width="6" height="35" fill="#A09080"/>';
    s += '<rect x="120" y="0" width="6" height="35" fill="#A09080"/>';
    s += '<path d="M3,2 Q63,-15 123,2" fill="none" stroke="#8A7A6A" stroke-width="1.5"/>';
    s += '<path d="M3,6 Q63,-8 123,6" fill="none" stroke="#8A7A6A" stroke-width="1"/>';
    // Suspension cables
    for (var cx = 15; cx < 120; cx += 12) {
      var cy = 2 - Math.sin((cx/120)*Math.PI) * 15;
      s += '<line x1="'+cx+'" y1="'+cy+'" x2="'+cx+'" y2="32" stroke="#8A7A6A" stroke-width="0.4"/>';
    }
    s += '</g>';

    // Ground / street
    s += '<rect x="0" y="340" width="1200" height="160" fill="#6A7A68"/>';
    s += '<rect x="0" y="340" width="1200" height="18" fill="#5A5A58"/>';
    // Road markings
    s += '<g stroke="#E8E880" stroke-width="1" stroke-dasharray="12,8" opacity="0.6">';
    s += '<line x1="0" y1="349" x2="1200" y2="349"/>';
    s += '</g>';

    // Yellow cabs
    var cabs = [200, 450, 700, 950];
    for (var i = 0; i < cabs.length; i++) {
      var cx = cabs[i];
      s += '<rect x="'+cx+'" y="342" width="18" height="8" fill="#F0C820" rx="2"/>';
      s += '<circle cx="'+(cx+3)+'" cy="352" r="2" fill="#333"/>';
      s += '<circle cx="'+(cx+15)+'" cy="352" r="2" fill="#333"/>';
    }

    // Central Park hint (green strip)
    s += '<rect x="350" y="360" width="180" height="60" fill="#5A8A48" rx="5" opacity="0.4"/>';
    s += '<g fill="#4A7A38" opacity="0.3">';
    for (var tx = 360; tx < 520; tx += 20) {
      s += '<ellipse cx="'+tx+'" cy="'+(375+Math.sin(tx*0.1)*5)+'" rx="8" ry="10"/>';
    }
    s += '</g>';

    return s;
  },

  // ===== TOKYO =====
  _city_tokyo() {
    var s = '';
    // Sky with slight pink tint (cherry blossom season feel)
    s += '<rect width="1200" height="500" fill="#E0E8F0"/>';
    s += '<rect width="1200" height="200" fill="#F0E8F0" opacity="0.5"/>';

    // Mt Fuji in background
    s += '<g transform="translate(950, 50)" opacity="0.3">';
    s += '<polygon points="-80,120 0,0 80,120" fill="#8888AA"/>';
    s += '<polygon points="-30,40 0,0 30,40" fill="#E8E8F0"/>';
    s += '</g>';

    // === TOKYO TOWER ===
    s += '<g transform="translate(400, 80)">';
    s += '<path d="M-3,0 L-30,180 L-38,180" fill="none" stroke="#E83030" stroke-width="3"/>';
    s += '<path d="M3,0 L30,180 L38,180" fill="none" stroke="#E83030" stroke-width="3"/>';
    // Cross beams
    for (var ty = 20; ty < 180; ty += 20) {
      var tw = (ty / 180) * 30;
      s += '<line x1="'+(-tw)+'" y1="'+ty+'" x2="'+tw+'" y2="'+ty+'" stroke="#E83030" stroke-width="1.5"/>';
    }
    // White bands
    s += '<g stroke="#FFF" stroke-width="2">';
    for (var ty = 30; ty < 170; ty += 40) {
      var tw = (ty / 180) * 30;
      s += '<line x1="'+(-tw)+'" y1="'+ty+'" x2="'+tw+'" y2="'+ty+'"/>';
    }
    s += '</g>';
    // Observation deck
    s += '<rect x="-18" y="80" width="36" height="8" fill="#E83030" rx="1"/>';
    // Antenna
    s += '<line x1="0" y1="0" x2="0" y2="-20" stroke="#E83030" stroke-width="1.5"/>';
    s += '</g>';

    // === SKYTREE (background) ===
    s += '<g transform="translate(800, 40)" opacity="0.5">';
    s += '<rect x="-4" y="0" width="8" height="230" fill="#B0B8C0"/>';
    s += '<rect x="-10" y="100" width="20" height="10" fill="#B8C0C8" rx="2"/>';
    s += '<polygon points="-6,0 0,-15 6,0" fill="#B0B8C0"/>';
    s += '</g>';

    // === BUILDINGS - mix of modern and traditional ===
    // Modern glass towers
    var towers = [
      [80,100,35,180,'#A0B0C8'],[140,120,28,160,'#B0C0D0'],[190,90,40,190,'#98A8B8'],
      [530,110,32,170,'#A8B8C8'],[580,95,38,185,'#B0B8C8'],[640,125,30,158,'#A0B0C0'],
      [880,105,34,175,'#A8B8D0'],[940,120,28,162,'#B8C0D0'],[990,100,36,180,'#A0A8C0'],
      [1050,130,30,150,'#B0B8C0'],[1100,110,32,170,'#A8B0C8']
    ];
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      s += '<rect x="'+t[0]+'" y="'+t[1]+'" width="'+t[2]+'" height="'+t[3]+'" fill="'+t[4]+'" stroke="#8898A8" stroke-width="0.5" rx="1"/>';
      // Glass curtain wall effect
      s += '<g fill="#88A0B8" opacity="0.4">';
      for (var wy = t[1]+4; wy < t[1]+t[3]-4; wy += 5) {
        s += '<rect x="'+(t[0]+2)+'" y="'+wy+'" width="'+(t[2]-4)+'" height="3"/>';
      }
      s += '</g>';
    }

    // === SENSOJI TEMPLE (foreground right) ===
    s += '<g transform="translate(700, 230)">';
    // Base
    s += '<rect x="0" y="15" width="60" height="35" fill="#C8A878" stroke="#A08858" stroke-width="0.8"/>';
    // Roof layers (pagoda style)
    s += '<path d="M-8,15 Q30,5 68,15" fill="#5A2A2A" stroke="#4A1A1A" stroke-width="0.8"/>';
    s += '<path d="M-5,15 Q30,8 65,15" fill="none" stroke="#7A3A3A" stroke-width="0.5"/>';
    s += '<path d="M2,0 Q30,-8 58,0" fill="#5A2A2A" stroke="#4A1A1A" stroke-width="0.8"/>';
    // Roof ornament
    s += '<line x1="30" y1="-8" x2="30" y2="-15" stroke="#8A6A4A" stroke-width="1"/>';
    // Red gate (torii)
    s += '<g transform="translate(30, 35)">';
    s += '<rect x="-15" y="0" width="3" height="25" fill="#D03030"/>';
    s += '<rect x="12" y="0" width="3" height="25" fill="#D03030"/>';
    s += '<rect x="-18" y="-2" width="36" height="3" fill="#D03030"/>';
    s += '<rect x="-16" y="3" width="32" height="2" fill="#D03030"/>';
    s += '</g>';
    s += '</g>';

    // === CHERRY BLOSSOM TREES ===
    var blossomTrees = [50, 270, 350, 500, 680, 850, 1000, 1130];
    s += '<g>';
    for (var i = 0; i < blossomTrees.length; i++) {
      var bx = blossomTrees[i];
      s += '<rect x="'+(bx-1.5)+'" y="268" width="3" height="18" fill="#5A4030"/>';
      s += '<ellipse cx="'+bx+'" cy="258" rx="14" ry="16" fill="#F0A0B0" opacity="0.8"/>';
      s += '<ellipse cx="'+(bx-6)+'" cy="262" rx="10" ry="12" fill="#F8B8C8" opacity="0.6"/>';
      s += '<ellipse cx="'+(bx+5)+'" cy="260" rx="8" ry="10" fill="#F0A8B8" opacity="0.7"/>';
      // Falling petals
      s += '<g fill="#F8C0D0" opacity="0.5">';
      for (var p = 0; p < 3; p++) {
        var px = bx - 10 + Math.sin(bx + p * 30) * 15;
        var py = 275 + p * 8 + Math.cos(bx + p * 20) * 5;
        s += '<ellipse cx="'+px+'" cy="'+py+'" rx="1.5" ry="1" transform="rotate('+(p*30)+','+px+','+py+')"/>';
      }
      s += '</g>';
    }
    s += '</g>';

    // Ground
    s += '<rect x="0" y="285" width="1200" height="215" fill="#D0C8B8"/>';
    // Crosswalk (Shibuya crossing style)
    s += '<g stroke="#FFF" stroke-width="3" opacity="0.6">';
    s += '<line x1="560" y1="290" x2="640" y2="290"/>';
    s += '<line x1="560" y1="296" x2="640" y2="296"/>';
    s += '<line x1="560" y1="302" x2="640" y2="302"/>';
    s += '<line x1="560" y1="308" x2="640" y2="308"/>';
    s += '</g>';

    // Neon signs
    s += '<g opacity="0.7">';
    s += '<rect x="145" y="200" width="22" height="8" fill="#FF4488" rx="1"/>';
    s += '<rect x="535" y="195" width="25" height="8" fill="#44AAFF" rx="1"/>';
    s += '<rect x="890" y="205" width="20" height="8" fill="#FFAA22" rx="1"/>';
    s += '<rect x="1060" y="200" width="28" height="8" fill="#AA44FF" rx="1"/>';
    s += '</g>';

    // Train/monorail line
    s += '<line x1="0" y1="200" x2="1200" y2="195" stroke="#555" stroke-width="2" opacity="0.3"/>';
    s += '<rect x="300" y="192" width="25" height="8" fill="#338833" rx="2" opacity="0.4"/>';

    return s;
  },

  // ===== DUBAI =====
  _city_dubai() {
    var s = '';
    // Hot sky
    s += '<rect width="1200" height="500" fill="#E8D8C0"/>';
    s += '<rect width="1200" height="250" fill="#C0D8E8" opacity="0.4"/>';

    // === BURJ KHALIFA ===
    s += '<g transform="translate(600, 20)">';
    // Main shaft with setbacks
    s += '<rect x="-8" y="80" width="16" height="200" fill="#B0C0D0" stroke="#90A0B0" stroke-width="0.5"/>';
    s += '<rect x="-12" y="140" width="24" height="140" fill="#A8B8C8" stroke="#90A0B0" stroke-width="0.5"/>';
    s += '<rect x="-16" y="180" width="32" height="100" fill="#A0B0C0" stroke="#90A0B0" stroke-width="0.5"/>';
    // Wings
    s += '<path d="M-16,180 L-28,220 L-28,280 L-16,280" fill="#98A8B8"/>';
    s += '<path d="M16,180 L28,220 L28,280 L16,280" fill="#98A8B8"/>';
    // Spire
    s += '<line x1="0" y1="80" x2="0" y2="0" stroke="#C0D0E0" stroke-width="2"/>';
    // Glass shimmer
    s += '<g fill="#88AAC0" opacity="0.3">';
    for (var by = 85; by < 275; by += 4) {
      s += '<rect x="-6" y="'+by+'" width="12" height="2"/>';
    }
    s += '</g>';
    s += '</g>';

    // Other Dubai towers
    var dtowers = [
      [150,100,24,180,'#D0C8B8'],[200,120,30,160,'#C8D0D8'],[260,90,26,190,'#D0D8E0'],
      [320,110,28,170,'#C0C8D0'],[380,130,22,150,'#D8D0C0'],
      [780,95,30,185,'#C8D0D8'],[840,115,26,168,'#D0D8E0'],[900,105,32,178,'#C0C8D0'],
      [960,125,24,158,'#D8D0C0'],[1020,100,28,180,'#C8C8D0'],[1080,120,26,162,'#D0D0D8']
    ];
    for (var i = 0; i < dtowers.length; i++) {
      var t = dtowers[i];
      s += '<rect x="'+t[0]+'" y="'+t[1]+'" width="'+t[2]+'" height="'+t[3]+'" fill="'+t[4]+'" stroke="#A0A898" stroke-width="0.5"/>';
      s += '<g fill="#A0B8C8" opacity="0.3">';
      for (var wy = t[1]+3; wy < t[1]+t[3]-3; wy += 5) {
        s += '<rect x="'+(t[0]+2)+'" y="'+wy+'" width="'+(t[2]-4)+'" height="3"/>';
      }
      s += '</g>';
    }

    // Burj Al Arab (sail shape)
    s += '<g transform="translate(100, 160)">';
    s += '<path d="M0,120 L5,0 Q40,-10 45,120Z" fill="#C8D8E8" stroke="#A0B0C0" stroke-width="1"/>';
    s += '<path d="M10,110 L12,20 Q35,15 38,110Z" fill="#88B0D0" opacity="0.3"/>';
    s += '</g>';

    // Desert/sand ground
    s += '<rect x="0" y="280" width="1200" height="220" fill="#D8C8A8"/>';
    s += '<path d="M0,290 Q200,285 400,292 Q600,298 800,288 Q1000,282 1200,290" fill="#E0D0B0" opacity="0.5"/>';

    // Palm trees
    var palms = [50, 180, 350, 500, 750, 950, 1100];
    for (var i = 0; i < palms.length; i++) {
      var px = palms[i];
      s += '<path d="M'+px+',310 Q'+(px+2)+',290 '+(px+1)+',270" fill="none" stroke="#7A6A4A" stroke-width="3"/>';
      // Fronds
      s += '<g fill="#5A8A40" opacity="0.8">';
      for (var f = 0; f < 6; f++) {
        var angle = -60 + f * 24;
        s += '<path d="M'+(px+1)+',270 Q'+(px+1+Math.cos(angle*0.017)*25)+','+(270-8+Math.sin(angle*0.017)*10)+' '+(px+1+Math.cos(angle*0.017)*35)+','+(270+5)+'" fill="none" stroke="#5A8A40" stroke-width="2"/>';
      }
      s += '</g>';
    }

    // Heat shimmer effect
    s += '<g opacity="0.05">';
    s += '<rect x="0" y="250" width="1200" height="30" fill="#FFF"/>';
    s += '</g>';

    return s;
  },

  // ===== SYDNEY =====
  _city_sydney() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    s += '<g opacity="0.3"><ellipse cx="400" cy="45" rx="100" ry="20" fill="#fff"/><ellipse cx="900" cy="35" rx="80" ry="16" fill="#fff"/></g>';

    // === OPERA HOUSE ===
    s += '<g transform="translate(500, 220)">';
    // Shells/sails
    s += '<path d="M0,40 Q15,-15 30,40" fill="#F0EAE0" stroke="#D0C8B8" stroke-width="1"/>';
    s += '<path d="M25,40 Q45,-25 65,40" fill="#F0EAE0" stroke="#D0C8B8" stroke-width="1"/>';
    s += '<path d="M55,40 Q80,-20 100,40" fill="#F0EAE0" stroke="#D0C8B8" stroke-width="1"/>';
    s += '<path d="M90,40 Q108,-10 125,40" fill="#F0EAE0" stroke="#D0C8B8" stroke-width="1"/>';
    // Tile texture on shells
    s += '<g stroke="#D8D0C0" stroke-width="0.3" opacity="0.5">';
    for (var sy = 10; sy < 40; sy += 6) {
      s += '<path d="M'+(5+sy*0.3)+','+sy+' Q'+(20)+','+(sy-8)+' '+(35-sy*0.2)+','+sy+'" fill="none"/>';
      s += '<path d="M'+(30+sy*0.3)+','+sy+' Q'+(50)+','+(sy-12)+' '+(70-sy*0.2)+','+sy+'" fill="none"/>';
    }
    s += '</g>';
    // Base platform
    s += '<rect x="-10" y="40" width="145" height="12" fill="#D0C8B8" stroke="#B0A898" stroke-width="0.5"/>';
    s += '</g>';

    // === HARBOUR BRIDGE ===
    s += '<g transform="translate(200, 200)">';
    // Arch
    s += '<path d="M0,80 Q150,0 300,80" fill="none" stroke="#6A6A6A" stroke-width="4"/>';
    // Deck
    s += '<line x1="0" y1="80" x2="300" y2="80" stroke="#5A5A5A" stroke-width="3"/>';
    // Pylons
    s += '<rect x="-5" y="60" width="10" height="30" fill="#8A8078"/>';
    s += '<rect x="295" y="60" width="10" height="30" fill="#8A8078"/>';
    // Hangers
    for (var hx = 20; hx < 290; hx += 15) {
      var hy = 80 - Math.sin((hx/300)*Math.PI) * 75;
      s += '<line x1="'+hx+'" y1="'+hy+'" x2="'+hx+'" y2="80" stroke="#7A7A7A" stroke-width="0.5"/>';
    }
    s += '</g>';

    // Harbour water
    s += '<path d="M0,300 Q300,290 600,298 Q900,305 1200,295 L1200,340 Q900,335 600,338 Q300,330 0,340Z" fill="url(#c-water)"/>';
    // Boats
    s += '<g fill="#F8F0E0" stroke="#A0A0A0" stroke-width="0.5">';
    s += '<polygon points="350,310 365,305 380,310 365,315"/>';
    s += '<polygon points="800,305 815,300 830,305 815,310"/>';
    s += '</g>';

    // City buildings
    var sBuildings = [
      [30,160,30,120,'#C0C8D0'],[70,140,35,140,'#B8C0C8'],[120,155,28,125,'#C8D0D8'],
      [160,135,32,145,'#B0B8C0'],[750,145,30,135,'#C0C8D0'],[790,130,35,150,'#B8C0C8'],
      [840,155,28,125,'#C8D0D8'],[890,140,32,140,'#B0B8C0'],
      [960,150,28,130,'#C0C8D0'],[1000,135,30,145,'#B8C0C8'],[1050,160,26,120,'#C8D0D8'],
      [1100,145,32,135,'#B0B8C0'],[1150,155,28,125,'#C0C8D0']
    ];
    for (var i = 0; i < sBuildings.length; i++) {
      var b = sBuildings[i];
      s += '<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" fill="'+b[4]+'" stroke="#A0A8B0" stroke-width="0.5"/>';
      s += '<g fill="#8AAAC0" opacity="0.4">';
      for (var wy = b[1]+4; wy < b[1]+b[3]-4; wy += 6) {
        for (var wx = b[0]+3; wx < b[0]+b[2]-3; wx += 7) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="3" height="4"/>';
        }
      }
      s += '</g>';
    }

    // Ground with coastal feel
    s += '<rect x="0" y="340" width="1200" height="160" fill="url(#c-ground)"/>';
    // Beach strip
    s += '<rect x="0" y="340" width="1200" height="8" fill="#E8D8B8" opacity="0.5"/>';

    // Norfolk pines
    var pines = [50,200,400,650,900,1050,1150];
    for (var i = 0; i < pines.length; i++) {
      var px = pines[i];
      s += '<line x1="'+px+'" y1="348" x2="'+px+'" y2="330" stroke="#4A3828" stroke-width="2"/>';
      s += '<g fill="#3A6A30">';
      for (var py = 332; py > 318; py -= 5) {
        var pw = (348 - py) * 0.5;
        s += '<ellipse cx="'+px+'" cy="'+py+'" rx="'+pw+'" ry="3"/>';
      }
      s += '</g>';
    }

    return s;
  },

  // ===== ROME =====
  _city_rome() {
    var s = '';
    // Warm Italian sky
    s += '<rect width="1200" height="500" fill="#D0E0F0"/>';
    s += '<rect width="1200" height="300" fill="#B8D0E8" opacity="0.5"/>';
    s += '<g opacity="0.25"><ellipse cx="300" cy="50" rx="90" ry="18" fill="#fff"/><ellipse cx="800" cy="40" rx="110" ry="20" fill="#fff"/></g>';

    // === COLOSSEUM ===
    s += '<g transform="translate(450, 180)">';
    // Outer wall - elliptical
    s += '<ellipse cx="80" cy="50" rx="85" ry="55" fill="url(#c-stone)" stroke="#A09878" stroke-width="1.5"/>';
    // Inner void
    s += '<ellipse cx="80" cy="50" rx="60" ry="38" fill="#B8D0E0" opacity="0.4"/>';
    // Arches - three tiers
    for (var tier = 0; tier < 3; tier++) {
      var ty = 18 + tier * 22;
      var rx = 78 - tier * 8;
      for (var a = -70; a <= 70; a += 14) {
        var rad = a * Math.PI / 180;
        var ax = 80 + Math.cos(rad) * rx;
        var ay = ty + Math.sin(rad) * 5;
        s += '<rect x="'+(ax-3)+'" y="'+(ay)+'" width="6" height="10" rx="3" ry="3" fill="#B0A890" stroke="#9A8A70" stroke-width="0.3"/>';
      }
    }
    // Partial ruin (broken top right)
    s += '<path d="M140,15 Q150,10 158,18 Q155,25 148,20" fill="url(#c-stone)" stroke="#A09878" stroke-width="0.5"/>';
    s += '</g>';

    // === ST PETER'S DOME (background) ===
    s += '<g transform="translate(150, 150)" opacity="0.6">';
    s += '<rect x="0" y="25" width="80" height="60" fill="url(#c-stone)"/>';
    s += '<ellipse cx="40" cy="25" rx="30" ry="25" fill="#D8D0C0" stroke="#B0A890" stroke-width="1"/>';
    s += '<rect x="38" y="-5" width="4" height="12" fill="#B0A890"/>';
    s += '<line x1="36" y1="-3" x2="44" y2="-3" stroke="#B0A890" stroke-width="1"/>';
    // Columns
    for (var cx = 10; cx < 75; cx += 10) {
      s += '<rect x="'+cx+'" y="30" width="3" height="55" fill="#E0D8C8"/>';
    }
    s += '</g>';

    // === TREVI FOUNTAIN hint ===
    s += '<g transform="translate(800, 250)">';
    s += '<rect x="0" y="0" width="50" height="40" fill="url(#c-stone)" rx="2"/>';
    s += '<path d="M5,5 Q25,-5 45,5" fill="none" stroke="#A09878" stroke-width="0.8"/>';
    s += '<ellipse cx="25" cy="38" rx="20" ry="6" fill="#6A9AB0" opacity="0.5"/>';
    s += '</g>';

    // Terracotta buildings
    for (var bx = 0; bx < 1200; bx += 55) {
      if (bx > 420 && bx < 650) continue; // Skip colosseum area
      var bh = 40 + Math.sin(bx * 0.07) * 15;
      var by = 260 - bh;
      s += '<rect x="'+bx+'" y="'+by+'" width="48" height="'+bh+'" fill="#D8B898" stroke="#C0A080" stroke-width="0.6"/>';
      // Terracotta roof
      s += '<path d="M'+(bx-2)+','+by+' L'+(bx+24)+','+(by-8)+' L'+(bx+50)+','+by+'" fill="#C07050" stroke="#A05838" stroke-width="0.5"/>';
      // Windows with shutters
      for (var wy = by + 10; wy < by + bh - 8; wy += 14) {
        for (var wx = bx + 8; wx < bx + 40; wx += 14) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="7" height="9" fill="#88AAC0" stroke="#B09878" stroke-width="0.3"/>';
          // Shutters
          s += '<rect x="'+(wx-2)+'" y="'+wy+'" width="2" height="9" fill="#3A6A4A"/>';
          s += '<rect x="'+(wx+7)+'" y="'+wy+'" width="2" height="9" fill="#3A6A4A"/>';
        }
      }
    }

    // Ground - cobblestone
    s += '<rect x="0" y="300" width="1200" height="200" fill="#C8B8A0"/>';
    s += '<rect x="0" y="300" width="1200" height="12" fill="#B0A088"/>';

    // Cypress trees
    var cypresses = [30,350,680,1000,1150];
    for (var i = 0; i < cypresses.length; i++) {
      var cx = cypresses[i];
      s += '<rect x="'+(cx-1)+'" y="270" width="2" height="30" fill="#4A3828"/>';
      s += '<ellipse cx="'+cx+'" cy="258" rx="5" ry="18" fill="#2A5A28"/>';
    }

    // Vespa scooter
    s += '<g transform="translate(650, 302)">';
    s += '<rect x="0" y="0" width="12" height="6" fill="#5AA0C0" rx="2"/>';
    s += '<circle cx="2" cy="8" r="2.5" fill="#444"/>';
    s += '<circle cx="10" cy="8" r="2.5" fill="#444"/>';
    s += '</g>';

    return s;
  },

  // ===== SINGAPORE =====
  _city_singapore() {
    var s = '';
    // Tropical sky
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    s += '<rect width="1200" height="500" fill="#E8F0F0" opacity="0.2"/>';

    // === MARINA BAY SANDS ===
    s += '<g transform="translate(500, 100)">';
    // Three towers
    s += '<rect x="0" y="40" width="20" height="170" fill="#C8C8D0" stroke="#A0A0A8" stroke-width="0.8" transform="skewX(-2)"/>';
    s += '<rect x="50" y="30" width="20" height="180" fill="#C8C8D0" stroke="#A0A0A8" stroke-width="0.8"/>';
    s += '<rect x="100" y="40" width="20" height="170" fill="#C8C8D0" stroke="#A0A0A8" stroke-width="0.8" transform="skewX(2)"/>';
    // Sky park (boat-shaped top)
    s += '<path d="M-15,38 Q60,20 135,38 L130,45 Q60,30 -10,45Z" fill="#8AB068" stroke="#6A9048" stroke-width="0.8"/>';
    // Infinity pool hint
    s += '<rect x="80" y="32" width="40" height="5" fill="#68A8C8" rx="1" opacity="0.6"/>';
    // Windows
    s += '<g fill="#8AA0B8" opacity="0.4">';
    for (var t = 0; t < 3; t++) {
      var tx = t * 50 + 2;
      for (var wy = 45; wy < 205; wy += 5) {
        s += '<rect x="'+tx+'" y="'+wy+'" width="16" height="3"/>';
      }
    }
    s += '</g>';
    s += '</g>';

    // === MERLION ===
    s += '<g transform="translate(380, 250)" opacity="0.6">';
    s += '<rect x="0" y="10" width="12" height="20" fill="#C8C0B0"/>';
    s += '<circle cx="6" cy="6" r="6" fill="#C8C0B0"/>';
    // Water spout
    s += '<path d="M12,8 Q20,5 25,12 Q22,18 18,15" fill="#68A8C8" opacity="0.5"/>';
    s += '</g>';

    // Other skyscrapers
    var sgBuildings = [
      [40,110,28,170,'#B0B8C0'],[80,130,24,150,'#C0C8D0'],[120,100,30,180,'#A8B0B8'],
      [160,120,26,160,'#B8C0C8'],[200,135,22,148,'#C0C8D0'],
      [700,105,30,175,'#B0B8C0'],[740,125,26,155,'#C0C8D0'],[780,95,34,185,'#A8B0B8'],
      [830,115,28,165,'#B8C0C8'],[880,130,24,150,'#C0C8D0'],
      [940,110,30,170,'#B0B8C0'],[990,125,26,155,'#C0C8D0'],[1040,100,32,180,'#A8B0B8'],
      [1090,120,28,160,'#B8C0C8'],[1140,135,24,145,'#C0C8D0']
    ];
    for (var i = 0; i < sgBuildings.length; i++) {
      var b = sgBuildings[i];
      s += '<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" fill="'+b[4]+'" stroke="#98A0A8" stroke-width="0.5"/>';
      s += '<g fill="#88A8C0" opacity="0.3">';
      for (var wy = b[1]+3; wy < b[1]+b[3]-3; wy += 5) {
        s += '<rect x="'+(b[0]+2)+'" y="'+wy+'" width="'+(b[2]-4)+'" height="3"/>';
      }
      s += '</g>';
    }

    // Marina Bay water
    s += '<path d="M300,290 Q500,280 700,288 Q900,295 1100,285 L1100,320 Q900,315 700,318 Q500,310 300,320Z" fill="url(#c-water)"/>';

    // Ground
    s += '<rect x="0" y="320" width="1200" height="180" fill="url(#c-ground)"/>';

    // Tropical trees
    var tropicals = [50,180,280,420,750,900,1050,1150];
    for (var i = 0; i < tropicals.length; i++) {
      var px = tropicals[i];
      s += '<path d="M'+px+',340 Q'+(px+3)+',320 '+(px+1)+',300" fill="none" stroke="#6A5A3A" stroke-width="2.5"/>';
      s += '<g fill="#3A8A40" opacity="0.8">';
      for (var f = 0; f < 5; f++) {
        var angle = -50 + f * 25;
        var fx = px + 1 + Math.cos(angle * 0.0175) * 20;
        var fy = 300 + Math.sin(angle * 0.0175) * 12;
        s += '<ellipse cx="'+fx+'" cy="'+(fy-5)+'" rx="12" ry="4" transform="rotate('+angle+','+fx+','+(fy-5)+')"/>';
      }
      s += '</g>';
    }

    // Supertree Grove hint
    s += '<g transform="translate(300, 300)" opacity="0.4">';
    for (var st = 0; st < 3; st++) {
      var sx = st * 25;
      s += '<line x1="'+sx+'" y1="40" x2="'+sx+'" y2="0" stroke="#6A5A8A" stroke-width="2"/>';
      s += '<ellipse cx="'+sx+'" cy="-2" rx="10" ry="5" fill="#4A8A5A"/>';
    }
    s += '</g>';

    return s;
  }
};
