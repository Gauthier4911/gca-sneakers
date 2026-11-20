import i18n from './i18n';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import { LANGS } from './routes';

/**
 * Textes du site modifiables depuis l'admin (Contenu du site).
 * Chaque champ = une clé de traduction ; la valeur saisie remplace le texte
 * d'origine dans la langue concernée (champ vide = texte d'origine).
 */
export const CONTENT_GROUPS = [
  { id: 'seo', fields: [
    ['home_seoTitle', 'home.seoTitle'], ['home_seoDescription', 'home.seoDescription', true],
    ['shop_seoTitle', 'shop.seoTitle'], ['shop_seoDescription', 'shop.seoDescription', true],
    ['finder_seoTitle', 'finder.seoTitle'], ['finder_seoDescription', 'finder.seoDescription', true],
    ['store_seoTitle', 'store.seoTitle'], ['store_seoDescription', 'store.seoDescription', true],
    ['contact_seoTitle', 'contact.seoTitle'], ['contact_seoDescription', 'contact.seoDescription', true],
  ] },
  { id: 'hero', fields: [
    ['hero_eyebrow', 'home.hero.eyebrow'], ['hero_title1', 'home.hero.title1'], ['hero_title2', 'home.hero.title2'],
    ['hero_subtitle', 'home.hero.subtitle', true], ['hero_ctaFinder', 'home.hero.ctaFinder'], ['hero_ctaShop', 'home.hero.ctaShop'],
  ] },
  { id: 'home', fields: [
    ['genders_title', 'home.genders.title'], ['featured_title', 'home.featured.title'], ['featured_subtitle', 'home.featured.subtitle'],
    ['categories_title', 'home.categories.title'], ['categories_subtitle', 'home.categories.subtitle'],
    ['promo_text', 'home.promo.text', true], ['homeStore_title', 'home.store.title'], ['homeStore_text', 'home.store.text', true],
  ] },
  { id: 'args', fields: [
    ['args_title', 'home.args.title'],
    ...['delivery', 'quality', 'whatsapp', 'sizes'].flatMap((a) => [[`args_${a}_title`, `home.args.${a}.title`], [`args_${a}_text`, `home.args.${a}.text`, true]]),
  ] },
  { id: 'testimonials', fields: [['testimonials_title', 'home.testimonials.title']] },
  { id: 'brand', fields: [['brand_tagline', 'brand.tagline'], ['footer_about', 'footer.about', true], ['footer_payment', 'footer.payment']] },
  { id: 'store', fields: [
    ['store_title', 'store.title'], ['store_subtitle', 'store.subtitle', true], ['store_pickupText', 'store.pickupText', true],
    ['store_followText', 'store.followText'], ['store_videoSoon', 'store.videoSoon', true],
  ] },
  { id: 'contact', fields: [['contact_title', 'contact.title'], ['contact_subtitle', 'contact.subtitle', true]] },
  { id: 'whatsapp', fields: [['whatsapp_greeting', 'whatsapp.greeting'], ['whatsapp_closing', 'whatsapp.closing', true]] },
];
export const TESTIMONIALS_KEY = 'home.testimonials.items';
export const EDITABLE_KEYS = new Set([...CONTENT_GROUPS.flatMap((g) => g.fields.map((f) => f[1])), TESTIMONIALS_KEY]);

const DEFAULTS = { fr, en };
export const defaultText = (lang, key) => key.split('.').reduce((o, k) => o?.[k], DEFAULTS[lang]);

/** Applique le contenu personnalisé (settings.content) par-dessus les traductions d'origine. */
export function applyContent(content) {
  for (const lang of LANGS) {
    // On repart des textes d'origine (un champ vidé dans l'admin redevient le texte d'origine)
    i18n.addResourceBundle(lang, 'translation', structuredClone(DEFAULTS[lang]), true, true);
    const overrides = content?.[lang];
    if (!overrides || typeof overrides !== 'object') continue;
    for (const [key, value] of Object.entries(overrides)) {
      if (!EDITABLE_KEYS.has(key)) continue; // seules les clés prévues sont modifiables
      if (key === TESTIMONIALS_KEY) {
        const items = Array.isArray(value)
          ? value.filter((x) => x && typeof x.name === 'string' && typeof x.text === 'string' && x.text.trim()).slice(0, 12)
          : [];
        if (items.length) i18n.addResource(lang, 'translation', key, items.map((x) => ({ name: x.name.slice(0, 80), text: x.text.slice(0, 500) })));
      } else if (typeof value === 'string' && value.trim()) {
        i18n.addResource(lang, 'translation', key, value.slice(0, 1000));
      }
    }
  }
  // Force le rafraîchissement des textes affichés
  i18n.changeLanguage(i18n.language);
}
