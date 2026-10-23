/* PEUI crest — heraldic identity generator (DESIGN-DIRECTION §5).
   Every family and rival gets a real crest: a shield with a division and a
   charge drawn from simple geometry, following the rule of tincture (metal on
   colour, colour on metal). Used on the leaderboard, dynasty panel, start
   cards, auctions and share card. SVG so it recolours per era. */
(function (root) {
  var PEUI = root.PEUI;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var GOLD = '#E9C767', SILVER = '#DDE3EA';

  /* Per-house heraldry: shape, field division, charge, motto ribbon text.
     Rivals authored here; player families read their motto from PE.Data. */
  var SPECS = {
    chen:       { shape: 'heater', division: 'per-pale',  charge: 'scales' },
    silva:      { shape: 'heater', division: 'per-fess',  charge: 'tree' },
    armstrong:  { shape: 'french', division: 'per-bend',  charge: 'star' },
    vanderbilt: { shape: 'spanish', division: 'per-pale', charge: 'acorn' },
    rothschild: { shape: 'heater', division: 'per-fess',  charge: 'column', motto: 'Quiet money is loud money.' },
    wong:       { shape: 'spanish', division: 'per-bend', charge: 'ship', motto: 'Buy the rumour, sell the morning.' },
    al_rashid:  { shape: 'heater', division: 'solid',     charge: 'crescent', motto: 'What is sold is never truly gone.' },
    petrov:     { shape: 'french', division: 'per-bend',  charge: 'lightning', motto: 'Fortune is a wave. Surf or drown.' },
    martinez:   { shape: 'heater', division: 'per-pale',  charge: 'key', motto: 'Every door has a price.' },
    okonkwo:    { shape: 'spanish', division: 'per-fess', charge: 'cog', motto: 'We build where others will not look.' },
    hartwell:   { shape: 'french', division: 'per-pale',  charge: 'crown', motto: 'The horizon is a fence for cattle.' }
  };

  /* ---------- geometry ---------- */
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  var SHAPES = {
    heater: 'M32 3 C44 3 55 6 55 14 L55 34 C55 50 45 61 32 68 C19 61 9 50 9 34 L9 14 C9 6 20 3 32 3 Z',
    spanish: 'M9 6 L55 6 L55 36 C55 51 45 61 32 68 C19 61 9 51 9 36 Z',
    french: 'M12 4 L52 4 L52 34 C52 49 44 58 32 66 C20 58 12 49 12 34 Z'
  };
  function shieldPath(shape) { return SHAPES[shape] || SHAPES.heater; }
  function clipFor(shape) {
    var id = 'cst-' + shape;
    return id;
  }
  /* Division overlays cover half the shield; drawn inside the clip. */
  function divisionPath(division) {
    switch (division) {
      case 'per-pale': return 'M32 0 L64 0 L64 72 L32 72 Z';
      case 'per-fess': return 'M0 34 L64 34 L64 72 L0 72 Z';
      case 'per-bend': return 'M0 0 L14 0 L64 50 L64 64 L50 64 L0 14 Z';
      default: return null;
    }
  }

  /* ---------- charges (drawn in a 24x24 box at origin x,y) ---------- */
  function chargeGroup(kind, x, y, s, fill) {
    var g = el('g', { transform: 'translate(' + x + ',' + y + ') scale(' + s + ')', fill: fill, stroke: 'none' });
    function line(a) { return el('line', Object.assign({ stroke: fill, 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }, a)); }
    switch (kind) {
      case 'key':
        g.appendChild(el('circle', { cx: 8, cy: 7, r: 4, fill: 'none', stroke: fill, 'stroke-width': 2 }));
        g.appendChild(el('rect', { x: 7.2, y: 10, width: 1.8, height: 10, rx: 0.9 }));
        g.appendChild(el('rect', { x: 9, y: 16, width: 3.4, height: 1.8 }));
        g.appendChild(el('rect', { x: 9, y: 19, width: 2.4, height: 1.8 }));
        break;
      case 'scales':
        g.appendChild(line({ x1: 12, y1: 3, x2: 12, y2: 20 }));
        g.appendChild(line({ x1: 4.5, y1: 6, x2: 19.5, y2: 6 }));
        g.appendChild(el('path', { d: 'M4.5 6 L1.8 12.2 A2.9 2.9 0 0 0 7.2 12.2 Z' }));
        g.appendChild(el('path', { d: 'M19.5 6 L16.8 12.2 A2.9 2.9 0 0 0 22.2 12.2 Z' }));
        g.appendChild(el('rect', { x: 9, y: 20, width: 6, height: 1.8, rx: 0.9 }));
        break;
      case 'ship':
        g.appendChild(el('path', { d: 'M3 15 L21 15 L18.5 20 L5.5 20 Z' }));
        g.appendChild(line({ x1: 12, y1: 3, x2: 12, y2: 15 }));
        g.appendChild(el('path', { d: 'M12 4 L12 13 L5.5 13 Z' }));
        g.appendChild(el('path', { d: 'M13.5 5.5 L13.5 13 L19 13 Z' }));
        break;
      case 'crescent':
        g.appendChild(el('path', { d: 'M15.5 3.5 A9.5 9.5 0 1 0 15.5 20.5 A7.6 7.6 0 1 1 15.5 3.5 Z' }));
        g.appendChild(el('path', { d: starPath(18.6, 7, 3.2, 1.3) }));
        break;
      case 'lightning':
        g.appendChild(el('path', { d: 'M13.5 2 L5.5 13.5 L11 13.5 L9.5 22 L18.5 10 L12.5 10 Z' }));
        break;
      case 'tower':
        g.appendChild(el('rect', { x: 6, y: 8, width: 12, height: 12, rx: 0.8 }));
        g.appendChild(el('rect', { x: 6, y: 4.6, width: 2.6, height: 3.4 }));
        g.appendChild(el('rect', { x: 10.7, y: 4.6, width: 2.6, height: 3.4 }));
        g.appendChild(el('rect', { x: 15.4, y: 4.6, width: 2.6, height: 3.4 }));
        g.appendChild(el('path', { d: 'M10.4 20 L10.4 15.4 A3.6 3.6 0 0 1 17.6 15.4 L17.6 20 Z', fill: 'none', stroke: fill, 'stroke-width': 1.4 }));
        break;
      case 'cog':
        for (var i = 0; i < 8; i++) g.appendChild(el('rect', { x: 11.1, y: 1.6, width: 1.8, height: 4.2, rx: 0.6, transform: 'rotate(' + i * 45 + ' 12 12)' }));
        g.appendChild(el('circle', { cx: 12, cy: 12, r: 6.4 }));
        g.appendChild(el('circle', { cx: 12, cy: 12, r: 2.4, fill: 'rgba(0,0,0,0.28)' }));
        break;
      case 'tree':
        g.appendChild(el('rect', { x: 11, y: 13.4, width: 2, height: 7, rx: 0.8 }));
        g.appendChild(el('circle', { cx: 12, cy: 8.6, r: 6.6 }));
        g.appendChild(el('circle', { cx: 7.4, cy: 11.4, r: 3.6 }));
        g.appendChild(el('circle', { cx: 16.6, cy: 11.4, r: 3.6 }));
        break;
      case 'crown':
        g.appendChild(el('path', { d: 'M4 17 L5.5 8 L10 12.5 L12 5 L14 12.5 L18.5 8 L20 17 Z' }));
        g.appendChild(el('rect', { x: 4, y: 18.4, width: 16, height: 2.2, rx: 1 }));
        g.appendChild(el('circle', { cx: 5.5, cy: 6.4, r: 1.2 }));
        g.appendChild(el('circle', { cx: 12, cy: 3.4, r: 1.2 }));
        g.appendChild(el('circle', { cx: 18.5, cy: 6.4, r: 1.2 }));
        break;
      case 'star':
        g.appendChild(el('path', { d: starPath(12, 12, 9, 3.8) }));
        break;
      case 'acorn':
        g.appendChild(el('circle', { cx: 12, cy: 13.6, r: 6 }));
        g.appendChild(el('path', { d: 'M5.4 12.2 A6.6 6.6 0 0 1 18.6 12.2 L17.4 9.8 L6.6 9.8 Z' }));
        g.appendChild(el('rect', { x: 11.2, y: 3.4, width: 1.6, height: 4, rx: 0.8, transform: 'rotate(16 12 6)' }));
        break;
      case 'column':
        g.appendChild(el('rect', { x: 5.4, y: 18.4, width: 13.2, height: 2.2, rx: 0.8 }));
        g.appendChild(el('rect', { x: 6.4, y: 15.6, width: 11.2, height: 1.8, rx: 0.7 }));
        g.appendChild(el('rect', { x: 8.2, y: 6.4, width: 7.6, height: 9.2 }));
        g.appendChild(el('rect', { x: 6.4, y: 4.4, width: 11.2, height: 2, rx: 0.7 }));
        break;
      default: /* initial letter fallback */
        var t = el('text', { x: 12, y: 16.4, 'text-anchor': 'middle', 'font-size': 13, 'font-family': 'Georgia, serif', 'font-weight': '700', fill: fill });
        t.textContent = (kind || '?').charAt(0).toUpperCase();
        g.appendChild(t);
    }
    return g;
  }
  function starPath(cx, cy, R, r) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(2) + ' ' + (cy + rad * Math.sin(a)).toFixed(2) + ' ';
    }
    return d + 'Z';
  }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(v))); }
    return 'rgb(' + c(r * f) + ',' + c(g * f) + ',' + c(b * f) + ')';
  }
  function luminance(hex) {
    var n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  /* ---------- public: build a crest svg ---------- */
  /* PEUI.crest('rothschild', {size:40, motto:true}) or PEUI.crest({name, color, motto, id}) */
  PEUI.crest = function (idOrDef, opts) {
    opts = opts || {};
    var def = typeof idOrDef === 'string' ? null : idOrDef;
    var id = def ? def.id : idOrDef;
    var spec = SPECS[id] || { shape: 'heater', division: 'solid', charge: 'letter:' + id };
    var color = (def && def.color) || houseColor(id);
    var dark = luminance(color) > 0.62;                 /* light house colours get a deep field */
    var field = dark ? shade(color, 0.42) : color;
    var metal = dark ? GOLD : (luminance(color) > 0.35 ? GOLD : SILVER);
    var size = opts.size || 40;
    var motto = opts.motto ? ((def && def.motto) || (SPECS[id] && SPECS[id].motto) || '') : '';
    var H = motto ? 92 : 74;

    var svg = el('svg', { viewBox: '0 0 64 ' + H, width: size, height: Math.round(size * H / 64), 'class': 'crestsvg', role: 'img', 'aria-label': (def ? def.name : id) + ' crest' });
    var defs = el('defs'), clipId = clipFor(spec.shape) + '-' + id + '-' + Math.round(size);
    var cp = el('clipPath', { id: clipId }), cpath = el('path', { d: shieldPath(spec.shape) });
    cp.appendChild(cpath); defs.appendChild(cp); svg.appendChild(defs);

    var body = el('g', { 'clip-path': 'url(#' + clipId + ')' });
    body.appendChild(el('path', { d: shieldPath(spec.shape), fill: field }));
    var div = divisionPath(spec.division);
    if (div) body.appendChild(el('path', { d: div, fill: shade(field, 0.78) }));
    /* faint engrave hatching on the field */
    body.appendChild(el('path', { d: 'M9 22 L55 6 M9 34 L55 18 M9 46 L55 30 M9 58 L55 42', stroke: 'rgba(255,255,255,0.07)', 'stroke-width': 5, fill: 'none' }));
    body.appendChild(chargeGroup(spec.charge.indexOf('letter:') === 0 ? spec.charge.slice(7) : spec.charge, 20, spec.charge === 'crescent' ? 22 : 24, 1, metal));
    svg.appendChild(body);
    svg.appendChild(el('path', { d: shieldPath(spec.shape), fill: 'none', stroke: shade(field, 0.55), 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));

    if (motto && motto.length) {
      var rib = el('g', { 'class': 'crestsvg__ribbon' });
      rib.appendChild(el('path', { d: 'M6 76 L32 73 L58 76 L58 84 L32 81 L6 84 Z', fill: shade(field, 0.9), stroke: shade(field, 0.55), 'stroke-width': 1 }));
      var text = el('text', { x: 32, y: 81.6, 'text-anchor': 'middle', 'font-size': 5.4, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: metal });
      text.textContent = motto.length > 34 ? motto.slice(0, 33) + '…' : motto;
      rib.appendChild(text);
      svg.appendChild(rib);
    }
    return svg;
  };
  function houseColor(id) {
    if (root.PE && root.PE.Data) {
      var f = root.PE.Data.familyById && root.PE.Data.familyById[id];
      var r = root.PE.Data.rivalById && root.PE.Data.rivalById(id);
      if (f) return f.color;
      if (r) return r.color;
    }
    return '#3D5A80';
  }
  PEUI.crestMotto = function (id) { return (SPECS[id] && SPECS[id].motto) || ''; };

  /* ---------- engraved portraits (ENG-C1) ----------
     assets/portraits/<id>.svg: two-ink engraving busts for every house, drawn
     to read at 30px by silhouette. Use for hero spots, leaderboard rows and
     family cards; crests stay for tiny inline marks. Unknown ids fall back to
     the heraldic crest. */
  var PORTRAITS = { chen: 1, silva: 1, armstrong: 1, vanderbilt: 1, rothschild: 1, wong: 1, al_rashid: 1, petrov: 1, martinez: 1, okonkwo: 1, hartwell: 1 };
  PEUI.hasPortrait = function (id) { return !!PORTRAITS[id]; };
  /* PEUI.portrait('wong', {size:40}) or PEUI.portrait({id, name}, {size:40}) */
  PEUI.portrait = function (idOrDef, opts) {
    opts = opts || {};
    var id = typeof idOrDef === 'string' ? idOrDef : (idOrDef && idOrDef.id);
    if (!PORTRAITS[id]) return PEUI.crest(idOrDef, opts);
    var size = opts.size || 40;
    var img = document.createElement('img');
    img.src = 'assets/portraits/' + id + '.svg';
    img.width = size;
    img.height = Math.round(size * 1.25);
    img.className = 'portrait';
    img.alt = ((typeof idOrDef === 'object' && idOrDef && idOrDef.name) || id) + ' portrait';
    return img;
  };
})(window);
