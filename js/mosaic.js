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

  // ========== REAL WORLD ELEVATION DATA (simplified) ==========
  // Returns elevation 0-1 for a normalized world coordinate
  // 0 = deep ocean, 0.3 = sea level, 0.5 = lowland, 0.7 = highland, 0.9 = mountain, 1.0 = peak
  getElevation: function(nx, ny) {
    // nx: 0-1 across map width (longitude), ny: 0-1 across height (latitude)
    // Start with noise-based base elevation
    var base = this.fbm(nx * 8, ny * 8, 5);

    // Add continent masks — raise elevation where continents are
    var continentBoost = 0;

    // North America
    if (nx > 0.03 && nx < 0.28 && ny > 0.08 && ny < 0.52) {
      var cx = (nx - 0.03) / 0.25, cy = (ny - 0.08) / 0.44;
      // Rough shape mask
      var shape = 1 - Math.sqrt(Math.pow(cx-0.5,2)*2.5 + Math.pow(cy-0.4,2)*1.5);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.45);
      // Rocky Mountains ridge
      if (cx > 0.15 && cx < 0.3 && cy > 0.2 && cy < 0.8) continentBoost += 0.15;
    }

    // South America
    if (nx > 0.14 && nx < 0.28 && ny > 0.48 && ny < 0.88) {
      var cx = (nx - 0.14) / 0.14, cy = (ny - 0.48) / 0.4;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.4,2)*3 + Math.pow(cy-0.5,2)*1.2);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.4);
      // Andes
      if (cx < 0.25 && cy > 0.1 && cy < 0.9) continentBoost += 0.18;
    }

    // Europe
    if (nx > 0.34 && nx < 0.48 && ny > 0.06 && ny < 0.32) {
      var cx = (nx - 0.34) / 0.14, cy = (ny - 0.06) / 0.26;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.5,2)*2 + Math.pow(cy-0.5,2)*2);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.38);
      // Alps
      if (cx > 0.35 && cx < 0.55 && cy > 0.5 && cy < 0.7) continentBoost += 0.12;
    }

    // Scandinavia
    if (nx > 0.38 && nx < 0.47 && ny > 0.02 && ny < 0.14) {
      continentBoost = Math.max(continentBoost, 0.3);
    }

    // UK + Ireland
    if (nx > 0.33 && nx < 0.38 && ny > 0.1 && ny < 0.2) {
      continentBoost = Math.max(continentBoost, 0.32);
    }

    // Africa
    if (nx > 0.35 && nx < 0.52 && ny > 0.28 && ny < 0.72) {
      var cx = (nx - 0.35) / 0.17, cy = (ny - 0.28) / 0.44;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.45,2)*2 + Math.pow(cy-0.45,2)*1.3);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.42);
      // Atlas Mountains
      if (cy < 0.15 && cx > 0.2 && cx < 0.6) continentBoost += 0.1;
      // East African Rift highlands
      if (cx > 0.55 && cy > 0.3 && cy < 0.6) continentBoost += 0.08;
    }

    // Middle East / Arabia
    if (nx > 0.45 && nx < 0.55 && ny > 0.24 && ny < 0.4) {
      var cx = (nx - 0.45) / 0.1, cy = (ny - 0.24) / 0.16;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.5,2)*2.5 + Math.pow(cy-0.5,2)*2);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.35);
    }

    // Russia / Northern Asia
    if (nx > 0.42 && nx < 0.85 && ny > 0.02 && ny < 0.22) {
      var cx = (nx - 0.42) / 0.43, cy = (ny - 0.02) / 0.2;
      var shape = 1 - Math.pow(cy, 1.5) * 0.8;
      if (shape > 0.2) continentBoost = Math.max(continentBoost, shape * 0.35);
      // Urals
      if (cx > 0.18 && cx < 0.22) continentBoost += 0.1;
    }

    // India
    if (nx > 0.53 && nx < 0.62 && ny > 0.28 && ny < 0.48) {
      var cx = (nx - 0.53) / 0.09, cy = (ny - 0.28) / 0.2;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.5,2)*3 + Math.pow(cy-0.4,2)*1.5);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.38);
    }

    // Himalayas
    if (nx > 0.54 && nx < 0.64 && ny > 0.22 && ny < 0.28) {
      continentBoost += 0.25;
    }

    // China / East Asia
    if (nx > 0.6 && nx < 0.78 && ny > 0.18 && ny < 0.42) {
      var cx = (nx - 0.6) / 0.18, cy = (ny - 0.18) / 0.24;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.5,2)*2 + Math.pow(cy-0.5,2)*2);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.38);
    }

    // Southeast Asia
    if (nx > 0.63 && nx < 0.72 && ny > 0.4 && ny < 0.52) {
      continentBoost = Math.max(continentBoost, 0.28);
    }

    // Japan
    if (nx > 0.71 && nx < 0.75 && ny > 0.14 && ny < 0.26) {
      continentBoost = Math.max(continentBoost, 0.32);
    }

    // Indonesia archipelago
    if (nx > 0.64 && nx < 0.76 && ny > 0.49 && ny < 0.55) {
      var islands = this.fbm(nx * 30, ny * 30, 3);
      if (islands > 0.5) continentBoost = Math.max(continentBoost, 0.3);
    }

    // Australia
    if (nx > 0.68 && nx < 0.82 && ny > 0.58 && ny < 0.78) {
      var cx = (nx - 0.68) / 0.14, cy = (ny - 0.58) / 0.2;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.5,2)*2.2 + Math.pow(cy-0.45,2)*2);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.36);
    }

    // Greenland
    if (nx > 0.22 && nx < 0.3 && ny > 0.02 && ny < 0.14) {
      var cx = (nx - 0.22) / 0.08, cy = (ny - 0.02) / 0.12;
      var shape = 1 - Math.sqrt(Math.pow(cx-0.5,2)*2.5 + Math.pow(cy-0.5,2)*2);
      if (shape > 0) continentBoost = Math.max(continentBoost, shape * 0.4);
    }

    // Iceland
    if (nx > 0.31 && nx < 0.34 && ny > 0.06 && ny < 0.1) {
      continentBoost = Math.max(continentBoost, 0.3);
    }

    // Madagascar
    if (nx > 0.49 && nx < 0.52 && ny > 0.56 && ny < 0.66) {
      continentBoost = Math.max(continentBoost, 0.3);
    }

    // New Zealand
    if (nx > 0.82 && nx < 0.85 && ny > 0.7 && ny < 0.82) {
      continentBoost = Math.max(continentBoost, 0.3);
    }

    // Combine base noise with continent mask
    var elev = base * 0.35 + continentBoost;

    // Add fine detail noise
    elev += this.fbm(nx * 25, ny * 25, 3) * 0.08;

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
