/* P3.5 verification: end card shows the absorbing rival; comeback goal on the deals strip. */
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
  await page.evaluate(() => {
    const s = PE.S();
    PE.Market.listings('london').listings.slice(0, 3).forEach((l) => { s.cash += l.askingPrice; PE.Market.buy(s.listings[l.id], Math.round(l.askingPrice * 0.9), null, 'player'); });
    s.cash = -1e6; s.stats.peakNetWorth = Math.max(5000, s.stats.peakNetWorth);
  });
  await page.locator('#hud-end').click(); await sleep(600);
  let guard = 0;
  while (guard++ < 8) {
    if (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(350); continue; }
    break;
  }
  await sleep(400);
  await page.screenshot({ path: `${OUT}/p35-report-412.png` });
  await page.locator('#report [data-action="report-next"]').click(); await sleep(500);
  await page.screenshot({ path: `${OUT}/p35-endcard-412.png` });
  // continue as heir → comeback goal on the deals strip
  await page.locator('[data-action="end-heir"]').click(); await sleep(700);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  await page.locator('[data-action="nav"][data-screen="deals"]').click(); await sleep(400);
  await page.screenshot({ path: `${OUT}/p35-comeback-412.png` });
  await browser.close();
  console.log('p35 shots done');
})().catch(e => { console.error(e); process.exit(1); });
