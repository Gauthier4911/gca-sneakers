import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Check, MapPin, Store, Truck } from 'lucide-react';
import Seo from '../components/seo/Seo';
import Button from '../components/ui/Button';
import CartSummary from '../components/cart/CartSummary';
import PromoProgress from '../components/cart/PromoProgress';
import { WhatsAppIcon } from '../components/ui/SocialIcons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLang } from '../hooks/useLang';
import { useCartRevalidation } from './Cart';
import { computeTotals } from '../lib/cart';
import { formatPrice, formatSize } from '../lib/format';
import { supabase } from '../lib/supabase';
import { ORDER_FIELDS } from '../hooks/useOrders';
import { buildOrderMessage, whatsappLink } from '../lib/whatsapp';

const RPC_ERRORS = ['NOT_AUTHENTICATED', 'PROFILE_INCOMPLETE', 'ADDRESS_REQUIRED', 'INVALID_CART', 'OUT_OF_STOCK', 'PRODUCT_UNAVAILABLE', 'TOO_MANY_PENDING_ORDERS'];

export default function Checkout() {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { profile } = useAuth();
  const { settings } = useSettings();
  const [fulfillment, setFulfillment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  useCartRevalidation();

  const totals = useMemo(() => computeTotals(items, {
    promoThreshold: Number(settings.promo_threshold), promoPercent: Number(settings.promo_percent),
    deliveryFee: Number(settings.delivery_fee), fulfillment,
  }), [items, settings, fulfillment]);
  const fmt = (v) => formatPrice(v, lang, settings.currency);

  if (items.length === 0 && !submitting) return <Navigate to={to('cart')} replace />;

  const hasAddress = !!profile?.address?.trim();
  const hasWhatsapp = !!profile?.whatsapp;

  const onConfirm = async () => {
    if (!fulfillment) { setError(t('checkout.chooseFulfillment')); return; }
    setError(null); setSubmitting(true);
    // Fenêtre ouverte tout de suite (dans le clic) pour ne pas être bloquée par le navigateur
    const win = window.open('', '_blank');
    try {
      const payload = items.map((i) => ({ product_id: i.productId, size: Number(i.size), quantity: i.quantity }));
      const { data, error: rpcError } = await supabase.rpc('create_order', { p_items: payload, p_fulfillment: fulfillment, p_locale: lang });
      if (rpcError) throw rpcError;
      const created = Array.isArray(data) ? data[0] : data;
      // On relit la commande enregistrée : le message WhatsApp utilise les montants du serveur
      const { data: order } = await supabase.from('orders').select(ORDER_FIELDS).eq('id', created.order_id).single();
      const link = whatsappLink(settings.whatsapp_number, buildOrderMessage(order, { lang, settings }));
      if (win) { win.opener = null; win.location.href = link; }
      clear();
      navigate(to('confirmation', { orderNumber: created.order_number }), { replace: true, state: { link, opened: !!win } });
    } catch (e) {
      win?.close();
      const code = RPC_ERRORS.find((c) => e?.message?.includes(c));
      const msg = t(`checkout.errors.${code ?? 'generic'}`, { detail: e?.details ?? '' });
      setError(msg); toast.error(msg); setSubmitting(false);
    }
  };

  const Option = ({ id, Icon, title, price, children, disabled }) => {
    const active = fulfillment === id;
    return (
      <motion.button type="button" role="radio" aria-checked={active} disabled={disabled} onClick={() => { setFulfillment(id); setError(null); }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className={`relative flex w-full gap-4 rounded-3xl border-2 p-5 text-left transition
          ${active ? 'border-forest bg-forest text-white shadow-card' : 'border-forest/10 bg-white text-forest hover:border-emerald'}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${active ? 'bg-signature text-forest' : 'bg-mint-light text-emerald'}`}><Icon className="h-6 w-6" aria-hidden /></span>
        <span className="flex-1">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-lg font-semibold">{title}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${active ? 'bg-white/15' : 'bg-gold/20'}`}>{price}</span>
          </span>
          <span className={`mt-2 block text-sm ${active ? 'text-white/85' : 'text-ink-soft'}`}>{children}</span>
        </span>
        {active && <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-signature text-forest"><Check className="h-4 w-4" aria-hidden /></span>}
      </motion.button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Seo title={t('checkout.seo')} description={t('checkout.title')} noindex />
      <h1 className="font-display text-4xl font-bold text-forest">{t('checkout.title')}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* 1. Mode de réception */}
          <section aria-labelledby="ful-title">
            <h2 id="ful-title" className="flex items-center gap-3 font-display text-xl font-bold text-forest">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-signature text-sm">1</span>{t('checkout.fulfillmentTitle')}
            </h2>
            <div role="radiogroup" aria-labelledby="ful-title" className="mt-5 grid gap-4">
              <Option id="delivery" Icon={Truck} title={t('checkout.delivery')} price={t('checkout.deliveryFee', { fee: fmt(settings.delivery_fee) })} disabled={!hasAddress}>
                {hasAddress ? <><strong>{t('checkout.yourAddress')} :</strong> {profile.address}</> : t('checkout.missingAddress')}
              </Option>
              <Option id="pickup" Icon={Store} title={t('checkout.pickup')} price={t('checkout.pickupFree')}>
                <strong>{t('checkout.warehouse')} :</strong> {settings.warehouse_address}
              </Option>
            </div>
            <Link to={to('account')} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald hover:underline">
              <MapPin className="h-4 w-4" aria-hidden /> {t('checkout.editProfile')}
            </Link>
          </section>

          {/* 2. Récapitulatif */}
          <section aria-labelledby="rev-title">
            <h2 id="rev-title" className="flex items-center gap-3 font-display text-xl font-bold text-forest">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-signature text-sm">2</span>{t('checkout.reviewTitle')}
            </h2>
            <div className="mt-5 rounded-3xl bg-white p-5 shadow-card ring-1 ring-forest/5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-soft">{t('checkout.items')}</h3>
              <ul className="mt-3 divide-y divide-forest/10">
                {items.map((i) => (
                  <li key={`${i.productId}-${i.size}`} className="flex items-center gap-3 py-3">
                    <img src={i.image} alt="" width="56" height="56" className="h-14 w-14 rounded-xl bg-cream object-cover" />
                    <span className="flex-1 text-sm text-forest">
                      <strong className="font-display">{(lang === 'en' ? i.name_en : i.name_fr) || i.name_fr}</strong><br />
                      {t('cart.size', { size: formatSize(i.size) })} × {i.quantity}
                    </span>
                    <span className="font-semibold text-forest">{fmt(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-ink-soft">{t('checkout.customer')}</h3>
              <p className="mt-2 text-sm text-forest">{profile?.full_name} · {profile?.whatsapp || '—'}</p>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-forest/5 lg:sticky lg:top-28">
          <PromoProgress quantity={totals.quantity} />
          <CartSummary totals={totals} fulfillment={fulfillment} />
          {!hasWhatsapp && (
            <p className="flex gap-2 rounded-2xl bg-gold/15 p-3 text-sm text-forest"><AlertTriangle className="h-5 w-5 shrink-0 text-amber" aria-hidden />{t('checkout.missingWhatsapp')}</p>
          )}
          {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
          <Button size="lg" className="w-full" onClick={onConfirm} disabled={submitting || !hasWhatsapp}>
            <WhatsAppIcon className="h-5 w-5" /> {submitting ? t('checkout.confirming') : t('checkout.confirm')}
          </Button>
          <div className="rounded-2xl bg-cream p-4 text-sm">
            <p className="font-display font-semibold text-forest">{t('checkout.howItWorks')}</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-ink-soft">
              <li>{t('checkout.how1')}</li><li>{t('checkout.how2')}</li><li>{t('checkout.how3')}</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
