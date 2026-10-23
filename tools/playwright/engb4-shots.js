/* ENG-B4 screenshots: rivals screen with a Hostile rival + rival sheet explaining
   relation consequences, at 412×915 and 1280×800. */
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

function watch(page, tag) {
  page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', tag, m.text()); });
}

(async () => {
  const browser = await launch();
  for (const vp of [{ width: 412, height: 915, tag: '412', mobile: true }, { width: 1280, height: 800, tag: '1280', mobile: false }]) {
    const ctx = await browser.newContext(vp.mobile
      ? { viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage(); watch(page, vp.tag);
    await boot(page);
    await page.evaluate(() => {
      PE.Rivals.setRelation('petrov', -55); // hostile, with a log entry
      PE.Rivals.adjustRelation('petrov', 0, null);
      const s = PE.Game.state(); s.rivals.petrov.relationLog = [{ year: s.year - 1, delta: -8, why: 'relationOutbid' }, { year: s.year, delta: -4, why: 'relationDeclined' }];
      PEUI.render('rivals');
    });
    await sleep(700);
    await page.screenshot({ path: `${OUT}/engb4-rivals-${vp.tag}.png` });
    // open the hostile rival's sheet
    await page.locator('[data-action="open-rival"][data-id="petrov"], [data-action="rival-open"][data-id="petrov"]').first().click({ timeout: 3000 }).catch(async () => {
      await page.evaluate(() => { const el = document.querySelector('#rv-list [data-id="petrov"]') || document.querySelector('#rv-list .rival'); if (el) el.click(); });
    });
    await sleep(600);
    await page.screenshot({ path: `${OUT}/engb4-rival-sheet-${vp.tag}.png` });
    await ctx.close();
  }
  await browser.close();
  console.log('engb4 shots done');
})().catch(e => { console.error(e); process.exit(1); });
