import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { useLang } from '../../hooks/useLang';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice, formatSize } from '../../lib/format';

/**
 * Bandeau affiché après le questionnaire : explique POURQUOI ces chaussures
 * sont proposées et, s'il n'y a aucun résultat, propose d'élargir en un clic.
 */
export default function FinderBanner({ filters, count }) {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const { settings } = useSettings();
  const [sp] = useSearchParams();
  const fmt = (v) => formatPrice(v, lang, settings.currency);

  const reasons = [
    filters.gender && [t('finder.summary.labels.gender'), t(`enums.gender.${filters.gender}`)],
    filters.types.length > 0 && [t('finder.summary.labels.type'), filters.types.map((v) => t(`enums.shoeType.${v}`)).join(', ')],
    filters.sizes.length > 0 && [t('finder.summary.labels.size'), filters.sizes.map(formatSize).join(', ')],
    filters.usages.length > 0 && [t('finder.summary.labels.usage'), filters.usages.map((v) => t(`enums.usage.${v}`)).join(', ')],
    (filters.min != null || filters.max != null) && [t('finder.summary.labels.budget'),
      t('filters.priceRange', { min: filters.min != null ? fmt(filters.min) : '0', max: filters.max != null ? fmt(filters.max) : '∞' })],
    filters.colors.length > 0 && [t('finder.summary.labels.color'), filters.colors.map((v) => t(`enums.color.${v}`)).join(', ')],
    filters.materials.length > 0 && [t('finder.summary.labels.material'), filters.materials.map((v) => t(`enums.material.${v}`)).join(', ')],
  ].filter(Boolean);

  // Liens « élargir » : on retire un critère à la fois, du moins important au plus important
  const widen = (keys) => {
    const n = new URLSearchParams(sp);
    keys.forEach((k) => n.delete(k));
    return `${to('shop')}?${n.toString()}`;
  };
  const options = [
    filters.colors.length && { key: 'colors', href: widen(['colors']) },
    filters.materials.length && { key: 'materials', href: widen(['materials']) },
    filters.usages.length && { key: 'usages', href: widen(['usages']) },
    (filters.min != null || filters.max != null) && { key: 'budget', href: widen(['min', 'max']) },
    filters.types.length && { key: 'types', href: widen(['types']) },
    filters.sizes.length && { key: 'sizes', href: widen(['sizes']) },
  ].filter(Boolean);

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} aria-live="polite"
      className="relative mt-6 overflow-hidden rounded-3xl bg-forest p-6 text-white md:p-8">
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-2xl" />
      <div className="relative">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-gold" aria-hidden />
          {count > 0 ? t('finder.banner.title') : t('finder.banner.emptyTitle')}
        </h2>
        {count > 0 ? (
          <>
            <p className="mt-2 text-white/85">{t('finder.banner.why')}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {reasons.map(([label, value]) => (
                <li key={label} className="rounded-full bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/15">
                  <span className="text-mint">{label} :</span> <strong className="font-semibold">{value}</strong>
                </li>
              ))}
            </ul>
            {filters.sizes.length > 0 && (
              <p className="mt-4 flex items-center gap-2 text-sm text-mint"><CheckCircle2 className="h-4 w-4" aria-hidden /> {t('finder.banner.stock')}</p>
            )}
          </>
        ) : (
          <>
            <p className="mt-2 text-white/85">{t('finder.banner.emptyText')}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {options.map((o) => (
                <li key={o.key}>
                  <Link to={o.href} className="inline-flex items-center gap-1.5 rounded-full bg-signature px-4 py-2 text-sm font-semibold text-forest transition hover:brightness-105">
                    <Wand2 className="h-4 w-4" aria-hidden /> {t(`finder.banner.widen.${o.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <Link to={to('finder')} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:underline">
          <RotateCcw className="h-4 w-4" aria-hidden /> {t('finder.banner.edit')}
        </Link>
      </div>
    </motion.section>
  );
}
