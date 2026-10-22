/* 3D atmosphere verification: fog in 1850 London, rain in a recession, the Shard appearing in the Digital era. */
const { launch, OUT } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  await page.locator('[data-action="start-new"]').click(); await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  await page.locator('[data-action="nav"][data-screen="city"]').click(); await sleep(3500);
  await page.screenshot({ path: `${OUT}/p3d-victorian-fog-412.png` });
  // recession rain
  await page.evaluate(() => { PE.S().cycle.phase = 'recession'; PEUI.refresh(); });
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/p3d-recession-rain-412.png` });
  // digital era: Shard appears, night glow
  await page.evaluate(() => { PE.S().cycle.phase = 'growth'; PE.S().year = 2010; PEUI.refresh(); });
  await sleep(3000);
  await page.screenshot({ path: `${OUT}/p3d-digital-shard-412.png` });
  // desktop victorian for shape check
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, storageState: await ctx.storageState() });
  const p2 = await ctx2.newPage();
  await p2.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1800);
  await p2.locator('[data-action="start-continue"]').click(); await sleep(600);
  while (await p2.locator('.sheet.is-open .choice').count()) { await p2.locator('.choice').first().click(); await sleep(300); }
  await p2.locator('[data-action="nav"][data-screen="city"]').click(); await sleep(3500);
  await p2.screenshot({ path: `${OUT}/p3d-digital-1280.png` });
  await browser.close();
  console.log('p3d shots done');
})().catch(e => { console.error(e); process.exit(1); });
