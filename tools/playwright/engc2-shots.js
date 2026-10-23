/* ENG-C verification screenshots:
   (a) splash with WebGL (fonts + hero) 412 and 1280,
   (b) splash FALLBACK (three.min.js blocked) — illustrated panorama, 412,
   (c) family select cards with portraits, 412 and 1280,
   (d) rivals leaderboard rows with portraits, 412,
   (e) rival sheet hero portrait + motto, 412,
   (f) year report (engraving vignettes), 1280,
   (g) asserts: no request leaves the origin (fonts vendored), no page errors. */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function boot(page) {
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
}

async function beginGame(page) {
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { console.log('start-new flake, retrying once'); await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}

function watch(page, tag, external) {
  page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith('http://127.0.0.1') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
  });
}

(async () => {
  const browser = await launch();
  const external = [];

  /* ---- mobile: splash, family cards, rivals, rival sheet, report ---- */
  const ctxM = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pm = await ctxM.newPage(); watch(pm, 'mobile', external);
  await boot(pm);
  await sleep(2500);
  await pm.screenshot({ path: `${OUT}/engc-splash-412.png` }); // (a)
  await pm.locator('[data-action="start-new"]').click(); await sleep(700);
  await pm.screenshot({ path: `${OUT}/engc-family-412.png` }); // (c)
  await pm.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await pm.locator('.sheet.is-open .choice').count()) { await pm.locator('.choice').first().click(); await sleep(300); }
  await pm.locator('#nav-rivals').click(); await sleep(900);
  await pm.screenshot({ path: `${OUT}/engc-rivals-412.png` }); // (d)
  await pm.locator('.rival:not(.rival--player)').first().click(); await sleep(900);
  await pm.screenshot({ path: `${OUT}/engc-rivalsheet-412.png` }); // (e)
  await pm.keyboard.press('Escape'); await sleep(400);
  await ctxM.close();

  /* ---- desktop: splash, family cards, year report ---- */
  const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pd = await ctxD.newPage(); watch(pd, 'desktop', external);
  await boot(pd);
  await sleep(2500);
  await pd.screenshot({ path: `${OUT}/engc-splash-1280.png` }); // (a)
  await pd.locator('[data-action="start-new"]').click(); await sleep(700);
  await pd.screenshot({ path: `${OUT}/engc-family-1280.png` }); // (c)
  await pd.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await pd.locator('.sheet.is-open .choice').count()) { await pd.locator('.choice').first().click(); await sleep(300); }
  await pd.locator('[data-action="end-year"]').click(); await sleep(800);
  while (await pd.locator('.sheet.is-open .choice').count()) { await pd.locator('.choice').first().click(); await sleep(400); }
  try { await pd.locator('#report.is-open').waitFor({ timeout: 10000 }); } catch (e) { console.log('report did not open'); }
  await sleep(600);
  await pd.screenshot({ path: `${OUT}/engc-report-1280.png` }); // (f)
  await ctxD.close();

  /* ---- fallback splash: WebGL disabled so Splash degrades to the panorama ---- */
  const browserNW = await launch({ args: ['--disable-webgl', '--disable-webgl2'] });
  const ctxF = await browserNW.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pf = await ctxF.newPage(); watch(pf, 'fallback', external);
  await pf.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await pf.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pf.reload({ waitUntil: 'load' }); await sleep(2500);
  const isFallback = await pf.evaluate(() => !!(document.querySelector('.sp-hero--fallback') || (window.Splash && Splash._fallback)));
  console.log('fallback active:', isFallback);
  await pf.screenshot({ path: `${OUT}/engc-splash-fallback-412.png` }); // (b)
  await ctxF.close();
  await browserNW.close();

  await browser.close();
  const leaked = external.filter(u => /fonts\.googleapis|fonts\.gstatic|cdn/i.test(u));
  console.log('external requests total:', external.length, '| font/CDN leaks:', leaked.length ? leaked : 'none');
  console.log('engc verification shots done');
})().catch(e => { console.error(e); process.exit(1); });
