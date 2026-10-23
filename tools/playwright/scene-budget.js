/* Deterministic budget metric: renderer.info is noisy (animated vehicles/clouds
   drift in/out of the ortho frustum between runs, +/-45 calls on modern/digital).
   Count scene-graph drawables instead (visible Mesh/Sprite/Points/Line objects)
   plus total triangles - deterministic for a given build. */
const { launch } = require('./config');
const fs = require('fs');
const path = require('path');
const CITIES = ['london', 'paris', 'new_york', 'amsterdam', 'berlin', 'rome', 'barcelona', 'monaco',
  'sydney', 'hong_kong', 'mumbai', 'toronto', 'shanghai', 'cape_town', 'tokyo', 'singapore',
  'los_angeles', 'sao_paulo', 'miami', 'dubai'];
const ERAS = ['victorian', 'modern', 'digital'];
const OUT = process.argv[2] || 'budget-scene.csv';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await launch();
  const rows = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    for (const city of CITIES) {
      await page.goto(`http://127.0.0.1:8790/tools/3d-testpages/city.html?city=${city}&post=0`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
      for (const era of ERAS) {
        await page.evaluate((e) => { window.state.era = e; window.state.night = 0.12; window.render(); }, era);
        await sleep(400);
        const s = await page.evaluate(() => {
          let drawables = 0, tris = 0;
          City3D._scene.traverse(o => {
            if (!o.visible) return;
            if (!(o.isMesh || o.isSprite || o.isPoints || o.isLine)) return;
            drawables++;
            const g = o.geometry;
            if (!g) return;
            const n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0);
            tris += Math.floor(n / 3);
          });
          return { drawables, tris };
        });
        rows.push(`${city}-${era},${s.drawables},${s.tris}`);
      }
    }
    await ctx.close();
  } finally { await browser.close(); }
  const csv = 'name,drawables,tris\n' + rows.join('\n') + '\n';
  fs.writeFileSync(path.join(__dirname, 'out', 'skyline', OUT), csv);
  console.log(csv);
})().catch(e => { console.error(e); process.exit(1); });
