/* P8.2: end-to-end victory runs through the real UI.
   Part 1 — full campaign (Chen, seed 42): new game → 2030 end screen.
     Asserts: completion registers (status 'ended', The Long Game awarded),
     save/reload preserves progress mid-run, legacy recorded on end-new.
   Part 2 — crash1929 scenario: real-UI start (scenarios sheet) → final report.
     Asserts: scenario result registers; The Long Game must NOT be awarded
     outside campaign mode (P8.1 finding 2 — fails until the gate lands).
   Output: tools/playwright/out/ui/p8-*.png */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [], consoleErrors = [];
const checks = [];
function check(name, cond, detail) { checks.push({ name, pass: !!cond, detail }); console.log((cond ? 'PASS' : 'FAIL') + ' — ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }

async function act(page, action, extra) {
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('#titlecard.is-open').count())) break;
    if (await page.locator('#titlecard.is-open [data-action="end-heir"], #titlecard.is-open [data-action="end-new"]').count()) break;
    const next = page.locator('#titlecard.is-open [data-action="titlecard-next"]');
    if (!(await next.count())) break;
    await next.click({ timeout: 5000 }).catch(() => {}); await sleep(200);
  }
  const sel = `[data-action="${action}"]${extra || ''}`; const el = page.locator(sel).first();
  if (!(await el.count()) || !(await el.isVisible()) || (await el.isDisabled())) return false;
  await el.click({ timeout: 5000 }); await sleep(120); return true;
}
async function sheetOpen(page) { return (await page.locator('.sheet.is-open').count()) > 0; }
async function sheetId(page) { return page.evaluate(() => window.PEUI.sheet.id()); }
async function summary(page) { return page.evaluate(() => PE.Game.summary()); }
async function closeSheet(page) { if (await sheetOpen(page)) { await page.locator('.sheet.is-open .sheet__head [data-action="sheet-close"]').click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape')); await sleep(300); } }
async function resolveEvents(page) {
  let guard = 0;
  while (guard++ < 6) {
    if (!(await sheetOpen(page)) || (await sheetId(page)) !== 'event') break;
    const labels = await page.locator('.choice').allTextContents();
    const s = await summary(page);
    let idx = 0;
    const thin = s.cash < 0.15 * Math.max(1, s.netWorth);
    for (let i = 0; i < labels.length; i++) { const l = labels[i].toLowerCase(); if (thin && /pay|invest|buy|give|donate/.test(l)) continue; if (/gamble/.test(l) && s.cash < 0.3 * s.netWorth) continue; idx = i; break; }
    await page.locator('.choice').nth(idx).click(); await sleep(350);
  }
}
async function dismissOverlays(page, tag, shots) {
  let guard = 0;
  while (guard++ < 12) {
    await sleep(150);
    if (await page.locator('#titlecard.is-open').count()) {
      if (await page.locator('#titlecard.is-open [data-action="end-heir"], #titlecard.is-open [data-action="end-new"]').count()) return 'end';
      await act(page, 'titlecard-next'); continue;
    }
    if (await page.locator('#report.is-open').count()) {
      if (shots && !shots.has(tag)) { shots.add(tag); await sleep(800); await page.screenshot({ path: `${OUT}/p8-${tag}.png`, timeout: 90000 }); }
      await act(page, 'report-next'); continue;
    }
    if (await sheetOpen(page) && (await sheetId(page)) === 'event') { await resolveEvents(page); continue; }
    break;
  }
  return 'ok';
}
/* Minimal competent play: respond to offers, clear margin calls, buy the occasional
   below-estimate deal. Enough to keep the house alive to 2030 without optimising. */
async function manage(page) {
  const offers = await page.evaluate(() => PE.Market.offersOnMyProperties().offers);
  for (const o of offers) { await act(page, 'offer-respond', `[data-id="${o.id}"][data-accept="${o.premium >= 25 ? 1 : 0}"]`); await sleep(150); }
  const fs = await page.evaluate(() => PE.Finance.summary());
  for (const w of fs.covenantWarnings) {
    if (w.kind !== 'margin_call') continue;
    await act(page, 'open-property', `[data-id="${w.propertyId}"]`); await sleep(300);
    const s = await summary(page);
    if (s.cash >= w.shortfall + 5) { await page.evaluate((v) => { const i = document.querySelector('[data-input="repay-amount"]'); if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } }, w.shortfall + 5); await act(page, 'prop-repay'); await sleep(250); }
    else { await act(page, 'prop-sell-confirm'); await sleep(250); await act(page, 'prop-sell', '[data-mode="quick"]'); await sleep(250); }
    await closeSheet(page);
  }
}
async function tryBuy(page) {
  await act(page, 'nav', '[data-screen="deals"]'); await sleep(200);
  await act(page, 'deal-sort', '[data-sort="value"]'); await sleep(150);
  const cards = page.locator('#deal-list .deal');
  for (let i = 0; i < 3; i++) {
    await closeSheet(page);
    if (i >= await cards.count()) break;
    const badge = await cards.nth(i).locator('.badge').first().textContent({ timeout: 3000 }).catch(() => '');
    if (/Stretch/.test(badge)) continue;
    await cards.nth(i).click(); await sleep(300);
    if (!(await sheetOpen(page))) continue;
    const info = await page.evaluate(() => { const id = PEUI.sheet.id().split(':')[1]; const p = PE.Game.property(id).property; return { ask: p.askingPrice, lo: p.lowEstimate, hi: p.highEstimate, seller: p.seller, revealed: p.revealed, tv: p.trueValue }; });
    const est = info.revealed ? info.tv : (info.lo + info.hi) / 2;
    if (info.ask / est > 1.0 && info.seller !== 'auction') { await closeSheet(page); continue; }
    await page.locator('#offer-panel').scrollIntoViewIfNeeded();
    const target = Math.min(info.ask, Math.round(est * 0.95));
    await page.evaluate((v) => { const r = document.getElementById('offer-price'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } }, target);
    await sleep(100);
    const submit = page.locator('#offer-submit');
    if (!(await submit.count()) || (await submit.isDisabled())) { await closeSheet(page); continue; }
    await act(page, 'offer-submit'); await sleep(350);
    let guard = 0;
    while (guard++ < 6) {
      const id = await sheetId(page);
      if (id === 'bought') { await closeSheet(page); return true; }
      if (id === 'auction') {
        const cur = await page.evaluate(() => PE.Game.summary().auction.currentBid);
        if (cur * 1.04 > est) { await act(page, 'auction-withdraw'); await sleep(250); break; }
        await page.evaluate((v) => { const i = document.getElementById('bid-amount'); if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } }, Math.round(cur * 1.04));
        await act(page, 'auction-bid'); await sleep(350); continue;
      }
      if (id && id.indexOf('listing:') === 0) {
        const counter = await page.evaluate(() => { const id = PEUI.sheet.id().split(':')[1]; return PE.Game.property(id).property.counterPrice; });
        if (counter && counter <= est) { await act(page, 'offer-accept-counter'); await sleep(350); continue; }
        await closeSheet(page); break;
      }
      break;
    }
  }
  return false;
}

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(2000);

  /* ---------- Part 1: full campaign ---------- */
  await act(page, 'start-new'); await sleep(300);
  await act(page, 'start-family', '[data-id="chen"]');
  await act(page, 'start-begin'); await sleep(800);
  await dismissOverlays(page);
  const shots = new Set();
  let reloadChecked = false, heirs = 0, yearsPlayed = 0, endState = null;
  while (true) {
    const s = await summary(page);
    if (s.status !== 'playing') break;
    yearsPlayed++;
    if (yearsPlayed % 4 === 1 && s.properties < 6) await tryBuy(page);
    await manage(page);
    await act(page, 'end-year'); await sleep(200);
    const r = await dismissOverlays(page, 'campaign-' + (yearsPlayed % 60 === 0 ? 'y' + (1850 + yearsPlayed) : 'report'), shots);
    const s2 = await summary(page);
    if (s2.status === 'bankrupt') {
      if (s2.year > s2.endYear) { endState = s2; break; } // fell at the finish line: terminal
      heirs++;
      await act(page, 'end-heir'); await sleep(500); await dismissOverlays(page);
    }
    if (!reloadChecked && s2.year >= 1900 && s2.status === 'playing') {
      reloadChecked = true;
      const before = { year: s2.year, cash: s2.cash, nw: s2.netWorth, props: s2.properties };
      await page.reload({ waitUntil: 'load' }); await sleep(2000);
      await act(page, 'start-continue'); await sleep(800); await dismissOverlays(page);
      const after = await summary(page);
      check('save/reload preserves progress mid-campaign', after.year === before.year && after.cash === before.cash && after.netWorth === before.nw && after.properties === before.props, { before, after: { year: after.year, cash: after.cash, nw: after.netWorth, props: after.properties } });
    }
    if (r === 'end' && s2.status !== 'playing') { endState = await summary(page); break; }
    if (yearsPlayed > 220) { console.log('ABORT: runaway loop'); break; }
  }
  const fin = await page.evaluate(() => ({ status: PE.S().status, year: PE.S().year, endYear: PE.S().endYear, achievements: PE.S().goals.achievements.slice(), legacy: PE.Goals.legacyScore(), eraDone: Object.keys(PE.S().goals.eraDone), cash: PE.S().cash }));
  check('campaign runs to the end screen (status ended past endYear)', fin.status === 'ended' && fin.year > fin.endYear, fin);
  check('The Long Game awarded on campaign completion', fin.achievements.indexOf('the_long_game') >= 0, fin.achievements.length + ' achievements');
  await sleep(600);
  await page.screenshot({ path: `${OUT}/p8-campaign-end.png`, timeout: 90000 });
  // end-new records legacy and returns to the start screen
  await act(page, 'end-new'); await sleep(800);
  const meta = await page.evaluate(() => PE.Storage.loadMeta());
  check('legacy recorded exactly once for the finished run', (meta.runs || []).length === 1 && meta.legacyPoints === fin.legacy, { runs: (meta.runs || []).length, legacyPoints: meta.legacyPoints, legacy: fin.legacy });
  console.log('campaign: years played', yearsPlayed, 'heir continuations', heirs, 'final year', fin.year);

  /* ---------- Part 2: crash1929 scenario through the real UI ---------- */
  await page.goto(URL, { waitUntil: 'load' }); await sleep(2000);
  await act(page, 'start-new'); await sleep(300);
  await act(page, 'open-scenarios'); await sleep(500);
  await act(page, 'scen-start', '[data-id="crash1929"]'); await sleep(800);
  await dismissOverlays(page);
  const scenSeed = await page.evaluate(() => PE.S().seed);
  let sYears = 0;
  while (true) {
    const s = await summary(page);
    if (s.status !== 'playing') break;
    sYears++;
    await manage(page);
    await act(page, 'end-year'); await sleep(200);
    const r = await dismissOverlays(page, 'scenario-report', shots);
    const s2 = await summary(page);
    if (s2.status === 'bankrupt' && s2.year <= s2.endYear) { await act(page, 'end-heir'); await sleep(500); await dismissOverlays(page); }
    if (sYears > 25) { console.log('ABORT: scenario runaway'); break; }
  }
  const scen = await page.evaluate(() => ({ status: PE.S().status, year: PE.S().year, scenario: PE.S().scenario, achievements: PE.S().goals.achievements.slice() }));
  check('scenario run reaches a terminal state with a result', scen.scenario && (scen.scenario.result === 'won' || scen.scenario.result === 'lost'), { seed: scenSeed, result: scen.scenario && scen.scenario.result, status: scen.status, year: scen.year });
  check('The Long Game NOT awarded in scenario mode (f2)', scen.achievements.indexOf('the_long_game') < 0);
  await sleep(600);
  await page.screenshot({ path: `${OUT}/p8-scenario-end.png`, timeout: 90000 });

  console.log('page errors:', errors.length, 'console errors:', consoleErrors.length);
  if (errors.length) console.log(errors.slice(0, 8));
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 8));
  const fails = checks.filter(c => !c.pass).length;
  console.log('P8.2 checks:', checks.length - fails + '/' + checks.length, 'pass');
  await browser.close();
  process.exit(fails || errors.length || consoleErrors.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT FAIL', e); process.exit(2); });
