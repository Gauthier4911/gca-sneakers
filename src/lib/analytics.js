import { supabase } from './supabase';

// Statistiques de visite anonymes : un identifiant aléatoire (pas de cookie,
// pas d'adresse IP, aucune donnée personnelle) pour compter les visiteurs uniques.
const KEY = 'gca-vid';
let memoryId = null;

function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
    return id;
  } catch {
    memoryId = memoryId || crypto.randomUUID();
    return memoryId;
  }
}

function referrerHost() {
  try {
    if (sessionStorage.getItem('gca-ref-sent')) return null; // provenance : seulement à l'arrivée
    sessionStorage.setItem('gca-ref-sent', '1');
    const host = document.referrer ? new URL(document.referrer).hostname : '';
    return host && host !== window.location.hostname ? host : null;
  } catch { return null; }
}

const device = () => (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop');

export function trackView(pathname, lang) {
  if (typeof window === 'undefined' || navigator.webdriver) return; // robots et tests automatisés
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return; // respect du « Ne pas suivre »
  supabase.rpc('track_view', {
    p_path: pathname.slice(0, 300), p_lang: lang, p_referrer: referrerHost(), p_visitor: visitorId(), p_device: device(),
  }).then(() => {}, () => {});
}
