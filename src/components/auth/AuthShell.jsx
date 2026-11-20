import { motion } from 'framer-motion';
import { BadgeCheck, MessageCircle, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';

/** Mise en page des écrans connexion / inscription (panneau de marque + formulaire). */
export default function AuthShell({ title, subtitle, notice, children }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:py-16 lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden rounded-[2rem] bg-forest p-10 text-white lg:block">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald/60 blur-3xl" />
        <div className="relative">
          <Logo variant="light" className="h-16 w-auto" />
          <p className="mt-6 max-w-sm font-display text-2xl font-semibold">{t('brand.tagline')}</p>
          <ul className="mt-10 space-y-5">
            {[[Truck, 'delivery'], [BadgeCheck, 'quality'], [MessageCircle, 'whatsapp']].map(([Icon, k], i) => (
              <motion.li key={k} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signature text-forest"><Icon className="h-5 w-5" aria-hidden /></span>
                <span><strong className="block font-display">{t(`home.args.${k}.title`)}</strong><span className="text-sm text-white/75">{t(`home.args.${k}.text`)}</span></span>
              </motion.li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-forest/5 md:p-10">
        <h1 className="font-display text-3xl font-bold text-forest md:text-4xl">{title}</h1>
        <p className="mt-2 text-ink-soft">{subtitle}</p>
        {notice && <p className="mt-5 rounded-2xl bg-gold/15 px-4 py-3 text-sm font-medium text-forest">{notice}</p>}
        <div className="mt-8">{children}</div>
      </section>
    </div>
  );
}
