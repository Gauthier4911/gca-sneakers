import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import Seo from '../components/seo/Seo';
import AuthShell from '../components/auth/AuthShell';
import FormField from '../components/forms/FormField';
import Button from '../components/ui/Button';
import { authErrorKey, forgotSchema } from '../schemas/auth';
import { supabase } from '../lib/supabase';
import { useLang } from '../hooks/useLang';

/**
 * Mot de passe oublié : Supabase envoie un lien sécurisé (valable 1 h) qui
 * ramène sur la page « nouveau mot de passe ». Le message affiché est le même
 * que l'email existe ou non (on ne révèle pas quels emails ont un compte).
 */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const { to } = useLang();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }) => {
    setFormError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${to('reset')}` });
    // Seule la limite anti-abus est signalée ; sinon toujours le même message
    if (error && authErrorKey(error) === 'auth.errors.rateLimit') { setFormError('auth.errors.rateLimit'); return; }
    setSent(true);
  };

  return (
    <>
      <Seo title={t('auth.forgotSeo')} description={t('auth.forgotSubtitle')} noindex />
      <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
        {sent ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status" className="rounded-2xl bg-mint-light p-6 text-center">
            <MailCheck className="mx-auto h-12 w-12 text-emerald" aria-hidden />
            <p className="mt-3 font-medium text-forest">{t('auth.forgotSent')}</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FormField label={t('auth.email')} type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
            {formError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{t(formError)}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? t('common.loading') : t('auth.forgotCta')}</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link to={to('login')} className="font-semibold text-emerald hover:underline">← {t('auth.backToLogin')}</Link></p>
      </AuthShell>
    </>
  );
}
