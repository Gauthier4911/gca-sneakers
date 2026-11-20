import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import AppRoutes from './router';

export default function App() {
  return (
    <HelmetProvider>
      {/* reducedMotion="user" : respecte le réglage « réduire les animations » du système */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
                <AppRoutes />
                <Toaster position="top-center" richColors closeButton
                  toastOptions={{ classNames: { toast: 'font-sans rounded-2xl' } }} />
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </BrowserRouter>
      </MotionConfig>
    </HelmetProvider>
  );
}
