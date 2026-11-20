// Génère les illustrations de démonstration (4 vues par produit) dans public/demo.
// À remplacer par les vraies photos depuis l'admin. Usage : node scripts/generate-demo-images.mjs
import fs from 'fs';

const OUT = new URL('../public/demo/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

const COLORS = {
  black: ['#1F2937', '#111827'], white: ['#F8FAFC', '#CBD5E1'], blue: ['#1D4ED8', '#1E3A8A'],
  brown: ['#92400E', '#78350F'], pink: ['#F9A8D4', '#EC4899'], yellow: ['#FBBF24', '#D97706'],
  multi: ['#10B981', '#F97316'], grey: ['#9CA3AF', '#4B5563'], red: ['#DC2626', '#991B1B'],
};
const PRODUCTS = [
  ['gca-air-street-noir', 'black', 'sneaker'], ['gca-retro-blanc', 'white', 'sneaker'],
  ['gca-run-pro-bleu', 'blue', 'sneaker'], ['gca-derby-cognac', 'brown', 'formal'],
  ['gca-trek-boot', 'brown', 'boot'], ['gca-cloud-rose', 'pink', 'sneaker'],
  ['gca-escarpin-nuit', 'blue', 'pump'], ['gca-sandale-sun', 'yellow', 'sandal'],
  ['gca-fit-flow', 'white', 'sneaker'], ['gca-kids-school', 'black', 'formal'],
  ['gca-kids-light', 'multi', 'sneaker'], ['gca-kids-splash', 'blue', 'sandal'],
];

// Silhouettes (vue de profil, pointe à droite) dans un repère 800×800
const SHAPES = {
  sneaker: { upper: 'M150 520 L150 420 Q150 360 210 352 Q270 345 300 380 Q322 402 345 380 L410 300 Q432 280 458 302 L560 400 Q690 418 702 480 L702 520 Z',
    extra: (c) => `<path d="M250 478 Q410 425 590 455 Q430 482 270 500 Z" fill="url(#acc)"/><g stroke="${c}" stroke-width="10" stroke-linecap="round"><path d="M425 330 l-30 34"/><path d="M462 362 l-30 34"/><path d="M500 392 l-30 34"/></g>` },
  formal: { upper: 'M150 520 L150 440 Q152 400 200 395 Q290 392 330 410 L470 400 Q640 410 700 470 Q712 495 704 520 Z',
    extra: () => `<path d="M330 412 Q400 450 470 402" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="6"/>` },
  boot: { upper: 'M170 520 L170 250 Q170 215 205 212 L330 212 Q352 214 352 240 L360 380 Q520 390 640 420 Q705 440 706 520 Z',
    extra: (c) => `<g stroke="${c}" stroke-width="10" stroke-linecap="round"><path d="M352 260 l-40 18"/><path d="M355 300 l-40 18"/><path d="M358 340 l-40 18"/></g>` },
  sandal: { upper: 'M180 515 Q330 430 420 505 Z M430 512 Q540 410 660 505 Z M200 505 Q215 420 270 430',
    extra: () => '' },
  pump: { upper: 'M170 520 L190 430 Q205 405 240 420 Q320 455 420 430 Q560 400 690 480 Q705 500 696 520 Z',
    extra: () => `<path d="M170 520 L150 600 L176 600 L205 520 Z" fill="url(#body)"/>` },
};

function shoe(color, type, uid) {
  const [c1, c2] = COLORS[color] ?? COLORS.black;
  const s = SHAPES[type];
  const sole = type === 'sandal' ? '#8B5E34' : color === 'white' ? '#F59E0B' : '#FFFFFF';
  const stroke = color === 'white' ? '#94A3B8' : 'none';
  return `<defs>
  <linearGradient id="body${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
  <linearGradient id="acc${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB800"/><stop offset="1" stop-color="#FF7A00"/></linearGradient>
</defs>
<ellipse cx="425" cy="600" rx="300" ry="26" fill="rgba(5,59,44,.18)"/>
<path d="${s.upper}" fill="${type === 'sandal' ? 'none' : `url(#body${uid})`}" stroke="${type === 'sandal' ? `url(#body${uid})` : stroke}" stroke-width="${type === 'sandal' ? 26 : 4}" stroke-linecap="round" stroke-linejoin="round"/>
${s.extra(color === 'white' ? '#64748B' : '#FFFFFF').replace(/url\(#acc\)/g, `url(#acc${uid})`).replace(/url\(#body\)/g, `url(#body${uid})`)}
<rect x="138" y="518" width="580" height="${type === 'pump' ? 16 : 48}" rx="22" fill="${sole}" stroke="${color === 'white' ? '#CBD5E1' : 'none'}" stroke-width="3"/>
${type === 'pump' ? '' : `<rect x="150" y="552" width="556" height="8" rx="4" fill="url(#acc${uid})" opacity=".9"/>`}`;
}

// 4 vues : profil, profil inversé, trois-quarts, gros plan
const C = 'translate(-428 -430)'; // recentre la chaussure sur l'origine
const VIEWS = [
  (g) => `<g transform="translate(400 420) scale(1.2) ${C}">${g}</g>`,
  (g) => `<g transform="translate(400 420) scale(-1.2 1.2) ${C}">${g}</g>`,
  (g) => `<g transform="translate(400 420) rotate(-12) scale(1.05) ${C}">${g}</g>`,
  (g) => `<g transform="translate(330 400) scale(2) translate(-520 -440)">${g}</g>`,
];
const BGS = [['#FFF8E7', '#FFE7B3'], ['#ECFDF5', '#B7F0D6'], ['#FFF1E0', '#FFD3A8'], ['#F0FDF4', '#D1FAE5']];

let n = 0;
for (const [slug, color, type] of PRODUCTS) {
  VIEWS.forEach((view, i) => {
    const [b1, b2] = BGS[i];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
<defs><radialGradient id="bg" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></radialGradient></defs>
<rect width="800" height="800" fill="url(#bg)"/>
<circle cx="650" cy="150" r="70" fill="#fff" opacity=".45"/>
${view(shoe(color, type, i))}
</svg>`;
    fs.writeFileSync(new URL(`${slug}-${i + 1}.svg`, OUT), svg);
    n += 1;
  });
}
console.log(`${n} images générées dans public/demo`);
