import { useTranslation } from 'react-i18next';
import Seo from '../components/seo/Seo';
import Button from '../components/ui/Button';
import { useLang } from '../hooks/useLang';

/** Page temporaire pour les écrans des étapes suivantes. */
export default function ComingSoon({ titleKey }) {
  const { t } = useTranslation();
  const { to } = useLang();
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <Seo title={`${t(titleKey)} — GCA sneakers`} description={t('common.comingSoon')} noindex />
      <h1 className="font-display text-4xl font-bold text-forest">{t(titleKey)}</h1>
      <span aria-hidden className="mx-auto mt-3 block h-1.5 w-16 rounded-full bg-signature" />
      <p className="mt-6 text-ink-soft">{t('common.comingSoon')}</p>
      <Button to={to('home')} className="mt-8">{t('common.backHome')}</Button>
    </section>
  );
}
