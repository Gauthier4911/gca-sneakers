import { createClient } from '@supabase/supabase-js';

// Seule la clé PUBLIQUE est utilisée côté navigateur. La sécurité repose sur
// la RLS et les fonctions SQL (voir supabase/migrations).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** false si les variables d'environnement manquent (le site affiche alors un message clair). */
export const isConfigured = Boolean(url && key);

if (!isConfigured) {
  // eslint-disable-next-line no-console
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants : ajoutez-les (.env en local, Settings → Environment Variables sur Vercel).');
}

// Valeurs de repli pour ne jamais faire planter l'application au démarrage.
export const supabase = createClient(url || 'https://configuration-manquante.supabase.co', key || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true /* lien « mot de passe oublié » */ },
});
