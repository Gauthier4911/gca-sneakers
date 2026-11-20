import { useEffect } from 'react';
import Lenis from 'lenis';

// Défilement fluide « premium » (inertie douce). Désactivé si l'utilisateur
// demande moins d'animations. Le défilement tactile reste natif (meilleur sur mobile).
export const lenisRef = { current: null };

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - (1 - t) ** 4, smoothWheel: true, syncTouch: false });
    lenisRef.current = lenis;
    let id;
    const raf = (time) => { lenis.raf(time); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); lenisRef.current = null; };
  }, []);
  return null;
}

/** Remonte en haut de page (instantané lors d'un changement de page). */
export function scrollToTop() {
  if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0 });
}
