import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Carte qui s'incline en 3D en suivant la souris, avec un reflet lumineux.
 * Sur mobile / sans souris : carte normale (aucun effet).
 */
export default function TiltCard({ children, className = '', max = 10 }) {
  const ref = useRef(null);
  const px = useMotionValue(0.5); const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  const gx = useTransform(px, (v) => `${v * 100}%`); const gy = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.45), transparent 55%)`;
  const active = useMotionValue(0);
  const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div ref={ref} className={`relative [transform-style:preserve-3d] ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (!fine() || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width); py.set((e.clientY - r.top) / r.height); active.set(1);
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); active.set(0); }}>
      {children}
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light" style={{ background: glare, opacity: active }} />
    </motion.div>
  );
}
