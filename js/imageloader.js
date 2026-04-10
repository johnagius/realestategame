/* ========================================
   PROPERTY EMPIRE - Image Asset Loader
   Hybrid system: PNG/WebP backgrounds + SVG overlays
   ======================================== */

const ImageLoader = {

  // Asset manifest — maps asset keys to URLs
  // Replace placeholder URLs with real AI-generated images
  assets: {
    // World map backgrounds
    'map_1750': 'assets/maps/world_1750.webp',
    'map_1800': 'assets/maps/world_1800.webp',
    'map_1870': 'assets/maps/world_1870.webp',
    'map_1930': 'assets/maps/world_1930.webp',
    'map_1980': 'assets/maps/world_1980.webp',

    // Splash screens
    'splash_bg': 'assets/splash/estate_sunset.webp',

    // City backgrounds (isometric/illustrated)
    'city_new_york': 'assets/cities/new_york.webp',
    'city_london': 'assets/cities/london.webp',
    'city_paris': 'assets/cities/paris.webp',
    'city_tokyo': 'assets/cities/tokyo.webp',
    'city_dubai': 'assets/cities/dubai.webp',
    'city_singapore': 'assets/cities/singapore.webp',
    'city_hong_kong': 'assets/cities/hong_kong.webp',
    'city_sydney': 'assets/cities/sydney.webp',
    'city_los_angeles': 'assets/cities/los_angeles.webp',
    'city_miami': 'assets/cities/miami.webp',
    'city_barcelona': 'assets/cities/barcelona.webp',
    'city_rome': 'assets/cities/rome.webp',
    'city_berlin': 'assets/cities/berlin.webp',
    'city_amsterdam': 'assets/cities/amsterdam.webp',
    'city_toronto': 'assets/cities/toronto.webp',
    'city_monaco': 'assets/cities/monaco.webp',
    'city_shanghai': 'assets/cities/shanghai.webp',
    'city_mumbai': 'assets/cities/mumbai.webp',
    'city_sao_paulo': 'assets/cities/sao_paulo.webp',
    'city_cape_town': 'assets/cities/cape_town.webp'
  },

  // Cache loaded images
  _cache: {},
  _loading: {},

  // Preload an image and cache it
  preload(key) {
    if (this._cache[key] || this._loading[key]) return;
    var url = this.assets[key];
    if (!url) return;

    this._loading[key] = true;
    var img = new Image();
    img.onload = function() {
      ImageLoader._cache[key] = img;
      delete ImageLoader._loading[key];
    };
    img.onerror = function() {
      delete ImageLoader._loading[key];
    };
    img.src = url;
  },

  // Check if an image is available
  has(key) {
    return !!this._cache[key];
  },

  // Get image URL (returns null if not loaded)
  getUrl(key) {
    return this.assets[key] || null;
  },

  // Apply image as background to an element, with SVG fallback
  applyBackground(element, imageKey, svgFallbackFn) {
    var url = this.assets[imageKey];

    if (this._cache[imageKey]) {
      // Image loaded — use it
      element.style.backgroundImage = 'url(' + url + ')';
      element.style.backgroundSize = 'cover';
      element.style.backgroundPosition = 'center';
      return true;
    }

    // Try loading
    if (url) {
      var img = new Image();
      img.onload = function() {
        ImageLoader._cache[imageKey] = img;
        element.style.backgroundImage = 'url(' + url + ')';
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
      };
      img.onerror = function() {
        // Fall back to SVG
        if (svgFallbackFn) svgFallbackFn();
      };
      img.src = url;
      return false; // loading
    }

    // No image defined — use SVG fallback
    if (svgFallbackFn) svgFallbackFn();
    return false;
  },

  // Preload all city images
  preloadCities() {
    var keys = Object.keys(this.assets);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('city_') === 0) {
        this.preload(keys[i]);
      }
    }
  },

  // ========== IMAGE GENERATION PROMPTS ==========
  // Use these with Midjourney, DALL-E, or Stable Diffusion
  // to generate the actual background images

  getPrompts() {
    return {
      world_map_1750: 'Antique illustrated world map, 18th century cartographic style, parchment paper texture, hand-drawn coastlines, terrain relief mountains forests deserts, sailing ships in oceans, decorative compass rose, warm sepia tones, atlas quality, 1750 colonial era, premium game art, 1920x960 resolution',

      world_map_modern: 'Stylized illustrated world map, premium game art style, rich terrain colors, mountains forests deserts tundra, modern clean cartography, satellite-inspired but artistic, warm color palette, 1920x960 resolution',

      splash_estate: 'Grand 18th century English country estate at golden hour sunset, Palladian mansion with columned portico, manicured gardens with fountain, rolling green hills, mature oak trees, horse-drawn carriage on gravel drive, iron gates in foreground, atmospheric oil painting style, premium game title screen, 1920x1080',

      city_paris: 'Isometric illustrated view of Paris cityscape, Eiffel Tower prominent, Haussmann buildings, Seine river with stone bridges, Notre-Dame, Sacre-Coeur on Montmartre hill, tree-lined boulevards, warm afternoon light, stylized premium game art, rich detail, 1200x500',

      city_london: 'Isometric illustrated view of London cityscape, Big Ben and Parliament, Tower Bridge, Thames river, London Eye, Victorian brick terraces, red double-decker buses, overcast moody atmosphere, stylized premium game art, 1200x500',

      city_new_york: 'Isometric illustrated view of Manhattan skyline at sunset, Empire State Building, Chrysler Building, One World Trade, Brooklyn Bridge, Central Park green, yellow taxis, dramatic sky, stylized premium game art, 1200x500',

      city_tokyo: 'Isometric illustrated view of Tokyo cityscape, Tokyo Tower red lattice, Mount Fuji in distance, cherry blossoms, bullet train, traditional temple, neon signs, modern glass towers, stylized premium game art, 1200x500',

      city_dubai: 'Isometric illustrated view of Dubai cityscape, Burj Khalifa dominant, Burj Al Arab sail shape, Palm Jumeirah, desert sand, glass towers, Persian Gulf turquoise water, palm trees, luxury cars, stylized premium game art, 1200x500'
    };
  }
};
