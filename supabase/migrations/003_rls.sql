-- =============================================================================
-- GCA sneakers — 003 : Row Level Security (activée sur TOUTES les tables)
-- =============================================================================

alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.settings         enable row level security;
alter table public.carts            enable row level security;

-- ---------- PROFILES --------------------------------------------------------
-- Pas de policy INSERT/DELETE : le profil est créé par trigger uniquement.
create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Le site ne peut modifier QUE ces colonnes (jamais role ni id).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant  update (full_name, whatsapp, address) on public.profiles to authenticated;

-- ---------- CATALOGUE : lecture publique, écriture admin --------------------
create policy categories_read on public.categories
  for select using (true);
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products
  for select using (is_active or public.is_admin());
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy product_images_read on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.is_active));
create policy product_images_admin_write on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy product_variants_read on public.product_variants
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.is_active));
create policy product_variants_admin_write on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

revoke insert, update, delete on public.categories, public.products,
  public.product_images, public.product_variants from anon;

-- ---------- ORDERS : lecture des siennes, écriture via RPC uniquement --------
create policy orders_select_own_or_admin on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

create policy order_items_select_own_or_admin on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Aucune écriture directe : create_order() et admin_set_order_status() seulement.
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;

-- ---------- SETTINGS --------------------------------------------------------
create policy settings_read_public on public.settings
  for select using (is_public or public.is_admin());
create policy settings_admin_write on public.settings
  for all using (public.is_admin()) with check (public.is_admin());
revoke insert, update, delete on public.settings from anon;

-- ---------- CARTS -----------------------------------------------------------
create policy carts_own on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.carts from anon;
