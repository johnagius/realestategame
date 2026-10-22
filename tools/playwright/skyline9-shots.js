/* SKYLINE-9 verification: City screen hero layout.
   Usage: node tools/playwright/skyline9-shots.js <tag>
   Produces tools/playwright/out/ui/skyline9-<tag>-city-412.png (collapsed),
   skyline9-<tag>-city-412-open.png (pull-up expanded, skipped pre-change),
   skyline9-<tag>-city-1280.png, and an axe pass on the city screen at 412. */
const { launch, OUT } = require('./config');
const fs = require('fs');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const TAG = process.argv[2] || 'after';

async function startGame(page) {
  await page.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  await page.locator('[data-action="start-new"]').click(); await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}
async function toCity(page) {
  await page.locator('[data-action="nav"][data-screen="city"]').click(); await sleep(2500);
}
async function axeCity(page, label) {
  await page.evaluate(AXE);
  const r = await page.evaluate(async () => {
    const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
    return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')), count: v.nodes.length }));
  });
  const serious = r.filter(v => v.impact === 'serious' || v.impact === 'critical');
  console.log(`axe[${label}]: ${r.length} violation types, serious/critical: ${serious.length}`);
  for (const v of r) console.log(`  [${v.impact}] ${v.id} (${v.count}) ${v.help} :: ${v.nodes.join(' | ')}`);
  return serious.length;
}

(async () => {
  const browser = await launch();
  let seriousTotal = 0;

  // phone viewport 412x915
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await startGame(page);
  await toCity(page);
  const metrics = await page.evaluate(() => {
    const view = document.querySelector('.city-view');
    const bottom = document.querySelector('.city-bottom');
    const canvas = document.querySelector('.city-view__canvas canvas');
    const r = (el) => el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
    return { viewport: { w: innerWidth, h: innerHeight }, view: r(view), bottom: r(bottom), canvasAttr: canvas ? { w: canvas.width, h: canvas.height } : null, handle: !!document.querySelector('.city-sheet__handle') };
  });
  console.log('metrics:', JSON.stringify(metrics));
  await page.screenshot({ path: `${OUT}/skyline9-${TAG}-city-412.png` });
  const handle = page.locator('.city-sheet__handle');
  if (await handle.count() && await handle.isVisible()) {
    await handle.click(); await sleep(700);
    await page.screenshot({ path: `${OUT}/skyline9-${TAG}-city-412-open.png` });
    const m2 = await page.evaluate(() => {
      const b = document.querySelector('.city-bottom');
      const canvas = document.querySelector('.city-view__canvas canvas');
      return { sheetOpen: b.classList.contains('is-open'), sheetH: Math.round(b.getBoundingClientRect().height), ariaExpanded: document.querySelector('.city-sheet__handle').getAttribute('aria-expanded'), canvasAttr: canvas ? { w: canvas.width, h: canvas.height } : null };
    });
    console.log('expanded:', JSON.stringify(m2));
    await handle.click(); await sleep(700);
    const m3 = await page.evaluate(() => ({ sheetOpen: document.querySelector('.city-bottom').classList.contains('is-open') }));
    console.log('collapsed again:', JSON.stringify(m3));
    // drag test: pointer drag the handle up ~500px (past the snap midpoint)
    await handle.dispatchEvent('pointerdown', { pointerId: 7, clientY: 800, bubbles: true });
    await handle.dispatchEvent('pointermove', { pointerId: 7, clientY: 500, bubbles: true });
    await handle.dispatchEvent('pointermove', { pointerId: 7, clientY: 300, bubbles: true });
    await handle.dispatchEvent('pointerup', { pointerId: 7, clientY: 300, bubbles: true });
    await sleep(700);
    const m4 = await page.evaluate(() => ({ sheetOpenAfterDrag: document.querySelector('.city-bottom').classList.contains('is-open'), sheetH: Math.round(document.querySelector('.city-bottom').getBoundingClientRect().height) }));
    console.log('after drag up 500px:', JSON.stringify(m4));
    if (!m4.sheetOpenAfterDrag) { console.error('DRAG DID NOT OPEN SHEET'); process.exitCode = 4; }
    await handle.click(); await sleep(700); // back to collapsed for axe
  } else {
    console.log('no pull-up handle present (pre-change build)');
  }
  seriousTotal += await axeCity(page, `city ${TAG} 412`);
  await ctx.close();

  // desktop viewport 1280x800
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page2 = await ctx2.newPage();
  page2.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await startGame(page2);
  await toCity(page2);
  const md = await page2.evaluate(() => {
    const r = (el) => el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
    const handle = document.querySelector('.city-sheet__handle');
    return { view: r(document.querySelector('.city-view')), bottom: r(document.querySelector('.city-bottom')), handleVisible: handle ? getComputedStyle(handle).display !== 'none' : false };
  });
  console.log('desktop metrics:', JSON.stringify(md));
  await page2.screenshot({ path: `${OUT}/skyline9-${TAG}-city-1280.png` });
  await ctx2.close();

  await browser.close();
  console.log(`skyline9 ${TAG} done; serious/critical axe: ${seriousTotal}`);
  if (seriousTotal > 0) process.exit(3);
})().catch(e => { console.error(e); process.exit(1); });
