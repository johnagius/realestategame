/* ========================================
   PROPERTY EMPIRE — Animated Intro Screen
   Canvas-rendered mansion scene with parallax
   ======================================== */

var IntroScene = {
  _running: false,
  _animId: null,

  start: function() {
    var cv = document.getElementById('splash-canvas');
    if (!cv || this._running) return;
    this._running = true;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0;

    function rsz() { W = cv.width = cv.clientWidth; H = cv.height = cv.clientHeight; }
    rsz();
    var resizeHandler = function() { rsz(); };
    window.addEventListener('resize', resizeHandler);
    this._resizeHandler = resizeHandler;

    // Seeded RNG
    function mkR(s) { var d = s >>> 0; return function() { d ^= d << 13; d ^= d >>> 17; d ^= d << 5; return (d >>> 0) / 4294967296; }; }
    var R = mkR(1750);

    // Parallax
    var tMX = 0.5, tMY = 0.5, cMX = 0.5, cMY = 0.5;
    var moveHandler = function(e) { tMX = e.clientX / innerWidth; tMY = e.clientY / innerHeight; };
    window.addEventListener('mousemove', moveHandler);
    this._moveHandler = moveHandler;
    function px(i) { return (cMX - 0.5) * i; }

    // Data
    var STARS = []; for (var i = 0; i < 240; i++) STARS.push({ x: R(), y: R() * 0.65, r: 0.18 + R() * 1.5, ph: R() * 6.28, sp: 0.4 + R() * 2.4, b: 0.06 + R() * 0.78 });
    var CLOUDS = []; for (var i = 0; i < 12; i++) CLOUDS.push({ x: R() - 0.12, y: 0.04 + R() * 0.34, w: 0.06 + R() * 0.24, h: 0.013 + R() * 0.034, sp: 0.000011 + R() * 0.000032, op: 0.07 + R() * 0.25, hue: 284 + R() * 58 });
    var FLIES = []; for (var i = 0; i < 36; i++) FLIES.push({ bx: 0.22 + R() * 0.56, by: 0.53 + R() * 0.19, ph: R() * 6.28, sp: 0.0007 + R() * 0.0028, rx: 0.03 + R() * 0.11, ry: 0.01 + R() * 0.046, op: 0.28 + R() * 0.72, sz: 1.1 + R() * 2.6 });
    var SHOOTS = [], nextSh = 3500;
    var SMK = [], lastSmk = 0;
    var chPts = [];

    function hillY(x, y0, ls) { var y = y0; for (var i = 0; i < ls.length; i++) y -= ls[i][0] * Math.sin(x * ls[i][1] + ls[i][2]); return y; }
    function fillHill(y0, col, ls) {
      ctx.beginPath(); ctx.moveTo(-4, H + 4); ctx.lineTo(-4, hillY(-4, y0, ls));
      for (var x = 0; x <= W + 4; x += 4) ctx.lineTo(x, hillY(x, y0, ls));
      ctx.lineTo(W + 4, H + 4); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    function win(x, y, w, h, t) {
      var fl = 0.78 + 0.12 * Math.sin(t * 3.2 + x * 0.015 + y * 0.014) + 0.06 * Math.sin(t * 7.9 + x * 0.027);
      ctx.fillStyle = '#1c1208'; ctx.fillRect(x, y, w, h);
      var g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, 'rgba(255,205,82,' + (fl * 0.76) + ')'); g.addColorStop(0.42, 'rgba(242,142,28,' + (fl * 0.96) + ')'); g.addColorStop(1, 'rgba(196,80,8,' + (fl * 0.62) + ')');
      ctx.fillStyle = g; ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.strokeStyle = 'rgba(16,10,4,.68)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y + 2); ctx.lineTo(x + w / 2, y + h - 2); ctx.moveTo(x + 2, y + h * 0.45); ctx.lineTo(x + w - 2, y + h * 0.45); ctx.stroke();
      var gl = ctx.createRadialGradient(x + w / 2, y + h * 0.4, 0, x + w / 2, y + h * 0.4, w * 2.6);
      gl.addColorStop(0, 'rgba(255,166,26,' + (fl * 0.26) + ')'); gl.addColorStop(1, 'rgba(255,166,26,0)');
      ctx.fillStyle = gl; ctx.fillRect(x - w, y - h, w * 3, h * 3);
    }
    function tree(cx, gy, sc) {
      ctx.fillStyle = '#2a1c0e'; ctx.fillRect(cx - 4 * sc, gy - 40 * sc, 8 * sc, 40 * sc);
      [[0, 54, 28, '#153e12'], [-11, 45, 20, '#174c16'], [11, 45, 19, '#174c16'], [0, 66, 15, '#1c4a1a'], [-6, 56, 13, '#1e4e1c']].forEach(function(a) { ctx.beginPath(); ctx.arc(cx + a[0] * sc, gy - a[1] * sc, a[2] * sc, 0, 6.28); ctx.fillStyle = a[3]; ctx.fill(); });
      [[- 7, 46, 14, '#225620'], [8, 42, 12, '#225620'], [2, 60, 10, '#245a22']].forEach(function(a) { ctx.beginPath(); ctx.arc(cx + a[0] * sc, gy - a[1] * sc, a[2] * sc, 0, 6.28); ctx.fillStyle = a[3]; ctx.fill(); });
    }

    function mansion(t) {
      var s = Math.min(W / 1440, 1.15) * 0.92, CX = W * 0.5, GY = H * 0.695;
      var MW = 422 * s, MH = 198 * s, WW = 120 * s, WH = 158 * s, chW = 14 * s, chH = 58 * s;
      chPts = [CX - MW * 0.36, CX - MW * 0.11, CX + MW * 0.11, CX + MW * 0.36];

      // Glow
      var eg = ctx.createRadialGradient(CX, GY + 12, 0, CX, GY + 12, (MW + WW * 2) * 0.75);
      eg.addColorStop(0, 'rgba(202,118,20,.44)'); eg.addColorStop(1, 'rgba(202,118,20,0)');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(CX, GY + 12, (MW + WW * 2) * 0.72, MH * 0.22, 0, 0, 6.28); ctx.fill();

      // Chimneys
      chPts.forEach(function(cx) {
        ctx.fillStyle = '#221808'; ctx.fillRect(cx - chW / 2, GY - MH - chH + 18 * s, chW, chH);
        ctx.fillStyle = '#14100a'; ctx.fillRect(cx - chW / 2 - 3 * s, GY - MH - chH + 15 * s, chW + 6 * s, 5 * s);
      });

      // Wings
      [[CX - MW / 2 - WW, 0.93], [CX + MW / 2, 0.88]].forEach(function(a) {
        var wx = a[0], sh = a[1];
        ctx.fillStyle = 'rgba(160,152,138,' + sh + ')'; ctx.fillRect(wx, GY - WH, WW, WH);
        ctx.fillStyle = '#2c2014'; ctx.fillRect(wx - 1 * s, GY - WH - 5 * s, WW + 2 * s, 9 * s);
        for (var row = 0; row < 2; row++) for (var col = 0; col < 2; col++) win(wx + WW * (col + 1) / 3 - 7.5 * s, GY - WH + WH * (row + 0.66) / 2.2 - 12 * s, 14 * s, 20 * s, t);
      });

      // Main block
      ctx.fillStyle = '#c4bca8'; ctx.fillRect(CX - MW / 2, GY - MH, MW, MH);

      // Stone courses
      ctx.strokeStyle = 'rgba(0,0,0,.052)'; ctx.lineWidth = 0.65;
      for (var y = GY - MH + 13 * s; y < GY; y += 13 * s) { ctx.beginPath(); ctx.moveTo(CX - MW / 2, y); ctx.lineTo(CX + MW / 2, y); ctx.stroke(); }

      // String course + cornice
      ctx.fillStyle = '#d4ccba'; ctx.fillRect(CX - MW / 2 - 1.5 * s, GY - MH * 0.67, MW + 3 * s, 6.5 * s);
      ctx.fillStyle = '#d2cab8'; ctx.fillRect(CX - MW / 2 - 3 * s, GY - MH, MW + 6 * s, 12 * s);

      // Directional light
      var ll = ctx.createLinearGradient(CX - MW / 2, GY - MH, CX + MW * 0.45, GY);
      ll.addColorStop(0, 'rgba(255,238,190,.12)'); ll.addColorStop(0.38, 'rgba(255,238,190,.03)'); ll.addColorStop(1, 'rgba(0,0,0,.16)');
      ctx.fillStyle = ll; ctx.fillRect(CX - MW / 2, GY - MH, MW, MH);

      // Windows 3x5
      var wW = 18 * s, wH = 27 * s;
      for (var row = 0; row < 3; row++) for (var col = 0; col < 5; col++) {
        if (row === 2 && col === 2) continue;
        win(CX - MW / 2 + MW * (col + 1) / 6 - wW / 2, GY - MH + MH * (row + 0.5) / 3.08 - wH / 2, wW, wH, t);
      }

      // Portico columns
      var pW = 100 * s, pH = MH * 0.58, pX = CX - pW / 2, pY = GY - pH;
      ctx.fillStyle = '#ccc4b2'; ctx.fillRect(pX - 5 * s, pY, pW + 10 * s, pH);
      for (var i = 0; i < 6; i++) {
        var colX = pX + pW * (i / 5);
        ctx.fillStyle = '#e2dacc'; ctx.fillRect(colX - 5.5 * s, pY, 11 * s, pH);
      }
      // Pediment
      ctx.fillStyle = '#ccc4b0'; ctx.beginPath(); ctx.moveTo(pX - 14 * s, pY - 9 * s); ctx.lineTo(CX, pY - 38 * s); ctx.lineTo(pX + pW + 14 * s, pY - 9 * s); ctx.closePath(); ctx.fill();

      // Door glow
      var dW = 28 * s, dH = 46 * s;
      ctx.fillStyle = '#150c04'; ctx.beginPath(); ctx.moveTo(CX - dW / 2, GY); ctx.lineTo(CX - dW / 2, GY - dH + dW / 2); ctx.arc(CX, GY - dH + dW / 2, dW / 2, Math.PI, 0); ctx.lineTo(CX + dW / 2, GY); ctx.closePath(); ctx.fill();
      var dg = ctx.createRadialGradient(CX, GY - dH * 0.4, 0, CX, GY - dH * 0.4, dW * 2);
      dg.addColorStop(0, 'rgba(255,155,36,' + (0.68 + 0.1 * Math.sin(t * 2.9)) + ')'); dg.addColorStop(1, 'rgba(255,155,36,0)');
      ctx.fillStyle = dg; ctx.fillRect(CX - dW * 2.2, GY - dH * 1.5, dW * 4.4, dH * 1.8);

      // Steps
      for (var i = 0; i < 4; i++) { var sw = 148 * s + i * 26 * s; ctx.fillStyle = 'rgba(185,174,158,' + (0.46 + i * 0.2) + ')'; ctx.fillRect(CX - sw / 2, GY + i * 4.5 * s, sw, 4.5 * s); }
    }

    var self = this;
    function draw(ts) {
      if (!self._running) return;
      self._animId = requestAnimationFrame(draw);
      cMX += (tMX - cMX) * 0.042; cMY += (tMY - cMY) * 0.042;
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      var t = ts * 0.001, HOR = H * 0.69;

      // Sky gradient
      var sk = ctx.createLinearGradient(0, 0, 0, H);
      sk.addColorStop(0, '#020108'); sk.addColorStop(0.07, '#0a051c'); sk.addColorStop(0.18, '#1c0840');
      sk.addColorStop(0.3, '#421058'); sk.addColorStop(0.42, '#681450'); sk.addColorStop(0.53, '#8a1c2e');
      sk.addColorStop(0.62, '#a82e18'); sk.addColorStop(0.72, '#c24a10'); sk.addColorStop(0.81, '#cc6008');
      sk.addColorStop(0.9, '#b85208'); sk.addColorStop(1, '#8c4008');
      ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.save(); ctx.translate(px(6), 0);
      STARS.forEach(function(s) { var a = s.b * (0.42 + 0.58 * Math.sin(t * s.sp + s.ph)); ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.28); ctx.fillStyle = 'rgba(215,228,255,' + a + ')'; ctx.fill(); });
      ctx.restore();

      // Shooting stars
      if (ts > nextSh) { SHOOTS.push({ x: R() * W * 0.7, y: R() * H * 0.36, vx: 7 + R() * 9, vy: 2.8 + R() * 4.5, life: 1 }); nextSh = ts + 4500 + R() * 9000; }
      for (var i = SHOOTS.length - 1; i >= 0; i--) {
        var sh = SHOOTS[i], tg = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 24, sh.y - sh.vy * 24);
        tg.addColorStop(0, 'rgba(255,255,255,' + sh.life + ')'); tg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = tg; ctx.lineWidth = 1.6 * sh.life; ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.x - sh.vx * 24, sh.y - sh.vy * 24); ctx.stroke();
        sh.x += sh.vx * 1.1; sh.y += sh.vy * 1.1; sh.life -= 0.02; if (sh.life <= 0) SHOOTS.splice(i, 1);
      }

      // Moon
      ctx.save(); ctx.translate(px(9), 0);
      var mx = W * 0.78, my = H * 0.1, mr = H * 0.064;
      var md = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.25, 0, mx, my, mr);
      md.addColorStop(0, '#fffef4'); md.addColorStop(0.48, '#fcea85'); md.addColorStop(1, '#d2b022');
      ctx.fillStyle = md; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.28); ctx.fill();
      // Moon glow
      var mg = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 5.8);
      mg.addColorStop(0, 'rgba(250,224,100,.18)'); mg.addColorStop(1, 'rgba(250,224,100,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 5.8, 0, 6.28); ctx.fill();
      ctx.restore();

      // Hills
      ctx.save(); ctx.translate(px(20), 0); fillHill(H * 0.67, '#16102c', [[H * 0.135, 0.0021, 1.12], [H * 0.055, 0.0036, 3.25]]); ctx.restore();
      ctx.save(); ctx.translate(px(36), 0); fillHill(H * 0.675, '#141c10', [[H * 0.092, 0.0024, 2.72], [H * 0.044, 0.004, 1.08]]); ctx.restore();
      ctx.save(); ctx.translate(px(56), 0); fillHill(H * 0.68, '#0c1008', [[H * 0.06, 0.0031, 0.46], [H * 0.028, 0.0052, 2.38]]); ctx.restore();

      // Clouds
      ctx.save(); ctx.translate(px(13), 0);
      CLOUDS.forEach(function(c) {
        c.x = (c.x - c.sp + 1.32) % 1.32 - 0.14;
        var cx2 = c.x * W, cy2 = c.y * H, cw = c.w * W, ch = c.h * H;
        var cg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, cw * 0.68);
        cg.addColorStop(0, 'hsla(' + c.hue + ',32%,66%,' + c.op + ')'); cg.addColorStop(1, 'hsla(0,0%,40%,0)');
        ctx.beginPath(); ctx.ellipse(cx2, cy2, cw * 0.64, ch, 0, 0, 6.28); ctx.fillStyle = cg; ctx.fill();
      }); ctx.restore();

      // Ground
      var gr = ctx.createLinearGradient(0, HOR, 0, H);
      gr.addColorStop(0, '#7e4e14'); gr.addColorStop(0.26, '#906018'); gr.addColorStop(1, '#503410');
      ctx.fillStyle = gr; ctx.fillRect(0, HOR, W, H - HOR);

      // Horizon haze
      var hz = ctx.createLinearGradient(0, HOR - 55, 0, HOR + 45);
      hz.addColorStop(0, 'rgba(192,108,22,0)'); hz.addColorStop(0.42, 'rgba(192,108,22,.2)'); hz.addColorStop(1, 'rgba(192,108,22,0)');
      ctx.fillStyle = hz; ctx.fillRect(0, HOR - 55, W, 100);

      // Mansion
      ctx.save(); ctx.translate(px(10), 0); mansion(t); ctx.restore();

      // Trees
      ctx.save(); ctx.translate(px(15), 0);
      var GY = H * 0.695, sc = Math.min(W / 1440, 1.15) * 0.92;
      tree(W * 0.088, GY, sc * 1.12); tree(W * 0.172, GY, sc * 0.86); tree(W * 0.862, GY, sc * 1.0); tree(W * 0.928, GY, sc * 0.8);
      ctx.restore();

      // Chimney smoke
      if (ts - lastSmk > 190) {
        chPts.forEach(function(cx) { if (Math.random() > 0.48) SMK.push({ x: cx + (Math.random() - 0.5) * 3.5, y: GY - 198 * sc - 58 * sc + 18 * sc, vx: (Math.random() - 0.5) * 0.3, vy: -0.46 - Math.random() * 0.44, r: 3.5 + Math.random() * 4, life: 1, decay: 0.003 + Math.random() * 0.003 }); });
        lastSmk = ts;
      }
      for (var i = SMK.length - 1; i >= 0; i--) {
        var p = SMK[i]; p.x += p.vx; p.y += p.vy; p.vx += (Math.random() - 0.5) * 0.06; p.r += 0.11; p.life -= p.decay;
        if (p.life <= 0) { SMK.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fillStyle = 'rgba(188,164,140,' + (p.life * 0.21) + ')'; ctx.fill();
      }

      // Fireflies
      ctx.save(); ctx.translate(px(18), 0);
      FLIES.forEach(function(f) {
        f.ph += f.sp;
        var x = (f.bx + Math.cos(f.ph * 0.68) * f.rx) * W, y = (f.by + Math.sin(f.ph) * f.ry) * H;
        var a = f.op * (0.44 + 0.56 * Math.sin(f.ph * 2.9));
        var fg = ctx.createRadialGradient(x, y, 0, x, y, f.sz * 5.2);
        fg.addColorStop(0, 'rgba(200,255,88,' + (a * 0.92) + ')'); fg.addColorStop(1, 'rgba(130,220,40,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y, f.sz * 5.2, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, f.sz * 0.68, 0, 6.28); ctx.fillStyle = 'rgba(230,255,160,' + a + ')'; ctx.fill();
      }); ctx.restore();

      // Vignette
      var vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 1.02);
      vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(0.58, 'rgba(0,0,0,.08)'); vig.addColorStop(1, 'rgba(0,0,0,.84)');
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
    }

    this._animId = requestAnimationFrame(draw);
  },

  stop: function() {
    this._running = false;
    if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; }
    if (this._resizeHandler) { window.removeEventListener('resize', this._resizeHandler); this._resizeHandler = null; }
    if (this._moveHandler) { window.removeEventListener('mousemove', this._moveHandler); this._moveHandler = null; }
  }
};

// Auto-start when page loads
document.addEventListener('DOMContentLoaded', function() {
  IntroScene.start();
});
