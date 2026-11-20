import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { localizedPath } from '../lib/routes';

/** Langue courante + générateur de liens traduits : to('product', { slug }). */
export function useLang() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const to = useCallback((key, params, search) => localizedPath(key, lang, params, search), [lang]);
  return { lang, to };
}
