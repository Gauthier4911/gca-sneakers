-- =============================================================================
-- Snika — 004 : Supabase Storage (buckets + policies)
-- =============================================================================
-- product-images : 4 photos par produit         (jpg/png/webp, 5 Mo max)
-- product-models : modèles 3D .glb (optionnels) (15 Mo max)
-- site-media     : catégories, entrepôt, vidéo  (images 5 Mo / mp4 50 Mo)
-- Lecture publique, écriture réservée aux admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880,
     array['image/jpeg', 'image/png', 'image/webp']),
  ('product-models', 'product-models', true, 15728640,
     array['model/gltf-binary', 'application/octet-stream']),
  ('site-media', 'site-media', true, 52428800,
     array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "snika_public_read" on storage.objects
  for select using (bucket_id in ('product-images', 'product-models', 'site-media'));

create policy "snika_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'product-models', 'site-media') and public.is_admin());

create policy "snika_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'product-models', 'site-media') and public.is_admin())
  with check (bucket_id in ('product-images', 'product-models', 'site-media') and public.is_admin());

create policy "snika_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'product-models', 'site-media') and public.is_admin());
