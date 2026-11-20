import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from '../ui/Logo';

/**
 * Écran d'intro (1re visite de la session) : le logo se dessine sur fond vert
 * forêt, puis le rideau se lève. Ignoré si l'utilisateur réduit les animations.
 */
export default function Intro() {
  const [show, setShow] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      if (window.location.pathname.startsWith('/admin')) return false;
      return !sessionStorage.getItem('gca-intro');
    } catch { return false; }
  });
  useEffect(() => {
    if (!show) return undefined;
    try { sessionStorage.setItem('gca-intro', '1'); } catch { /* ignore */ }
    document.documentElement.style.overflow = 'hidden';
    const t = setTimeout(() => setShow(false), 1250);
    return () => { clearTimeout(t); document.documentElement.style.overflow = ''; };
  }, [show]);
  useEffect(() => { if (!show) document.documentElement.style.overflow = ''; }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div key="intro" aria-hidden className="fixed inset-0 z-[100] grid place-items-center bg-forest"
          exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}>
          <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald/50 blur-3xl" />
          <div className="relative flex flex-col items-center">
            <Logo variant="light" className="h-24 w-auto md:h-32" />
            <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full bg-signature" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.05, ease: 'easeInOut' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
