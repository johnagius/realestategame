/* Project Skyline city tour: screenshots every city x era x time through the
   real renderer (tools/3d-testpages/city.html?city=<id>, city profile, quality
   high). Writes tools/playwright/out/skyline/tour/<city>-<era>-<time>.png,
   tour-stats.csv (calls/triangles/frameMs per shot) and flags budget overflows
   (~<=250 calls / ~<=25k tris). */
const { launch } = require('./config');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out', 'skyline');
const TOUR = path.join(OUT, 'tour');
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}/tools/3d-testpages/city.html`;
const CITIES = ['london', 'paris', 'new_york', 'amsterdam', 'berlin', 'rome', 'barcelona', 'monaco',
  'sydney', 'hong_kong', 'mumbai', 'toronto', 'shanghai', 'cape_town', 'tokyo', 'singapore',
  'los_angeles', 'sao_paulo', 'miami', 'dubai'];
const ERAS = ['victorian', 'modern', 'digital'];
const TIMES = [{ n: 0.12, tag: 'day' }, { n: 0.72, tag: 'dusk' }];
const MOBILE = [
  { city: 'tokyo', era: 'digital', n: 0.72, tag: 'dusk' },
  { city: 'miami', era: 'boom', n: 0.72, tag: 'dusk' },
  { city: 'dubai', era: 'modern', n: 0.12, tag: 'day' },
  { city: 'paris', era: 'victorian', n: 0.72, tag: 'dusk' },
  { city: 'sydney', era: 'modern', n: 0.12, tag: 'day' },
  { city: 'cape_town', era: 'digital', n: 0.72, tag: 'dusk' },
];
const CALL_BUDGET = 250, TRI_BUDGET = 25000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitServer(url, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); if (r.ok) return true; } catch (e) { /* not up yet */ }
    await sleep(400);
  }
  return false;
}

(async () => {
  fs.mkdirSync(TOUR, { recursive: true });
  let server = null, ownServer = false;
  if (!(await waitServer(BASE, 1200))) {
    server = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
    ownServer = true;
    if (!(await waitServer(BASE, 20000))) throw new Error('static server did not start on port ' + PORT);
  }
  const csvPath = path.join(OUT, 'tour-stats.csv');
  if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, 'name,calls,triangles,frameMs,quality,flags\n');
  const over = [];
  const browser = await launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    let done = 0;
    for (const city of CITIES) {
      await page.goto(`${BASE}?city=${city}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
      for (const era of ERAS) {
        for (const t of TIMES) {
          const name = `${city}-${era}-${t.tag}`;
          if (fs.existsSync(path.join(TOUR, name + '.png'))) { done++; continue; } // resume
          await page.evaluate(([e, n]) => { window.state.era = e; window.state.night = n; window.render(); }, [era, t.n]);
          await sleep(900);
          await page.screenshot({ path: path.join(TOUR, name + '.png') });
          const s = await page.evaluate(() => City3D.getStats());
          const flags = [];
          if (s.calls > CALL_BUDGET) flags.push(`calls>${CALL_BUDGET}`);
          if (s.triangles > TRI_BUDGET) flags.push(`tris>${TRI_BUDGET}`);
          if (flags.length) over.push(`${name}: calls=${s.calls} tris=${s.triangles}`);
          fs.appendFileSync(csvPath, `${name},${s.calls},${s.triangles},${(s.frameMs || 0).toFixed(1)},${s.quality},${flags.join(';')}\n`);
          if (++done % 20 === 0) console.log(`${done}/120 shots...`);
        }
      }
    }
    await ctx.close();

    const mctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
    const mpage = await mctx.newPage();
    mpage.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    for (const m of MOBILE) {
      await mpage.goto(`${BASE}?city=${m.city}`, { waitUntil: 'load' });
      await mpage.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
      await mpage.evaluate(([e, n]) => { window.state.era = e; window.state.night = n; window.render(); }, [m.era, m.n]);
      await sleep(1300);
      await mpage.screenshot({ path: path.join(TOUR, `${m.city}-${m.era}-${m.tag}-412.png`) });
      console.log(`mobile ${m.city}-${m.era}-${m.tag}`);
    }
    await mctx.close();
  } finally {
    await browser.close();
    if (ownServer && server) server.kill();
  }
  console.log('stats written to', csvPath);
  if (over.length) console.log('OVER BUDGET (this run):\n' + over.join('\n'));
  else console.log('this run within budget');
})().catch(e => { console.error(e); process.exit(1); });
