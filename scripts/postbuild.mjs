// =============================================================================
// Après `vite build` : SEO statique pour les robots qui n'exécutent pas le JS
// (aperçus WhatsApp / Facebook / X, et indexation plus rapide par Google).
//  - une page HTML par URL (FR + EN) avec title, description, canonical,
//    hreflang, Open Graph, Twitter card et JSON-LD
//  - sitemap.xml (avec alternates FR/EN) et robots.txt
// L'application React prend ensuite le relais normalement dans le navigateur.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

// Variables : celles de Vercel, sinon le fichier .env local
const env = { ...process.env };
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2];
  }
}
const SITE = (env.VITE_SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4173')).replace(/\/$/, '');
const SB_URL = env.VITE_SUPABASE_URL;
const SB_KEY = env.VITE_SUPABASE_ANON_KEY;

const fr = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/fr.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en.json'), 'utf8'));
const L = { fr, en };
const ROUTES = {
  home: { fr: '', en: '' }, shop: { fr: 'boutique', en: 'shop' }, finder: { fr: 'trouver-ma-paire', en: 'find-my-pair' },
  store: { fr: 'notre-boutique', en: 'our-store' }, contact: { fr: 'contact', en: 'contact' },
  category: { fr: 'categorie', en: 'category' }, product: { fr: 'produit', en: 'product' },
};
const url = (lang, key, slug) => `/${lang}${ROUTES[key][lang] ? `/${ROUTES[key][lang]}` : ''}${slug ? `/${slug}` : ''}`;

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (u) => (!u ? `${SITE}/og-default.jpg` : u.startsWith('http') ? u : `${SITE}${u}`);
// Les images SVG ne sont pas supportées par les aperçus de liens : image par défaut à la place
const ogImage = (u) => (u && !u.endsWith('.svg') ? abs(u) : `${SITE}/og-default.jpg`);

async function rest(q) {
  if (!SB_URL || !SB_KEY) return [];
  const res = await fetch(`${SB_URL}/rest/v1/${q}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// Textes personnalisés depuis l'admin (Contenu du site) : titres et descriptions SEO
const setPath = (obj, key, value) => {
  const parts = key.split('.'); let o = obj;
  parts.slice(0, -1).forEach((k) => { o[k] = o[k] && typeof o[k] === 'object' ? o[k] : {}; o = o[k]; });
  o[parts.at(-1)] = value;
};
try {
  const rows = await rest('settings?select=key,value&key=eq.content');
  const content = rows[0]?.value ?? {};
  for (const lang of ['fr', 'en']) {
    for (const [k, v] of Object.entries(content[lang] ?? {})) {
      if (typeof v === 'string' && v.trim() && /\.(seoTitle|seoDescription)$/.test(k)) setPath(L[lang], k, v.trim().slice(0, 300));
    }
  }
} catch (e) {
  console.warn('[postbuild] contenu personnalisé non lu :', e.message);
}

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
function render({ lang, title, description, pathFr, pathEn, image, type = 'website', jsonLd = [] }) {
  const self = lang === 'fr' ? pathFr : pathEn;
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${SITE}${self}" />`,
    `<link rel="alternate" hreflang="fr" href="${SITE}${pathFr}" />`,
    `<link rel="alternate" hreflang="en" href="${SITE}${pathEn}" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}${pathFr}" />`,
    `<meta property="og:site_name" content="GCA sneakers" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${SITE}${self}" />`,
    `<meta property="og:image" content="${esc(ogImage(image))}" />`,
    `<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'fr_FR'}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage(image))}" />`,
    ...jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ');
  const html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `  ${head}\n  </head>`);
  const file = path.join(dist, self.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return self;
}

const sitemap = [];
const add = (pathFr, pathEn, priority = '0.7') => sitemap.push({ pathFr, pathEn, priority });

// Pages fixes
const staticPages = [
  ['home', 'home.seoTitle', 'home.seoDescription', '1.0'], ['shop', 'shop.seoTitle', 'shop.seoDescription', '0.9'],
  ['finder', 'finder.seoTitle', 'finder.seoDescription', '0.8'], ['store', 'store.seoTitle', 'store.seoDescription', '0.6'],
  ['contact', 'contact.seoTitle', 'contact.seoDescription', '0.5'],
];
const get = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj);
for (const [key, tk, dk, prio] of staticPages) {
  const pathFr = url('fr', key); const pathEn = url('en', key);
  for (const lang of ['fr', 'en']) {
    render({
      lang, title: get(L[lang], tk), description: get(L[lang], dk), pathFr, pathEn,
      jsonLd: key === 'home' ? [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'GCA sneakers', url: SITE, logo: `${SITE}/logo/gca-logo.svg` }] : [],
    });
  }
  add(pathFr, pathEn, prio);
}

// Catégories et produits depuis Supabase
let cats = []; let products = [];
try {
  cats = await rest('categories?select=slug,name_fr,name_en&order=position');
  products = await rest('products?select=slug,name_fr,name_en,description_fr,description_en,price,promo_price,updated_at,images:product_images(url,position),variants:product_variants(stock)&is_active=eq.true');
} catch (e) {
  console.warn('[postbuild] Supabase injoignable, pages produits non pré-générées :', e.message);
}
for (const c of cats) {
  const pathFr = url('fr', 'category', c.slug); const pathEn = url('en', 'category', c.slug);
  for (const lang of ['fr', 'en']) {
    render({ lang, title: `${c[`name_${lang}`]} — GCA sneakers`, description: get(L[lang], 'shop.seoDescription'), pathFr, pathEn });
  }
  add(pathFr, pathEn, '0.8');
}
for (const p of products) {
  const pathFr = url('fr', 'product', p.slug); const pathEn = url('en', 'product', p.slug);
  const img = [...(p.images ?? [])].sort((a, b) => a.position - b.position)[0]?.url;
  const inStock = (p.variants ?? []).some((v) => v.stock > 0);
  for (const lang of ['fr', 'en']) {
    const name = p[`name_${lang}`]; const desc = (p[`description_${lang}`] || '').slice(0, 155);
    render({
      lang, title: `${name} — GCA sneakers`, description: desc, pathFr, pathEn, image: img, type: 'product',
      jsonLd: [{
        '@context': 'https://schema.org', '@type': 'Product', name, description: desc,
        image: (p.images ?? []).map((i) => abs(i.url)), sku: p.slug, brand: { '@type': 'Brand', name: 'GCA sneakers' },
        offers: { '@type': 'Offer', url: `${SITE}${lang === 'fr' ? pathFr : pathEn}`, priceCurrency: 'XOF', price: p.promo_price ?? p.price,
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
      }],
    });
  }
  add(pathFr, pathEn, '0.7');
}

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap.flatMap(({ pathFr, pathEn, priority }) => [pathFr, pathEn].map((loc) => `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="${SITE}${pathFr}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${pathEn}"/>
  </url>`)).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), xml);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /admin
Disallow: /fr/panier
Disallow: /fr/commande
Disallow: /fr/mon-compte
Disallow: /fr/connexion
Disallow: /fr/inscription
Disallow: /en/cart
Disallow: /en/checkout
Disallow: /en/account
Disallow: /en/login
Disallow: /en/register

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`[postbuild] ${sitemap.length * 2} pages pré-générées, sitemap.xml et robots.txt écrits pour ${SITE}`);
