/* Contrast audit for the city-tab pills: computes WCAG contrast ratios for the
   token pairs the tabs use, across every era x theme combination in css/tokens.css.
   Pairs: inactive (ink-2 on surface), locked (ink-2 on surface-2), selected
   (primary-ink on primary). Fails if any pair drops below 4.5:1. */
const fs = require('fs');
const src = fs.readFileSync('css/tokens.css', 'utf8');

function blockVars(re) {
  const m = src.match(re);
  if (!m) return null;
  const vars = {};
  const body = m[1];
  body.replace(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g, (_, k, v) => { vars[k] = v.toLowerCase(); return ''; });
  return vars;
}
const lightBase = blockVars(/:root\s*\{([\s\S]*?)\n\}/);
const darkBase = blockVars(/:root:not\(\[data-theme="light"\]\)\s*\{([\s\S]*?)\n\s*\}/);
const eras = ['victorian', 'gilded', 'crisis', 'boom', 'modern', 'digital'];
const lightEra = {}, darkEra = {};
for (const e of eras) {
  lightEra[e] = blockVars(new RegExp(':root\\[data-era="' + e + '"\\]\\s*\\{([\\s\\S]*?)\\}'));
  darkEra[e] = blockVars(new RegExp(':root:not\\(\\[data-theme="light"\\]\\)\\[data-era="' + e + '"\\]\\s*\\{([\\s\\S]*?)\\}'));
}
// explicit data-theme="dark" blocks must match the media-query dark blocks
const darkBaseExp = blockVars(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
for (const k of ['--surface', '--surface-2', '--ink-2', '--primary', '--primary-ink']) {
  if (darkBaseExp[k] !== darkBase[k]) { console.log('MISMATCH explicit dark base', k, darkBaseExp[k], darkBase[k]); process.exitCode = 1; }
}
for (const e of eras) {
  const exp = blockVars(new RegExp(':root\\[data-theme="dark"\\]\\[data-era="' + e + '"\\]\\s*\\{([\\s\\S]*?)\\}'));
  for (const k of ['--surface', '--surface-2', '--ink-2', '--primary', '--primary-ink']) {
    if (exp[k] !== darkEra[e][k]) { console.log('MISMATCH explicit dark', e, k, exp[k], darkEra[e][k]); process.exitCode = 1; }
  }
}

function lum(hex) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }

const combos = [['base-light', lightBase], ['base-dark', darkBase]];
for (const e of eras) {
  combos.push([e + '-light', Object.assign({}, lightBase, lightEra[e])]);
  combos.push([e + '-dark', Object.assign({}, darkBase, darkEra[e])]);
}
let worst = 99, fails = 0;
for (const [name, v] of combos) {
  const pairs = [
    ['inactive tab', v['--ink-2'], v['--surface']],
    ['locked tab', v['--ink-2'], v['--surface-2']],
    ['selected tab', v['--primary-ink'], v['--primary']],
  ];
  for (const [label, fg, bg] of pairs) {
    const r = ratio(fg, bg);
    if (r < worst) worst = r;
    const ok = r >= 4.5;
    if (!ok) fails++;
    console.log((ok ? 'PASS' : 'FAIL') + '  ' + r.toFixed(2) + ':1  ' + name.padEnd(16) + label + '  ' + fg + ' on ' + bg);
  }
}
console.log('---\nworst ratio ' + worst.toFixed(2) + ':1, ' + fails + ' failures (target >= 4.5:1)');
if (fails) process.exitCode = 1;
