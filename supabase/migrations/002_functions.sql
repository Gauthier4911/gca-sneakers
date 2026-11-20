-- =============================================================================
-- GCA sneakers — 002 : fonctions, triggers et RPC
-- =============================================================================
-- Codes d'erreur renvoyés au front (traduits via i18n) : NOT_AUTHENTICATED,
-- FORBIDDEN, PROFILE_INCOMPLETE, ADDRESS_REQUIRED, INVALID_CART, OUT_OF_STOCK,
-- PRODUCT_UNAVAILABLE, TOO_MANY_PENDING_ORDERS, INVALID_TRANSITION,
-- INSUFFICIENT_STOCK, VARIANT_NOT_FOUND, ROLE_CHANGE_FORBIDDEN, PRODUCT_NEEDS_4_IMAGES

-- ---------- is_admin() ------------------------------------------------------
-- SECURITY DEFINER : lit profiles sans être bloqué par la RLS (et sans récursion).
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- updated_at ------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger carts_touch before update on public.carts
  for each row execute function public.touch_updated_at();

-- ---------- Création automatique du profil à l'inscription ------------------
-- Le rôle est TOUJOURS 'client' : les métadonnées envoyées par le navigateur
-- ne peuvent pas choisir le rôle.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_name     text := left(coalesce(trim(new.raw_user_meta_data ->> 'full_name'), ''), 120);
  v_whatsapp text := trim(new.raw_user_meta_data ->> 'whatsapp');
  v_address  text := left(trim(new.raw_user_meta_data ->> 'address'), 500);
begin
  if v_whatsapp is not null and v_whatsapp !~ '^\+?[0-9 ]{8,20}$' then
    v_whatsapp := null;  -- donnée invalide : on n'empêche pas l'inscription
  end if;
  insert into public.profiles (id, full_name, whatsapp, address, role)
  values (new.id, v_name, v_whatsapp, nullif(v_address, ''), 'client');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Le rôle ne peut jamais être modifié depuis le site --------------
-- (double sécurité : le droit UPDATE sur la colonne role est aussi retiré en 003)
-- Le passage en admin se fait dans le SQL Editor Supabase (rôle postgres).
create or replace function public.guard_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and current_user in ('anon', 'authenticated') then
    raise exception 'ROLE_CHANGE_FORBIDDEN';
  end if;
  return new;
end $$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------- Un produit actif doit avoir exactement 4 photos -----------------
create or replace function public.check_product_has_4_images()
returns trigger language plpgsql as $$
begin
  if new.is_active and
     (select count(*) from public.product_images where product_id = new.id) <> 4 then
    raise exception 'PRODUCT_NEEDS_4_IMAGES';
  end if;
  return new;
end $$;

create trigger products_require_images
  before insert or update of is_active on public.products
  for each row execute function public.check_product_has_4_images();

-- Empêche de supprimer une photo d'un produit actif (on remplace l'URL à la place)
create or replace function public.guard_active_product_images()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.products where id = old.product_id and is_active) then
    raise exception 'PRODUCT_NEEDS_4_IMAGES';
  end if;
  return old;
end $$;

create trigger product_images_guard_delete
  before delete on public.product_images
  for each row
  when (pg_trigger_depth() = 0)  -- autorise la suppression en cascade du produit
  execute function public.guard_active_product_images();

-- ---------- Lecture d'un paramètre (usage interne) --------------------------
create or replace function public.setting_num(p_key text, p_default numeric)
returns numeric language sql stable security definer
set search_path = public
as $$
  select coalesce((select (value #>> '{}')::numeric from public.settings where key = p_key), p_default);
$$;

-- ---------- Questionnaire : options réellement disponibles ------------------
-- Renvoie les types, pointures (en stock), couleurs, matières et usages
-- disponibles pour un genre (et éventuellement un type).
create or replace function public.finder_facets(
  p_gender    public.gender_type,
  p_shoe_type public.shoe_type default null
)
returns jsonb
language sql stable
set search_path = public
as $$
  with available as (
    select p.*
    from public.products p
    where p.is_active
      and p.gender = p_gender
      and exists (select 1 from public.product_variants v where v.product_id = p.id and v.stock > 0)
  ), filtered as (
    select * from available where p_shoe_type is null or shoe_type = p_shoe_type
  )
  select jsonb_build_object(
    'shoe_types', coalesce((select jsonb_agg(distinct shoe_type) from available), '[]'),
    'sizes',      coalesce((select jsonb_agg(s order by s) from (
                     select distinct v.size as s
                     from public.product_variants v join filtered f on f.id = v.product_id
                     where v.stock > 0) x), '[]'),
    'colors',     coalesce((select jsonb_agg(distinct color) from filtered where color is not null), '[]'),
    'materials',  coalesce((select jsonb_agg(distinct material) from filtered where material is not null), '[]'),
    'usages',     coalesce((select jsonb_agg(distinct u) from filtered, unnest(usages) u), '[]'),
    'price_min',  (select min(coalesce(promo_price, price)) from filtered),
    'price_max',  (select max(coalesce(promo_price, price)) from filtered)
  );
$$;

-- ---------- create_order : la seule façon de créer une commande -------------
-- Les prix, la remise et les frais sont RECALCULÉS ici depuis la base :
-- le navigateur n'envoie que [{product_id, size, quantity}].
create or replace function public.create_order(
  p_items       jsonb,
  p_fulfillment public.fulfillment_type,
  p_locale      text default 'fr'
)
returns table (order_id uuid, order_number text, total numeric)
language plpgsql security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid        uuid := auth.uid();
  v_profile    public.profiles;
  v_email      text;
  v_line       record;
  v_subtotal   numeric(12,0) := 0;
  v_qty        int := 0;
  v_discount   numeric(12,0) := 0;
  v_fee        numeric(12,0) := 0;
  v_threshold  numeric := public.setting_num('promo_threshold', 5);
  v_percent    numeric := public.setting_num('promo_percent', 0);
  v_warehouse  text;
  v_order      public.orders;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.id is null or v_profile.full_name = '' or v_profile.whatsapp is null then
    raise exception 'PROFILE_INCOMPLETE';
  end if;
  if p_fulfillment = 'delivery' and coalesce(trim(v_profile.address), '') = '' then
    raise exception 'ADDRESS_REQUIRED';
  end if;

  -- Anti-abus : 5 commandes "pending" maximum par 24 h
  if (select count(*) from public.orders o
      where o.user_id = v_uid and o.status = 'pending'
        and o.created_at > now() - interval '24 hours') >= 5 then
    raise exception 'TOO_MANY_PENDING_ORDERS';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'INVALID_CART';
  end if;

  -- Lignes regroupées (même produit + même pointure) et contrôlées
  if to_regclass('pg_temp._lines') is not null then drop table _lines; end if;
  create temporary table _lines on commit drop as
    select x.product_id, x.size, sum(x.quantity)::int as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, size numeric, quantity int)
    group by x.product_id, x.size;

  if exists (select 1 from _lines
             where product_id is null or size is null
                or quantity is null or quantity < 1 or quantity > 20) then
    raise exception 'INVALID_CART';
  end if;

  for v_line in
    select l.product_id, l.size, l.quantity,
           p.id as pid, p.is_active,
           case when p_locale = 'en' then p.name_en else p.name_fr end as pname,
           coalesce(p.promo_price, p.price) as unit_price,
           v.stock
    from _lines l
    left join public.products p on p.id = l.product_id
    left join public.product_variants v on v.product_id = l.product_id and v.size = l.size
  loop
    if v_line.pid is null or not v_line.is_active then
      raise exception 'PRODUCT_UNAVAILABLE' using detail = coalesce(v_line.pname, v_line.product_id::text);
    end if;
    if v_line.stock is null or v_line.stock < v_line.quantity then
      raise exception 'OUT_OF_STOCK' using detail = v_line.pname || ' — ' || v_line.size;
    end if;
    v_subtotal := v_subtotal + v_line.unit_price * v_line.quantity;
    v_qty      := v_qty + v_line.quantity;
  end loop;

  if v_qty >= v_threshold and v_percent > 0 then
    v_discount := round(v_subtotal * least(v_percent, 90) / 100);
  end if;
  if p_fulfillment = 'delivery' then
    v_fee := public.setting_num('delivery_fee', 0);
  end if;

  select value #>> '{}' into v_warehouse from public.settings where key = 'warehouse_address';
  select u.email into v_email from auth.users u where u.id = v_uid;

  insert into public.orders (user_id, fulfillment, subtotal, discount, delivery_fee, total,
                             customer_snapshot, locale)
  values (v_uid, p_fulfillment, v_subtotal, v_discount, v_fee,
          v_subtotal - v_discount + v_fee,
          jsonb_build_object(
            'full_name', v_profile.full_name,
            'whatsapp',  v_profile.whatsapp,
            'email',     v_email,
            'address',   case when p_fulfillment = 'delivery' then v_profile.address end,
            'pickup_address', case when p_fulfillment = 'pickup' then v_warehouse end
          ),
          case when p_locale = 'en' then 'en' else 'fr' end)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, size, quantity, unit_price)
  select v_order.id, p.id,
         case when p_locale = 'en' then p.name_en else p.name_fr end,
         l.size, l.quantity, coalesce(p.promo_price, p.price)
  from _lines l join public.products p on p.id = l.product_id;

  return query select v_order.id, v_order.order_number, v_order.total;
end $$;

-- ---------- admin_set_order_status : transitions + stock transactionnel -----
-- pending   → confirmed | paid | cancelled
-- confirmed → paid | cancelled
-- paid      → shipped | cancelled
-- shipped   → delivered | cancelled
-- Le stock est décrémenté UNE fois au passage à paid (ou au-delà) et
-- ré-incrémenté si la commande est annulée après paiement.
create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status   public.order_status
)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_order  public.orders;
  v_item   record;
  v_ok     boolean;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'ORDER_NOT_FOUND'; end if;

  v_ok := case v_order.status
    when 'pending'   then p_status in ('confirmed', 'paid', 'cancelled')
    when 'confirmed' then p_status in ('paid', 'cancelled')
    when 'paid'      then p_status in ('shipped', 'cancelled')
    when 'shipped'   then p_status in ('delivered', 'cancelled')
    else false
  end;
  if not v_ok then
    raise exception 'INVALID_TRANSITION' using detail = v_order.status || ' → ' || p_status;
  end if;

  -- Décrément du stock (lignes verrouillées dans un ordre stable → pas d'interblocage)
  if p_status in ('paid', 'shipped', 'delivered') and not v_order.stock_applied then
    for v_item in
      select oi.product_id, oi.size, sum(oi.quantity)::int as qty, max(oi.product_name) as pname
      from public.order_items oi where oi.order_id = p_order_id
      group by oi.product_id, oi.size
      order by oi.product_id, oi.size
    loop
      perform 1 from public.product_variants
        where product_id = v_item.product_id and size = v_item.size for update;
      if not found then
        raise exception 'VARIANT_NOT_FOUND' using detail = v_item.pname || ' — ' || v_item.size;
      end if;
      update public.product_variants
        set stock = stock - v_item.qty
        where product_id = v_item.product_id and size = v_item.size and stock >= v_item.qty;
      if not found then
        raise exception 'INSUFFICIENT_STOCK' using detail = v_item.pname || ' — ' || v_item.size;
      end if;
    end loop;
    v_order.stock_applied := true;
  end if;

  -- Remise en stock si annulation après paiement
  if p_status = 'cancelled' and v_order.stock_applied then
    update public.product_variants v
      set stock = v.stock + x.qty
      from (select product_id, size, sum(quantity)::int as qty
            from public.order_items where order_id = p_order_id
            group by product_id, size) x
      where v.product_id = x.product_id and v.size = x.size;
    v_order.stock_applied := false;
  end if;

  update public.orders
    set status = p_status, stock_applied = v_order.stock_applied
    where id = p_order_id
    returning * into v_order;
  return v_order;
end $$;

-- ---------- Statistiques du dashboard admin ---------------------------------
create or replace function public.admin_dashboard_stats(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now(),
  p_low_stock int default 3
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  with sold as (
    select * from public.orders
    where status in ('paid', 'shipped', 'delivered')
      and created_at between p_from and p_to
  )
  select jsonb_build_object(
    'revenue_total',  (select coalesce(sum(total), 0) from public.orders
                       where status in ('paid', 'shipped', 'delivered')),
    'revenue_period', (select coalesce(sum(total), 0) from sold),
    'orders_period',  (select count(*) from public.orders where created_at between p_from and p_to),
    'orders_by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from (
                           select status, count(*) n from public.orders
                           where created_at between p_from and p_to group by status) s),
    'sales_by_day',   (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'revenue', r, 'orders', n) order by d), '[]')
                       from (select date_trunc('day', created_at)::date d, sum(total) r, count(*) n
                             from sold group by 1) x),
    'top_products',   (select coalesce(jsonb_agg(t order by t.qty desc), '[]') from (
                         select oi.product_id, max(oi.product_name) as name,
                                sum(oi.quantity) as qty, sum(oi.quantity * oi.unit_price) as revenue
                         from public.order_items oi join sold o on o.id = oi.order_id
                         group by oi.product_id order by qty desc limit 5) t),
    'low_stock',      (select coalesce(jsonb_agg(l order by l.stock), '[]') from (
                         select p.id as product_id, p.name_fr as name, v.size, v.stock
                         from public.product_variants v join public.products p on p.id = v.product_id
                         where v.stock <= p_low_stock order by v.stock limit 20) l)
  ) into v_result;

  return v_result;
end $$;

-- ---------- Droits d'exécution ----------------------------------------------
revoke execute on function public.create_order(jsonb, public.fulfillment_type, text) from public, anon;
grant  execute on function public.create_order(jsonb, public.fulfillment_type, text) to authenticated;

revoke execute on function public.admin_set_order_status(uuid, public.order_status) from public, anon;
grant  execute on function public.admin_set_order_status(uuid, public.order_status) to authenticated;

revoke execute on function public.admin_dashboard_stats(timestamptz, timestamptz, int) from public, anon;
grant  execute on function public.admin_dashboard_stats(timestamptz, timestamptz, int) to authenticated;

revoke execute on function public.setting_num(text, numeric) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.finder_facets(public.gender_type, public.shoe_type) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
