/* axe-core accessibility pass over the main screens and sheets at 412×915. */
const { launch, OUT } = require('./config');
const fs = require('fs');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function act(page, action, extra) { const el = page.locator(`[data-action="${action}"]${extra || ''}`).first(); if (!(await el.count())) return false; await el.click(); await sleep(150); return true; }
async function run(page, name, ctx) {
  await page.evaluate(AXE);
  const r = await page.evaluate(async (c) => { const res = await axe.run(c || document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }); return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(0, 3).join(' ')) , count: v.nodes.length })); }, ctx || null);
  console.log(`\n== ${name}: ${r.length} violation types`);
  for (const v of r) console.log(`  [${v.impact}] ${v.id} (${v.count}) ${v.help}\n     ${v.nodes.join('\n     ')}`);
  return r;
}
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8790/index.html?seed=7', { waitUntil: 'load' }); await sleep(1500);
  const all = [];
  all.push(...await run(page, 'start'));
  await act(page, 'start-new'); await sleep(300); all.push(...await run(page, 'family select'));
  await act(page, 'start-begin'); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  all.push(...await run(page, 'deal board'));
  await page.locator('#deal-list .deal').first().click(); await sleep(400); all.push(...await run(page, 'listing + offer sheet', '.sheet'));
  await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400);
  await act(page, 'nav', '[data-screen="portfolio"]'); await sleep(200); all.push(...await run(page, 'portfolio'));
  await act(page, 'nav', '[data-screen="city"]'); await sleep(1500); all.push(...await run(page, 'city'));
  await act(page, 'nav', '[data-screen="dynasty"]'); await sleep(200); all.push(...await run(page, 'dynasty'));
  await page.locator('.screen.is-active [data-action="open-settings"]').click(); await sleep(400); all.push(...await run(page, 'settings sheet', '.sheet'));
  await page.locator('.sheet__head [data-action="sheet-close"]').click(); await sleep(400);
  await act(page, 'nav', '[data-screen="rivals"]'); await sleep(200); all.push(...await run(page, 'rivals'));
  await act(page, 'end-year'); await sleep(400);
  while (await page.locator('.sheet.is-open .choice').count()) { all.push(...await run(page, 'event card', '.sheet')); await page.locator('.choice').first().click(); await sleep(300); }
  if (await page.locator('#titlecard.is-open').count()) { await act(page, 'titlecard-next'); }
  if (await page.locator('#report.is-open').count()) all.push(...await run(page, 'year report', '#report'));
  // tap-target audit: every visible interactive element >= 44px in at least one dimension and >= 24 in the other
  const small = await page.evaluate(() => { const out = []; document.querySelectorAll('button, a, input, [role="button"]').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return; const cs = getComputedStyle(el); if (cs.visibility === 'hidden') return; if (Math.max(r.width, r.height) < 44 || Math.min(r.width, r.height) < 28) out.push((el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + (el.textContent || '').trim().slice(0, 30) + '"'); }); return out; });
  console.log('\nTap targets below 44px (report open):', small.length); small.forEach(s => console.log('  ' + s));
  await browser.close();
  const serious = all.filter(v => v.impact === 'serious' || v.impact === 'critical');
  console.log('\nTOTAL violation types:', all.length, 'serious/critical:', serious.length);
  fs.writeFileSync(`${OUT}/axe.json`, JSON.stringify(all, null, 2));
})().catch(e => { console.error('AXE FAIL', e); process.exit(2); });
