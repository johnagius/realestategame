/* ENG-B1 screenshots: deal board with "Snapped up by ..." cards at 412×915 and 1280×800. */
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

async function ensureSnapped(page) {
  // End years until a rival pre-empts a listing (engine-driven, deterministic per seed).
  const got = await page.evaluate(async () => {
    for (let i = 0; i < 8; i++) {
      if (PE.Game.state().snappedUp && PE.Game.state().snappedUp.length) return true;
      let rep = PE.Game.endYear();
      let guard = 0;
      while (!rep.ok && guard++ < 10) { // resolve any pending events, then retry
        const pend = PE.Events.pending();
        if (!pend.ok || !pend.event) break;
        PE.Events.resolve(pend.event.uid, 0);
        rep = PE.Game.endYear();
      }
      if (!rep.ok) return false;
      if (PE.Game.state().snappedUp && PE.Game.state().snappedUp.length) return true;
    }
    return false;
  });
  if (got) await page.evaluate(() => { PE.Game.save(); });
  return got;
}

(async () => {
  const browser = await launch();
  for (const vp of [{ width: 412, height: 915, tag: '412', mobile: true }, { width: 1280, height: 800, tag: '1280', mobile: false }]) {
    const ctx = await browser.newContext(vp.mobile
      ? { viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage(); watch(page, vp.tag);
    await boot(page);
    const got = await ensureSnapped(page);
    console.log(vp.tag, 'snapped-up present:', got);
    await page.reload({ waitUntil: 'load' }); await sleep(1800); // reload → save restores, deals screen is home
    // make sure we're on the deals screen
    await page.evaluate(() => { if (PEUI.current !== 'deals') PEUI.render('deals'); });
    await sleep(500);
    const n = await page.locator('#deal-snapped .deal--snapped').count();
    console.log(vp.tag, 'snapped cards rendered:', n);
    await page.screenshot({ path: `${OUT}/engb1-snapped-${vp.tag}.png` });
    await ctx.close();
  }
  await browser.close();
  console.log('engb1 shots done');
})().catch(e => { console.error(e); process.exit(1); });
