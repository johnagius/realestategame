/* City-tab contrast verification: real game UI, city screen with a full tab row
   (unlocked + locked cities) over several 3D backdrops, two eras, light+dark,
   412x915 and 1280x800. Output: tools/playwright/out/ui/tabs-*.png */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function boot(page, theme) {
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await page.evaluate((t) => {
    try { localStorage.clear(); if (t) { const p = JSON.parse(localStorage.getItem('pe_prefs') || '{}'); } } catch (e) {}
  }, theme);
  await page.reload({ waitUntil: 'load' }); await sleep(1200);
}
async function beginGame(page) {
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}
async function goCity(page, year) {
  await page.evaluate((y) => { PE.S().year = y; PEUI.render('city'); }, year);
  await sleep(6000); // 3D boot
}
async function shot(page, name) {
  // tight crop of the tab strip plus a full view
  const tabs = page.locator('.city-top');
  await tabs.screenshot({ path: `${OUT}/tabs-${name}-strip.png`, timeout: 60000 }).catch(() => {});
  await page.screenshot({ path: `${OUT}/tabs-${name}.png`, timeout: 90000 });
}

(async () => {
  const browser = await launch();
  for (const [tag, vp] of [['m', { width: 412, height: 915 }], ['d', { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: tag === 'm' ? 2 : 1, isMobile: tag === 'm', hasTouch: tag === 'm' });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
    page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR', tag, m.text()); });
    await boot(page); await beginGame(page);
    // Victorian era, many cities available-but-locked: tabs over the London dusk
    await goCity(page, 1899); await shot(page, `${tag}-vict-london`);
    // locked city backdrop: Dubai (bright) and Paris, still Victorian tokens
    await page.evaluate(() => PEUI.actions['city-tab'](null, { id: 'dubai' })); await sleep(4500); await shot(page, `${tag}-vict-dubai`);
    await page.evaluate(() => PEUI.actions['city-tab'](null, { id: 'paris' })); await sleep(4500); await shot(page, `${tag}-vict-paris`);
    // Modern era tokens over the same backdrop
    await page.evaluate(() => { PE.S().year = 1985; PEUI.refresh(); }); await sleep(2500); await shot(page, `${tag}-modern-paris`);
    // Dark theme
    await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); }); await sleep(600);
    await shot(page, `${tag}-dark-paris`);
    await page.evaluate(() => PEUI.actions['city-tab'](null, { id: 'london' })); await sleep(4000); await shot(page, `${tag}-dark-london`);
    const n = await page.evaluate(() => document.querySelectorAll('#city-tabs .tab').length);
    const nl = await page.evaluate(() => document.querySelectorAll('#city-tabs .tab--locked').length);
    console.log(tag, 'tabs:', n, 'locked:', nl);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
