import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LangLayout from './components/layout/LangLayout';
import PageLoader from './components/ui/PageLoader';
import ProtectedRoute from './components/guards/ProtectedRoute';
import { detectLang } from './lib/i18n';
import { LANGS, ROUTES } from './lib/routes';

// Code splitting : chaque page est un fichier JS séparé, chargé à la demande.
const Home = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const Shop = lazy(() => import('./pages/Shop'));
const Product = lazy(() => import('./pages/Product'));
const Finder = lazy(() => import('./pages/Finder'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));

// Pages des étapes suivantes : remplacées au fur et à mesure.
const PAGES = {
  shop: <Shop />,
  category: <Shop />,
  product: <Product />,
  finder: <Finder />,
  cart: <ComingSoon titleKey="pages.cart" />,
  checkout: <ComingSoon titleKey="pages.checkout" />,
  confirmation: <ComingSoon titleKey="pages.confirmation" />,
  login: <Login />,
  register: <Register />,
  account: <ProtectedRoute><Account /></ProtectedRoute>,
  contact: <ComingSoon titleKey="pages.contact" />,
  store: <ComingSoon titleKey="pages.store" />,
};

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to={`/${detectLang()}`} replace />} />
        <Route path="/:lang" element={<LangLayout />}>
          <Route index element={<Home />} />
          {/* Les chemins FR et EN sont tous déclarés : /fr/boutique et /en/shop */}
          {LANGS.flatMap((l) => Object.entries(PAGES).map(([key, el]) => (
            <Route key={`${l}-${key}`} path={ROUTES[key][l]} element={el} />
          )))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
