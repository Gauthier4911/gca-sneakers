import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Gift, PartyPopper } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

/** « Plus que 2 articles pour débloquer la promo » + barre de progression animée. */
export default function PromoProgress({ quantity }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const threshold = Number(settings.promo_threshold) || 5;
  const percent = Number(settings.promo_percent) || 0;
  if (!percent) return null;
  const missing = Math.max(0, threshold - quantity);
  const done = missing === 0;
  return (
    <div className={`rounded-2xl p-4 ${done ? 'bg-signature text-forest' : 'bg-mint-light text-forest'}`} aria-live="polite">
      <p className="flex items-center gap-2 font-semibold">
        {done ? <PartyPopper className="h-5 w-5" aria-hidden /> : <Gift className="h-5 w-5 text-emerald" aria-hidden />}
        {done ? t('cart.promoActive', { count: threshold, percent }) : t('cart.promoMissing', { count: missing, percent })}
      </p>
      {!done && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" aria-hidden>
          <motion.div className="h-full rounded-full bg-signature" initial={false}
            animate={{ width: `${(Math.min(quantity, threshold) / threshold) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
        </div>
      )}
    </div>
  );
}
