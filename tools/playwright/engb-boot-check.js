/* ENG-B final: clean boot check — no console/page errors, deals + portfolio + rivals render. */
const { launch, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  let errors = 0;
  page.on('pageerror', e => { errors++; console.log('PAGE ERROR', String(e)); });
  page.on('console', m => { if (m.type() === 'error') { errors++; console.log('CONSOLE', m.text()); } });
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(250); }
  for (const screen of ['deals', 'portfolio', 'rivals', 'dynasty', 'deals']) {
    await page.evaluate((sc) => PEUI.render(sc), screen); await sleep(500);
  }
  // end a year through the engine to exercise refreshBoard + snappedUp + report path
  await page.evaluate(() => { let r = PE.Game.endYear(); let g = 0; while (!r.ok && g++ < 10) { const p = PE.Events.pending(); if (!p.ok || !p.event) break; PE.Events.resolve(p.event.uid, 0); r = PE.Game.endYear(); } PEUI.refresh(); });
  await sleep(800);
  console.log(errors ? 'ERRORS: ' + errors : 'CLEAN BOOT OK');
  await browser.close();
  process.exit(errors ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
