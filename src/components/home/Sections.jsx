import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Baby, Footprints, GraduationCap, MessageCircle, Mountain, Quote, Ruler,
  Shirt, Star, Sun, Trophy, Truck, User, UserRound,
} from 'lucide-react';
import Reveal from '../ui/Reveal';
import SplitText from '../motion/SplitText';
import Button from '../ui/Button';
import { SocialLinks } from '../layout/Footer';
import { useLang } from '../../hooks/useLang';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';
import ProductGrid from '../product/ProductGrid';
import { useCatalog } from '../../hooks/useCatalog';

export function SectionTitle({ title, subtitle, light = false }) {
  return (
    <Reveal className="mb-10 text-center" y={0}>
      <h2 className={`font-display text-3xl font-bold tracking-tight md:text-5xl ${light ? 'text-white' : 'text-forest'}`}>
        <SplitText text={title} inView stagger={0.05} />
      </h2>
      <motion.span aria-hidden className="mx-auto mt-4 block h-1.5 w-20 origin-left rounded-full bg-signature"
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} />
      {subtitle && <p className={`mt-4 ${light ? 'text-white/80' : 'text-ink-soft'}`}>{subtitle}</p>}
    </Reveal>
  );
}

/* ---------- Homme / Femme / Enfant ------------------------------------- */
export function GenderCards() {
  const { t } = useTranslation();
  const { to } = useLang();
  const cards = [
    { id: 'men', Icon: User, cls: 'from-forest to-emerald text-white' },
    { id: 'women', Icon: UserRound, cls: 'from-gold to-mango text-forest' },
    { id: 'kids', Icon: Baby, cls: 'from-emerald to-mint text-forest' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <SectionTitle title={t('home.genders.title')} />
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map(({ id, Icon, cls }, i) => (
          <Reveal key={id} delay={i * 0.1}>
            <Link to={to('shop', {}, `?gender=${id}`)}
              className={`group relative flex h-40 flex-col md:h-56 justify-end overflow-hidden rounded-3xl bg-gradient-to-br p-6 shadow-card transition-transform duration-300 hover:-translate-y-1.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-gold ${cls}`}>
              <Icon aria-hidden className="absolute -right-6 -top-6 h-44 w-44 opacity-15 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
              <span className="font-display text-3xl font-bold">{t(`home.genders.${id}`)}</span>
              <span className="mt-2 inline-flex items-center gap-1 font-semibold">
                {t('home.genders.cta')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Catégories (depuis Supabase) ------------------------------- */
const CATEGORY_ICONS = { sneakers: Footprints, sport: Trophy, 'ville-habille': Shirt, sandales: Sun, bottes: Mountain, ecole: GraduationCap };

export function CategoryGrid() {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const [cats, setCats] = useState(null);

  useEffect(() => {
    supabase.from('categories').select('id, slug, name_fr, name_en').order('position')
      .then(({ data }) => setCats(data ?? []));
  }, []);

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionTitle title={t('home.categories.title')} subtitle={t('home.categories.subtitle')} />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(cats ?? Array.from({ length: 6 }, (_, i) => ({ id: i }))).map((c, i) => {
            const Icon = CATEGORY_ICONS[c.slug] ?? Footprints;
            return (
              <Reveal as="li" key={c.id} delay={i * 0.05}>
                {c.slug ? (
                  <Link to={to('category', { slug: c.slug })}
                    className="group flex h-full flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-card ring-1 ring-forest/5 transition hover:-translate-y-1 hover:ring-gold focus-visible:outline focus-visible:outline-4 focus-visible:outline-gold">
                    <span className="grid h-16 w-16 place-items-center rounded-2xl bg-forest text-gold transition-colors group-hover:bg-signature group-hover:text-forest">
                      <Icon className="h-8 w-8" aria-hidden />
                    </span>
                    <span className="font-display font-semibold text-forest">{lang === 'en' ? c.name_en : c.name_fr}</span>
                  </Link>
                ) : (
                  <div className="h-36 animate-pulse rounded-2xl bg-white" aria-hidden />
                )}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Bandeau promo ---------------------------------------------- */
export function PromoBanner() {
  const { t } = useTranslation();
  const { to } = useLang();
  const { settings } = useSettings();
  const vars = { percent: settings.promo_percent, count: settings.promo_threshold };
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-signature px-6 py-12 text-forest md:px-14">
          <motion.div aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full border-[18px] border-white/30"
            animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
          <p aria-hidden className="absolute -bottom-6 right-6 font-display text-[9rem] font-bold leading-none text-white/25">-{settings.promo_percent}%</p>
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t('home.promo.title', vars)}</h2>
            <p className="mt-3 text-lg font-medium">{t('home.promo.text')}</p>
            <Button to={to('shop')} variant="secondary" size="lg" className="mt-6 bg-forest hover:bg-emerald">
              {t('home.promo.cta')} <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Arguments -------------------------------------------------- */
export function Arguments() {
  const { t } = useTranslation();
  const items = [
    { id: 'delivery', Icon: Truck }, { id: 'quality', Icon: BadgeCheck },
    { id: 'whatsapp', Icon: MessageCircle }, { id: 'sizes', Icon: Ruler },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <SectionTitle title={t('home.args.title')} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ id, Icon }, i) => (
          <Reveal key={id} delay={i * 0.08} className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-forest/5">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mint-light text-emerald"><Icon className="h-7 w-7" aria-hidden /></span>
            <h3 className="mt-4 font-display text-lg font-semibold text-forest">{t(`home.args.${id}.title`)}</h3>
            <p className="mt-2 text-ink-soft">{t(`home.args.${id}.text`)}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Témoignages ------------------------------------------------ */
export function Testimonials() {
  const { t } = useTranslation();
  const items = t('home.testimonials.items', { returnObjects: true });
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionTitle title={t('home.testimonials.title')} />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.isArray(items) && items.map((it, i) => (
            <Reveal as="figure" key={it.name} delay={i * 0.1} className="relative rounded-3xl bg-white p-6 shadow-card">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-gold/40" aria-hidden />
              <div className="flex gap-0.5 text-gold" aria-hidden>{Array.from({ length: 5 }, (_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
              <blockquote className="mt-3 text-forest">« {it.text} »</blockquote>
              <figcaption className="mt-4 font-display font-semibold text-emerald">{it.name}</figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Teaser boutique / vidéo / réseaux --------------------------- */
export function StoreTeaser() {
  const { t } = useTranslation();
  const { to } = useLang();
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
      <Reveal>
        <div className="relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-forest p-8 text-white md:grid-cols-2 md:p-14">
          <div aria-hidden className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald/50 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t('home.store.title')}</h2>
            <p className="mt-3 text-white/85">{t('home.store.text')}</p>
            <SocialLinks className="mt-6" />
          </div>
          <div className="relative flex md:justify-end">
            <Button to={to('store')} size="lg">{t('home.store.cta')} <ArrowRight className="h-5 w-5" aria-hidden /></Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Coups de cœur (is_featured) --------------------------------- */
export function FeaturedProducts() {
  const { t } = useTranslation();
  const { to } = useLang();
  const { products, loading } = useCatalog();
  const featured = products.filter((p) => p.is_featured).slice(0, 8);
  if (!loading && featured.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <SectionTitle title={t('home.featured.title')} subtitle={t('home.featured.subtitle')} />
      <ProductGrid products={featured} loading={loading} skeletons={4} className="grid-cols-2 lg:grid-cols-4" />
      <div className="mt-10 text-center">
        <Button to={to('shop')} variant="outline">{t('home.featured.seeAll')} <ArrowRight className="h-5 w-5" aria-hidden /></Button>
      </div>
    </section>
  );
}
