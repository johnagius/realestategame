/* Era colour-script verification: boots a real game, then cycles [data-era]
   through all six eras, screenshotting the deals screen (paper, cards, HUD,
   chips) at 412x915 and 1280x800. */
const { launch, OUT } = require('./config');
const fs = require('fs');
const ERAS = ['victorian', 'gilded', 'crisis', 'boom', 'modern', 'digital'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await launch();
  for (const vp of [{ w: 412, h: 915, tag: '412' }, { w: 1280, h: 800, tag: '1280' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.tag === '412' ? 2 : 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    await page.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1500);
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.reload({ waitUntil: 'load' }); await sleep(1500);
    await page.locator('[data-action="start-new"]').click().catch(() => {}); await sleep(400);
    await page.locator('[data-action="start-begin"]').click().catch(() => {}); await sleep(600);
    while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
    // real hook check: engine-driven era should be victorian in 1850
    const live = await page.evaluate(() => document.documentElement.getAttribute('data-era'));
    console.log('live data-era at 1850:', live);
    for (const era of ERAS) {
      await page.evaluate((e) => document.documentElement.setAttribute('data-era', e), era);
      await sleep(650); // let the cross-fade land
      await page.screenshot({ path: `${OUT}/era-${era}-${vp.tag}.png` });
    }
    await ctx.close();
  }
  await browser.close();
  console.log('era shots written to', OUT);
})().catch(e => { console.error(e); process.exit(1); });
