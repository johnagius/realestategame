/* Verify the report's Goals-in-progress section shows missed yearly + family progress. */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await launch();
  for (const [tag, vp] of [['m', { width: 412, height: 915 }], ['d', { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: tag === 'm' ? 2 : 1, isMobile: tag === 'm', hasTouch: tag === 'm' });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', tag, String(e)));
    await page.goto(URL, { waitUntil: 'load' }); await sleep(1200);
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.reload({ waitUntil: 'load' }); await sleep(1200);
    await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); await sleep(400);
    await page.locator('[data-action="start-family"][data-id="armstrong"]').click(); await sleep(300);
    await page.locator('[data-action="start-begin"]').click(); await sleep(600);
    while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
    await page.locator('[data-action="nav"][data-screen="deals"]').first().click({ timeout: 8000 }).catch(() => {}); await sleep(800);
    await page.evaluate(() => { PE.S().goals.yearly = { id: 'buy_below', desc: 'Buy a property below its asking price this year.', baseline: 999, year: PE.S().year, reward: 30 }; });
    await page.evaluate(() => PEUI.actions['end-year']()); await sleep(600);
    for (let i = 0; i < 20 && !(await page.locator('#report.is-open').count()); i++) {
      const next = page.locator('#titlecard.is-open [data-action="titlecard-next"]');
      if (await next.count()) { await next.click(); await sleep(400); continue; }
      if (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.sheet.is-open .choice').first().click(); await sleep(350); continue; }
      await sleep(300);
    }
    const secs = await page.evaluate(() => {
      const sc = document.querySelector('.report__scroll');
      const heads = Array.from(sc.querySelectorAll('.section-head h2, .kicker'));
      const el = heads.find(e => /Goals in progress/.test(e.textContent));
      if (el) el.scrollIntoView();
      return Array.from(sc.querySelectorAll('section')).map(s => s.textContent.slice(0, 200)).filter(t => /goal|Goal/.test(t));
    });
    console.log(tag, JSON.stringify(secs, null, 1));
    await sleep(500);
    await page.screenshot({ path: `${OUT}/goals-${tag}-report-goals.png`, timeout: 90000 });
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
