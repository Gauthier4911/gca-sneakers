import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { applyContent } from '../lib/content';

// Valeurs par défaut utilisées tant que la base n'a pas répondu (ou hors-ligne).
const DEFAULTS = {
  store_name: 'GCA sneakers',
  currency: 'FCFA',
  whatsapp_number: '',
  warehouse_address: '',
  delivery_fee: 0,
  promo_threshold: 5,
  promo_percent: 10,
  video_url: '',
  social_links: { tiktok: '', facebook: '', instagram: '', whatsapp: '' },
  contact_email: '',
  opening_hours: '',
  store_photos: [],
  logo_url: '',
  logo_light_url: '',
  content: { fr: {}, en: {} },
};

const SettingsContext = createContext({ settings: DEFAULTS, loading: true, reload: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    // La RLS ne renvoie que les paramètres publics (sauf pour un admin).
    const { data, error } = await supabase.from('settings').select('key, value');
    if (!error && data) {
      const next = { ...DEFAULTS, ...Object.fromEntries(data.map((r) => [r.key, r.value])) };
      applyContent(next.content); // textes personnalisés depuis l'admin
      setSettings(next);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const value = useMemo(() => ({ settings, loading, reload: load }), [settings, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
