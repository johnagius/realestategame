/* P4 UI verification: bonds desk (Boom era), own bank panel (Modern era + perk,
   closed then open with loans), build-to-suit section on a land plot sheet —
   at 412x915 and 1280x800. */
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
async function stageFinance(page) {
  await page.evaluate(() => {
    const s = PE.S();
    s.year = 1955; s.cash += 200000;
    PE.Finance.buyBond(5000); PE.Finance.buyBond(2500);
    s.perks.push('own_bank');
    PEUI.save(); PEUI.refresh();
  });
  await sleep(300);
}
async function stageBank(page) {
  await page.evaluate(() => {
    const s = PE.S();
    s.year = 1985;
    PE.Finance.openBank(50000);
    PE.Finance.bankYearly(null); // lend the idle pool so loans are visible
    PEUI.save(); PEUI.refresh();
  });
  await sleep(300);
}
async function stageLand(page) {
  await page.evaluate(() => {
    const s = PE.S();
    s.year = 1905;
    const land = PE.Market.genProperty('london', { type: 'land', district: 'Camden' });
    land.purchasePrice = land.trueValue; land.purchaseYear = s.year;
    PE.State.setOwner(land, 'player');
    PEUI.save(); PEUI.refresh();
    window.__landId = land.id;
  });
  await sleep(300);
}
async function shots(tag, page) {
  // 1. bonds card (1955, holdings present) — full portfolio + scrolled to finance
  await page.evaluate(() => PEUI.render('portfolio')); await sleep(700);
  await page.screenshot({ path: `${OUT}/p4-${tag}-portfolio-top.png` });
  await page.evaluate(() => { const el = document.querySelector('#pf-finance'); if (el) el.scrollIntoView({ block: 'start' }); });
  await sleep(400);
  await page.screenshot({ path: `${OUT}/p4-${tag}-bonds.png` });
  // 2. bank card open with loans (1985)
  await stageBank(page);
  await page.evaluate(() => { const el = document.querySelector('#pf-finance'); if (el) el.scrollIntoView({ block: 'start' }); });
  await sleep(400);
  await page.screenshot({ path: `${OUT}/p4-${tag}-bank.png` });
  // 3. build-to-suit on a land sheet (1905 — bonds gated off, keeps sheet short)
  await stageLand(page);
  await page.evaluate(() => PEUI.openProperty(window.__landId)); await sleep(700);
  await page.evaluate(() => { const el = document.querySelector('.sheet.is-open .sheet__body'); if (el) el.scrollTop = 0; });
  await page.screenshot({ path: `${OUT}/p4-${tag}-build.png` });
  // pick the grand spec for the quote view
  await page.evaluate(() => { const b = document.querySelector('[data-action="prop-build-spec"][data-spec="grand"]'); if (b) b.click(); });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/p4-${tag}-build-grand.png` });
}

(async () => {
  const browser = await launch();
  for (const [tag, vp] of [['m', { width: 412, height: 915 }], ['d', { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: tag === 'm', hasTouch: tag === 'm' });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
    page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR', tag, m.text()); });
    await boot(page); await beginGame(page); await stageFinance(page); await shots(tag, page);
    await ctx.close();
    console.log(tag, 'done');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
