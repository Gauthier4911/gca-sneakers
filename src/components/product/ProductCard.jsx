import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Price from './Price';
import TiltCard from '../motion/TiltCard';
import { discountPercent, imageAlt, isInStock, tr } from '../../lib/catalog';
import { useLang } from '../../hooks/useLang';

/** Carte produit : la 2e photo apparaît au survol, badges promo / rupture. */
export default function ProductCard({ product, priority = false, index = 0 }) {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const [img1, img2] = product.images;
  const name = tr(product, 'name', lang);
  const pct = discountPercent(product);
  const available = isInStock(product);
  const sizes = product.variants.filter((v) => v.stock > 0).length;

  return (
    <motion.article layout initial={{ opacity: 0, y: 40, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-30px' }}
      exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }} className="group relative">
      <Link to={to('product', { slug: product.slug })}
        className="block rounded-3xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-gold">
        <TiltCard className="rounded-3xl">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream shadow-card ring-1 ring-forest/5 transition-shadow duration-300 group-hover:shadow-[0_25px_50px_-15px_rgba(5,59,44,0.45)]">
          {img1 && (
            <img src={img1.url} alt={imageAlt(img1, product, lang)} width="800" height="800"
              loading={priority ? 'eager' : 'lazy'} decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          )}
          {img2 && (
            <img src={img2.url} alt="" aria-hidden width="800" height="800" loading="lazy" decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {pct > 0 && <span className="rounded-full bg-signature px-3 py-1 text-xs font-bold text-forest shadow">{t('product.promo', { percent: pct })}</span>}
            {!available && <span className="rounded-full bg-forest px-3 py-1 text-xs font-bold text-white">{t('product.outOfStock')}</span>}
          </div>
          {/* Pastille « voir » qui apparaît au survol */}
          <span aria-hidden className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-signature text-forest opacity-0 shadow-glow transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">→</span>
        </div>
        </TiltCard>
        <div className="px-1 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald">
            {t(`enums.gender.${product.gender}`)} · {t(`enums.shoeType.${product.shoe_type}`)}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold text-forest transition-colors group-hover:text-emerald">{name}</h3>
          <div className="mt-1"><Price price={product.price} promoPrice={product.promo_price} /></div>
          {available && <p className="mt-0.5 text-xs text-ink-soft">{t('product.sizesCount', { count: sizes })}</p>}
        </div>
      </Link>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="aspect-square rounded-3xl bg-cream" />
      <div className="mt-3 h-3 w-1/3 rounded bg-cream" />
      <div className="mt-2 h-4 w-2/3 rounded bg-cream" />
      <div className="mt-2 h-4 w-1/4 rounded bg-cream" />
    </div>
  );
}
