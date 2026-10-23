/* P6.6 store trailer — 30s REAL gameplay capture for the store listing.
   Recorded through the real UI at phone resolution (430x932 @3x → 1290x2796 webm):
   hero splash → new dynasty → deal board → 3D city orbit → listing sheet with
   letting strategy (visitor-economy slice) → end-year report.
   Beats are also screenshotted to tools/playwright/out/trailer/ for review.
   Output: store-assets/trailer-1290x2796.webm
   Run with the local server on :8790. Headless capture uses software GL, so the
   orbit is choppier than on-device — recapture on hardware for the final cut. */
const path = require('path');
const fs = require('fs');
const { launch, URL } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const OUT = path.join(__dirname, 'out', 'trailer');
const STORE = path.join(__dirname, '..', '..', 'store-assets');
fs.mkdirSync(OUT, { recursive: true });

const SEED_URL = URL.replace(/seed=\d+/, 'seed=7');

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true, hasTouch: true,
    recordVideo: { dir: OUT, size: { width: 1290, height: 2796 } }
  });
  // clean first load — no reload flash in the recording
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  const beat = (n) => page.screenshot({ path: path.join(OUT, `beat-${n}.png`) });

  const t0 = Date.now();
  const at = async (s) => { const wait = s * 1000 - (Date.now() - t0); if (wait > 0) await sleep(wait); };

  // 0–8s hero splash
  await page.goto(SEED_URL, { waitUntil: 'load' });
  await at(3); await beat(1);
  await at(8);

  // 8–11s start a new dynasty through the real buttons
  try { await page.locator('[data-action="start-new"]').click({ timeout: 8000 }); }
  catch (e) { await page.locator('[data-action="start-new"]').click({ timeout: 15000 }); }
  await sleep(600);
  await page.locator('[data-action="start-begin"]').click(); await sleep(900);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(350); }

  // 11–14s deal board
  await page.evaluate(() => PEUI.render('deals'));
  await at(13); await beat(2);

  // 14–24s 3D city, slow orbit with a slight push-in
  await page.evaluate(() => {
    PEUI.render('city');
    setTimeout(() => { try { City3D.setAutoOrbit(0.07); City3D.setView({ zoom: 1.35 }); } catch (e) {} }, 1800);
  });
  await at(18); await beat(3);
  await at(24);

  // 24–28s listing sheet — district, location factors, letting strategy estimates
  await page.evaluate(() => {
    try { City3D.setAutoOrbit(0); } catch (e) {}
    const l = PE.Market.listingArray(null).filter(x => x.type !== 'land')
      .sort((a, b) => (b.district === 'mayfair') - (a.district === 'mayfair') || a.askingPrice - b.askingPrice)[0];
    PEUI.render('deals');
    if (l) PEUI.openListing(l.id);
  });
  await at(26.5); await beat(4);

  // 28–31s end the year through the real button → report
  await page.keyboard.press('Escape'); await sleep(300);
  await page.locator('[data-action="end-year"], button:has-text("End year")').first().click();
  await at(30); await beat(5);
  await at(31);

  const video = page.video();
  await ctx.close();
  const dest = path.join(STORE, 'trailer-1290x2796.webm');
  await video.saveAs(dest);
  const secs = (Date.now() - t0) / 1000;
  const size = fs.statSync(dest).size;
  console.log(`trailer saved: ${dest} (${(size / 1048576).toFixed(1)} MB, ~${secs.toFixed(0)}s session)`);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
