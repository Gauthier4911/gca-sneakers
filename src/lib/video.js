// Analyse d'un lien vidéo YouTube / TikTok → URL d'intégration sûre (domaines autorisés par la CSP).
export function parseVideo(url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return null;
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) {
    return {
      kind: 'youtube',
      embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1`,
      thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`,
    };
  }
  m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (m) return { kind: 'tiktok', embed: `https://www.tiktok.com/embed/v2/${m[1]}`, thumb: null };
  if (/\.supabase\.co\/storage\/v1\/object\/public\/site-media\/.+\.mp4$/i.test(url)) return { kind: 'mp4', embed: url, thumb: null };
  return null;
}
