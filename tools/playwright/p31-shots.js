/* P3.1 verification: rival sheet, auction theatre with taunts. */
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
  // bump relations so the sheet shows a warm meter + log
  await page.evaluate(() => { PE.S().relations.wong = 42; PE.Rivals.adjustRelation('wong', 8, 'accepted offer'); PE.Rivals.adjustRelation('petrov', -8, 'relationOutbid'); PE.Rivals.adjustRelation('rothschild', -2, 'declined offer'); PEUI.refresh(); });
  await page.locator('[data-action="nav"][data-screen="rivals"]').click(); await sleep(400);
  await page.screenshot({ path: `${OUT}/p31-board-412.png` });
  await page.locator('#rv-list .rival[data-id="wong"]').click(); await sleep(400);
  await page.screenshot({ path: `${OUT}/p31-rival-sheet-412.png` });
  await page.keyboard.press('Escape'); await sleep(300);
  // auction: open the auction listing and bid to draw rival responses with taunts
  await page.locator('[data-action="nav"][data-screen="deals"]').click(); await sleep(300);
  const n = await page.locator('#deal-list .deal').count();
  let opened = false;
  for (let i = 0; i < n; i++) {
    const badge = await page.locator('#deal-list .deal').nth(i).locator('.chip, .badge').allTextContents().catch(() => []);
    await page.locator('#deal-list .deal').nth(i).click(); await sleep(350);
    const isAuction = await page.evaluate(() => { const id = PEUI.sheet.id(); if (!id || id.indexOf('listing:') !== 0) return false; const p = PE.Game.property(id.split(':')[1]).property; return p.seller === 'auction'; });
    if (isAuction) { opened = true; break; }
    await page.keyboard.press('Escape'); await sleep(250);
  }
  if (opened) {
    await page.evaluate(() => { const l = PE.Game.property(PEUI.sheet.id().split(':')[1]).property; const r = document.getElementById('offer-price'); r.value = Math.round(l.askingPrice * 1.05); r.dispatchEvent(new Event('input', { bubbles: true })); });
    await sleep(150);
    await page.locator('#offer-submit').click(); await sleep(500);
    await page.screenshot({ path: `${OUT}/p31-auction-412.png` });
    // bid again to draw a taunt note
    await page.locator('[data-action="auction-bid"]').click(); await sleep(500);
    await page.screenshot({ path: `${OUT}/p31-auction2-412.png` });
  } else console.log('no auction listing found on seed-42 board');
  await browser.close();
  console.log('p31 shots done');
})().catch(e => { console.error(e); process.exit(1); });
