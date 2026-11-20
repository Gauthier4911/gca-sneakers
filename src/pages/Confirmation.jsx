import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Seo from '../components/seo/Seo';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { WhatsAppIcon } from '../components/ui/SocialIcons';
import { supabase } from '../lib/supabase';
import { ORDER_FIELDS } from '../hooks/useOrders';
import { buildOrderMessage, whatsappLink } from '../lib/whatsapp';
import { formatPrice } from '../lib/format';
import { useSettings } from '../context/SettingsContext';
import { useLang } from '../hooks/useLang';

export default function Confirmation() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const { settings } = useSettings();
  const [order, setOrder] = useState(undefined);

  useEffect(() => {
    // La RLS garantit qu'on ne peut lire que SA commande
    supabase.from('orders').select(ORDER_FIELDS).eq('order_number', orderNumber).maybeSingle()
      .then(({ data }) => setOrder(data ?? null));
  }, [orderNumber]);

  if (order === undefined) return <PageLoader />;
  const link = state?.link || (order && whatsappLink(settings.whatsapp_number, buildOrderMessage(order, { lang, settings })));

  return (
    <section className="relative mx-auto max-w-2xl overflow-hidden px-4 py-16 text-center">
      <Seo title={t('confirmation.seo')} description={t('confirmation.text')} noindex />
      {/* Confettis */}
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span key={i} aria-hidden className={`absolute top-0 h-3 w-2 rounded-sm ${i % 3 === 0 ? 'bg-gold' : i % 3 === 1 ? 'bg-mango' : 'bg-mint'}`}
          style={{ left: `${(i * 53) % 100}%` }}
          initial={{ y: -20, opacity: 0, rotate: 0 }} animate={{ y: 420, opacity: [0, 1, 1, 0], rotate: 360 + i * 20 }}
          transition={{ duration: 2.4, delay: (i % 6) * 0.12, ease: 'easeIn' }} />
      ))}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-signature text-forest shadow-glow">
        <Check className="h-12 w-12" strokeWidth={3} aria-hidden />
      </motion.div>
      <h1 className="mt-6 font-display text-3xl font-bold text-forest md:text-4xl">{t('confirmation.title')}</h1>
      {order ? (
        <>
          <p className="mt-3 inline-block rounded-full bg-forest px-4 py-1.5 font-display font-semibold text-white">{t('confirmation.number', { number: order.order_number })}</p>
          <p className="mt-2 font-display text-xl font-bold text-forest">{formatPrice(order.total, lang, settings.currency)}</p>
          <p className="mx-auto mt-5 max-w-md text-lg text-forest">{t('confirmation.text')}</p>
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-4 font-display text-lg font-semibold text-forest shadow-card transition hover:-translate-y-0.5 hover:brightness-95">
            <WhatsAppIcon className="h-6 w-6" /> {t('confirmation.whatsapp')}
          </a>
          <p className="mt-3 text-sm text-ink-soft">{t('confirmation.whatsappHint')}</p>
        </>
      ) : <p className="mt-4 text-ink-soft">{t('confirmation.notFound')}</p>}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button to={to('account')} variant="outline">{t('confirmation.account')}</Button>
        <Button to={to('shop')} variant="secondary">{t('confirmation.shop')}</Button>
      </div>
    </section>
  );
}
