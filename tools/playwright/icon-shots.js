/* Render the 14 redrawn sprite icons at 16px and 22px through the real .ic CSS. */
const { chromium, launch, path, fs, OUT } = require('./config');
(async () => {
  const sprite = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'icons.svg'), 'utf8');
  const ids = ['icon-home','icon-building','icon-city','icon-bank','icon-coin','icon-key','icon-tag','icon-paper','icon-gavel','icon-hammer','icon-map','icon-users','icon-trophy','icon-crown'];
  const row = (size) => ids.map(id =>
    `<div class="cell"><svg class="ic" width="${size}" height="${size}"><use href="#${id}"/></svg><span>${id.replace('icon-','')}</span></div>`).join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f4ead8;color:#3a2c1c;font:11px sans-serif">
  ${sprite}
  <style>.ic{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .row{display:flex;flex-wrap:wrap}.cell{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 9px}</style>
  <div class="row">${row(22)}</div><div class="row">${row(16)}</div>
  <div class="row" style="background:#2a2118;color:#e8d9b8">${row(22)}</div>
  </body></html>`;
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 760, height: 560 }, deviceScaleFactor: 4 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(OUT, 'icon-pass.png') });
  await browser.close();
  console.log('wrote icon-pass.png');
})().catch(e => { console.error(e); process.exit(1); });
