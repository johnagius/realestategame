/* Signature moments: listing reveal + crash report newsprint. */
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
  await page.locator('#deal-list .deal').first().click(); await sleep(1200);
  await page.screenshot({ path: `${OUT}/moment-listing-412.png` });
  await page.keyboard.press('Escape'); await sleep(300);
  // crash-flavoured report preview: depression cycle, crash scene, advisor bubble
  await page.evaluate(() => {
    PEUI._previewReport({
      year: 1873, era: 'victorian', eraName: 'Victorian', cycle: 'depression', cycleName: 'Depression', cycleAfter: 'stagnation', baseRateAfter: 0.035,
      headline: 'The long crash deepens.', cliffhanger: 'Bankers whisper of more trouble in the spring.',
      equityChange: -420, netWorthBefore: 2000, netWorthAfter: 1580, cashBefore: 300, cashAfter: 220,
      cashFlow: { rent: 90, costs: 30, debtService: 25, taxes: 5, interest: 0, net: 30 },
      valuesByCity: { london: -22 }, deals: [], rivalsMoves: [], events: [], dynasty: [], lines: [],
      goals: { achieved: [], progress: [] }, rank: { before: 6, after: 7 }, warnings: ['negative_cash'], preview: true
    });
  });
  await sleep(1400);
  await page.screenshot({ path: `${OUT}/moment-crash-report-412.png` });
  await browser.close();
  console.log('moment shots done');
})().catch(e => { console.error(e); process.exit(1); });
