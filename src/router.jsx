import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LangLayout from './components/layout/LangLayout';
import PageLoader from './components/ui/PageLoader';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';
import { detectLang } from './lib/i18n';
import { LANGS, ROUTES } from './lib/routes';

// Code splitting : chaque page est un fichier JS séparé, chargé à la demande.
const Home = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Shop = lazy(() => import('./pages/Shop'));
const Product = lazy(() => import('./pages/Product'));
const Finder = lazy(() => import('./pages/Finder'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Confirmation = lazy(() => import('./pages/Confirmation'));
const Store = lazy(() => import('./pages/Store'));
const Contact = lazy(() => import('./pages/Contact'));
// Espace admin : chargé uniquement pour les admins (fichiers JS séparés)
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/Dashboard'));
const AdminProducts = lazy(() => import('./admin/Products'));
const AdminProductForm = lazy(() => import('./admin/ProductForm'));
const AdminCategories = lazy(() => import('./admin/Categories'));
const AdminOrders = lazy(() => import('./admin/Orders'));
const AdminSettings = lazy(() => import('./admin/Settings'));
const AdminContent = lazy(() => import('./admin/Content'));

const PAGES = {
  shop: <Shop />,
  category: <Shop />,
  product: <Product />,
  finder: <Finder />,
  cart: <Cart />,
  checkout: <ProtectedRoute reason="checkout"><Checkout /></ProtectedRoute>,
  confirmation: <ProtectedRoute><Confirmation /></ProtectedRoute>,
  login: <Login />,
  register: <Register />,
  account: <ProtectedRoute><Account /></ProtectedRoute>,
  contact: <Contact />,
  store: <Store />,
};

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to={`/${detectLang()}`} replace />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="produits" element={<AdminProducts />} />
          <Route path="produits/nouveau" element={<AdminProductForm />} />
          <Route path="produits/:id" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="contenu" element={<AdminContent />} />
          <Route path="parametres" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
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
