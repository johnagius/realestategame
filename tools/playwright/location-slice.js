/* Visitor Economy — 3D/city-screen verification (LOCATION-SLICE).
   Through the real UI on seed 42: buy a London listing (known district), check it
   renders in its district zone, exercise the district overlay toggle, the district
   list visitor words, and a short-let building at dusk. Screenshots at 412×915@2x
   and 1280×800 into tools/playwright/out/ui(-2)/loc-*.png */
const { launch, OUT, OUT2, URL } = require('./config');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [], consoleErrors = [];

async function shot(page, dir, name) {
  await page.screenshot({ path: `${dir}/loc-${name}.png`, fullPage: false, timeout: 90000 });
}
async function act(page, action, extra) {
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('#titlecard.is-open').count())) break;
    const next = page.locator('#titlecard.is-open [data-action="titlecard-next"]');
    if (!(await next.count())) break;
    await next.click({ timeout: 5000 }).catch(() => {});
    await sleep(200);
  }
  const sel = `[data-action="${action}"]${extra || ''}`;
  const el = page.locator(sel).first();
  if ((await el.count()) === 0 || !(await el.isVisible()) || (await el.isDisabled())) return false;
  await el.click({ timeout: 5000 }); await sleep(150); return true;
}
async function dismissOverlays(page) {
  for (let g = 0; g < 10; g++) {
    await sleep(150);
    if (await page.locator('#titlecard.is-open').count()) { await act(page, 'titlecard-next'); continue; }
    if (await page.locator('#report.is-open').count()) { await act(page, 'report-next'); continue; }
    break;
  }
}
async function closeSheet(page) {
  if (await page.locator('.sheet.is-open').count()) {
    await page.locator('.sheet.is-open .sheet__head [data-action="sheet-close"]').click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
    await sleep(300);
  }
}
/* Zone honesty: the rendered cell of a property must sit in a zone whose district
   name equals property.district. */
async function zoneCheck(page, propId) {
  return page.evaluate((id) => {
    const cell = City3D._findCell(id);
    const st = PE.Game.state();
    const p = st.properties[id] || st.listings[id];
    if (!cell || !p) return { ok: false, why: 'no cell or property', id };
    const zone = CityDef_London.districtZones[cell.r + ',' + cell.c] || null;
    return { ok: zone === p.district, id, district: p.district, zone, r: cell.r, c: cell.c };
  }, propId);
}
/* Buy a listing through the real sheet/offer flow; returns the bought id or null. */
async function buyKnown(page) {
  const listings = await page.evaluate(() => {
    const st = PE.Game.state();
    return Object.keys(st.listings).map(id => ({ id, district: st.listings[id].district, ask: st.listings[id].askingPrice, type: st.listings[id].type }))
      .sort((a, b) => a.ask - b.ask);
  });
  console.log('listings:', JSON.stringify(listings));
  await act(page, 'nav', '[data-screen="deals"]'); await sleep(300);
  for (const l of listings) {
    await closeSheet(page);
    await page.evaluate((id) => PEUI.openListing(id), l.id); await sleep(400);
    if (!(await page.locator('.sheet.is-open').count())) continue;
    if (!(await page.locator('#offer-panel').count())) continue;
    await page.locator('#offer-panel').scrollIntoViewIfNeeded();
    await page.evaluate((v) => { const r = document.getElementById('offer-price'); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, l.ask);
    await sleep(120);
    if (await page.locator('#offer-submit').isDisabled()) { console.log('cannot afford', l.id, l.district, l.ask); continue; }
    await act(page, 'offer-submit'); await sleep(500);
    let guard = 0;
    while (guard++ < 8) {
      const sid = await page.evaluate(() => PEUI.sheet.id());
      if (sid === 'bought') { await closeSheet(page); console.log('bought', l.id, 'in', l.district, 'for', l.ask); return l; }
      if (sid === 'auction') {
        const cur = await page.evaluate(() => PE.Game.summary().auction.currentBid);
        const max = Math.round(l.ask * 1.15);
        if (cur * 1.04 > max) { await act(page, 'auction-withdraw'); await sleep(300); break; }
        await page.evaluate((v) => { const i = document.getElementById('bid-amount'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(cur * 1.04));
        await act(page, 'auction-bid'); await sleep(500); continue;
      }
      if (sid && sid.indexOf('listing:') === 0) {
        const counter = await page.evaluate((id) => { const p = PE.Game.property(id).property; return p.counterPrice; }, l.id);
        if (counter && counter <= l.ask * 1.05) { await act(page, 'offer-accept-counter'); await sleep(400); continue; }
        await closeSheet(page); break;
      }
      break;
    }
  }
  return null;
}

async function cityPass(page, dir, tag, bought) {
  await act(page, 'nav', '[data-screen="city"]'); await sleep(3500); // software GL first render
  await shot(page, dir, `city-${tag}`);
  const zc = await zoneCheck(page, bought.id);
  console.log(`zone check (${tag}):`, JSON.stringify(zc));
  // overlay ON
  await act(page, 'city-districts'); await sleep(600);
  await shot(page, dir, `overlay-on-${tag}`);
  const pressed = await page.evaluate(() => { const b = document.querySelector('[data-action="city-districts"]'); return b && b.getAttribute('aria-pressed'); });
  console.log(`overlay aria-pressed (${tag}):`, pressed);
  // overlay OFF
  await act(page, 'city-districts'); await sleep(600);
  await shot(page, dir, `overlay-off-${tag}`);
  return zc;
}

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(2500);
  await act(page, 'start-new'); await sleep(300);
  await act(page, 'start-family', '[data-id="chen"]');
  await act(page, 'start-trait', '[data-id="negotiator"]');
  await act(page, 'start-begin'); await sleep(800);
  await dismissOverlays(page);

  const bought = await buyKnown(page);
  if (!bought) throw new Error('could not buy any listing');
  console.log('target property:', JSON.stringify(bought));

  const zc1 = await cityPass(page, OUT, '412', bought);
  if (!zc1.ok) throw new Error('zone mismatch: ' + JSON.stringify(zc1));

  // District list with visitor words (phone: open the pull-up sheet)
  await act(page, 'city-sheet-toggle'); await sleep(500);
  const dl = page.locator('#city-panel .district-row').last();
  await dl.scrollIntoViewIfNeeded(); await sleep(300);
  await shot(page, OUT, 'district-list-412');
  const words = await page.locator('#city-panel .district-row').allTextContents();
  console.log('district rows:', JSON.stringify(words));
  await act(page, 'city-sheet-toggle'); await sleep(400);

  // Short let at dusk: switch through the real engine call, re-render, deepen dusk
  // for the shot only (era default is a lighter dusk).
  const sl = await page.evaluate((id) => PE.Property.setLetMode(id, 'short'), bought.id);
  console.log('setLetMode:', JSON.stringify(sl));
  if (sl.ok) {
    await page.evaluate(() => PEUI.refresh()); await sleep(1500);
    await page.evaluate(() => City3D.setNight(0.78)); await sleep(800);
    await page.evaluate((id) => City3D.focus(id, 2.2), bought.id); await sleep(1800);
    await shot(page, OUT, 'shortlet-dusk-412');
    await shot(page, OUT, 'shortlet-dusk-412-b'); // a second later: turnover blink differs
    const mode = await page.evaluate((id) => PE.Game.state().properties[id].letMode, bought.id);
    console.log('letMode now:', mode);
  }

  // Reload: placement must stay in the same district zone (stability across loads)
  await page.reload({ waitUntil: 'load' }); await sleep(2000);
  await act(page, 'start-continue'); await sleep(800); await dismissOverlays(page);
  await act(page, 'nav', '[data-screen="city"]'); await sleep(3500);
  const zc2 = await zoneCheck(page, bought.id);
  console.log('zone check after reload:', JSON.stringify(zc2));
  if (!zc2.ok) throw new Error('zone mismatch after reload: ' + JSON.stringify(zc2));
  await shot(page, OUT, 'city-reloaded-412');

  // Desktop pass
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, storageState: await ctx.storageState() });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errors.push('desktop: ' + String(e)));
  p2.on('console', m => { if (m.type() === 'error') consoleErrors.push('desktop: ' + m.text()); });
  await p2.goto(URL, { waitUntil: 'load' }); await sleep(2000);
  await act(p2, 'start-continue'); await sleep(800); await dismissOverlays(p2);
  await cityPass(p2, OUT2, '1280', bought);
  const dl2 = p2.locator('#city-panel .district-row').last();
  await dl2.scrollIntoViewIfNeeded(); await sleep(300);
  await shot(p2, OUT2, 'district-list-1280');
  // short-let dusk on desktop too
  await p2.evaluate(() => City3D.setNight(0.78)); await sleep(800);
  await p2.evaluate((id) => City3D.focus(id, 2.2), bought.id); await sleep(1800);
  await shot(p2, OUT2, 'shortlet-dusk-1280');

  await browser.close();
  fs.writeFileSync(`${OUT}/loc-errors.json`, JSON.stringify({ errors, consoleErrors }, null, 2));
  console.log('page errors:', errors.length, 'console errors:', consoleErrors.length);
  if (errors.length) console.log(errors.slice(0, 10));
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 10));
  process.exit(errors.length || consoleErrors.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT FAIL', e); process.exit(2); });
