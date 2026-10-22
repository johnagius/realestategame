/* P6.4 performance probe — cold load, city frame time, JS heap over a 60-year run.
   Budgets (docs/PERF.md): cold start < 2 s (desktop profile), city frameMs < 33, heap < 2x.
   Note: this container has no GPU — Chromium renders the 3D city through SwiftShader,
   so frameMs here is a software-rendering ceiling, not a device number.
   Usage: server on port 8790, then  node tools/playwright/perf.js */
const { launch, URL, OUT, fs, path } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await launch({ args: require('./config').ARGS.concat(['--js-flags=--expose-gc']) });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  /* ---- (a) cold load ---- */
  const nav = Date.now();
  await page.goto(URL, { waitUntil: 'load' });
  const loadMs = Date.now() - nav;
  const paint = await page.evaluate(() => {
    const p = performance.getEntriesByType('paint');
    const fp = p.filter(e => e.name === 'first-paint')[0];
    return fp ? Math.round(fp.startTime) : null;
  });

  /* ---- boot into a fresh seed-42 game ---- */
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' });
  await sleep(800);
  await page.locator('[data-action="start-new"]').click(); await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(200); }

  /* ---- (b) city frameMs sampled over 15 s ---- */
  await page.locator('[data-action="nav"][data-screen="city"]').click();
  await sleep(2000); /* warm-up: shaders, first frames */
  const stats0 = await page.evaluate(() => (window.City3D && City3D.getStats) ? City3D.getStats() : null);
  const samples = [];
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    const s = await page.evaluate(() => (window.City3D && City3D.getStats) ? City3D.getStats() : null);
    if (s && typeof s.frameMs === 'number') samples.push(s.frameMs);
  }
  samples.sort((a, b) => a - b);
  const mean = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null;
  const p95 = samples.length ? samples[Math.floor(samples.length * 0.95)] : null;

  /* ---- (c) heap growth over a 60-year scripted run ---- */
  const gc = () => page.evaluate(() => { try { if (window.gc) window.gc(); } catch (e) {} });
  await page.locator('[data-action="nav"][data-screen="deals"]').click().catch(() => {});
  await gc(); await gc();
  const heap0 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : null);
  const played = await page.evaluate(async () => {
    const PE = window.PE; if (!PE || !PE.S()) return -1;
    const resolveAll = () => { for (let k = 0; k < 10; k++) { const r = PE.Events.pending(); if (!r.ok || !r.event) break; PE.Events.resolve(r.event.uid, 0); } };
    let n = 0;
    for (let y = 0; y < 60; y++) {
      const s = PE.S(); if (!s || s.status !== 'playing') break;
      try {
        const list = PE.Market.listings(null);
        if (list.ok && list.listings.length) {
          const l = list.listings[0];
          const q = PE.Finance.mortgageQuote(l.id, 0.6, 'io');
          if (q.ok && q.cashNeeded < s.cash * 0.8) PE.Market.makeOffer(l.id, l.askingPrice, { ltv: 0.6, type: 'io' });
        }
      } catch (e) {}
      resolveAll();
      let r = PE.Game.endYear();
      if (!r.ok) { resolveAll(); r = PE.Game.endYear(); }
      if (r.ok) n++;
    }
    return n;
  });
  await gc(); await gc();
  const heap1 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : null);
  const finalYear = await page.evaluate(() => { const s = PE.S(); return s ? s.year : null; });

  const result = {
    when: new Date().toISOString(),
    url: URL,
    viewport: '1280x800',
    gpu: 'SwiftShader (software) — no GPU in this container',
    coldLoad: { loadEventMs: loadMs, firstPaintMs: paint },
    city: { stats: stats0, frameMsSamples: samples.length, frameMsMean: mean && +mean.toFixed(1), frameMsP95: p95, budgetMs: 33 },
    heap: { beforeBytes: heap0, after60YearsBytes: heap1, growth: heap0 && heap1 ? +(heap1 / heap0).toFixed(2) : null, yearsPlayed: played, finalYear, budgetGrowth: 2 },
    pageErrors: errors.length
  };
  fs.writeFileSync(path.join(OUT, 'perf.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (errors.length) { console.log('PAGE ERRORS:', errors.slice(0, 5)); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
