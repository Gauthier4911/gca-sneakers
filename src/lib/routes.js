// Routes traduites : une clé → un chemin par langue.
// Toute navigation passe par localizedPath() : aucun chemin écrit en dur ailleurs.
export const LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

export const ROUTES = {
  home: { fr: '', en: '' },
  shop: { fr: 'boutique', en: 'shop' },
  category: { fr: 'categorie/:slug', en: 'category/:slug' },
  product: { fr: 'produit/:slug', en: 'product/:slug' },
  finder: { fr: 'trouver-ma-paire', en: 'find-my-pair' },
  cart: { fr: 'panier', en: 'cart' },
  checkout: { fr: 'commande', en: 'checkout' },
  confirmation: { fr: 'commande/confirmation/:orderNumber', en: 'checkout/confirmation/:orderNumber' },
  login: { fr: 'connexion', en: 'login' },
  register: { fr: 'inscription', en: 'register' },
  forgot: { fr: 'mot-de-passe-oublie', en: 'forgot-password' },
  reset: { fr: 'nouveau-mot-de-passe', en: 'reset-password' },
  account: { fr: 'mon-compte', en: 'account' },
  contact: { fr: 'contact', en: 'contact' },
  store: { fr: 'notre-boutique', en: 'our-store' },
};

/** Construit /fr/produit/mon-slug à partir d'une clé et de paramètres. */
export function localizedPath(key, lang, params = {}, search = '') {
  const pattern = ROUTES[key]?.[lang] ?? '';
  const path = pattern.replace(/:(\w+)/g, (_, p) => encodeURIComponent(params[p] ?? ''));
  return `/${lang}${path ? `/${path}` : ''}${search}`;
}

/** Trouve la clé de route et les paramètres d'un chemin (/fr/produit/x → product, {slug:x}). */
export function matchRoute(pathname) {
  const [, lang, ...rest] = pathname.split('/');
  const sub = rest.join('/').replace(/\/$/, '');
  if (!LANGS.includes(lang)) return null;
  for (const [key, byLang] of Object.entries(ROUTES)) {
    const names = [];
    const re = new RegExp(
      '^' + byLang[lang].replace(/:(\w+)/g, (_, n) => (names.push(n), '([^/]+)')) + '$',
    );
    const m = sub.match(re);
    if (m) {
      const params = Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
      return { key, lang, params };
    }
  }
  return null;
}

/** Équivalent d'un chemin dans l'autre langue (sélecteur FR/EN, balises hreflang). */
export function translatePath(pathname, toLang, search = '') {
  const match = matchRoute(pathname);
  if (!match) return `/${toLang}`;
  return localizedPath(match.key, toLang, match.params, search);
}
