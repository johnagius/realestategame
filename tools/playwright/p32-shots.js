/* P3.2 verification: alliances card, merger note, marriage picker. */
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
  await page.evaluate(() => {
    const s = PE.S();
    s.rivals.wong.allied = true; s.relations.wong = 60;
    s.dynasty.alliances.push({ rivalId: 'wong', memberId: 'm1', year: 1849 });
    s.dynasty.head.age = 66; // open the merger window
    s.dynasty.members.push({ id: 'child_9', name: 'Thomas', relation: 'child', age: 24, alive: true, married: false, disgraced: false, traits: ['negotiator'], educated: false });
    s.cash = 50000;
    PEUI.refresh();
  });
  await page.locator('[data-action="nav"][data-screen="dynasty"]').click(); await sleep(400);
  await page.screenshot({ path: `${OUT}/p32-alliances-412.png` });
  await page.locator('[data-action="dyn-merge"]').first().click(); await sleep(400);
  await page.screenshot({ path: `${OUT}/p32-merge-confirm-412.png` });
  await page.keyboard.press('Escape'); await sleep(250);
  // marriage picker
  await page.locator('[data-action="dyn-marry"]').first().click(); await sleep(400);
  await page.screenshot({ path: `${OUT}/p32-marry-412.png` });
  await browser.close();
  console.log('p32 shots done');
})().catch(e => { console.error(e); process.exit(1); });
