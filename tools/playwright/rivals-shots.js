/* Content-phase check: rivals screen + rival sheet (era-aware voice lines show
   as lastAction quotes) at 412x915 and 1280x800. */
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
  // run 12 years so rivals hold buildings and voice lines land in lastAction
  await page.evaluate(() => {
    const s = PE.S(); s.cash += 50000;
    for (let i = 0; i < 12; i++) PE.Game.endYear();
    PEUI.save(); PEUI.refresh();
  });
  await sleep(400);
}
async function shots(tag, page) {
  await page.evaluate(() => PEUI.render('rivals')); await sleep(700);
  await page.screenshot({ path: `${OUT}/content-${tag}-rivals.png` });
  // open the top non-player rival sheet
  const id = await page.evaluate(() => {
    const lb = PE.Rivals.leaderboard();
    const r = lb.leaderboard.find(x => !x.isPlayer);
    return r ? r.id : null;
  });
  if (id) {
    await page.evaluate((rid) => PEUI.actions['open-rival'](null, { id: rid }), id);
    await sleep(700);
    await page.screenshot({ path: `${OUT}/content-${tag}-rival-sheet.png` });
    await page.keyboard.press('Escape'); await sleep(300);
  }
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
