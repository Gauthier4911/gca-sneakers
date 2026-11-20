import opentype from 'opentype.js';
import fs from 'fs';
const F = 'node_modules/@fontsource/lexend/files/lexend-latin-';
const bold = opentype.loadSync(F + '700-normal.woff');
const semi = opentype.loadSync(F + '500-normal.woff');
const GREEN = '#047857', FOREST = '#053B2C', GOLD = 'url(#gcaGold)';
// Dégradé signature : or soleil → orange mangue
const defs = (x1, x2) => `<defs><linearGradient id="gcaGold" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0"><stop offset="0" stop-color="#FFB800"/><stop offset="1" stop-color="#FF7A00"/></linearGradient></defs>`;
const out = process.argv[2];

const text = (font, str, x, y, size) => font.getPath(str, x, y, size).toPathData(1);
const w = (font, str, size) => font.getAdvanceWidth(str, size);

// --- icône : sneaker au trait + boucle de lacet + semelle-cadre rose ---
const upper = `M84 322 V246 Q84 204 124 200 Q168 196 192 226 Q208 244 228 226 L272 158 Q286 136 304 152 L420 248 Q520 262 552 298 Q564 312 564 322`;
const laces = `M332 182 l-30 34 M368 212 l-30 34`;
const loop  = `M300 146 C262 108 252 64 286 60 C320 56 318 108 300 146 C322 106 360 82 372 104 C382 124 340 136 300 146`;
const sole  = `M84 340 H150 V364 M564 340 H498 V364 M150 470 V494 H498 V470`;

const sizeA = 118, sizeB = 92, base = 452;
const xA = 112;
const pathA = text(bold, 'GCA', xA, base, sizeA);
const xB = xA + w(bold, 'GCA', sizeA) + 26;
const pathB = text(semi, 'sneakers', xB, base, sizeB);
const right = Math.ceil(xB + w(semi, 'sneakers', sizeB)) + 40;

const stroke = (d, c, sw = 16) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const icon = (c1 = GREEN, c2 = GOLD) => stroke(upper, c1) + stroke(laces, c1, 13) + stroke(loop, c1, 13) + stroke(sole, c2);

const full = (c1, c2, c3) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 30 ${right - 40} 500" role="img" aria-label="GCA sneakers">
<title>GCA sneakers</title>
${defs(84, 520)}
${icon(c1, c2)}
<path d="${pathA}" fill="${c2}"/><path d="${pathB}" fill="${c3}"/>
</svg>`;
fs.writeFileSync(out + '/gca-logo.svg', full(GREEN, GOLD, FOREST));
fs.writeFileSync(out + '/gca-logo-white.svg', full('#FFFFFF', GOLD, '#FFFFFF'));
fs.writeFileSync(out + '/gca-logo-mono.svg', full('#FFFFFF', '#FFFFFF', '#FFFFFF').replace(/<defs>.*<\/defs>/, ''));
// icône seule (favicon / avatar réseaux) — semelle orange or continue, sur pastille vert forêt
const iconOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="GCA sneakers">
<title>GCA sneakers</title>${defs(100, 580)}<rect width="640" height="640" rx="144" fill="${FOREST}"/>
<g transform="translate(18 120)">${stroke(upper, '#FFFFFF', 22)}${stroke(laces, '#FFFFFF', 18)}${stroke(loop, '#FFFFFF', 18)}${stroke('M84 352 H564', GOLD, 26)}</g></svg>`;
fs.writeFileSync(out + '/gca-icon.svg', iconOnly);
// Données pour le composant React animé
fs.writeFileSync(out + '/logo-paths.json', JSON.stringify({ upper, laces, loop, sole, pathA, pathB, viewBox: `40 30 ${right - 40} 500` }));
console.log('ok', right);
