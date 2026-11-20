import { supabase } from './supabase';

// Champs lus pour les listes et les fiches (jamais de données sensibles ici :
// la RLS ne renvoie de toute façon que les produits actifs aux visiteurs).
const FIELDS = `id, slug, gender, name_fr, name_en, shoe_type, usages, color, material,
  price, promo_price, is_featured, model_3d_url, created_at,
  category:categories(id, slug, name_fr, name_en),
  images:product_images(url, alt_fr, alt_en, position),
  variants:product_variants(id, size, stock)`;

let cache = null; // { at, promise }
const TTL = 60_000;

/** Tout le catalogue actif (quelques centaines de produits max → filtrage côté client, instantané). */
export function fetchCatalog({ force = false } = {}) {
  if (!force && cache && Date.now() - cache.at < TTL) return cache.promise;
  const promise = supabase.from('products').select(FIELDS).eq('is_active', true)
    .order('created_at', { ascending: false })
    .then(({ data, error }) => { if (error) throw error; return (data ?? []).map(normalize); });
  cache = { at: Date.now(), promise };
  promise.catch(() => { cache = null; });
  return promise;
}

export async function fetchProduct(slug) {
  const { data, error } = await supabase.from('products')
    .select(`${FIELDS}, description_fr, description_en`).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? normalize(data) : null;
}

function normalize(p) {
  return {
    ...p,
    images: [...(p.images ?? [])].sort((a, b) => a.position - b.position),
    variants: [...(p.variants ?? [])].map((v) => ({ ...v, size: Number(v.size) })).sort((a, b) => a.size - b.size),
  };
}

// ---------- Aides d'affichage ------------------------------------------------
export const tr = (obj, field, lang) => obj?.[`${field}_${lang}`] ?? obj?.[`${field}_fr`] ?? '';
export const effectivePrice = (p) => Number(p.promo_price ?? p.price);
export const discountPercent = (p) => (p.promo_price ? Math.round((1 - p.promo_price / p.price) * 100) : 0);
export const totalStock = (p) => p.variants.reduce((n, v) => n + v.stock, 0);
export const isInStock = (p) => p.variants.some((v) => v.stock > 0);
export const imageAlt = (img, p, lang) => img?.[`alt_${lang}`] || tr(p, 'name', lang);

// ---------- Filtres (synchronisés avec l'URL) --------------------------------
export const SORTS = ['newest', 'price_asc', 'price_desc', 'promo'];
export const BUDGETS = [
  { id: 'lt30', min: null, max: 29999 },
  { id: '30to60', min: 30000, max: 60000 },
  { id: '60to100', min: 60000, max: 100000 },
  { id: 'gt100', min: 100001, max: null },
];

/** Lit les filtres depuis ?gender=men&sizes=40,41&min=…  (valeurs inconnues ignorées). */
export function parseFilters(sp) {
  const list = (k) => (sp.get(k) ? sp.get(k).split(',').filter(Boolean) : []);
  const num = (k) => (sp.get(k) && !Number.isNaN(Number(sp.get(k))) ? Number(sp.get(k)) : null);
  return {
    gender: ['men', 'women', 'kids'].includes(sp.get('gender')) ? sp.get('gender') : null,
    category: sp.get('category') || null,
    types: list('types'),
    sizes: list('sizes').map(Number).filter((n) => !Number.isNaN(n)),
    usages: list('usages'),
    colors: list('colors'),
    materials: list('materials'),
    min: num('min'),
    max: num('max'),
    available: sp.get('available') === '1',
    sort: SORTS.includes(sp.get('sort')) ? sp.get('sort') : 'newest',
  };
}

export function applyFilters(products, f) {
  const out = products.filter((p) => {
    const price = effectivePrice(p);
    if (f.gender && p.gender !== f.gender) return false;
    if (f.category && p.category?.slug !== f.category) return false;
    if (f.types.length && !f.types.includes(p.shoe_type)) return false;
    if (f.usages.length && !p.usages?.some((u) => f.usages.includes(u))) return false;
    if (f.colors.length && !f.colors.includes(p.color)) return false;
    if (f.materials.length && !f.materials.includes(p.material)) return false;
    if (f.min != null && price < f.min) return false;
    if (f.max != null && price > f.max) return false;
    // Pointure : il faut au moins une des pointures choisies EN STOCK
    if (f.sizes.length && !p.variants.some((v) => f.sizes.includes(v.size) && v.stock > 0)) return false;
    if (f.available && !isInStock(p)) return false;
    return true;
  });
  const by = {
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    price_asc: (a, b) => effectivePrice(a) - effectivePrice(b),
    price_desc: (a, b) => effectivePrice(b) - effectivePrice(a),
    promo: (a, b) => discountPercent(b) - discountPercent(a),
  };
  return out.sort(by[f.sort] ?? by.newest);
}

/** Options réellement disponibles (pour n'afficher que des filtres utiles). */
export function facetsOf(products) {
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  return {
    types: uniq(products.map((p) => p.shoe_type)),
    colors: uniq(products.map((p) => p.color)),
    materials: uniq(products.map((p) => p.material)),
    usages: uniq(products.flatMap((p) => p.usages ?? [])),
    sizes: uniq(products.flatMap((p) => p.variants.filter((v) => v.stock > 0).map((v) => v.size))).sort((a, b) => a - b),
    categories: Object.values(Object.fromEntries(products.filter((p) => p.category).map((p) => [p.category.slug, p.category]))),
  };
}

export const countActiveFilters = (f) => [f.gender, f.category, f.min != null || f.max != null, f.available]
  .filter(Boolean).length + f.types.length + f.sizes.length + f.usages.length + f.colors.length + f.materials.length;
