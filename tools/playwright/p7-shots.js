/* P7 verification: dynasty share card — crest, motto, era, stats — and the PNG export. */
const { launch, OUT } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function openCard(page) {
  await page.evaluate(() => PEUI.actions['share-card']());
  await page.locator('.sheet.is-open img.share-preview').waitFor({ state: 'visible', timeout: 8000 });
  await sleep(400);
}
async function pngInfo(page) {
  return page.evaluate(async () => {
    const cv = await PEUI.shareCard(PEUI.shownReport || null);
    const url = cv.toDataURL('image/png');
    const buf = await (await fetch(url)).arrayBuffer();
    const u = new Uint8Array(buf);
    const be = (o) => ((u[o] << 24) | (u[o + 1] << 16) | (u[o + 2] << 8) | u[o + 3]) >>> 0;
    return { bytes: buf.byteLength, dataUrlLength: url.length, w: be(16), h: be(20) };
  });
}
async function startGame(page) {
  await page.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  await page.locator('[data-action="start-new"]').click(); await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
}

(async () => {
  const browser = await launch();

  // phone viewport
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await startGame(page);
  await openCard(page);
  await page.screenshot({ path: `${OUT}/p7-share-sheet-412.png` });
  const info = await pngInfo(page);
  console.log('share PNG', JSON.stringify(info));
  if (info.w !== 1080 || info.h !== 1080 || info.bytes < 30000) { console.error('BAD PNG EXPORT'); await browser.close(); process.exit(1); }
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.locator('[data-action="share-download"]').click()]);
  const p = `${OUT}/p7-share-1080.png`;
  await dl.saveAs(p);
  const fs = require('fs'), sz = fs.statSync(p).size;
  console.log('downloaded PNG bytes', sz);
  if (sz < 30000) { console.error('BAD DOWNLOAD'); await browser.close(); process.exit(1); }
  await ctx.close();

  // desktop viewport
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page2 = await ctx2.newPage();
  page2.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await startGame(page2);
  await openCard(page2);
  await page2.screenshot({ path: `${OUT}/p7-share-sheet-1280.png` });
  await ctx2.close();

  await browser.close();
  console.log('p7 shots done');
})().catch(e => { console.error(e); process.exit(1); });
