import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Footprints, Gem, Truck } from 'lucide-react';
import Button from '../ui/Button';
import Price from '../product/Price';
import { useCatalog } from '../../hooks/useCatalog';
import { useLang } from '../../hooks/useLang';
import { imageAlt, tr } from '../../lib/catalog';

const ICONS = [Footprints, Gem, Truck];

/**
 * « Scrollytelling » : la section reste fixée pendant qu'on fait défiler ;
 * la chaussure tourne à travers ses 4 vues, grossit, et les arguments
 * s'enchaînent. Comme une vidéo produit, mais pilotée par le doigt / la molette.
 */
export default function ShoeShowcase() {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const reduce = useReducedMotion();
  const { products } = useCatalog();
  const product = products.find((p) => p.is_featured && p.images.length === 4) ?? products.find((p) => p.images.length === 4);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, restDelta: 0.001 });
  const [frame, setFrame] = useState(0);
  const [step, setStep] = useState(0);

  // Vue de la chaussure (1→3→2→4 : rotation) et argument affiché selon le défilement
  const order = [0, 2, 1, 3];
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setFrame(order[Math.min(3, Math.floor(v * 4.2))]);
    setStep(Math.min(2, Math.floor(v * 3)));
  });
  const scale = useTransform(progress, [0, 0.5, 1], [0.85, 1.08, 0.95]);
  const rotate = useTransform(progress, [0, 1], [-8, 8]);
  const ringRotate = useTransform(progress, [0, 1], [0, 270]);
  const bigText = useTransform(progress, [0, 1], ['10%', '-60%']);
  const steps = t('home.showcase.steps', { returnObjects: true });
  if (!product || !Array.isArray(steps)) return null;
  const name = tr(product, 'name', lang);

  return (
    <section ref={ref} className={`relative ${reduce ? '' : 'h-[260vh] md:h-[300vh]'} bg-forest text-white`} aria-label={t('home.showcase.title')}>
      <div className={`${reduce ? '' : 'sticky top-0 h-[100svh]'} flex items-center overflow-hidden`}>
        {/* Grand texte décoratif qui glisse */}
        <motion.p aria-hidden style={{ x: reduce ? 0 : bigText }}
          className="text-outline pointer-events-none absolute top-[18%] whitespace-nowrap font-display text-[24vw] font-bold leading-none opacity-50 md:top-1/2 md:-translate-y-1/2 md:text-[16vw] md:opacity-100">
          {name.toUpperCase()}
        </motion.p>
        <div aria-hidden className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-4 px-4 py-6 md:grid-cols-2 md:gap-12 md:px-6 md:py-10">
          {/* Chaussure qui tourne */}
          <div className="relative mx-auto aspect-square w-[min(56vw,38svh)] max-w-[520px] md:w-full">
            <motion.div aria-hidden style={{ rotate: ringRotate }} className="absolute inset-[4%] rounded-full border-2 border-dashed border-gold/40" />
            <div aria-hidden className="absolute inset-[12%] rounded-full bg-gradient-to-br from-emerald to-forest-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,.6)]" />
            <motion.div style={{ scale, rotate }} className="absolute inset-[10%] overflow-hidden rounded-full">
              <AnimatePresence initial={false}>
                <motion.img key={product.images[frame].url} src={product.images[frame].url} alt={imageAlt(product.images[frame], product, lang)}
                  initial={{ opacity: 0, rotateY: -40, scale: 0.92 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} exit={{ opacity: 0, rotateY: 40, scale: 0.92 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover [transform-style:preserve-3d]" />
              </AnimatePresence>
            </motion.div>
            {/* Indicateur de rotation */}
            <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
              {order.map((o) => <span key={o} className={`h-1.5 rounded-full transition-all duration-300 ${frame === o ? 'w-8 bg-gold' : 'w-3 bg-white/30'}`} />)}
            </div>
          </div>

          {/* Arguments qui s'enchaînent */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mint md:text-sm">{t('home.showcase.eyebrow')}</p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight md:mt-3 md:text-6xl">{t('home.showcase.title')}</h2>
            <div className="mt-4 space-y-3 md:mt-8">
              {steps.map((s, i) => {
                const Icon = ICONS[i] ?? Gem; const active = reduce || i === step;
                return (
                  <motion.div key={s.title} animate={{ opacity: active ? 1 : 0.35, x: active ? 0 : -8 }} transition={{ duration: 0.4 }}
                    className={`gap-4 rounded-3xl p-4 transition-colors md:flex md:p-5 ${active ? 'flex bg-white/10 ring-1 ring-white/15' : 'hidden'}`}>
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-colors ${active ? 'bg-signature text-forest' : 'bg-white/10 text-white'}`}>
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-display text-lg font-semibold md:text-xl">{s.title}</span>
                      <span className="mt-1 block text-sm text-white/75 md:text-base">{s.text}</span>
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 md:mt-8 md:gap-5">
              <Button to={to('product', { slug: product.slug })} size="lg">{t('home.showcase.cta')} <ArrowRight className="h-5 w-5" aria-hidden /></Button>
              <div><p className="text-sm text-white/70">{name}</p><Price price={product.price} promoPrice={product.promo_price} dark /></div>
            </div>
            {!reduce && <p className="mt-6 hidden text-xs uppercase tracking-[0.2em] text-white/50 md:block">↓ {t('home.showcase.scroll')}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
