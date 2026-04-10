/* ========================================
   PROPERTY EMPIRE — World Map Renderer
   Real country shapes + terrain + 3D shading
   Uses COUNTRY_PATHS from countryPaths.js
   ======================================== */

const Mosaic = {

  // Map dimensions — match reference SVG viewBox
  MAP_W: 1100,
  MAP_H: 550, // padded from 520 to maintain ~2:1 ratio for the game container
  SRC_H: 520, // original path data height
  PAD_TOP: 15, // vertical padding to center 520 in 550

  // ========== PERLIN NOISE ENGINE ==========
  _seed: 42,
  _perm: null,

  initNoise: function() {
    this._perm = new Uint8Array(512);
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++) p[i] = i;
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
    return x1 * (1 - v) + x2 * v;
  },

  fbm: function(x, y, octaves) {
    var val = 0, amp = 1, freq = 1, max = 0;
    for (var i = 0; i < (octaves || 4); i++) {
      val += this.noise2D(x * freq, y * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / max;
  },

  // ========== PATH2D COUNTRY SHAPES ==========
  _paths: null,

  initPaths: function() {
    if (this._paths) return;
    if (typeof COUNTRY_PATHS === 'undefined') {
      console.warn('COUNTRY_PATHS not loaded');
      this._paths = [];
      return;
    }
    this._paths = [];
    for (var i = 0; i < COUNTRY_PATHS.length; i++) {
      var c = COUNTRY_PATHS[i];
      try {
        this._paths.push({
          iso: c.iso,
          name: c.name,
          path: new Path2D(c.d)
        });
      } catch(e) {
        // Skip invalid paths
      }
    }
    console.log('Mosaic: initialized ' + this._paths.length + ' country Path2D objects');
  },

  // ========== LAND MASK ==========
  // Draw all countries white on transparent canvas, read back pixel data
  _landMask: null,

  buildLandMask: function(w, h) {
    this.initPaths();
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');

    // Offset paths to account for vertical padding
    ctx.save();
    ctx.translate(0, this.PAD_TOP);

    // Fill all country paths in white
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < this._paths.length; i++) {
      ctx.fill(this._paths[i].path);
    }
    ctx.restore();

    // Read back as pixel data — we only need the alpha channel
    var imgData = ctx.getImageData(0, 0, w, h);
    var data = imgData.data;

    // Build compact land mask (1 byte per pixel: 0=ocean, 255=land)
    var mask = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) {
      mask[i] = data[i * 4 + 3]; // alpha channel
    }

    this._landMask = mask;
    return mask;
  },

  // ========== ELEVATION ==========
  // Simplified noise-based elevation with regional mountain boosts
  getElevation: function(nx, ny) {
    // Base land elevation from noise
    var elev = 0.38 + this.fbm(nx * 6, ny * 6, 5) * 0.25;

    // Mountain ranges — boost elevation near known ridges
    // Each ridge: [x1, y1, x2, y2, width, boost]
    var ridges = this._ridges;
    for (var i = 0; i < ridges.length; i++) {
      var r = ridges[i];
      var dist = this._distToSegment(nx, ny, r[0], r[1], r[2], r[3]);
      if (dist < r[4]) {
        var t = 1 - dist / r[4];
        elev += r[5] * t * t; // quadratic falloff
      }
    }

    // Fine detail
    elev += this.fbm(nx * 20, ny * 20, 3) * 0.06;

    return Math.max(0, Math.min(1, elev));
  },

  // Mountain ridge definitions: [x1, y1, x2, y2, width, boost]
  // Coordinates calibrated to the 1100x550 country-path viewBox (normalized 0-1)
  _ridges: [
    // Rocky Mountains (western US/Canada, ~x:170-200 in 1100px)
    [0.17, 0.16, 0.18, 0.25, 0.02, 0.25],
    [0.16, 0.25, 0.17, 0.35, 0.018, 0.22],
    // Andes (western South America)
    [0.28, 0.50, 0.27, 0.58, 0.015, 0.28],
    [0.27, 0.58, 0.24, 0.68, 0.012, 0.25],
    [0.24, 0.68, 0.22, 0.78, 0.01, 0.2],
    // Alps (Switzerland/Austria, ~x:520-550)
    [0.48, 0.25, 0.52, 0.25, 0.01, 0.18],
    // Carpathians (Romania, ~x:560-580)
    [0.52, 0.25, 0.56, 0.26, 0.008, 0.12],
    // Himalayas (Nepal/Pakistan, ~x:720-760)
    [0.67, 0.32, 0.72, 0.34, 0.012, 0.32],
    [0.72, 0.34, 0.75, 0.35, 0.01, 0.28],
    // Tibetan Plateau (north of Himalayas)
    [0.70, 0.28, 0.78, 0.32, 0.03, 0.15],
    // Urals (Russia, ~x:550, runs N-S)
    [0.53, 0.10, 0.54, 0.20, 0.006, 0.12],
    // Atlas Mountains (Morocco, ~x:460-500)
    [0.46, 0.33, 0.50, 0.35, 0.008, 0.12],
    // East African Rift (Ethiopia/Kenya, ~x:600-630)
    [0.60, 0.44, 0.61, 0.52, 0.008, 0.14],
    // Appalachians (eastern US, ~x:305-330)
    [0.29, 0.22, 0.28, 0.32, 0.01, 0.1],
    // Scandinavian Mountains (Norway, ~x:480-550)
    [0.48, 0.09, 0.51, 0.15, 0.008, 0.12],
    // Great Dividing Range (E. Australia, ~x:950-970)
    [0.91, 0.60, 0.90, 0.70, 0.007, 0.1],
    // Caucasus (Georgia, ~x:615-630)
    [0.62, 0.27, 0.63, 0.28, 0.006, 0.14],
    // Japanese Alps (~x:940-960)
    [0.86, 0.29, 0.87, 0.33, 0.005, 0.14],
    // Hindu Kush / Karakoram (Afghanistan/Pakistan)
    [0.67, 0.30, 0.70, 0.32, 0.01, 0.22],
    // Drakensberg (South Africa)
    [0.60, 0.70, 0.60, 0.74, 0.006, 0.08],
  ],

  // Distance from point to line segment
  _distToSegment: function(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.sqrt((px-x1)*(px-x1) + (py-y1)*(py-y1));
    var t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy) / len2));
    var projX = x1 + t * dx, projY = y1 + t * dy;
    return Math.sqrt((px-projX)*(px-projX) + (py-projY)*(py-projY));
  },

  // ========== BIOME CLASSIFICATION ==========
  getBiome: function(nx, ny) {
    // ny: 0 = top (north pole), 1 = bottom (south pole)
    // Map to latitude: 0 at equator, 1 at poles
    var lat = Math.abs(ny - 0.5) * 2;
    var n = this.fbm(nx * 10, ny * 10, 3); // moisture/vegetation noise

    // Specific desert regions (calibrated to 1100x550 country-path projection)
    // Sahara (Libya, Algeria, Egypt region)
    if (nx > 0.47 && nx < 0.61 && ny > 0.30 && ny < 0.42) return 'desert';
    // Arabian (Saudi Arabia, Iraq)
    if (nx > 0.59 && nx < 0.66 && ny > 0.30 && ny < 0.42) return 'desert';
    // Australian outback (central Australia)
    if (nx > 0.84 && nx < 0.93 && ny > 0.60 && ny < 0.72) return 'desert';
    // Gobi (Mongolia)
    if (nx > 0.75 && nx < 0.83 && ny > 0.23 && ny < 0.29) return 'desert';
    // Kalahari / Namib (Namibia, Botswana)
    if (nx > 0.53 && nx < 0.58 && ny > 0.59 && ny < 0.65) return 'desert';
    // SW USA / Mexican desert
    if (nx > 0.15 && nx < 0.21 && ny > 0.30 && ny < 0.40) return 'desert';
    // Patagonia steppe
    if (nx > 0.30 && nx < 0.35 && ny > 0.72 && ny < 0.80) return 'desert';
    // Central Asia steppe (Kazakhstan)
    if (nx > 0.63 && nx < 0.74 && ny > 0.21 && ny < 0.29) return 'desert';

    // Arctic / Antarctic / Greenland
    if (lat > 0.82) return 'ice';
    if (ny < 0.08 || ny > 0.92) return 'ice';
    // Greenland
    if (nx > 0.30 && nx < 0.47 && ny > 0.06 && ny < 0.19) return 'ice';

    // Tundra
    if (lat > 0.72) return 'tundra';

    // Boreal forest (taiga)
    if (lat > 0.55 && n > 0.35) return 'boreal';

    // Tropical rainforest
    if (lat < 0.18 && n > 0.4) return 'tropical';
    // Amazon specifically (Brazil interior)
    if (nx > 0.30 && nx < 0.40 && ny > 0.48 && ny < 0.60 && n > 0.3) return 'tropical';
    // Congo basin
    if (nx > 0.53 && nx < 0.59 && ny > 0.47 && ny < 0.57 && n > 0.3) return 'tropical';
    // SE Asia (Myanmar, Thailand, Vietnam)
    if (nx > 0.75 && nx < 0.82 && ny > 0.37 && ny < 0.48 && n > 0.35) return 'tropical';

    // Savanna / grassland
    if (lat < 0.30 && lat > 0.12) return 'savanna';
    if (lat > 0.30 && lat < 0.55 && n < 0.4) return 'grassland';

    // Temperate forest
    if (lat > 0.25 && lat < 0.55 && n > 0.4) return 'temperate';

    // Default — temperate grassland
    return 'grassland';
  },

  // ========== TERRAIN COLOR ==========
  getTerrainColor: function(elev, biome, nx, ny) {
    var n = this.fbm(nx * 16, ny * 16, 3); // fine color noise

    // High mountains — override biome
    if (elev > 0.78) {
      var snow = this.fbm(nx * 20, ny * 20, 2);
      if (snow > 0.5) return [235 + n*15|0, 238 + n*12|0, 242 + n*10|0]; // snow
      return [145 + n*35|0, 135 + n*30|0, 118 + n*25|0]; // rock
    }
    if (elev > 0.68) {
      return [120 + n*45|0, 112 + n*40|0, 90 + n*35|0]; // mountain brown
    }
    if (elev > 0.58) {
      // Highland — blend mountain/biome
      var mt = 0.4;
      var r = (105 + n*40) * mt + this._biomeR(biome, n) * (1-mt);
      var g = (100 + n*35) * mt + this._biomeG(biome, n) * (1-mt);
      var b = (82 + n*30) * mt + this._biomeB(biome, n) * (1-mt);
      return [r|0, g|0, b|0];
    }

    // Biome-based coloring
    return [this._biomeR(biome, n)|0, this._biomeG(biome, n)|0, this._biomeB(biome, n)|0];
  },

  _biomeR: function(b, n) {
    switch(b) {
      case 'tropical':  return 22 + n*45;
      case 'temperate':  return 50 + n*50;
      case 'boreal':     return 35 + n*40;
      case 'savanna':    return 135 + n*45;
      case 'grassland':  return 95 + n*50;
      case 'desert':     return 190 + n*35;
      case 'tundra':     return 120 + n*40;
      case 'ice':        return 225 + n*25;
      default:           return 80 + n*50;
    }
  },
  _biomeG: function(b, n) {
    switch(b) {
      case 'tropical':   return 68 + n*48;
      case 'temperate':  return 88 + n*50;
      case 'boreal':     return 62 + n*42;
      case 'savanna':    return 150 + n*35;
      case 'grassland':  return 130 + n*45;
      case 'desert':     return 170 + n*30;
      case 'tundra':     return 130 + n*35;
      case 'ice':        return 232 + n*20;
      default:           return 110 + n*45;
    }
  },
  _biomeB: function(b, n) {
    switch(b) {
      case 'tropical':   return 18 + n*28;
      case 'temperate':  return 32 + n*35;
      case 'boreal':     return 25 + n*30;
      case 'savanna':    return 55 + n*30;
      case 'grassland':  return 42 + n*35;
      case 'desert':     return 115 + n*30;
      case 'tundra':     return 75 + n*30;
      case 'ice':        return 238 + n*17;
      default:           return 45 + n*35;
    }
  },

  // ========== 3D HILLSHADING ==========
  // Pre-compute elevation grid for fast normal calculation
  _elevGrid: null,
  _elevW: 0,
  _elevH: 0,

  buildElevGrid: function(w, h, landMask) {
    var grid = new Float32Array(w * h);
    for (var y = 0; y < h; y++) {
      var ny = y / h;
      for (var x = 0; x < w; x++) {
        if (landMask[y * w + x] > 128) {
          grid[y * w + x] = this.getElevation(x / w, ny);
        }
      }
    }
    this._elevGrid = grid;
    this._elevW = w;
    this._elevH = h;
    return grid;
  },

  getShading: function(x, y) {
    var w = this._elevW, h = this._elevH, g = this._elevGrid;
    if (x < 1 || x >= w-1 || y < 1 || y >= h-1) return 1.0;

    var idx = y * w + x;
    var dzdx = (g[idx + 1] - g[idx - 1]) * 0.5;
    var dzdy = (g[idx + w] - g[idx - w]) * 0.5;

    // Light from northwest (upper-left)
    var lightX = -0.7, lightY = -0.7;
    var shade = dzdx * lightX + dzdy * lightY;

    var factor = 1.0 + shade * 5.0;
    return Math.max(0.55, Math.min(1.45, factor));
  },

  // ========== COASTAL GLOW (shallow water near land) ==========
  // Uses fast multi-pass distance approximation instead of per-pixel radius search
  buildCoastalMask: function(w, h, landMask) {
    var radius = 8;
    // Initialize distance field: 0 for land, large for ocean
    var dist = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      dist[i] = landMask[i] > 128 ? 0 : 9999;
    }
    // Forward pass
    for (var y = 1; y < h; y++) {
      for (var x = 1; x < w - 1; x++) {
        var idx = y * w + x;
        dist[idx] = Math.min(dist[idx],
          dist[(y-1)*w + (x-1)] + 1.41,
          dist[(y-1)*w + x] + 1,
          dist[(y-1)*w + (x+1)] + 1.41,
          dist[y*w + (x-1)] + 1
        );
      }
    }
    // Backward pass
    for (var y = h - 2; y >= 0; y--) {
      for (var x = w - 2; x >= 1; x--) {
        var idx = y * w + x;
        dist[idx] = Math.min(dist[idx],
          dist[(y+1)*w + (x+1)] + 1.41,
          dist[(y+1)*w + x] + 1,
          dist[(y+1)*w + (x-1)] + 1.41,
          dist[y*w + (x+1)] + 1
        );
      }
    }
    // Convert distance to coastal intensity
    var coastal = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) {
      if (landMask[i] > 128) continue; // skip land
      if (dist[i] <= radius) {
        coastal[i] = Math.round((1 - dist[i] / radius) * 255);
      }
    }
    return coastal;
  },

  // ========== MAIN RENDER ==========
  renderWorldMap: function(svgEl) {
    var W = this.MAP_W, H = this.MAP_H;
    svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    var t0 = performance.now();

    // Initialize noise
    this.initNoise();

    // Step 1: Build land mask from country paths
    var landMask = this.buildLandMask(W, H);

    // Step 2: Build elevation grid (only for land pixels)
    var elevGrid = this.buildElevGrid(W, H, landMask);

    // Step 3: Build coastal glow mask
    var coastalMask = this.buildCoastalMask(W, H, landMask);

    // Step 4: Render terrain to canvas
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(W, H);
    var data = imgData.data;

    for (var y = 0; y < H; y++) {
      var ny = y / H;
      for (var x = 0; x < W; x++) {
        var nx = x / W;
        var idx = (y * W + x) * 4;
        var maskIdx = y * W + x;

        if (landMask[maskIdx] > 128) {
          // LAND pixel
          var elev = elevGrid[maskIdx];
          var biome = this.getBiome(nx, ny);
          var rgb = this.getTerrainColor(elev, biome, nx, ny);

          // Apply hillshading
          var shade = this.getShading(x, y);
          data[idx]     = Math.min(255, Math.max(0, (rgb[0] * shade)|0));
          data[idx + 1] = Math.min(255, Math.max(0, (rgb[1] * shade)|0));
          data[idx + 2] = Math.min(255, Math.max(0, (rgb[2] * shade)|0));
          data[idx + 3] = 255;
        } else {
          // OCEAN pixel — transparent (ocean rendered by SVG background)
          // But add coastal glow if near land
          var coast = coastalMask[maskIdx];
          if (coast > 0) {
            var t = coast / 255;
            // Shallow water color — lighter blue-green
            data[idx]     = (60 + t * 40)|0;
            data[idx + 1] = (120 + t * 50)|0;
            data[idx + 2] = (160 + t * 30)|0;
            data[idx + 3] = (t * 180)|0; // semi-transparent
          }
          // else: fully transparent (alpha=0), ocean shows through
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Step 5: Draw country borders onto the canvas
    ctx.save();
    ctx.translate(0, this.PAD_TOP);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i < this._paths.length; i++) {
      ctx.stroke(this._paths[i].path);
    }
    ctx.restore();

    var t1 = performance.now();

    // Step 6: Convert to data URL
    var dataUrl = canvas.toDataURL('image/png');

    // Step 7: Assemble SVG
    var svg = '';

    // Ocean gradient background (from reference)
    svg += '<defs>';
    svg += '<linearGradient id="mOceanGrad" x1="0" y1="0" x2="0" y2="1">';
    svg += '<stop offset="0%" stop-color="#5BA8D8"/>';
    svg += '<stop offset="40%" stop-color="#2C78C0"/>';
    svg += '<stop offset="100%" stop-color="#1A4F8C"/>';
    svg += '</linearGradient>';
    svg += '<radialGradient id="mOceanGlow" cx="42%" cy="28%" r="75%">';
    svg += '<stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>';
    svg += '<stop offset="100%" stop-color="rgba(255,255,255,0.0)"/>';
    svg += '</radialGradient>';
    svg += '</defs>';

    // Ocean base
    svg += '<rect width="' + W + '" height="' + H + '" fill="url(#mOceanGrad)"/>';
    svg += '<rect width="' + W + '" height="' + H + '" fill="url(#mOceanGlow)" opacity="0.8"/>';

    // Terrain image (transparent where ocean)
    svg += '<image href="' + dataUrl + '" width="' + W + '" height="' + H + '"/>';

    svgEl.innerHTML = svg;

    var t2 = performance.now();
    console.log('Mosaic world map: ' + W + 'x' + H + ' rendered in ' +
      Math.round(t1 - t0) + 'ms (terrain) + ' +
      Math.round(t2 - t1) + 'ms (SVG assembly) = ' +
      Math.round(t2 - t0) + 'ms total');
  }
};
