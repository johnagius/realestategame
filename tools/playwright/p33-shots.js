/* P3.3 verification: succession ceremony with wax seal, tax breakdown. */
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
  await page.evaluate(() => { PE.Dynasty.setupTrust(); PE.Dynasty.toggleCharity(); PE.S().dynasty.head.age = 96; });
  // run years until a succession happens
  let guard = 0;
  while (guard++ < 12) {
    await page.locator('#hud-end').click(); await sleep(400);
    while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
    if (await page.locator('.ceremony').count()) break;
    if (await page.locator('#titlecard.is-open [data-action="titlecard-next"]').count()) { await page.locator('#titlecard.is-open [data-action="titlecard-next"]').click(); await sleep(300); }
    if (await page.locator('#report.is-open').count()) { await page.locator('#report [data-action="report-next"]').click(); await sleep(300); }
  }
  const has = await page.locator('.ceremony').count();
  console.log('ceremony shown:', has > 0);
  if (has) {
    await sleep(700);
    await page.screenshot({ path: `${OUT}/p33-ceremony-seal-412.png` });
    await sleep(1400);
    await page.screenshot({ path: `${OUT}/p33-ceremony-reveal-412.png` });
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
