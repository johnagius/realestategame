/* Quick overlay look-check on the 3D test page (london, victorian dusk, overlay on/off). */
const { launch, OUT2 } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', e => console.log('PAGEERR', String(e)));
  const base = 'http://127.0.0.1:8790/tools/3d-testpages/city.html?city=london&districts=1';
  await page.goto(base, { waitUntil: 'load' }); await sleep(3500);
  await page.screenshot({ path: `${OUT2}/loc-testpage-overlay-victorian.png`, timeout: 90000 });
  await page.evaluate(() => { City3D.setEra('digital', 0); City3D.setNight(0.6); }); await sleep(1500);
  await page.screenshot({ path: `${OUT2}/loc-testpage-overlay-digital.png`, timeout: 90000 });
  await page.evaluate(() => City3D.setDistrictOverlay(false)); await sleep(400);
  await page.screenshot({ path: `${OUT2}/loc-testpage-overlay-off.png`, timeout: 90000 });
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(2); });
