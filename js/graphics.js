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
  }
};
