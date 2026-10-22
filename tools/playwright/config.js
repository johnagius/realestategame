/* Shared Playwright harness config — portable across machines.
   Env overrides:
     PW_MODULE    path to the playwright module (default: repo node_modules, then global)
     PW_CHROMIUM  browser executable (default: Playwright's installed registry browser)
     PW_OUT       screenshot root (default: <repo>/tools/playwright/out)
     PW_URL       game URL (default: seed-42 local server on port 8790) */
const path = require('path');

function loadPlaywright() {
  const candidates = [
    process.env.PW_MODULE,
    path.join(__dirname, '..', '..', 'node_modules', 'playwright'),
    'playwright'
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (!candidates[i]) continue;
    try { return require(candidates[i]); } catch (e) { /* try next candidate */ }
  }
  throw new Error('playwright not found — run: npm i playwright && npx playwright install chromium');
}

const pw = loadPlaywright();
const ROOT = path.join(__dirname, '..', '..');
const OUT_ROOT = process.env.PW_OUT || path.join(ROOT, 'tools', 'playwright', 'out');
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const fs = require('fs');
fs.mkdirSync(path.join(OUT_ROOT, 'ui'), { recursive: true });
fs.mkdirSync(path.join(OUT_ROOT, 'ui2'), { recursive: true });

module.exports = {
  chromium: pw.chromium,
  fs: fs,
  path: path,
  OUT: path.join(OUT_ROOT, 'ui'),
  OUT2: path.join(OUT_ROOT, 'ui2'),
  URL: process.env.PW_URL || 'http://127.0.0.1:8790/index.html?seed=42',
  ARGS: GL_ARGS,
  launch: function (opts) {
    const launchOpts = Object.assign({ args: GL_ARGS.slice(), headless: true }, opts || {});
    if (process.env.PW_CHROMIUM) launchOpts.executablePath = process.env.PW_CHROMIUM;
    return pw.chromium.launch(launchOpts);
  },
  axeSource: function () {
    return require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  }
};
