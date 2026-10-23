/* ENG-A screenshots: (a) property sheet after a renovation (412×915),
   (b) year report (1280×800), (c) deals "Yours" sheet with the new
   "See it in the city" button (412×915), (d) HUD pulse (412×915). */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function boot(page) {
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { console.log('start-new flake, retrying once'); await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}

async function buyCheapest(page) {
  await page.evaluate(() => {
    const r = PE.Market.listings();
    let ls = (r.listings || []).filter(l => l.seller !== 'auction' && l.type !== 'land');
    ls.sort((a, b) => a.askingPrice - b.askingPrice);
    const shabby = ls.filter(l => l.condition < 70);
    PEUI.openListing((shabby[0] || ls[0]).id);
  });
  await sleep(700);
  await page.evaluate(() => {
    const r = document.getElementById('offer-price');
    r.value = r.max; r.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(300);
  for (let i = 0; i < 4; i++) {
    const title = await page.locator('#sheet-title').textContent().catch(() => '');
    if (title.indexOf('Yours') === 0) return true;
    const counter = page.locator('[data-action="offer-accept-counter"]');
    if (await counter.count()) { await counter.first().click(); await sleep(800); continue; }
    await page.locator('#offer-submit').click(); await sleep(900);
  }
  const title = await page.locator('#sheet-title').textContent().catch(() => '');
  return title.indexOf('Yours') === 0;
}

function watch(page, tag) {
  page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', tag, m.text()); });
}

(async () => {
  const browser = await launch();

  /* ---- mobile: Yours sheet, renovation, HUD pulse ---- */
  const ctxM = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pm = await ctxM.newPage(); watch(pm, 'mobile');
  await boot(pm);
  if (!(await buyCheapest(pm))) { console.log('PURCHASE FAILED'); process.exit(1); }
  await sleep(400);
  await pm.screenshot({ path: `${OUT}/enga-yours-412.png` }); // (c)
  await pm.evaluate(() => { PE.Game.state().cash += 30000; }); // headroom so the renovate button is enabled (shot setup only)
  await pm.locator('.sheet [data-action="open-property"]').first().click(); await sleep(700);
  const reno = pm.locator('[data-action="prop-renovate"]:not([disabled])').first();
  if (!(await reno.count())) { console.log('NO RENOVATE BUTTON'); process.exit(1); }
  await reno.click();
  await sleep(350);
  await pm.screenshot({ path: `${OUT}/enga-hud-412.png`, clip: { x: 0, y: 0, width: 412, height: 100 } }); // (d) pulse still on
  await sleep(700);
  await pm.screenshot({ path: `${OUT}/enga-renovated-412.png` }); // (a)
  await ctxM.close();

  /* ---- desktop: year report with rent payoff ---- */
  const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pd = await ctxD.newPage(); watch(pd, 'desktop');
  await boot(pd);
  if (!(await buyCheapest(pd))) { console.log('PURCHASE FAILED (desktop)'); process.exit(1); }
  await pd.keyboard.press('Escape'); await sleep(400);
  await pd.locator('[data-action="end-year"]').click(); await sleep(800);
  while (await pd.locator('.sheet.is-open .choice').count()) { await pd.locator('.choice').first().click(); await sleep(400); }
  await pd.locator('#report.is-open').waitFor({ timeout: 10000 });
  try { await pd.waitForFunction(() => document.querySelectorAll('.money-float').length > 0, { timeout: 5000 }); }
  catch (e) { console.log('no money-float caught; shooting anyway'); await sleep(800); }
  await pd.screenshot({ path: `${OUT}/enga-report-1280.png` }); // (b)
  await ctxD.close();

  await browser.close();
  console.log('enga shots done');
})().catch(e => { console.error(e); process.exit(1); });
