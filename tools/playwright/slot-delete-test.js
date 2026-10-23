/* P8 finding 12: deleting the current game's save must remove ITS slot, not always slot 1. */
const { launch, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1200);
  await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); await sleep(400);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  const result = await page.evaluate(() => {
    // Move the running game to slot 2 and save it there; plant a decoy save in slot 1.
    PE.S().saveSlot = 2;
    PE.Game.save();
    PE.Storage.save({ familyId: 'chen', familyName: 'Decoy', year: 1900, dynasty: { surname: 'Decoy' } }, 1);
    const before = { s1: PE.Storage.has(1), s2: PE.Storage.has(2) };
    PEUI.actions['set-delete-confirm']();
    const after = { s1: PE.Storage.has(1), s2: PE.Storage.has(2) };
    return { before: before, after: after };
  });
  console.log(JSON.stringify(result));
  console.log(result.before.s1 && result.before.s2 && after_ok(result.after) ? 'PASS: active slot deleted, decoy kept' : 'FAIL');
  function after_ok(a) { return a.s1 === true && a.s2 === false; }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
