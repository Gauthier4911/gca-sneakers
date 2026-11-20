import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LogOut, Package, Shield } from 'lucide-react';
import Seo from '../components/seo/Seo';
import FormField from '../components/forms/FormField';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import StatusBadge from '../components/ui/StatusBadge';
import { WhatsAppIcon } from '../components/ui/SocialIcons';
import { profileSchema } from '../schemas/auth';
import { supabase } from '../lib/supabase';
import { formatPrice, formatSize } from '../lib/format';
import { buildOrderMessage, whatsappLink } from '../lib/whatsapp';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLang } from '../hooks/useLang';
import { useMyOrders } from '../hooks/useOrders';

export default function Account() {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const { user, profile, refreshProfile, signOut, isAdmin } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { orders, loading } = useMyOrders(user?.id);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) reset({ full_name: profile.full_name ?? '', whatsapp: profile.whatsapp ?? '', address: profile.address ?? '' });
  }, [profile, reset]);

  const onSave = async (values) => {
    const { error } = await supabase.from('profiles').update(values).eq('id', user.id);
    if (error) { toast.error(t('auth.errors.generic')); return; }
    await refreshProfile();
    toast.success(t('account.saved'));
  };
  const onLogout = async () => { navigate(to('home')); await signOut(); toast(t('auth.loggedOut')); };
  const fmt = (v) => formatPrice(v, lang, settings.currency);
  const date = (d) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' }).format(new Date(d));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <Seo title={t('account.seo')} description={t('account.title')} noindex />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald">{t('account.title')}</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-forest">{t('account.hello', { name: profile?.full_name?.split(' ')[0] ?? '' })}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <Button to="/admin" variant="secondary" size="sm"><Shield className="h-4 w-4" aria-hidden /> {t('account.admin')}</Button>}
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" aria-hidden /> {t('account.logout')}</Button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <Reveal as="section" className="h-fit rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-forest/5 md:p-8" aria-labelledby="profile-title">
          <h2 id="profile-title" className="font-display text-xl font-bold text-forest">{t('account.profile')}</h2>
          <p className="mt-1 text-sm text-ink-soft">{user?.email}</p>
          <form onSubmit={handleSubmit(onSave)} noValidate className="mt-6 space-y-4">
            <FormField label={t('auth.fullName')} autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
            <FormField label={t('auth.whatsapp')} type="tel" autoComplete="tel" hint={t('auth.whatsappHint')} error={errors.whatsapp?.message} {...register('whatsapp')} />
            <FormField as="textarea" rows={3} label={t('auth.address')} hint={t('auth.addressHint')} error={errors.address?.message} {...register('address')} />
            <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full">{t('account.save')}</Button>
          </form>
        </Reveal>

        <section aria-labelledby="orders-title">
          <h2 id="orders-title" className="font-display text-xl font-bold text-forest">{t('account.orders')}</h2>
          {loading ? (
            <div className="mt-6 space-y-4">{[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-cream" />)}</div>
          ) : orders.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-cream p-10 text-center">
              <Package className="mx-auto h-10 w-10 text-emerald" aria-hidden />
              <p className="mt-3 text-forest">{t('account.noOrders')}</p>
              <Button to={to('shop')} className="mt-5">{t('account.shopNow')}</Button>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {orders.map((o, i) => (
                <Reveal as="li" key={o.id} delay={i * 0.05} className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-forest/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-forest">{t('account.order', { number: o.order_number })}</h3>
                      <p className="text-sm text-ink-soft">{t('account.placedOn', { date: date(o.created_at) })} · {t(o.fulfillment === 'pickup' ? 'account.pickup' : 'account.delivery')}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <ul className="mt-4 space-y-1 text-sm text-forest">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-3">
                        <span>{it.product_name} · {formatSize(it.size)} × {it.quantity}</span>
                        <span className="font-medium">{fmt(it.unit_price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-forest/10 pt-4">
                    <p className="font-display text-lg font-bold text-forest">{t('account.total')} : {fmt(o.total)}</p>
                    {o.status === 'pending' && settings.whatsapp_number && (
                      <a href={whatsappLink(settings.whatsapp_number, buildOrderMessage(o, { lang, settings }))} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-forest hover:brightness-95">
                        <WhatsAppIcon className="h-4 w-4" /> {t('account.continueWhatsapp')}
                      </a>
                    )}
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
