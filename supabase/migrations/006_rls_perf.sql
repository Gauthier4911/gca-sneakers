-- =============================================================================
-- GCA sneakers — 006 : optimisation des politiques RLS (alertes Supabase)
-- =============================================================================
-- 1) (select auth.uid()) : évalué une fois par requête au lieu d'une fois par ligne
-- 2) Les politiques admin ne couvrent plus SELECT (déjà couvert par la politique
--    de lecture) → une seule politique évaluée en lecture.

-- ---------- Profils / commandes / panier ------------------------------------
drop policy profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select using (id = (select auth.uid()) or (select public.is_admin()));
drop policy profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy orders_select_own_or_admin on public.orders;
create policy orders_select_own_or_admin on public.orders
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy order_items_select_own_or_admin on public.order_items;
create policy order_items_select_own_or_admin on public.order_items
  for select using ((select public.is_admin()) or exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

drop policy carts_own on public.carts;
create policy carts_own on public.carts
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- Catalogue et paramètres : écriture admin séparée de la lecture ---
do $$
declare t text;
begin
  foreach t in array array['categories', 'products', 'product_images', 'product_variants', 'settings'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format('create policy %I on public.%I for insert with check ((select public.is_admin()))', t || '_admin_insert', t);
    execute format('create policy %I on public.%I for update using ((select public.is_admin())) with check ((select public.is_admin()))', t || '_admin_update', t);
    execute format('create policy %I on public.%I for delete using ((select public.is_admin()))', t || '_admin_delete', t);
  end loop;
end $$;

drop policy products_read on public.products;
create policy products_read on public.products for select using (is_active or (select public.is_admin()));
drop policy product_images_read on public.product_images;
create policy product_images_read on public.product_images for select using (
  (select public.is_admin()) or exists (select 1 from public.products p where p.id = product_id and p.is_active));
drop policy product_variants_read on public.product_variants;
create policy product_variants_read on public.product_variants for select using (
  (select public.is_admin()) or exists (select 1 from public.products p where p.id = product_id and p.is_active));
drop policy settings_read_public on public.settings;
create policy settings_read_public on public.settings for select using (is_public or (select public.is_admin()));
