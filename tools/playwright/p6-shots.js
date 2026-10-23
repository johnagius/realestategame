/* P6 UI verification: reroll button on the deal board, ad-backed extra insider
   tip in the appraisal panel, renovation speed-up on the property sheet, the
   save-slot manager in settings, and the rewarded-ad flow end-to-end (web
   fallback overlay -> claim -> board actually re-rolled). 412x915 + 1280x800. */
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
  await page.evaluate(() => {
    const s = PE.S(); s.cash += 20000;
    // own a property with a multi-year renovation running (for the speed-up row)
    const l = PE.Market.listingArray(null).slice().sort((a, b) => a.askingPrice - b.askingPrice)[0];
    PE.Market.buy(l, l.askingPrice, null, 'player');
    const p = PE.State.playerProps()[0];
    PE.Property.renovate(p.id, 'rebuild');
    // spend the free insider tip so the ad-backed one shows on a listing sheet
    s.flags.insiderUsedYear = s.year;
    // occupy slot 2 with a copy so the slot manager shows two saves
    PE.Storage.save(s, 2);
    PEUI.save(); PEUI.refresh();
  });
  await sleep(400);
}
async function shots(tag, page) {
  // 1. deal board with reroll tool
  await page.evaluate(() => PEUI.render('deals')); await sleep(700);
  await page.screenshot({ path: `${OUT}/p6-${tag}-deals.png` });
  // 2. listing sheet: ad-backed insider tip visible
  await page.evaluate(() => { const l = PE.Market.listingArray(null)[0]; PEUI.openListing(l.id); }); await sleep(700);
  await page.evaluate(() => { const el = document.querySelector('.sheet.is-open .sheet__body'); if (el) el.scrollTop = el.scrollHeight; });
  await sleep(200);
  await page.screenshot({ path: `${OUT}/p6-${tag}-tip.png` });
  await page.keyboard.press('Escape'); await sleep(300);
  // 3. property sheet: speed-up row under the renovation note
  await page.evaluate(() => PEUI.openProperty(PE.State.playerProps()[0].id)); await sleep(700);
  await page.evaluate(() => { const el = document.querySelector('.sheet.is-open .sheet__body'); if (el) el.scrollTop = 0; });
  await page.screenshot({ path: `${OUT}/p6-${tag}-speedup.png` });
  await page.keyboard.press('Escape'); await sleep(300);
  // 4. settings: save-slot manager (2 occupied slots)
  await page.evaluate(() => PEUI.openSettings()); await sleep(700);
  await page.evaluate(() => { const el = document.querySelector('.sheet.is-open .sheet__body'); if (el) el.scrollTop = el.scrollHeight; });
  await sleep(200);
  await page.screenshot({ path: `${OUT}/p6-${tag}-slots.png` });
  await page.keyboard.press('Escape'); await sleep(300);
  // 5. rewarded flow end-to-end: reroll via the web-fallback ad
  const before = await page.evaluate(() => PE.Market.listingArray(null).map(l => l.id).join(','));
  await page.evaluate(() => PEUI.render('deals')); await sleep(500);
  await page.locator('[data-action="reroll-board"]').click(); await sleep(800);
  await page.screenshot({ path: `${OUT}/p6-${tag}-ad.png` });
  await sleep(4600); // REWARDED_SECONDS = 4
  await page.locator('#ad-claim-btn').click(); await sleep(800);
  const after = await page.evaluate(() => PE.Market.listingArray(null).map(l => l.id).join(','));
  console.log(tag, 'reroll changed board:', before !== after, '| flags:', await page.evaluate(() => PE.S().flags.adRerollYear));
  await page.screenshot({ path: `${OUT}/p6-${tag}-rerolled.png` });
}

(async () => {
  const browser = await launch();
  for (const [tag, vp] of [['m', { width: 412, height: 915 }], ['d', { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: tag === 'm', hasTouch: tag === 'm' });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
    page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR', tag, m.text()); });
    await boot(page); await beginGame(page); await stage(page); await shots(tag, page);
    await ctx.close();
    console.log(tag, 'done');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
