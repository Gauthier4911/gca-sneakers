import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import ScrollProgress from '../motion/ScrollProgress';
import { scrollToTop } from '../motion/SmoothScroll';
import i18n, { LANG_STORAGE_KEY } from '../../lib/i18n';
import { LANGS } from '../../lib/routes';
import { trackView } from '../../lib/analytics';
import Header from './Header';
import Footer from './Footer';

/** Valide le préfixe /fr ou /en, synchronise i18n et anime les transitions de pages. */
export default function LangLayout() {
  const { lang } = useParams();
  const location = useLocation();
  const valid = LANGS.includes(lang);
  const reduce = useReducedMotion();

  if (valid && i18n.language !== lang) i18n.changeLanguage(lang); // synchrone : pas de flash de langue
  useEffect(() => {
    if (!valid) return;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* ignore */ }
  }, [lang, valid]);
  useEffect(() => {
    scrollToTop();
    if (valid) trackView(location.pathname, lang); // statistiques de visite anonymes
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!valid) return <Navigate to={`/fr${location.pathname}`} replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <Header />
      <motion.main id="main" key={location.pathname} className="flex-1" tabIndex={-1}
        initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <Outlet />
      </motion.main>
      {/* Rideau vert + liseré or qui se lève à chaque changement de page */}
      {!reduce && (
        <motion.div key={`curtain-${location.pathname}`} aria-hidden
          className="pointer-events-none fixed inset-0 z-[80] origin-top bg-forest"
          initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}>
          <span className="absolute inset-x-0 bottom-0 h-1.5 bg-signature" />
        </motion.div>
      )}
      <Footer />
    </div>
  );
}
