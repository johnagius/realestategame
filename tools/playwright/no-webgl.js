/* No-WebGL verification (mandate step 5): with WebGL disabled the city tab
   must show its fallback message and every essential action must still work
   through the 2D UI — view a listing (district/location info), buy it, see it
   in the portfolio, end the year, read the report.
   Run with the local server on :8790. */
const path = require('path');
const fs = require('fs');
const { chromium, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'out', 'no-webgl');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail)); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-webgl', '--disable-webgl2'] });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(URL, { waitUntil: 'load' }); await sleep(2500);
  const glOk = await page.evaluate(() => { try { return !!document.createElement('canvas').getContext('webgl'); } catch (e) { return false; } });
  check('webgl really is disabled in this context', glOk === false, glOk);
  await page.screenshot({ path: path.join(OUT, '1-splash.png') });

  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(400);
  await page.locator('[data-action="start-begin"]').click(); await sleep(900);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }

  // city tab: fallback message instead of the 3D canvas
  await page.evaluate(() => PEUI.render('city')); await sleep(1200);
  const fb = await page.evaluate(() => {
    const el = document.querySelector('.city-view__fallback');
    return el ? { hidden: el.classList.contains('hidden'), text: el.textContent.trim() } : null;
  });
  check('city tab shows the WebGL fallback message', !!fb && !fb.hidden && /WebGL|not available/.test(fb.text), fb);

  // the fallback is a DOM list of the same properties, opening the same sheets
  const fbList = await page.evaluate(() => {
    const root = document.querySelector('.city-view__fallback');
    return root ? { rows: root.querySelectorAll('.city-fb__row').length, forSale: root.querySelectorAll('[data-action="open-listing"]').length, yours: root.querySelectorAll('[data-action="open-property"]').length } : null;
  });
  check('fallback lists city properties with real actions', !!fbList && fbList.rows > 0 && fbList.forSale > 0, fbList);
  await page.screenshot({ path: path.join(OUT, '2-city-fallback.png') });
  if (fbList && fbList.forSale) {
    await page.locator('.city-view__fallback [data-action="open-listing"]').first().click(); await sleep(800);
    const fbSheet = await page.evaluate(() => { const el = document.querySelector('.sheet.is-open'); return el ? el.textContent : ''; });
    check('fallback listing row opens the real listing sheet', /£/.test(fbSheet), fbSheet.slice(0, 80));
    await page.screenshot({ path: path.join(OUT, '2b-fallback-listing.png') });
    await page.keyboard.press('Escape'); await sleep(300);
    const fc = page.locator('.sheet.is-open [data-action="sheet-close"]').first();
    if (await page.locator('.sheet.is-open').count() && await fc.count()) { await fc.click({ force: true }); await sleep(400); }
  }

  // essential action 1: listing sheet with district/location info (DOM alternative to 3D selection)
  await page.evaluate(() => PEUI.render('deals')); await sleep(600);
  const opened = await page.evaluate(() => {
    const l = PE.Market.listingArray(null).filter(x => x.type !== 'land' && x.seller !== 'auction')[0];
    if (!l) return null;
    PEUI.openListing(l.id);
    return { id: l.id, district: l.district };
  });
  await sleep(800);
  const sheet = await page.evaluate(() => {
    const el = document.querySelector('.sheet.is-open');
    return el ? el.textContent : '';
  });
  check('listing sheet opens with asking price and district', !!opened && /£/.test(sheet) && sheet.indexOf(opened.district) >= 0, opened && opened.district);
  await page.screenshot({ path: path.join(OUT, '3-listing.png') });

  // essential action 2: buy through the sheet's real offer button (counter/auction sheets handled)
  const closeSheets = async () => {
    for (let i = 0; i < 3 && await page.locator('.sheet.is-open').count(); i++) {
      await page.keyboard.press('Escape'); await sleep(400);
      if (await page.locator('.sheet.is-open').count()) { const c = page.locator('.sheet.is-open [data-action="sheet-close"]').first(); if (await c.count()) { await c.click({ force: true }); await sleep(400); } }
    }
  };
  const bought = await (async () => {
    const before = await page.evaluate(() => PE.State.playerProps().length);
    // keep the flow about the UI, not the budget; re-open the sheet so the
    // offer button's disabled state recomputes against the topped-up cash
    await page.evaluate(() => { PE.S().cash += 50000; const id = PEUI.sheet && document.querySelector('.sheet.is-open') ? (PE.Market.listingArray(null).filter(x => x.type !== 'land' && x.seller !== 'auction')[0] || {}).id : null; PEUI.sheet.close(); if (id) PEUI.openListing(id); });
    await sleep(600);
    for (let step = 0; step < 8; step++) {
      if ((await page.evaluate(() => PE.State.playerProps().length)) > before) return true;
      if (await page.locator('.sheet.is-open #offer-submit:not([disabled])').count()) { await page.locator('.sheet.is-open #offer-submit').click(); await sleep(900); continue; }
      if (await page.locator('.sheet.is-open [data-action="offer-accept-counter"]').count()) { await page.locator('.sheet.is-open [data-action="offer-accept-counter"]').click(); await sleep(900); continue; }
      const ch = page.locator('.sheet.is-open .choice').first();
      if (await ch.count()) { await ch.click(); await sleep(700); continue; }
      break;
    }
    return (await page.evaluate(() => PE.State.playerProps().length)) > before;
  })();
  check('property bought through the real sheet flow', bought);
  await page.screenshot({ path: path.join(OUT, '4-bought.png') });
  await closeSheets();

  // essential action 3: portfolio lists the holding (2D)
  await page.evaluate(() => PEUI.render('portfolio')); await sleep(600);
  const pfOk = await page.evaluate(() => PE.State.playerProps().length >= 1 && document.querySelector('#app').textContent.length > 50);
  check('portfolio tab renders holdings', pfOk);
  await page.screenshot({ path: path.join(OUT, '5-portfolio.png') });

  // essential action 4: end year through the real button, report appears
  await closeSheets();
  const y0 = await page.evaluate(() => PE.S().year);
  await page.locator('[data-action="end-year"], button:has-text("End year")').first().click(); await sleep(2200);
  const y1 = await page.evaluate(() => PE.S().year);
  const report = await page.evaluate(() => document.body.textContent);
  check('end year advances and the report renders', y1 === y0 + 1 && /Net worth/i.test(report), { y0, y1 });
  await page.screenshot({ path: path.join(OUT, '6-report.png') });

  check('no page errors without WebGL', errors.length === 0, errors.slice(0, 3));

  // desktop viewport: same fallback list at 1280x800
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx2.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const page2 = await ctx2.newPage();
  await page2.goto(URL, { waitUntil: 'load' }); await sleep(2500);
  try { await page2.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page2.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(400);
  await page2.locator('[data-action="start-begin"]').click(); await sleep(900);
  while (await page2.locator('.sheet.is-open .choice').count()) { await page2.locator('.sheet.is-open .choice').first().click(); await sleep(300); }
  await page2.evaluate(() => PEUI.render('city')); await sleep(1200);
  const fb2 = await page2.evaluate(() => { const el = document.querySelector('.city-view__fallback'); return el ? { hidden: el.classList.contains('hidden'), rows: el.querySelectorAll('.city-fb__row').length } : null; });
  check('desktop: fallback list renders at 1280x800', !!fb2 && !fb2.hidden && fb2.rows > 0, fb2);
  await page2.screenshot({ path: path.join(OUT, '7-city-fallback-desktop.png') });
  await ctx2.close();

  await browser.close();
  console.log(`\nno-webgl: ${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
