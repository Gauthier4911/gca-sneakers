import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, ChevronLeft, ChevronRight, Images, Maximize2, Rotate3d, X } from 'lucide-react';
import Spin360 from './Spin360';

const Viewer3D = lazy(() => import('./Viewer3D'));

/**
 * Galerie de la fiche produit :
 * - Photos : 4 miniatures, swipe mobile, zoom au survol, plein écran au clic
 * - 360° : rotation à la souris à travers les photos
 * - 3D : vrai modèle .glb si l'admin en a ajouté un
 */
export default function Gallery({ images, name, model3d }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [mode, setMode] = useState('photos');
  const [zoom, setZoom] = useState(null); // { x, y } en %
  const [lightbox, setLightbox] = useState(false);
  const canHover = useRef(typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches);
  const n = images.length;
  const go = useCallback((d) => { setDir(d); setIndex((i) => (i + d + n) % n); }, [n]);
  const closeLightbox = useCallback(() => setLightbox(false), []);
  const current = images[index];
  const altOf = (i) => `${name} — ${t('product.view', { n: i + 1 })}`;

  const modes = [
    { id: 'photos', Icon: Images, label: t('product.modePhotos') },
    { id: '360', Icon: Rotate3d, label: t('product.mode360') },
    ...(model3d ? [{ id: '3d', Icon: Box, label: t('product.mode3d') }] : []),
  ];

  return (
    <section aria-label={t('product.gallery', { name })} className="lg:sticky lg:top-28">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-cream shadow-card ring-1 ring-forest/5">
        {mode === 'photos' && (
          <>
            <AnimatePresence initial={false} custom={dir}>
              <motion.img key={current.url} data-gallery-main src={current.url} alt={altOf(index)} width="800" height="800"
                custom={dir} draggable="false"
                initial={(d) => ({ x: d > 0 ? '60%' : d < 0 ? '-60%' : 0, opacity: 0 })}
                animate={{ x: 0, opacity: 1 }}
                exit={(d) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 })}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6}
                onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}
                onMouseMove={(e) => {
                  if (!canHover.current) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
                }}
                onMouseLeave={() => setZoom(null)}
                onClick={() => setLightbox(true)}
                style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, scale: 2 } : undefined}
                className="absolute inset-0 h-full w-full cursor-zoom-in touch-pan-y object-cover" />
            </AnimatePresence>
            <button type="button" onClick={() => go(-1)} aria-label={t('product.prev')}
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-forest shadow-card transition hover:bg-gold">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t('product.next')}
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-forest shadow-card transition hover:bg-gold">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => setLightbox(true)} aria-label={t('product.zoom')}
              className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-forest shadow-card transition hover:bg-gold">
              <Maximize2 className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
        {mode === '360' && <Spin360 images={images} alt={altOf(0)} />}
        {mode === '3d' && (
          <Suspense fallback={null}><Viewer3D src={model3d} name={name} poster={images[0]?.url} /></Suspense>
        )}

        {/* Sélecteur de mode */}
        <div role="group" aria-label={t('product.gallery', { name })}
          className="absolute left-3 top-3 flex gap-1 rounded-full bg-white/90 p-1 shadow-card backdrop-blur">
          {modes.map(({ id, Icon, label }) => (
            <button key={id} type="button" onClick={() => setMode(id)} aria-pressed={mode === id}
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition
                ${mode === id ? 'text-forest' : 'text-forest/70 hover:text-forest'}`}>
              {mode === id && <motion.span layoutId="gallery-mode" className="absolute inset-0 -z-10 rounded-full bg-signature" />}
              <Icon className="h-4 w-4" aria-hidden />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Miniatures */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button key={img.url} type="button" onClick={() => { setMode('photos'); setDir(i > index ? 1 : -1); setIndex(i); }}
            aria-label={t('product.showView', { n: i + 1 })} aria-current={mode === 'photos' && i === index ? 'true' : undefined}
            className={`aspect-square overflow-hidden rounded-2xl bg-cream ring-2 ring-offset-2 transition
              ${mode === 'photos' && i === index ? 'ring-gold' : 'ring-transparent hover:ring-emerald/40'}`}>
            <img src={img.url} alt="" loading="lazy" width="200" height="200" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <Lightbox open={lightbox} onClose={closeLightbox} images={images} index={index} go={go} altOf={altOf} />
    </section>
  );
}

function Lightbox({ open, onClose, images, index, go, altOf }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose, go]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label={altOf(index)}
          className="fixed inset-0 z-[60] grid place-items-center bg-forest/95 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.img key={images[index].url} src={images[index].url} alt={altOf(index)}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="max-h-[85vh] w-auto max-w-full rounded-3xl" onClick={(e) => e.stopPropagation()} />
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t('product.closeZoom')}
            className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white text-forest hover:bg-gold">
            <X className="h-6 w-6" aria-hidden />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={t('product.prev')}
            className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-forest hover:bg-gold">
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={t('product.next')}
            className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-forest hover:bg-gold">
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
