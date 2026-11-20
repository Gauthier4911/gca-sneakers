import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../lib/format';
import { useSettings } from '../../context/SettingsContext';

/** Prix (avec prix barré si promo). size: sm | lg */
export default function Price({ price, promoPrice, size = 'sm', dark = false }) {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const fmt = (v) => formatPrice(v, i18n.language, settings.currency);
  const big = size === 'lg';
  const hasPromo = promoPrice != null && Number(promoPrice) < Number(price);
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-display font-bold ${big ? 'text-3xl' : 'text-lg'} ${hasPromo ? 'text-amber' : dark ? 'text-white' : 'text-forest'}`}>
        {fmt(hasPromo ? promoPrice : price)}
      </span>
      {hasPromo && (
        <span className={`text-ink-soft line-through ${big ? 'text-lg' : 'text-sm'}`}>
          <span className="sr-only">{t('product.oldPrice', { price: fmt(price) })}</span>
          <span aria-hidden>{fmt(price)}</span>
        </span>
      )}
    </p>
  );
}
