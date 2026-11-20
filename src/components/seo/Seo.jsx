import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { LANGS, translatePath } from '../../lib/routes';

const SITE = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

/**
 * Balises SEO d'une page : title, description, canonical, hreflang FR/EN,
 * Open Graph, Twitter card, et JSON-LD optionnel.
 */
export default function Seo({ title, description, image = '/og-default.jpg', type = 'website', noindex = false, jsonLd }) {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const lang = i18n.language;
  const url = `${SITE}${pathname}`;
  const img = image.startsWith('http') ? image : `${SITE}${image}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {LANGS.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={`${SITE}${translatePath(pathname, l)}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE}${translatePath(pathname, 'fr')}`} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content="GCA sneakers" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content={lang === 'en' ? 'en_US' : 'fr_FR'} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>}
    </Helmet>
  );
}
