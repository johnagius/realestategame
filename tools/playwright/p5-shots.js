/* P5 verification: prestige store, weekly challenge lobby, scenario select,
   trophy room + the start-screen link row. Mobile 412x915 + desktop 1280x800. */
const { launch, OUT } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await launch();

  /* ---- mobile pass ---- */
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load' }); await sleep(1500);

  // fresh profile: no save -> three links, no trophy room
  await page.screenshot({ path: `${OUT}/p5-start-nosave-412.png` });

  // seed meta: points, owned perks (2 passive + 3 mode), one mode selected, challenge history
  await page.evaluate(() => {
    const m = PE.Storage.loadMeta();
    m.legacyPoints = 7;
    m.perks = ['old_money', 'purist', 'seventh_rival', 'crisis_start'];
    m.modes = ['purist'];
    m.challenges = { '2026-W50': { best: 640, runs: 2, lastYear: 1879 }, '2026-W51': { best: 0, runs: 1, lastYear: 1855 }, '2026-W52': { best: 1210, runs: 3, lastYear: 1880 } };
    PE.Storage.saveMeta(m);
  });
  await page.reload({ waitUntil: 'load' }); await sleep(1200);

  // prestige store
  await page.locator('.sp-links [data-action="open-perks"]').click(); await sleep(450);
  await page.screenshot({ path: `${OUT}/p5-perks-412.png` });
  await page.evaluate(() => { const b = document.querySelector('.sheet__body'); if (b) b.scrollTop = b.scrollHeight; });
  await sleep(250);
  await page.screenshot({ path: `${OUT}/p5-perks-modes-412.png` });
  await page.evaluate(() => { const b = document.querySelector('.sheet__body'); if (b) b.scrollTop = 0; });
  // toggle seventh rival on for the next dynasty
  await page.locator('[data-action="perk-mode"][data-id="seventh_rival"]').click(); await sleep(350);
  const modes = await page.evaluate(() => PE.Storage.loadMeta().modes.join());
  console.log('modes after toggle:', modes);
  // buy thick skin (cost 2, affordable)
  await page.locator('[data-action="perk-buy"][data-id="thick_skin"]').click(); await sleep(350);
  const after = await page.evaluate(() => ({ pts: PE.Storage.loadMeta().legacyPoints, perks: PE.Storage.loadMeta().perks.join() }));
  console.log('after buy:', JSON.stringify(after));
  await page.screenshot({ path: `${OUT}/p5-perks-bought-412.png` });
  await page.keyboard.press('Escape'); await sleep(300);

  // challenge lobby (no active run -> single CTA)
  await page.locator('.sp-links [data-action="open-challenge"]').click(); await sleep(450);
  await page.screenshot({ path: `${OUT}/p5-challenge-412.png` });
  // play it: enters the game
  await page.locator('[data-action="challenge-play"]').click(); await sleep(700);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  await page.screenshot({ path: `${OUT}/p5-challenge-ingame-412.png` });
  // back to title -> lobby now shows the live run + Continue
  await page.locator('[data-action="year-menu"]').click(); await sleep(250);
  await page.locator('[data-action="to-start"]').click(); await sleep(500);
  await page.locator('.sp-links [data-action="open-challenge"]').click(); await sleep(450);
  await page.screenshot({ path: `${OUT}/p5-challenge-active-412.png` });
  await page.keyboard.press('Escape'); await sleep(300);

  // scenarios
  await page.locator('.sp-links [data-action="open-scenarios"]').click(); await sleep(450);
  await page.screenshot({ path: `${OUT}/p5-scenarios-412.png` });
  await page.locator('[data-action="scen-start"][data-id="crash1929"]').click(); await sleep(700);
  while (await page.locator('.sheet.is-open .choice').count()) { await page.locator('.choice').first().click(); await sleep(300); }
  const sc = await page.evaluate(() => ({ mode: PE.S().mode, year: PE.S().year, props: PE.State.propertyCount('player') }));
  console.log('scenario start:', JSON.stringify(sc));
  await page.screenshot({ path: `${OUT}/p5-scenario-ingame-412.png` });
  // earn some trophies, save, leave
  await page.evaluate(() => {
    PE.S().goals.achievements.push('first_deal', 'ten_deals', 'portfolio_5', 'brrrr', 'survivor', 'centenarian', 'generation_2', 'the_long_game');
    PE.Game.save(); PEUI.leaveGame();
  });
  await sleep(3600); // let the event toasts clear
  // start screen now has a save -> Trophy room link appears
  await page.screenshot({ path: `${OUT}/p5-start-save-412.png` });
  await page.locator('.sp-links [data-action="open-achievements"]').click(); await sleep(450);
  await page.screenshot({ path: `${OUT}/p5-trophy-412.png` });
  await page.keyboard.press('Escape'); await sleep(300);
  await ctx.close();

  /* ---- desktop pass: start screen link row at 1280 ---- */
  const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const dpage = await dctx.newPage();
  dpage.on('pageerror', e => console.log('DESKTOP PAGE ERROR', String(e)));
  await dpage.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load' }); await sleep(1500);
  await dpage.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
    const r = PE.Game.newGame({ familyId: 'chen', seed: 7 });
    if (r.ok) PE.Game.save();
    PE._state = null;
  });
  await dpage.reload({ waitUntil: 'load' }); await sleep(1500);
  await dpage.screenshot({ path: `${OUT}/p5-start-1280.png` });
  await dpage.locator('.sp-links [data-action="open-perks"]').click(); await sleep(450);
  await dpage.screenshot({ path: `${OUT}/p5-perks-1280.png` });
  await dpage.keyboard.press('Escape'); await sleep(300);
  await dpage.locator('.sp-links [data-action="open-achievements"]').click(); await sleep(450);
  await dpage.screenshot({ path: `${OUT}/p5-trophy-1280.png` });
  await dctx.close();

  await browser.close();
  console.log('p5 shots done');
})().catch(e => { console.error(e); process.exit(1); });
