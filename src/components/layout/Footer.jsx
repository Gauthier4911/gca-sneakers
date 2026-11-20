import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from '../ui/SocialIcons';
import { useLang } from '../../hooks/useLang';
import { useSettings } from '../../context/SettingsContext';
import { NAV_LINKS } from './navLinks';

/** Liens sociaux remplis depuis l'admin (paramètre social_links + whatsapp_number). */
export function useSocialLinks() {
  const { settings } = useSettings();
  const s = settings.social_links || {};
  const wa = s.whatsapp || (settings.whatsapp_number ? `https://wa.me/${String(settings.whatsapp_number).replace(/\D/g, '')}` : '');
  // Seuls les liens https sont acceptés (pas de javascript:, etc.)
  const safe = (u) => (typeof u === 'string' && /^https:\/\//i.test(u) ? u : '');
  return [
    { id: 'tiktok', href: safe(s.tiktok), Icon: TikTokIcon },
    { id: 'instagram', href: safe(s.instagram), Icon: InstagramIcon },
    { id: 'facebook', href: safe(s.facebook), Icon: FacebookIcon },
    { id: 'whatsapp', href: safe(wa), Icon: WhatsAppIcon },
  ];
}

export function SocialLinks({ className = '' }) {
  const { t } = useTranslation();
  const links = useSocialLinks();
  return (
    <ul className={`flex gap-3 ${className}`}>
      {links.map(({ id, href, Icon }) => (
        <li key={id}>
          <a href={href || undefined} target="_blank" rel="noopener noreferrer"
            aria-label={t('social.openIn', { name: t(`social.${id}`) })}
            aria-disabled={!href || undefined}
            className={`grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition
              hover:-translate-y-0.5 hover:bg-signature hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold
              ${href ? '' : 'pointer-events-none opacity-40'}`}>
            <Icon className="h-5 w-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const { to } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden bg-forest text-white">
      <div aria-hidden className="h-1.5 w-full bg-signature" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <Logo variant="light" animate={false} className="h-14 w-auto" />
          <p className="mt-4 max-w-sm text-white/80">{t('footer.about')}</p>
          <p className="mt-2 max-w-sm text-sm text-mint">{t('footer.payment')}</p>
        </div>
        <nav aria-label={t('footer.shop')}>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gold">{t('footer.shop')}</h2>
          <ul className="mt-4 space-y-2">
            {NAV_LINKS.slice(0, 4).map((l) => (
              <li key={l.label}><Link to={to(l.key, {}, l.search)} className="text-white/80 hover:text-white">{t(l.label)}</Link></li>
            ))}
            <li><Link to={to('finder')} className="text-white/80 hover:text-white">{t('nav.finder')}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gold">{t('footer.help')}</h2>
          <ul className="mt-4 space-y-2">
            <li><Link to={to('store')} className="text-white/80 hover:text-white">{t('nav.store')}</Link></li>
            <li><Link to={to('contact')} className="text-white/80 hover:text-white">{t('nav.contact')}</Link></li>
            <li><Link to={to('account')} className="text-white/80 hover:text-white">{t('nav.account')}</Link></li>
          </ul>
          <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-wider text-gold">{t('footer.follow')}</h2>
          <SocialLinks className="mt-4" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-white/60 md:px-6">{t('footer.rights', { year })}</p>
      </div>
    </footer>
  );
}
