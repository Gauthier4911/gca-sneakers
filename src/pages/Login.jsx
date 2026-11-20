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
import { authErrorKey, loginSchema, safeNext } from '../schemas/auth';
import { supabase } from '../lib/supabase';
import { useLang } from '../hooks/useLang';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { to } = useLang();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { user } = useAuth();
  const [formError, setFormError] = useState(null);
  const next = safeNext(sp.get('next'), to('account'));
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });

  if (user) return <Navigate to={next} replace />;

  const onSubmit = async ({ email, password }) => {
    setFormError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setFormError(authErrorKey(error, 'login')); return; }
    toast.success(t('auth.welcome', { name: data.user?.user_metadata?.full_name?.split(' ')[0] ?? '' }));
    navigate(next, { replace: true });
  };

  return (
    <>
      <Seo title={t('auth.loginSeo')} description={t('auth.loginSubtitle')} noindex />
      <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} notice={sp.get('reason') === 'checkout' ? t('auth.checkoutNotice') : null}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormField label={t('auth.email')} type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
          <FormField label={t('auth.password')} type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          {formError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{t(formError)}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? t('common.loading') : t('auth.loginCta')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          {t('auth.noAccount')}{' '}
          <Link to={to('register', {}, sp.toString() ? `?${sp.toString()}` : '')} className="font-semibold text-emerald hover:underline">{t('auth.toRegister')}</Link>
        </p>
      </AuthShell>
    </>
  );
}
