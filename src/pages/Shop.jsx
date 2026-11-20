import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import Seo from '../components/seo/Seo';
import Breadcrumb from '../components/product/Breadcrumb';
import Filters from '../components/product/Filters';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import NotFound from './NotFound';
import { useCatalog } from '../hooks/useCatalog';
import { useFilters } from '../hooks/useFilters';
import { useLang } from '../hooks/useLang';
import { applyFilters, countActiveFilters, facetsOf, SORTS, tr } from '../lib/catalog';
import { formatPrice, formatSize } from '../lib/format';
import { useSettings } from '../context/SettingsContext';

/** Boutique et page catégorie (même écran, la catégorie est alors fixée par l'URL). */
export default function Shop({ banner = null }) {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const { slug } = useParams();
  const { settings } = useSettings();
  const fixed = useMemo(() => (slug ? { category: slug } : {}), [slug]);
  const { filters, set, toggle, setBudget, clear } = useFilters(fixed);
  const { products, loading, error, reload } = useCatalog();
  const [drawer, setDrawer] = useState(false);

  // Les options de filtre tiennent compte du genre / de la catégorie choisis.
  const scope = useMemo(() => products.filter((p) => (!filters.gender || p.gender === filters.gender)
    && (!filters.category || p.category?.slug === filters.category)), [products, filters.gender, filters.category]);
  const facets = useMemo(() => ({ ...facetsOf(scope), categories: facetsOf(products).categories }), [scope, products]);
  const results = useMemo(() => applyFilters(products, filters), [products, filters]);
  const active = countActiveFilters({ ...filters, category: slug ? null : filters.category });

  const category = slug ? facets.categories.find((c) => c.slug === slug) : null;
  if (slug && !loading && !error && !category) return <NotFound />;

  const title = category ? tr(category, 'name', lang)
    : filters.gender ? t('shop.titleGender', { gender: t(`enums.gender.${filters.gender}`) }) : t('shop.title');
  const actions = { set, toggle, setBudget };
  const hide = slug ? ['category'] : [];

  // Puces des filtres actifs (retrait en un clic)
  const fmt = (v) => formatPrice(v, lang, settings.currency);
  const chips = [
    filters.gender && { label: t(`enums.gender.${filters.gender}`), off: () => set('gender', null) },
    !slug && filters.category && { label: tr(facets.categories.find((c) => c.slug === filters.category), 'name', lang) || filters.category, off: () => set('category', null) },
    ...filters.types.map((v) => ({ label: t(`enums.shoeType.${v}`), off: () => toggle('types', v) })),
    ...filters.sizes.map((v) => ({ label: t('filters.sizeChip', { size: formatSize(v) }), off: () => toggle('sizes', v) })),
    (filters.min != null || filters.max != null) && {
      label: t('filters.priceRange', { min: filters.min != null ? fmt(filters.min) : '0', max: filters.max != null ? fmt(filters.max) : '∞' }),
      off: () => setBudget(null, null),
    },
    filters.available && { label: t('filters.inStock'), off: () => set('available', false) },
    ...filters.colors.map((v) => ({ label: t(`enums.color.${v}`), off: () => toggle('colors', v) })),
    ...filters.usages.map((v) => ({ label: t(`enums.usage.${v}`), off: () => toggle('usages', v) })),
    ...filters.materials.map((v) => ({ label: t(`enums.material.${v}`), off: () => toggle('materials', v) })),
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6">
      <Seo title={category ? `${title} — GCA sneakers` : t('shop.seoTitle')} description={t('shop.seoDescription')}
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: t('nav.home'), item: `${import.meta.env.VITE_SITE_URL || ''}${to('home')}` },
            { '@type': 'ListItem', position: 2, name: t('nav.shop'), item: `${import.meta.env.VITE_SITE_URL || ''}${to('shop')}` },
            ...(category ? [{ '@type': 'ListItem', position: 3, name: title }] : []),
          ],
        }} />
      <Breadcrumb items={[{ label: t('nav.home'), to: to('home') }, { label: t('nav.shop'), to: to('shop') }, ...(category ? [{ label: title }] : [])]} />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-forest md:text-5xl">{title}</h1>
          <p className="mt-2 text-ink-soft" aria-live="polite">{loading ? t('common.loading') : t('shop.results', { count: results.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDrawer(true)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-forest/15 px-4 py-2.5 font-semibold text-forest lg:hidden">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {active ? t('filters.openCount', { count: active }) : t('filters.open')}
          </button>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="hidden sm:inline">{t('shop.sort')}</span>
            <select value={filters.sort} onChange={(e) => set('sort', e.target.value === 'newest' ? null : e.target.value)}
              aria-label={t('shop.sort')}
              className="rounded-full border-2 border-forest/15 bg-white px-4 py-2.5 font-semibold text-forest focus:border-emerald focus:outline-none">
              {SORTS.map((s) => <option key={s} value={s}>{t(`shop.sorts.${s}`)}</option>)}
            </select>
          </label>
        </div>
      </header>

      {banner}

      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2" aria-label={t('filters.active')}>
          {chips.map((c) => (
            <motion.button layout key={c.label} type="button" onClick={c.off} aria-label={t('filters.remove', { label: c.label })}
              className="inline-flex items-center gap-1.5 rounded-full bg-mint-light px-3 py-1.5 text-sm font-medium text-forest hover:bg-mint/40">
              {c.label} <X className="h-3.5 w-3.5" aria-hidden />
            </motion.button>
          ))}
          <button type="button" onClick={clear} className="px-2 text-sm font-semibold text-amber underline-offset-2 hover:underline">{t('filters.clear')}</button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label={t('filters.title')}>
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <Filters facets={facets} filters={filters} actions={actions} hide={hide} />
          </div>
        </aside>

        <section aria-label={title}>
          {error ? (
            <div className="rounded-3xl bg-cream p-10 text-center">
              <p className="text-forest">{t('shop.error')}</p>
              <Button onClick={reload} className="mt-4">{t('common.retry')}</Button>
            </div>
          ) : !loading && results.length === 0 ? (
            <div className="rounded-3xl bg-cream p-10 text-center">
              <h2 className="font-display text-2xl font-bold text-forest">{t('shop.empty.title')}</h2>
              <p className="mt-2 text-ink-soft">{t('shop.empty.text')}</p>
              <Button onClick={clear} className="mt-6">{t('shop.empty.reset')}</Button>
            </div>
          ) : (
            <ProductGrid products={results} loading={loading} />
          )}
        </section>
      </div>

      {/* Tiroir de filtres (mobile) */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-forest/60 backdrop-blur-sm lg:hidden" onClick={() => setDrawer(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div role="dialog" aria-modal="true" aria-label={t('filters.title')}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[2rem] bg-white lg:hidden"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="flex items-center justify-between border-b border-forest/10 px-5 py-4">
                <h2 className="font-display text-xl font-bold text-forest">{t('filters.title')}</h2>
                <button type="button" onClick={() => setDrawer(false)} aria-label={t('filters.close')}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-forest/5"><X className="h-5 w-5" aria-hidden /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <Filters facets={facets} filters={filters} actions={actions} hide={hide} />
              </div>
              <div className="flex gap-3 border-t border-forest/10 p-4">
                <Button variant="outline" onClick={clear} className="flex-1">{t('filters.clear')}</Button>
                <Button onClick={() => setDrawer(false)} className="flex-[2]">{t('filters.apply', { count: results.length })}</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
