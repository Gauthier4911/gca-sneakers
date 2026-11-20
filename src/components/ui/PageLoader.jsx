import { useTranslation } from 'react-i18next';

export default function PageLoader() {
  const { t } = useTranslation();
  return (
    <div role="status" className="grid min-h-[50vh] place-items-center">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" aria-hidden />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
