const { launch } = require('./config');
(async () => {
  const browser = await launch();
  for (const [w,h,name] of [[1280,800,'1280'],[412,915,'412']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w<500?2:1, isMobile: w<500 });
    const page = await ctx.newPage(); const errs=[]; page.on('pageerror', e=>errs.push(e.message));
    await page.goto('http://127.0.0.1:8790/index.html?seed=42', { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(1500);
    await page.evaluate(() => { PE.Game.newGame({ familyId: 'chen', seed: 42 }); for (let i=0;i<12;i++){ let g=0; while(g++<5){ const r=PE.Game.endYear(); if(r.ok) break; const e=PE.Events.pending().event; if(e) PE.Events.resolve(e.uid,0); else break; } } PE.Game.save(); });
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.locator('[data-action="continue"]').first().click().catch(()=>{}); await page.waitForTimeout(800);
    await page.locator('[data-action="nav"][data-screen="city"]').first().click().catch(async()=>{ await page.evaluate(()=>PEUI.render('city')); }); await page.waitForTimeout(6000);
    await page.screenshot({ path: 'citycheck-'+name+'.png' });
    const ov = await page.evaluate(() => { const t=document.querySelector('#city-tabs'); if(!t) return 'no tabs'; const r=t.getBoundingClientRect(); const v=document.querySelector('.city-view').getBoundingClientRect(); return {tabsRight:Math.round(r.right), viewRight:Math.round(v.right), scrollW:t.scrollWidth, clientW:t.clientWidth}; });
    console.log(name, JSON.stringify(ov), 'errors', errs.length);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
