import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Vrai modèle 3D (.glb) : rotation à la souris / au doigt, zoom, rotation auto.
 * La librairie (~1 Mo) n'est chargée QUE quand le client ouvre la vue 3D.
 */
export default function Viewer3D({ src, name, poster }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    import('@google/model-viewer').then(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);

  if (!ready) {
    return <div role="status" className="grid h-full place-items-center text-forest">{t('product.loading3d')}</div>;
  }
  return (
    <model-viewer
      src={src}
      poster={poster}
      alt={t('product.viewer3d', { name })}
      camera-controls=""
      auto-rotate=""
      auto-rotate-delay="1500"
      interaction-prompt="auto"
      shadow-intensity="1"
      exposure="1"
      touch-action="pan-y"
      style={{ width: '100%', height: '100%', background: 'transparent', '--poster-color': 'transparent' }}
    />
  );
}
