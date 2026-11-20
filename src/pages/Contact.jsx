import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Mail, MapPin } from 'lucide-react';
import Seo from '../components/seo/Seo';
import FormField from '../components/forms/FormField';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import { WhatsAppIcon } from '../components/ui/SocialIcons';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { whatsappLink } from '../lib/whatsapp';

const schema = z.object({
  name: z.string().trim().min(2, 'contact.errors.name').max(120, 'contact.errors.tooLong'),
  message: z.string().trim().min(10, 'contact.errors.message').max(1500, 'contact.errors.tooLong'),
});

/** Pas de serveur d'email : le formulaire prépare un message WhatsApp (aucune donnée stockée). */
export default function Contact() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { profile } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), values: { name: profile?.full_name ?? '', message: '' } });
  const wa = settings.whatsapp_number;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email || '') ? settings.contact_email : null;

  const onSubmit = ({ name, message }) => {
    window.open(whatsappLink(wa, `${t('contact.greeting', { name })}\n\n${message}`), '_blank', 'noopener');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <Seo title={t('contact.seoTitle')} description={t('contact.seoDescription')} />
      <h1 className="font-display text-4xl font-bold text-forest md:text-5xl">{t('contact.title')}</h1>
      <span aria-hidden className="mt-3 block h-1.5 w-16 rounded-full bg-signature" />
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">{t('contact.subtitle')}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <Reveal className="space-y-4">
          {wa && (
            <a href={whatsappLink(wa, t('contact.greeting', { name: profile?.full_name ?? '' }))} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-3xl bg-[#25D366] p-6 font-display text-xl font-bold text-forest shadow-card transition hover:-translate-y-1">
              <WhatsAppIcon className="h-10 w-10" /> {t('contact.whatsapp')}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-4 rounded-3xl bg-white p-6 font-semibold text-forest shadow-card ring-1 ring-forest/5 transition hover:-translate-y-1">
              <Mail className="h-8 w-8 text-emerald" aria-hidden /> <span>{t('contact.email')}<span className="block text-sm font-normal text-ink-soft">{email}</span></span>
            </a>
          )}
          <div className="space-y-4 rounded-3xl bg-cream p-6 text-forest">
            {settings.warehouse_address && <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-emerald" aria-hidden />{settings.warehouse_address}</p>}
            {settings.opening_hours && <p className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-emerald" aria-hidden />{settings.opening_hours}</p>}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-forest/5 md:p-8">
          <h2 className="font-display text-2xl font-bold text-forest">{t('contact.formTitle')}</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
            <FormField label={t('contact.name')} autoComplete="name" error={errors.name?.message} {...register('name')} />
            <FormField as="textarea" rows={5} label={t('contact.message')} error={errors.message?.message} {...register('message')} />
            <Button type="submit" size="lg" className="w-full" disabled={!wa}><WhatsAppIcon className="h-5 w-5" /> {t('contact.send')}</Button>
            <p className="text-center text-xs text-ink-soft">{t('contact.sendHint')}</p>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
