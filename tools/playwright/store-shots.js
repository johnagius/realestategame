/* P6.6 store screenshots — REAL game captures for the store listings.
   Phone 1290x2796 (430x932 @3x) and tablet 2048x2732 (1024x1366 @2x).
   Eight screens per form factor: splash, deal board, listing sheet, city 3D,
   portfolio, year report, rivals, dynasty. Output: store-assets/.
   Run with the local server on :8790. */
const path = require('path');
const { launch, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const OUT = path.join(__dirname, '..', '..', 'store-assets');

async function boot(page) {
  await page.goto(URL + (URL.indexOf('?') >= 0 ? '&' : '?') + 'seed=7', { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
}
async function beginGame(page) {
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(800);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}
async function stage(page) {
  // a few years in with a small portfolio, so every screen has real content
  await page.evaluate(() => {
    const s = PE.S(); s.cash += 30000;
    for (let i = 0; i < 3; i++) {
      const l = PE.Market.listingArray(null).filter(x => x.type !== 'land').sort((a, b) => a.askingPrice - b.askingPrice)[0];
      if (l) PE.Market.buy(l, l.askingPrice, null, 'player');
    }
    const p = PE.State.playerProps()[0];
    if (p) { PE.Property.renovate(p.id, 'patch'); PE.Property.setFlagship(p.id, p.name); }
    PEUI.save(); PEUI.refresh();
  });
  await sleep(400);
}
async function capture(page, tag) {
  const shot = (n) => page.screenshot({ path: `${OUT}/real-${n}-${tag}.png` });
  // 1 splash was captured pre-game by caller
  await page.evaluate(() => PEUI.render('deals')); await sleep(900); await shot(2);                       // deal board
  await page.evaluate(() => { const l = PE.Market.listingArray(null).filter(x => x.type !== 'land')[0]; PEUI.openListing(l.id); }); await sleep(900); await shot(3); // listing sheet
  await page.keyboard.press('Escape'); await sleep(400);
  await page.evaluate(() => PEUI.render('city')); await sleep(2500); await shot(4);                       // city 3D
  await page.evaluate(() => PEUI.render('portfolio')); await sleep(900); await shot(5);                   // portfolio
  await page.evaluate(() => PEUI.render('rivals')); await sleep(900); await shot(7);                      // rivals
  await page.evaluate(() => PEUI.render('dynasty')); await sleep(900); await shot(8);                     // dynasty
  // 6 year report: end the year through the real button
  await page.evaluate(() => PEUI.render('deals')); await sleep(400);
  await page.locator('[data-action="end-year"], button:has-text("End year")').first().click(); await sleep(2500);
  await shot(6);
}

(async () => {
  const browser = await launch();
  const forms = [
    ['phone', { width: 430, height: 932 }, 3],
    ['tablet', { width: 1024, height: 1366 }, 2],
  ];
  for (const [tag, vp, dsf] of forms) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: tag === 'phone', hasTouch: tag === 'phone' });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
    await boot(page);
    await sleep(2500); // splash settles (3D hero)
    await page.screenshot({ path: `${OUT}/real-1-${tag}.png` });
    await beginGame(page); await stage(page);
    await sleep(4000); // let the start toast and guide animations settle before capturing
    await capture(page, tag);
    await ctx.close();
    console.log(tag, 'done');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
