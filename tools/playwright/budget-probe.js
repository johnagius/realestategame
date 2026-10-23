/* Budget probe: getStats() reads renderer.info AFTER the composer's final fullscreen
   pass, so with post=on it always reports 1 call/1 tri (pre-existing engine quirk).
   Measure the real scene with ?post=0: all 20 cities x 3 eras, day. Budgets ~250 calls
   / ~25k tris per tools/playwright/city-tour.js. */
const { launch } = require('./config');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8790/tools/3d-testpages/city.html';
const CITIES = ['london', 'paris', 'new_york', 'amsterdam', 'berlin', 'rome', 'barcelona', 'monaco',
  'sydney', 'hong_kong', 'mumbai', 'toronto', 'shanghai', 'cape_town', 'tokyo', 'singapore',
  'los_angeles', 'sao_paulo', 'miami', 'dubai'];
const ERAS = ['victorian', 'modern', 'digital'];
const CALL_BUDGET = 250, TRI_BUDGET = 25000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await launch();
  const over = [];
  const rows = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    for (const city of CITIES) {
      await page.goto(`${BASE}?city=${city}&post=0`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
      for (const era of ERAS) {
        await page.evaluate((e) => { window.state.era = e; window.state.night = 0.12; window.render(); }, era);
        await sleep(700);
        const s = await page.evaluate(() => City3D.getStats());
        const flags = [];
        if (s.calls > CALL_BUDGET) flags.push(`calls>${CALL_BUDGET}`);
        if (s.triangles > TRI_BUDGET) flags.push(`tris>${TRI_BUDGET}`);
        rows.push(`${city}-${era},${s.calls},${s.triangles},${(s.frameMs || 0).toFixed(1)},${flags.join(';')}`);
        if (flags.length) over.push(`${city}-${era}: calls=${s.calls} tris=${s.triangles}`);
      }
    }
    await ctx.close();
  } finally { await browser.close(); }
  const csv = 'name,calls,triangles,frameMs,flags\n' + rows.join('\n') + '\n';
  fs.writeFileSync(path.join(__dirname, 'out', 'skyline', 'budget-fixed.csv'), csv);
  console.log(csv);
  if (over.length) { console.log('OVER BUDGET:\n' + over.join('\n')); process.exit(1); }
  console.log('all within budget (post=0)');
})().catch(e => { console.error(e); process.exit(1); });
