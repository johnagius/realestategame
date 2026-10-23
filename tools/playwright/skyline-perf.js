/* Project Skyline perf — real-GPU attempt vs SwiftShader fallback.
   Measures the London 3D city (city def profile, shipped direction) at
   modern-day, quality high, 1280x800: draw calls, triangles, raw engine
   render() ms over ~350 frames (avg + p95), plus RAF interval and a
   quality-low pass (contact shadows skipped). Writes out/skyline/perf.json. */
const { launch, ARGS } = require('./config');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out', 'skyline');
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}/tools/3d-testpages/city.html`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitServer(url, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); if (r.ok) return true; } catch (e) { /* not up yet */ }
    await sleep(400);
  }
  return false;
}

function p95(arr) { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(a.length * 0.95))]; }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let server = null, ownServer = false;
  if (!(await waitServer(BASE, 1200))) {
    server = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
    ownServer = true;
    if (!(await waitServer(BASE, 20000))) throw new Error('static server did not start on port ' + PORT);
  }
  const result = { gpu: null, high: null, low: null };
  let browser = null;
  try {
    // GPU attempt order: plain headless args, then ANGLE-GL, then SwiftShader fallback
    // (PW_FORCE_SW=1 skips straight to the SwiftShader fallback for comparison runs)
    const attempts = process.env.PW_FORCE_SW === '1' ? [{ label: 'swiftshader', args: ARGS.slice() }] : [
      { label: 'gpu-default', args: [] },
      { label: 'gpu-angle-gl', args: ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist'] },
      { label: 'swiftshader', args: ARGS.slice() },
    ];
    let page = null;
    for (const att of attempts) {
      try {
        browser = await launch({ args: att.args });
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        page = await ctx.newPage();
        await page.goto('about:blank');
        const info = await page.evaluate(() => {
          const cv = document.createElement('canvas');
          const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
          if (!gl) return null;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        });
        console.log(`launch[${att.label}] webgl="${info}"`);
        if (info && !/swiftshader/i.test(info)) { result.gpu = { mode: att.label, renderer: info }; break; }
        if (att.label === 'swiftshader') { result.gpu = { mode: 'swiftshader', renderer: info || 'unknown' }; break; }
        await browser.close(); browser = null;
      } catch (e) {
        console.log(`launch[${att.label}] failed: ${e.message}`);
        if (browser) { await browser.close().catch(() => {}); browser = null; }
      }
    }
    if (!browser || !page) throw new Error('no working WebGL launch config');

    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForFunction(() => window.City3D && (City3D.getStats().calls || 0) > 0, null, { timeout: 30000 });
    await page.evaluate(() => { window.state.era = 'modern'; window.state.night = 0.12; window.render(); });
    await sleep(1800);

    // headless + GPU only produces frames on demand — force BeginFrames via screencast
    const client = await page.context().newCDPSession(page);
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 30, everyNthFrame: 1 });
    client.on('Page.screencastFrame', (ev) => { client.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(() => {}); });

    const sampleRender = (ms) => page.evaluate((dur) => new Promise(res => {
      const R = City3D._renderer, orig = R.render.bind(R);
      const times = [];
      R.render = function (scene, cam) { const t0 = performance.now(); orig(scene, cam); times.push(performance.now() - t0); };
      setTimeout(() => {
        R.render = orig;
        const st = City3D.getStats();
        res({ times: times, calls: st.calls, triangles: st.triangles, frameMsEMA: st.frameMs });
      }, dur);
    }), ms);

    const high = await sampleRender(6000);
    // scene draw stats: read around the composer (the grade pass would report 1 call)
    const sceneStats = await page.evaluate(() => new Promise(res => {
      const c = City3D._composer; City3D._composer = null;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const st = City3D.getStats(); City3D._composer = c;
        res({ calls: st.calls, triangles: st.triangles });
      }));
    }));
    high.calls = sceneStats.calls; high.triangles = sceneStats.triangles;
    if (!high.times.length) throw new Error('no renderer frames captured — RAF stalled');
    const rafAvg = await page.evaluate(() => new Promise(res => {
      let last = performance.now(), n = 0, sum = 0;
      function tick() { const now = performance.now(); sum += now - last; last = now; if (++n >= 120) res(sum / n); else requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    }));
    result.high = {
      calls: high.calls, triangles: high.triangles,
      renderMsAvg: +(high.times.reduce((a, b) => a + b, 0) / high.times.length).toFixed(2),
      renderMsP95: +p95(high.times).toFixed(2),
      samples: high.times.length, frameMsEMA: +Number(high.frameMsEMA || 0).toFixed(2), rafIntervalMs: +rafAvg.toFixed(2),
      contactShadow: await page.evaluate(() => !!City3D._contactShadow),
    };

    await page.evaluate(() => { window.state.quality = 'low'; window.state.era = 'modern'; window.state.night = 0.12; window.render(); });
    await sleep(1500);
    const low = await sampleRender(4000);
    if (!low.times.length) throw new Error('no renderer frames captured (low) — RAF stalled');
    await client.send('Page.stopScreencast').catch(() => {});
    // scene draw stats: read around the composer (the grade pass would report 1 call)
    const lowScene = await page.evaluate(() => new Promise(res => {
      const c = City3D._composer; City3D._composer = null;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const st = City3D.getStats(); City3D._composer = c;
        res({ calls: st.calls, triangles: st.triangles });
      }));
    }));
    low.calls = lowScene.calls; low.triangles = lowScene.triangles;
    result.low = {
      calls: low.calls, triangles: low.triangles,
      renderMsAvg: +(low.times.reduce((a, b) => a + b, 0) / low.times.length).toFixed(2),
      renderMsP95: +p95(low.times).toFixed(2),
      contactShadow: await page.evaluate(() => !!City3D._contactShadow),
    };
    console.log('RESULT ' + JSON.stringify(result, null, 1));
    fs.writeFileSync(path.join(OUT, 'perf.json'), JSON.stringify(result, null, 1) + '\n');
    console.log('perf.json written to', OUT);
  } finally {
    if (browser) await browser.close();
    if (ownServer && server) server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
