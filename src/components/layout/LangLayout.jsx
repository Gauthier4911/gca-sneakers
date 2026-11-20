import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import i18n, { LANG_STORAGE_KEY } from '../../lib/i18n';
import { LANGS } from '../../lib/routes';
import Header from './Header';
import Footer from './Footer';

/** Valide le préfixe /fr ou /en, synchronise i18n et anime les transitions de pages. */
export default function LangLayout() {
  const { lang } = useParams();
  const location = useLocation();
  const valid = LANGS.includes(lang);

  if (valid && i18n.language !== lang) i18n.changeLanguage(lang); // synchrone : pas de flash de langue
  useEffect(() => {
    if (!valid) return;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* ignore */ }
  }, [lang, valid]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  if (!valid) return <Navigate to={`/fr${location.pathname}`} replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main id="main" key={location.pathname} className="flex-1" tabIndex={-1}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}>
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
