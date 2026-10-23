/* Second pass: era-gate checks missed by the first run's timeout + re-shoots of the
   cities whose landmark water-base fix landed mid-run. Same API as water-shots.js. */
const { launch } = require('./config');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out', 'water');
const BASE = 'http://127.0.0.1:8790/tools/3d-testpages/city.html';

const SHOTS = [
  ['london-victorian-thames', 'london', 'victorian', 0.12, { x: 0, z: -14, zoom: 1.9 }],
  ['london-victorian-overview', 'london', 'victorian', 0.55],
  ['sydney-victorian-harbour', 'sydney', 'victorian', 0.12, { x: -14, z: -70, zoom: 2 }],
  ['sydney-crisis-harbour', 'sydney', 'crisis', 0.12, { x: -14, z: -70, zoom: 2 }],
  ['sydney-boom-harbour', 'sydney', 'boom', 0.12, { x: -14, z: -70, zoom: 2 }],
  ['dubai-modern-gulf', 'dubai', 'modern', 0.12, { x: -14, z: 84, zoom: 2 }],
  ['dubai-digital-gulf', 'dubai', 'digital', 0.12, { x: -14, z: 84, zoom: 2 }],
  // re-shoots after the y=-0.3 water-base alignment landed mid-run
  ['paris-modern', 'paris', 'modern', 0.12],
  ['paris-seine', 'paris', 'modern', 0.12, { x: -14, z: 14, zoom: 2 }],
  ['paris-seine-top', 'paris', 'modern', 0.12, { x: 0, z: 14, zoom: 2.4 }, '0.3,1,0.3'],
  ['dubai-modern', 'dubai', 'modern', 0.12],
  ['monaco-modern', 'monaco', 'modern', 0.12],
  ['monaco-marina', 'monaco', 'modern', 0.12, { x: 0, z: 56, zoom: 1.9 }],
  ['mumbai-modern', 'mumbai', 'modern', 0.12],
  ['mumbai-gwi', 'mumbai', 'modern', 0.12, { x: -28, z: 84, zoom: 2.2 }],
  ['shanghai-modern', 'shanghai', 'modern', 0.12],
  ['shanghai-river', 'shanghai', 'modern', 0.12, { x: 0, z: 14, zoom: 1.9 }],
  ['shanghai-river-top', 'shanghai', 'modern', 0.12, { x: 0, z: 14, zoom: 2.4 }, '0.3,1,0.3'],
  ['singapore-modern', 'singapore', 'modern', 0.12],
  ['singapore-mrl', 'singapore', 'modern', 0.12, { x: -28, z: 70, zoom: 2.2 }],
  ['toronto-modern', 'toronto', 'modern', 0.12],
  ['toronto-frq', 'toronto', 'modern', 0.12, { x: -28, z: 84, zoom: 2.2 }],
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    let curKey = null;
    for (const [name, city, era, night, view, camdir] of SHOTS) {
      const key = city + '|' + (camdir || '');
      if (key !== curKey) {
        await page.goto(`${BASE}?city=${city}${camdir ? '&camdir=' + camdir : ''}`, { waitUntil: 'load' });
        await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
        curKey = key;
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
