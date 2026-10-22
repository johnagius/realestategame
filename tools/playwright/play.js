/* Full 30-year game through the real UI (seed 42, Chen) + screenshots of every screen/sheet at 412×915@2x and 1280×800. */
const { chromium, launch, OUT, OUT2 } = require('./config');
const fs = require('fs');
const ph2 = { reveals: 0, callouts: 0, bubbles: 0 };
async function shot2(page, name) { await page.screenshot({ path: `${OUT2}/play-${name}-${sfx}.png`, fullPage: false }); }
const URL = 'http://127.0.0.1:8790/index.html?seed=42';
const errors = [], consoleErrors = [];
const shots = new Set();
let sfx = '412';
async function shot(page, name, force) { const key = name + '-' + sfx; if (shots.has(key) && !force) return; shots.add(key); await page.screenshot({ path: `${OUT}/${key}.png`, fullPage: false }); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function act(page, action, extra) {
  // A chapter/era title card swallows pointer events; click through it first
  // (end-of-run cards with end-* actions are left for the caller to choose).
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('#titlecard.is-open').count())) break;
    if (await page.locator('#titlecard.is-open [data-action="end-heir"], #titlecard.is-open [data-action="end-new"]').count()) break;
    const next = page.locator('#titlecard.is-open [data-action="titlecard-next"]');
    if (!(await next.count())) break;
    await next.click({ timeout: 5000 }).catch(() => {});
    await sleep(200);
  }
  const sel = `[data-action="${action}"]${extra || ''}`; const el = page.locator(sel).first(); if (await el.count() === 0) return false; if (!(await el.isVisible())) return false; if (await el.isDisabled()) return false; await el.click({ timeout: 5000 }); await sleep(120); return true; }
async function sheetOpen(page) { return page.locator('.sheet.is-open').count().then(n => n > 0); }
async function sheetId(page) { return page.evaluate(() => (window.PEUI.sheet.id())); }
async function summary(page) { return page.evaluate(() => PE.Game.summary()); }
async function closeSheet(page) { if (await sheetOpen(page)) { await page.locator(".sheet.is-open .sheet__head [data-action=\"sheet-close\"]").click({ timeout: 5000 }).catch(() => page.keyboard.press("Escape")); await sleep(350); } }
async function resolveEvents(page) {
  let guard = 0;
  while (guard++ < 6) {
    if (!(await sheetOpen(page)) || (await sheetId(page)) !== 'event') break;
    await shot(page, 'event');
    const labels = await page.locator('.choice').allTextContents();
    const s = await summary(page);
    let idx = 0;
    const thin = s.cash < 0.15 * Math.max(1, s.netWorth);
    for (let i = 0; i < labels.length; i++) { const l = labels[i].toLowerCase(); if (thin && /pay|invest|buy|give|donate/.test(l)) continue; if (/gamble/.test(l) && s.cash < 0.3 * s.netWorth) continue; idx = i; break; }
    await page.locator('.choice').nth(idx).click(); await sleep(400);
  }
}
async function dismissOverlays(page, tag) {
  let guard = 0;
  while (guard++ < 10) {
    await sleep(150);
    if (await page.locator('#titlecard.is-open').count()) {
      const endBtn = page.locator('#titlecard.is-open [data-action="end-heir"], #titlecard.is-open [data-action="end-new"]');
      if (await endBtn.count()) { await shot(page, 'end', true); return 'end'; }
      await shot(page, 'titlecard'); await act(page, 'titlecard-next'); continue;
    }
    if (await page.locator('#report.is-open').count()) { if (!shots.has((tag || 'report') + '-' + sfx)) await sleep(1000); await shot(page, tag || 'report'); await act(page, 'report-next'); continue; }
    if (await sheetOpen(page) && (await sheetId(page)) === 'event') { await resolveEvents(page); continue; }
    break;
  }
  return 'ok';
}
async function endYear(page) { await act(page, 'end-year'); await sleep(200); return dismissOverlays(page); }
async function tryBuy(page) {
  await act(page, 'nav', '[data-screen="deals"]'); await sleep(150);
  await act(page, 'deal-sort', '[data-sort="value"]'); await sleep(100);
  const cards = page.locator('#deal-list .deal');
  for (let i = 0; i < 5; i++) {
    await closeSheet(page);
    if (i >= await cards.count()) break;
    const badge = await cards.nth(i).locator('.badge').first().textContent({ timeout: 3000 }).catch(() => '');
    if (/Stretch/.test(badge)) continue;
    await cards.nth(i).click(); await sleep(350);
    if (!(await sheetOpen(page))) continue;
    await shot(page, 'listing');
    const info = await page.evaluate(() => { const id = PEUI.sheet.id().split(':')[1]; const p = PE.Game.property(id).property; return { id, ask: p.askingPrice, lo: p.lowEstimate, hi: p.highEstimate, seller: p.seller, revealed: p.revealed, tv: p.trueValue }; });
    const est = info.revealed ? info.tv : (info.lo + info.hi) / 2;
    if (info.ask / est > 1.0 && info.seller !== 'auction') { await closeSheet(page); continue; }
    // Phase 2: write down an estimate (a naive player: the band midpoint) so reveals accumulate
    if (await page.locator('#est-input').count()) { await page.evaluate((v) => { const i = document.getElementById('est-input'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(est)); }
    ph2.callouts += await page.locator('.sheet .callout').count();
    // scroll to the offer panel and set the price via the slider
    await page.locator('#offer-panel').scrollIntoViewIfNeeded(); await shot(page, 'offer');
    const target = Math.min(info.ask, Math.round(est * 0.92));
    await page.evaluate((v) => { const r = document.getElementById('offer-price'); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, target);
    await sleep(100);
    if (await page.locator('#offer-submit').isDisabled()) { await closeSheet(page); continue; }
    await act(page, 'offer-submit'); await sleep(400);
    let guard = 0;
    while (guard++ < 6) {
      const id = await sheetId(page);
      if (id === 'bought') { await shot(page, 'yours'); if (await page.locator('.sheet .reveal').count()) { ph2.reveals++; await shot2(page, 'reveal'); } await closeSheet(page); return true; }
      if (id === 'auction') {
        await shot(page, 'auction');
        const cur = await page.evaluate(() => PE.Game.summary().auction.currentBid);
        const max = Math.round(est * 1.0);
        if (cur * 1.04 > max) { await act(page, 'auction-withdraw'); await sleep(300); break; }
        await page.evaluate((v) => { const i = document.getElementById('bid-amount'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(cur * 1.04));
        await act(page, 'auction-bid'); await sleep(400); continue;
      }
      if (id && id.indexOf('listing:') === 0) {
        const counter = await page.evaluate(() => { const id = PEUI.sheet.id().split(':')[1]; const p = PE.Game.property(id).property; return p.counterPrice; });
        if (counter && counter <= est * 0.97) { await shot(page, 'counter'); await act(page, 'offer-accept-counter'); await sleep(400); continue; }
        await closeSheet(page); break;
      }
      break;
    }
  }
  return false;
}
async function managePortfolio(page) {
  await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(150);
  // rival offers: accept if premium >= 25
  const offers = await page.evaluate(() => PE.Market.offersOnMyProperties().offers);
  for (const o of offers) { await act(page, 'offer-respond', `[data-id="${o.id}"][data-accept="${o.premium >= 25 ? 1 : 0}"]`); await sleep(200); }
  // margin calls: repay via the property sheet
  const fs = await page.evaluate(() => PE.Finance.summary());
  for (const w of fs.covenantWarnings) {
    if (w.kind !== 'margin_call') continue;
    await act(page, 'open-property', `[data-id="${w.propertyId}"]`); await sleep(350);
    const s = await summary(page);
    if (s.cash >= w.shortfall + 5) { await page.evaluate((v) => { const i = document.querySelector('[data-input="repay-amount"]'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, w.shortfall + 5); await act(page, 'prop-repay'); await sleep(300); }
    else { await act(page, 'prop-sell-confirm'); await sleep(300); await act(page, 'prop-sell', '[data-mode="quick"]'); await sleep(300); }
    await closeSheet(page);
  }
  // renovate the worst building if affordable (patch), refinance when LTV < 50% and cash thin
  const props = await page.evaluate(() => PE.Game.portfolio().properties.filter(p => !p.renovation).sort((a, b) => a.condition - b.condition));
  if (props.length) {
    const p = props[0];
    await act(page, 'open-property', `[data-id="${p.id}"]`); await sleep(350);
    await shot(page, 'property');
    if (p.condition < 60 && p.type !== 'land') { if (await act(page, 'prop-renovate', '[data-tier="patch"]')) { await sleep(300); await shot(page, 'renovated'); } }
    await closeSheet(page);
  }
  const s = await summary(page);
  for (const p of props) { if (p.type !== 'land' && p.ltv < 0.5 && s.cash < s.netWorth * 0.1) { await act(page, 'open-property', `[data-id="${p.id}"]`); await sleep(350); await act(page, 'prop-refi'); await sleep(300); await closeSheet(page); break; } }
}

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' });
  await sleep(2500);
  await shot(page, 'start');
  await act(page, 'start-new'); await sleep(300);
  await act(page, 'start-family', '[data-id="chen"]');
  await act(page, 'start-trait', '[data-id="negotiator"]');
  await shot(page, 'family');
  await act(page, 'start-begin'); await sleep(800);
  await dismissOverlays(page);
  await shot(page, 'deals');
  // first deal with a mortgage
  ph2.callouts += await page.locator('#deal-guide .callout').count();
  await shot2(page, 'guide-board');
  await tryBuy(page);
  if (await page.locator('.callout--top').count()) { ph2.callouts++; await shot2(page, 'guide-endyear'); }
  await managePortfolio(page);
  await shot(page, 'portfolio');
  ph2.bubbles += await page.locator('.advisor').count();
  await act(page, 'nav', '[data-screen="city"]'); await sleep(2500); await shot(page, 'city');
  // tap a building in the city via onSelect (click centre of canvas is unreliable in software GL, use engine select)
  await act(page, 'nav', '[data-screen="dynasty"]'); await sleep(200); await shot(page, 'dynasty');
  await page.locator('.screen.is-active [data-action="open-settings"]').click(); await sleep(350); await shot(page, 'settings'); await closeSheet(page);
  await act(page, 'nav', '[data-screen="rivals"]'); await sleep(200); await shot(page, 'rivals');
  await act(page, 'year-menu'); await sleep(200); await shot(page, 'menu'); await page.keyboard.press('Escape');
  let skipped = false, years = 0;
  while (true) {
    const s = await summary(page);
    if (s.year >= 1880 || s.status !== 'playing') break;
    years++;
    if (!skipped && s.year >= 1858 && s.year < 1862) { await act(page, 'year-menu'); await sleep(100); await act(page, 'skip-quiet'); await sleep(300); skipped = true; await shot(page, 'skip', true); const r = await dismissOverlays(page, 'report-after-skip'); if (r === 'end') break; continue; }
    await tryBuy(page);
    await managePortfolio(page);
    ph2.bubbles += await page.locator('.advisor').count();
    const r = await endYear(page);
    if (r === 'end') break;
  }
  // Phase 2: dynasty appraisal stat, guide state, share card from the last real report
  const ap = await page.evaluate(() => PEUI.appraisal.stats());
  const gd = await page.evaluate(() => JSON.stringify(PEUI.prefs.guide));
  const seen = await page.evaluate(() => Object.keys((PEUI.prefs.advisor || { seen: {} }).seen).join(','));
  console.log('phase2: appraisal', JSON.stringify(ap), 'guide', gd, 'advisor seen', seen, 'reveals shown', ph2.reveals, 'callouts seen', ph2.callouts, 'bubbles seen', ph2.bubbles);
  await page.evaluate(() => { const r = JSON.parse(JSON.stringify(PEUI.lastReport)); r.eraChanged = true; PEUI._previewReport(r); }); await sleep(1000);
  await act(page, 'share-card'); await sleep(500); await shot2(page, 'share'); await closeSheet(page); await act(page, 'report-next'); await sleep(200);
  await act(page, 'nav', '[data-screen="dynasty"]'); await sleep(200); await shot2(page, 'dynasty');
  const s1 = await summary(page);
  console.log('Year reached', s1.year, 'status', s1.status, 'net worth', s1.netWorth, 'props', s1.properties, 'rank', s1.rank, 'cities', s1.cities.length, 'skipped', skipped);
  if (s1.status === 'bankrupt') { await shot(page, 'end', true); await act(page, 'end-heir'); await sleep(500); await dismissOverlays(page); const s2 = await summary(page); console.log('Heir continues', s2.year, s2.netWorth); }
  // reload to verify save/continue
  await page.reload({ waitUntil: 'load' }); await sleep(1500); await shot(page, 'start-continue');
  await act(page, 'start-continue'); await sleep(600); await dismissOverlays(page); await shot(page, 'deals-late', true);
  // desktop pass
  sfx = '1280';
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, storageState: await ctx.storageState() });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errors.push('desktop: ' + String(e)));
  p2.on('console', m => { if (m.type() === 'error') consoleErrors.push('desktop: ' + m.text()); });
  await p2.goto(URL, { waitUntil: 'load' }); await sleep(2500); await shot(p2, 'start');
  await act(p2, 'start-new'); await sleep(300); await shot(p2, 'family'); await act(p2, 'start-back');
  await act(p2, 'start-continue'); await sleep(600); await dismissOverlays(p2); await shot(p2, 'deals');
  const c = p2.locator('#deal-list .deal').first(); if (await c.count()) { await c.click(); await sleep(400); await shot(p2, 'listing'); await p2.locator('#offer-panel').scrollIntoViewIfNeeded(); await shot(p2, 'offer'); await closeSheet(p2); }
  await act(p2, 'nav', '[data-screen="portfolio"]'); await sleep(200); await shot(p2, 'portfolio');
  const pc = p2.locator('#pf-groups .prop').first(); if (await pc.count()) { await pc.click(); await sleep(400); await shot(p2, 'property'); await closeSheet(p2); }
  await act(p2, 'nav', '[data-screen="city"]'); await sleep(2500); await shot(p2, 'city');
  await act(p2, 'nav', '[data-screen="dynasty"]'); await sleep(200); await shot(p2, 'dynasty');
  await p2.locator('.screen.is-active [data-action="open-settings"]').click(); await sleep(350); await shot(p2, 'settings'); await closeSheet(p2);
  await act(p2, 'nav', '[data-screen="rivals"]'); await sleep(200); await shot(p2, 'rivals');
  await act(p2, 'end-year'); await sleep(300);
  if (await sheetOpen(p2) && (await sheetId(p2)) === 'event') { await shot(p2, 'event'); await resolveEvents(p2); await sleep(200); }
  if (await p2.locator('#titlecard.is-open').count()) { await shot(p2, 'titlecard'); await act(p2, 'titlecard-next'); }
  if (await p2.locator('#report.is-open').count()) { await shot(p2, 'report'); await act(p2, 'report-next'); }
  await dismissOverlays(p2);
  // 360px sanity
  sfx = '360';
  const ctx3 = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
  const p3 = await ctx3.newPage();
  p3.on('pageerror', e => errors.push('360: ' + String(e)));
  await p3.goto(URL, { waitUntil: 'load' }); await sleep(2000); await shot(p3, 'start');
  await act(p3, 'start-continue'); await sleep(600); await dismissOverlays(p3); await shot(p3, 'deals');
  const c3 = p3.locator('#deal-list .deal').first(); if (await c3.count()) { await c3.click(); await sleep(400); await shot(p3, 'listing'); await closeSheet(p3); }
  await act(p3, 'nav', '[data-screen="portfolio"]'); await sleep(200); await shot(p3, 'portfolio');
  await browser.close();
  fs.writeFileSync(`${OUT}/errors.json`, JSON.stringify({ errors, consoleErrors }, null, 2));
  console.log('page errors:', errors.length, 'console errors:', consoleErrors.length);
  if (errors.length) console.log(errors.slice(0, 10));
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 10));
  process.exit(errors.length || consoleErrors.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT FAIL', e); fs.writeFileSync(`${OUT}/errors.json`, JSON.stringify({ errors, consoleErrors, fail: String(e) }, null, 2)); process.exit(2); });
