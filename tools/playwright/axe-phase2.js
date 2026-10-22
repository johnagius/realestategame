/* axe-core over the Phase 2 states at 412×915: guide callouts, estimate field, advisor bubbles, report scenes + share, dynasty appraisal. */
const { launch, OUT } = require('./config');
const fs = require('fs');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function act(page, action, extra) { const el = page.locator(`[data-action="${action}"]${extra || ''}`).first(); if (!(await el.count())) return false; await el.click(); await sleep(150); return true; }
async function run(page, name, ctx) {
  await page.evaluate(AXE);
  const r = await page.evaluate(async (c) => { const res = await axe.run(c || document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }); return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(0, 3).join(' ')), count: v.nodes.length })); }, ctx || null);
  console.log(`\n== ${name}: ${r.length} violation types`);
  for (const v of r) console.log(`  [${v.impact}] ${v.id} (${v.count}) ${v.help}\n     ${v.nodes.join('\n     ')}`);
  return r;
}
async function small(page, name) {
  const s = await page.evaluate(() => { const out = []; document.querySelectorAll('button, a, input, [role="button"]').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return; const cs = getComputedStyle(el); if (cs.visibility === 'hidden') return; if (Math.max(r.width, r.height) < 44 || Math.min(r.width, r.height) < 28) out.push((el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + (el.textContent || '').trim().slice(0, 30) + '"'); }); return out; });
  console.log(`tap targets < 44px (${name}): ${s.length}`); s.forEach(x => console.log('  ' + x)); return s.length;
}
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8790/index.html?seed=20', { waitUntil: 'load' }); await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await page.reload({ waitUntil: 'load' }); await sleep(1500);
  const all = []; let smalls = 0;
  await act(page, 'start-new'); await sleep(300); await act(page, 'start-family', '[data-id="chen"]'); await act(page, 'start-begin'); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  all.push(...await run(page, 'deal board + guide callout')); smalls += await small(page, 'board');
  await page.locator('#deal-list .deal[data-id="p20"]').click(); await sleep(400); all.push(...await run(page, 'listing: estimate field + appraisal/ltv callouts', '.sheet')); smalls += await small(page, 'listing');
  // stretch deal → advisor bubble in the listing sheet
  await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400);
  const stretch = await page.evaluate(() => { const b = [...document.querySelectorAll('#deal-list .deal')].find(c => /Stretch/.test(c.querySelector('.badge').textContent)); return b ? b.dataset.id : null; });
  if (stretch) { await page.locator(`#deal-list .deal[data-id="${stretch}"]`).click(); await sleep(400); all.push(...await run(page, 'listing: advisor bubble', '.sheet')); smalls += await small(page, 'advisor'); await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400); }
  // buy p20 (so the HUD callout + reveal + portfolio states exist)
  await page.locator('#deal-list .deal[data-id="p20"]').click(); await sleep(400);
  await page.evaluate(() => { const r = document.getElementById('offer-ltv'); r.value = 40; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(page, 'offer-submit'); await sleep(500);
  for (let i = 0; i < 5; i++) { const id = await page.evaluate(() => PEUI.sheet.id()); if (id === 'bought') break; if (id === 'auction') { await page.evaluate(() => { const cur = PE.Game.summary().auction.currentBid; const i = document.getElementById('bid-amount'); i.value = Math.round(cur * 1.08); i.dispatchEvent(new Event('input', { bubbles: true })); }); await act(page, 'auction-bid'); await sleep(400); } else if (id && id.indexOf('listing:') === 0) { if (!(await act(page, 'offer-accept-counter'))) break; await sleep(400); } else break; }
  if ((await page.evaluate(() => PEUI.sheet.id())) === 'bought') { all.push(...await run(page, 'yours sheet + reveal', '.sheet')); }
  if (await page.locator('.sheet.is-open').count()) { await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400); }
  all.push(...await run(page, 'deals + end-year callout')); smalls += await small(page, 'end-year callout');
  await act(page, 'end-year'); await sleep(400);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  if (await page.locator('#titlecard.is-open').count()) { await act(page, 'titlecard-next'); }
  if (await page.locator('#report.is-open').count()) { await sleep(1000); all.push(...await run(page, 'year-1 report (scene, equity line, count-up)', '#report')); smalls += await small(page, 'report'); await act(page, 'report-next'); }
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(300); all.push(...await run(page, 'portfolio + guide/advisor')); smalls += await small(page, 'portfolio');
  const pid = await page.evaluate(() => { const f = PEUI.guide.facts(); return f.reno ? f.reno.id : (f.props[0] && f.props[0].id); });
  if (pid) { await act(page, 'open-property', `[data-id="${pid}"]`); await sleep(400); all.push(...await run(page, 'property sheet + renovate callout', '.sheet')); await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400); }
  // report previews: each scene, advisor bubble, share button, share sheet
  for (const [kind, patch, key] of [['era', { eraChanged: true }, 'era'], ['warning', { warnings: ['negative_cash'] }, 'negative_cash'], ['succession', { succession: true }, 'succession'], ['crash', { cycle: 'depression', equityChange: -900, netWorthBefore: 2000 }, 'margin_call']]) {
    await page.evaluate(([patch, key]) => { const r = JSON.parse(JSON.stringify(PEUI.lastReport)); Object.assign(r, patch); PEUI.prefs.advisor = PEUI.prefs.advisor || { seen: {} }; delete PEUI.prefs.advisor.seen[key]; PEUI.advisor.trigger(key, 'report'); PEUI._previewReport(r); }, [patch, key]);
    await sleep(1000); all.push(...await run(page, 'report preview: ' + kind, '#report'));
    if (kind === 'era') { await act(page, 'share-card'); await sleep(500); all.push(...await run(page, 'share card sheet', '.sheet')); smalls += await small(page, 'share'); await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400); }
    await act(page, 'report-next'); await sleep(200);
  }
  await act(page, 'nav', '[data-screen="dynasty"]'); await sleep(300); all.push(...await run(page, 'dynasty + appraisal skill')); smalls += await small(page, 'dynasty');
  await page.locator('.screen.is-active [data-action="open-settings"]').click(); await sleep(400); all.push(...await run(page, 'settings (guide reset)', '.sheet')); await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400);
  // guide end card
  await page.evaluate(() => { const s = PE.Game.state(); s.year = s.startYear + 3; PEUI.prefs.guide = { skipped: false, done: false, started: true }; PEUI.savePrefs(); PEUI.render('deals'); }); await sleep(300);
  all.push(...await run(page, 'deal board + guide end card')); smalls += await small(page, 'guide end');
  await browser.close();
  const serious = all.filter(v => v.impact === 'serious' || v.impact === 'critical');
  console.log('\nTOTAL violation types:', all.length, 'serious/critical:', serious.length, 'small targets:', smalls);
  fs.writeFileSync(`${OUT}/axe2.json`, JSON.stringify(all, null, 2));
  process.exit(all.length ? 1 : 0);
})().catch(e => { console.error('AXE FAIL', e); process.exit(2); });
