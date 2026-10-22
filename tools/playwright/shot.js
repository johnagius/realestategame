/* Single city screenshot through the real renderer.
   Usage: node tools/playwright/shot.js <city> <era> <day|dusk> [outfile]
   Writes tools/playwright/out/skyline/<outfile>.png (default <city>-<era>-<time>). */
const { launch } = require('./config');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out', 'skyline');
const PORT = 8793;
const [city, era, time] = process.argv.slice(2);
if (!city || !era || !time) { console.error('usage: shot.js <city> <era> <day|dusk>'); process.exit(1); }
const night = time === 'dusk' ? 0.72 : 0.12;
const out = path.join(OUT, process.argv[5] || `${city}-${era}-${time}.png`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
  await sleep(1200);
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`http://127.0.0.1:${PORT}/tools/3d-testpages/city.html?city=${city}`);
    await page.waitForFunction(() => window.City3D && City3D._renderer, { timeout: 15000 });
    await page.evaluate(([e, n]) => { City3D.setEra(e, 0); City3D.setNight(n); }, [era, night]);
    await sleep(1500);
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: out });
    const stats = await page.evaluate(() => City3D.getStats());
    console.log(out, JSON.stringify(stats));
  } finally {
    await browser.close();
    server.kill();
  }
})();
