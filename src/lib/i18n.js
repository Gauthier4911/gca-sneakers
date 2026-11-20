import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import { DEFAULT_LANG, LANGS } from './routes';

export const LANG_STORAGE_KEY = 'gca-lang';

/** Langue de départ : choix mémorisé, sinon langue du navigateur, sinon FR. */
export function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* stockage indisponible */ }
  const nav = (navigator.language || '').slice(0, 2);
  return LANGS.includes(nav) ? nav : DEFAULT_LANG;
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: LANGS,
  interpolation: { escapeValue: false }, // React échappe déjà le texte
  returnNull: false,
});

export default i18n;
