/* ENG-C1 portrait contact sheet: renders each assets/portraits/*.svg at list
   size (48) and sheet size (120) against the app paper, plus one full-plate
   shot per portrait for close inspection. */
const { launch, OUT, path, fs } = require('./config');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const BASE = process.env.PW_URL || 'http://127.0.0.1:8790/index.html?seed=42';
const ORIGIN = BASE.replace(/\/index\.html.*$/, '');

const IDS = process.argv[2] ? process.argv[2].split(',') :
  ['rothschild', 'wong', 'al_rashid', 'petrov', 'martinez', 'okonkwo', 'hartwell', 'silva', 'chen', 'armstrong', 'vanderbilt'];

(async () => {
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })).newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));

  const cells = IDS.map(id => `
    <div class="cell">
      <div class="label">${id}</div>
      <img src="${ORIGIN}/assets/portraits/${id}.svg" width="120" height="150">
      <img src="${ORIGIN}/assets/portraits/${id}.svg" width="48" height="60">
      <img src="${ORIGIN}/assets/portraits/${id}.svg" width="30" height="37">
    </div>`).join('');
  await page.setContent(`<html><body style="margin:0;background:#F3EEE4;font-family:Georgia,serif">
    <div style="display:flex;flex-wrap:wrap;gap:14px;padding:16px">${cells}</div>
    <style>.cell{background:#FBF7EE;border:1px solid #D8CDB6;padding:8px;display:flex;flex-direction:column;align-items:center;gap:8px}
    .label{font-size:11px;color:#58524A}</style></body></html>`);
  await sleep(600);
  await page.screenshot({ path: `${OUT}/engc-contact.png`, fullPage: true });

  // individual plates for close looking
  for (const id of IDS) {
    await page.setContent(`<html><body style="margin:0;background:#F3EEE4;display:flex;align-items:center;justify-content:center;height:100vh">
      <img src="${ORIGIN}/assets/portraits/${id}.svg" width="480" height="600"></body></html>`);
    await sleep(250);
    await page.screenshot({ path: `${OUT}/engc-plate-${id}.png` });
  }
  await browser.close();
  console.log('portrait contact sheet done:', IDS.length, 'portraits');
})().catch(e => { console.error(e); process.exit(1); });
