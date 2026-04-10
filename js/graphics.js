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
      // Sky - richer with more stops and hue shifts
      '<linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#060412"/>' +
        '<stop offset="8%" stop-color="#0e0822"/>' +
        '<stop offset="15%" stop-color="#1a0e38"/>' +
        '<stop offset="22%" stop-color="#2a1850"/>' +
        '<stop offset="30%" stop-color="#44205a"/>' +
        '<stop offset="38%" stop-color="#6a2a54"/>' +
        '<stop offset="45%" stop-color="#8e3248"/>' +
        '<stop offset="52%" stop-color="#b8443a"/>' +
        '<stop offset="58%" stop-color="#d05a30"/>' +
        '<stop offset="63%" stop-color="#da7035"/>' +
        '<stop offset="68%" stop-color="#e48838"/>' +
        '<stop offset="73%" stop-color="#eca040"/>' +
        '<stop offset="78%" stop-color="#f0b450"/>' +
        '<stop offset="83%" stop-color="#f4c868"/>' +
        '<stop offset="88%" stop-color="#f6d888"/>' +
        '<stop offset="93%" stop-color="#f8e4a8"/>' +
        '<stop offset="100%" stop-color="#faecc8"/>' +
      '</linearGradient>' +
      // Warm light hitting surfaces from the left/horizon
      '<linearGradient id="s-warmface" x1="0" y1="0" x2="1" y2="0.3">' +
        '<stop offset="0%" stop-color="#f8d890" stop-opacity="0.35"/>' +
        '<stop offset="100%" stop-color="#f8d890" stop-opacity="0"/>' +
      '</linearGradient>' +
      // Cool shadow on opposite faces
      '<linearGradient id="s-coolshade" x1="1" y1="0" x2="0" y2="0.3">' +
        '<stop offset="0%" stop-color="#2a3050" stop-opacity="0.25"/>' +
        '<stop offset="100%" stop-color="#2a3050" stop-opacity="0"/>' +
      '</linearGradient>' +
      '<linearGradient id="s-water" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#c88858" stop-opacity="0.7"/>' +
        '<stop offset="30%" stop-color="#6a7a98" stop-opacity="0.8"/>' +
        '<stop offset="100%" stop-color="#2a3a58" stop-opacity="0.9"/>' +
      '</linearGradient>' +
      '<linearGradient id="s-hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#28483a"/><stop offset="100%" stop-color="#18342a"/></linearGradient>' +
      '<linearGradient id="s-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1c3828"/><stop offset="100%" stop-color="#12281c"/></linearGradient>' +
      '<linearGradient id="s-hill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10241a"/><stop offset="100%" stop-color="#081810"/></linearGradient>' +
      // Mansion walls - subtle stone texture variation via gradient
      '<linearGradient id="s-wall" x1="0" y1="0" x2="0.1" y2="1">' +
        '<stop offset="0%" stop-color="#f2e4cc"/>' +
        '<stop offset="40%" stop-color="#e8d8b8"/>' +
        '<stop offset="70%" stop-color="#e0d0b0"/>' +
        '<stop offset="100%" stop-color="#d4c4a0"/>' +
      '</linearGradient>' +
      '<linearGradient id="s-wall-warm" x1="0" y1="0" x2="1" y2="0.5">' +
        '<stop offset="0%" stop-color="#f8e8c8"/>' +
        '<stop offset="100%" stop-color="#d8c8a0"/>' +
      '</linearGradient>' +
      '<linearGradient id="s-roof" x1="0" y1="0" x2="0.3" y2="1">' +
        '<stop offset="0%" stop-color="#5e4838"/>' +
        '<stop offset="50%" stop-color="#483220"/>' +
        '<stop offset="100%" stop-color="#382218"/>' +
      '</linearGradient>' +
      '<linearGradient id="s-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a3020"/><stop offset="100%" stop-color="#2a1a0a"/></linearGradient>' +
      '<radialGradient id="s-sun" cx="0.42" cy="0.45" r="0.5">' +
        '<stop offset="0%" stop-color="#fffff0" stop-opacity="1"/>' +
        '<stop offset="8%" stop-color="#fff0c0" stop-opacity="0.8"/>' +
        '<stop offset="20%" stop-color="#f0c060" stop-opacity="0.45"/>' +
        '<stop offset="40%" stop-color="#e08840" stop-opacity="0.2"/>' +
        '<stop offset="70%" stop-color="#c06030" stop-opacity="0.08"/>' +
        '<stop offset="100%" stop-color="#a04020" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="s-treeDk" cx="0.4" cy="0.35"><stop offset="0%" stop-color="#305828"/><stop offset="60%" stop-color="#1e4418"/><stop offset="100%" stop-color="#14320e"/></radialGradient>' +
      '<radialGradient id="s-treeLt" cx="0.3" cy="0.3"><stop offset="0%" stop-color="#4a7838"/><stop offset="60%" stop-color="#346228"/><stop offset="100%" stop-color="#244e1c"/></radialGradient>' +
      '<radialGradient id="s-treeMid" cx="0.5" cy="0.4"><stop offset="0%" stop-color="#3a6830"/><stop offset="100%" stop-color="#1c4418"/></radialGradient>' +
      '<radialGradient id="s-windowGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="#f8d070" stop-opacity="0.7"/><stop offset="60%" stop-color="#e8a840" stop-opacity="0.3"/><stop offset="100%" stop-color="#d08020" stop-opacity="0"/></radialGradient>' +
      '<filter id="s-blur"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="s-blur2"><feGaussianBlur stdDeviation="1.5"/></filter>' +
      '<filter id="s-blurSoft"><feGaussianBlur stdDeviation="6"/></filter>' +
      '<filter id="s-shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#0a0a08" flood-opacity="0.35"/></filter>' +
    '</defs>';
  },

  _splashSky() {
    var s = '<rect width="1600" height="900" fill="url(#s-sky)"/>';

    // Atmospheric haze layers near horizon
    s += '<rect x="0" y="420" width="1600" height="120" fill="#e8a040" opacity="0.06"/>';
    s += '<rect x="0" y="460" width="1600" height="80" fill="#f0c060" opacity="0.08"/>';

    // Stars with varied brightness and subtle color
    var stars = [
      [80,18,1.8,0.9],[155,52,1.0,0.5],[240,32,1.4,0.7],[340,14,1.6,0.85],[430,48,0.8,0.4],
      [530,22,1.5,0.75],[650,10,2.0,0.95],[760,38,1.1,0.55],[850,28,1.3,0.65],[960,16,1.7,0.8],
      [1070,42,0.9,0.45],[1180,25,1.5,0.7],[1300,18,1.2,0.6],[1430,35,1.6,0.8],[1530,12,1.1,0.5],
      [120,85,0.7,0.35],[280,72,1.0,0.5],[440,90,0.6,0.3],[590,65,0.9,0.45],[730,80,0.8,0.4],
      [880,68,1.1,0.55],[1020,78,0.7,0.35],[1160,62,0.9,0.45],[1320,88,0.6,0.3],
      [170,130,0.5,0.25],[380,115,0.7,0.35],[540,125,0.6,0.3],[700,108,0.8,0.4],
      [920,120,0.5,0.25],[1100,112,0.7,0.35],[1280,128,0.4,0.2],
      [250,160,0.4,0.2],[500,148,0.5,0.25],[780,155,0.3,0.15],[1050,142,0.5,0.25]
    ];
    s += '<g>';
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      // Larger stars get a subtle glow halo
      if (st[2] > 1.3) {
        s += '<circle cx="'+st[0]+'" cy="'+st[1]+'" r="'+(st[2]*3)+'" fill="#fff" opacity="'+(st[3]*0.08)+'"/>';
      }
      // Slight color variation (blue-white to warm-white for lower stars)
      var starColor = st[1] < 80 ? '#E8E8FF' : '#FFF8F0';
      s += '<circle cx="'+st[0]+'" cy="'+st[1]+'" r="'+st[2]+'" fill="'+starColor+'" opacity="'+st[3]+'"/>';
    }
    s += '</g>';

    // Moon with crater detail
    s += '<g transform="translate(1200, 85)">';
    s += '<circle cx="0" cy="0" r="36" fill="#f4e8d8" opacity="0.15" filter="url(#s-blurSoft)"/>'; // outer glow
    s += '<circle cx="0" cy="0" r="28" fill="#f0e4d0"/>';
    s += '<circle cx="10" cy="-6" r="27" fill="url(#s-sky)"/>'; // crescent mask
    // Subtle crater texture on lit part
    s += '<circle cx="-8" cy="-4" r="3" fill="#e8dcc4" opacity="0.4"/>';
    s += '<circle cx="-14" cy="6" r="2" fill="#e0d4bc" opacity="0.3"/>';
    s += '<circle cx="-4" cy="10" r="2.5" fill="#e4d8c0" opacity="0.35"/>';
    s += '</g>';

    // Sun glow - multiple layers for richer light bleed
    s += '<ellipse cx="480" cy="525" rx="400" ry="220" fill="url(#s-sun)"/>';
    s += '<ellipse cx="480" cy="530" rx="250" ry="120" fill="#f0c060" opacity="0.08" filter="url(#s-blurSoft)"/>';
    // Horizon light band
    s += '<rect x="0" y="500" width="1600" height="8" fill="#f8d880" opacity="0.12"/>';

    return s;
  },

  _splashClouds() {
    var s = '';
    // High cirrus wisps (purple/blue tinted)
    s += '<g opacity="0.15">';
    s += '<path d="M100,200 Q180,195 250,202 Q310,198 380,205" fill="none" stroke="#7868a8" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="M500,185 Q600,178 720,188 Q790,182 850,190" fill="none" stroke="#7060a0" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M1000,210 Q1080,204 1180,212 Q1250,206 1320,215" fill="none" stroke="#7868a8" stroke-width="2" stroke-linecap="round"/>';
    s += '</g>';

    // Mid-altitude clouds with volume (multiple overlapping ellipses per cloud)
    // Cloud 1 - large, left
    s += '<g opacity="0.18">';
    s += '<ellipse cx="250" cy="310" rx="110" ry="18" fill="#c88858"/>';
    s += '<ellipse cx="280" cy="306" rx="80" ry="14" fill="#d89868"/>';
    s += '<ellipse cx="220" cy="314" rx="60" ry="10" fill="#c88050"/>';
    s += '<ellipse cx="310" cy="312" rx="50" ry="12" fill="#d09060"/>';
    s += '</g>';
    // Cloud 2 - mid
    s += '<g opacity="0.22">';
    s += '<ellipse cx="650" cy="340" rx="140" ry="16" fill="#d49060"/>';
    s += '<ellipse cx="690" cy="336" rx="100" ry="13" fill="#e0a070"/>';
    s += '<ellipse cx="610" cy="343" rx="70" ry="10" fill="#c88050"/>';
    s += '<ellipse cx="740" cy="338" rx="60" ry="11" fill="#d89868"/>';
    s += '<ellipse cx="670" cy="332" rx="50" ry="8" fill="#e8b080"/>';
    s += '</g>';
    // Cloud 3 - right
    s += '<g opacity="0.16">';
    s += '<ellipse cx="1100" cy="325" rx="120" ry="15" fill="#c88858"/>';
    s += '<ellipse cx="1140" cy="321" rx="80" ry="12" fill="#d89868"/>';
    s += '<ellipse cx="1060" cy="328" rx="55" ry="9" fill="#c08048"/>';
    s += '</g>';
    // Cloud 4 - far left wisp
    s += '<g opacity="0.12">';
    s += '<ellipse cx="80" cy="350" rx="70" ry="10" fill="#c88858"/>';
    s += '<ellipse cx="100" cy="347" rx="45" ry="7" fill="#d89868"/>';
    s += '</g>';
    // Cloud 5 - far right
    s += '<g opacity="0.14">';
    s += '<ellipse cx="1400" cy="335" rx="90" ry="12" fill="#c88858"/>';
    s += '<ellipse cx="1430" cy="332" rx="60" ry="9" fill="#d89868"/>';
    s += '</g>';

    // Tiny scattered puffs near horizon for depth
    s += '<g opacity="0.1">';
    for (var cx = 50; cx < 1550; cx += 120 + Math.floor(Math.sin(cx) * 30)) {
      var cy = 370 + Math.sin(cx * 0.02) * 15;
      var cr = 20 + Math.sin(cx * 0.05) * 10;
      s += '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+cr+'" ry="'+(cr*0.4)+'" fill="#d09060"/>';
    }
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

    // Tree 1 (main, large deciduous)
    s += '<path d="M-2,5 L-3,-10 Q-5,-25 -2,-45 L0,-55 L2,-45 Q5,-25 3,-10 L2,5Z" fill="#38280e" opacity="0.9"/>';
    // Main branches
    s += '<path d="M-2,-25 Q-18,-35 -25,-30" fill="none" stroke="#38280e" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M2,-20 Q20,-28 28,-22" fill="none" stroke="#38280e" stroke-width="2" stroke-linecap="round"/>';
    s += '<path d="M-1,-38 Q-12,-48 -16,-42" fill="none" stroke="#38280e" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<path d="M1,-35 Q14,-45 18,-38" fill="none" stroke="#38280e" stroke-width="1.5" stroke-linecap="round"/>';
    // Foliage - irregular clusters, not ellipses
    s += '<path d="M-30,-28 Q-28,-42 -18,-48 Q-8,-55 2,-52 Q12,-58 22,-50 Q32,-42 30,-30 Q34,-22 28,-16 Q22,-10 12,-14 Q2,-8 -10,-12 Q-22,-8 -28,-18 Q-34,-24 -30,-28Z" fill="url(#s-treeDk)"/>';
    s += '<path d="M-22,-34 Q-18,-48 -6,-52 Q6,-56 16,-48 Q24,-40 20,-28 Q14,-22 4,-26 Q-8,-20 -18,-28Z" fill="url(#s-treeMid)" opacity="0.8"/>';
    // Highlight cluster (sun-facing side - left)
    s += '<path d="M-26,-30 Q-24,-42 -14,-46 Q-6,-50 -2,-44 Q-8,-36 -16,-32 Q-24,-26 -26,-30Z" fill="url(#s-treeLt)" opacity="0.6"/>';
    // Deep shadow cluster (right side)
    s += '<path d="M16,-20 Q22,-28 26,-24 Q28,-18 22,-14 Q16,-16 16,-20Z" fill="#122e0e" opacity="0.4"/>';

    // Tree 2 (smaller, offset right)
    s += '<path d="M38,10 L37,0 Q36,-8 38,-18 L38,-22 Q40,-8 39,0Z" fill="#342408" opacity="0.85"/>';
    s += '<path d="M38,-18 Q32,-22 28,-18" fill="none" stroke="#342408" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<path d="M24,-16 Q20,-28 28,-34 Q36,-38 44,-32 Q50,-26 46,-18 Q40,-12 32,-16 Q26,-12 24,-16Z" fill="url(#s-treeDk)"/>';
    s += '<path d="M28,-22 Q34,-32 40,-28 Q44,-22 38,-18 Q32,-16 28,-22Z" fill="url(#s-treeLt)" opacity="0.5"/>';

    // Tree 3 (left, medium)
    s += '<path d="M-44,12 L-45,2 Q-46,-6 -44,-16 L-43,-20 Q-42,-6 -43,2Z" fill="#342408" opacity="0.85"/>';
    s += '<path d="M-44,-14 Q-52,-18 -55,-12" fill="none" stroke="#342408" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<path d="M-58,-10 Q-54,-24 -44,-28 Q-34,-32 -28,-24 Q-24,-16 -30,-10 Q-38,-6 -48,-8 Q-56,-6 -58,-10Z" fill="url(#s-treeMid)"/>';
    s += '<path d="M-54,-14 Q-50,-24 -42,-26 Q-36,-22 -40,-14 Q-48,-10 -54,-14Z" fill="url(#s-treeLt)" opacity="0.5"/>';

    s += '</g>';
    return s;
  },

  _splashMansion() {
    var s = '<g transform="translate(520, 455)" filter="url(#s-shadow)">';

    // === Ground shadow (elongated, warm) ===
    s += '<ellipse cx="260" cy="148" rx="320" ry="20" fill="#08120a" opacity="0.3"/>';

    // === LEFT WING (slightly recessed, narrower) ===
    s += '<g>';
    // Wall - warm lit face
    s += '<rect x="8" y="55" width="130" height="88" fill="url(#s-wall-warm)" stroke="#b8a888" stroke-width="0.8"/>';
    s += '<rect x="8" y="55" width="130" height="88" fill="url(#s-warmface)"/>'; // warm light overlay
    // Hipped roof with slight overhang
    s += '<polygon points="2,55 73,28 142,55" fill="url(#s-roof)" stroke="#4a3a2a" stroke-width="1"/>';
    // Roof tiles suggestion
    s += '<g stroke="#4a3a28" stroke-width="0.3" opacity="0.4">';
    for (var ry = 35; ry < 55; ry += 4) {
      var rx1 = 2 + (ry - 28) * 2.5, rx2 = 142 - (ry - 28) * 2.5;
      s += '<line x1="'+rx1+'" y1="'+ry+'" x2="'+rx2+'" y2="'+ry+'"/>';
    }
    s += '</g>';
    // Left wing windows - varied sizes, not uniform
    s += '<g fill="#3a4a68" stroke="#a09070" stroke-width="0.6">';
    // Upper floor - tall arched
    var lwx = [22, 52, 82, 110];
    for (var i = 0; i < lwx.length; i++) {
      var ww = i === 1 ? 16 : 14, wh = i === 1 ? 22 : 18;
      s += '<rect x="'+lwx[i]+'" y="62" width="'+ww+'" height="'+wh+'" rx="'+(ww/2)+'" ry="'+(ww/2)+'"/>';
      // Mullion
      s += '<line x1="'+(lwx[i]+ww/2)+'" y1="62" x2="'+(lwx[i]+ww/2)+'" y2="'+(62+wh)+'" stroke="#5a6a80" stroke-width="0.4"/>';
    }
    // Lower floor - rectangular with prominent sills and lintels
    var lwx2 = [20, 50, 80, 108];
    for (var i = 0; i < lwx2.length; i++) {
      s += '<rect x="'+lwx2[i]+'" y="96" width="15" height="18" rx="1"/>';
      s += '<rect x="'+(lwx2[i]-2)+'" y="95" width="19" height="2" fill="#d8c8a8"/>'; // lintel
      s += '<rect x="'+(lwx2[i]-2)+'" y="114" width="19" height="2.5" fill="#d0c0a0"/>'; // sill
    }
    s += '</g>';
    // Left chimney (slightly off-center, realistic)
    s += '<rect x="42" y="18" width="10" height="15" fill="#6a5a48"/>';
    s += '<rect x="40" y="16" width="14" height="3" fill="#7a6a58"/>';
    s += '<rect x="41" y="14" width="12" height="2.5" fill="#8a7a68"/>';
    s += '</g>';

    // === MAIN BUILDING (center, taller, grander) ===
    s += '<g>';
    s += '<rect x="130" y="28" width="260" height="115" fill="url(#s-wall)" stroke="#b0a080" stroke-width="1"/>';
    s += '<rect x="130" y="28" width="130" height="115" fill="url(#s-warmface)"/>'; // sun hits left half
    s += '<rect x="260" y="28" width="130" height="115" fill="url(#s-coolshade)"/>'; // shadow on right
    // Stone quoin details on corners
    s += '<g fill="#dcd0b8" opacity="0.6">';
    for (var qy = 30; qy < 140; qy += 12) {
      s += '<rect x="130" y="'+qy+'" width="6" height="10" rx="0.5"/>';
      s += '<rect x="384" y="'+qy+'" width="6" height="10" rx="0.5"/>';
    }
    s += '</g>';
    // Cornice / entablature
    s += '<rect x="126" y="26" width="268" height="4" fill="#d8c8a8" stroke="#b8a888" stroke-width="0.4"/>';
    s += '<rect x="128" y="22" width="264" height="5" fill="#e0d0b4"/>';
    // String course between floors
    s += '<rect x="130" y="82" width="260" height="2.5" fill="#d4c4a4" opacity="0.7"/>';

    // Main roof - steeper pitch, with slight irregularity
    s += '<polygon points="118,28 260,-8 402,28" fill="url(#s-roof)" stroke="#42302a" stroke-width="1"/>';
    // Roof tile rows
    s += '<g stroke="#3a2818" stroke-width="0.25" opacity="0.35">';
    for (var ry = 0; ry < 28; ry += 3) {
      var factor = ry / 36;
      var x1 = 118 + (260-118) * factor;
      var x2 = 402 - (402-260) * factor;
      s += '<line x1="'+x1+'" y1="'+(28-ry*0)+'" x2="'+x2+'" y2="'+(28-ry*0)+'"/>';
    }
    s += '</g>';
    // Ridge ornament - more elaborate
    s += '<rect x="252" y="-12" width="16" height="6" fill="#8a7a5a" rx="1"/>';
    s += '<polygon points="256,-12 260,-18 264,-12" fill="#8a7a5a"/>';

    // === DORMER WINDOWS (3, varied) ===
    var dormers = [{x:180,w:18},{x:252,w:20},{x:330,w:18}];
    for (var di = 0; di < dormers.length; di++) {
      var d = dormers[di];
      var dh = 14, dRoofH = 8;
      s += '<rect x="'+d.x+'" y="'+(28-dh-2)+'" width="'+d.w+'" height="'+(dh+4)+'" fill="url(#s-wall)" stroke="#b0a080" stroke-width="0.5"/>';
      s += '<polygon points="'+(d.x-2)+','+(28-dh-2)+' '+(d.x+d.w/2)+','+(28-dh-2-dRoofH)+' '+(d.x+d.w+2)+','+(28-dh-2)+'" fill="url(#s-roof)" stroke="#42302a" stroke-width="0.5"/>';
      s += '<rect x="'+(d.x+3)+'" y="'+(28-dh+1)+'" width="'+(d.w-6)+'" height="'+(dh-2)+'" fill="#4a5a78" rx="'+(d.w/4)+'" ry="'+(d.w/4)+'" stroke="#8a7a60" stroke-width="0.3"/>';
    }

    // === WINDOWS - upper floor (piano nobile - tallest, most ornate) ===
    s += '<g>';
    var uwx = [148,175,202,229, 290,317,344,371];
    for (var i = 0; i < uwx.length; i++) {
      var wx = uwx[i], ww = 15, wh = 26;
      // Pediment above window (alternating triangular / segmental)
      if (i % 2 === 0) {
        s += '<polygon points="'+(wx-2)+',38 '+(wx+ww/2)+',32 '+(wx+ww+2)+',38" fill="#d8c8a8" stroke="#b8a888" stroke-width="0.4"/>';
      } else {
        s += '<path d="M'+(wx-2)+',38 Q'+(wx+ww/2)+',33 '+(wx+ww+2)+',38" fill="#d8c8a8" stroke="#b8a888" stroke-width="0.4"/>';
      }
      s += '<rect x="'+wx+'" y="40" width="'+ww+'" height="'+wh+'" rx="'+(ww/2)+'" ry="'+(ww/2)+'" fill="#3a4a68" stroke="#9a8a68" stroke-width="0.6"/>';
      // Glazing bars
      s += '<line x1="'+(wx+ww/2)+'" y1="40" x2="'+(wx+ww/2)+'" y2="'+(40+wh)+'" stroke="#5a6a88" stroke-width="0.4"/>';
      s += '<line x1="'+wx+'" y1="'+(40+wh*0.5)+'" x2="'+(wx+ww)+'" y2="'+(40+wh*0.5)+'" stroke="#5a6a88" stroke-width="0.4"/>';
      // Sill with bracket
      s += '<rect x="'+(wx-2)+'" y="'+(40+wh)+'" width="'+(ww+4)+'" height="2.5" fill="#d0c0a0"/>';
      // Balconette ironwork on piano nobile
      s += '<rect x="'+(wx-3)+'" y="'+(40+wh+3)+'" width="'+(ww+6)+'" height="4" fill="none" stroke="#3a3a3a" stroke-width="0.6" rx="1"/>';
    }
    s += '</g>';

    // === WINDOWS - lower floor (shorter, simpler) ===
    s += '<g fill="#3a4868">';
    var lwx = [150,178,206, 292,320,348,374];
    for (var i = 0; i < lwx.length; i++) {
      var wx = lwx[i], ww = 14, wh = 20;
      s += '<rect x="'+wx+'" y="90" width="'+ww+'" height="'+wh+'" fill="#3a4868" stroke="#9a8a68" stroke-width="0.5" rx="1"/>';
      s += '<line x1="'+(wx+ww/2)+'" y1="90" x2="'+(wx+ww/2)+'" y2="'+(90+wh)+'" stroke="#5a6a80" stroke-width="0.3"/>';
      s += '<rect x="'+(wx-1)+'" y="'+(90+wh)+'" width="'+(ww+2)+'" height="2" fill="#d0c0a0"/>';
    }
    s += '</g>';

    // === GRAND ENTRANCE (portico) ===
    // Raised portico base
    s += '<rect x="228" y="128" width="64" height="15" fill="#d4c8b0" stroke="#b8a890" stroke-width="0.5"/>';
    // Four columns (not two) - Corinthian style
    var colX = [232, 248, 268, 284];
    for (var i = 0; i < colX.length; i++) {
      var cx = colX[i];
      // Column shaft with entasis (slight bulge)
      s += '<path d="M'+cx+',68 Q'+(cx+0.5)+',98 '+cx+',128" fill="none" stroke="#e4d8c4" stroke-width="5"/>';
      s += '<path d="M'+cx+',68 Q'+(cx+0.3)+',98 '+cx+',128" fill="none" stroke="#ece0cc" stroke-width="3"/>';
      // Capital
      s += '<rect x="'+(cx-4)+'" y="66" width="8" height="3" fill="#dcd0b8"/>';
      s += '<rect x="'+(cx-3.5)+'" y="64" width="7" height="2.5" fill="#e4d8c0"/>';
      // Base
      s += '<rect x="'+(cx-3.5)+'" y="126" width="7" height="3" fill="#d0c4ac"/>';
    }
    // Pediment (triangular, larger)
    s += '<polygon points="222,66 260,44 298,66" fill="url(#s-roof)" stroke="#42302a" stroke-width="0.8"/>';
    // Tympanum ornament (coat of arms suggestion)
    s += '<circle cx="260" cy="56" r="5" fill="#c8b898" stroke="#a09070" stroke-width="0.5"/>';
    s += '<path d="M257,56 L260,52 L263,56 L260,60Z" fill="#b8a888"/>';
    // Grand doorway
    s += '<rect x="245" y="86" width="30" height="42" fill="url(#s-door)" rx="15" ry="15"/>';
    s += '<rect x="245" y="105" width="30" height="23" fill="url(#s-door)"/>';
    s += '<line x1="260" y1="105" x2="260" y2="128" stroke="#4a3828" stroke-width="0.8"/>';
    // Fanlight above door
    s += '<path d="M245,86 Q260,78 275,86" fill="#4a5a70" stroke="#8a7a60" stroke-width="0.5"/>';
    // Brass handles
    s += '<circle cx="255" cy="116" r="1.2" fill="#c8a858"/>';
    s += '<circle cx="265" cy="116" r="1.2" fill="#c8a858"/>';
    // Steps (wider, grander, 5 steps)
    for (var si = 0; si < 5; si++) {
      var sw = 56 + si * 8, sx = 232 - si * 4, sy = 128 + si * 4;
      s += '<rect x="'+sx+'" y="'+sy+'" width="'+sw+'" height="4" fill="rgb('+(212-si*5)+','+(204-si*5)+','+(188-si*5)+')" rx="0.5"/>';
    }

    // === RIGHT WING (slightly different from left - asymmetry) ===
    s += '<g>';
    s += '<rect x="382" y="52" width="115" height="92" fill="url(#s-wall)" stroke="#b8a888" stroke-width="0.8"/>';
    s += '<rect x="382" y="52" width="115" height="92" fill="url(#s-coolshade)"/>'; // in shadow
    // Different roof style - hip + gable mix
    s += '<polygon points="376,52 440,24 502,52" fill="url(#s-roof)" stroke="#42302a" stroke-width="1"/>';
    // Right wing windows
    s += '<g fill="#3a4a68" stroke="#a09070" stroke-width="0.6">';
    var rwx = [395, 423, 455, 478];
    for (var i = 0; i < rwx.length; i++) {
      var ww = i === 2 ? 16 : 13;
      s += '<rect x="'+rwx[i]+'" y="62" width="'+ww+'" height="18" rx="'+(ww/2)+'" ry="'+(ww/2)+'"/>';
      s += '<rect x="'+rwx[i]+'" y="98" width="'+ww+'" height="16" rx="1"/>';
      s += '<rect x="'+(rwx[i]-1)+'" y="114" width="'+(ww+2)+'" height="2" fill="#ccc0a8"/>';
    }
    s += '</g>';
    // Right chimney - different position than left
    s += '<rect x="460" y="14" width="10" height="16" fill="#6a5a48"/>';
    s += '<rect x="458" y="12" width="14" height="3" fill="#7a6a58"/>';
    s += '<rect x="459" y="10" width="12" height="2.5" fill="#8a7a68"/>';
    s += '</g>';

    // === MAIN CHIMNEYS (central, slightly different heights) ===
    s += '<rect x="172" y="-14" width="11" height="28" fill="#6a5a48"/>';
    s += '<rect x="170" y="-16" width="15" height="3.5" fill="#7a6a58"/>';
    s += '<rect x="340" y="-10" width="10" height="24" fill="#6a5a48"/>';
    s += '<rect x="338" y="-12" width="14" height="3" fill="#7a6a58"/>';

    // Chimney smoke (very subtle, wispy)
    s += '<g opacity="0.08" fill="none" stroke="#b8b0a0" stroke-width="1.5" stroke-linecap="round">';
    s += '<path d="M178,-16 Q182,-30 176,-42 Q170,-55 178,-68 Q184,-80 178,-92"/>';
    s += '<path d="M345,-12 Q350,-24 344,-36 Q338,-48 345,-58"/>';
    s += '</g>';

    // === WINDOW GLOW (warm interior light - selective, not uniform) ===
    s += '<g>';
    // Grand entrance glow
    s += '<rect x="247" y="90" width="26" height="35" fill="url(#s-windowGlow)" rx="1"/>';
    // A few lit windows (randomish, not all)
    var litWindows = [[150,42,14,24],[229,42,14,24],[344,42,14,24],[178,90,14,20],[320,90,14,20],[50,96,12,14],[423,98,13,16]];
    for (var i = 0; i < litWindows.length; i++) {
      var lw = litWindows[i];
      s += '<rect x="'+lw[0]+'" y="'+lw[1]+'" width="'+lw[2]+'" height="'+lw[3]+'" fill="url(#s-windowGlow)" rx="1"/>';
    }
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
    var s = '';
    // Mid-ground hill with undulation
    s += '<path d="M0,610 Q100,592 200,602 Q320,588 450,600 Q580,586 700,598 Q830,584 960,596 Q1100,582 1250,595 Q1400,585 1550,600 L1600,598 L1600,900 L0,900Z" fill="url(#s-hill2)"/>';
    // Grass texture on mid hill
    s += '<g stroke="#1a3420" stroke-width="0.6" opacity="0.2">';
    for (var gx = 20; gx < 1580; gx += 15) {
      var gy = 610 + Math.sin(gx * 0.03) * 8 - 6;
      s += '<path d="M'+gx+','+gy+' Q'+(gx+2)+','+(gy-6)+' '+(gx+4)+','+gy+'" fill="none"/>';
    }
    s += '</g>';

    // Foreground hill (darkest)
    s += '<path d="M0,660 Q120,642 250,655 Q400,638 550,650 Q720,635 880,648 Q1050,636 1200,650 Q1380,640 1550,655 L1600,652 L1600,900 L0,900Z" fill="url(#s-hill3)"/>';
    // Foreground grass detail
    s += '<g stroke="#0e1c10" stroke-width="0.7" opacity="0.25">';
    for (var gx = 10; gx < 1590; gx += 12) {
      var gy = 660 + Math.sin(gx * 0.025) * 6 - 3;
      s += '<path d="M'+gx+','+gy+' Q'+(gx+1.5)+','+(gy-7)+' '+(gx+3)+','+gy+'" fill="none"/>';
      if (gx % 36 === 0) s += '<path d="M'+(gx+5)+','+(gy+1)+' Q'+(gx+6.5)+','+(gy-5)+' '+(gx+8)+','+(gy+1)+'" fill="none"/>';
    }
    s += '</g>';

    return s;
  },

  _splashForegroundTrees() {
    var s = '';
    // Large detailed trees - each unique silhouette
    // Left large oak
    s += '<g transform="translate(70,625) scale(1.3)">';
    s += '<path d="M-5,5 L-7,-15 Q-9,-30 -5,-50 L-3,-65 Q0,-50 4,-30 Q6,-15 4,5Z" fill="#2c1c08"/>';
    s += '<path d="M-5,-30 Q-22,-40 -30,-32" fill="none" stroke="#2c1c08" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="M4,-22 Q24,-30 32,-20" fill="none" stroke="#2c1c08" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M-3,-48 Q-16,-58 -22,-50" fill="none" stroke="#2c1c08" stroke-width="2" stroke-linecap="round"/>';
    s += '<path d="M2,-45 Q18,-56 24,-46" fill="none" stroke="#2c1c08" stroke-width="1.8" stroke-linecap="round"/>';
    s += '<path d="M-35,-28 Q-32,-48 -18,-56 Q-4,-64 10,-60 Q24,-66 34,-54 Q42,-42 36,-28 Q40,-18 30,-12 Q18,-4 6,-10 Q-6,-2 -20,-10 Q-32,-6 -38,-18Z" fill="#102a0e"/>';
    s += '<path d="M-28,-34 Q-22,-50 -10,-54 Q4,-58 14,-48 Q20,-38 14,-26 Q4,-20 -8,-26 Q-20,-18 -28,-28Z" fill="#1a3a16" opacity="0.7"/>';
    s += '<path d="M-32,-30 Q-28,-44 -18,-48 Q-10,-42 -16,-32 Q-26,-24 -32,-30Z" fill="#244a1e" opacity="0.5"/>';
    s += '</g>';

    // Right large elm (different shape - more vertical)
    s += '<g transform="translate(1420,618) scale(1.25)">';
    s += '<path d="M-4,8 L-5,-18 Q-4,-38 -2,-55 L0,-68 Q2,-55 4,-38 Q5,-18 4,8Z" fill="#2c1c08"/>';
    s += '<path d="M-3,-35 Q-20,-42 -26,-34" fill="none" stroke="#2c1c08" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M3,-30 Q22,-38 28,-28" fill="none" stroke="#2c1c08" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<path d="M0,-50 Q-10,-60 -14,-52" fill="none" stroke="#2c1c08" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<path d="M0,-48 Q12,-58 16,-48" fill="none" stroke="#2c1c08" stroke-width="1.5" stroke-linecap="round"/>';
    // Taller, narrower canopy
    s += '<path d="M-22,-30 Q-20,-50 -12,-60 Q0,-70 12,-60 Q20,-50 22,-30 Q26,-20 18,-12 Q8,-6 -4,-8 Q-16,-4 -22,-14 Q-26,-22 -22,-30Z" fill="#102a0e"/>';
    s += '<path d="M-14,-38 Q-8,-56 6,-58 Q16,-50 12,-34 Q4,-28 -6,-32 Q-14,-28 -14,-38Z" fill="#183818" opacity="0.7"/>';
    s += '</g>';

    // Smaller flanking trees
    s += '<g transform="translate(170,638) scale(0.85)">';
    s += '<path d="M-2,4 L-3,-12 Q-2,-24 0,-35 Q2,-24 3,-12 L2,4Z" fill="#2c1c08"/>';
    s += '<path d="M-18,-15 Q-14,-32 -4,-36 Q8,-40 18,-32 Q24,-22 18,-12 Q8,-6 -4,-10 Q-16,-4 -18,-15Z" fill="#14320e"/>';
    s += '<path d="M-12,-20 Q-6,-30 4,-28 Q10,-22 6,-14 Q-2,-10 -12,-16Z" fill="#1e4218" opacity="0.6"/>';
    s += '</g>';

    s += '<g transform="translate(1530,632) scale(0.9)">';
    s += '<path d="M-2,4 L-3,-14 Q-1,-28 0,-38 Q1,-28 3,-14 L2,4Z" fill="#2c1c08"/>';
    s += '<path d="M-20,-18 Q-16,-36 -4,-40 Q10,-44 20,-34 Q26,-24 20,-14 Q8,-6 -6,-12 Q-18,-6 -20,-18Z" fill="#14320e"/>';
    s += '</g>';

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


  // ========== WORLD MAP — Premium Illustrated Atlas ==========
  renderWorldMap(svgEl) {
    svgEl.setAttribute('viewBox', '0 0 1600 800');
    svgEl.innerHTML =
      this._wmDefs() +
      this._wmOcean() +
      this._wmContinents() +
      this._wmTerrain() +
      this._wmCoastalShading() +
      this._wmCoastHatching() +
      this._wmShips() +
      this._wmAgedOverlay() +
      this._wmBorder() +
      this._wmCartouche();
  },

  _wmDefs() {
    return '<defs>' +
      // Parchment-toned ocean — warm, aged, not sterile blue
      '<linearGradient id="wm-ocean" x1="0" y1="0" x2="0.15" y2="1">' +
        '<stop offset="0%" stop-color="#5B8EA8"/>' +
        '<stop offset="25%" stop-color="#4E7E98"/>' +
        '<stop offset="50%" stop-color="#436E88"/>' +
        '<stop offset="75%" stop-color="#3A6078"/>' +
        '<stop offset="100%" stop-color="#2E5068"/>' +
      '</linearGradient>' +
      // Ocean depth overlay — darker in center/deep areas
      '<radialGradient id="wm-deep1" cx="0.35" cy="0.65" r="0.35">' +
        '<stop offset="0%" stop-color="#1A3848" stop-opacity="0.2"/>' +
        '<stop offset="100%" stop-color="#1A3848" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="wm-deep2" cx="0.75" cy="0.45" r="0.3">' +
        '<stop offset="0%" stop-color="#1A3848" stop-opacity="0.15"/>' +
        '<stop offset="100%" stop-color="#1A3848" stop-opacity="0"/>' +
      '</radialGradient>' +
      // Terrain fills
      '<linearGradient id="wm-green" x1="0" y1="0" x2="0.2" y2="1">' +
        '<stop offset="0%" stop-color="#6A9A58"/>' +
        '<stop offset="50%" stop-color="#548844"/>' +
        '<stop offset="100%" stop-color="#447838"/>' +
      '</linearGradient>' +
      '<linearGradient id="wm-desert" x1="0" y1="0" x2="0.3" y2="1">' +
        '<stop offset="0%" stop-color="#D4BC88"/>' +
        '<stop offset="50%" stop-color="#C8AE78"/>' +
        '<stop offset="100%" stop-color="#BCA068"/>' +
      '</linearGradient>' +
      '<linearGradient id="wm-tundra" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#8A9A7A"/>' +
        '<stop offset="100%" stop-color="#7A8A6A"/>' +
      '</linearGradient>' +
      '<linearGradient id="wm-ice" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#E4ECF0"/>' +
        '<stop offset="100%" stop-color="#CCD8E0"/>' +
      '</linearGradient>' +
      '<linearGradient id="wm-mtn" x1="0" y1="0" x2="0.5" y2="1">' +
        '<stop offset="0%" stop-color="#8A7A68"/>' +
        '<stop offset="40%" stop-color="#7A6A58"/>' +
        '<stop offset="100%" stop-color="#5A5040"/>' +
      '</linearGradient>' +
      '<linearGradient id="wm-forest" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#3A6830"/>' +
        '<stop offset="100%" stop-color="#2A5020"/>' +
      '</linearGradient>' +
      // Coastal shelf — lighter water near shore
      '<radialGradient id="wm-shelf">' +
        '<stop offset="0%" stop-color="#6AA0B8" stop-opacity="0.35"/>' +
        '<stop offset="100%" stop-color="#6AA0B8" stop-opacity="0"/>' +
      '</radialGradient>' +
      // Land shadow (south/east edge of continents)
      '<filter id="wm-lsh"><feDropShadow dx="3" dy="4" stdDeviation="4" flood-color="#1A2A18" flood-opacity="0.25"/></filter>' +
      // Soft blur for atmosphere
      '<filter id="wm-blur"><feGaussianBlur stdDeviation="2"/></filter>' +
      // Parchment texture pattern
      '<pattern id="wm-parch" width="200" height="200" patternUnits="userSpaceOnUse">' +
        '<rect width="200" height="200" fill="#D8C8A8" opacity="0.03"/>' +
        '<circle cx="50" cy="80" r="30" fill="#C8B898" opacity="0.02"/>' +
        '<circle cx="150" cy="40" r="25" fill="#D0C0A0" opacity="0.015"/>' +
        '<circle cx="100" cy="160" r="35" fill="#C0B090" opacity="0.02"/>' +
      '</pattern>' +
      // Wave pattern — subtle, hand-drawn feel
      '<pattern id="wm-wave" width="80" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-3)">' +
        '<path d="M0,8 Q20,4 40,8 Q60,12 80,8" fill="none" stroke="#5A8EA8" stroke-width="0.5" opacity="0.12"/>' +
      '</pattern>' +
      // Stipple/noise pattern for aged parchment
      '<filter id="wm-noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>' +
        '<feColorMatrix type="saturate" values="0"/>' +
        '<feComponentTransfer><feFuncA type="linear" slope="0.06" intercept="0"/></feComponentTransfer>' +
        '<feBlend in="SourceGraphic" mode="multiply"/>' +
      '</filter>' +
      // Coastline hatch pattern
      '<pattern id="wm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<line x1="0" y1="0" x2="0" y2="6" stroke="#3A5A48" stroke-width="0.4" opacity="0.15"/>' +
      '</pattern>' +
    '</defs>';
  },

  _wmOcean() {
    var s = '';
    // Base ocean
    s += '<rect width="1600" height="800" fill="url(#wm-ocean)"/>';
    // Depth variation
    s += '<rect width="1600" height="800" fill="url(#wm-deep1)"/>';
    s += '<rect width="1600" height="800" fill="url(#wm-deep2)"/>';
    // Wave texture
    s += '<rect width="1600" height="800" fill="url(#wm-wave)"/>';
    // Parchment overlay for aged feel
    s += '<rect width="1600" height="800" fill="url(#wm-parch)"/>';

    // Warm equatorial band
    s += '<rect x="0" y="340" width="1600" height="120" fill="#8AA868" opacity="0.03"/>';

    // Latitude lines — faint, hand-drawn style
    s += '<g stroke="#6A9AB0" stroke-width="0.4" opacity="0.08" stroke-dasharray="12,8">';
    s += '<path d="M0,200 Q400,198 800,201 Q1200,199 1600,200"/>'; // not perfectly straight
    s += '<path d="M0,400 Q400,402 800,399 Q1200,401 1600,400"/>';
    s += '<path d="M0,600 Q400,598 800,601 Q1200,599 1600,600"/>';
    s += '</g>';

    return s;
  },

  _wmContinents() {
    var s = '<g filter="url(#wm-lsh)">';

    // ===== NORTH AMERICA — with Gulf, Great Lakes, Florida, Baja =====
    s += '<path d="M85,100 C105,85 135,78 165,72 C195,68 225,65 255,62 C280,60 305,65 330,72 ' +
      'C352,78 372,88 390,102 C405,115 415,130 420,148 C425,165 422,182 418,198 ' +
      'C412,215 420,230 425,245 C430,258 428,272 418,285 C408,298 395,308 382,315 ' +
      'C368,322 355,328 342,335 C328,342 315,348 302,352 C288,356 272,358 258,355 ' +
      'C245,352 232,345 218,340 C205,335 192,338 178,345 C165,352 150,348 138,340 ' +
      'C125,330 115,318 105,305 C95,290 88,275 82,258 C78,240 75,222 74,202 ' +
      'C73,182 75,162 80,142 C85,122 88,110 85,100Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1.2"/>';

    // Florida peninsula
    s += '<path d="M302,352 C305,360 310,370 318,378 C322,382 320,386 315,388 ' +
      'C308,385 302,378 298,368 C295,360 298,355 302,352Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';

    // Alaska hint
    s += '<path d="M60,80 C72,72 88,75 95,82 C98,88 92,95 85,98 C78,100 68,95 62,88 C58,84 58,80 60,80Z" fill="url(#wm-tundra)" stroke="#6A7A5A" stroke-width="0.8"/>';

    // Greenland
    s += '<path d="M365,38 C385,28 408,32 425,42 C438,52 442,68 435,80 C425,90 410,92 395,88 ' +
      'C380,82 370,72 365,60 C362,50 360,42 365,38Z" fill="url(#wm-ice)" stroke="#A0B0B8" stroke-width="0.8"/>';

    // Central America — thin isthmus
    s += '<path d="M268,352 C278,348 288,350 295,358 C300,365 305,372 308,380 ' +
      'C310,388 305,395 298,398 C290,400 282,395 275,388 C268,380 262,370 260,362 C258,355 262,352 268,352Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';

    // Caribbean islands
    s += '<g fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.5">';
    s += '<ellipse cx="335" cy="365" rx="8" ry="3" transform="rotate(-15,335,365)"/>';
    s += '<ellipse cx="348" cy="372" rx="6" ry="2.5"/>';
    s += '<ellipse cx="358" cy="378" rx="5" ry="2" transform="rotate(10,358,378)"/>';
    s += '<ellipse cx="342" cy="358" rx="4" ry="1.8"/>';
    s += '</g>';

    // ===== SOUTH AMERICA — with Patagonia taper =====
    s += '<path d="M305,418 C328,405 355,408 378,420 C398,432 412,450 422,472 ' +
      'C432,498 435,528 432,558 C428,588 418,615 405,638 C392,658 375,672 358,682 ' +
      'C342,690 325,692 312,685 C298,678 288,665 278,648 C268,630 262,608 258,585 ' +
      'C254,562 252,538 255,515 C258,492 265,470 278,452 C288,438 298,428 305,418Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1.2"/>';
    // Patagonia tip
    s += '<path d="M335,685 C338,692 340,700 338,708 C335,712 330,710 328,705 C326,698 330,690 335,685Z" fill="url(#wm-tundra)" stroke="#6A7A5A" stroke-width="0.6"/>';

    // ===== EUROPE — with Iberia, Italy, Scandinavia, Balkans =====
    s += '<path d="M608,85 C635,72 665,75 690,82 C712,88 730,78 748,82 ' +
      'C765,88 778,100 782,118 C785,135 778,152 768,165 C758,175 745,180 732,185 ' +
      'C718,190 705,185 692,182 C678,178 665,185 652,182 C640,178 628,170 620,158 ' +
      'C612,145 608,130 606,115 C605,100 605,90 608,85Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1.2"/>';

    // Iberian peninsula
    s += '<path d="M618,165 C622,172 628,178 635,182 C640,185 638,192 632,195 ' +
      'C625,198 618,195 612,190 C608,185 608,178 610,172 C612,168 615,165 618,165Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';

    // Italian boot
    s += '<path d="M700,165 C705,172 708,180 712,188 C715,195 712,202 708,208 ' +
      'C705,210 700,208 698,202 C695,195 695,185 698,175 C698,170 700,167 700,165Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';
    // Sicily
    s += '<ellipse cx="705" cy="212" rx="6" ry="4" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.5"/>';

    // Scandinavia
    s += '<path d="M688,40 C705,32 722,38 732,50 C738,62 735,78 728,72 C720,65 712,68 705,62 C698,55 692,48 688,40Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';

    // UK
    s += '<path d="M600,92 C610,82 622,86 628,96 C632,108 626,120 618,124 ' +
      'C610,128 602,122 598,112 C595,102 596,95 600,92Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';
    // Ireland
    s += '<ellipse cx="588" cy="105" rx="8" ry="11" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.7"/>';

    // Iceland
    s += '<ellipse cx="555" cy="55" rx="14" ry="9" fill="url(#wm-tundra)" stroke="#6A7A5A" stroke-width="0.7"/>';

    // ===== AFRICA — with Horn, Madagascar =====
    s += '<path d="M645,235 C672,222 702,228 728,240 C752,252 772,272 788,298 ' +
      'C802,325 810,355 812,388 C814,420 808,452 798,482 C785,510 768,535 748,552 ' +
      'C725,568 700,575 678,565 C658,555 642,538 630,515 C620,492 614,468 610,442 ' +
      'C608,415 610,388 615,362 C620,335 630,310 645,288 C652,275 648,255 645,235Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1.2"/>';
    // Horn of Africa
    s += '<path d="M788,298 C795,295 802,298 808,305 C812,312 810,320 805,318 C798,315 792,308 788,298Z" fill="url(#wm-desert)" stroke="#A09060" stroke-width="0.6"/>';
    // Madagascar
    s += '<path d="M825,465 C832,455 838,460 838,475 C838,490 832,502 825,505 C818,498 815,480 825,465Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.7"/>';

    // ===== MIDDLE EAST / ARABIA =====
    s += '<path d="M782,208 C802,198 825,205 840,218 C852,232 858,250 852,268 ' +
      'C845,285 830,295 815,290 C800,285 788,272 782,255 C778,238 778,218 782,208Z" fill="url(#wm-desert)" stroke="#A09060" stroke-width="1"/>';

    // ===== RUSSIA / NORTHERN ASIA =====
    s += '<path d="M755,48 C810,32 878,25 948,30 C1018,38 1082,52 1140,48 ' +
      'C1185,44 1222,55 1242,72 C1258,88 1252,112 1238,128 C1222,145 1198,142 1175,148 ' +
      'C1152,155 1128,148 1105,155 C1078,162 1052,155 1025,162 C998,168 972,162 945,165 ' +
      'C918,168 892,162 868,168 C842,172 818,165 798,172 C780,178 765,170 752,160 ' +
      'C740,148 735,132 734,112 C733,92 740,70 755,48Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1.2"/>';

    // ===== INDIA =====
    s += '<path d="M900,252 C925,240 950,248 968,265 C982,282 990,305 985,332 ' +
      'C978,358 962,378 942,385 C922,390 905,382 892,365 C880,348 875,325 878,300 C880,278 888,260 900,252Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1"/>';
    // Sri Lanka
    s += '<ellipse cx="958" cy="392" rx="5" ry="7" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.5"/>';

    // ===== CHINA / EAST ASIA =====
    s += '<path d="M1015,168 C1042,158 1072,162 1098,175 C1120,188 1138,208 1145,232 ' +
      'C1152,258 1148,285 1135,305 C1120,322 1102,332 1082,328 C1062,325 1045,315 1032,298 ' +
      'C1020,282 1012,262 1008,242 C1005,222 1008,198 1015,168Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1"/>';

    // ===== SOUTHEAST ASIA =====
    s += '<path d="M1062,332 C1085,322 1108,328 1125,342 C1138,355 1145,375 1138,392 ' +
      'C1130,408 1115,415 1098,412 C1082,408 1068,398 1060,382 C1052,365 1055,345 1062,332Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';
    // Indonesia chain
    s += '<g fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.5">';
    s += '<ellipse cx="1092" cy="425" rx="18" ry="5" transform="rotate(-8,1092,425)"/>';
    s += '<ellipse cx="1118" cy="430" rx="12" ry="4.5" transform="rotate(-5,1118,430)"/>';
    s += '<ellipse cx="1140" cy="434" rx="10" ry="4" transform="rotate(5,1140,434)"/>';
    s += '<ellipse cx="1158" cy="432" rx="7" ry="3"/>';
    s += '</g>';

    // ===== JAPAN =====
    s += '<path d="M1198,148 C1210,138 1225,142 1230,155 C1235,170 1230,192 1222,202 ' +
      'C1214,212 1202,210 1196,198 C1192,185 1192,162 1198,148Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.8"/>';
    s += '<ellipse cx="1218" cy="140" rx="9" ry="7" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.6"/>';

    // ===== AUSTRALIA =====
    s += '<path d="M1142,505 C1180,490 1222,498 1258,515 C1288,530 1308,555 1312,582 ' +
      'C1315,610 1305,635 1288,650 C1268,662 1242,668 1215,662 C1192,655 1172,640 1158,618 ' +
      'C1148,598 1142,575 1142,550 C1142,530 1142,515 1142,505Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="1.2"/>';
    // Tasmania
    s += '<ellipse cx="1275" cy="668" rx="7" ry="5" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.5"/>';
    // New Zealand
    s += '<path d="M1372,615 C1378,605 1385,610 1382,625 C1380,638 1375,645 1370,640 C1368,632 1368,620 1372,615Z" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.7"/>';
    s += '<ellipse cx="1378" cy="648" rx="4" ry="5.5" fill="url(#wm-green)" stroke="#3A6830" stroke-width="0.5"/>';

    s += '</g>'; // end shadow group
    return s;
  },

  _wmTerrain() {
    var s = '';
    // ===== DESERT ZONES — Sahara, Arabia, Australia interior =====
    // Sahara
    s += '<path d="M660,248 Q710,238 748,252 Q768,260 778,278 L768,290 Q728,272 688,280 Q665,288 655,278Z" fill="url(#wm-desert)" opacity="0.7" stroke="none"/>';
    // Arabian interior
    s += '<ellipse cx="825" cy="240" rx="22" ry="28" fill="url(#wm-desert)" opacity="0.4"/>';
    // Australian outback
    s += '<ellipse cx="1220" cy="565" rx="45" ry="30" fill="url(#wm-desert)" opacity="0.35"/>';

    // ===== MOUNTAIN RANGES — relief shaded (lit from upper-left) =====
    // Helper: each peak has a lit left face and shadowed right face
    function mtnPeak(x, y, h, w, snow) {
      var hw = w || 5, pk = '';
      // Shadow face (right side, darker)
      pk += '<polygon points="'+x+','+(y-h)+' '+(x+hw)+','+y+' '+x+','+y+'" fill="#5A4A38" opacity="0.5"/>';
      // Lit face (left side, lighter)
      pk += '<polygon points="'+(x-hw)+','+y+' '+x+','+(y-h)+' '+x+','+y+'" fill="#8A7A62" opacity="0.6"/>';
      // Ridge line
      pk += '<line x1="'+x+'" y1="'+(y-h)+'" x2="'+x+'" y2="'+y+'" stroke="#6A5A42" stroke-width="0.3" opacity="0.3"/>';
      if (snow) {
        pk += '<polygon points="'+(x-hw*0.3)+','+(y-h*0.65)+' '+x+','+(y-h)+' '+(x+hw*0.3)+','+(y-h*0.65)+'" fill="#E8F0F4" opacity="0.7"/>';
      }
      return pk;
    }

    // Rocky Mountains
    s += '<g opacity="0.7">';
    var rockies = [[120,152,18,6],[128,142,22,7],[138,154,16,5],[146,140,24,7],[155,152,18,6],[164,138,26,8],[174,150,20,6]];
    for (var i = 0; i < rockies.length; i++) {
      var m = rockies[i];
      s += mtnPeak(m[0], m[1], m[2], m[3], i % 2 === 0);
    }
    s += '</g>';

    // Andes
    s += '<g opacity="0.65">';
    var andes = [[290,462,16,5],[296,450,18,5],[303,464,14,4],[310,448,20,6],[317,460,16,5],[324,444,22,6],[331,458,18,5],[337,442,24,7],[342,456,16,5]];
    for (var i = 0; i < andes.length; i++) {
      var m = andes[i];
      s += mtnPeak(m[0], m[1], m[2], m[3], i % 3 === 0);
    }
    s += '</g>';

    // Alps
    s += '<g opacity="0.65">';
    var alps = [[678,136,14,4],[686,128,16,5],[695,137,12,4],[703,126,18,5],[712,135,14,4]];
    for (var i = 0; i < alps.length; i++) {
      var m = alps[i];
      s += mtnPeak(m[0], m[1], m[2], m[3], true);
    }
    s += '</g>';

    // Himalayas — larger, more dramatic
    s += '<g opacity="0.75">';
    var himal = [[916,162,20,6],[926,148,26,7],[936,160,18,6],[948,142,30,8],[958,158,22,6],[968,140,32,8],[980,155,24,7],[990,138,34,9],[1000,152,22,7]];
    for (var i = 0; i < himal.length; i++) {
      var m = himal[i];
      s += mtnPeak(m[0], m[1], m[2], m[3], true);
    }
    s += '</g>';

    // ===== FOREST ZONES — individual tree symbols =====
    // Helper: draw a tiny tree symbol
    function treeSymbol(x, y, s2, type) {
      var sc = s2 || 1, pk = '';
      if (type === 'conifer') {
        // Conifer (triangle)
        pk += '<polygon points="'+x+','+(y-8*sc)+' '+(x-3*sc)+','+y+' '+(x+3*sc)+','+y+'" fill="#2A5020" opacity="0.6"/>';
        pk += '<polygon points="'+x+','+(y-6*sc)+' '+(x-2.5*sc)+','+(y-1*sc)+' '+(x+2.5*sc)+','+(y-1*sc)+'" fill="#3A6830" opacity="0.5"/>';
      } else {
        // Deciduous (round canopy)
        pk += '<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+(y-3*sc)+'" stroke="#3A2810" stroke-width="'+(0.6*sc)+'"/>';
        pk += '<circle cx="'+x+'" cy="'+(y-5*sc)+'" r="'+(3.5*sc)+'" fill="#2A5820" opacity="0.55"/>';
        pk += '<circle cx="'+(x-1.2*sc)+'" cy="'+(y-5.5*sc)+'" r="'+(2.5*sc)+'" fill="#3A6830" opacity="0.4"/>';
      }
      return pk;
    }

    // Amazon rainforest — dense deciduous
    s += '<g>';
    var amazon = [[340,475],[348,482],[356,473],[344,490],[352,496],[360,486],[368,478],[376,490],[350,504],[342,498],[362,502],[374,496],[366,510],[354,512],[380,484],[336,488]];
    for (var i = 0; i < amazon.length; i++) {
      s += treeSymbol(amazon[i][0], amazon[i][1], 0.8 + Math.sin(i)*0.2, 'deciduous');
    }
    s += '</g>';

    // Congo basin
    s += '<g>';
    var congo = [[698,412],[706,418],[714,410],[700,425],[710,430],[720,422],[694,432],[708,435],[718,428]];
    for (var i = 0; i < congo.length; i++) {
      s += treeSymbol(congo[i][0], congo[i][1], 0.7 + Math.sin(i*2)*0.15, 'deciduous');
    }
    s += '</g>';

    // Siberian taiga — conifers
    s += '<g>';
    for (var fx = 870; fx < 1210; fx += 14) {
      var fy = 68 + Math.sin(fx * 0.05) * 10 + (Math.cos(fx * 0.08) * 5);
      s += treeSymbol(fx, fy, 0.6 + Math.sin(fx*0.1)*0.15, 'conifer');
    }
    s += '</g>';

    // North American forests — mixed
    s += '<g>';
    var naForest = [[195,145],[205,140],[215,148],[185,152],[200,155],[210,150],[225,142],[190,160],[208,158]];
    for (var i = 0; i < naForest.length; i++) {
      s += treeSymbol(naForest[i][0], naForest[i][1], 0.7, i % 3 === 0 ? 'conifer' : 'deciduous');
    }
    s += '</g>';

    // European forests — mixed deciduous
    s += '<g>';
    var euForest = [[655,98],[665,95],[675,100],[685,92],[645,105],[695,88],[705,96]];
    for (var i = 0; i < euForest.length; i++) {
      s += treeSymbol(euForest[i][0], euForest[i][1], 0.65, i % 2 === 0 ? 'deciduous' : 'conifer');
    }
    // Scandinavian forests
    var scanForest = [[695,48],[702,44],[710,50],[718,46],[698,55],[708,52]];
    for (var i = 0; i < scanForest.length; i++) {
      s += treeSymbol(scanForest[i][0], scanForest[i][1], 0.55, 'conifer');
    }
    s += '</g>';

    // Southeast Asian forests
    s += '<g>';
    var seaForest = [[1072,345],[1080,350],[1088,342],[1096,348],[1104,340],[1112,346]];
    for (var i = 0; i < seaForest.length; i++) {
      s += treeSymbol(seaForest[i][0], seaForest[i][1], 0.6, 'deciduous');
    }
    s += '</g>';

    // ===== RIVERS with tributaries =====
    s += '<g fill="none" stroke="#4A7A98" stroke-linecap="round">';
    // Nile — main stem + Blue/White Nile tributaries
    s += '<path d="M752,258 Q750,280 748,305 Q746,330 744,355 Q742,375 738,395" stroke-width="1.4" opacity="0.45"/>';
    s += '<path d="M748,305 Q738,300 728,308" stroke-width="0.7" opacity="0.3"/>'; // Blue Nile
    s += '<path d="M744,355 Q735,350 725,355" stroke-width="0.6" opacity="0.25"/>'; // White Nile hint
    s += '<path d="M738,395 Q742,405 738,418 Q736,430 740,442" stroke-width="0.8" opacity="0.3"/>'; // Delta

    // Amazon — wide main + tributaries
    s += '<path d="M305,488 Q330,484 355,490 Q378,486 400,492 Q415,488 420,478" stroke-width="1.6" opacity="0.4"/>';
    s += '<path d="M330,484 Q325,475 322,465" stroke-width="0.7" opacity="0.25"/>'; // tributary
    s += '<path d="M355,490 Q358,500 362,510" stroke-width="0.6" opacity="0.2"/>';
    s += '<path d="M378,486 Q375,478 372,468" stroke-width="0.6" opacity="0.2"/>';
    s += '<path d="M400,492 Q405,500 402,510" stroke-width="0.5" opacity="0.18"/>';

    // Mississippi — with Ohio + Missouri
    s += '<path d="M260,178 Q264,210 268,245 Q272,280 276,315 Q280,340 282,350" stroke-width="1.3" opacity="0.4"/>';
    s += '<path d="M268,245 Q258,240 248,238" stroke-width="0.7" opacity="0.25"/>'; // Missouri
    s += '<path d="M272,280 Q282,275 290,272" stroke-width="0.7" opacity="0.25"/>'; // Ohio
    s += '<path d="M282,350 Q288,355 295,352" stroke-width="0.5" opacity="0.2"/>'; // Delta

    // Yangtze + Yellow River
    s += '<path d="M1040,208 Q1065,202 1088,212 Q1108,220 1128,230" stroke-width="1.2" opacity="0.4"/>';
    s += '<path d="M1050,188 Q1070,182 1092,190 Q1110,196 1120,200" stroke-width="1" opacity="0.35"/>'; // Yellow

    // Danube
    s += '<path d="M695,125 Q710,130 725,128 Q740,132 752,138" stroke-width="0.8" opacity="0.3"/>';

    // Ganges
    s += '<path d="M920,275 Q935,270 948,278 Q958,285 965,290" stroke-width="0.8" opacity="0.3"/>';
    s += '<path d="M965,290 Q970,298 968,308" stroke-width="0.5" opacity="0.2"/>'; // Delta

    // Congo River
    s += '<path d="M688,430 Q700,425 712,430 Q722,432 730,428" stroke-width="0.8" opacity="0.3"/>';

    s += '</g>';

    // ===== GREAT LAKES =====
    s += '<g fill="#4A7A98" opacity="0.5">';
    s += '<ellipse cx="278" cy="178" rx="18" ry="8"/>';
    s += '<ellipse cx="260" cy="172" rx="12" ry="6"/>';
    s += '<ellipse cx="295" cy="175" rx="8" ry="5"/>';
    s += '</g>';

    // ===== TUNDRA / ICE ZONES =====
    // Northern Russia/Siberia tundra band
    s += '<path d="M760,48 Q900,38 1050,42 Q1180,38 1240,48" fill="url(#wm-tundra)" opacity="0.25" stroke="none"/>';

    return s;
  },

  _wmCoastalShading() {
    var s = '';
    // Lighter water shelf around major landmasses — creates depth at coastlines
    s += '<g opacity="0.12" fill="none" stroke="#6AA8C0" stroke-width="6" filter="url(#wm-blur)">';
    // N. America coast
    s += '<path d="M80,100 C105,85 140,78 180,72 C225,65 270,62 330,72 C372,82 405,115 420,148 C425,180 420,215 425,245 C428,270 395,310 342,335 C288,356 258,355 218,340 C178,345 138,340 105,305 C82,258 74,202 80,142Z"/>';
    // S. America coast
    s += '<path d="M305,418 C355,408 398,432 422,472 C435,528 432,558 405,638 C375,672 325,692 278,648 C255,585 252,515 278,452Z"/>';
    // Europe coast
    s += '<path d="M608,85 C665,75 730,78 782,118 C785,152 758,175 692,182 C640,178 612,145 606,115Z"/>';
    // Africa coast
    s += '<path d="M645,235 C728,240 788,298 812,388 C808,452 748,552 678,565 C638,545 610,442 615,362 C630,310 645,260 645,235Z"/>';
    s += '</g>';
    return s;
  },

  _wmBorder() {
    var s = '';
    // Decorative border — antique atlas style
    // Outer frame
    s += '<rect x="8" y="8" width="1584" height="784" fill="none" stroke="#5A4A38" stroke-width="3" rx="4"/>';
    s += '<rect x="14" y="14" width="1572" height="772" fill="none" stroke="#8A7A60" stroke-width="1" rx="3"/>';
    // Corner ornaments
    s += '<g fill="#8A7A60" opacity="0.4">';
    // Top-left
    s += '<circle cx="20" cy="20" r="4"/><path d="M20,12 L20,28 M12,20 L28,20" stroke="#8A7A60" stroke-width="0.8" fill="none"/>';
    // Top-right
    s += '<circle cx="1580" cy="20" r="4"/><path d="M1580,12 L1580,28 M1572,20 L1588,20" stroke="#8A7A60" stroke-width="0.8" fill="none"/>';
    // Bottom-left
    s += '<circle cx="20" cy="780" r="4"/><path d="M20,772 L20,788 M12,780 L28,780" stroke="#8A7A60" stroke-width="0.8" fill="none"/>';
    // Bottom-right
    s += '<circle cx="1580" cy="780" r="4"/><path d="M1580,772 L1580,788 M1572,780 L1588,780" stroke="#8A7A60" stroke-width="0.8" fill="none"/>';
    s += '</g>';

    // Compass rose — bottom right
    s += '<g transform="translate(1500,710)" opacity="0.35">';
    s += '<circle r="28" fill="none" stroke="#6A5A48" stroke-width="1"/>';
    s += '<circle r="22" fill="none" stroke="#6A5A48" stroke-width="0.5"/>';
    s += '<polygon points="0,-24 3,-8 -3,-8" fill="#6A5A48"/>';
    s += '<polygon points="0,24 3,8 -3,8" fill="#8A7A60"/>';
    s += '<polygon points="-24,0 -8,3 -8,-3" fill="#8A7A60"/>';
    s += '<polygon points="24,0 8,3 8,-3" fill="#8A7A60"/>';
    // Diagonal points
    s += '<polygon points="-17,-17 -6,-8 -8,-6" fill="#9A8A70"/>';
    s += '<polygon points="17,-17 6,-8 8,-6" fill="#9A8A70"/>';
    s += '<polygon points="-17,17 -6,8 -8,6" fill="#9A8A70"/>';
    s += '<polygon points="17,17 6,8 8,6" fill="#9A8A70"/>';
    s += '<text y="-30" text-anchor="middle" font-size="10" fill="#6A5A48" font-weight="700" font-family="serif">N</text>';
    s += '<text y="38" text-anchor="middle" font-size="8" fill="#7A6A58" font-family="serif">S</text>';
    s += '<text x="34" y="4" text-anchor="middle" font-size="8" fill="#7A6A58" font-family="serif">E</text>';
    s += '<text x="-34" y="4" text-anchor="middle" font-size="8" fill="#7A6A58" font-family="serif">W</text>';
    s += '</g>';

    // Ocean labels — elegant serif italic
    s += '<g font-family="serif" font-style="italic" fill="#4A7A98" opacity="0.12" font-weight="400" letter-spacing="4">';
    s += '<text x="200" y="520" font-size="16">A T L A N T I C</text>';
    s += '<text x="230" y="542" font-size="12">O C E A N</text>';
    s += '<text x="1050" y="480" font-size="14">P A C I F I C</text>';
    s += '<text x="1070" y="498" font-size="11">O C E A N</text>';
    s += '<text x="850" y="620" font-size="12">I N D I A N  O C E A N</text>';
    s += '</g>';

    // Vignette — darker edges for depth
    s += '<rect width="1600" height="800" fill="none" stroke="#1A2A18" stroke-width="40" rx="4" opacity="0.06"/>';

    return s;
  },

  _wmCoastHatching() {
    // Fine parallel lines along coastlines for cartographic depth
    var s = '<g opacity="0.08" fill="none" stroke="#2A4A38" stroke-width="0.6">';
    // North America east coast hatching
    for (var i = 0; i < 8; i++) {
      var offset = i * 3;
      s += '<path d="M'+(335+offset)+','+(72+offset)+' C'+(410+offset)+','+(115+offset)+' '+(425+offset)+','+(180+offset)+' '+(418+offset)+','+(245+offset)+' C'+(408+offset)+','+(298+offset)+' '+(342+offset)+','+(335+offset)+' '+(302+offset)+','+(352+offset)+'" />';
    }
    // South America east
    for (var i = 0; i < 6; i++) {
      var o = i * 3;
      s += '<path d="M'+(378+o)+','+(420+o)+' C'+(422+o)+','+(472+o)+' '+(432+o)+','+(528+o)+' '+(405+o)+','+(638+o)+'" />';
    }
    // Africa west
    for (var i = 0; i < 6; i++) {
      var o = i * 3;
      s += '<path d="M'+(645-o)+','+(240-o)+' C'+(630-o)+','+(310-o)+' '+(620-o)+','+(400-o)+' '+(678-o)+','+(565-o)+'" />';
    }
    // Europe south
    for (var i = 0; i < 5; i++) {
      var o = i * 2.5;
      s += '<path d="M'+(620+o)+','+(165+o)+' C'+(660+o)+','+(180+o)+' '+(730+o)+','+(185+o)+' '+(782+o)+','+(168+o)+'" />';
    }
    s += '</g>';
    return s;
  },

  _wmShips() {
    // 1750-era sailing vessels for atmosphere and era identity
    var s = '<g opacity="0.25">';
    var ships = [
      [450, 440, 0.8, 10],   // Mid-Atlantic
      [320, 510, 0.7, -5],   // South Atlantic
      [1300, 460, 0.9, -8],  // Pacific
      [870, 580, 0.7, 12],   // Indian Ocean
      [580, 320, 0.6, 5],    // Mediterranean
      [200, 300, 0.65, -3],  // N. Atlantic
    ];
    for (var i = 0; i < ships.length; i++) {
      var sh = ships[i];
      s += '<g transform="translate('+sh[0]+','+sh[1]+') scale('+sh[2]+') rotate('+sh[3]+')">';
      // Hull
      s += '<path d="M-12,4 Q0,8 12,4 L10,0 L-10,0Z" fill="#6A5040" stroke="#4A3828" stroke-width="0.8"/>';
      // Mast
      s += '<line x1="0" y1="0" x2="0" y2="-22" stroke="#5A4838" stroke-width="1"/>';
      // Sails
      s += '<path d="M1,-20 Q8,-14 2,-6" fill="#E8E0D0" stroke="#B0A890" stroke-width="0.4"/>';
      s += '<path d="M-1,-18 Q-7,-12 -1,-4" fill="#E0D8C8" stroke="#B0A890" stroke-width="0.4"/>';
      // Flag
      s += '<path d="M0,-22 L6,-20 L0,-18" fill="#A04030" opacity="0.7"/>';
      // Wake
      s += '<path d="M12,4 Q18,6 25,5" fill="none" stroke="#6AA0B8" stroke-width="0.5" opacity="0.4"/>';
      s += '</g>';
    }
    s += '</g>';
    return s;
    // === SEA CREATURES (1750 atlas style) ===
    // Whale — South Pacific
    s += '<g transform="translate(1350, 540)" opacity="0.15">';
    s += '<path d="M-15,0 Q-5,-8 10,-6 Q20,-4 25,0 Q20,4 10,6 Q-5,8 -15,0Z" fill="#3A5A68" stroke="#2A4A58" stroke-width="0.6"/>';
    s += '<path d="M25,0 Q30,-4 32,-2 Q30,2 25,0" fill="#3A5A68"/>'; // tail
    s += '<circle cx="-8" cy="-2" r="1" fill="#2A4A58"/>'; // eye
    s += '<path d="M-5,-8 Q-3,-14 -1,-10" fill="none" stroke="#5A8AA8" stroke-width="0.5"/>'; // spout
    s += '</g>';

    // Sea serpent — North Atlantic
    s += '<g transform="translate(480, 350)" opacity="0.1">';
    s += '<path d="M0,0 Q8,-6 16,0 Q24,6 32,0 Q40,-6 48,0 Q52,2 50,5" fill="none" stroke="#3A5A48" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<circle cx="-2" cy="0" r="2.5" fill="#3A5A48"/>'; // head
    s += '<circle cx="-4" cy="-1" r="0.8" fill="#5A8A78"/>'; // eye
    s += '</g>';

    // Compass wind faces (decorative, two corners)
    // NW wind
    s += '<g transform="translate(80, 680)" opacity="0.08">';
    s += '<circle cx="0" cy="0" r="12" fill="none" stroke="#5A7A88" stroke-width="0.8"/>';
    s += '<path d="M-8,-2 Q-14,0 -18,-2 Q-14,-4 -8,-2" fill="#5A7A88"/>'; // blowing
    s += '<circle cx="-3" cy="-3" r="1" fill="#5A7A88"/>'; // eye
    s += '<circle cx="3" cy="-3" r="1" fill="#5A7A88"/>';
    s += '<path d="M-2,2 Q0,5 2,2" fill="none" stroke="#5A7A88" stroke-width="0.5"/>'; // mouth
    s += '</g>';

    s += '</g>';
    return s;
  },

  _wmAgedOverlay() {
    // Subtle age/wear effect — vignette + warm tone + noise texture hint
    var s = '';
    // Warm parchment tint over everything
    s += '<rect width="1600" height="800" fill="#D8C8A0" opacity="0.04"/>';
    // Darker corners (vignette)
    s += '<radialGradient id="wm-vig" cx="0.5" cy="0.5" r="0.7"><stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#1A1008" stop-opacity="0.15"/></radialGradient>';
    s += '<rect width="1600" height="800" fill="url(#wm-vig)"/>';
    // Stain marks (very subtle)
    s += '<circle cx="300" cy="600" r="80" fill="#8A7A58" opacity="0.015"/>';
    s += '<circle cx="1200" cy="200" r="60" fill="#8A7A58" opacity="0.01"/>';
    s += '<ellipse cx="800" cy="700" rx="120" ry="40" fill="#7A6A48" opacity="0.012"/>';
    return s;
  },

  _wmCartouche() {
    // Decorative title cartouche — top left area
    var s = '<g transform="translate(40, 30)">';
    // Cartouche background — ornate frame
    s += '<rect x="0" y="0" width="180" height="65" rx="4" fill="#F0E8D4" stroke="#6A5A42" stroke-width="1.5" opacity="0.85"/>';
    // Inner border
    s += '<rect x="4" y="4" width="172" height="57" rx="3" fill="none" stroke="#8A7A5A" stroke-width="0.5" opacity="0.5"/>';
    // Decorative corner flourishes
    s += '<g stroke="#8A7A5A" stroke-width="0.8" fill="none" opacity="0.4">';
    s += '<path d="M8,8 Q4,14 8,20"/><path d="M8,8 Q14,4 20,8"/>';
    s += '<path d="M172,8 Q176,14 172,20"/><path d="M172,8 Q166,4 160,8"/>';
    s += '<path d="M8,57 Q4,51 8,45"/><path d="M8,57 Q14,61 20,57"/>';
    s += '<path d="M172,57 Q176,51 172,45"/><path d="M172,57 Q166,61 160,57"/>';
    s += '</g>';
    // Title text
    s += '<text x="90" y="28" text-anchor="middle" font-family="\'Playfair Display\',serif" font-size="14" fill="#3A2A18" font-weight="700" letter-spacing="2">PROPERTY EMPIRE</text>';
    s += '<text x="90" y="44" text-anchor="middle" font-family="serif" font-size="9" fill="#6A5A42" font-style="italic" letter-spacing="1">Atlas of the Known World</text>';
    // Era line
    s += '<line x1="30" y1="50" x2="150" y2="50" stroke="#8A7A5A" stroke-width="0.4" opacity="0.4"/>';
    s += '<text x="90" y="58" text-anchor="middle" font-family="serif" font-size="7" fill="#8A7A5A" letter-spacing="1">ANNO DOMINI</text>';
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

  // ===== PARIS — Premium illustrated =====
  _city_paris() {
    var s = '';
    // Atmospheric sky — warm Parisian light
    s += '<rect width="1200" height="500" fill="#B8CCE0"/>';
    s += '<rect width="1200" height="300" fill="#C8D8E8" opacity="0.5"/>';
    // Atmospheric haze near horizon
    s += '<rect x="0" y="240" width="1200" height="80" fill="#D8E0E8" opacity="0.3"/>';

    // Volumetric clouds
    s += '<g opacity="0.35">';
    s += '<ellipse cx="150" cy="45" rx="90" ry="22" fill="#F0F0F8"/>';
    s += '<ellipse cx="180" cy="40" rx="60" ry="18" fill="#FFF"/>';
    s += '<ellipse cx="120" cy="48" rx="40" ry="14" fill="#F8F8FF"/>';
    s += '<ellipse cx="650" cy="35" rx="110" ry="24" fill="#F0F0F8"/>';
    s += '<ellipse cx="690" cy="30" rx="70" ry="18" fill="#FFF"/>';
    s += '<ellipse cx="620" cy="38" rx="50" ry="15" fill="#F8F8FF"/>';
    s += '<ellipse cx="1050" cy="50" rx="80" ry="20" fill="#F0F0F8"/>';
    s += '<ellipse cx="1080" cy="46" rx="55" ry="16" fill="#FFF"/>';
    s += '</g>';

    // === DISTANT CITY SILHOUETTE (atmospheric perspective — faded) ===
    s += '<g opacity="0.15" fill="#8A9AAA">';
    for (var dx = 0; dx < 1200; dx += 18) {
      var dh = 12 + Math.sin(dx * 0.04) * 8 + Math.cos(dx * 0.07) * 5;
      s += '<rect x="'+dx+'" y="'+(268-dh)+'" width="15" height="'+dh+'" rx="0.5"/>';
    }
    s += '</g>';

    // === SACRE-COEUR on Montmartre hill (mid-distance) ===
    s += '<g transform="translate(920, 195)" opacity="0.55">';
    // Hill
    s += '<ellipse cx="35" cy="55" rx="65" ry="18" fill="#7A9A68"/>';
    s += '<ellipse cx="35" cy="50" rx="50" ry="12" fill="#8AAA78" opacity="0.5"/>';
    // Basilica
    s += '<rect x="12" y="15" width="46" height="38" fill="#E8E0D4" stroke="#C8C0B0" stroke-width="0.5"/>';
    // Three domes
    s += '<ellipse cx="35" cy="15" rx="14" ry="12" fill="#F0EAE0" stroke="#C8C0B0" stroke-width="0.5"/>';
    s += '<ellipse cx="20" cy="20" rx="9" ry="8" fill="#EAE4D8" stroke="#C8C0B0" stroke-width="0.4"/>';
    s += '<ellipse cx="50" cy="20" rx="9" ry="8" fill="#EAE4D8" stroke="#C8C0B0" stroke-width="0.4"/>';
    // Cross on main dome
    s += '<line x1="35" y1="3" x2="35" y2="-3" stroke="#C8B898" stroke-width="0.8"/>';
    s += '<line x1="32" y1="0" x2="38" y2="0" stroke="#C8B898" stroke-width="0.6"/>';
    s += '</g>';

    // === NOTRE-DAME (mid-left, slightly larger) ===
    s += '<g transform="translate(440, 225)" opacity="0.6">';
    s += '<rect x="0" y="15" width="55" height="55" fill="#C8BCA0" stroke="#A89880" stroke-width="0.6"/>';
    // Twin towers
    s += '<rect x="3" y="0" width="10" height="20" fill="#C0B498" stroke="#A89880" stroke-width="0.4"/>';
    s += '<rect x="42" y="0" width="10" height="20" fill="#C0B498" stroke="#A89880" stroke-width="0.4"/>';
    // Spire
    s += '<line x1="27" y1="15" x2="27" y2="-5" stroke="#A89880" stroke-width="1"/>';
    // Rose window
    s += '<circle cx="27" cy="28" r="7" fill="#6888A8" stroke="#A89880" stroke-width="0.5"/>';
    s += '<circle cx="27" cy="28" r="4" fill="#7898B0" opacity="0.6"/>';
    // Flying buttresses hint
    s += '<line x1="0" y1="40" x2="-6" y2="50" stroke="#B8AC90" stroke-width="0.8"/>';
    s += '<line x1="55" y1="40" x2="61" y2="50" stroke="#B8AC90" stroke-width="0.8"/>';
    // Gothic windows
    s += '<g fill="#5A7A98" stroke="#A89880" stroke-width="0.3">';
    for (var wx = 8; wx < 48; wx += 10) {
      s += '<rect x="'+wx+'" y="40" width="5" height="12" rx="2.5" ry="2.5"/>';
    }
    s += '</g>';
    s += '</g>';

    // === EIFFEL TOWER (center, detailed) ===
    s += '<g transform="translate(580, 95)">';
    // Four legs with proper curves
    s += '<path d="M-2,-5 L-38,195 L-48,195 Q-30,140 -25,95 Q-18,50 -2,-5" fill="#5A4838" opacity="0.9"/>';
    s += '<path d="M2,-5 L38,195 L48,195 Q30,140 25,95 Q18,50 2,-5" fill="#4A3828" opacity="0.85"/>';
    // Structural arches between legs
    s += '<path d="M-38,195 Q0,165 38,195" fill="none" stroke="#5A4838" stroke-width="2.5"/>';
    s += '<path d="M-28,140 Q0,120 28,140" fill="none" stroke="#5A4838" stroke-width="1.5"/>';
    // Platforms
    s += '<rect x="-22" y="78" width="44" height="7" fill="#6A5A48" rx="1" stroke="#4A3A28" stroke-width="0.5"/>';
    s += '<rect x="-34" y="138" width="68" height="8" fill="#6A5A48" rx="1" stroke="#4A3A28" stroke-width="0.5"/>';
    // Lattice detail — criss-cross
    s += '<g stroke="#6A5A48" stroke-width="0.4" opacity="0.5">';
    for (var ly = 5; ly < 190; ly += 8) {
      var lw = (ly / 195) * 38;
      // Horizontal
      s += '<line x1="'+(-lw)+'" y1="'+ly+'" x2="'+lw+'" y2="'+ly+'"/>';
      // Diagonal cross
      if (ly < 180) {
        var lw2 = ((ly+8) / 195) * 38;
        s += '<line x1="'+(-lw)+'" y1="'+ly+'" x2="'+(-lw2*0.6)+'" y2="'+(ly+8)+'"/>';
        s += '<line x1="'+lw+'" y1="'+ly+'" x2="'+(lw2*0.6)+'" y2="'+(ly+8)+'"/>';
      }
    }
    s += '</g>';
    // Antenna/spire
    s += '<line x1="0" y1="-5" x2="0" y2="-22" stroke="#5A4838" stroke-width="1.8"/>';
    s += '<circle cx="0" cy="-22" r="1.5" fill="#6A5A48"/>';
    // Light glow on the tower at dusk
    s += '<rect x="-20" y="80" width="40" height="3" fill="#F0D870" opacity="0.08"/>';
    s += '</g>';

    // === SEINE RIVER with stone embankments ===
    // North embankment wall
    s += '<rect x="0" y="328" width="1200" height="6" fill="#A09878" stroke="#8A8268" stroke-width="0.5"/>';
    // River water
    s += '<path d="M0,334 Q200,330 400,335 Q600,340 800,333 Q1000,328 1200,336 L1200,365 Q1000,358 800,363 Q600,370 400,365 Q200,360 0,365Z" fill="url(#c-water)"/>';
    // Water shimmer
    s += '<g opacity="0.15" stroke="#A0D0E8" stroke-width="0.6" stroke-linecap="round">';
    for (var rx = 30; rx < 1170; rx += 28) {
      var ry = 342 + Math.sin(rx * 0.025) * 5;
      s += '<line x1="'+rx+'" y1="'+ry+'" x2="'+(rx+10)+'" y2="'+(ry+0.5)+'"/>';
    }
    s += '</g>';
    // South embankment wall
    s += '<rect x="0" y="365" width="1200" height="6" fill="#A09878" stroke="#8A8268" stroke-width="0.5"/>';

    // Stone bridges with arches
    var bridgePositions = [350, 700, 980];
    for (var bi = 0; bi < bridgePositions.length; bi++) {
      var bx = bridgePositions[bi];
      var bw = 50 + bi * 5;
      s += '<g transform="translate('+bx+', 332)">';
      // Arches
      var numArches = 3;
      var archW = bw / numArches;
      for (var ai = 0; ai < numArches; ai++) {
        var ax = ai * archW;
        s += '<path d="M'+ax+',6 Q'+(ax+archW/2)+',0 '+(ax+archW)+',6" fill="none" stroke="#B0A888" stroke-width="2"/>';
      }
      // Road surface
      s += '<rect x="-2" y="-2" width="'+(bw+4)+'" height="4" fill="#C0B898" stroke="#A09878" stroke-width="0.5" rx="0.5"/>';
      // Balustrade
      s += '<line x1="0" y1="-3" x2="'+bw+'" y2="-3" stroke="#B0A888" stroke-width="0.8"/>';
      s += '</g>';
    }

    // === HAUSSMANN BUILDINGS — varied heights and details ===
    // Left bank (closer, larger)
    var leftBuildings = [
      {x:15, w:72, h:82, floors:5, shopColor:'#3A5A4A'},
      {x:95, w:58, h:70, floors:4, shopColor:'#5A2828'},
      {x:160, w:78, h:88, floors:5, shopColor:'#28485A'},
      {x:245, w:62, h:75, floors:5, shopColor:'#4A3A28'},
      {x:315, w:55, h:65, floors:4, shopColor:'#3A5A4A'}
    ];
    for (var bi = 0; bi < leftBuildings.length; bi++) {
      var b = leftBuildings[bi];
      s += this._haussmann(b.x, 328-b.h, b.w, b.h, b.floors);
    }
    // Right bank (past tower)
    var rightBuildings = [
      {x:700, w:68, h:78, floors:5},
      {x:775, w:55, h:68, floors:4},
      {x:838, w:75, h:85, floors:5},
      {x:920, w:60, h:72, floors:5},
      {x:988, w:50, h:62, floors:4},
      {x:1045, w:72, h:80, floors:5},
      {x:1125, w:58, h:70, floors:4}
    ];
    for (var bi = 0; bi < rightBuildings.length; bi++) {
      var b = rightBuildings[bi];
      s += this._haussmann(b.x, 328-b.h, b.w, b.h, b.floors);
    }

    // === GROUND — cobblestone quay ===
    s += '<rect x="0" y="371" width="1200" height="129" fill="#7A9A68"/>';
    // Quay walkway with stone texture
    s += '<rect x="0" y="371" width="1200" height="22" fill="#B8A888"/>';
    // Cobblestone pattern hint
    s += '<g stroke="#A09878" stroke-width="0.3" opacity="0.2">';
    for (var cx = 0; cx < 1200; cx += 8) {
      for (var cy = 373; cy < 391; cy += 6) {
        var offset = (cy % 12 === 0) ? 4 : 0;
        s += '<rect x="'+(cx+offset)+'" y="'+cy+'" width="6" height="4" rx="0.5" fill="none"/>';
      }
    }
    s += '</g>';

    // === TREES — varied species along the Seine ===
    var treePosL = [40,100,180,260,340];
    var treePosR = [680,760,850,940,1020,1100];
    var allTrees = treePosL.concat(treePosR);
    for (var ti = 0; ti < allTrees.length; ti++) {
      var tx = allTrees[ti];
      var tScale = 0.8 + Math.sin(ti * 2.3) * 0.15;
      // Trunk
      s += '<rect x="'+(tx-1.5)+'" y="362" width="3" height="18" fill="#4A3820" rx="0.5"/>';
      // Canopy — irregular, not ellipses
      var cy = 348;
      s += '<path d="M'+(tx-12*tScale)+','+cy+' Q'+(tx-8*tScale)+','+(cy-14*tScale)+' '+tx+','+(cy-16*tScale)+' Q'+(tx+10*tScale)+','+(cy-14*tScale)+' '+(tx+13*tScale)+','+cy+' Q'+(tx+8*tScale)+','+(cy+4)+' '+(tx-6*tScale)+','+(cy+3)+' Q'+(tx-14*tScale)+','+(cy+2)+' '+(tx-12*tScale)+','+cy+'Z" fill="#3A7038" opacity="0.8"/>';
      // Highlight patch (sun from left)
      s += '<path d="M'+(tx-10*tScale)+','+(cy-2)+' Q'+(tx-5*tScale)+','+(cy-12*tScale)+' '+(tx-1)+','+(cy-14*tScale)+' Q'+(tx-3)+','+(cy-6)+' '+(tx-8*tScale)+','+(cy-1)+' Z" fill="#4A8848" opacity="0.35"/>';
    }

    // === STREET LAMPS (ornate Parisian style) ===
    s += '<g stroke="#3A3A38" stroke-width="1.2" fill="#3A3A38">';
    for (var lx = 60; lx < 1200; lx += 120) {
      if (lx > 550 && lx < 650) continue; // skip tower area
      s += '<line x1="'+lx+'" y1="376" x2="'+lx+'" y2="394"/>';
      // Ornate top
      s += '<path d="M'+(lx-4)+',376 Q'+lx+',372 '+(lx+4)+',376" fill="none" stroke-width="0.8"/>';
      s += '<ellipse cx="'+lx+'" cy="374" rx="3" ry="2.5" fill="#F0D860" opacity="0.5" stroke="none"/>';
      // Base
      s += '<rect x="'+(lx-2)+'" y="394" width="4" height="2" fill="#3A3A38" rx="0.5"/>';
    }
    s += '</g>';

    return s;
  },

  // ===== LONDON — Premium illustrated =====
  _city_london() {
    var s = '';
    // Overcast London sky — layered greys with warmth
    s += '<rect width="1200" height="500" fill="#B0B8C0"/>';
    s += '<rect width="1200" height="300" fill="#A0AAB4" opacity="0.4"/>';
    // Heavy cloud layers
    s += '<g fill="#98A0A8" opacity="0.45">';
    s += '<ellipse cx="100" cy="35" rx="130" ry="28"/>';
    s += '<ellipse cx="150" cy="30" rx="80" ry="22" fill="#A0A8B0"/>';
    s += '<ellipse cx="350" cy="28" rx="150" ry="32"/>';
    s += '<ellipse cx="400" cy="22" rx="90" ry="24" fill="#A8B0B8"/>';
    s += '<ellipse cx="650" cy="35" rx="140" ry="30"/>';
    s += '<ellipse cx="700" cy="28" rx="80" ry="22" fill="#A0A8B0"/>';
    s += '<ellipse cx="950" cy="30" rx="130" ry="28"/>';
    s += '<ellipse cx="1000" cy="25" rx="85" ry="22" fill="#A8B0B8"/>';
    s += '<ellipse cx="1150" cy="38" rx="100" ry="25"/>';
    s += '</g>';
    // Fog layer
    s += '<rect x="0" y="250" width="1200" height="50" fill="#B0B8C0" opacity="0.15"/>';

    // === DISTANT CITY SILHOUETTE ===
    s += '<g opacity="0.12" fill="#7A8A98">';
    for (var dx = 0; dx < 1200; dx += 20) {
      var dh = 10 + Math.sin(dx*0.04)*6;
      s += '<rect x="'+dx+'" y="'+(268-dh)+'" width="17" height="'+dh+'"/>';
    }
    s += '</g>';

    // === LONDON EYE (background, left) ===
    s += '<g transform="translate(160, 215)" opacity="0.35">';
    s += '<circle cx="0" cy="0" r="50" fill="none" stroke="#7A8A98" stroke-width="2"/>';
    s += '<circle cx="0" cy="0" r="48" fill="none" stroke="#8A9AA8" stroke-width="0.5"/>';
    for (var a = 0; a < 360; a += 22.5) {
      var rad = a * Math.PI / 180;
      var ex = Math.cos(rad) * 48, ey = Math.sin(rad) * 48;
      s += '<line x1="0" y1="0" x2="'+ex+'" y2="'+ey+'" stroke="#8A9AA8" stroke-width="0.4"/>';
      // Capsules
      s += '<ellipse cx="'+ex+'" cy="'+ey+'" rx="4.5" ry="3" fill="#C0C8D0" stroke="#8A9AA8" stroke-width="0.4" transform="rotate(0,'+ex+','+ey+')"/>';
    }
    // Support
    s += '<line x1="0" y1="50" x2="-15" y2="85" stroke="#7A8A98" stroke-width="2.5"/>';
    s += '<line x1="0" y1="50" x2="15" y2="85" stroke="#7A8A98" stroke-width="2.5"/>';
    s += '</g>';

    // === BIG BEN / ELIZABETH TOWER ===
    s += '<g transform="translate(530, 72)">';
    // Main tower body — Gothic stone
    s += '<rect x="-14" y="25" width="28" height="205" fill="#D0C8B4" stroke="#A8A08A" stroke-width="0.8"/>';
    // Stone course lines
    s += '<g stroke="#B8B098" stroke-width="0.3" opacity="0.4">';
    for (var cy = 30; cy < 228; cy += 10) { s += '<line x1="-14" y1="'+cy+'" x2="14" y2="'+cy+'"/>'; }
    s += '</g>';
    // Clock section — wider
    s += '<rect x="-18" y="18" width="36" height="35" fill="#D8D0BC" stroke="#A8A08A" stroke-width="0.8"/>';
    // Clock face
    s += '<circle cx="0" cy="35" r="13" fill="#F0EAD8" stroke="#8A826A" stroke-width="1.2"/>';
    s += '<circle cx="0" cy="35" r="11" fill="none" stroke="#B0A888" stroke-width="0.4"/>';
    s += '<circle cx="0" cy="35" r="1.2" fill="#2A2A28"/>';
    // Hour markers
    for (var h = 0; h < 12; h++) {
      var ha = h * 30 * Math.PI / 180;
      s += '<line x1="'+(Math.sin(ha)*9)+'" y1="'+(35-Math.cos(ha)*9)+'" x2="'+(Math.sin(ha)*11)+'" y2="'+(35-Math.cos(ha)*11)+'" stroke="#4A4238" stroke-width="0.6"/>';
    }
    // Hands
    s += '<line x1="0" y1="35" x2="0" y2="26" stroke="#2A2A28" stroke-width="1.2"/>';
    s += '<line x1="0" y1="35" x2="6" y2="33" stroke="#2A2A28" stroke-width="0.8"/>';
    // Gothic spire
    s += '<polygon points="-10,18 0,-5 10,18" fill="#B0A890" stroke="#8A826A" stroke-width="0.6"/>';
    s += '<line x1="0" y1="-5" x2="0" y2="-18" stroke="#8A826A" stroke-width="1.2"/>';
    // Pinnacle
    s += '<polygon points="-2,-18 0,-24 2,-18" fill="#A0988A"/>';
    // Gothic arched windows down the shaft
    s += '<g fill="#5A6A7A" stroke="#A8A08A" stroke-width="0.3">';
    for (var wy = 60; wy < 225; wy += 18) {
      s += '<rect x="-7" y="'+wy+'" width="5" height="12" rx="2.5" ry="2.5"/>';
      s += '<rect x="2" y="'+wy+'" width="5" height="12" rx="2.5" ry="2.5"/>';
    }
    s += '</g>';
    s += '</g>';

    // === HOUSES OF PARLIAMENT ===
    s += '<g transform="translate(380, 210)">';
    // Main long facade
    s += '<rect x="0" y="8" width="280" height="70" fill="#D0C8B4" stroke="#A8A08A" stroke-width="0.8"/>';
    // Roof line
    s += '<rect x="-3" y="2" width="286" height="8" fill="#6A7A6A" stroke="#5A6A5A" stroke-width="0.5"/>';
    // Gothic windows — varied
    s += '<g fill="#5A6A7A" stroke="#A8A08A" stroke-width="0.3">';
    for (var wx = 8; wx < 270; wx += 14) {
      var wh = (wx % 28 < 14) ? 18 : 14;
      s += '<rect x="'+wx+'" y="'+(20-wh+14)+'" width="6" height="'+wh+'" rx="3" ry="3"/>';
      // Lower windows
      s += '<rect x="'+wx+'" y="48" width="6" height="12" rx="1"/>';
    }
    s += '</g>';
    // Victoria Tower (left)
    s += '<rect x="-8" y="-25" width="18" height="40" fill="#D0C8B4" stroke="#A8A08A" stroke-width="0.6"/>';
    s += '<polygon points="-8,-25 1,-38 10,-25" fill="#6A7A6A" stroke="#5A6A5A" stroke-width="0.5"/>';
    // Central tower
    s += '<rect x="130" y="-15" width="14" height="28" fill="#D0C8B4" stroke="#A8A08A" stroke-width="0.5"/>';
    s += '<polygon points="130,-15 137,-25 144,-15" fill="#6A7A6A"/>';
    s += '</g>';

    // === THAMES ===
    s += '<rect x="0" y="315" width="1200" height="6" fill="#8A8A80" stroke="#7A7A78" stroke-width="0.4"/>'; // N embankment
    s += '<path d="M0,321 Q300,318 600,323 Q900,328 1200,319 L1200,358 Q900,355 600,360 Q300,355 0,358Z" fill="url(#c-water)"/>';
    // Murky London water — slight green tint
    s += '<rect x="0" y="321" width="1200" height="37" fill="#4A5A48" opacity="0.1"/>';
    s += '<rect x="0" y="358" width="1200" height="6" fill="#8A8A80" stroke="#7A7A78" stroke-width="0.4"/>'; // S embankment

    // === TOWER BRIDGE ===
    s += '<g transform="translate(870, 268)">';
    // Tower 1 (left)
    s += '<rect x="0" y="12" width="14" height="55" fill="#B8B0A0" stroke="#8A8278" stroke-width="0.6"/>';
    s += '<polygon points="0,12 7,0 14,12" fill="#6A7A6A" stroke="#5A6A5A" stroke-width="0.5"/>';
    // Tower 2 (right)
    s += '<rect x="95" y="12" width="14" height="55" fill="#B8B0A0" stroke="#8A8278" stroke-width="0.6"/>';
    s += '<polygon points="95,12 102,0 109,12" fill="#6A7A6A" stroke="#5A6A5A" stroke-width="0.5"/>';
    // Upper walkway
    s += '<rect x="14" y="18" width="81" height="4" fill="#7A8A98" stroke="#5A6A78" stroke-width="0.4"/>';
    // Road deck
    s += '<rect x="14" y="45" width="81" height="5" fill="#8A8A82" stroke="#6A6A68" stroke-width="0.4"/>';
    // Suspension cables
    s += '<path d="M7,2 Q54,-12 102,2" fill="none" stroke="#5A7A88" stroke-width="1.5"/>';
    s += '<path d="M7,8 Q54,-4 102,8" fill="none" stroke="#5A7A88" stroke-width="1"/>';
    // Cable hangers
    for (var cx = 18; cx < 95; cx += 10) {
      var chy = 2 - Math.sin(((cx-14)/81)*Math.PI) * 14;
      s += '<line x1="'+cx+'" y1="'+chy+'" x2="'+cx+'" y2="45" stroke="#6A7A88" stroke-width="0.4"/>';
    }
    // Tower windows
    s += '<g fill="#5A6A7A" stroke="#8A8278" stroke-width="0.3">';
    for (var wy = 20; wy < 60; wy += 12) {
      s += '<rect x="3" y="'+wy+'" width="4" height="7" rx="2" ry="2"/>';
      s += '<rect x="98" y="'+wy+'" width="4" height="7" rx="2" ry="2"/>';
    }
    s += '</g>';
    s += '</g>';

    // === BRICK BUILDINGS (varied Victorian terraces) ===
    s += '<g>';
    // Left bank buildings
    for (var bx = 10; bx < 370; bx += 42) {
      var bh = 50 + Math.floor(Math.sin(bx * 0.12) * 15) + (bx % 84 < 42 ? 8 : 0);
      var by = 315 - bh;
      var brickColor = bx % 84 < 42 ? '#C07858' : '#B06848';
      s += '<rect x="'+bx+'" y="'+by+'" width="38" height="'+bh+'" fill="'+brickColor+'" stroke="#7A4A30" stroke-width="0.6"/>';
      // Slate roof with slight pitch
      s += '<path d="M'+(bx-1)+','+by+' L'+(bx+19)+','+(by-6)+' L'+(bx+39)+','+by+'" fill="#5A6A6A" stroke="#4A5A5A" stroke-width="0.4"/>';
      // Chimneys (varied positions)
      s += '<rect x="'+(bx+8)+'" y="'+(by-14)+'" width="5" height="10" fill="#8A5A40"/>';
      s += '<rect x="'+(bx+6)+'" y="'+(by-16)+'" width="9" height="3" fill="#9A6A50"/>';
      if (bx % 84 < 42) {
        s += '<rect x="'+(bx+26)+'" y="'+(by-12)+'" width="5" height="8" fill="#8A5A40"/>';
      }
      // Sash windows
      for (var wy = by + 8; wy < by + bh - 8; wy += 14) {
        for (var wx = bx + 5; wx < bx + 32; wx += 12) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="7" height="10" fill="#8AACBC" stroke="#7A4A38" stroke-width="0.3"/>';
          // Sash bar
          s += '<line x1="'+wx+'" y1="'+(wy+5)+'" x2="'+(wx+7)+'" y2="'+(wy+5)+'" stroke="#7A4A38" stroke-width="0.3"/>';
        }
      }
      // Door
      s += '<rect x="'+(bx+15)+'" y="'+(by+bh-16)+'" width="8" height="16" fill="#2A3A28" rx="0.5"/>';
    }
    s += '</g>';

    // Right bank buildings (past Tower Bridge)
    s += '<g opacity="0.85">';
    for (var bx = 700; bx < 860; bx += 38) {
      var bh = 45 + Math.floor(Math.cos(bx * 0.1) * 12);
      var by = 312 - bh;
      s += '<rect x="'+bx+'" y="'+by+'" width="34" height="'+bh+'" fill="#B86A48" stroke="#7A4A30" stroke-width="0.5"/>';
      s += '<path d="M'+(bx-1)+','+by+' L'+(bx+17)+','+(by-5)+' L'+(bx+35)+','+by+'" fill="#5A6A6A"/>';
      for (var wy = by + 7; wy < by + bh - 7; wy += 13) {
        for (var wx = bx + 4; wx < bx + 28; wx += 11) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="6" height="8" fill="#8AACBC" stroke="#7A4A38" stroke-width="0.2"/>';
        }
      }
    }
    s += '</g>';

    // === GROUND ===
    s += '<rect x="0" y="364" width="1200" height="136" fill="#5A6A58"/>';
    s += '<rect x="0" y="364" width="1200" height="16" fill="#5A5A58"/>'; // Road
    // Lane markings
    s += '<line x1="0" y1="372" x2="1200" y2="372" stroke="#E8E8D0" stroke-width="0.8" stroke-dasharray="14,10" opacity="0.3"/>';

    // === RED DOUBLE-DECKER BUS ===
    s += '<g transform="translate(250, 364)">';
    s += '<rect x="0" y="-10" width="32" height="10" fill="#CC2222" rx="1.5" stroke="#AA1818" stroke-width="0.5"/>';
    s += '<rect x="0" y="0" width="32" height="10" fill="#CC2222" rx="1.5" stroke="#AA1818" stroke-width="0.5"/>';
    s += '<circle cx="6" cy="12" r="3" fill="#2A2A28" stroke="#444" stroke-width="0.5"/>';
    s += '<circle cx="26" cy="12" r="3" fill="#2A2A28" stroke="#444" stroke-width="0.5"/>';
    s += '<g fill="#A8D8E8" stroke="#AA1818" stroke-width="0.3">';
    for (var bwx = 3; bwx < 29; bwx += 7) {
      s += '<rect x="'+bwx+'" y="-8" width="5" height="6" rx="0.5"/>';
      s += '<rect x="'+bwx+'" y="2" width="5" height="5" rx="0.5"/>';
    }
    s += '</g>';
    s += '</g>';

    // === BLACK CAB ===
    s += '<g transform="translate(800, 368)">';
    s += '<path d="M0,0 Q2,-8 8,-8 L18,-8 Q22,-8 22,0" fill="#1A1A1A" stroke="#333" stroke-width="0.5"/>';
    s += '<rect x="-1" y="0" width="24" height="6" fill="#1A1A1A" rx="1"/>';
    s += '<circle cx="4" cy="8" r="2.5" fill="#2A2A28"/>';
    s += '<circle cx="18" cy="8" r="2.5" fill="#2A2A28"/>';
    s += '<rect x="4" y="-6" width="6" height="4" fill="#8AAAB8" rx="0.5"/>';
    s += '<rect x="12" y="-6" width="6" height="4" fill="#8AAAB8" rx="0.5"/>';
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

  // ===== NEW YORK — Premium illustrated =====
  _city_new_york() {
    var s = '';
    // Dramatic sunset sky over Manhattan
    s += '<linearGradient id="ny-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A2848"/><stop offset="30%" stop-color="#3A4868"/><stop offset="55%" stop-color="#7A6878"/><stop offset="72%" stop-color="#C88868"/><stop offset="85%" stop-color="#E8A858"/><stop offset="100%" stop-color="#F0C878"/></linearGradient>';
    s += '<rect width="1200" height="500" fill="url(#ny-sky)"/>';
    // Warm horizon glow
    s += '<ellipse cx="600" cy="340" rx="500" ry="80" fill="#F0C060" opacity="0.1"/>';

    // Clouds (sunset-tinted)
    s += '<g opacity="0.25">';
    s += '<ellipse cx="200" cy="60" rx="100" ry="18" fill="#8878A8"/>';
    s += '<ellipse cx="230" cy="55" rx="60" ry="14" fill="#9888B0"/>';
    s += '<ellipse cx="700" cy="50" rx="120" ry="20" fill="#8070A0"/>';
    s += '<ellipse cx="740" cy="45" rx="70" ry="15" fill="#9080A8"/>';
    s += '<ellipse cx="1000" cy="65" rx="90" ry="16" fill="#8878A8"/>';
    s += '</g>';

    // === DISTANT BROOKLYN/QUEENS SILHOUETTE ===
    s += '<g opacity="0.1" fill="#5A5870">';
    for (var dx = 0; dx < 1200; dx += 22) {
      var dh = 8 + Math.sin(dx * 0.05) * 5;
      s += '<rect x="'+dx+'" y="'+(285-dh)+'" width="18" height="'+dh+'"/>';
    }
    s += '</g>';

    // === MANHATTAN SKYLINE — Art Deco + Modern skyscrapers ===
    // Helper for building with setbacks
    function nyScraper(x, w, h, setbacks, color, highlight) {
      var bk = '', base = 320, cx = x + w/2;
      bk += '<rect x="'+x+'" y="'+(base-h)+'" width="'+w+'" height="'+h+'" fill="'+(color||'#4A5868')+'" stroke="#2A3848" stroke-width="0.5"/>';
      // Highlight on left face (sunset)
      bk += '<rect x="'+x+'" y="'+(base-h)+'" width="'+(w*0.3)+'" height="'+h+'" fill="'+(highlight||'#C89058')+'" opacity="0.12"/>';
      // Window grid — but varied
      var floorH = h > 100 ? 4 : 5, winW = Math.max(2, w * 0.12);
      for (var fy = base - h + 4; fy < base - 4; fy += floorH + 1.5) {
        for (var fx = x + 2; fx < x + w - 2; fx += winW + 1.5) {
          // Some windows lit warm, some dark, some blue
          var roll = Math.sin(fx * fy * 0.3);
          var wColor = roll > 0.3 ? '#F0D060' : roll > -0.2 ? '#6A8AAA' : '#3A4858';
          var wOpacity = roll > 0.3 ? 0.5 : 0.25;
          bk += '<rect x="'+fx+'" y="'+fy+'" width="'+winW+'" height="'+floorH+'" fill="'+wColor+'" opacity="'+wOpacity+'"/>';
        }
      }
      // Setbacks
      if (setbacks) {
        for (var si = 0; si < setbacks.length; si++) {
          var sb = setbacks[si]; // {atH, inset}
          var sbY = base - sb.atH;
          var sbW = w - sb.inset * 2;
          bk += '<rect x="'+(x+sb.inset)+'" y="'+sbY+'" width="'+sbW+'" height="3" fill="'+(color||'#4A5868')+'" stroke="#2A3848" stroke-width="0.3"/>';
        }
      }
      return bk;
    }

    // Midtown buildings (left cluster)
    s += nyScraper(80, 38, 90, null, '#505868');
    s += nyScraper(122, 32, 70, null, '#586070');
    s += nyScraper(158, 44, 110, [{atH:80,inset:6}], '#4A5060');
    s += nyScraper(206, 36, 85, null, '#546070');

    // === EMPIRE STATE BUILDING ===
    s += '<g>';
    s += nyScraper(255, 52, 170, [{atH:140,inset:8},{atH:120,inset:14}], '#6A6858', '#D0A060');
    // Art Deco crown
    s += '<rect x="271" y="148" width="20" height="8" fill="#7A7868" stroke="#5A5848" stroke-width="0.4"/>';
    s += '<polygon points="276,148 281,138 286,148" fill="#8A8878"/>';
    // Antenna
    s += '<line x1="281" y1="138" x2="281" y2="115" stroke="#8A8878" stroke-width="1.5"/>';
    s += '<circle cx="281" cy="114" r="1.5" fill="#F0C060" opacity="0.4"/>';
    s += '</g>';

    // More midtown
    s += nyScraper(312, 40, 95, null, '#505868');
    s += nyScraper(356, 34, 75, null, '#586070');
    s += nyScraper(394, 46, 105, [{atH:85,inset:8}], '#4A5868');

    // === CHRYSLER BUILDING ===
    s += '<g>';
    s += nyScraper(445, 42, 155, [{atH:130,inset:6},{atH:110,inset:10}], '#6A7078');
    // Sunburst Art Deco crown — distinctive
    s += '<g transform="translate(466, 164)">';
    for (var ca = -40; ca <= 40; ca += 10) {
      var rad = ca * Math.PI / 180;
      var len = 12 + Math.abs(ca) * 0.2;
      s += '<line x1="0" y1="0" x2="'+(Math.sin(rad)*len)+'" y2="'+(-Math.cos(rad)*len)+'" stroke="#C0B8A0" stroke-width="1.2"/>';
    }
    s += '<polygon points="-6,0 0,-18 6,0" fill="#B0A890" stroke="#8A8270" stroke-width="0.5"/>';
    s += '</g>';
    s += '</g>';

    // Park Avenue / gap for Central Park hint
    s += '<rect x="492" y="280" width="35" height="40" fill="#2A4A2A" opacity="0.3" rx="2"/>'; // Central Park green

    // East side buildings
    s += nyScraper(532, 38, 80, null, '#546070');
    s += nyScraper(574, 50, 120, [{atH:95,inset:8}], '#4A5868');
    s += nyScraper(628, 36, 90, null, '#586070');

    // === ONE WORLD TRADE / FREEDOM TOWER ===
    s += '<g>';
    // Tapered form
    s += '<path d="M685,140 L695,140 L702,320 L678,320Z" fill="#6A8098" stroke="#4A6078" stroke-width="0.5"/>';
    // Glass curtain wall — reflective panels
    s += '<g opacity="0.15">';
    for (var fy = 145; fy < 315; fy += 5) {
      var tw = 17 - (fy - 140) * 0.01;
      s += '<line x1="'+(690-tw/2)+'" y1="'+fy+'" x2="'+(690+tw/2)+'" y2="'+fy+'" stroke="#A0C0D8" stroke-width="0.5"/>';
    }
    s += '</g>';
    // Sunset reflection strip
    s += '<rect x="678" y="140" width="6" height="180" fill="#E8A050" opacity="0.08"/>';
    // Antenna
    s += '<line x1="690" y1="140" x2="690" y2="108" stroke="#6A8098" stroke-width="1.8"/>';
    s += '<circle cx="690" cy="107" r="1.5" fill="#F0D060" opacity="0.3"/>';
    s += '</g>';

    // More downtown
    s += nyScraper(710, 34, 75, null, '#505868');
    s += nyScraper(748, 42, 100, null, '#586070');
    s += nyScraper(795, 38, 85, null, '#4A5868');
    s += nyScraper(838, 50, 115, [{atH:90,inset:10}], '#505868');

    // Right side / Financial district
    s += nyScraper(895, 36, 70, null, '#546070');
    s += nyScraper(935, 44, 95, null, '#4A5060');
    s += nyScraper(984, 38, 80, null, '#586070');
    s += nyScraper(1028, 48, 110, [{atH:85,inset:8}], '#505868');
    s += nyScraper(1082, 34, 65, null, '#546070');
    s += nyScraper(1120, 40, 85, null, '#4A5868');

    // === STATUE OF LIBERTY (far left, on water) ===
    s += '<g transform="translate(30, 265)" opacity="0.45">';
    // Pedestal
    s += '<rect x="-8" y="20" width="16" height="30" fill="#7A9A88" stroke="#5A7A68" stroke-width="0.5"/>';
    s += '<rect x="-10" y="48" width="20" height="8" fill="#6A8A78" stroke="#5A7A68" stroke-width="0.4"/>';
    // Figure
    s += '<rect x="-4" y="-5" width="8" height="28" fill="#6A9A78" rx="1"/>';
    // Crown
    s += '<g stroke="#6A9A78" stroke-width="1" fill="none">';
    for (var ra = -60; ra <= 60; ra += 20) {
      var rr = ra * Math.PI / 180;
      s += '<line x1="0" y1="-5" x2="'+(Math.sin(rr)*8)+'" y2="'+(-5-Math.cos(rr)*8)+'"/>';
    }
    s += '</g>';
    // Torch
    s += '<line x1="5" y1="-2" x2="12" y2="-15" stroke="#6A9A78" stroke-width="1.5"/>';
    s += '<ellipse cx="12" cy="-17" rx="3" ry="4" fill="#F0C860" opacity="0.6"/>';
    s += '</g>';

    // === HUDSON RIVER / EAST RIVER ===
    s += '<rect x="0" y="320" width="1200" height="55" fill="#2A3A58" opacity="0.6"/>';
    // Water reflections of lit buildings
    s += '<g opacity="0.06">';
    for (var rx = 80; rx < 1160; rx += 25) {
      var rh = 15 + Math.sin(rx * 0.08) * 8;
      s += '<rect x="'+rx+'" y="322" width="12" height="'+rh+'" fill="#F0C060"/>';
    }
    s += '</g>';
    // Water shimmer
    s += '<g opacity="0.1" stroke="#5A7A98" stroke-width="0.5" stroke-linecap="round">';
    for (var wx = 20; wx < 1180; wx += 18) {
      var wy = 332 + Math.sin(wx * 0.03) * 6;
      s += '<line x1="'+wx+'" y1="'+wy+'" x2="'+(wx+8)+'" y2="'+(wy+0.5)+'"/>';
    }
    s += '</g>';

    // === BRIDGE (Brooklyn Bridge silhouette) ===
    s += '<g opacity="0.25">';
    // Towers
    s += '<rect x="1020" y="275" width="8" height="50" fill="#4A4A48"/>';
    s += '<rect x="1100" y="278" width="8" height="47" fill="#4A4A48"/>';
    // Cables (catenary)
    s += '<path d="M1024,280 Q1064,305 1104,280" fill="none" stroke="#5A5A58" stroke-width="1.5"/>';
    s += '<path d="M1024,285 Q1064,308 1104,285" fill="none" stroke="#5A5A58" stroke-width="0.8"/>';
    // Vertical cable hangers
    for (var cx = 1030; cx < 1100; cx += 8) {
      var cy = 280 + Math.sin(((cx-1024)/80)*Math.PI) * 25;
      s += '<line x1="'+cx+'" y1="'+cy+'" x2="'+cx+'" y2="325" stroke="#5A5A58" stroke-width="0.3"/>';
    }
    // Road deck
    s += '<rect x="1020" y="322" width="88" height="3" fill="#5A5A58"/>';
    s += '</g>';

    // === GROUND — urban pavement ===
    s += '<rect x="0" y="375" width="1200" height="125" fill="#3A3A38"/>';
    // Sidewalk
    s += '<rect x="0" y="375" width="1200" height="14" fill="#6A6A68"/>';
    // Road lanes
    s += '<rect x="0" y="389" width="1200" height="28" fill="#3A3A38"/>';
    s += '<line x1="0" y1="403" x2="1200" y2="403" stroke="#E8E860" stroke-width="1" stroke-dasharray="16,12" opacity="0.3"/>';

    // Yellow cabs
    for (var tc = 0; tc < 4; tc++) {
      var tx = 120 + tc * 280 + Math.sin(tc*3)*30;
      s += '<g transform="translate('+tx+', 393)">';
      s += '<rect x="0" y="0" width="20" height="8" fill="#F0C820" rx="2" stroke="#C8A018" stroke-width="0.4"/>';
      s += '<path d="M3,-2 Q5,-5 10,-5 Q15,-5 17,-2" fill="#F0C820" stroke="#C8A018" stroke-width="0.4"/>';
      s += '<rect x="4" y="-4" width="5" height="3" fill="#88B8D0" rx="0.5"/>';
      s += '<rect x="11" y="-4" width="5" height="3" fill="#88B8D0" rx="0.5"/>';
      s += '<circle cx="4" cy="10" r="2.5" fill="#1A1A1A"/>';
      s += '<circle cx="16" cy="10" r="2.5" fill="#1A1A1A"/>';
      s += '</g>';
    }

    // Street lights
    s += '<g stroke="#4A4A48" stroke-width="1.5">';
    for (var lx = 50; lx < 1200; lx += 80) {
      s += '<line x1="'+lx+'" y1="377" x2="'+lx+'" y2="392"/>';
      s += '<ellipse cx="'+lx+'" cy="376" rx="3" ry="2" fill="#F0E0A0" opacity="0.35" stroke="none"/>';
    }
    s += '</g>';

    return s;
  },

  // ===== TOKYO — Premium illustrated =====
  _city_tokyo() {
    var s = '';
    // Clean pale sky — Tokyo dawn/dusk
    s += '<linearGradient id="tk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C8D8E8"/><stop offset="40%" stop-color="#D8E0EC"/><stop offset="70%" stop-color="#E8E0D8"/><stop offset="90%" stop-color="#F0D8C8"/><stop offset="100%" stop-color="#F0E0D0"/></linearGradient>';
    s += '<rect width="1200" height="500" fill="url(#tk-sky)"/>';

    // Mount Fuji — distant, iconic
    s += '<g opacity="0.3">';
    s += '<polygon points="900,180 980,280 820,280" fill="#8090A8"/>';
    s += '<polygon points="920,200 980,280 860,280" fill="#7888A0" opacity="0.5"/>'; // shadow face
    s += '<polygon points="900,180 870,210 930,210" fill="#E8F0F8" opacity="0.6"/>'; // snow cap
    s += '<polygon points="895,185 880,200 915,200" fill="#F0F4F8" opacity="0.4"/>'; // highlight
    s += '</g>';

    // Soft clouds
    s += '<g opacity="0.3">';
    s += '<ellipse cx="200" cy="55" rx="100" ry="16" fill="#FFF"/>';
    s += '<ellipse cx="230" cy="50" rx="60" ry="12" fill="#F8F8FF"/>';
    s += '<ellipse cx="550" cy="45" rx="120" ry="18" fill="#FFF"/>';
    s += '<ellipse cx="580" cy="40" rx="70" ry="13" fill="#F8F8FF"/>';
    s += '<ellipse cx="1050" cy="60" rx="90" ry="15" fill="#FFF"/>';
    s += '</g>';

    // === DISTANT SKYLINE (atmospheric) ===
    s += '<g opacity="0.1" fill="#8A98A8">';
    for (var dx = 0; dx < 1200; dx += 20) {
      var dh = 8 + Math.sin(dx * 0.05) * 5;
      s += '<rect x="'+dx+'" y="'+(270-dh)+'" width="16" height="'+dh+'"/>';
    }
    s += '</g>';

    // === TOKYO TOWER (red-orange lattice) ===
    s += '<g transform="translate(350, 90)">';
    // Legs
    s += '<path d="M-2,0 L-30,210 L-40,210 Q-22,140 -18,80 Q-10,30 -2,0" fill="#C83828" opacity="0.9"/>';
    s += '<path d="M2,0 L30,210 L40,210 Q22,140 18,80 Q10,30 2,0" fill="#B03020" opacity="0.85"/>';
    // Cross-bracing
    s += '<g stroke="#C83828" stroke-width="0.5" opacity="0.4">';
    for (var ty = 10; ty < 200; ty += 10) {
      var tw = (ty / 210) * 30;
      s += '<line x1="'+(-tw)+'" y1="'+ty+'" x2="'+tw+'" y2="'+ty+'"/>';
      if (ty < 190) {
        var tw2 = ((ty+10) / 210) * 30;
        s += '<line x1="'+(-tw)+'" y1="'+ty+'" x2="'+(-tw2*0.5)+'" y2="'+(ty+10)+'"/>';
        s += '<line x1="'+tw+'" y1="'+ty+'" x2="'+(tw2*0.5)+'" y2="'+(ty+10)+'"/>';
      }
    }
    s += '</g>';
    // Observation platforms
    s += '<rect x="-18" y="65" width="36" height="5" fill="#D04030" rx="1"/>';
    s += '<rect x="-26" y="140" width="52" height="6" fill="#D04030" rx="1"/>';
    // White bands
    s += '<rect x="-14" y="30" width="28" height="4" fill="#F0F0F0" opacity="0.6" rx="0.5"/>';
    s += '<rect x="-22" y="100" width="44" height="4" fill="#F0F0F0" opacity="0.6" rx="0.5"/>';
    // Antenna
    s += '<line x1="0" y1="0" x2="0" y2="-20" stroke="#D04030" stroke-width="2"/>';
    s += '<circle cx="0" cy="-21" r="1.5" fill="#F04040" opacity="0.5"/>';
    s += '</g>';

    // === TOKYO SKYTREE (far right, taller, more modern) ===
    s += '<g transform="translate(1050, 60)" opacity="0.5">';
    // Tapered shaft
    s += '<path d="M-3,0 L-10,240 L10,240 L3,0Z" fill="#8898A8" stroke="#6878888" stroke-width="0.5"/>';
    // Observation decks
    s += '<ellipse cx="0" cy="165" rx="14" ry="4" fill="#98A8B8" stroke="#6878888" stroke-width="0.4"/>';
    s += '<ellipse cx="0" cy="100" rx="10" ry="3" fill="#98A8B8" stroke="#6878888" stroke-width="0.3"/>';
    // Antenna
    s += '<line x1="0" y1="0" x2="0" y2="-30" stroke="#8898A8" stroke-width="1.5"/>';
    s += '</g>';

    // === MAIN BUILDINGS — mixed Japanese architecture ===
    // Modern glass towers
    var towers = [
      {x:100,w:45,h:120,color:'#7888A0'}, {x:150,w:38,h:95,color:'#6A7A92'},
      {x:200,w:55,h:140,color:'#8090A8'}, {x:260,w:40,h:105,color:'#7080A0'},
      {x:420,w:48,h:110,color:'#7A8AA0'}, {x:475,w:36,h:85,color:'#6A7892'},
      {x:520,w:52,h:130,color:'#8090A8'}, {x:580,w:42,h:100,color:'#7888A0'},
      {x:650,w:50,h:115,color:'#7080A0'}, {x:710,w:38,h:90,color:'#6A7A92'},
      {x:760,w:55,h:135,color:'#8090A8'}, {x:825,w:42,h:105,color:'#7888A0'},
      {x:880,w:48,h:95,color:'#7080A0'}, {x:940,w:40,h:110,color:'#7A8AA0'},
      {x:1000,w:36,h:80,color:'#6A7892'}, {x:1100,w:45,h:100,color:'#8090A8'},
      {x:1150,w:38,h:85,color:'#7888A0'}
    ];
    for (var ti = 0; ti < towers.length; ti++) {
      var t = towers[ti];
      var by = 300 - t.h;
      s += '<rect x="'+t.x+'" y="'+by+'" width="'+t.w+'" height="'+t.h+'" fill="'+t.color+'" stroke="#5A6A80" stroke-width="0.4"/>';
      // Glass curtain wall lines
      s += '<g stroke="#6A7A90" stroke-width="0.3" opacity="0.3">';
      for (var fy = by + 3; fy < 298; fy += 4) {
        s += '<line x1="'+t.x+'" y1="'+fy+'" x2="'+(t.x+t.w)+'" y2="'+fy+'"/>';
      }
      for (var fx = t.x + 6; fx < t.x + t.w; fx += 6) {
        s += '<line x1="'+fx+'" y1="'+by+'" x2="'+fx+'" y2="300"/>';
      }
      s += '</g>';
    }

    // === SENSO-JI TEMPLE (foreground left) ===
    s += '<g transform="translate(40, 260)">';
    // Temple gate (Kaminarimon-style)
    s += '<rect x="0" y="8" width="60" height="32" fill="#A83828" stroke="#7A2018" stroke-width="0.8"/>';
    // Pagoda-style roof — multi-tiered with upturned eaves
    s += '<path d="M-8,8 Q30,-5 68,8" fill="#3A2818" stroke="#2A1A0A" stroke-width="0.8"/>';
    s += '<path d="M-4,8 Q30,-2 64,8" fill="#4A3828" stroke="#2A1A0A" stroke-width="0.5"/>'; // highlight ridge
    // Upturned corners
    s += '<path d="M-8,8 Q-12,6 -14,3" fill="none" stroke="#3A2818" stroke-width="1.2"/>';
    s += '<path d="M68,8 Q72,6 74,3" fill="none" stroke="#3A2818" stroke-width="1.2"/>';
    // Lantern
    s += '<ellipse cx="30" cy="22" rx="7" ry="10" fill="#D02020" stroke="#A01818" stroke-width="0.5"/>';
    s += '<line x1="30" y1="12" x2="30" y2="8" stroke="#8A6A4A" stroke-width="1"/>';
    // Kanji hint
    s += '<line x1="28" y1="18" x2="32" y2="18" stroke="#F0E0C0" stroke-width="0.6"/>';
    s += '<line x1="30" y1="16" x2="30" y2="28" stroke="#F0E0C0" stroke-width="0.5"/>';
    s += '</g>';

    // === GROUND ===
    s += '<rect x="0" y="300" width="1200" height="6" fill="#808080"/>'; // Elevated highway
    s += '<rect x="0" y="306" width="1200" height="194" fill="#5A6A58"/>';
    // Railway tracks
    s += '<rect x="0" y="310" width="1200" height="12" fill="#6A6A68"/>';
    s += '<g stroke="#8A8A88" stroke-width="0.6" opacity="0.4">';
    for (var rx = 0; rx < 1200; rx += 8) {
      s += '<line x1="'+rx+'" y1="312" x2="'+rx+'" y2="320"/>';
    }
    s += '</g>';

    // Bullet train
    s += '<g transform="translate(500, 310)">';
    s += '<path d="M-5,2 Q0,-2 5,0 L55,0 Q60,2 60,6 L-5,6Z" fill="#F0F0F0" stroke="#C8C8C8" stroke-width="0.4"/>';
    s += '<path d="M-5,2 Q0,-2 5,0 L5,6 L-5,6Z" fill="#E8E8E8"/>'; // nose
    s += '<line x1="0" y1="1" x2="55" y2="1" stroke="#2828E8" stroke-width="1.2"/>'; // blue stripe
    s += '<g fill="#88B8D0" stroke="#C8C8C8" stroke-width="0.2">';
    for (var wx = 8; wx < 52; wx += 7) { s += '<rect x="'+wx+'" y="2" width="4" height="3" rx="0.3"/>'; }
    s += '</g>';
    s += '</g>';

    // Cherry blossoms (sakura) — scattered petals
    s += '<g opacity="0.5">';
    var sakura = [[60,285],[90,278],[130,290],[180,282],[680,288],[720,275],[800,292],[1060,280],[1120,285]];
    for (var si = 0; si < sakura.length; si++) {
      var sk = sakura[si];
      s += '<rect x="'+(sk[0]-1)+'" y="'+(sk[1]+10)+'" width="2" height="15" fill="#5A3A20" rx="0.5"/>';
      // Blossom clusters — pink
      for (var pi = 0; pi < 5; pi++) {
        var px = sk[0] + Math.cos(pi * 1.25) * (6 + pi * 2);
        var py = sk[1] + Math.sin(pi * 1.8) * (4 + pi * 1.5);
        s += '<circle cx="'+px+'" cy="'+py+'" r="'+(3.5 - pi*0.3)+'" fill="#F0A0B0" opacity="'+(0.7-pi*0.08)+'"/>';
        s += '<circle cx="'+(px+1)+'" cy="'+(py-1)+'" r="'+(2.5-pi*0.2)+'" fill="#F8C0D0" opacity="'+(0.5-pi*0.06)+'"/>';
      }
    }
    s += '</g>';

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
  },

  // ===== HONG KONG =====
  _city_hong_kong() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky-sunset)"/>';

    // Victoria Peak (mountain backdrop)
    s += '<path d="M0,250 Q200,150 400,200 Q600,140 800,190 Q1000,160 1200,220 L1200,300 L0,300Z" fill="#3A5A3A" opacity="0.5"/>';

    // Dense skyscraper skyline
    var hkBuildings = [];
    for (var bx = 10; bx < 1190; bx += 22) {
      var bh = 60 + Math.sin(bx * 0.04) * 40 + Math.cos(bx * 0.07) * 20;
      if (bx > 500 && bx < 700) bh += 40; // IFC area taller
      hkBuildings.push([bx, 280-bh, 18, bh]);
    }
    for (var i = 0; i < hkBuildings.length; i++) {
      var b = hkBuildings[i];
      var shade = 160 + Math.floor(Math.sin(i * 0.7) * 30);
      var color = 'rgb('+shade+','+(shade+10)+','+(shade+20)+')';
      s += '<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" fill="'+color+'" stroke="rgb('+(shade-20)+','+(shade-10)+','+shade+')" stroke-width="0.4"/>';
      // Lit windows (night feel with sunset)
      s += '<g fill="#F0D870" opacity="0.3">';
      for (var wy = b[1]+3; wy < b[1]+b[3]-3; wy += 5) {
        if (Math.random() > 0.3) s += '<rect x="'+(b[0]+2)+'" y="'+wy+'" width="'+(b[2]-4)+'" height="2"/>';
      }
      s += '</g>';
    }

    // IFC Tower (tallest, center)
    s += '<rect x="580" y="100" width="22" height="180" fill="#B0C0D0" stroke="#90A0B0" stroke-width="0.8"/>';
    s += '<polygon points="580,100 591,80 602,100" fill="#C0D0E0"/>';

    // Victoria Harbour
    s += '<path d="M0,300 L1200,300 L1200,340 L0,340Z" fill="url(#c-water)"/>';
    // Night reflections
    s += '<g opacity="0.2">';
    for (var rx = 20; rx < 1180; rx += 25) {
      var rh = 5 + Math.random() * 10;
      s += '<rect x="'+rx+'" y="305" width="2" height="'+rh+'" fill="#F0D870"/>';
    }
    s += '</g>';

    // Star Ferry
    s += '<g transform="translate(600, 315)">';
    s += '<rect x="0" y="0" width="20" height="6" fill="#F0F0E8" rx="2" stroke="#888" stroke-width="0.5"/>';
    s += '<rect x="2" y="-3" width="16" height="4" fill="#2A8A2A" rx="1"/>';
    s += '</g>';

    // Kowloon side (far shore buildings)
    s += '<g opacity="0.4">';
    for (var kx = 0; kx < 1200; kx += 30) {
      var kh = 30 + Math.sin(kx * 0.05) * 15;
      s += '<rect x="'+kx+'" y="'+(340-kh)+'" width="25" height="'+kh+'" fill="#8A9AA8"/>';
    }
    s += '</g>';

    // Ground
    s += '<rect x="0" y="340" width="1200" height="160" fill="#5A6A58"/>';

    // Junk boat
    s += '<g transform="translate(300, 310)" opacity="0.6">';
    s += '<polygon points="0,8 15,0 30,8 25,12 5,12" fill="#8A2A1A"/>';
    s += '<line x1="15" y1="0" x2="15" y2="-12" stroke="#6A4A3A" stroke-width="1"/>';
    s += '<polygon points="15,-12 25,-5 15,0" fill="#C84A2A" opacity="0.7"/>';
    s += '</g>';

    return s;
  },

  // ===== BARCELONA =====
  _city_barcelona() {
    var s = '';
    s += '<rect width="1200" height="500" fill="#A8D0E8"/>';
    s += '<g opacity="0.3"><ellipse cx="250" cy="50" rx="80" ry="16" fill="#fff"/><ellipse cx="700" cy="40" rx="100" ry="18" fill="#fff"/></g>';

    // === SAGRADA FAMILIA ===
    s += '<g transform="translate(500, 80)">';
    // Main facade
    s += '<rect x="0" y="60" width="100" height="120" fill="#D8C8A8" stroke="#B8A888" stroke-width="1"/>';
    // Towers (4 main spires)
    s += '<g fill="#D0C098" stroke="#B0A078" stroke-width="0.8">';
    s += '<rect x="5" y="0" width="12" height="100" rx="4"/><polygon points="5,0 11,-20 17,0" fill="#C8B888"/>';
    s += '<rect x="25" y="10" width="12" height="90" rx="4"/><polygon points="25,10 31,-8 37,10" fill="#C8B888"/>';
    s += '<rect x="63" y="10" width="12" height="90" rx="4"/><polygon points="63,10 69,-8 75,10" fill="#C8B888"/>';
    s += '<rect x="83" y="0" width="12" height="100" rx="4"/><polygon points="83,0 89,-20 95,0" fill="#C8B888"/>';
    s += '</g>';
    // Nativity facade detail
    s += '<path d="M20,60 L50,40 L80,60" fill="none" stroke="#B8A888" stroke-width="1"/>';
    // Rose window
    s += '<circle cx="50" cy="75" r="10" fill="#88AAC8" stroke="#A09878" stroke-width="0.8"/>';
    // Door
    s += '<rect x="38" y="140" width="24" height="40" fill="#5A4A3A" rx="12" ry="12"/>';
    // Organic Gaudi texture hints
    s += '<g stroke="#C0B090" stroke-width="0.3" fill="none" opacity="0.5">';
    for (var gy = 65; gy < 170; gy += 8) {
      s += '<path d="M5,'+gy+' Q50,'+(gy-3)+' 95,'+gy+'" />';
    }
    s += '</g>';
    s += '</g>';

    // Mediterranean buildings
    for (var bx = 0; bx < 1200; bx += 50) {
      if (bx > 470 && bx < 630) continue;
      var bh = 45 + Math.sin(bx * 0.06) * 15;
      var by = 260 - bh;
      var colors = ['#E8D0A8','#D8C098','#E0C8A0','#F0D8B0','#D0B888'];
      var cl = colors[Math.floor(bx / 50) % colors.length];
      s += '<rect x="'+bx+'" y="'+by+'" width="44" height="'+bh+'" fill="'+cl+'" stroke="#C0A880" stroke-width="0.5"/>';
      // Tiled roof
      s += '<path d="M'+(bx-1)+','+by+' L'+(bx+22)+','+(by-6)+' L'+(bx+45)+','+by+'" fill="#C07848" stroke="#A05830" stroke-width="0.4"/>';
      // Windows
      for (var wy = by + 8; wy < by + bh - 8; wy += 13) {
        for (var wx = bx + 6; wx < bx + 38; wx += 12) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="6" height="8" fill="#88B8D0" stroke="#B0A080" stroke-width="0.3"/>';
        }
      }
      // Balcony (some buildings)
      if (bx % 100 < 50) {
        var balY = by + 20;
        s += '<line x1="'+(bx+5)+'" y1="'+balY+'" x2="'+(bx+39)+'" y2="'+balY+'" stroke="#4A4A4A" stroke-width="0.8"/>';
        s += '<g fill="#3A7A3A" opacity="0.5">';
        s += '<ellipse cx="'+(bx+15)+'" cy="'+(balY-2)+'" rx="4" ry="3"/>';
        s += '<ellipse cx="'+(bx+30)+'" cy="'+(balY-2)+'" rx="4" ry="3"/>';
        s += '</g>';
      }
    }

    // Mediterranean Sea
    s += '<rect x="0" y="300" width="1200" height="200" fill="url(#c-water)"/>';
    // Beach
    s += '<rect x="0" y="295" width="1200" height="8" fill="#E8D8B0"/>';

    // La Rambla (tree-lined boulevard)
    s += '<rect x="0" y="260" width="1200" height="40" fill="url(#c-road)" opacity="0.6"/>';
    s += '<g fill="#4A8A38">';
    for (var tx = 20; tx < 1180; tx += 30) {
      s += '<ellipse cx="'+tx+'" cy="262" rx="10" ry="8"/>';
    }
    s += '</g>';

    return s;
  },

  // ===== AMSTERDAM =====
  _city_amsterdam() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    s += '<g opacity="0.4"><ellipse cx="300" cy="50" rx="100" ry="20" fill="#E0E0E0"/><ellipse cx="800" cy="40" rx="90" ry="18" fill="#E0E0E0"/></g>';

    // Canal houses - tall narrow buildings with distinctive gable tops
    var gableTypes = ['step','bell','neck','spout','triangle'];
    for (var hx = 20; hx < 1180; hx += 38) {
      var hh = 60 + Math.sin(hx * 0.08) * 12;
      var hy = 230 - hh;
      var gable = gableTypes[Math.floor(hx / 38) % gableTypes.length];
      var colors = ['#C85838','#A04828','#8A3818','#D08858','#B06038','#C87048'];
      var cl = colors[Math.floor(hx / 38) % colors.length];

      s += '<rect x="'+hx+'" y="'+hy+'" width="32" height="'+hh+'" fill="'+cl+'" stroke="#6A3818" stroke-width="0.6"/>';

      // Gable shapes
      var gx = hx, gw = 32;
      if (gable === 'step') {
        s += '<path d="M'+gx+','+hy+' L'+gx+','+(hy-5)+' L'+(gx+5)+','+(hy-5)+' L'+(gx+5)+','+(hy-10)+' L'+(gx+11)+','+(hy-10)+' L'+(gx+16)+','+(hy-18)+' L'+(gx+21)+','+(hy-10)+' L'+(gx+27)+','+(hy-10)+' L'+(gx+27)+','+(hy-5)+' L'+(gx+32)+','+(hy-5)+' L'+(gx+32)+','+hy+'Z" fill="'+cl+'" stroke="#6A3818" stroke-width="0.5"/>';
      } else if (gable === 'bell') {
        s += '<path d="M'+gx+','+hy+' Q'+(gx+16)+','+(hy-22)+' '+(gx+32)+','+hy+'" fill="'+cl+'" stroke="#6A3818" stroke-width="0.5"/>';
      } else {
        s += '<polygon points="'+gx+','+hy+' '+(gx+16)+','+(hy-15)+' '+(gx+32)+','+hy+'" fill="'+cl+'" stroke="#6A3818" stroke-width="0.5"/>';
      }

      // Windows (tall, narrow Dutch style)
      for (var wy = hy + 6; wy < hy + hh - 8; wy += 14) {
        s += '<rect x="'+(hx+4)+'" y="'+wy+'" width="10" height="11" fill="#8AB0C8" stroke="#7A4A28" stroke-width="0.3"/>';
        s += '<rect x="'+(hx+18)+'" y="'+wy+'" width="10" height="11" fill="#8AB0C8" stroke="#7A4A28" stroke-width="0.3"/>';
        // Cross bars
        s += '<line x1="'+(hx+9)+'" y1="'+wy+'" x2="'+(hx+9)+'" y2="'+(wy+11)+'" stroke="#7A4A28" stroke-width="0.3"/>';
        s += '<line x1="'+(hx+23)+'" y1="'+wy+'" x2="'+(hx+23)+'" y2="'+(wy+11)+'" stroke="#7A4A28" stroke-width="0.3"/>';
      }

      // Hook beam at top
      s += '<line x1="'+(hx+16)+'" y1="'+(hy-5)+'" x2="'+(hx+16)+'" y2="'+(hy-10)+'" stroke="#5A3A1A" stroke-width="1"/>';
    }

    // Canals
    s += '<rect x="0" y="290" width="1200" height="30" fill="url(#c-water)"/>';
    // Canal reflections
    s += '<g opacity="0.15">';
    for (var rx = 20; rx < 1180; rx += 38) {
      s += '<rect x="'+rx+'" y="292" width="30" height="25" fill="#C85838" rx="1"/>';
    }
    s += '</g>';

    // Bridges
    for (var bridgeX = 150; bridgeX < 1100; bridgeX += 200) {
      s += '<path d="M'+bridgeX+',290 Q'+(bridgeX+20)+',280 '+(bridgeX+40)+',290" fill="none" stroke="#8A8078" stroke-width="2.5"/>';
      s += '<rect x="'+(bridgeX-2)+'" y="288" width="44" height="3" fill="#9A9088"/>';
    }

    // Ground
    s += '<rect x="0" y="320" width="1200" height="180" fill="#8A7A68"/>';
    // Bicycle lane
    s += '<rect x="0" y="320" width="1200" height="8" fill="#C85030" opacity="0.4"/>';

    // Bicycles
    for (var bkx = 50; bkx < 1150; bkx += 120) {
      s += '<g transform="translate('+bkx+', 325)" opacity="0.5">';
      s += '<circle cx="0" cy="0" r="3" fill="none" stroke="#333" stroke-width="0.8"/>';
      s += '<circle cx="8" cy="0" r="3" fill="none" stroke="#333" stroke-width="0.8"/>';
      s += '<line x1="0" y1="0" x2="4" y2="-4" stroke="#333" stroke-width="0.6"/>';
      s += '<line x1="4" y1="-4" x2="8" y2="0" stroke="#333" stroke-width="0.6"/>';
      s += '</g>';
    }

    // Tulips in window boxes
    s += '<g opacity="0.6">';
    for (var tlx = 60; tlx < 1150; tlx += 76) {
      s += '<rect x="'+tlx+'" y="225" width="15" height="4" fill="#5A4030"/>';
      s += '<circle cx="'+(tlx+3)+'" cy="223" r="2" fill="#E03050"/>';
      s += '<circle cx="'+(tlx+8)+'" cy="222" r="2" fill="#F0E030"/>';
      s += '<circle cx="'+(tlx+12)+'" cy="223" r="2" fill="#E03050"/>';
    }
    s += '</g>';

    return s;
  },

  // ===== MUMBAI =====
  _city_mumbai() {
    var s = '';
    // Hazy tropical sky
    s += '<rect width="1200" height="500" fill="#D0D8D8"/>';
    s += '<rect width="1200" height="250" fill="#B8CCE0" opacity="0.4"/>';

    // === GATEWAY OF INDIA ===
    s += '<g transform="translate(500, 160)">';
    s += '<rect x="0" y="30" width="80" height="80" fill="#D8C8A0" stroke="#B0A078" stroke-width="1"/>';
    // Central arch
    s += '<path d="M25,110 L25,50 Q40,30 55,50 L55,110" fill="#8A7A5A" stroke="#A09068" stroke-width="0.8"/>';
    // Towers
    s += '<rect x="-5" y="10" width="15" height="100" fill="#D0C098" stroke="#B0A078" stroke-width="0.8"/>';
    s += '<rect x="70" y="10" width="15" height="100" fill="#D0C098" stroke="#B0A078" stroke-width="0.8"/>';
    // Domes
    s += '<ellipse cx="2" cy="10" rx="8" ry="8" fill="#D8C8A0" stroke="#B0A078" stroke-width="0.5"/>';
    s += '<ellipse cx="77" cy="10" rx="8" ry="8" fill="#D8C8A0" stroke="#B0A078" stroke-width="0.5"/>';
    s += '<ellipse cx="40" cy="25" rx="14" ry="12" fill="#D8C8A0" stroke="#B0A078" stroke-width="0.8"/>';
    // Finials
    s += '<line x1="2" y1="2" x2="2" y2="-5" stroke="#B0A078" stroke-width="1"/>';
    s += '<line x1="77" y1="2" x2="77" y2="-5" stroke="#B0A078" stroke-width="1"/>';
    s += '<line x1="40" y1="13" x2="40" y2="5" stroke="#B0A078" stroke-width="1"/>';
    s += '</g>';

    // Dense city buildings (mix of old and new)
    for (var bx = 0; bx < 1200; bx += 35) {
      if (bx > 470 && bx < 610) continue;
      var bh = 40 + Math.sin(bx * 0.06) * 20 + Math.random() * 15;
      var by = 270 - bh;
      var isModern = Math.random() > 0.6;
      if (isModern) {
        s += '<rect x="'+bx+'" y="'+by+'" width="30" height="'+bh+'" fill="#B0B8C0" stroke="#90A0A8" stroke-width="0.5"/>';
        s += '<g fill="#88A0B0" opacity="0.3">';
        for (var wy = by+3; wy < by+bh-3; wy += 5) {
          s += '<rect x="'+(bx+2)+'" y="'+wy+'" width="26" height="3"/>';
        }
        s += '</g>';
      } else {
        var oldColors = ['#D8C8A0','#C8B890','#D0C098','#E0D0A8'];
        s += '<rect x="'+bx+'" y="'+by+'" width="30" height="'+bh+'" fill="'+oldColors[Math.floor(bx/35)%4]+'" stroke="#A09868" stroke-width="0.5"/>';
        for (var wy = by+6; wy < by+bh-6; wy += 11) {
          for (var wx = bx+4; wx < bx+26; wx += 10) {
            s += '<rect x="'+wx+'" y="'+wy+'" width="6" height="7" fill="#7A98A8" stroke="#A09068" stroke-width="0.3"/>';
          }
        }
      }
    }

    // Arabian Sea
    s += '<rect x="0" y="290" width="1200" height="210" fill="url(#c-water)"/>';
    s += '<rect x="0" y="285" width="1200" height="8" fill="#C8B8A0" opacity="0.5"/>';

    // Fishing boats
    s += '<g opacity="0.5">';
    var boats = [100,300,700,900,1050];
    for (var i = 0; i < boats.length; i++) {
      var bx = boats[i];
      s += '<path d="M'+bx+',310 Q'+(bx+10)+',305 '+(bx+20)+',310 L'+(bx+18)+',315 L'+(bx+2)+',315Z" fill="#8A6A4A"/>';
      s += '<line x1="'+(bx+10)+'" y1="305" x2="'+(bx+10)+'" y2="295" stroke="#6A5A4A" stroke-width="0.8"/>';
    }
    s += '</g>';

    // Auto-rickshaw
    s += '<g transform="translate(200, 272)">';
    s += '<rect x="0" y="0" width="10" height="8" fill="#2A8A2A" rx="2"/>';
    s += '<rect x="10" y="1" width="8" height="6" fill="#F0E830" rx="1"/>';
    s += '<circle cx="3" cy="10" r="2" fill="#444"/>';
    s += '<circle cx="15" cy="10" r="2" fill="#444"/>';
    s += '</g>';

    return s;
  },

  // ===== LOS ANGELES =====
  _city_los_angeles() {
    var s = '';
    s += '<rect width="1200" height="500" fill="#E0D8C8"/>';
    s += '<rect width="1200" height="300" fill="#B8D0E8" opacity="0.5"/>';
    // Hollywood hills
    s += '<path d="M0,250 Q200,200 400,230 Q600,190 800,220 Q1000,200 1200,240 L1200,300 L0,300Z" fill="#8AA868" opacity="0.6"/>';
    // Hollywood sign
    s += '<g transform="translate(250, 210)" opacity="0.5"><text font-size="14" fill="#FFF" font-weight="800" font-family="sans-serif" letter-spacing="3">HOLLYWOOD</text></g>';
    // Downtown LA skyline
    var laBuildings = [[400,120,30,160],[440,140,25,140],[480,100,35,180],[530,130,28,150],[570,110,32,170],[620,140,26,140],[660,125,30,155],[710,145,24,135],[750,135,28,145],[800,150,22,130]];
    for (var i = 0; i < laBuildings.length; i++) {
      var b = laBuildings[i];
      s += '<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" fill="#C8D0D8" stroke="#A8B0B8" stroke-width="0.5"/>';
      s += '<g fill="#8AA8C0" opacity="0.3">';
      for (var wy = b[1]+4; wy < b[1]+b[3]-4; wy += 6) { s += '<rect x="'+(b[0]+2)+'" y="'+wy+'" width="'+(b[2]-4)+'" height="3"/>'; }
      s += '</g>';
    }
    // Ground
    s += '<rect x="0" y="280" width="1200" height="220" fill="#C8B898"/>';
    // Highway
    s += '<rect x="0" y="280" width="1200" height="20" fill="#5A5A58"/>';
    s += '<g stroke="#F0E830" stroke-width="1" stroke-dasharray="12,8" opacity="0.5"><line x1="0" y1="290" x2="1200" y2="290"/></g>';
    // Palm trees
    for (var px = 30; px < 1180; px += 80) {
      s += '<path d="M'+px+',310 Q'+(px+2)+',285 '+(px+1)+',260" fill="none" stroke="#7A6A4A" stroke-width="3"/>';
      s += '<g fill="#5A9A48" opacity="0.7">';
      for (var f = 0; f < 5; f++) {
        var a = -50 + f * 25;
        s += '<path d="M'+(px+1)+',260 Q'+(px+1+Math.cos(a*0.017)*22)+','+(258+Math.sin(a*0.017)*8)+' '+(px+1+Math.cos(a*0.017)*30)+',265" fill="none" stroke="#5A9A48" stroke-width="1.8"/>';
      }
      s += '</g>';
    }
    // Beach/ocean at bottom
    s += '<rect x="0" y="380" width="1200" height="120" fill="#5A9AB0"/>';
    s += '<rect x="0" y="375" width="1200" height="8" fill="#E8D8B0"/>';
    return s;
  },

  // ===== MIAMI =====
  _city_miami() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    s += '<rect width="1200" height="500" fill="#E0F0F8" opacity="0.2"/>';
    // Art deco buildings (South Beach style)
    var miamiColors = ['#F0A8B8','#A8D8E8','#F0E8A0','#B8E8C0','#E8B8D0','#A8C8F0','#F0C8A0'];
    for (var bx = 30; bx < 1180; bx += 45) {
      var bh = 50 + Math.sin(bx * 0.06) * 15;
      var by = 250 - bh;
      var cl = miamiColors[Math.floor(bx/45) % miamiColors.length];
      s += '<rect x="'+bx+'" y="'+by+'" width="38" height="'+bh+'" fill="'+cl+'" stroke="#C0A8B0" stroke-width="0.6" rx="1"/>';
      // Art deco lines
      s += '<line x1="'+bx+'" y1="'+(by+5)+'" x2="'+(bx+38)+'" y2="'+(by+5)+'" stroke="#FFF" stroke-width="0.8" opacity="0.5"/>';
      s += '<line x1="'+bx+'" y1="'+(by+10)+'" x2="'+(bx+38)+'" y2="'+(by+10)+'" stroke="#FFF" stroke-width="0.5" opacity="0.3"/>';
      // Windows
      for (var wy = by+15; wy < by+bh-8; wy += 12) {
        for (var wx = bx+5; wx < bx+33; wx += 11) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="7" height="8" fill="#88C8E0" stroke="'+cl+'" stroke-width="0.3" rx="0.5"/>';
        }
      }
    }
    // Ocean
    s += '<rect x="0" y="300" width="1200" height="200" fill="#48A8C8"/>';
    s += '<rect x="0" y="295" width="1200" height="8" fill="#F0E0C0"/>';
    // Palm trees
    for (var px = 50; px < 1150; px += 70) {
      s += '<path d="M'+px+',290 Q'+(px+2)+',272 '+(px+1)+',255" fill="none" stroke="#7A6A4A" stroke-width="2.5"/>';
      for (var f = 0; f < 5; f++) {
        var a = -50+f*25;
        s += '<path d="M'+(px+1)+',255 Q'+(px+1+Math.cos(a*0.017)*20)+','+(253+Math.sin(a*0.017)*8)+' '+(px+1+Math.cos(a*0.017)*28)+',260" fill="none" stroke="#5A9A40" stroke-width="1.5"/>';
      }
    }
    return s;
  },

  // ===== BERLIN =====
  _city_berlin() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    // Brandenburg Gate
    s += '<g transform="translate(500, 180)">';
    // Columns (6)
    for (var i = 0; i < 6; i++) {
      s += '<rect x="'+(i*20)+'" y="15" width="8" height="65" fill="#D8D0C0" stroke="#B0A890" stroke-width="0.5"/>';
    }
    // Entablature
    s += '<rect x="-5" y="10" width="110" height="8" fill="#D0C8B8" stroke="#B0A890" stroke-width="0.5"/>';
    // Quadriga
    s += '<rect x="25" y="-10" width="50" height="22" fill="#C8C0B0" stroke="#B0A890" stroke-width="0.8"/>';
    s += '<path d="M30,-10 Q50,-25 70,-10" fill="#C8C0B0" stroke="#B0A890" stroke-width="0.5"/>';
    // Chariot on top
    s += '<g transform="translate(50, -22)" opacity="0.7"><rect x="-6" y="0" width="12" height="5" fill="#8A9A68"/><circle cx="-4" cy="7" r="2" fill="#6A7A48"/><circle cx="4" cy="7" r="2" fill="#6A7A48"/></g>';
    s += '</g>';
    // TV Tower (Fernsehturm)
    s += '<g transform="translate(800, 40)">';
    s += '<line x1="0" y1="0" x2="0" y2="230" stroke="#B0B0B0" stroke-width="2"/>';
    s += '<ellipse cx="0" cy="120" rx="12" ry="15" fill="#C0C0C8" stroke="#A0A0A8" stroke-width="0.8"/>';
    s += '<circle cx="0" cy="120" r="4" fill="#D0D0D8"/>';
    s += '</g>';
    // Buildings
    for (var bx = 20; bx < 1180; bx += 40) {
      if (bx > 470 && bx < 640) continue;
      var bh = 45 + Math.sin(bx*0.07)*15;
      var by = 260 - bh;
      s += '<rect x="'+bx+'" y="'+by+'" width="34" height="'+bh+'" fill="#D0C8C0" stroke="#A0A098" stroke-width="0.5"/>';
      for (var wy = by+6; wy < by+bh-6; wy += 11) {
        for (var wx = bx+4; wx < bx+30; wx += 10) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="6" height="7" fill="#88AAC0" stroke="#B0A8A0" stroke-width="0.2"/>';
        }
      }
    }
    s += '<rect x="0" y="280" width="1200" height="220" fill="url(#c-ground)"/>';
    s += '<rect x="0" y="280" width="1200" height="14" fill="url(#c-road)"/>';
    return s;
  },

  // ===== TORONTO =====
  _city_toronto() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    // CN Tower
    s += '<g transform="translate(600, 30)">';
    s += '<line x1="0" y1="0" x2="0" y2="250" stroke="#B8B8B8" stroke-width="3"/>';
    s += '<ellipse cx="0" cy="160" rx="14" ry="18" fill="#C8C8D0" stroke="#A8A8B0" stroke-width="0.8"/>';
    s += '<rect x="-16" y="155" width="32" height="8" fill="#D0D0D8" rx="2"/>';
    s += '<polygon points="-2,0 0,-15 2,0" fill="#D0D0D0"/>';
    s += '</g>';
    // City buildings
    for (var bx = 20; bx < 1180; bx += 35) {
      var bh = 50+Math.sin(bx*0.06)*25;
      var by = 280-bh;
      s += '<rect x="'+bx+'" y="'+by+'" width="30" height="'+bh+'" fill="#B0B8C8" stroke="#9098A8" stroke-width="0.4"/>';
      s += '<g fill="#88A0B8" opacity="0.3">';
      for (var wy = by+3; wy < by+bh-3; wy += 5) { s += '<rect x="'+(bx+2)+'" y="'+wy+'" width="26" height="3"/>'; }
      s += '</g>';
    }
    // Lake Ontario
    s += '<rect x="0" y="310" width="1200" height="190" fill="url(#c-water)"/>';
    s += '<rect x="0" y="305" width="1200" height="8" fill="url(#c-road)"/>';
    // Maple trees
    for (var tx = 40; tx < 1160; tx += 90) {
      s += '<rect x="'+(tx-1)+'" y="290" width="2" height="15" fill="#5A3828"/>';
      s += '<ellipse cx="'+tx+'" cy="282" rx="10" ry="12" fill="#C83828"/>';
      s += '<ellipse cx="'+(tx-4)+'" cy="286" rx="7" ry="8" fill="#E84838" opacity="0.7"/>';
    }
    return s;
  },

  // ===== MONACO =====
  _city_monaco() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    // Hills/cliffs
    s += '<path d="M0,200 Q200,150 400,180 Q600,130 800,170 Q1000,140 1200,190 L1200,300 L0,300Z" fill="#6A8A58"/>';
    // Monte Carlo Casino
    s += '<g transform="translate(500, 160)">';
    s += '<rect x="0" y="20" width="80" height="50" fill="#E8D8C0" stroke="#C0B098" stroke-width="1"/>';
    s += '<rect x="-5" y="15" width="90" height="8" fill="#D0C0A0" stroke="#B0A080" stroke-width="0.5"/>';
    s += '<ellipse cx="40" cy="15" rx="20" ry="15" fill="#5A8A7A" stroke="#4A7A6A" stroke-width="0.8"/>';
    s += '<rect x="33" y="45" width="14" height="25" fill="#5A3A20" rx="7" ry="7"/>';
    for (var wx = 8; wx < 75; wx += 14) {
      s += '<rect x="'+wx+'" y="28" width="8" height="12" fill="#8AB0C8" rx="4" ry="4" stroke="#C0B098" stroke-width="0.3"/>';
    }
    s += '</g>';
    // Luxury buildings cascading down hillside
    for (var bx = 30; bx < 1170; bx += 42) {
      if (bx > 470 && bx < 610) continue;
      var hillY = 200 - Math.sin((bx/1200)*Math.PI) * 50;
      var bh = 35 + Math.random() * 20;
      s += '<rect x="'+bx+'" y="'+(hillY-bh)+'" width="36" height="'+bh+'" fill="#F0E8D8" stroke="#D0C0A0" stroke-width="0.5"/>';
      s += '<path d="M'+(bx-1)+','+(hillY-bh)+' L'+(bx+18)+','+(hillY-bh-5)+' L'+(bx+37)+','+(hillY-bh)+'" fill="#C87848"/>';
    }
    // Mediterranean
    s += '<rect x="0" y="300" width="1200" height="200" fill="#3888B0"/>';
    s += '<rect x="0" y="295" width="1200" height="8" fill="#D0C8B0"/>';
    // Yachts
    s += '<g fill="#FFF" stroke="#888" stroke-width="0.5">';
    s += '<polygon points="200,320 220,315 240,320 235,325 205,325"/>';
    s += '<line x1="220" y1="315" x2="220" y2="305" stroke="#888" stroke-width="0.8"/>';
    s += '<polygon points="600,315 618,310 636,315 632,320 604,320"/>';
    s += '<line x1="618" y1="310" x2="618" y2="300" stroke="#888" stroke-width="0.8"/>';
    s += '</g>';
    // F1 track hint (red barriers)
    s += '<g stroke="#E03030" stroke-width="2" opacity="0.3"><path d="M100,295 Q300,290 500,295 Q700,298 900,293" fill="none"/></g>';
    return s;
  },

  // ===== SHANGHAI =====
  _city_shanghai() {
    var s = '';
    s += '<rect width="1200" height="500" fill="#C8D0D8"/>';
    s += '<rect width="1200" height="200" fill="#A0B8D0" opacity="0.3"/>';
    // Oriental Pearl Tower
    s += '<g transform="translate(500, 50)">';
    s += '<line x1="0" y1="0" x2="0" y2="230" stroke="#C8A8B8" stroke-width="2.5"/>';
    s += '<circle cx="0" cy="80" r="16" fill="#D888A0" stroke="#C878A0" stroke-width="1"/>';
    s += '<circle cx="0" cy="140" r="12" fill="#D888A0" stroke="#C878A0" stroke-width="0.8"/>';
    s += '<circle cx="0" cy="80" r="5" fill="#E8A8B8"/>';
    s += '<rect x="-18" y="155" width="36" height="6" fill="#C8A8B8" rx="1"/>';
    s += '<polygon points="-3,0 0,-12 3,0" fill="#D0B0C0"/>';
    // Support legs
    s += '<line x1="-12" y1="155" x2="-20" y2="230" stroke="#C8A8B8" stroke-width="1.5"/>';
    s += '<line x1="12" y1="155" x2="20" y2="230" stroke="#C8A8B8" stroke-width="1.5"/>';
    s += '</g>';
    // Shanghai Tower, SWFC, Jin Mao
    s += '<rect x="600" y="40" width="20" height="240" fill="#A8B8C8" stroke="#8898A8" stroke-width="0.5" rx="3"/>';
    s += '<rect x="650" y="60" width="22" height="220" fill="#B0C0D0" stroke="#90A0B0" stroke-width="0.5"/>';
    s += '<rect x="648" y="100" width="26" height="8" fill="#C0D0E0"/>';
    s += '<rect x="700" y="70" width="18" height="210" fill="#C8C0A8" stroke="#A8A088" stroke-width="0.5"/>';
    // Pudong buildings
    for (var bx = 350; bx < 900; bx += 28) {
      if (bx > 480 && bx < 730) continue;
      var bh = 50+Math.sin(bx*0.06)*30;
      s += '<rect x="'+bx+'" y="'+(280-bh)+'" width="24" height="'+bh+'" fill="#B8C0C8" stroke="#98A0A8" stroke-width="0.4"/>';
    }
    // Puxi side (older buildings)
    for (var bx = 20; bx < 340; bx += 35) {
      var bh = 35+Math.sin(bx*0.08)*10;
      s += '<rect x="'+bx+'" y="'+(270-bh)+'" width="30" height="'+bh+'" fill="#D0C8B8" stroke="#B0A898" stroke-width="0.4"/>';
    }
    for (var bx = 920; bx < 1180; bx += 35) {
      var bh = 35+Math.cos(bx*0.08)*10;
      s += '<rect x="'+bx+'" y="'+(270-bh)+'" width="30" height="'+bh+'" fill="#D0C8B8" stroke="#B0A898" stroke-width="0.4"/>';
    }
    // Huangpu River
    s += '<path d="M0,290 Q300,285 600,292 Q900,298 1200,288 L1200,320 L0,320Z" fill="url(#c-water)"/>';
    s += '<rect x="0" y="320" width="1200" height="180" fill="url(#c-ground)"/>';
    return s;
  },

  // ===== SAO PAULO =====
  _city_sao_paulo() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    // Dense concrete jungle
    for (var bx = 10; bx < 1190; bx += 25) {
      var bh = 40+Math.sin(bx*0.05)*25+Math.random()*15;
      var by = 280-bh;
      var shade = 170+Math.floor(Math.sin(bx*0.1)*20);
      s += '<rect x="'+bx+'" y="'+by+'" width="22" height="'+bh+'" fill="rgb('+shade+','+shade+','+(shade-10)+')" stroke="rgb('+(shade-20)+','+(shade-20)+','+(shade-30)+')" stroke-width="0.3"/>';
      s += '<g fill="#88A0B0" opacity="0.3">';
      for (var wy = by+3; wy < by+bh-3; wy += 5) { s += '<rect x="'+(bx+1)+'" y="'+wy+'" width="20" height="3"/>'; }
      s += '</g>';
    }
    s += '<rect x="0" y="280" width="1200" height="220" fill="url(#c-ground)"/>';
    s += '<rect x="0" y="280" width="1200" height="14" fill="url(#c-road)"/>';
    // Ibirapuera Park
    s += '<ellipse cx="600" cy="340" rx="80" ry="30" fill="#4A8A40" opacity="0.4"/>';
    for (var tx = 540; tx < 660; tx += 18) {
      s += '<ellipse cx="'+tx+'" cy="'+(335+Math.sin(tx*0.1)*4)+'" rx="8" ry="10" fill="#3A7A30"/>';
    }
    return s;
  },

  // ===== CAPE TOWN =====
  _city_cape_town() {
    var s = '';
    s += '<rect width="1200" height="500" fill="url(#c-sky)"/>';
    // Table Mountain
    s += '<path d="M200,220 L300,120 L400,120 L500,120 L600,120 L700,120 L800,120 L900,120 L1000,220" fill="#6A7A5A" stroke="#5A6A4A" stroke-width="1.5"/>';
    // Flat top characteristic
    s += '<rect x="300" y="120" width="600" height="3" fill="#5A6A4A"/>';
    // Rock texture
    s += '<g stroke="#5A6A4A" stroke-width="0.5" opacity="0.3">';
    for (var ry = 130; ry < 220; ry += 10) {
      s += '<path d="M'+(250+Math.sin(ry)*20)+','+ry+' Q600,'+(ry-3)+' '+(950-Math.sin(ry)*20)+','+ry+'" fill="none"/>';
    }
    s += '</g>';
    // Tablecloth (cloud on mountain)
    s += '<g fill="#FFF" opacity="0.3"><ellipse cx="500" cy="118" rx="150" ry="10"/><ellipse cx="600" cy="115" rx="120" ry="8"/></g>';
    // Buildings
    for (var bx = 50; bx < 1150; bx += 40) {
      var bh = 30+Math.sin(bx*0.07)*12;
      var by = 260-bh;
      s += '<rect x="'+bx+'" y="'+by+'" width="34" height="'+bh+'" fill="#E0D8C8" stroke="#C0B8A8" stroke-width="0.4"/>';
      s += '<path d="M'+(bx-1)+','+by+' L'+(bx+17)+','+(by-5)+' L'+(bx+35)+','+by+'" fill="#A06838"/>';
      for (var wy = by+6; wy < by+bh-5; wy += 10) {
        for (var wx = bx+5; wx < bx+30; wx += 10) {
          s += '<rect x="'+wx+'" y="'+wy+'" width="6" height="6" fill="#88AAC0" stroke="#C0B098" stroke-width="0.2"/>';
        }
      }
    }
    // Ocean
    s += '<rect x="0" y="290" width="1200" height="210" fill="#3888B0"/>';
    s += '<rect x="0" y="285" width="1200" height="8" fill="#E0D0B0"/>';
    // V&A Waterfront hint
    s += '<rect x="400" y="275" width="120" height="15" fill="#C0B8A8" stroke="#A0A098" stroke-width="0.5"/>';
    return s;
  }
};
