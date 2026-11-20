// Formatage des prix en FCFA (pas de centimes) selon la langue.
export function formatPrice(value, lang = 'fr', currency = 'FCFA') {
  const n = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'fr-FR', { maximumFractionDigits: 0 })
    .format(Number(value) || 0);
  return `${n} ${currency}`;
}

// 42.0 → "42", 42.5 → "42.5"
export const formatSize = (size) => String(Number(size));
