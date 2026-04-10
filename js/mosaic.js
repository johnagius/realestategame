/* ========================================
   PROPERTY EMPIRE — Pixel Mosaic World Map
   1.28M pixel canvas with realistic terrain
   ======================================== */

const Mosaic = {

  MAP_W: 1600,
  MAP_H: 800,

  // Simple Perlin-like noise for natural terrain variation
  _seed: 42,
  _perm: null,

  initNoise: function() {
    this._perm = new Uint8Array(512);
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++) p[i] = i;
    // Shuffle with seed
    var s = this._seed;
    for (var i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      var j = s % (i + 1);
      var t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (var i = 0; i < 512; i++) this._perm[i] = p[i & 255];
  },

  noise2D: function(x, y) {
    if (!this._perm) this.initNoise();
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    var xf = x - Math.floor(x), yf = y - Math.floor(y);
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var p = this._perm;
    var aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
    var ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    var x1 = aa / 255 * (1 - u) + ba / 255 * u;
    var x2 = ab / 255 * (1 - u) + bb / 255 * u;
    return x1 * (1 - v) + x2 * v; // 0-1
  },

  // Fractal Brownian Motion — layered noise for natural terrain
  fbm: function(x, y, octaves) {
    var val = 0, amp = 1, freq = 1, max = 0;
    for (var i = 0; i < (octaves || 4); i++) {
      val += this.noise2D(x * freq, y * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / max; // 0-1
  },

  // ========== ELEVATION BUMPS ==========
  // Each bump: [x, y, radius, height] in normalized 0-1 coords
  // Hundreds of bumps sculpt the terrain like clay
  _bumps: null,

  buildBumps: function() {
    var b = [];
    // Helper: add a row of bumps along a line (for coastlines, ridges)
    function line(x1,y1,x2,y2,r,h,n) {
      for (var i = 0; i <= n; i++) {
        var t = i / n;
        b.push([x1+(x2-x1)*t, y1+(y2-y1)*t, r, h]);
      }
    }
    // Helper: fill an area with bumps
    function fill(x1,y1,x2,y2,r,h,density) {
      var cols = Math.ceil((x2-x1) / (r * density));
      var rows = Math.ceil((y2-y1) / (r * density));
      for (var iy = 0; iy <= rows; iy++) {
        for (var ix = 0; ix <= cols; ix++) {
          b.push([x1+(x2-x1)*ix/cols, y1+(y2-y1)*iy/rows, r, h]);
        }
      }
    }

    // ===== NORTH AMERICA =====
    // Main body — dense coverage from Alaska to Mexico
    fill(0.05, 0.10, 0.22, 0.38, 0.04, 0.42, 0.7); // Northern core (Canada)
    fill(0.08, 0.22, 0.20, 0.42, 0.035, 0.40, 0.7); // Central US
    fill(0.06, 0.12, 0.15, 0.22, 0.04, 0.38, 0.8); // Western Canada
    fill(0.14, 0.10, 0.24, 0.20, 0.035, 0.38, 0.8); // Eastern Canada
    // Alaska
    fill(0.02, 0.10, 0.07, 0.16, 0.025, 0.36, 0.8);
    // Florida peninsula
    line(0.17, 0.38, 0.19, 0.44, 0.018, 0.35, 8);
    // Baja California
    line(0.07, 0.34, 0.08, 0.42, 0.012, 0.32, 6);
    // Gulf coast curve
    line(0.10, 0.38, 0.14, 0.40, 0.02, 0.36, 6);
    line(0.14, 0.40, 0.17, 0.38, 0.02, 0.36, 5);
    // Eastern seaboard detail
    line(0.20, 0.20, 0.21, 0.26, 0.018, 0.36, 5);
    line(0.20, 0.26, 0.19, 0.32, 0.018, 0.36, 5);
    line(0.19, 0.32, 0.18, 0.36, 0.018, 0.36, 4);
    // Labrador
    fill(0.20, 0.12, 0.26, 0.18, 0.03, 0.36, 0.8);
    // Hudson Bay depression (negative bump to carve out)
    b.push([0.15, 0.16, 0.04, -0.35]);
    b.push([0.16, 0.17, 0.035, -0.3]);
    // Great Lakes depressions
    b.push([0.165, 0.25, 0.015, -0.25]);
    b.push([0.155, 0.245, 0.012, -0.22]);
    b.push([0.175, 0.248, 0.01, -0.2]);
    b.push([0.145, 0.255, 0.008, -0.2]);
    b.push([0.18, 0.24, 0.01, -0.2]);
    // Rocky Mountains ridge
    line(0.08, 0.15, 0.09, 0.22, 0.015, 0.22, 8);
    line(0.09, 0.22, 0.10, 0.30, 0.015, 0.2, 8);
    line(0.10, 0.30, 0.10, 0.36, 0.012, 0.18, 6);
    // Appalachians
    line(0.18, 0.24, 0.17, 0.34, 0.012, 0.12, 8);

    // Central America
    line(0.13, 0.42, 0.14, 0.46, 0.015, 0.34, 5);
    line(0.14, 0.46, 0.15, 0.50, 0.012, 0.32, 5);
    // Caribbean islands
    b.push([0.18, 0.44, 0.012, 0.32]); // Cuba
    b.push([0.19, 0.45, 0.008, 0.30]); // Hispaniola
    b.push([0.20, 0.46, 0.006, 0.28]); // Puerto Rico
    b.push([0.21, 0.47, 0.005, 0.28]); // Lesser Antilles

    // Greenland
    fill(0.22, 0.02, 0.28, 0.12, 0.025, 0.45, 0.7);

    // ===== SOUTH AMERICA =====
    fill(0.16, 0.52, 0.26, 0.68, 0.035, 0.40, 0.7); // Northern half (Brazil)
    fill(0.15, 0.56, 0.22, 0.72, 0.03, 0.38, 0.7); // Southern half
    fill(0.18, 0.50, 0.24, 0.56, 0.03, 0.38, 0.8); // Venezuela/Guianas
    // Patagonia taper
    line(0.17, 0.72, 0.18, 0.80, 0.018, 0.34, 6);
    line(0.18, 0.80, 0.185, 0.86, 0.012, 0.30, 4);
    // Andes
    line(0.155, 0.52, 0.15, 0.60, 0.012, 0.25, 8);
    line(0.15, 0.60, 0.155, 0.68, 0.012, 0.22, 8);
    line(0.16, 0.68, 0.17, 0.76, 0.01, 0.2, 8);
    line(0.17, 0.76, 0.175, 0.84, 0.008, 0.18, 6);

    // ===== EUROPE =====
    fill(0.35, 0.12, 0.44, 0.24, 0.025, 0.38, 0.7); // Western Europe
    fill(0.38, 0.08, 0.46, 0.16, 0.025, 0.36, 0.8); // Northern Europe
    fill(0.42, 0.16, 0.48, 0.26, 0.025, 0.36, 0.7); // Eastern Europe
    // Iberian Peninsula
    fill(0.35, 0.24, 0.39, 0.30, 0.022, 0.37, 0.8);
    // Italian Peninsula
    line(0.41, 0.24, 0.42, 0.28, 0.014, 0.35, 5);
    line(0.42, 0.28, 0.43, 0.32, 0.012, 0.34, 5);
    b.push([0.43, 0.33, 0.01, 0.32]); // Sicily
    b.push([0.42, 0.31, 0.008, 0.30]); // Sardinia
    // Scandinavia
    line(0.39, 0.06, 0.41, 0.10, 0.018, 0.36, 5);
    line(0.41, 0.04, 0.43, 0.08, 0.016, 0.35, 5);
    line(0.43, 0.02, 0.45, 0.06, 0.014, 0.34, 4);
    // UK
    b.push([0.36, 0.14, 0.018, 0.36]); // England
    b.push([0.355, 0.12, 0.014, 0.35]); // Scotland
    b.push([0.35, 0.15, 0.012, 0.34]); // Wales
    // Ireland
    b.push([0.34, 0.15, 0.014, 0.34]);
    // Iceland
    b.push([0.32, 0.07, 0.012, 0.34]);
    // Greece/Balkans
    line(0.44, 0.24, 0.45, 0.28, 0.015, 0.35, 4);
    b.push([0.45, 0.28, 0.01, 0.32]); // Peloponnese
    b.push([0.46, 0.27, 0.008, 0.30]); // Crete
    // Alps
    line(0.39, 0.22, 0.43, 0.22, 0.008, 0.2, 8);
    // Carpathians
    line(0.44, 0.20, 0.46, 0.22, 0.006, 0.14, 5);

    // ===== AFRICA =====
    fill(0.37, 0.32, 0.50, 0.50, 0.04, 0.42, 0.6); // Northern Africa
    fill(0.38, 0.46, 0.50, 0.62, 0.04, 0.40, 0.6); // Central Africa
    fill(0.40, 0.56, 0.50, 0.70, 0.035, 0.38, 0.7); // Southern Africa
    // Horn of Africa
    line(0.50, 0.38, 0.53, 0.40, 0.015, 0.36, 4);
    // Madagascar
    fill(0.50, 0.56, 0.52, 0.64, 0.012, 0.34, 0.8);
    // Atlas Mountains
    line(0.37, 0.30, 0.40, 0.32, 0.008, 0.16, 6);
    // East African Rift highlands
    line(0.48, 0.44, 0.49, 0.52, 0.01, 0.14, 6);
    // Kilimanjaro
    b.push([0.485, 0.48, 0.008, 0.22]);

    // ===== MIDDLE EAST =====
    fill(0.48, 0.26, 0.55, 0.36, 0.025, 0.37, 0.7); // Arabian Peninsula
    fill(0.46, 0.24, 0.50, 0.30, 0.02, 0.36, 0.8); // Turkey/Levant
    b.push([0.50, 0.28, 0.015, 0.35]); // Iran core
    b.push([0.52, 0.28, 0.015, 0.35]); // Iran east
    // Zagros mountains
    line(0.50, 0.26, 0.52, 0.30, 0.007, 0.16, 5);

    // ===== RUSSIA / NORTHERN ASIA =====
    fill(0.44, 0.04, 0.65, 0.14, 0.04, 0.36, 0.5); // Western Siberia
    fill(0.60, 0.04, 0.78, 0.14, 0.04, 0.34, 0.5); // Eastern Siberia
    fill(0.74, 0.06, 0.82, 0.16, 0.035, 0.33, 0.6); // Far East
    fill(0.46, 0.14, 0.56, 0.22, 0.03, 0.36, 0.6); // Central Asia
    // Ural Mountains
    line(0.47, 0.06, 0.47, 0.18, 0.008, 0.16, 10);
    // Kamchatka
    line(0.80, 0.08, 0.82, 0.14, 0.01, 0.34, 4);

    // ===== INDIA =====
    fill(0.54, 0.30, 0.60, 0.42, 0.025, 0.38, 0.7); // Main subcontinent
    line(0.57, 0.42, 0.58, 0.46, 0.018, 0.35, 3); // Southern tip
    b.push([0.59, 0.46, 0.008, 0.30]); // Sri Lanka
    // Himalayas
    line(0.54, 0.26, 0.60, 0.26, 0.008, 0.3, 10);
    line(0.56, 0.25, 0.62, 0.25, 0.007, 0.28, 8);
    // Tibetan Plateau
    fill(0.58, 0.22, 0.64, 0.28, 0.02, 0.2, 0.8);

    // ===== CHINA / EAST ASIA =====
    fill(0.62, 0.20, 0.74, 0.34, 0.035, 0.38, 0.6); // China mainland
    fill(0.60, 0.16, 0.68, 0.24, 0.03, 0.36, 0.7); // Northern China
    // Korean Peninsula
    line(0.73, 0.22, 0.74, 0.26, 0.012, 0.34, 3);

    // ===== JAPAN =====
    line(0.75, 0.18, 0.76, 0.22, 0.008, 0.34, 4); // Honshu
    line(0.76, 0.22, 0.77, 0.26, 0.007, 0.33, 3);
    b.push([0.76, 0.16, 0.01, 0.33]); // Hokkaido

    // ===== SOUTHEAST ASIA =====
    line(0.66, 0.34, 0.68, 0.40, 0.016, 0.35, 4); // Indochina
    line(0.68, 0.36, 0.70, 0.42, 0.014, 0.34, 4);
    // Malay Peninsula
    line(0.68, 0.42, 0.69, 0.48, 0.01, 0.32, 5);
    // Philippines
    b.push([0.74, 0.36, 0.01, 0.32]);
    b.push([0.74, 0.38, 0.008, 0.30]);
    // Borneo
    b.push([0.71, 0.46, 0.018, 0.34]);
    // Sumatra
    line(0.66, 0.46, 0.68, 0.50, 0.012, 0.32, 4);
    // Java
    line(0.68, 0.52, 0.72, 0.52, 0.008, 0.30, 5);
    // Sulawesi
    b.push([0.73, 0.48, 0.01, 0.30]);
    // Papua/New Guinea
    fill(0.76, 0.48, 0.80, 0.52, 0.015, 0.34, 0.8);

    // ===== AUSTRALIA =====
    fill(0.70, 0.60, 0.80, 0.72, 0.04, 0.38, 0.6);
    fill(0.72, 0.58, 0.78, 0.64, 0.035, 0.36, 0.7);
    // Great Dividing Range
    line(0.78, 0.62, 0.77, 0.68, 0.008, 0.12, 6);
    // Tasmania
    b.push([0.76, 0.74, 0.01, 0.32]);
    // New Zealand
    b.push([0.84, 0.72, 0.008, 0.34]);
    b.push([0.84, 0.74, 0.007, 0.33]);
    b.push([0.84, 0.76, 0.006, 0.32]);

    // ===== NEGATIVE BUMPS (carve out seas/bays) =====
    // Mediterranean Sea
    b.push([0.41, 0.26, 0.02, -0.3]);
    b.push([0.43, 0.27, 0.018, -0.28]);
    b.push([0.45, 0.26, 0.015, -0.25]);
    // Black Sea
    b.push([0.46, 0.22, 0.012, -0.25]);
    // Caspian Sea
    b.push([0.50, 0.22, 0.01, -0.22]);
    // Persian Gulf
    b.push([0.51, 0.30, 0.01, -0.2]);
    // Red Sea
    b.push([0.47, 0.34, 0.006, -0.22]);
    b.push([0.47, 0.38, 0.006, -0.22]);
    // Gulf of Mexico
    b.push([0.13, 0.40, 0.025, -0.3]);
    // Caribbean Sea
    b.push([0.16, 0.44, 0.02, -0.25]);
    // Bay of Bengal
    b.push([0.60, 0.36, 0.02, -0.25]);
    // South China Sea
    b.push([0.70, 0.38, 0.02, -0.22]);
    // Sea of Japan
    b.push([0.74, 0.20, 0.012, -0.2]);

    this._bumps = b;
    return b;
  },

  getElevation: function(nx, ny) {
    if (!this._bumps) this.buildBumps();
    var bumps = this._bumps;

    // Base: subtle noise floor
    var elev = this.fbm(nx * 6, ny * 6, 4) * 0.12;

    // Apply all bumps — each is a gaussian-like influence
    for (var i = 0; i < bumps.length; i++) {
      var bx = bumps[i][0], by = bumps[i][1], br = bumps[i][2], bh = bumps[i][3];
      var dx = nx - bx, dy = ny - by;
      var dist2 = dx * dx + dy * dy;
      var r2 = br * br;
      if (dist2 < r2 * 4) { // Only compute if within 2x radius
        var influence = Math.exp(-dist2 / (2 * r2 * 0.4)); // Gaussian falloff
        elev += bh * influence;
      }
    }

    // Add fine terrain detail noise
    elev += this.fbm(nx * 20, ny * 20, 3) * 0.06;

    return Math.max(0, Math.min(1, elev));
  },


  // ========== TERRAIN COLOR FROM ELEVATION + LATITUDE ==========
  getTerrainColor: function(elev, nx, ny) {
    var lat = Math.abs(ny - 0.5) * 2; // 0 at equator, 1 at poles

    // Deep ocean
    if (elev < 0.2) {
      var depth = elev / 0.2;
      var r = 20 + depth * 30, g = 50 + depth * 40, b = 90 + depth * 40;
      return [r|0, g|0, b|0];
    }

    // Shallow ocean / continental shelf
    if (elev < 0.28) {
      var shelf = (elev - 0.2) / 0.08;
      var r = 50 + shelf * 30, g = 90 + shelf * 30, b = 130 + shelf * 20;
      return [r|0, g|0, b|0];
    }

    // Beach / coastline
    if (elev < 0.32) {
      var r = 210 + Math.random()*15, g = 195 + Math.random()*15, b = 155 + Math.random()*15;
      return [r|0, g|0, b|0];
    }

    // Determine climate zone from latitude
    var isArctic = lat > 0.75;
    var isSubarctic = lat > 0.6;
    var isTemperate = lat > 0.3 && lat < 0.6;
    var isSubtropical = lat > 0.15 && lat < 0.35;
    var isTropical = lat < 0.2;

    // Desert zones (specific regions)
    var isDesert = false;
    // Sahara
    if (nx > 0.36 && nx < 0.5 && ny > 0.3 && ny < 0.4) isDesert = true;
    // Arabian
    if (nx > 0.46 && nx < 0.56 && ny > 0.28 && ny < 0.38) isDesert = true;
    // Australian outback
    if (nx > 0.7 && nx < 0.8 && ny > 0.62 && ny < 0.74) isDesert = true;
    // Gobi
    if (nx > 0.62 && nx < 0.7 && ny > 0.2 && ny < 0.28) isDesert = true;
    // SW USA
    if (nx > 0.1 && nx < 0.16 && ny > 0.28 && ny < 0.36) isDesert = true;
    // Patagonia
    if (nx > 0.16 && nx < 0.22 && ny > 0.78 && ny < 0.86) isDesert = true;

    if (isDesert && elev < 0.6) {
      var n = this.fbm(nx * 20, ny * 20, 3);
      var r = 185 + n*40, g = 165 + n*35, b = 115 + n*30;
      return [r|0, g|0, b|0];
    }

    // Snow/ice (high latitude or high elevation)
    if (isArctic || elev > 0.85) {
      var n = this.fbm(nx * 15, ny * 15, 3);
      var r = 220 + n*30, g = 228 + n*25, b = 235 + n*20;
      return [r|0, g|0, b|0];
    }

    // Tundra
    if (isSubarctic && elev < 0.5) {
      var n = this.fbm(nx * 12, ny * 12, 3);
      var r = 100 + n*40, g = 115 + n*35, b = 80 + n*30;
      return [r|0, g|0, b|0];
    }

    // High mountains
    if (elev > 0.75) {
      var n = this.fbm(nx * 18, ny * 18, 3);
      var r = 140 + n*40, g = 130 + n*35, b = 110 + n*30;
      // Snow patches on peaks
      if (n > 0.6) { r += 60; g += 65; b += 70; }
      return [Math.min(255,r|0), Math.min(255,g|0), Math.min(255,b|0)];
    }

    // Mountains
    if (elev > 0.62) {
      var n = this.fbm(nx * 15, ny * 15, 3);
      var r = 110 + n*50, g = 105 + n*45, b = 80 + n*35;
      return [r|0, g|0, b|0];
    }

    // Dense forest (tropical + wet areas)
    var forestNoise = this.fbm(nx * 10, ny * 10, 4);
    if (isTropical && forestNoise > 0.4 && elev > 0.35) {
      var n = forestNoise;
      var r = 25 + n*50, g = 65 + n*50, b = 20 + n*30;
      return [r|0, g|0, b|0];
    }

    // Temperate forest
    if (isTemperate && forestNoise > 0.45 && elev > 0.38) {
      var n = forestNoise;
      var r = 40 + n*55, g = 75 + n*55, b = 30 + n*35;
      return [r|0, g|0, b|0];
    }

    // Boreal forest (taiga)
    if (isSubarctic && forestNoise > 0.35 && elev > 0.32) {
      var n = forestNoise;
      var r = 30 + n*45, g = 58 + n*45, b = 28 + n*30;
      return [r|0, g|0, b|0];
    }

    // Grassland / savanna
    if (isSubtropical) {
      var n = this.fbm(nx * 12, ny * 12, 3);
      var r = 120 + n*50, g = 145 + n*40, b = 60 + n*35;
      return [r|0, g|0, b|0];
    }

    // Default lowland (temperate green)
    var n = this.fbm(nx * 14, ny * 14, 3);
    var r = 70 + n*50, g = 115 + n*50, b = 45 + n*35;
    return [r|0, g|0, b|0];
  },

  // ========== 3D ELEVATION SHADING ==========
  applyShading: function(rgb, elev, nx, ny) {
    // Compute normal from elevation differences (fake 3D)
    var dx = this.getElevation(nx + 0.002, ny) - this.getElevation(nx - 0.002, ny);
    var dy = this.getElevation(nx, ny + 0.002) - this.getElevation(nx, ny - 0.002);

    // Light from upper-left (northwest)
    var lightX = -0.7, lightY = -0.7;
    var shade = dx * lightX + dy * lightY;

    // Apply shading — brighten sunlit faces, darken shadow faces
    var factor = 1.0 + shade * 4.0;
    factor = Math.max(0.6, Math.min(1.4, factor));

    return [
      Math.min(255, Math.max(0, (rgb[0] * factor) | 0)),
      Math.min(255, Math.max(0, (rgb[1] * factor) | 0)),
      Math.min(255, Math.max(0, (rgb[2] * factor) | 0))
    ];
  },

  // ========== RENDER ==========
  renderWorldMap: function(svgEl) {
    var W = this.MAP_W, H = this.MAP_H;
    svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(W, H);
    var data = imgData.data;

    this.initNoise();

    var t0 = performance.now();

    for (var y = 0; y < H; y++) {
      var ny = y / H;
      for (var x = 0; x < W; x++) {
        var nx = x / W;

        // Get elevation
        var elev = this.getElevation(nx, ny);

        // Get terrain color
        var rgb = this.getTerrainColor(elev, nx, ny);

        // Apply 3D shading (only for land — elev > 0.3)
        if (elev > 0.3) {
          rgb = this.applyShading(rgb, elev, nx, ny);
        }

        var idx = (y * W + x) * 4;
        data[idx]     = rgb[0];
        data[idx + 1] = rgb[1];
        data[idx + 2] = rgb[2];
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    var t1 = performance.now();
    console.log('Mosaic world map: ' + W + 'x' + H + ' = ' + (W*H) + ' pixels in ' + Math.round(t1-t0) + 'ms');

    var dataUrl = canvas.toDataURL('image/png');
    svgEl.innerHTML = '<image href="' + dataUrl + '" width="' + W + '" height="' + H + '"/>';
  }
};
