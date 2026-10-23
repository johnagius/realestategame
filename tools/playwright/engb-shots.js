/* ENG-B6/B7/B8 UI verification: property sheet (tenant line, flagship section),
   flagship chip on portfolio rows, dynasty children hint, year report with a
   tenant departure line — at 412×915 and 1280×800. */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function boot(page) {
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1200);
}
async function beginGame(page) {
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}
async function stage(page) {
  // buy the cheapest listing, then operate a year so a named tenant arrives
  await page.evaluate(() => {
    const s = PE.S(); s.cash += 5000;
    const l = PE.Market.listingArray(null).slice().sort((a, b) => a.askingPrice - b.askingPrice)[0];
    PE.Market.buy(l, l.askingPrice, null, 'player');
    const p = PE.State.playerProps()[0];
    PE.Property.operate(p, { mgmt: 'self' }); // a tenant moves in
    PE.Property.setFlagship(p.id, 'The Verification Arms');
    PEUI.save(); PEUI.refresh();
  });
  await sleep(400);
}
async function shots(tag, page) {
  // property sheet: tenant line + flagship state
  await page.evaluate(() => PEUI.render('portfolio')); await sleep(600);
  await page.screenshot({ path: `${OUT}/engb-${tag}-portfolio.png` });
  await page.evaluate(() => PEUI.openProperty(PE.State.playerProps()[0].id)); await sleep(600);
  await page.evaluate(() => { const el = document.querySelector('.sheet.is-open .sheet__body'); if (el) el.scrollTop = 0; });
  await page.screenshot({ path: `${OUT}/engb-${tag}-property.png` });
  // dynasty screen: children hint
  await page.keyboard.press('Escape'); await sleep(300);
  await page.evaluate(() => PEUI.render('dynasty')); await sleep(600);
  await page.screenshot({ path: `${OUT}/engb-${tag}-dynasty.png` });
}

(async () => {
  const browser = await launch();
  for (const [tag, vp] of [['m', { width: 412, height: 915 }], ['d', { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: tag === 'm', hasTouch: tag === 'm' });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
    await boot(page); await beginGame(page); await stage(page); await shots(tag, page);
    await ctx.close();
    console.log(tag, 'done');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
