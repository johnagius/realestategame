/* P8.7 preflight: the owner-facing playtest save (tools/playtest-save.json,
   generated before rival succession landed) must import and play cleanly on
   the current build. Drives the REAL import path: Dynasty → Settings →
   Import into slot 3 → file picker → Play slot 3, then verifies the loaded
   state (Chen 1872, Mayfair short let), screenshots portfolio + city, and
   ends a year through the real button. Run with the local server on :8790. */
const path = require('path');
const fs = require('fs');
const { launch, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'out', 'playtest-save');
const SAVE = path.join(__dirname, '..', 'playtest-save.json');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail)); }
}

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(URL, { waitUntil: 'load' }); await sleep(2000);
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(400);
  await page.locator('[data-action="start-begin"]').click(); await sleep(900);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }

  // Dynasty → Settings → Import into slot 3 (empty slot: file picker opens directly)
  await page.evaluate(() => PEUI.render('dynasty')); await sleep(600);
  await page.locator('#screen-dynasty [data-action="open-settings"]').click(); await sleep(500);
  const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
  await page.locator('[data-action="slot-import"][data-slot="3"]').click();
  await (await chooser).setFiles(SAVE);
  await sleep(900);
  const imported = await page.evaluate(() => PE.Storage.listSaves().filter(s => s.slot === 3)[0]);
  check('playtest save imports into slot 3 through the file picker', !!imported && imported.exists && !imported.corrupt && imported.year === 1872, imported && { year: imported.year, family: imported.familyName });
  await page.screenshot({ path: path.join(OUT, '1-imported.png') });

  // Play slot 3 (confirm sheet → Load save)
  await page.locator('[data-action="slot-play"][data-slot="3"]').click(); await sleep(500);
  await page.locator('[data-action="slot-play-confirm"]').click(); await sleep(1500);
  const st = await page.evaluate(() => {
    const s = PE.S(), props = PE.State.playerProps();
    const shortLets = props.filter(p => (p.letMode || 'long') === 'short');
    return { year: s.year, family: s.familyId, props: props.length, shortLets: shortLets.map(p => p.district), version: PE.Game.version, bankruptRivals: Object.keys(s.rivals).filter(id => s.rivals[id].bankrupt) };
  });
  check('loaded save is Chen 1872 with the Mayfair short let on v8.10', st.year === 1872 && st.family === 'chen' && st.props >= 3 && st.shortLets.map(x => String(x).toLowerCase()).indexOf('mayfair') >= 0 && st.version === '8.10.0', st);

  // The save loads with pending decisions queued; end-year is blocked until they
  // are resolved (by design). Drain them like a player would.
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.sheet.is-open .choice').first().click(); await sleep(400); }

  await page.evaluate(() => PEUI.render('portfolio')); await sleep(800);
  await page.screenshot({ path: path.join(OUT, '2-portfolio.png') });
  await page.evaluate(() => PEUI.render('city')); await sleep(2500);
  await page.screenshot({ path: path.join(OUT, '3-city.png') });

  // end a year through the real button on the loaded save
  const y0 = await page.evaluate(() => PE.S().year);
  await page.locator('[data-action="end-year"], button:has-text("End year")').first().click(); await sleep(2500);
  const y1 = await page.evaluate(() => PE.S().year);
  check('a year ends cleanly on the imported save', y1 === y0 + 1, { y0, y1 });
  const mig = await page.evaluate(() => Object.keys(PE.S().rivals).filter(id => PE.S().rivals[id].bankrupt).map(id => PE.S().rivals[id].returnYear !== undefined));
  check('succession migration: any bankrupt rival in the legacy save has a returnYear after the first tick', mig.every(Boolean), mig);
  await page.screenshot({ path: path.join(OUT, '4-year.png') });

  check('no page errors on the imported save', errors.length === 0, errors.slice(0, 3));
  await browser.close();
  console.log(`\nplaytest-save: ${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
