import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Seo from '../components/seo/Seo';
import AuthShell from '../components/auth/AuthShell';
import FormField from '../components/forms/FormField';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { authErrorKey, resetSchema } from '../schemas/auth';
import { supabase } from '../lib/supabase';
import { useLang } from '../hooks/useLang';

/**
 * Arrivée depuis le lien reçu par email : Supabase vérifie le lien et ouvre
 * une session temporaire de récupération, qui permet de définir le nouveau mot de passe.
 */
export default function ResetPassword() {
  const { t } = useTranslation();
  const { to } = useLang();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | ready | invalid
  const [formError, setFormError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetSchema) });

  useEffect(() => {
    // Lien expiré ou déjà utilisé : Supabase renvoie l'erreur dans l'adresse
    if (/error=|error_code=/.test(window.location.hash + window.location.search)) { setStatus('invalid'); return undefined; }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setStatus('ready');
    });
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setStatus((s) => (s === 'checking' ? (data.session ? 'ready' : 'invalid') : s));
    }, 2500);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const onSubmit = async ({ password }) => {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setFormError(authErrorKey(error)); return; }
    // On nettoie l'adresse (les jetons du lien ne doivent pas rester dans l'historique)
    window.history.replaceState(null, '', window.location.pathname);
    toast.success(t('auth.resetDone'));
    navigate(to('account'), { replace: true });
  };

  return (
    <>
      <Seo title={t('auth.resetSeo')} description={t('auth.resetSubtitle')} noindex />
      <AuthShell title={t('auth.resetTitle')} subtitle={status === 'ready' ? t('auth.resetSubtitle') : ''}>
        {status === 'checking' && <div><PageLoader /><p className="text-center text-sm text-ink-soft">{t('auth.resetChecking')}</p></div>}
        {status === 'invalid' && (
          <div className="space-y-5">
            <p role="alert" className="rounded-2xl bg-gold/15 px-4 py-3 font-medium text-forest">{t('auth.resetInvalid')}</p>
            <Button to={to('forgot')} className="w-full">{t('auth.resetAgain')}</Button>
          </div>
        )}
        {status === 'ready' && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FormField label={t('auth.newPassword')} type="password" autoComplete="new-password" hint={t('auth.passwordHint')} error={errors.password?.message} {...register('password')} />
            <FormField label={t('auth.passwordConfirm')} type="password" autoComplete="new-password" error={errors.passwordConfirm?.message} {...register('passwordConfirm')} />
            {formError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{t(formError)}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? t('common.loading') : t('auth.resetCta')}</Button>
          </form>
        )}
      </AuthShell>
    </>
  );
}
