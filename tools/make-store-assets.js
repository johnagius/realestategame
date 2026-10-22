/* P6.6 store assets — renders PNG store art from the game's SVG identity.
   Uses Playwright to screenshot small HTML wrappers around assets/icon.svg and
   assets/splash-bg.svg (the same "Victorian ledger → gold skyline" palette).
   Output: store-assets/
     icon-512.png, icon-192.png            (Play listing + maskable base)
     feature-graphic-1024x500.png          (Play feature graphic)
     screenshot-1..4-1290x2796.png         (phone frames, styled like the game UI)
   Run:  node tools/make-store-assets.js
   Fonts/scale are self-contained; no server needed (SVGs are inlined). */
const path = require('path');
const fs = require('fs');
const { launch } = require('./playwright/config');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'store-assets');
const iconSvg = fs.readFileSync(path.join(ROOT, 'assets', 'icon.svg'), 'utf8');
const splashSvg = fs.readFileSync(path.join(ROOT, 'assets', 'splash-bg.svg'), 'utf8');

const page = (body, w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${w}px; height:${h}px; overflow:hidden; }
  body { font-family: Georgia, 'Times New Roman', serif; }
  .bg { position:absolute; inset:0; width:100%; height:100%; }
</style></head><body>${body}</body></html>`;

/* The game's design tokens (css/tokens.css), inlined so the frames match the UI. */
const tokens = `
  :root { --ink:#F3EBDD; --ink-2:#B7A98F; --gold:#B08D3C; --gold-2:#F0D68A; --paper:#1d2733; --paper-2:#27334a; --line:rgba(240,214,138,.28); }
`;

function iconDoc(size) {
  return page(`<div style="width:${size}px;height:${size}px">${iconSvg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>`, size, size);
}

function featureDoc() {
  const w = 1024, h = 500;
  return page(`<style>${tokens}
    .wrap { position:absolute; inset:0; background:#141b26; overflow:hidden; }
    .sky { position:absolute; inset:-40px -80px; opacity:.55; }
    .fade { position:absolute; inset:0; background:linear-gradient(90deg, rgba(16,20,30,.96) 0%, rgba(16,20,30,.82) 44%, rgba(16,20,30,.25) 100%); }
    .art { position:absolute; left:64px; top:96px; width:220px; height:220px; filter:drop-shadow(0 10px 24px rgba(0,0,0,.5)); }
    .k { position:absolute; left:330px; top:150px; color:var(--gold-2); font-size:20px; letter-spacing:6px; text-transform:uppercase; }
    h1 { position:absolute; left:326px; top:176px; color:var(--ink); font-size:76px; letter-spacing:1px; font-weight:700; }
    .sub { position:absolute; left:330px; top:280px; color:var(--ink-2); font-size:26px; font-style:italic; }
    .line { position:absolute; left:330px; top:262px; width:120px; height:3px; background:linear-gradient(90deg,var(--gold-2),transparent); }
  </style>
  <div class="wrap">
    <div class="sky">${splashSvg.replace('<svg ', '<svg class="bg" ')}</div>
    <div class="fade"></div>
    <div class="art">${iconSvg.replace('<svg ', '<svg width="220" height="220" ')}</div>
    <div class="k">A dynasty game</div>
    <h1>Property Empire</h1>
    <div class="line"></div>
    <div class="sub">From one London terrace to a world skyline. 1850 – 2030.</div>
  </div>`, w, h);
}

/* One phone screenshot frame: status bar, HUD strip, content card, bottom nav —
   the composition of the real game UI, with era-appropriate copy. */
function shotDoc(n) {
  const w = 1290, h = 2796;
  const scenes = {
    1: { kicker: 'London · 1850', title: 'The deal board', copy: 'Spot the mispriced listing. Appraise it. Strike.', art: 'board' },
    2: { kicker: 'Your skyline', title: 'The city is the scoreboard', copy: 'Every building you own rises on the map — era by era.', art: 'city' },
    3: { kicker: 'Six rivals', title: 'Outbid the Vanderbilts', copy: 'Offers, counters, auctions. They remember what you did.', art: 'rivals' },
    4: { kicker: '1850 – 2030', title: 'Build a dynasty', copy: 'Heirs, estate tax, crashes, comebacks. Then do it again.', art: 'dynasty' }
  };
  const s = scenes[n];
  const skyline = (gold) => {
    let b = '';
    const widths = [64, 88, 56, 96, 72, 60, 104, 68, 80, 58, 92, 66];
    let x = 24;
    for (let i = 0; i < widths.length; i++) {
      const bw = widths[i], bh = 120 + ((i * 97) % 260);
      b += `<rect x="${x}" y="${560 - bh}" width="${bw}" height="${bh}" rx="6" fill="${gold}" opacity="${0.85 - (i % 3) * 0.18}"/>`;
      x += bw + 18;
    }
    return b;
  };
  const art = {
    board: `<div style="position:absolute;left:70px;top:120px;right:70px;display:flex;flex-direction:column;gap:26px;">
      ${[0, 1, 2].map(i => `<div style="display:flex;align-items:center;gap:28px;background:rgba(20,26,38,.72);border:1px solid var(--line);border-radius:22px;padding:34px 38px;">
        <div style="width:120px;height:120px;border-radius:18px;background:linear-gradient(135deg,#2C3747,#1F2733);display:flex;align-items:center;justify-content:center;"><div style="width:54px;height:54px;background:linear-gradient(180deg,#F6DD94,#C39B3F);clip-path:polygon(0 100%,0 40%,25% 40%,25% 15%,45% 15%,45% 40%,70% 40%,70% 0,100% 0,100% 100%);"></div></div>
        <div style="flex:1;">
          <div style="color:var(--ink);font-size:44px;font-weight:700;">${['14 Mulberry Terrace', 'The Crown & Anchor', 'Baker’s Yard, Camden'][i]}</div>
          <div style="color:var(--ink-2);font-size:32px;font-style:italic;margin-top:6px;">${['£410 · guide £640', '£9,800 · guide £9,100', '£2,150 · guide £2,900'][i]}</div>
        </div>
        ${i === 0 ? '<div style="background:linear-gradient(180deg,#F6DD94,#C39B3F);color:#1F2733;font-size:30px;font-weight:700;border-radius:999px;padding:14px 30px;">Undervalued</div>' : ''}
      </div>`).join('')}</div>`,
    city: `<svg viewBox="0 0 1150 600" style="position:absolute;left:70px;top:150px;width:1150px;">
      <rect x="0" y="520" width="1150" height="14" rx="7" fill="#F6DD94"/>
      ${skyline('url(#goldg)')}
      <defs><linearGradient id="goldg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DD94"/><stop offset="1" stop-color="#C39B3F"/></linearGradient></defs>
      <g fill="#1F2733"><rect x="200" y="392" width="14" height="18"/><rect x="222" y="392" width="14" height="18"/><rect x="200" y="424" width="14" height="18"/><rect x="222" y="424" width="14" height="18"/></g>
    </svg>`,
    rivals: `<div style="position:absolute;left:70px;top:150px;right:70px;display:flex;flex-direction:column;gap:24px;">
      ${['Reginald Wong · Banker', 'Petra Vanderbilt · Magnate', 'Ada Rothschild · Baron'].map((r2, i) => `<div style="display:flex;align-items:center;gap:28px;background:rgba(20,26,38,.72);border:1px solid var(--line);border-radius:22px;padding:30px 38px;">
        <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,${['#2C3747', '#4a2c2c', '#2c3a2c'][i]},#1F2733);border:3px solid var(--gold);display:flex;align-items:center;justify-content:center;color:var(--gold-2);font-size:44px;font-weight:700;">${r2[0]}</div>
        <div style="flex:1;color:var(--ink);font-size:42px;font-weight:700;">${r2}</div>
        <div style="color:var(--gold-2);font-size:36px;">#${i + 2}</div>
      </div>`).join('')}</div>`,
    dynasty: `<div style="position:absolute;left:70px;top:170px;right:70px;">
      <svg viewBox="0 0 1150 360" style="width:1150px;">
        <g stroke="#8a6d3b" stroke-width="10" fill="none" stroke-linecap="round">
          <path d="M575 330 V180 M575 180 Q430 120 300 90 M575 180 Q720 120 850 90 M300 90 V50 M850 90 V50"/>
        </g>
        <g fill="#F0D68A"><circle cx="575" cy="330" r="30"/><circle cx="300" cy="50" r="26"/><circle cx="850" cy="50" r="26"/><circle cx="575" cy="180" r="22"/></g>
      </svg>
      <div style="text-align:center;color:var(--ink-2);font-size:34px;font-style:italic;margin-top:24px;">The Chens · three generations · reputation 62</div>
    </div>`
  };
  return page(`<style>${tokens}
    .wrap { position:absolute; inset:0; background:#141b26; overflow:hidden; }
    .sky { position:absolute; inset:0; opacity:.4; }
    .top { position:absolute; top:0; left:0; right:0; height:120px; display:flex; justify-content:space-between; align-items:center; padding:0 64px; color:var(--ink-2); font-size:32px; }
    .card { position:absolute; left:56px; right:56px; top:1010px; bottom:300px; background:rgba(16,20,30,.78); border:1px solid var(--line); border-radius:36px; }
    .k { position:absolute; left:110px; top:1090px; color:var(--gold-2); font-size:34px; letter-spacing:8px; text-transform:uppercase; }
    h1 { position:absolute; left:106px; top:1140px; color:var(--ink); font-size:88px; font-weight:700; line-height:1.05; }
    .copy { position:absolute; left:110px; top:1400px; color:var(--ink-2); font-size:42px; font-style:italic; width:900px; }
    .nav { position:absolute; left:0; right:0; bottom:0; height:210px; background:rgba(10,13,20,.92); border-top:1px solid var(--line); display:flex; }
    .nav div { flex:1; display:flex; align-items:center; justify-content:center; color:var(--ink-2); font-size:30px; }
    .nav .on { color:var(--gold-2); }
  </style>
  <div class="wrap">
    <div class="sky">${splashSvg.replace('<svg ', '<svg class="bg" ')}</div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(16,20,30,.2) 0%, rgba(16,20,30,.86) 55%, rgba(10,13,20,.95) 100%);"></div>
    <div class="top"><span>9:41</span><span>Property Empire</span><span>&#9632;&#9632;&#9632;</span></div>
    <div class="card"></div>
    <div class="k">${s.kicker}</div>
    <h1>${s.title}</h1>
    <div class="copy">${s.copy}</div>
    ${art[s.art]}
    <div class="nav"><div>Deals</div><div class="on">${['Deals', 'City', 'Rivals', 'Dynasty'][n - 1]}</div><div>Portfolio</div><div>More</div></div>
  </div>`, w, h);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const shots = [
    ['icon-512.png', 512, 512, iconDoc(512)],
    ['icon-192.png', 192, 192, iconDoc(192)],
    ['feature-graphic-1024x500.png', 1024, 500, featureDoc()],
    ['screenshot-1-1290x2796.png', 1290, 2796, shotDoc(1)],
    ['screenshot-2-1290x2796.png', 1290, 2796, shotDoc(2)],
    ['screenshot-3-1290x2796.png', 1290, 2796, shotDoc(3)],
    ['screenshot-4-1290x2796.png', 1290, 2796, shotDoc(4)]
  ];
  for (const [name, w, h, html] of shots) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.setContent(html, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, name) });
    await ctx.close();
    console.log('wrote', name);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
