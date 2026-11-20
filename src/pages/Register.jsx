import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Seo from '../components/seo/Seo';
import AuthShell from '../components/auth/AuthShell';
import FormField from '../components/forms/FormField';
import Button from '../components/ui/Button';
import { authErrorKey, registerSchema, safeNext } from '../schemas/auth';
import { supabase } from '../lib/supabase';
import { useLang } from '../hooks/useLang';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { t } = useTranslation();
  const { to } = useLang();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [formError, setFormError] = useState(null);
  const next = safeNext(sp.get('next'), to('account'));
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) });

  if (user) return <Navigate to={next} replace />;

  const onSubmit = async ({ email, password, full_name, whatsapp, address, website }) => {
    if (website) return; // robot
    setFormError(null);
    // Les infos du profil passent par les métadonnées : le trigger SQL crée le profil (rôle client forcé).
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name, whatsapp, address } },
    });
    if (error || !data.session) { setFormError(error ? authErrorKey(error, 'register') : 'auth.errors.signupFailed'); return; }
    await refreshProfile();
    toast.success(t('auth.welcome', { name: full_name.split(' ')[0] }));
    navigate(next, { replace: true });
  };

  return (
    <>
      <Seo title={t('auth.registerSeo')} description={t('auth.registerSubtitle')} noindex />
      <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} notice={sp.get('reason') === 'checkout' ? t('auth.checkoutNotice') : null}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
          <FormField className="sm:col-span-2" label={t('auth.fullName')} autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
          <FormField label={t('auth.email')} type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
          <FormField label={t('auth.whatsapp')} type="tel" autoComplete="tel" inputMode="tel" placeholder="+225 07 00 00 00 00"
            hint={t('auth.whatsappHint')} error={errors.whatsapp?.message} {...register('whatsapp')} />
          <FormField className="sm:col-span-2" as="textarea" rows={2} label={t('auth.address')} autoComplete="street-address"
            hint={t('auth.addressHint')} error={errors.address?.message} {...register('address')} />
          <FormField label={t('auth.password')} type="password" autoComplete="new-password" hint={t('auth.passwordHint')} error={errors.password?.message} {...register('password')} />
          <FormField label={t('auth.passwordConfirm')} type="password" autoComplete="new-password" error={errors.passwordConfirm?.message} {...register('passwordConfirm')} />
          {/* Champ piège invisible pour les robots */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" {...register('website')} /></label>
          </div>
          {formError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 sm:col-span-2">{t(formError)}</p>}
          <Button type="submit" size="lg" className="w-full sm:col-span-2" disabled={isSubmitting}>{isSubmitting ? t('common.loading') : t('auth.registerCta')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          {t('auth.hasAccount')}{' '}
          <Link to={to('login', {}, sp.toString() ? `?${sp.toString()}` : '')} className="font-semibold text-emerald hover:underline">{t('auth.toLogin')}</Link>
        </p>
      </AuthShell>
    </>
  );
}
