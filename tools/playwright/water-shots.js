/* Water-defect verification shots: every city with water, plus river/harbour/bridge
   close-ups and era-gate checks. Grid math: T=28, GW=7, GH=8 -> cell (r,c) at
   x=-84+28c, z=-98+28r. Uses window.state/window.render + City3D.setView.
   Output: tools/playwright/out/water/<name>.png */
const { launch } = require('./config');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out', 'water');
const BASE = 'http://127.0.0.1:8790/tools/3d-testpages/city.html';

// [name, city, era, night, view{x,z,zoom}, camdir]
const SHOTS = [
  // ── overviews, modern day ──
  ['london-modern', 'london', 'modern', 0.12],
  ['paris-modern', 'paris', 'modern', 0.12],
  ['amsterdam-modern', 'amsterdam', 'modern', 0.12],
  ['shanghai-modern', 'shanghai', 'modern', 0.12],
  ['new_york-modern', 'new_york', 'modern', 0.12],
  ['sydney-modern', 'sydney', 'modern', 0.12],
  ['dubai-modern', 'dubai', 'modern', 0.12],
  ['mumbai-modern', 'mumbai', 'modern', 0.12],
  ['monaco-modern', 'monaco', 'modern', 0.12],
  ['singapore-modern', 'singapore', 'modern', 0.12],
  ['toronto-modern', 'toronto', 'modern', 0.12],
  ['barcelona-modern', 'barcelona', 'modern', 0.12],
  ['los_angeles-modern', 'los_angeles', 'modern', 0.12],
  ['miami-modern', 'miami', 'modern', 0.12],
  ['hong_kong-modern', 'hong_kong', 'modern', 0.12],
  ['tokyo-modern', 'tokyo', 'modern', 0.12],
  ['cape_town-modern', 'cape_town', 'modern', 0.12],
  // ── river / bridge close-ups ──
  ['london-thames-gilded', 'london', 'gilded', 0.12, { x: 0, z: -14, zoom: 1.9 }],
  ['london-tbr-close', 'london', 'gilded', 0.12, { x: 0, z: -14, zoom: 3 }],
  ['london-thames-top', 'london', 'gilded', 0.12, { x: 0, z: -14, zoom: 2.2 }, '0.3,1,0.3'],
  ['paris-seine', 'paris', 'modern', 0.12, { x: -14, z: 14, zoom: 2 }],
  ['paris-seine-top', 'paris', 'modern', 0.12, { x: 0, z: 14, zoom: 2.4 }, '0.3,1,0.3'],
  ['amsterdam-canal', 'amsterdam', 'modern', 0.12, { x: 0, z: -42, zoom: 1.9 }],
  ['amsterdam-cnl-wml', 'amsterdam', 'modern', 0.12, { x: 56, z: -42, zoom: 2.8 }],
  ['amsterdam-canal-top', 'amsterdam', 'modern', 0.12, { x: 0, z: -42, zoom: 2.4 }, '0.3,1,0.3'],
  ['shanghai-river', 'shanghai', 'modern', 0.12, { x: 0, z: 14, zoom: 1.9 }],
  ['shanghai-river-top', 'shanghai', 'modern', 0.12, { x: 0, z: 14, zoom: 2.4 }, '0.3,1,0.3'],
  ['sydney-harbour', 'sydney', 'modern', 0.12, { x: -14, z: -70, zoom: 2 }],
  ['sydney-hbr-close', 'sydney', 'modern', 0.12, { x: 0, z: -56, zoom: 2.6 }],
  ['sydney-harbour-top', 'sydney', 'modern', 0.12, { x: 0, z: -70, zoom: 2.4 }, '0.3,1,0.3'],
  ['new_york-harbour', 'new_york', 'modern', 0.12, { x: -28, z: 84, zoom: 2.2 }],
  ['monaco-marina', 'monaco', 'modern', 0.12, { x: 0, z: 56, zoom: 1.9 }],
  ['mumbai-gwi', 'mumbai', 'modern', 0.12, { x: -28, z: 84, zoom: 2.2 }],
  ['singapore-mrl', 'singapore', 'modern', 0.12, { x: -28, z: 70, zoom: 2.2 }],
  ['toronto-frq', 'toronto', 'modern', 0.12, { x: -28, z: 84, zoom: 2.2 }],
  ['barcelona-waterfront', 'barcelona', 'modern', 0.12, { x: 0, z: 84, zoom: 1.7 }],
  ['los_angeles-waterfront', 'los_angeles', 'modern', 0.12, { x: 0, z: 84, zoom: 1.7 }],
  ['miami-waterfront', 'miami', 'modern', 0.12, { x: 0, z: 84, zoom: 1.7 }],
  ['hong_kong-waterfront', 'hong_kong', 'modern', 0.12, { x: 0, z: 84, zoom: 1.7 }],
  ['tokyo-waterfront', 'tokyo', 'modern', 0.12, { x: 0, z: 84, zoom: 1.7 }],
  ['cape_town-waterfront', 'cape_town', 'modern', 0.12, { x: 0, z: 84, zoom: 1.7 }],
  // ── era-gate checks ──
  ['london-victorian-thames', 'london', 'victorian', 0.12, { x: 0, z: -14, zoom: 1.9 }],
  ['london-victorian-overview', 'london', 'victorian', 0.55],
  ['sydney-victorian-harbour', 'sydney', 'victorian', 0.12, { x: -14, z: -70, zoom: 2 }],
  ['sydney-crisis-harbour', 'sydney', 'crisis', 0.12, { x: -14, z: -70, zoom: 2 }],
  ['sydney-boom-harbour', 'sydney', 'boom', 0.12, { x: -14, z: -70, zoom: 2 }],
  ['dubai-modern-gulf', 'dubai', 'modern', 0.12, { x: -14, z: 84, zoom: 2 }],
  ['dubai-digital-gulf', 'dubai', 'digital', 0.12, { x: -14, z: 84, zoom: 2 }],
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    let curCity = null;
    for (const [name, city, era, night, view, camdir] of SHOTS) {
      if (city !== curCity) {
        await page.goto(`${BASE}?city=${city}${camdir ? '&camdir=' + camdir : ''}`, { waitUntil: 'load' });
        await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
        curCity = city;
      } else if (camdir) {
        await page.goto(`${BASE}?city=${city}&camdir=${camdir}`, { waitUntil: 'load' });
        await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
      }
      await page.evaluate(([e, n, v]) => {
        window.state.era = e; window.state.night = n; window.render();
        if (v) City3D.setView({ x: v.x, z: v.z, zoom: v.zoom, immediate: true });
      }, [era, night, view || null]);
      await sleep(900);
      await page.screenshot({ path: path.join(OUT, name + '.png') });
      console.log('shot', name);
    }
    await ctx.close();
  } finally {
    await browser.close();
  }
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
