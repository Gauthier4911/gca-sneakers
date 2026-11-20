import { supabase } from '../lib/supabase';

// Garde-fous côté navigateur (les policies Storage refont la vérification côté serveur).
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_MAX = 5 * 1024 * 1024;
export const MODEL_MAX = 15 * 1024 * 1024;

/** Redimensionne (1200 px max) et convertit en WebP pour un site rapide. */
async function toWebp(file, max = 1200, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
  return blob ?? file;
}

const publicUrl = (bucket, path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

export async function uploadProductImage(file, productId, position) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('badType');
  if (file.size > IMAGE_MAX) throw new Error('tooBig');
  const blob = await toWebp(file);
  const path = `${productId}/${position}-${Date.now()}.webp`;
  const { error } = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  return publicUrl('product-images', path);
}

export async function uploadModel(file, productId) {
  if (!/\.glb$/i.test(file.name)) throw new Error('badType');
  if (file.size > MODEL_MAX) throw new Error('tooBig');
  const path = `${productId}/model-${Date.now()}.glb`;
  const { error } = await supabase.storage.from('product-models').upload(path, file, { contentType: 'model/gltf-binary', upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  return publicUrl('product-models', path);
}

/** Supprime un fichier de nos buckets à partir de son URL publique (ignore les images de démo). */
export async function removeByUrl(url) {
  const m = /\/storage\/v1\/object\/public\/(product-images|product-models|site-media)\/(.+)$/.exec(url || '');
  if (m) await supabase.storage.from(m[1]).remove([decodeURIComponent(m[2])]);
}

/** Photos de la boutique / de l'entrepôt (bucket site-media). */
export async function uploadSiteImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('badType');
  if (file.size > IMAGE_MAX) throw new Error('tooBig');
  const blob = await toWebp(file, 1600);
  const path = `store/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage.from('site-media').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
  if (error) throw error;
  return publicUrl('site-media', path);
}

/** Vidéo de présentation (MP4, 50 Mo max) — bucket site-media. */
export async function uploadSiteVideo(file) {
  if (file.type !== 'video/mp4' || file.size > 50 * 1024 * 1024) throw new Error('videoBad');
  const path = `video/${Date.now()}.mp4`;
  const { error } = await supabase.storage.from('site-media').upload(path, file, { contentType: 'video/mp4', cacheControl: '31536000' });
  if (error) throw error;
  return publicUrl('site-media', path);
}

/** Logo : on garde la transparence et une bonne résolution (WebP 800 px). */
export async function uploadLogo(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('badType');
  if (file.size > IMAGE_MAX) throw new Error('tooBig');
  const blob = await toWebp(file, 800, 0.92);
  const path = `logo/${Date.now()}.webp`;
  const { error } = await supabase.storage.from('site-media').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
  if (error) throw error;
  return publicUrl('site-media', path);
}
