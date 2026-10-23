/* P8 findings 13+14 verification: Armstrong family goal must appear in the deals
   goals strip, and a missed yearly goal + family progress must appear in the
   yearly report. 412x915 and 1280x800. Output: tools/playwright/out/ui/goals-*.png */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function boot(page) {
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1200);
}
async function beginArmstrong(page) {
  await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); await sleep(400);
  await page.locator('[data-action="start-family"][data-id="armstrong"]').click(); await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}
async function dismissOverlays(page, tag) {
  for (let i = 0; i < 40; i++) {
    if (await page.locator('#titlecard.is-open [data-action="end-heir"], #titlecard.is-open [data-action="end-new"]').count()) return 'ended';
    const next = page.locator('#titlecard.is-open [data-action="titlecard-next"]');
    if (await next.count()) { await next.click(); await sleep(400); continue; }
    if (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.sheet.is-open .choice').first().click(); await sleep(350); continue; }
    if (await page.locator('.sheet.is-open').count()) { await page.keyboard.press('Escape'); await sleep(350); continue; }
    if (await page.locator('#report.is-open').count()) {
      await sleep(800);
      await page.screenshot({ path: `${OUT}/goals-${tag}-report.png`, timeout: 90000 });
      await page.locator('#report.is-open [data-action="report-next"]').click(); await sleep(300); continue;
    }
    return 'ok';
  }
  return 'stuck';
}

(async () => {
  const browser = await launch();
  for (const [tag, vp] of [['m', { width: 412, height: 915 }], ['d', { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: tag === 'm' ? 2 : 1, isMobile: tag === 'm', hasTouch: tag === 'm' });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
    page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR', tag, m.text()); });
    await boot(page); await beginArmstrong(page);
    // Deals screen: goals strip must show the family row
    await page.locator('[data-action="nav"][data-screen="deals"]').first().click({ timeout: 8000 }).catch(() => {});
    await sleep(1200);
    const strip = page.locator('.goals');
    await strip.screenshot({ path: `${OUT}/goals-${tag}-strip.png`, timeout: 60000 }).catch(() => {});
    await page.screenshot({ path: `${OUT}/goals-${tag}-deals.png`, timeout: 90000 });
    const rows = await page.evaluate(() => Array.from(document.querySelectorAll('.goals .goal .goal__k')).map(e => e.textContent));
    console.log(tag, 'goal rows:', JSON.stringify(rows));
    // End the year doing nothing: yearly goal should be missed and visible in the report
    await page.locator('[data-action="end-year"]').first().click({ timeout: 8000 }); await sleep(400);
    const res = await dismissOverlays(page, tag);
    console.log(tag, 'after year 1:', res);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
