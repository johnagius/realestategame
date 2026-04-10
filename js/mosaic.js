/* ========================================
   PROPERTY EMPIRE — Pixel Mosaic Renderer
   Eikon-style dense block rendering
   Thousands of tiny colored blocks forming seamless images
   ======================================== */

const Mosaic = {

  // Grid dimensions for world map
  MAP_COLS: 640,
  MAP_ROWS: 320,
  CELL_SIZE: 2.5, // px per cell — at 640 cols = 1600px wide

  // Color palettes
  colors: {
    deepOcean:  ['#1E4868','#224C6C','#265070','#1A4464','#204A6A'],
    midOcean:   ['#2A5878','#2E5C7C','#326080','#285674','#306080'],
    shallowOcn: ['#3A6888','#3E6C8C','#427090','#386484','#3C688A'],
    coastShelf: ['#4A7898','#4E7C9C','#5280A0','#487494','#4C789A'],
    lowland:    ['#5A8A48','#5E8E4C','#628E50','#568644','#5C8C4A'],
    grassland:  ['#6A9A58','#6E9E5C','#72A260','#689854','#6C9C5A'],
    forest:     ['#2A5A28','#2E5E2C','#326230','#285824','#2C5C2A'],
    denseForest:['#1A4A1C','#1E4E20','#225224','#184818','#1C4C1E'],
    desert:     ['#C8B088','#CCB48C','#D0B890','#C4AC84','#C8B28A'],
    hotDesert:  ['#D4BC90','#D8C094','#DCC498','#D0B88C','#D4BE92'],
    mountain:   ['#7A7060','#7E7464','#827868','#786E5C','#7C7262'],
    highMtn:    ['#9A9088','#9E948C','#A29890','#988E84','#9C928A'],
    snow:       ['#E0E8F0','#E4ECF4','#E8F0F8','#DCE4EC','#E0E8F2'],
    ice:        ['#D0DCE8','#D4E0EC','#D8E4F0','#CCD8E4','#D0DCEA'],
    tundra:     ['#7A8A6A','#7E8E6E','#829272','#788866','#7C8C6C'],
    river:      ['#3070A0','#3474A4','#3878A8','#2C6C9C','#3272A2'],
    beach:      ['#E0D0A8','#E4D4AC','#E8D8B0','#DCCCA4','#E0D2AA'],
  },

  // Get random color from palette with variation
  pickColor: function(palette) {
    return palette[Math.floor(Math.random() * palette.length)];
  },

  // Simplified continent outlines as polygon coordinate arrays
  // Coordinates in grid space (0-640 x, 0-320 y)
  // Equirectangular projection: x = longitude mapped to 0-640, y = latitude mapped to 0-320
  continents: {
    northAmerica: [
      [28,38],[35,35],[48,34],[60,32],[72,30],[85,30],[98,32],[110,35],[120,40],
      [128,48],[132,56],[134,64],[132,72],[130,78],[128,84],[132,88],[136,92],
      [140,98],[142,104],[140,110],[136,116],[130,120],[124,124],[118,126],[112,128],
      [106,132],[100,136],[95,138],[90,136],[85,138],[80,142],[74,144],[68,140],
      [62,136],[56,130],[52,124],[48,118],[44,112],[42,106],[40,100],[38,94],
      [36,88],[34,82],[32,76],[30,70],[28,64],[26,58],[26,52],[27,46],[28,42]
    ],
    florida: [
      [112,128],[116,132],[120,138],[122,142],[120,146],[116,144],[112,140],[110,136],[110,132]
    ],
    centralAm: [
      [95,138],[98,140],[100,144],[102,148],[104,152],[102,156],[98,158],[94,156],[92,152],[92,148],[93,144]
    ],
    greenland: [
      [142,16],[150,12],[160,14],[168,18],[172,26],[168,34],[160,36],[152,34],[146,28],[142,22]
    ],
    southAmerica: [
      [118,158],[128,154],[138,156],[148,162],[154,170],[158,180],[160,192],[160,204],
      [158,216],[154,228],[148,238],[142,248],[136,256],[130,262],[124,268],[120,272],
      [118,268],[114,260],[110,250],[108,240],[106,230],[104,218],[102,206],[102,194],
      [104,182],[108,172],[112,164]
    ],
    europe: [
      [230,34],[236,30],[244,28],[252,30],[258,32],[264,28],[270,30],[276,32],
      [282,36],[286,40],[290,44],[292,50],[290,56],[288,60],[284,64],[280,68],
      [276,72],[272,76],[268,74],[264,76],[260,74],[256,72],[252,76],[248,74],
      [244,70],[240,66],[236,62],[234,56],[232,50],[230,44],[230,38]
    ],
    iberia: [
      [236,66],[240,68],[244,72],[248,76],[246,80],[240,82],[236,80],[232,76],
      [230,72],[232,68]
    ],
    italy: [
      [264,66],[268,70],[272,76],[274,82],[276,86],[274,90],[270,88],[268,84],
      [266,78],[264,72]
    ],
    scandinavia: [
      [258,14],[264,12],[270,16],[274,22],[272,30],[268,28],[264,26],[260,22],[258,18]
    ],
    uk: [
      [226,36],[230,34],[234,36],[236,42],[234,48],[230,50],[226,48],[224,44],[224,40]
    ],
    ireland: [
      [220,40],[224,38],[226,42],[224,46],[220,46],[218,44]
    ],
    iceland: [
      [210,20],[216,18],[220,20],[220,24],[216,26],[212,24]
    ],
    africa: [
      [244,88],[254,86],[264,88],[274,92],[282,98],[288,106],[294,116],[298,128],
      [300,140],[302,152],[302,164],[300,176],[296,188],[290,198],[284,206],[276,212],
      [268,218],[260,220],[252,216],[246,210],[240,202],[236,194],[234,186],[232,178],
      [230,168],[228,158],[228,148],[230,138],[232,128],[234,118],[238,108],[242,98],
      [244,92]
    ],
    hornAfrica: [
      [294,116],[298,114],[304,116],[308,120],[306,124],[302,122],[298,118]
    ],
    madagascar: [
      [312,180],[316,174],[318,180],[318,190],[316,196],[312,194],[310,188]
    ],
    middleEast: [
      [290,78],[298,76],[306,78],[314,82],[318,88],[318,96],[314,104],[308,108],
      [302,106],[296,100],[292,94],[290,86]
    ],
    russia: [
      [276,20],[300,12],[330,10],[360,12],[390,14],[420,18],[450,20],[470,16],
      [488,20],[498,28],[496,40],[490,48],[484,52],[476,54],[468,56],[458,58],
      [448,56],[438,58],[428,56],[418,60],[408,58],[398,62],[388,60],[378,64],
      [368,62],[358,66],[348,64],[338,68],[328,66],[318,70],[310,68],[304,64],
      [298,58],[294,50],[290,42],[284,36],[280,30]
    ],
    india: [
      [340,92],[350,88],[360,92],[368,100],[372,110],[370,122],[366,132],[360,140],
      [352,144],[344,142],[338,136],[334,128],[332,118],[332,108],[334,100]
    ],
    sriLanka: [[362,146],[366,144],[366,150],[362,152]],
    china: [
      [382,62],[396,58],[410,60],[422,66],[430,74],[434,82],[436,92],[434,102],
      [430,110],[424,116],[416,120],[408,122],[400,118],[392,112],[386,104],[382,96],
      [380,86],[378,78],[380,70]
    ],
    seAsia: [
      [402,122],[412,118],[422,122],[430,128],[432,138],[428,146],[420,150],[412,148],
      [406,142],[402,134]
    ],
    japan: [
      [460,48],[466,42],[470,46],[472,52],[470,60],[468,68],[464,72],[460,70],
      [458,64],[456,58],[458,52]
    ],
    japan2: [[464,40],[468,38],[470,42],[468,46],[464,44]],
    indonesia: [
      [412,158],[420,156],[430,158],[438,160],[440,164],[436,166],[428,166],[420,164],[414,162]
    ],
    indonesia2: [[442,158],[448,156],[452,158],[452,162],[448,164],[444,162]],
    indonesia3: [[456,158],[460,156],[464,160],[462,164],[458,162]],
    australia: [
      [432,186],[446,182],[460,184],[472,190],[480,198],[484,208],[482,218],
      [478,226],[470,232],[460,234],[450,232],[440,228],[434,222],[430,214],
      [428,206],[428,196],[430,190]
    ],
    tasmania: [[474,238],[478,236],[480,240],[478,244],[474,242]],
    newZealand: [[520,228],[524,224],[526,230],[524,238],[520,236]],
    newZealand2: [[522,240],[526,242],[524,248],[520,246]],
  },

  // Terrain zones — rectangular regions with terrain type
  // Format: [x1, y1, x2, y2, terrainType]
  terrainZones: [
    // Sahara
    [244,90, 294,108, 'desert'],
    // Arabian desert
    [290,80, 318,100, 'hotDesert'],
    // Australian outback
    [440,195, 475,225, 'desert'],
    // Gobi
    [390,58, 420,72, 'desert'],
    // Amazon rainforest
    [112,168, 148,200, 'denseForest'],
    // Congo
    [258,148, 284,170, 'forest'],
    // Siberian taiga
    [330,16, 490,38, 'forest'],
    // Canadian forest
    [40,34, 100,54, 'forest'],
    // Scandinavian forest
    [258,14, 274,30, 'forest'],
    // Rocky Mountains
    [46,56, 56,100, 'mountain'],
    // Andes
    [106,164, 116,260, 'mountain'],
    // Alps
    [256,52, 272,60, 'mountain'],
    // Himalayas
    [348,68, 390,78, 'highMtn'],
    // Greenland ice
    [142,12, 172,36, 'ice'],
    // Tundra - northern Russia
    [276,12, 498,22, 'tundra'],
    // Tundra - northern Canada
    [28,30, 120,40, 'tundra'],
    // East African highlands
    [280,120, 300,150, 'grassland'],
  ],

  // Rivers as polyline coordinate arrays
  rivers: [
    // Nile
    [[286,96],[284,108],[282,120],[280,132],[278,148],[276,160]],
    // Amazon
    [[108,182],[118,180],[128,182],[138,180],[148,178],[154,176]],
    // Mississippi
    [[96,68],[98,78],[100,90],[102,102],[104,114],[106,126],[108,132]],
    // Yangtze
    [[394,78],[404,76],[414,80],[424,82],[430,86]],
    // Danube
    [[260,50],[268,52],[276,54],[284,56]],
    // Ganges
    [[350,100],[358,98],[366,102],[372,106]],
    // Congo
    [[258,158],[266,156],[274,158],[280,162]],
  ],

  // Point-in-polygon test (ray casting)
  pointInPoly: function(x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1];
      var xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  },

  // Check if point is near a river
  nearRiver: function(x, y, threshold) {
    for (var r = 0; r < this.rivers.length; r++) {
      var river = this.rivers[r];
      for (var i = 0; i < river.length - 1; i++) {
        var dx = river[i+1][0] - river[i][0];
        var dy = river[i+1][1] - river[i][1];
        var len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) continue;
        var t = Math.max(0, Math.min(1, ((x-river[i][0])*dx + (y-river[i][1])*dy) / (len*len)));
        var px = river[i][0] + t * dx;
        var py = river[i][1] + t * dy;
        var dist = Math.sqrt((x-px)*(x-px) + (y-py)*(y-py));
        if (dist < threshold) return true;
      }
    }
    return false;
  },

  // Distance from point to nearest polygon edge (for coast detection)
  distToCoast: function(x, y, poly) {
    var minDist = 999;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var dx = poly[i][0] - poly[j][0];
      var dy = poly[i][1] - poly[j][1];
      var len = Math.sqrt(dx*dx + dy*dy);
      if (len === 0) continue;
      var t = Math.max(0, Math.min(1, ((x-poly[j][0])*dx + (y-poly[j][1])*dy) / (len*len)));
      var px = poly[j][0] + t * dx;
      var py = poly[j][1] + t * dy;
      var d = Math.sqrt((x-px)*(x-px) + (y-py)*(y-py));
      if (d < minDist) minDist = d;
    }
    return minDist;
  },

  // Determine what's at a grid cell
  getTerrainAt: function(x, y) {
    // Check all continent polygons
    var allPolys = Object.keys(this.continents);
    var isLand = false;
    var landPoly = null;

    for (var p = 0; p < allPolys.length; p++) {
      var poly = this.continents[allPolys[p]];
      if (this.pointInPoly(x, y, poly)) {
        isLand = true;
        landPoly = poly;
        break;
      }
    }

    if (!isLand) {
      // Ocean — check distance to any coast for shelf coloring
      var minCoastDist = 999;
      for (var p = 0; p < allPolys.length; p++) {
        var d = this.distToCoast(x, y, this.continents[allPolys[p]]);
        if (d < minCoastDist) minCoastDist = d;
      }
      if (minCoastDist < 3) return 'coastShelf';
      if (minCoastDist < 6) return 'shallowOcn';
      if (minCoastDist < 15) return 'midOcean';
      return 'deepOcean';
    }

    // Check rivers
    if (this.nearRiver(x, y, 1.2)) return 'river';

    // Check terrain zones
    for (var z = 0; z < this.terrainZones.length; z++) {
      var zone = this.terrainZones[z];
      if (x >= zone[0] && x <= zone[2] && y >= zone[1] && y <= zone[3]) {
        return zone[4];
      }
    }

    // Check coast proximity for beach
    if (landPoly) {
      var coastDist = this.distToCoast(x, y, landPoly);
      if (coastDist < 2) return 'beach';
    }

    // Default land
    return 'lowland';
  },

  // ========== RENDER THE WORLD MAP ==========
  renderWorldMap: function(svgEl) {
    var cols = this.MAP_COLS;
    var rows = this.MAP_ROWS;
    var cs = this.CELL_SIZE;
    var w = cols * cs;
    var h = rows * cs;

    svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    // Ocean background gradient (rendered as one rect, not per-cell)
    var svg = '<defs><linearGradient id="m-ocean" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#1E4868"/>' +
      '<stop offset="30%" stop-color="#2A5878"/>' +
      '<stop offset="60%" stop-color="#326080"/>' +
      '<stop offset="100%" stop-color="#2A5474"/>' +
    '</linearGradient></defs>' +
    '<rect width="' + w + '" height="' + h + '" fill="url(#m-ocean)"/>';

    // Only render non-deep-ocean cells (land, coast, rivers, beaches)
    // This cuts rendering from 200K cells to ~40K cells
    var colorGroups = {};
    var self = this;

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var terrain = self.getTerrainAt(col, row);

        // Skip deep/mid ocean — already covered by background
        if (terrain === 'deepOcean' || terrain === 'midOcean') continue;

        var palette = self.colors[terrain] || self.colors.shallowOcn;
        var color = self.pickColor(palette);

        if (!colorGroups[color]) colorGroups[color] = [];
        colorGroups[color].push((col * cs) + ',' + (row * cs));
      }
    }

    // Build grouped SVG — one <g> per unique color
    var colorKeys = Object.keys(colorGroups);
    for (var c = 0; c < colorKeys.length; c++) {
      var clr = colorKeys[c];
      var cells = colorGroups[clr];
      svg += '<g fill="' + clr + '">';
      for (var i = 0; i < cells.length; i++) {
        var p = cells[i].split(',');
        svg += '<rect x="' + p[0] + '" y="' + p[1] + '" width="' + cs + '" height="' + cs + '"/>';
      }
      svg += '</g>';
    }

    svgEl.innerHTML = svg;
    console.log('Mosaic map: ' + colorKeys.length + ' colors, ~' +
      Object.values(colorGroups).reduce(function(s,a){return s+a.length;},0) + ' cells rendered');
  }
};
