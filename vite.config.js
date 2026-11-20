import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Découpage du code : les grosses librairies sont dans des fichiers séparés
// (mis en cache par le navigateur), chaque page est chargée à la demande.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
});
