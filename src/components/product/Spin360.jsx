import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Move3d } from 'lucide-react';

/**
 * Vue 360° « à la main » quand il n'y a pas de modèle 3D : on fait glisser
 * la souris / le doigt pour faire tourner la chaussure à travers ses photos,
 * avec un effet de perspective 3D. Flèches du clavier supportées.
 */
export default function Spin360({ images, alt }) {
  const { t } = useTranslation();
  const order = images.length === 4 ? [images[0], images[2], images[1], images[3]] : images;
  const [index, setIndex] = useState(0);
  const start = useRef(null);
  const rot = useMotionValue(0);
  const rotY = useSpring(useTransform(rot, (v) => Math.max(-35, Math.min(35, v / 4))), { stiffness: 200, damping: 20 });

  const step = (dir) => setIndex((i) => (i + dir + order.length) % order.length);

  const onDown = (e) => { start.current = { x: e.clientX, i: index }; e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    rot.set(dx);
    const steps = Math.round(dx / 70); // une photo tous les 70 px
    setIndex(((start.current.i - steps) % order.length + order.length) % order.length);
  };
  const onUp = () => { start.current = null; rot.set(0); };

  return (
    <div className="relative h-full w-full select-none [perspective:1200px]">
      <motion.div
        role="slider" tabIndex={0} aria-label={t('product.dragToRotate')}
        aria-valuemin={1} aria-valuemax={order.length} aria-valuenow={index + 1}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ rotateY: rotY }}
        className="h-full w-full cursor-grab touch-pan-y active:cursor-grabbing focus-visible:outline focus-visible:outline-4 focus-visible:outline-gold">
        {order.map((img, i) => (
          <img key={img.url} src={img.url} alt={i === index ? alt : ''} aria-hidden={i !== index} draggable="false"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${i === index ? 'opacity-100' : 'opacity-0'}`} />
        ))}
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-forest/85 px-4 py-2 text-sm font-medium text-white">
        <Move3d className="h-4 w-4 text-gold" aria-hidden /> {t('product.dragToRotate')}
      </motion.p>
    </div>
  );
}
