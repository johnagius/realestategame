/* Phase 2 flows through the real UI: guide years 1–3, advisor bubbles, estimate input + reveal,
   report scenes (6), share card PNG, dynasty appraisal stat. Screenshots at 412×915@2x and 1280×800. */
const { chromium, launch, OUT } = require('./config');
const fs = require('fs');
const URL = 'http://127.0.0.1:8790/index.html?seed=20';
const errors = [], consoleErrors = [];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let sfx = '412';
async function shot(page, name) { await page.screenshot({ path: `${OUT}/${name}-${sfx}.png`, fullPage: false }); }
async function act(page, action, extra) { const el = page.locator(`[data-action="${action}"]${extra || ''}`).first(); if (await el.count() === 0) return false; if (!(await el.isVisible())) return false; if (await el.isDisabled()) return false; await el.click({ timeout: 5000 }); await sleep(150); return true; }
async function sheetOpen(page) { return page.locator('.sheet.is-open').count().then(n => n > 0); }
async function sheetId(page) { return page.evaluate(() => (window.PEUI.sheet.id())); }
async function summary(page) { return page.evaluate(() => PE.Game.summary()); }
async function closeSheet(page) { if (await sheetOpen(page)) { await page.locator('.sheet.is-open .sheet__head [data-action="sheet-close"]').click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape')); await sleep(350); } }
async function resolveEvents(page) {
  let guard = 0;
  while (guard++ < 6) {
    if (!(await sheetOpen(page)) || (await sheetId(page)) !== 'event') break;
    await page.locator('.choice').first().click(); await sleep(400);
  }
}
async function dismissOverlays(page, tag) {
  let guard = 0;
  while (guard++ < 10) {
    await sleep(150);
    if (await page.locator('#titlecard.is-open').count()) { await act(page, 'titlecard-next'); continue; }
    if (await page.locator('#report.is-open').count()) { if (tag) { await sleep(1100); await shot(page, tag); } await act(page, 'report-next'); continue; }
    if (await sheetOpen(page) && (await sheetId(page)) === 'event') { await resolveEvents(page); continue; }
    break;
  }
}
async function setRange(page, id, v) { await page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]); await sleep(100); }

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(2000);
  await act(page, 'start-new'); await sleep(300);
  await act(page, 'start-family', '[data-id="chen"]');
  await act(page, 'start-begin'); await sleep(800);
  await dismissOverlays(page);
  // Year 1: board callout
  await page.locator('#deal-guide').scrollIntoViewIfNeeded(); await sleep(200);
  await shot(page, 'guide-y1-board');
  // Advisor: stretch deal (year 1, before buying)
  const stretch0 = await page.evaluate(() => { const b = [...document.querySelectorAll('#deal-list .deal')].find(c => /Stretch/.test(c.querySelector('.badge').textContent)); return b ? b.dataset.id : null; });
  if (stretch0) { await page.locator(`#deal-list .deal[data-id="${stretch0}"]`).click(); await sleep(400); await shot(page, 'advisor-stretch'); await closeSheet(page); } else console.log('no stretch deal in year 1');
  // Advisor: auction (year 1): open the auction listing, place the opening bid, screenshot, withdraw
  const auc0 = await page.evaluate(() => { const a = PE.Market.listings('london').listings.find(l => l.seller === 'auction'); return a ? a.id : null; });
  if (auc0) { await page.locator(`#deal-list .deal[data-id="${auc0}"]`).click(); await sleep(400); if (!(await page.locator('#offer-submit').isDisabled())) { await act(page, 'offer-submit'); await sleep(500); if ((await sheetId(page)) === 'auction') { await shot(page, 'advisor-auction'); await act(page, 'auction-withdraw'); await sleep(300); } else { console.log('auction outcome sheet:', await sheetId(page)); } } else console.log('auction not affordable'); await closeSheet(page); } else console.log('no auction in year 1');
  // pick the listing whose asking is below the low estimate (underpriced), else the best ratio
  const pick = await page.evaluate(() => { const ls = PE.Market.listings('london').listings; let best = null; for (const l of ls) { if (l.seller === 'auction' || l.revealed) continue; const r = l.askingPrice / l.lowEstimate; if (!best || r < best.r) best = { id: l.id, r, ask: l.askingPrice, lo: l.lowEstimate, hi: l.highEstimate }; } return best; });
  console.log('pick', pick);
  await page.locator(`#deal-list .deal[data-id="${pick.id}"]`).click(); await sleep(400);
  await page.locator('#estimate-field').scrollIntoViewIfNeeded(); await sleep(150);
  await shot(page, 'guide-y1-appraisal');
  // estimate: band midpoint + 6% so the reveal has something to say; use the stepper once too
  const mid = Math.round((pick.lo + pick.hi) / 2);
  await page.evaluate((v) => { const i = document.getElementById('est-input'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(mid * 1.06));
  await act(page, 'est-step', '[data-step^="-"]'); await sleep(100);
  const stored = await page.evaluate((id) => PEUI.appraisal.get(id), pick.id);
  console.log('estimate stored', stored, 'mid', mid);
  await page.locator('#offer-ltv').scrollIntoViewIfNeeded(); await sleep(150);
  await setRange(page, 'offer-ltv', 40);
  await shot(page, 'guide-y1-ltv');
  await setRange(page, 'offer-price', Math.min(pick.ask, Math.round(mid * 0.95)));
  await act(page, 'offer-submit'); await sleep(500);
  let id = await sheetId(page), guard = 0;
  while (guard++ < 5 && id !== 'bought') {
    if (id && id.indexOf('listing:') === 0) { const counter = await page.evaluate((id) => PE.Game.property(id).property.counterPrice, pick.id); if (counter) { await act(page, 'offer-accept-counter'); await sleep(500); } else break; }
    else if (id === 'auction') { await shot(page, 'advisor-auction'); await act(page, 'auction-bid'); await sleep(500); }
    else break;
    id = await sheetId(page);
  }
  console.log('after offer sheet =', id);
  if (id === 'bought') await shot(page, 'estimate-reveal');
  await closeSheet(page); await sleep(300);
  const s1 = await summary(page); console.log('props after buy', s1.properties, 'stage', await page.evaluate(() => PEUI.guide.stage()));
  await page.locator('.screen.is-active .screen__scroll').evaluate(el => { el.scrollTop = 0; }); await sleep(150);
  console.log('end-year callout present', await page.locator('.callout--top').count());
  await shot(page, 'guide-y1-endyear');
  // End year 1 → report with equity line
  await act(page, 'end-year'); await sleep(300);
  await dismissOverlays(page, 'report-y1');
  // Year 2: portfolio callout + renovate callout
  await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(300);
  console.log('y2 stage', await page.evaluate(() => PEUI.guide.stage()));
  await shot(page, 'guide-y2-portfolio');
  const p1 = await page.evaluate(() => PEUI.guide.facts().reno && PEUI.guide.facts().reno.id);
  if (p1) { await act(page, 'open-property', `[data-id="${p1}"]`); await sleep(400); await page.locator('.callout').first().scrollIntoViewIfNeeded().catch(() => {}); await shot(page, 'guide-y2-renovate'); await act(page, 'prop-renovate', '[data-tier="patch"]'); await sleep(300); await closeSheet(page); }
  await act(page, 'end-year'); await sleep(300); await dismissOverlays(page);
  // Year 3: refinance callout (LTV 40% < 50%)
  await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(300);
  console.log('y3 stage', await page.evaluate(() => PEUI.guide.stage()));
  await shot(page, 'guide-y3-portfolio');
  const refiId = await page.evaluate(() => PEUI.guide.facts().refi && PEUI.guide.facts().refi.id);
  if (refiId) { await act(page, 'open-property', `[data-id="${refiId}"]`); await sleep(400); await page.locator('#refi-ltv').scrollIntoViewIfNeeded(); await shot(page, 'guide-y3-refinance'); await closeSheet(page); }
  await act(page, 'nav', '[data-screen="deals"]'); await sleep(200);
  await act(page, 'end-year'); await sleep(300); await dismissOverlays(page);
  // Year 4: end card
  await act(page, 'nav', '[data-screen="deals"]'); await sleep(300);
  console.log('y4 stage', await page.evaluate(() => PEUI.guide.stage()));
  await page.locator('#deal-guide').scrollIntoViewIfNeeded(); await shot(page, 'guide-end');
  await act(page, 'guide-done'); await sleep(200);
  console.log('guide prefs', await page.evaluate(() => JSON.stringify(PEUI.prefs.guide)));
  // Report scenes + advisor report bubbles via preview of the last real report
  const kinds = [['era', { eraChanged: true, eraName: 'Victorian' }], ['warning', { warnings: ['negative_cash'], cashAfter: -120 }], ['succession', { succession: true }], ['crash', { cycle: 'depression', headline: 'Depression: values fell across the board.' }], ['deal', {}], ['quiet', {}]];
  const trig = { era: 'era', warning: 'negative_cash', succession: 'succession', crash: 'margin_call' };
  for (const [kind, patch] of kinds) {
    await page.evaluate(([kind, patch, key]) => {
      const r = JSON.parse(JSON.stringify(PEUI.lastReport)); Object.assign(r, patch);
      if (kind === 'deal') { r.deals = [{ kind: 'sale', text: 'Sold Albion Terrace for £900.' }]; r.goals.achieved = [{ desc: 'Buy a property below its asking price this year.', reward: 20 }]; r.warnings = []; r.cycle = 'growth'; }
      if (kind === 'quiet') { r.deals = []; r.goals.achieved = []; r.warnings = []; r.cycle = 'growth'; r.succession = false; r.eraChanged = false; r.equityChange = 40; r.netWorthBefore = 3000; }
      if (kind === 'crash') { r.equityChange = -800; r.netWorthBefore = 3000; }
      if (key) { PEUI.prefs.advisor = PEUI.prefs.advisor || { seen: {} }; delete PEUI.prefs.advisor.seen[key]; PEUI.advisor.trigger(key, 'report'); }
      PEUI._previewReport(r);
    }, [kind, patch, trig[kind] || null]);
    await sleep(1100);
    await shot(page, 'report-scene-' + kind);
    if (kind === 'era') {
      await act(page, 'share-card'); await sleep(500); await shot(page, 'share-card');
      const data = await page.evaluate(() => document.querySelector('.share-preview').src);
      fs.writeFileSync(`${OUT}/share-card-${sfx}.png.b64`, data.split(',')[1]);
      fs.writeFileSync(`${OUT}/share-card-1080.png`, Buffer.from(data.split(',')[1], 'base64'));
      await closeSheet(page);
    }
    await act(page, 'report-next'); await sleep(200);
  }
  // Appraisal reveal through a rival purchase: estimate every listing, end years until one is bought by a rival
  await page.evaluate(() => { const ls = PE.Market.listings('london').listings; for (const l of ls) if (!l.revealed) PEUI.appraisal.set(l.id, Math.round((l.lowEstimate + l.highEstimate) / 2)); });
  let revealed = 0;
  for (let y = 0; y < 4; y++) { await act(page, 'end-year'); await sleep(300); await dismissOverlays(page); revealed = await page.evaluate(() => PEUI.prefs.appraisal.reveals.length); if (revealed >= 2) break; await page.evaluate(() => { const ls = PE.Market.listings('london').listings; for (const l of ls) if (!l.revealed && PEUI.appraisal.get(l.id) === null) PEUI.appraisal.set(l.id, Math.round((l.lowEstimate + l.highEstimate) / 2)); }); }
  console.log('reveals recorded', revealed, await page.evaluate(() => JSON.stringify(PEUI.prefs.appraisal.reveals.slice(-3))));
  await page.evaluate(() => { const r = JSON.parse(JSON.stringify(PEUI.lastReport)); PEUI._previewReport(r); });
  await sleep(1100); await page.locator('#report .report__scroll').evaluate(el => el.scrollTop = el.scrollHeight); await sleep(200); await shot(page, 'report-reveals'); await act(page, 'report-next');
  await act(page, 'nav', '[data-screen="dynasty"]'); await sleep(300);
  await page.locator('[aria-label="Appraisal skill"]').scrollIntoViewIfNeeded(); await shot(page, 'dynasty-appraisal');
  console.log('appraisal stats', await page.evaluate(() => JSON.stringify(PEUI.appraisal.stats())));
  // Skip guide path + settings reset
  await page.evaluate(() => { PEUI.prefs.guide = { skipped: false, done: false, started: false }; PEUI.savePrefs(); });
  await page.locator('.screen.is-active [data-action="open-settings"]').click(); await sleep(350); await shot(page, 'settings-guide'); await closeSheet(page);

  // ---- Desktop pass (fresh game so the guide shows) ----
  sfx = '1280';
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errors.push('desktop: ' + String(e)));
  p2.on('console', m => { if (m.type() === 'error') consoleErrors.push('desktop: ' + m.text()); });
  await p2.goto(URL, { waitUntil: 'load' }); await p2.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p2.reload({ waitUntil: 'load' }); await sleep(2000);
  await act(p2, 'start-new'); await sleep(300); await act(p2, 'start-family', '[data-id="chen"]'); await act(p2, 'start-begin'); await sleep(800); await dismissOverlays(p2);
  await shot(p2, 'guide-y1-board');
  // same preliminary engine calls as the phone pass so the seeded auction resolves the same way
  if (stretch0) { await p2.locator(`#deal-list .deal[data-id="${stretch0}"]`).click(); await sleep(300); await closeSheet(p2); }
  if (auc0) { await p2.locator(`#deal-list .deal[data-id="${auc0}"]`).click(); await sleep(300); if (!(await p2.locator('#offer-submit').isDisabled())) { await act(p2, 'offer-submit'); await sleep(400); if ((await sheetId(p2)) === 'auction') { await act(p2, 'auction-withdraw'); await sleep(300); } } await closeSheet(p2); }
  await p2.locator(`#deal-list .deal[data-id="${pick.id}"]`).click(); await sleep(400);
  await p2.evaluate((v) => { const i = document.getElementById('est-input'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(mid * 1.06));
  await act(p2, 'est-step', '[data-step^="-"]'); await sleep(100);
  await p2.locator('#estimate-field').scrollIntoViewIfNeeded(); await shot(p2, 'guide-y1-appraisal');
  await p2.locator('#offer-ltv').scrollIntoViewIfNeeded(); await setRange(p2, 'offer-ltv', 40); await shot(p2, 'guide-y1-ltv');
  await setRange(p2, 'offer-price', Math.min(pick.ask, Math.round(mid * 0.95))); await act(p2, 'offer-submit'); await sleep(500);
  let id2 = await sheetId(p2), g2 = 0;
  while (g2++ < 5 && id2 !== 'bought') {
    if (id2 && id2.indexOf('listing:') === 0) { const counter = await p2.evaluate((id) => PE.Game.property(id).property.counterPrice, pick.id); if (counter) { await act(p2, 'offer-accept-counter'); await sleep(500); } else break; }
    else if (id2 === 'auction') { await shot(p2, 'advisor-auction'); await act(p2, 'auction-bid'); await sleep(500); }
    else break;
    id2 = await sheetId(p2);
  }
  console.log('desktop after offer sheet =', id2);
  if (id2 === 'bought') await shot(p2, 'estimate-reveal');
  await closeSheet(p2); await sleep(200); await p2.locator('.screen.is-active .screen__scroll').evaluate(el => { el.scrollTop = 0; }); await sleep(150); await shot(p2, 'guide-y1-endyear');
  await act(p2, 'end-year'); await sleep(300); await dismissOverlays(p2, 'report-y1');
  await act(p2, 'nav', '[data-screen="portfolio"]'); await sleep(300); await shot(p2, 'guide-y2-portfolio');
  const p1d = await p2.evaluate(() => PEUI.guide.facts().reno && PEUI.guide.facts().reno.id);
  if (p1d) { await act(p2, 'open-property', `[data-id="${p1d}"]`); await sleep(400); await shot(p2, 'guide-y2-renovate'); await closeSheet(p2); }
  await p2.evaluate(() => { const r = JSON.parse(JSON.stringify(PEUI.lastReport)); r.eraChanged = true; PEUI.advisor.trigger('era', 'report'); PEUI._previewReport(r); }); await sleep(1100); await shot(p2, 'report-scene-era');
  await act(p2, 'share-card'); await sleep(500); await shot(p2, 'share-card'); await closeSheet(p2); await act(p2, 'report-next');
  await act(p2, 'nav', '[data-screen="dynasty"]'); await sleep(300); await shot(p2, 'dynasty-appraisal');
  // ---- 360px sanity: board callout + listing sheet with estimate field ----
  sfx = '360';
  const ctx3 = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p3 = await ctx3.newPage();
  p3.on('pageerror', e => errors.push('360: ' + String(e)));
  await p3.goto(URL, { waitUntil: 'load' }); await p3.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p3.reload({ waitUntil: 'load' }); await sleep(1500);
  await act(p3, 'start-new'); await sleep(300); await act(p3, 'start-family', '[data-id="chen"]'); await act(p3, 'start-begin'); await sleep(800); await dismissOverlays(p3);
  await p3.locator('#deal-guide').scrollIntoViewIfNeeded(); await shot(p3, 'guide-y1-board');
  await p3.locator(`#deal-list .deal[data-id="${pick.id}"]`).click(); await sleep(400); await p3.locator('#estimate-field').scrollIntoViewIfNeeded(); await shot(p3, 'guide-y1-appraisal');
  await closeSheet(p3);
  if (stretch0) { await p3.locator(`#deal-list .deal[data-id="${stretch0}"]`).click(); await sleep(400); await shot(p3, 'advisor-stretch'); await closeSheet(p3); }
  await browser.close();
  fs.writeFileSync(`${OUT}/errors.json`, JSON.stringify({ errors, consoleErrors }, null, 2));
  console.log('page errors:', errors.length, 'console errors:', consoleErrors.length);
  if (errors.length) console.log(errors.slice(0, 10));
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 10));
  process.exit(errors.length || consoleErrors.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT FAIL', e); process.exit(2); });
