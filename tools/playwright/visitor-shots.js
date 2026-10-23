/* Visitor Economy UI verification (LOCATION-SLICE §6/§9) — through the real UI:
   find a listing in a visitor district, read its letting estimate on the listing sheet,
   buy it, open the property sheet (long mode), switch to short let via the confirm sheet,
   end the year. Also: portfolio row chip and an ineligible property sheet.
   Screenshots at 412×915@2x and 1280×800; axe on the property and listing sheets. */
const { launch, OUT, axeSource } = require('./config');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [], consoleErrors = [], axeReport = [];
let sfx = '412';
async function shot(page, name) { await page.screenshot({ path: `${OUT}/visitor-${name}-${sfx}.png`, timeout: 90000 }); }
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
  if (!(await el.count()) || !(await el.isVisible()) || (await el.isDisabled())) return false;
  await el.click({ timeout: 5000 }); await sleep(150); return true;
}
async function sheetId(page) { return page.evaluate(() => window.PEUI.sheet.id()); }
async function closeSheet(page) { if (await page.locator('.sheet.is-open').count()) { await page.locator('.sheet.is-open .sheet__head [data-action="sheet-close"]').click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape')); await sleep(350); } }
async function resolveEvents(page) {
  let guard = 0;
  while (guard++ < 6) {
    if (!(await page.locator('.sheet.is-open').count()) || (await sheetId(page)) !== 'event') break;
    await page.locator('.choice').first().click(); await sleep(400);
  }
}
async function dismissOverlays(page) {
  let guard = 0;
  while (guard++ < 10) {
    await sleep(150);
    if (await page.locator('#titlecard.is-open').count()) { await act(page, 'titlecard-next'); continue; }
    if (await page.locator('#report.is-open').count()) { await act(page, 'report-next'); continue; }
    if (await page.locator('.sheet.is-open').count() && (await sheetId(page)) === 'event') { await resolveEvents(page); continue; }
    break;
  }
}
async function axe(page, name) {
  await page.evaluate(axeSource());
  const r = await page.evaluate(async () => {
    const res = await axe.run('.sheet.is-open', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
    return res.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')), count: v.nodes.length }));
  });
  console.log(`axe ${name} (${sfx}): ${r.length} violation types`); r.forEach(v => console.log(`  [${v.impact}] ${v.id} (${v.count}) ${v.nodes.join(' | ')}`));
  axeReport.push({ name, sfx, violations: r });
  return r;
}
/* Candidate search through engine evaluation helpers (selection only — purchases go through the UI). */
async function findCandidates(page) {
  return page.evaluate(() => {
    const s = PE.Game.state(), cash = s.cash, out = { cash, elig: null, inelig: null };
    for (const id in s.listings) {
      const l = s.listings[id];
      if (l.seller === 'auction') continue;
      const li = PE.Property.lettingInfo(id); if (!li.ok) continue;
      const q = PE.Finance.mortgageQuote(id, l.maxLtv, 'io');
      const need = q.ok ? q.cashNeeded : l.askingPrice + l.stampDuty;
      const cand = { id, name: l.name, type: l.type, district: l.district, ask: l.askingPrice, need, reasons: li.reasons };
      if (li.eligible && (!out.elig || need < out.elig.need)) out.elig = cand;
      if (!li.eligible && l.type !== 'land' && li.visitor < 1 && (!out.inelig || need < out.inelig.need)) out.inelig = cand;
    }
    return out;
  });
}
/* Open a listing sheet by clicking its deal card, set the offer to asking, submit, ride counters. */
async function buyListing(page, id) {
  await act(page, 'nav', '[data-screen="deals"]'); await sleep(200);
  const card = page.locator(`#deal-list .deal[data-id="${id}"]`);
  if (!(await card.count())) { console.log('  deal card not on board:', id); return false; }
  await card.click(); await sleep(400);
  if ((await sheetId(page)) !== 'listing:' + id) { console.log('  listing sheet did not open for', id); return false; }
  const ask = await page.evaluate((lid) => PE.Game.property(lid).property.askingPrice, id);
  await page.locator('#offer-panel').scrollIntoViewIfNeeded();
  await page.evaluate((v) => { const r = document.getElementById('offer-price'); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, ask);
  await sleep(150);
  if (await page.locator('#offer-submit').isDisabled()) { console.log('  offer disabled (cash short) for', id); await closeSheet(page); return false; }
  await act(page, 'offer-submit'); await sleep(500);
  let guard = 0;
  while (guard++ < 6) {
    const sid = await sheetId(page);
    if (sid === 'bought') { await closeSheet(page); return true; }
    if (sid && sid.indexOf('listing:') === 0) {
      const counter = await page.evaluate((lid) => PE.Game.property(lid).property.counterPrice, id);
      if (counter) { await act(page, 'offer-accept-counter'); await sleep(500); continue; }
      await closeSheet(page); return false;
    }
    break;
  }
  return false;
}

async function flow(page) {
  await page.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  await act(page, 'start-new'); await sleep(300);
  await act(page, 'start-begin'); await sleep(800);
  await dismissOverlays(page);

  // find a short-let-eligible listing and an ineligible one (visitor-0 district); end years until the board offers both
  let c = null;
  for (let y = 0; y < 4; y++) {
    c = await findCandidates(page);
    console.log(`board year scan (${sfx}): cash ${c.cash}, elig ${c.elig ? c.elig.name + ' ' + c.elig.district + ' need ' + c.elig.need : 'none'}, inelig ${c.inelig ? c.inelig.name + ' ' + c.inelig.district + ' need ' + c.inelig.need : 'none'}`);
    if (c.elig && c.inelig && c.elig.need + c.inelig.need < c.cash) break;
    await act(page, 'end-year'); await sleep(300); await dismissOverlays(page);
  }
  if (!c || !c.elig) { console.log('FAIL: no eligible visitor listing found'); return false; }

  // 1. listing sheet with visitor rating + letting estimate, BEFORE purchase (+ axe)
  await act(page, 'nav', '[data-screen="deals"]'); await sleep(200);
  await page.locator(`#deal-list .deal[data-id="${c.elig.id}"]`).click(); await sleep(400);
  const rows = await page.locator('.sheet.is-open .let-listing__row').allTextContents();
  console.log('listing visitor rows:', JSON.stringify(rows));
  if (!rows.length) { console.log('FAIL: no visitor block on the listing sheet'); return false; }
  await shot(page, 'listing');
  await axe(page, 'listing sheet');
  await closeSheet(page);

  // 2. buy it through the UI, then open its property sheet (long mode) via the portfolio
  if (!(await buyListing(page, c.elig.id))) { console.log('FAIL: could not buy the visitor listing'); return false; }
  await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(250);
  await page.locator(`#pf-groups .prop[data-id="${c.elig.id}"]`).click(); await sleep(400);
  if ((await sheetId(page)) !== 'property:' + c.elig.id) { console.log('FAIL: property sheet did not open'); return false; }
  const letText = await page.locator('.sheet.is-open .let').textContent().catch(() => '');
  console.log('letting block (long):', letText.slice(0, 220).replace(/\s+/g, ' '));
  await page.locator('.sheet.is-open .let').scrollIntoViewIfNeeded(); await sleep(200);
  await shot(page, 'sheet-long');
  await axe(page, 'property sheet (long)');

  // 3. switch to short let through the confirm sheet
  if (!(await act(page, 'prop-letmode-confirm', '[data-mode="short"]'))) { console.log('FAIL: no switch-to-short button'); return false; }
  await sleep(300);
  if ((await sheetId(page)) !== 'confirm-letmode') { console.log('FAIL: confirm sheet did not open'); return false; }
  await shot(page, 'confirm');
  await act(page, 'prop-letmode', '[data-mode="short"]'); await sleep(500);
  if ((await sheetId(page)) !== 'property:' + c.elig.id) { console.log('FAIL: property sheet did not reopen after switch'); return false; }
  const mode = await page.evaluate((id) => { const p = PE.Game.state().properties[id]; return { letMode: p.letMode, lock: p.letLockUntil }; }, c.elig.id);
  console.log('after switch:', JSON.stringify(mode));
  if (mode.letMode !== 'short') { console.log('FAIL: engine did not record the switch'); return false; }
  await page.locator('.sheet.is-open .let').scrollIntoViewIfNeeded(); await sleep(200);
  await shot(page, 'sheet-short');
  await closeSheet(page);

  // 4. portfolio row chip
  await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(250);
  const chip = await page.locator(`#pf-groups .prop[data-id="${c.elig.id}"] .chip`, { hasText: 'Short let' }).count();
  console.log('portfolio chip present:', chip > 0);
  const propEl = page.locator(`#pf-groups .prop[data-id="${c.elig.id}"]`);
  await propEl.scrollIntoViewIfNeeded(); await sleep(200);
  await shot(page, 'portfolio-chip');

  // 5. ineligible property sheet (buy one in a visitor-0 district if found and affordable)
  if (c.inelig) {
    if (await buyListing(page, c.inelig.id)) {
      await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(250);
      await page.locator(`#pf-groups .prop[data-id="${c.inelig.id}"]`).click(); await sleep(400);
      const reasons = await page.locator('.sheet.is-open .let__reason').allTextContents();
      const switchBtn = await page.locator('.sheet.is-open [data-action="prop-letmode-confirm"]').count();
      console.log('ineligible reasons:', JSON.stringify(reasons), 'switch buttons:', switchBtn);
      await page.locator('.sheet.is-open .let').scrollIntoViewIfNeeded(); await sleep(200);
      await shot(page, 'sheet-ineligible');
      await axe(page, 'property sheet (ineligible)');
      await closeSheet(page);
    } else console.log('note: ineligible listing not bought (cash/board); skipping its sheet');
  } else console.log('note: no ineligible listing on the board; skipping its sheet');

  // 6. end the year through the UI; the switched property must stay short with its lock running
  const before = await page.evaluate(() => PE.Game.state().year);
  await act(page, 'end-year'); await sleep(400); await dismissOverlays(page);
  const after = await page.evaluate((id) => { const s = PE.Game.state(); return { year: s.year, mode: s.properties[id].letMode, lock: s.properties[id].letLockUntil, cash: s.cash, status: s.status }; }, c.elig.id);
  console.log('year:', before, '→', after.year, JSON.stringify(after));
  if (after.year !== before + 1 || after.mode !== 'short') { console.log('FAIL: year end state wrong'); return false; }
  return true;
}

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  const ok1 = await flow(page);
  await ctx.close();

  sfx = '1280';
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errors.push('desktop: ' + String(e)));
  p2.on('console', m => { if (m.type() === 'error') consoleErrors.push('desktop: ' + m.text()); });
  const ok2 = await flow(p2);
  await ctx2.close();

  await browser.close();
  fs.writeFileSync(`${OUT}/visitor-axe.json`, JSON.stringify(axeReport, null, 2));
  console.log('page errors:', errors.length, 'console errors:', consoleErrors.length, 'flows ok:', ok1 && ok2);
  if (errors.length) console.log(errors.slice(0, 10));
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 10));
  process.exit(errors.length || consoleErrors.length || !(ok1 && ok2) ? 1 : 0);
})().catch(e => { console.error('SCRIPT FAIL', e); process.exit(2); });
