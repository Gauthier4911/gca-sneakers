import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, Truck } from 'lucide-react';
import Button from '../ui/Button';
import paths from '../ui/logo-paths.json';
import { useLang } from '../../hooks/useLang';
import { useSettings } from '../../context/SettingsContext';

/** Grande sneaker dessinée au trait (reprend le logo) qui flotte doucement. */
function HeroShoe() {
  const reduce = useReducedMotion();
  const stroke = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const draw = (delay, duration = 1.4) => ({
    initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 },
    transition: { duration, delay, ease: 'easeInOut' },
  });
  return (
    <motion.svg viewBox="50 30 540 340" className="h-auto w-full drop-shadow-[0_20px_40px_rgba(255,138,0,0.35)]" aria-hidden
      animate={reduce ? undefined : { y: [0, -14, 0], rotate: [-2, 1, -2] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
      <defs>
        <linearGradient id="heroGold" gradientUnits="userSpaceOnUse" x1="84" y1="0" x2="564" y2="0">
          <stop offset="0" stopColor="#FFB800" /><stop offset="1" stopColor="#FF7A00" />
        </linearGradient>
      </defs>
      <motion.path d={paths.upper} stroke="#FFFFFF" strokeWidth="14" {...stroke} {...draw(0.2)} />
      <motion.path d={paths.loop} stroke="#FFFFFF" strokeWidth="11" {...stroke} {...draw(1)} />
      <motion.path d={paths.laces} stroke="#34D399" strokeWidth="11" {...stroke} {...draw(1.3, 0.6)} />
      <motion.path d="M70 340 H578" stroke="url(#heroGold)" strokeWidth="22" {...stroke} {...draw(1.1, 0.8)} />
    </motion.svg>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const { to } = useLang();
  const { settings } = useSettings();
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <section className="relative isolate overflow-hidden bg-forest text-white">
      {/* Halos de couleur */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-mango/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-24 pt-14 md:grid-cols-2 md:px-6 md:pb-32 md:pt-20">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p variants={item} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-mint ring-1 ring-white/15">
            <Sparkles className="h-4 w-4 text-gold" aria-hidden /> {t('home.hero.eyebrow')}
          </motion.p>
          <motion.h1 variants={item} className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {t('home.hero.title1')}{' '}
            <span className="bg-signature bg-clip-text text-transparent">{t('home.hero.title2')}</span>
          </motion.h1>
          <motion.p variants={item} className="mt-5 max-w-xl text-lg text-white/85">{t('home.hero.subtitle')}</motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Button to={to('finder')} size="lg"><Sparkles className="h-5 w-5" aria-hidden />{t('home.hero.ctaFinder')}</Button>
            <Button to={to('shop')} size="lg" variant="ghostLight">{t('home.hero.ctaShop')}<ArrowRight className="h-5 w-5" aria-hidden /></Button>
          </motion.div>
        </motion.div>

        <div className="relative mx-auto w-full max-w-lg">
          <div aria-hidden className="absolute left-1/2 top-1/2 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-emerald to-forest-700 ring-1 ring-white/10" />
          <div className="relative p-6"><HeroShoe /></div>
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6, type: 'spring' }}
            className="absolute right-2 top-4 rotate-6 rounded-2xl bg-signature px-4 py-2 font-display text-lg font-bold text-forest shadow-glow">
            {t('home.hero.badge', { percent: settings.promo_percent, count: settings.promo_threshold })}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.9 }}
            className="absolute bottom-6 left-0 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-forest shadow-card">
            <Truck className="h-5 w-5 text-emerald" aria-hidden /> {t('home.args.delivery.title')}
          </motion.div>
        </div>
      </div>

      {/* Vague de transition vers la section suivante */}
      <svg aria-hidden className="absolute -bottom-px left-0 w-full text-white" viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path fill="currentColor" d="M0 80V40C240 0 480 0 720 30s480 50 720 10v40z" />
      </svg>
    </section>
  );
}
