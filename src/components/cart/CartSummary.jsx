import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { formatPrice } from '../../lib/format';
import { useSettings } from '../../context/SettingsContext';

/** Sous-total, remise, livraison, total (montants animés à chaque changement). */
export default function CartSummary({ totals, fulfillment = null, children }) {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const fmt = (v) => formatPrice(v, i18n.language, settings.currency);
  const Row = ({ label, value, strong, accent }) => (
    <div className={`flex justify-between gap-4 ${strong ? 'border-t border-forest/10 pt-4 text-lg' : 'text-sm'}`}>
      <dt className={strong ? 'font-display font-bold text-forest' : accent ? 'font-semibold text-emerald' : 'text-ink-soft'}>{label}</dt>
      <motion.dd key={String(value)} initial={{ opacity: 0.3, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className={strong ? 'font-display font-bold text-forest' : accent ? 'font-semibold text-emerald' : 'font-medium text-forest'}>{value}</motion.dd>
    </div>
  );
  return (
    <dl className="space-y-3">
      <Row label={t('cart.subtotal')} value={fmt(totals.subtotal)} />
      {totals.discount > 0 && (
        <Row accent label={t('cart.discount', { count: settings.promo_threshold, percent: settings.promo_percent })} value={`-${fmt(totals.discount)}`} />
      )}
      <Row label={t('cart.delivery')}
        value={fulfillment === null ? t('cart.deliveryNext') : fulfillment === 'pickup' ? t('checkout.pickupFree') : fmt(totals.deliveryFee)} />
      <Row strong label={t('cart.total')} value={fmt(totals.total)} />
      {children}
    </dl>
  );
}
