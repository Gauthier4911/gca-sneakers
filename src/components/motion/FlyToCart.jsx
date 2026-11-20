import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Animation « vol vers le panier » : la photo du produit s'envole en arc
 * jusqu'à l'icône du panier. Déclenchée par flyToCart(imageElement).
 */
export function flyToCart(imgEl) {
  if (!imgEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = document.getElementById('cart-icon');
  if (!target) return;
  const from = imgEl.getBoundingClientRect(); const to = target.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('gca:fly', { detail: { src: imgEl.currentSrc || imgEl.src, from, to } }));
}

export default function FlyToCart() {
  const [flights, setFlights] = useState([]);
  useEffect(() => {
    const on = (e) => setFlights((f) => [...f, { id: Date.now() + Math.random(), ...e.detail }]);
    window.addEventListener('gca:fly', on);
    return () => window.removeEventListener('gca:fly', on);
  }, []);
  return (
    <AnimatePresence>
      {flights.map(({ id, src, from, to }) => {
        const size = Math.min(from.width, 180);
        const sx = from.left + from.width / 2 - size / 2; const sy = from.top + from.height / 2 - size / 2;
        const ex = to.left + to.width / 2 - size / 2; const ey = to.top + to.height / 2 - size / 2;
        return (
          <motion.img key={id} src={src} alt="" aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[90] rounded-3xl object-cover shadow-2xl"
            style={{ width: size, height: size }}
            initial={{ x: sx, y: sy, scale: 1, opacity: 1, rotate: 0 }}
            animate={{ x: [sx, (sx + ex) / 2, ex], y: [sy, Math.min(sy, ey) - 120, ey], scale: [1, 0.6, 0.12], rotate: [0, -12, 8], opacity: [1, 1, 0.4] }}
            transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={() => setFlights((f) => f.filter((x) => x.id !== id))} />
        );
      })}
    </AnimatePresence>
  );
}
