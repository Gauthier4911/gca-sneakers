import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, MapPin, Navigation, Play, Store as StoreIcon } from 'lucide-react';
import Seo from '../components/seo/Seo';
import Reveal from '../components/ui/Reveal';
import { SectionTitle } from '../components/home/Sections';
import { useSocialLinks } from '../components/layout/Footer';
import { useSettings } from '../context/SettingsContext';
import { parseVideo } from '../lib/video';

const SOCIAL_STYLE = {
  tiktok: 'from-[#111] to-[#333] text-white', instagram: 'from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white',
  facebook: 'from-[#1877F2] to-[#0B5FCC] text-white', whatsapp: 'from-[#25D366] to-[#128C7E] text-forest',
};

/** Lecteur vidéo léger : on n'affiche qu'une image tant que le client n'a pas cliqué (site rapide). */
function VideoBlock({ url }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const video = parseVideo(url);
  if (!video) {
    return <div className="grid aspect-video place-items-center rounded-[2rem] bg-forest p-8 text-center text-white/85">{t('store.videoSoon')}</div>;
  }
  const isPortrait = video.kind === 'tiktok';
  return (
    <div className={`relative mx-auto overflow-hidden rounded-[2rem] bg-forest shadow-card ${isPortrait ? 'aspect-[9/16] max-w-sm' : 'aspect-video'}`}>
      {playing || !video.thumb ? (
        video.kind === 'mp4'
          ? <video src={video.embed} controls autoPlay={playing} playsInline className="h-full w-full object-cover" />
          : <iframe src={video.embed} title={t('store.video')} className="h-full w-full" loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group relative h-full w-full" aria-label={t('store.play')}>
          <img src={video.thumb} alt="" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" loading="lazy" />
          <span className="absolute inset-0 grid place-items-center">
            <motion.span whileHover={{ scale: 1.1 }} className="grid h-20 w-20 place-items-center rounded-full bg-signature text-forest shadow-glow">
              <Play className="ml-1 h-9 w-9 fill-current" aria-hidden />
            </motion.span>
          </span>
        </button>
      )}
    </div>
  );
}

export default function Store() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const socials = useSocialLinks().filter((s) => s.href);
  const photos = Array.isArray(settings.store_photos) ? settings.store_photos.filter((u) => /^https:\/\//.test(u)) : [];
  const maps = settings.warehouse_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.warehouse_address)}` : null;

  return (
    <>
      <Seo title={t('store.seoTitle')} description={t('store.seoDescription')}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'ShoeStore', name: settings.store_name || 'GCA sneakers', address: settings.warehouse_address || undefined, openingHours: settings.opening_hours || undefined }} />
      <section className="relative overflow-hidden bg-forest text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/25 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-mint"><StoreIcon className="h-4 w-4 text-gold" aria-hidden />{t('store.eyebrow')}</p>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-6xl">{t('store.title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">{t('store.subtitle')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <SectionTitle title={t('store.video')} />
        <Reveal><VideoBlock url={settings.video_url} /></Reveal>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:px-6 lg:grid-cols-[1fr_1.3fr]">
          <Reveal className="rounded-[2rem] bg-white p-8 shadow-card">
            <h2 className="font-display text-2xl font-bold text-forest">{t('store.warehouse')}</h2>
            <dl className="mt-6 space-y-5">
              <div className="flex gap-3"><MapPin className="h-6 w-6 shrink-0 text-emerald" aria-hidden />
                <div><dt className="text-sm font-semibold text-ink-soft">{t('store.address')}</dt><dd className="whitespace-pre-line font-medium text-forest">{settings.warehouse_address || '—'}</dd></div></div>
              {settings.opening_hours && (
                <div className="flex gap-3"><Clock className="h-6 w-6 shrink-0 text-emerald" aria-hidden />
                  <div><dt className="text-sm font-semibold text-ink-soft">{t('store.hours')}</dt><dd className="whitespace-pre-line font-medium text-forest">{settings.opening_hours}</dd></div></div>
              )}
            </dl>
            {maps && (
              <a href={maps} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-signature px-5 py-3 font-display font-semibold text-forest shadow-glow">
                <Navigation className="h-5 w-5" aria-hidden /> {t('store.directions')}
              </a>
            )}
            <div className="mt-8 rounded-2xl bg-mint-light p-4">
              <p className="font-display font-semibold text-forest">{t('store.pickupTitle')}</p>
              <p className="mt-1 text-sm text-ink-soft">{t('store.pickupText')}</p>
            </div>
          </Reveal>
          <div>
            {photos.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4" aria-label={t('store.photos')}>
                {photos.map((u, i) => (
                  <Reveal as="li" key={u} delay={i * 0.06} className={i === 0 ? 'col-span-2' : ''}>
                    <img src={u} alt={t('store.photo', { n: i + 1 })} loading="lazy" className={`w-full rounded-3xl object-cover shadow-card ${i === 0 ? 'aspect-[16/9]' : 'aspect-square'}`} />
                  </Reveal>
                ))}
              </ul>
            ) : (
              <div className="grid h-full min-h-64 place-items-center rounded-[2rem] bg-gradient-to-br from-emerald to-forest p-8 text-center text-white">
                <StoreIcon className="h-16 w-16 text-gold" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </section>

      {socials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <SectionTitle title={t('store.follow')} subtitle={t('store.followText')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {socials.map(({ id, href, Icon }, i) => (
              <Reveal key={id} delay={i * 0.08}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={t('social.openIn', { name: t(`social.${id}`) })}
                  className={`group flex items-center gap-4 rounded-3xl bg-gradient-to-br p-6 shadow-card transition hover:-translate-y-1 ${SOCIAL_STYLE[id]}`}>
                  <Icon className="h-10 w-10 transition-transform group-hover:scale-110" />
                  <span className="font-display text-xl font-bold">{t(`social.${id}`)}</span>
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
