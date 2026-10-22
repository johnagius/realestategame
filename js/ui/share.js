/* PEUI share — the 1080×1080 dynasty card offered at era ends: the family crest
   (real heraldry from PEUI.crest, not a placeholder disc), the motto in italic
   serif beneath it, era, net worth, rank, generation and a silhouette of the
   city. The city is a snapshot of the live 3D renderer when one is alive and
   readable; otherwise a stylised skyline drawn from the property list.
   Offered as a PNG download. shareCard is async: it resolves to the canvas
   once the crest image (SVG → data URL → Image) is ready. */
(function (root) {
  var PEUI = root.PEUI, h = PEUI.h, fmt = PEUI.fmt, icon = PEUI.icon;
  function PE() { return root.PE; }
  var SZ = 1080;
  var INK = '#1F2733', PAPER = '#F4EFE4', PAPER2 = '#C4BCAD', GOLD = '#D9B45C', NIGHT = '#0b1024';

  function font(px, display, weight) {
    var fam = display ? '"Playfair Display", Georgia, serif' : 'Nunito, system-ui, sans-serif';
    return (weight || 700) + ' ' + px + 'px ' + fam;
  }

  /* Try the live WebGL canvas; a blank or dead buffer falls back to the drawn skyline. */
  function citySnapshot() {
    var C = root.City3D; if (!C || !C._renderer || !C._scene || !C._cam || !C._canvas) return null;
    try {
      C._renderer.render(C._scene, C._cam);
      var src = C._canvas, probe = document.createElement('canvas'); probe.width = 8; probe.height = 8;
      var pc = probe.getContext('2d'); pc.drawImage(src, 0, 0, 8, 8);
      var d = pc.getImageData(0, 0, 8, 8).data, lit = 0;
      for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && (d[i] + d[i + 1] + d[i + 2]) > 30) lit++;
      if (lit < 8) return null;
      return src;
    } catch (e) { return null; }
  }

  /* The house motto: player families carry it in PE.Data, rivals in crest.js. */
  function mottoFor(s) {
    var fam = (PE().Data.familyById && PE().Data.familyById(s.familyId)) || null;
    return (fam && fam.motto) || (PEUI.crestMotto ? PEUI.crestMotto(s.familyId) : '') || '';
  }

  /* PEUI.crest produces an SVG; serialise it to a data URL and load it as an Image.
     Resolves null (fast — 2 s cap) so the card still renders without heraldry. */
  function crestImage(s, sm) {
    return new Promise(function (resolve) {
      if (!PEUI.crest || typeof XMLSerializer === 'undefined' || typeof Image === 'undefined') return resolve(null);
      var settled = false;
      function done(img) { if (settled) return; settled = true; try { clearTimeout(timer); } catch (e) {} resolve(img); }
      var timer = setTimeout(function () { done(null); }, 2000);
      try {
        var svg = PEUI.crest({ id: s.familyId, name: 'House of ' + s.dynasty.surname, color: sm.color, motto: mottoFor(s) }, { size: 64, motto: false });
        var xml = new XMLSerializer().serializeToString(svg);
        var img = new Image();
        img.onload = function () { done(img); };
        img.onerror = function () { done(null); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      } catch (e) { done(null); }
    });
  }

  /* Stylised skyline from the property list: your buildings in the family colour, the rest of the city behind. */
  function skyline(ctx, props, color, y0, hgt) {
    var base = y0 + hgt, seed = 7, i;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    ctx.fillStyle = '#16203a';
    var x = 0; while (x < SZ) { var w = 24 + rnd() * 60, hh = 40 + rnd() * hgt * 0.45; ctx.fillRect(x, base - hh, w, hh); x += w + 4 + rnd() * 10; }
    ctx.fillStyle = '#22304f';
    x = 10; while (x < SZ) { var w2 = 30 + rnd() * 50, h2 = 20 + rnd() * hgt * 0.3; ctx.fillRect(x, base - h2, w2, h2); x += w2 + 8 + rnd() * 14; }
    var owned = props.slice().sort(function (a, b) { return b.trueValue - a.trueValue; }).slice(0, 12), max = 1;
    var SCALE = { terrace: 0.28, lodging: 0.26, townhouse: 0.34, house: 0.3, villa: 0.3, shop: 0.3, studio: 0.4, tenement: 0.5, apartment: 0.55, warehouse: 0.4, mansion: 0.4, office: 0.75, penthouse: 0.8, tower: 1.0, land: 0.08 };
    for (i = 0; i < owned.length; i++) max = Math.max(max, owned[i].trueValue);
    var slot = Math.min(150, SZ / Math.max(owned.length, 1)), cx = (SZ - slot * owned.length) / 2 + slot / 2;
    for (i = 0; i < owned.length; i++) {
      var p = owned[i], sc = SCALE[p.type] || 0.4, tall = sc >= 0.7, w3 = tall ? slot * 0.5 : slot * 0.72;
      var h3 = 40 + (0.5 + 0.5 * Math.log(1 + p.trueValue) / Math.log(1 + max)) * hgt * sc;
      var left = cx - w3 / 2;
      ctx.fillStyle = color; ctx.fillRect(left, base - h3, w3, h3);
      ctx.fillStyle = 'rgba(255,224,160,0.85)';
      for (var r = base - h3 + 14; r < base - 14; r += 18) for (var c = left + 8; c < left + w3 - 10; c += 14) if (rnd() > 0.35) ctx.fillRect(c, r, 6, 9);
      if (!tall && p.type !== 'land') { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(left - 4, base - h3); ctx.lineTo(cx, base - h3 - 22); ctx.lineTo(left + w3 + 4, base - h3); ctx.closePath(); ctx.fill(); }
      cx += slot;
    }
    ctx.fillStyle = '#0a0f1c'; ctx.fillRect(0, base, SZ, SZ - base);
  }

  /* Async: resolves to the finished canvas (or null when there is nothing to share). */
  PEUI.shareCard = function (r) {
    var s = PE().Game.state(), sm = PEUI.summary(), pf = PE().Game.portfolio();
    if (!s || !sm.ok) return Promise.resolve(null);
    var cv = document.createElement('canvas'); cv.width = SZ; cv.height = SZ;
    var ctx = cv.getContext('2d');
    // sky
    var g = ctx.createLinearGradient(0, 0, 0, SZ); g.addColorStop(0, '#0b1024'); g.addColorStop(0.65, '#1F2733'); g.addColorStop(1, '#3a2f3f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SZ, SZ);
    // city band
    var snap = citySnapshot();
    if (snap) {
      var sw = snap.width, sh = snap.height, ratio = Math.max(SZ / sw, 440 / sh), dw = sw * ratio, dh = sh * ratio;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 600, SZ, 440); ctx.clip();
      ctx.drawImage(snap, (SZ - dw) / 2, 1040 - dh, dw, dh);
      var fade = ctx.createLinearGradient(0, 600, 0, 760); fade.addColorStop(0, 'rgba(31,39,51,1)'); fade.addColorStop(1, 'rgba(31,39,51,0)');
      ctx.fillStyle = fade; ctx.fillRect(0, 600, SZ, 160); ctx.restore();
      ctx.fillStyle = '#0a0f1c'; ctx.fillRect(0, 1040, SZ, 40);
    } else skyline(ctx, pf.ok ? pf.properties : [], sm.color, 560, 480);
    // frame
    ctx.strokeStyle = GOLD; ctx.lineWidth = 6; ctx.strokeRect(36, 36, SZ - 72, SZ - 72);
    var motto = mottoFor(s), mottoY = motto ? 304 : 288;
    return crestImage(s, sm).then(function (img) {
      // crest top-centre (real heraldry), disc-letter fallback
      if (img) {
        var cw = 180, chh = cw * (img.height / Math.max(1, img.width));
        ctx.drawImage(img, (SZ - cw) / 2, 52, cw, chh);
      } else {
        ctx.beginPath(); ctx.arc(SZ / 2, 170, 70, 0, Math.PI * 2); ctx.fillStyle = sm.color; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = GOLD; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = font(78, true, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(PEUI.crestLetter(s.dynasty.surname), SZ / 2, 174);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      // motto in italic serif under the crest
      if (motto) {
        ctx.fillStyle = GOLD; ctx.font = 'italic 700 27px "Playfair Display", Georgia, serif';
        ctx.fillText('“' + motto + '”', SZ / 2, mottoY);
      }
      // rule
      ctx.fillStyle = GOLD; ctx.fillRect(SZ / 2 - 120, mottoY + 20, 240, 3);
      // name and era
      ctx.fillStyle = PAPER; ctx.font = font(64, true, 800); ctx.fillText('House of ' + s.dynasty.surname, SZ / 2, mottoY + 104);
      ctx.fillStyle = GOLD; ctx.font = font(26, false, 800);
      var eraName = r && r.eraName ? r.eraName : sm.era, yr = r ? r.year : sm.year;
      ctx.fillText((r && r.eraChanged ? 'THE ' + eraName.toUpperCase() + ' ERA ENDS · ' : '') + yr, SZ / 2, mottoY + 158);
      // stats
      var stats = [['NET WORTH', fmt.money(r ? r.netWorthAfter : sm.netWorth)], ['RANK', '#' + (r ? r.rank.after : sm.rank) + ' of ' + (Object.keys(s.rivals).length + 1)], ['GENERATION', fmt.ordinal(sm.generation)]];
      for (var i = 0; i < stats.length; i++) {
        var x = SZ / 6 + i * SZ / 3;
        ctx.fillStyle = PAPER2; ctx.font = font(22, false, 800); ctx.fillText(stats[i][0], x, mottoY + 226);
        ctx.fillStyle = PAPER; ctx.font = font(52, true, 800); ctx.fillText(stats[i][1], x, mottoY + 288);
      }
      ctx.fillStyle = PAPER2; ctx.font = font(22, false, 700); ctx.fillText('Property Empire · ' + s.startYear + '–' + yr + ' · ' + s.familyName, SZ / 2, SZ - 58);
      return cv;
    });
  };

  PEUI.downloadBlob = function (filename, blob) {
    var url = URL.createObjectURL(blob), a = h('a', { href: url, download: filename }); document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  };

  var lastCard = null;
  PEUI.openShareCard = function (r) {
    PEUI.shareCard(r).then(function (cv) {
      if (!cv) { PEUI.toast('Nothing to share yet.'); return; }
      lastCard = cv;
      var s = PE().Game.state();
      var img = h('img', { class: 'share-preview', alt: 'Dynasty card: House of ' + s.dynasty.surname + ', ' + (r ? r.year : s.year) + ', net worth ' + fmt.money(r ? r.netWorthAfter : PEUI.summary().netWorth), src: cv.toDataURL('image/png') });
      PEUI.sheet.open({ id: 'share', title: 'Dynasty card', sub: '1080 × 1080 PNG', body: [img, h('p', { class: 'small muted', text: 'Save it, post it, or keep it for the family album.' })],
        foot: h('div', { class: 'btn-row' }, [PEUI.btn('Close', { cls: 'btn--ghost', action: 'sheet-close' }), PEUI.btn('Download PNG', { cls: 'btn--primary', icon: 'download', action: 'share-download' })]) });
    });
  };
  PEUI.actions['share-card'] = function () { PEUI.openShareCard(PEUI.shownReport || PEUI.lastReport || null); };
  PEUI.actions['share-download'] = function () {
    if (!lastCard) return;
    var s = PE().Game.state(), name = 'property-empire-' + s.dynasty.surname.toLowerCase() + '-' + (PEUI.shownReport ? PEUI.shownReport.year : s.year) + '.png';
    if (lastCard.toBlob) lastCard.toBlob(function (b) { if (b) PEUI.downloadBlob(name, b); }, 'image/png');
    else { var a = h('a', { href: lastCard.toDataURL('image/png'), download: name }); document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    PEUI.toast('Card saved.', 'success');
  };
})(window);
