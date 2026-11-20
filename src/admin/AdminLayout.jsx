import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, ExternalLink, FileText, FolderTree, LogOut, Package, Settings, ShoppingCart } from 'lucide-react';
import Seo from '../components/seo/Seo';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { detectLang, LANG_STORAGE_KEY } from '../lib/i18n';
import { LANGS } from '../lib/routes';

const LINKS = [
  { to: '/admin', end: true, key: 'dashboard', Icon: BarChart3 },
  { to: '/admin/commandes', key: 'orders', Icon: ShoppingCart },
  { to: '/admin/produits', key: 'products', Icon: Package },
  { to: '/admin/categories', key: 'categories', Icon: FolderTree },
  { to: '/admin/contenu', key: 'content', Icon: FileText },
  { to: '/admin/parametres', key: 'settings', Icon: Settings },
];

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  useEffect(() => { i18n.changeLanguage(detectLang()); document.documentElement.lang = detectLang(); }, [i18n]);
  const switchLang = (l) => {
    i18n.changeLanguage(l); document.documentElement.lang = l;
    try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch { /* ignore */ }
  };
  const link = ({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition
    ${isActive ? 'bg-signature text-forest' : 'text-white/80 hover:bg-white/10 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-cream/60 lg:grid lg:grid-cols-[260px_1fr]">
      <Seo title={t('admin.seo')} description={t('admin.title')} noindex />
      <aside className="bg-forest text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between gap-3 p-4 lg:block lg:p-6">
          <Logo variant="light" animate={false} className="h-10 w-auto lg:h-12" />
          <p className="hidden text-sm text-white/70 lg:mt-3 lg:block">{t('admin.title')} · {profile?.full_name}</p>
          <div role="group" aria-label={t('lang.label')} className="flex gap-1 rounded-full bg-white/10 p-1 text-xs font-bold lg:mt-4 lg:w-fit">
            {LANGS.map((l) => (
              <button key={l} type="button" onClick={() => switchLang(l)} aria-pressed={lang === l}
                className={`rounded-full px-3 py-1 uppercase ${lang === l ? 'bg-signature text-forest' : 'text-white/80'}`}>{l}</button>
            ))}
          </div>
        </div>
        <nav aria-label={t('admin.title')} className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4">
          {LINKS.map(({ to, end, key, Icon }) => (
            <NavLink key={to} to={to} end={end} className={link}>
              <Icon className="h-5 w-5 shrink-0" aria-hidden /><span className="whitespace-nowrap">{t(`admin.nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden space-y-1 px-4 lg:absolute lg:bottom-6 lg:block lg:w-[260px]">
          <a href={`/${lang}`} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white/80 hover:bg-white/10"><ExternalLink className="h-5 w-5" aria-hidden />{t('admin.backToSite')}</a>
          <button type="button" onClick={async () => { navigate(`/${lang}`); await signOut(); }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-white/80 hover:bg-white/10"><LogOut className="h-5 w-5" aria-hidden />{t('admin.logout')}</button>
        </div>
      </aside>
      <main id="main" className="min-w-0 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
