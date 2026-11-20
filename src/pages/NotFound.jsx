import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Seo from '../components/seo/Seo';
import Button from '../components/ui/Button';
import { useLang } from '../hooks/useLang';

export default function NotFound() {
  const { t } = useTranslation();
  const { to } = useLang();
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <Seo title={t('notFound.seoTitle')} description={t('notFound.text')} noindex />
      <motion.p className="bg-signature bg-clip-text font-display text-[8rem] font-bold leading-none text-transparent"
        initial={{ rotate: -8, scale: 0.8, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }}>
        {t('notFound.code')}
      </motion.p>
      <h1 className="mt-4 font-display text-3xl font-bold text-forest">{t('notFound.title')}</h1>
      <p className="mt-3 text-ink-soft">{t('notFound.text')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to={to('home')}>{t('notFound.cta')}</Button>
        <Button to={to('shop')} variant="outline">{t('notFound.shop')}</Button>
      </div>
    </section>
  );
}
