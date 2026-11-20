import opentype from 'opentype.js';
import fs from 'fs';
const F = 'node_modules/@fontsource/lexend/files/lexend-latin-';
const bold = opentype.loadSync(F + '700-normal.woff');
const semi = opentype.loadSync(F + '500-normal.woff');
const NAVY = '#1F2B8F', PINK = '#EC2F6B';
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
const pathA = text(bold, 'Snika', xA, base, sizeA);
const xB = xA + w(bold, 'Snika', sizeA) + 26;
const pathB = text(semi, 'store', xB, base, sizeB);
const right = Math.ceil(xB + w(semi, 'store', sizeB)) + 40;

const stroke = (d, c, sw = 16) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const icon = (c1 = NAVY, c2 = PINK) => stroke(upper, c1) + stroke(laces, c1, 13) + stroke(loop, c1, 13) + stroke(sole, c2);

const full = (c1, c2, c3) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 30 ${right - 40} 500" role="img" aria-label="Snika store">
<title>Snika store</title>
${icon(c1, c2)}
<path d="${pathA}" fill="${c2}"/><path d="${pathB}" fill="${c3}"/>
</svg>`;
fs.writeFileSync(out + '/snika-logo.svg', full(NAVY, PINK, NAVY));
fs.writeFileSync(out + '/snika-logo-white.svg', full('#FFFFFF', PINK, '#FFFFFF'));
fs.writeFileSync(out + '/snika-logo-mono.svg', full('#FFFFFF', '#FFFFFF', '#FFFFFF'));
// icône seule (favicon / avatar réseaux) — semelle rose continue, sur pastille crème
const iconOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="Snika">
<title>Snika</title><rect width="640" height="640" rx="144" fill="#FFF8F3"/>
<g transform="translate(18 120)">${stroke(upper, NAVY, 22)}${stroke(laces, NAVY, 18)}${stroke(loop, NAVY, 18)}${stroke('M84 352 H564', PINK, 26)}</g></svg>`;
fs.writeFileSync(out + '/snika-icon.svg', iconOnly);
// Données pour le composant React animé
fs.writeFileSync(out + '/logo-paths.json', JSON.stringify({ upper, laces, loop, sole, pathA, pathB, viewBox: `40 30 ${right - 40} 500` }));
console.log('ok', right);
