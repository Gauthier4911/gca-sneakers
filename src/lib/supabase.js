import { createClient } from '@supabase/supabase-js';

// Seule la clé PUBLIQUE est utilisée côté navigateur. La sécurité repose sur
// la RLS et les fonctions SQL (voir supabase/migrations).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants : copiez .env.example en .env');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
