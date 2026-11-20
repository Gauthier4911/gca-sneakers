import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { formatSize } from '../../lib/format';

const LOW = 3;

/** Grille des pointures : épuisées barrées, stock faible signalé, navigation clavier native. */
export default function SizePicker({ variants, value, onChange, error }) {
  const { t } = useTranslation();
  const selected = variants.find((v) => v.size === value);

  return (
    <fieldset aria-describedby="size-help">
      <legend className="font-display font-semibold text-forest">{t('product.chooseSize')}</legend>
      <div role="radiogroup" className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
        {variants.map((v) => {
          const out = v.stock <= 0;
          const active = v.size === value;
          return (
            <motion.button key={v.id ?? v.size} type="button" role="radio" aria-checked={active} disabled={out}
              whileTap={out ? undefined : { scale: 0.92 }}
              onClick={() => onChange(v.size)}
              aria-label={out ? t('product.sizeOut', { size: formatSize(v.size) })
                : v.stock <= LOW ? t('product.sizeLeft', { size: formatSize(v.size), count: v.stock }) : t('product.size', { size: formatSize(v.size) })}
              className={`relative h-12 rounded-xl border-2 font-semibold transition
                ${active ? 'border-forest bg-forest text-white shadow-card' : ''}
                ${out ? 'cursor-not-allowed border-forest/10 bg-forest/5 text-forest/30 line-through' : ''}
                ${!active && !out ? 'border-forest/15 bg-white text-forest hover:border-emerald' : ''}`}>
              {formatSize(v.size)}
              {!out && v.stock <= LOW && <span aria-hidden className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-mango ring-2 ring-white" />}
            </motion.button>
          );
        })}
      </div>
      <p id="size-help" aria-live="polite" className={`mt-2 min-h-5 text-sm ${error ? 'font-semibold text-red-700' : 'text-ink-soft'}`}>
        {error ? t('product.sizeRequired')
          : selected ? (selected.stock <= LOW ? <span className="font-semibold text-amber">{t('product.lowStock', { count: selected.stock })}</span> : t('product.inStock'))
            : ''}
      </p>
    </fieldset>
  );
}
