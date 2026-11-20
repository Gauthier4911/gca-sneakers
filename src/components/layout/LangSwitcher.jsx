import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LANGS, translatePath } from '../../lib/routes';

/** Sélecteur FR/EN : garde la même page dans l'autre langue (choix mémorisé). */
export default function LangSwitcher({ dark = false }) {
  const { t, i18n } = useTranslation();
  const { pathname, search } = useLocation();

  return (
    <nav aria-label={t('lang.label')}
      className={`relative flex rounded-full p-1 text-xs font-semibold ${dark ? 'bg-white/10' : 'bg-forest/5'}`}>
      {LANGS.map((l) => {
        const active = i18n.language === l;
        return (
          <Link key={l} to={translatePath(pathname, l, search)} hrefLang={l} lang={l}
            aria-current={active ? 'true' : undefined}
            aria-label={t('lang.switchTo', { lang: t(`lang.${l}`) })}
            className={`relative z-10 rounded-full px-3 py-1.5 uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold
              ${active ? 'text-forest' : dark ? 'text-white/80 hover:text-white' : 'text-forest/70 hover:text-forest'}`}>
            {active && (
              <motion.span layoutId="lang-pill" className="absolute inset-0 -z-10 rounded-full bg-signature"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            {l}
          </Link>
        );
      })}
    </nav>
  );
}
