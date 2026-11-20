import { useTranslation } from 'react-i18next';

const STYLES = {
  pending: 'bg-gold/20 text-forest', confirmed: 'bg-mint-light text-emerald-800', paid: 'bg-emerald text-white',
  shipped: 'bg-forest text-white', delivered: 'bg-mint text-forest', cancelled: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${STYLES[status] ?? ''}`}>{t(`orderStatus.${status}`)}</span>;
}
