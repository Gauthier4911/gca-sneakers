import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/i18n';
import './index.css';
import App from './App';

// Les balises SEO pré-générées (scripts/postbuild.mjs) servent aux robots sans JS.
// Dans le navigateur, react-helmet-async prend le relais : on retire les versions
// statiques pour éviter les doublons lors de la navigation.
document.head
  .querySelectorAll('meta[name="description"]:not([data-rh]), meta[property^="og:"]:not([data-rh]), meta[name^="twitter:"]:not([data-rh]), link[rel="canonical"]:not([data-rh]), link[rel="alternate"]:not([data-rh]), script[type="application/ld+json"]:not([data-rh])')
  .forEach((el) => el.remove());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
