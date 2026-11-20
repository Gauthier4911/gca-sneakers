import { useTranslation } from 'react-i18next';
import Seo from '../components/seo/Seo';
import Hero from '../components/home/Hero';
import { Arguments, CategoryGrid, FeaturedProducts, GenderCards, PromoBanner, StoreTeaser, Testimonials } from '../components/home/Sections';

const SITE = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

export default function Home() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t('home.seoTitle')} description={t('home.seoDescription')}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Organization', name: 'GCA sneakers', url: SITE, logo: `${SITE}/logo/gca-logo.svg` }} />
      <Hero />
      <GenderCards />
      <FeaturedProducts />
      <CategoryGrid />
      <PromoBanner />
      <Arguments />
      <Testimonials />
      <StoreTeaser />
    </>
  );
}
