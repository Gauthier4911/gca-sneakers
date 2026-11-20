import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import Logo from '../ui/Logo';
import LangSwitcher from './LangSwitcher';
import { NAV_LINKS } from './navLinks';
import { useLang } from '../../hooks/useLang';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { t } = useTranslation();
  const { to } = useLang();
  const { count } = useCart();
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname, search]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const linkCls = ({ isActive }) => `relative px-1 py-2 font-medium transition-colors hover:text-emerald
    ${isActive ? 'text-emerald' : 'text-forest'}`;
  const isLinkActive = (l) => pathname === to(l.key) && (l.search ? search === l.search : !search);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300
      ${scrolled ? 'bg-white/90 shadow-card backdrop-blur-md' : 'bg-white'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-forest">
        {t('nav.skip')}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:h-20 md:px-6">
        <Link to={to('home')} className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold" aria-label={t('nav.home')}>
          <Logo className="h-9 w-auto md:h-11" />
        </Link>

        <nav aria-label={t('nav.mainNav')} className="ml-6 hidden flex-1 items-center gap-5 lg:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.label} to={to(l.key, {}, l.search)} className={() => linkCls({ isActive: isLinkActive(l) })} end>
              {t(l.label)}
              {isLinkActive(l) && (
                <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-signature" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Link to={to('finder')}
            className="hidden items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald md:inline-flex">
            <Sparkles className="h-4 w-4 text-gold" aria-hidden /> {t('nav.finder')}
          </Link>
          <div className="hidden sm:block"><LangSwitcher /></div>
          <Link to={to(user ? 'account' : 'login')} aria-label={t(user ? 'nav.account' : 'nav.login')}
            className="grid h-10 w-10 place-items-center rounded-full text-forest transition hover:bg-forest/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
            <User className="h-5 w-5" aria-hidden />
          </Link>
          <Link to={to('cart')} aria-label={t('cart.open', { count })}
            className="relative grid h-10 w-10 place-items-center rounded-full text-forest transition hover:bg-forest/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <AnimatePresence>
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-signature px-1 text-[11px] font-bold text-forest">
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-label={t('nav.openMenu')} aria-expanded={open} aria-controls="mobile-menu"
            className="grid h-10 w-10 place-items-center rounded-full text-forest hover:bg-forest/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold lg:hidden">
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-forest/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div id="mobile-menu" role="dialog" aria-modal="true" aria-label={t('nav.menu')}
              className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col bg-forest p-6 text-white lg:hidden"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="flex items-center justify-between">
                <Logo variant="light" animate={false} className="h-9 w-auto" />
                <button type="button" onClick={() => setOpen(false)} aria-label={t('nav.closeMenu')}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                  <X className="h-6 w-6" aria-hidden />
                </button>
              </div>
              <nav aria-label={t('nav.mainNav')} className="mt-8 flex flex-col gap-1">
                {[{ key: 'home', label: 'nav.home' }, ...NAV_LINKS].map((l, i) => (
                  <motion.div key={l.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                    <Link to={to(l.key, {}, l.search)} className="block rounded-xl px-3 py-3 font-display text-xl font-semibold hover:bg-white/10">
                      {t(l.label)}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <Link to={to('finder')} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-signature px-6 py-3 font-display font-semibold text-forest">
                <Sparkles className="h-5 w-5" aria-hidden /> {t('nav.finder')}
              </Link>
              <div className="mt-auto pt-6"><LangSwitcher dark /></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
