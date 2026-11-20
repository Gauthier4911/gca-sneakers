import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, min = 1, max = 20 }) {
  const { t } = useTranslation();
  const btn = 'grid h-12 w-12 place-items-center rounded-full text-forest transition hover:bg-forest/5 disabled:opacity-30';
  return (
    <div className="inline-flex items-center rounded-full border-2 border-forest/15 bg-white" role="group" aria-label={t('product.quantity')}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t('product.decrease')}>
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <output aria-live="polite" className="w-8 text-center font-display text-lg font-semibold text-forest">{value}</output>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t('product.increase')}>
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
