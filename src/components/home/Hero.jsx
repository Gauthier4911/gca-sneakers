import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, Truck } from 'lucide-react';
import Button from '../ui/Button';
import SplitText from '../motion/SplitText';
import Magnetic from '../motion/Magnetic';
import Marquee from '../motion/Marquee';
import paths from '../ui/logo-paths.json';
import { useLang } from '../../hooks/useLang';
import { useSettings } from '../../context/SettingsContext';

/** Grande sneaker dessinée au trait (reprend le logo) : se dessine, flotte, suit la souris. */
function HeroShoe({ rx, ry }) {
  const reduce = useReducedMotion();
  const stroke = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const draw = (delay, duration = 1.4) => ({
    initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 },
    transition: { duration, delay, ease: 'easeInOut' },
  });
  return (
    <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}>
      <motion.svg viewBox="50 30 540 340" className="h-auto w-full drop-shadow-[0_25px_45px_rgba(255,138,0,0.45)]" aria-hidden
        animate={reduce ? undefined : { y: [0, -16, 0], rotate: [-2, 1.5, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <defs>
          <linearGradient id="heroGold" gradientUnits="userSpaceOnUse" x1="84" y1="0" x2="564" y2="0">
            <stop offset="0" stopColor="#FFB800" /><stop offset="1" stopColor="#FF7A00" />
          </linearGradient>
        </defs>
        <motion.path d={paths.upper} stroke="#FFFFFF" strokeWidth="14" {...stroke} {...draw(0.4)} />
        <motion.path d={paths.loop} stroke="#FFFFFF" strokeWidth="11" {...stroke} {...draw(1.2)} />
        <motion.path d={paths.laces} stroke="#34D399" strokeWidth="11" {...stroke} {...draw(1.5, 0.6)} />
        <motion.path d="M70 340 H578" stroke="url(#heroGold)" strokeWidth="22" {...stroke} {...draw(1.3, 0.8)} />
      </motion.svg>
    </motion.div>
  );
}

/** Petites étincelles dorées qui flottent autour de la chaussure. */
function Sparks() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const dots = [[8, 20, 0], [88, 12, 0.6], [92, 70, 1.2], [4, 78, 1.8], [50, 4, 2.4], [70, 92, 0.9]];
  return dots.map(([l, top, d]) => (
    <motion.span key={`${l}-${top}`} aria-hidden className="absolute h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_4px_rgba(255,184,0,.6)]"
      style={{ left: `${l}%`, top: `${top}%` }}
      animate={{ y: [0, -14, 0], opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
      transition={{ duration: 3.2, delay: d, repeat: Infinity, ease: 'easeInOut' }} />
  ));
}

export default function Hero() {
  const { t } = useTranslation();
  const { to } = useLang();
  const { settings } = useSettings();
  const reduce = useReducedMotion();
  const ref = useRef(null);

  // Parallaxe au défilement : le contenu remonte et s'efface, la chaussure grossit
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const contentO = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);
  const shoeScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.15]);
  const blobY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);

  // Parallaxe à la souris (ordinateur) : la chaussure s'incline vers le curseur
  const mx = useMotionValue(0); const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 120, damping: 14 });
  const onMove = (e) => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const fade = (delay) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } });
  const marquee = t('home.marquee', { returnObjects: true });

  return (
    <section ref={ref} onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }}
      className="relative isolate overflow-hidden bg-forest text-white">
      {/* Halos de couleur animés */}
      <motion.div aria-hidden style={{ y: blobY }} className="pointer-events-none absolute inset-0">
        <motion.div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-emerald/60 blur-3xl"
          animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -right-24 top-1/4 h-[30rem] w-[30rem] rounded-full bg-mango/25 blur-3xl"
          animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 60, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-gold/20 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.25, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-12 md:grid-cols-2 md:px-6 md:pb-28 md:pt-20">
        <motion.div style={{ y: contentY, opacity: contentO }}>
          <motion.p {...fade(0.1)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-mint ring-1 ring-white/15 backdrop-blur">
            <Sparkles className="h-4 w-4 text-gold" aria-hidden /> {t('home.hero.eyebrow')}
          </motion.p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
            <SplitText text={t('home.hero.title1')} delay={0.25} />{' '}
            <SplitText text={t('home.hero.title2')} delay={0.5} wordClassName="bg-signature bg-clip-text text-transparent" />
          </h1>
          <motion.p {...fade(0.8)} className="mt-6 max-w-xl text-lg text-white/85">{t('home.hero.subtitle')}</motion.p>
          <motion.div {...fade(1)} className="mt-9 flex flex-wrap gap-3">
            <Magnetic><Button to={to('finder')} size="lg"><Sparkles className="h-5 w-5" aria-hidden />{t('home.hero.ctaFinder')}</Button></Magnetic>
            <Magnetic><Button to={to('shop')} size="lg" variant="ghostLight">{t('home.hero.ctaShop')}<ArrowRight className="h-5 w-5" aria-hidden /></Button></Magnetic>
          </motion.div>
        </motion.div>

        <motion.div style={{ scale: shoeScale }} className="relative mx-auto w-full max-w-lg">
          {/* Disque + anneaux qui tournent */}
          <motion.div aria-hidden style={{ x: '-50%', y: '-50%' }} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 aspect-square w-[78%] rounded-full bg-gradient-to-br from-emerald to-forest-700 ring-1 ring-white/10" />
          <motion.div aria-hidden style={{ x: '-50%', y: '-50%' }} animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute left-1/2 top-1/2 aspect-square w-[92%] rounded-full border-2 border-dashed border-gold/30" />
          <motion.div aria-hidden style={{ x: '-50%', y: '-50%' }} animate={reduce ? undefined : { rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute left-1/2 top-1/2 aspect-square w-[64%] rounded-full border border-mint/25" />
          <Sparks />
          <div className="relative p-6"><HeroShoe rx={rx} ry={ry} /></div>
          <motion.div initial={{ opacity: 0, scale: 0.4, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 6 }} transition={{ delay: 1.7, type: 'spring', stiffness: 220, damping: 12 }}
            className="absolute right-2 top-4 rounded-2xl bg-signature px-4 py-2 font-display text-lg font-bold text-forest shadow-glow">
            {t('home.hero.badge', { percent: settings.promo_percent, count: settings.promo_threshold })}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2, type: 'spring', stiffness: 160, damping: 16 }}
            className="absolute bottom-6 left-0 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-forest shadow-card">
            <Truck className="h-5 w-5 text-emerald" aria-hidden /> {t('home.args.delivery.title')}
          </motion.div>
        </motion.div>
      </div>

      {/* Bandeau défilant incliné, style streetwear */}
      {Array.isArray(marquee) && (
        <div className="relative -mb-2 rotate-[-2deg] scale-105 bg-signature py-3 shadow-glow">
          <Marquee items={marquee} speed={28} itemClassName="font-display text-lg font-bold uppercase tracking-wider text-forest md:text-2xl" />
        </div>
      )}
      <div className="h-10 bg-white md:h-14" aria-hidden />
    </section>
  );
}
