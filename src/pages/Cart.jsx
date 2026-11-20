import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, ShieldCheck, ShoppingBag, Sparkles, Trash2 } from 'lucide-react';
import Seo from '../components/seo/Seo';
import Button from '../components/ui/Button';
import QuantityStepper from '../components/ui/QuantityStepper';
import PromoProgress from '../components/cart/PromoProgress';
import CartSummary from '../components/cart/CartSummary';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLang } from '../hooks/useLang';
import { effectivePrice, fetchCatalog } from '../lib/catalog';
import { formatPrice, formatSize } from '../lib/format';

/** Re-vérifie prix et stock du panier contre la base (le panier local peut dater). */
export function useCartRevalidation() {
  const { items, setItems } = useCart();
  const { t } = useTranslation();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || items.length === 0) return;
    done.current = true;
    fetchCatalog({ force: true }).then((products) => {
      let changed = false;
      const next = items.map((i) => {
        const p = products.find((x) => x.id === i.productId);
        const v = p?.variants.find((x) => x.size === Number(i.size));
        const stock = v?.stock ?? 0;
        const unitPrice = p ? effectivePrice(p) : i.unitPrice;
        const quantity = Math.min(i.quantity, stock);
        if (!p || unitPrice !== i.unitPrice || stock !== i.maxStock || quantity !== i.quantity) changed = true;
        return { ...i, unitPrice, maxStock: stock, quantity, unavailable: !p || stock === 0 };
      });
      if (changed) {
        setItems(next.map((i) => (i.unavailable ? { ...i, quantity: 0 } : i)).filter((i) => i.quantity > 0));
        toast.info(t('cart.updated'));
      }
    }).catch(() => {});
  }, [items, setItems, t]);
}

export default function Cart() {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const navigate = useNavigate();
  const { items, totals, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  useCartRevalidation();
  const fmt = (v) => formatPrice(v, lang, settings.currency);

  const onCheckout = () => {
    // Panier libre sans compte → connexion demandée seulement ici (puis retour automatique)
    if (!user) navigate(to('login', {}, `?next=${encodeURIComponent(to('checkout'))}&reason=checkout`));
    else navigate(to('checkout'));
  };

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <Seo title={t('cart.seo')} description={t('cart.emptyText')} noindex />
        <motion.div initial={{ scale: 0.6, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-signature text-forest shadow-glow">
          <ShoppingBag className="h-10 w-10" aria-hidden />
        </motion.div>
        <h1 className="mt-6 font-display text-3xl font-bold text-forest">{t('cart.empty')}</h1>
        <p className="mt-2 text-ink-soft">{t('cart.emptyText')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to={to('finder')}><Sparkles className="h-5 w-5" aria-hidden /> {t('cart.finderCta')}</Button>
          <Button to={to('shop')} variant="outline">{t('cart.emptyCta')}</Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Seo title={t('cart.seo')} description={t('cart.title')} noindex />
      <h1 className="font-display text-4xl font-bold text-forest">{t('cart.title')}</h1>
      <p className="mt-1 text-ink-soft">{t('cart.itemsCount', { count: totals.quantity })}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-label={t('cart.title')}>
          <PromoProgress quantity={totals.quantity} />
          <ul className="mt-6 space-y-4">
            <AnimatePresence initial={false}>
              {items.map((i) => {
                const name = (lang === 'en' ? i.name_en : i.name_fr) || i.name_fr;
                return (
                  <motion.li key={`${i.productId}-${i.size}`} layout
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60, height: 0, marginTop: 0 }}
                    className="flex gap-4 overflow-hidden rounded-3xl bg-white p-4 shadow-card ring-1 ring-forest/5">
                    <Link to={to('product', { slug: i.slug })} className="shrink-0">
                      <img src={i.image} alt={name} width="112" height="112" loading="lazy" className="h-24 w-24 rounded-2xl bg-cream object-cover md:h-28 md:w-28" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={to('product', { slug: i.slug })} className="font-display font-semibold text-forest hover:text-emerald">{name}</Link>
                          <p className="text-sm text-ink-soft">{t('cart.size', { size: formatSize(i.size) })} · {fmt(i.unitPrice)}</p>
                          {i.maxStock != null && i.maxStock <= 3 && <p className="text-xs font-semibold text-amber">{t('cart.stockLimited', { count: i.maxStock })}</p>}
                        </div>
                        <button type="button" onClick={() => { removeItem(i.productId, i.size); toast(t('cart.removed')); }}
                          aria-label={t('cart.remove', { name, size: formatSize(i.size) })}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-forest/60 transition hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                        <QuantityStepper value={i.quantity} max={Math.min(20, i.maxStock ?? 20)} onChange={(q) => updateQuantity(i.productId, i.size, q)} />
                        <p className="font-display text-lg font-bold text-forest">{fmt(i.unitPrice * i.quantity)}</p>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          <Link to={to('shop')} className="mt-6 inline-flex items-center gap-1 font-semibold text-emerald hover:underline">← {t('cart.continue')}</Link>
        </section>

        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-forest/5 lg:sticky lg:top-28" aria-labelledby="summary-title">
          <h2 id="summary-title" className="mb-5 font-display text-xl font-bold text-forest">{t('cart.summary')}</h2>
          <CartSummary totals={totals} />
          <Button size="lg" className="mt-6 w-full" onClick={onCheckout}>{t('cart.checkout')} <ArrowRight className="h-5 w-5" aria-hidden /></Button>
          <p className="mt-4 flex items-start gap-2 text-xs text-ink-soft"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald" aria-hidden /> {t('cart.secure')}</p>
        </aside>
      </div>
    </div>
  );
}
