/* Project Skyline step 2 — London direction variants A/B/C screenshot matrix.
   Serves the repo root on 8791 (reuses an existing server if the port answers),
   renders tools/3d-testpages/city.html?dir=X for dir x era x time, writes
   tools/playwright/out/skyline/dirs/<dir>-<era>-<day|dusk>.png plus two 412x915
   samples, and appends draw stats to out/skyline/stats.txt with a budget guard. */
const { launch } = require('./config');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out', 'skyline');
const DIRS_OUT = path.join(OUT, 'dirs');
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}/tools/3d-testpages/city.html`;
const DIRS = ['a', 'b', 'c'];
const ERAS = ['victorian', 'modern', 'digital'];
const TIMES = [{ n: 0.12, tag: 'day' }, { n: 0.72, tag: 'dusk' }];
const MOBILE = [
  { dir: 'c', era: 'victorian', n: 0.72, tag: 'dusk' },
  { dir: 'b', era: 'modern', n: 0.12, tag: 'day' },
];
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
  fs.mkdirSync(DIRS_OUT, { recursive: true });
  let server = null, ownServer = false;
  if (!(await waitServer(BASE, 1200))) {
    server = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
    ownServer = true;
    if (!(await waitServer(BASE, 20000))) throw new Error('static server did not start on port ' + PORT);
  }
  const stats = [];
  const browser = await launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    for (const dir of DIRS) {
      await page.goto(`${BASE}?dir=${dir}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
      for (const era of ERAS) {
        for (const t of TIMES) {
          // full re-render per combo: lamp/tree kinds bake into terrain at build time
          await page.evaluate(([e, n]) => { window.state.era = e; window.state.night = n; window.render(); }, [era, t.n]);
          await sleep(1600); // fades + fog lerp settle
          await page.evaluate(() => new Promise(r => { let k = 0; (function tick() { if (++k >= 5) r(); else requestAnimationFrame(tick); })(); }));
          const name = `${dir}-${era}-${t.tag}`;
          await page.screenshot({ path: path.join(DIRS_OUT, name + '.png') });
          const s = await page.evaluate(() => City3D.getStats());
          stats.push({ name, calls: s.calls, triangles: s.triangles, frameMs: +(s.frameMs || 0).toFixed(1), quality: s.quality });
          console.log(name, `calls=${s.calls} tris=${s.triangles} frameMs=${(s.frameMs || 0).toFixed(1)}`);
        }
      }
      const hasShadow = await page.evaluate(() => !!City3D._contactShadow);
      console.log(`dir=${dir} quality=high contactShadow=${hasShadow} (expect true)`);
    }
    // low quality: contact shadows skipped, lamps/trees still present
    await page.evaluate(() => { window.state.quality = 'low'; window.state.era = 'modern'; window.state.night = 0.12; window.render(); });
    await sleep(1500);
    const lowShadow = await page.evaluate(() => !!City3D._contactShadow);
    const low = await page.evaluate(() => City3D.getStats());
    console.log(`quality=low contactShadow=${lowShadow} (expect false) calls=${low.calls} tris=${low.triangles}`);
    await page.screenshot({ path: path.join(DIRS_OUT, '_check-low.png') });
    await ctx.close();

    const mctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
    const mpage = await mctx.newPage();
    mpage.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    for (const m of MOBILE) {
      await mpage.goto(`${BASE}?dir=${m.dir}`, { waitUntil: 'load' });
      await mpage.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
      await mpage.evaluate(([e, n]) => { window.state.era = e; window.state.night = n; window.render(); }, [m.era, m.n]);
      await sleep(1600);
      const name = `${m.dir}-${m.era}-${m.tag}-412`;
      await mpage.screenshot({ path: path.join(DIRS_OUT, name + '.png') });
      const s = await mpage.evaluate(() => City3D.getStats());
      stats.push({ name, calls: s.calls, triangles: s.triangles, frameMs: +(s.frameMs || 0).toFixed(1), quality: s.quality });
      console.log(name, `calls=${s.calls} tris=${s.triangles} frameMs=${(s.frameMs || 0).toFixed(1)}`);
    }
    await mctx.close();
  } finally {
    await browser.close();
    if (ownServer && server) server.kill();
  }
  let worstCalls = 0, worstTris = 0, worstMs = 0;
  const lines = stats.map(s => {
    worstCalls = Math.max(worstCalls, s.calls); worstTris = Math.max(worstTris, s.triangles); worstMs = Math.max(worstMs, s.frameMs);
    return `${s.name} calls=${s.calls} triangles=${s.triangles} frameMs=${s.frameMs} quality=${s.quality}`;
  });
  const verdict = (worstCalls <= 280 && worstTris <= 26000) ? 'WITHIN' : 'EXCEEDED';
  lines.push(`worst calls=${worstCalls} (budget 280) triangles=${worstTris} (budget 26000) frameMs=${worstMs} -> ${verdict}`);
  fs.writeFileSync(path.join(OUT, 'stats.txt'), lines.join('\n') + '\n');
  console.log('stats written to', path.join(OUT, 'stats.txt'));
})().catch(e => { console.error(e); process.exit(1); });
