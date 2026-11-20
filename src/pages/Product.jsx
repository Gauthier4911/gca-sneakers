import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import Seo from '../components/seo/Seo';
import Breadcrumb from '../components/product/Breadcrumb';
import Gallery from '../components/product/Gallery';
import Price from '../components/product/Price';
import SizePicker from '../components/product/SizePicker';
import ProductGrid from '../components/product/ProductGrid';
import QuantityStepper from '../components/ui/QuantityStepper';
import Reveal from '../components/ui/Reveal';
import PageLoader from '../components/ui/PageLoader';
import NotFound from './NotFound';
import SplitText from '../components/motion/SplitText';
import { flyToCart } from '../components/motion/FlyToCart';
import { useLang } from '../hooks/useLang';
import { useLiveStock } from '../hooks/useLiveStock';
import { useCatalog } from '../hooks/useCatalog';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { discountPercent, effectivePrice, fetchProduct, tr } from '../lib/catalog';
import { formatPrice } from '../lib/format';

const SITE = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

export default function Product() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { addItem, items } = useCart();
  const { products } = useCatalog();
  const [state, setState] = useState({ loading: true, product: null });
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    setState({ loading: true, product: null }); setSize(null); setQty(1);
    fetchProduct(slug)
      .then((product) => alive && setState({ loading: false, product }))
      .catch(() => alive && setState({ loading: false, product: null }));
    return () => { alive = false; };
  }, [slug]);

  const product = state.product;
  const variants = useLiveStock(product?.id, product?.variants);
  const selected = variants.find((v) => v.size === size);
  const inCart = items.find((i) => i.productId === product?.id && Number(i.size) === size)?.quantity ?? 0;
  const maxQty = selected ? Math.max(0, Math.min(20, selected.stock - inCart)) : 20;

  // Si le stock de la pointure choisie tombe à 0 (temps réel), on la désélectionne
  useEffect(() => { if (selected && selected.stock <= 0) setSize(null); }, [selected]);
  useEffect(() => { if (qty > Math.max(1, maxQty)) setQty(Math.max(1, maxQty)); }, [maxQty, qty]);

  const related = useMemo(() => (product ? products
    .filter((p) => p.id !== product.id && (p.category?.slug === product.category?.slug || p.gender === product.gender))
    .slice(0, 4) : []), [products, product]);

  if (state.loading) return <PageLoader />;
  if (!product) return <NotFound />;

  const name = tr(product, 'name', lang);
  const description = tr(product, 'description', lang);
  const pct = discountPercent(product);
  const fmt = (v) => formatPrice(v, lang, settings.currency);
  const anyStock = variants.some((v) => v.stock > 0);

  const onAdd = () => {
    if (!size) { setSizeError(true); return; }
    if (maxQty <= 0) { toast.error(t('product.maxReached')); return; }
    addItem({
      productId: product.id, slug: product.slug, name_fr: product.name_fr, name_en: product.name_en,
      image: product.images[0]?.url, size, unitPrice: effectivePrice(product), maxStock: selected.stock,
    }, qty);
    flyToCart(document.querySelector('[data-gallery-main]') || document.querySelector('[role=slider] img:not([aria-hidden=true])'));
    setAdded(true); setTimeout(() => setAdded(false), 1800);
    toast.success(t('product.addedToast', { name, size }), {
      action: { label: t('product.viewCart'), onClick: () => navigate(to('cart')) },
    });
  };

  const crumbs = [
    { label: t('nav.home'), to: to('home') },
    { label: t('nav.shop'), to: to('shop') },
    ...(product.category ? [{ label: tr(product.category, 'name', lang), to: to('category', { slug: product.category.slug }) }] : []),
    { label: name },
  ];
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'Product', name, description,
      image: product.images.map((i) => (i.url.startsWith('http') ? i.url : `${SITE}${i.url}`)),
      sku: product.slug, brand: { '@type': 'Brand', name: 'GCA sneakers' },
      color: product.color ? t(`enums.color.${product.color}`) : undefined,
      offers: {
        '@type': 'Offer', url: `${SITE}${to('product', { slug: product.slug })}`, priceCurrency: 'XOF',
        price: effectivePrice(product), itemCondition: 'https://schema.org/NewCondition',
        availability: anyStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.to ? { item: `${SITE}${c.to}` } : {}) })),
    },
  ];
  const details = [
    [t('filters.gender'), t(`enums.gender.${product.gender}`)],
    [t('filters.type'), t(`enums.shoeType.${product.shoe_type}`)],
    product.material && [t('filters.material'), t(`enums.material.${product.material}`)],
    product.color && [t('filters.color'), t(`enums.color.${product.color}`)],
    product.usages?.length && [t('filters.usage'), product.usages.map((u) => t(`enums.usage.${u}`)).join(', ')],
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6">
      <Seo title={`${name} — GCA sneakers`} description={description.slice(0, 155)} image={product.images[0]?.url} type="product" jsonLd={jsonLd} />
      <Breadcrumb items={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Gallery images={product.images} name={name} model3d={product.model_3d_url} />

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald">
            {t(`enums.gender.${product.gender}`)} · {t(`enums.shoeType.${product.shoe_type}`)}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-forest md:text-5xl"><SplitText text={name} delay={0.2} /></h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price price={product.price} promoPrice={product.promo_price} size="lg" />
            {pct > 0 && <span className="rounded-full bg-signature px-3 py-1 text-sm font-bold text-forest">{t('product.promo', { percent: pct })}</span>}
          </div>
          {pct > 0 && <p className="mt-1 text-sm font-medium text-emerald">{t('product.save', { amount: fmt(product.price - product.promo_price) })}</p>}

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-mint-light px-4 py-3 text-sm font-medium text-forest">
            <Sparkles className="h-5 w-5 shrink-0 text-emerald" aria-hidden />
            {t('product.promoHint', { percent: settings.promo_percent, count: settings.promo_threshold })}
          </div>

          <div className="mt-7">
            <SizePicker variants={variants} value={size} error={sizeError}
              onChange={(s) => { setSize(s); setSizeError(false); }} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, maxQty)} />
            <motion.button type="button" onClick={onAdd} disabled={!anyStock}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              className="relative inline-flex h-14 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-signature px-8 font-display text-lg font-semibold text-forest shadow-glow disabled:opacity-50">
              <AnimatePresence mode="wait" initial={false}>
                {added ? (
                  <motion.span key="ok" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                    <Check className="h-5 w-5" aria-hidden /> {t('product.added')}
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" aria-hidden /> {anyStock ? t('product.addToCart') : t('product.outOfStock')}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          <div className="mt-8 space-y-3">
            <details className="group rounded-2xl bg-cream p-5" open>
              <summary className="cursor-pointer list-none font-display font-semibold text-forest">{t('product.description')}</summary>
              <p className="mt-3 whitespace-pre-line text-ink-soft">{description}</p>
            </details>
            <details className="rounded-2xl bg-cream p-5">
              <summary className="cursor-pointer list-none font-display font-semibold text-forest">{t('product.details')}</summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                {details.map(([k, v]) => (
                  <Fragment key={k}><dt className="text-ink-soft">{k}</dt><dd className="font-medium text-forest">{v}</dd></Fragment>
                ))}
              </dl>
            </details>
            <details className="rounded-2xl bg-cream p-5">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-display font-semibold text-forest">
                <Truck className="h-5 w-5 text-emerald" aria-hidden /> {t('product.delivery')}
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{t('product.deliveryText', { fee: fmt(settings.delivery_fee) })}</p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <Reveal><h2 className="font-display text-3xl font-bold text-forest">{t('product.related')}</h2></Reveal>
          <div className="mt-8"><ProductGrid products={related} className="grid-cols-2 lg:grid-cols-4" /></div>
        </section>
      )}
    </div>
  );
}
