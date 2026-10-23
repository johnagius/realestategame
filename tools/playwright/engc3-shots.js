/* ENG-C3 quick render check: the six era plates in an in-page gallery (same-origin),
   plus one real era title card (victorian -> gilded) through the actual UI. */
const { launch, OUT, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));

  await page.goto(URL, { waitUntil: 'load' }); await sleep(800);
  await page.evaluate(() => new Promise(res => {
    const eras = ['victorian', 'gilded', 'crisis', 'boom', 'modern', 'digital'];
    const gal = document.createElement('div');
    gal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#141210;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;padding:16px;';
    let left = eras.length;
    eras.forEach(id => {
      const fig = document.createElement('figure'); fig.style.cssText = 'margin:0;';
      const img = new Image(); img.src = 'assets/era/' + id + '.svg';
      img.style.cssText = 'width:400px;height:auto;border-radius:2px;box-shadow:0 12px 32px rgba(0,0,0,.45);';
      img.onload = img.onerror = () => { if (--left === 0) res(); };
      const cap = document.createElement('figcaption'); cap.textContent = id;
      cap.style.cssText = 'color:#F1EADA;font:14px serif;text-align:center;margin-top:6px;';
      fig.appendChild(img); fig.appendChild(cap); gal.appendChild(fig);
    });
    document.body.appendChild(gal);
  }));
  await sleep(300);
  await page.screenshot({ path: OUT + '/era-plates-gallery.png' });
  console.log('gallery done');

  // real title card: jump to 1899, end year -> era change to gilded (1900)
  await page.evaluate(() => { document.querySelectorAll('div[style*="z-index: 99999"],div[style*="z-index:99999"]').forEach(d => d.remove()); });
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); } catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(300);
  await page.locator('[data-action="start-begin"]').click(); await sleep(600);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  await page.evaluate(() => { PE.S().year = 1899; });
  await page.locator('[data-action="end-year"],#btn-end-year').first().click(); await sleep(400);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  await sleep(800);
  await page.screenshot({ path: OUT + '/era-titlecard-gilded.png' });
  console.log('titlecard done');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
