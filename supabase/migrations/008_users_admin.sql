-- =============================================================================
-- GCA sneakers — 008 : gestion des utilisateurs par l'admin
-- =============================================================================
-- Liste des comptes, changement de rôle, bannissement (compte bloqué + email
-- interdit de réinscription), suppression. Tout passe par des fonctions
-- SECURITY DEFINER qui vérifient is_admin() : rien n'est accessible autrement.

-- ---------- Emails bloqués --------------------------------------------------
create table public.blocked_emails (
  email       text primary key check (email = lower(email) and char_length(email) <= 254),
  reason      text check (char_length(reason) <= 300),
  blocked_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.blocked_emails enable row level security;  -- aucune politique : accès via fonctions admin
revoke all on public.blocked_emails from anon, authenticated;

-- Refuse la création d'un compte avec un email bloqué
create or replace function public.reject_blocked_email()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.blocked_emails where email = lower(new.email)) then
    raise exception 'EMAIL_BLOCKED';
  end if;
  return new;
end $$;

create trigger on_auth_user_blocked_check
  before insert on auth.users
  for each row execute function public.reject_blocked_email();

-- ---------- Liste des utilisateurs (admin) ---------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, full_name text, whatsapp text, address text, role public.user_role,
  created_at timestamptz, last_sign_in_at timestamptz, banned boolean,
  orders_count bigint, total_spent numeric
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return query
    select u.id, u.email::text, p.full_name, p.whatsapp, p.address, p.role,
           u.created_at, u.last_sign_in_at,
           (u.banned_until is not null and u.banned_until > now()) as banned,
           (select count(*) from public.orders o where o.user_id = u.id),
           (select coalesce(sum(o.total), 0) from public.orders o
             where o.user_id = u.id and o.status in ('paid', 'shipped', 'delivered'))
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end $$;

-- ---------- Changer le rôle -------------------------------------------------
create or replace function public.admin_set_role(p_user uuid, p_role public.user_role)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_user = auth.uid() then raise exception 'CANNOT_CHANGE_SELF'; end if; -- évite de se retirer ses propres droits
  update public.profiles set role = p_role where id = p_user;
  if not found then raise exception 'USER_NOT_FOUND'; end if;
end $$;

-- ---------- Bannir / débannir ------------------------------------------------
create or replace function public.admin_set_banned(p_user uuid, p_banned boolean, p_reason text default null)
returns void language plpgsql security definer
set search_path = public, auth
as $$
declare v_email text;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_user = auth.uid() then raise exception 'CANNOT_CHANGE_SELF'; end if;
  select lower(email) into v_email from auth.users where id = p_user;
  if v_email is null then raise exception 'USER_NOT_FOUND'; end if;

  if p_banned then
    -- Bloque la connexion (Supabase Auth refuse les comptes bannis) et coupe les sessions
    update auth.users set banned_until = '2999-12-31 00:00:00+00' where id = p_user; -- (pas 'infinity' : illisible par Supabase Auth)
    delete from auth.sessions where user_id = p_user;
    delete from auth.refresh_tokens where user_id::uuid = p_user;
    -- Un admin banni perd ses droits
    update public.profiles set role = 'client' where id = p_user;
    insert into public.blocked_emails (email, reason, blocked_by)
    values (v_email, left(p_reason, 300), auth.uid())
    on conflict (email) do update set reason = excluded.reason, blocked_by = excluded.blocked_by, created_at = now();
  else
    update auth.users set banned_until = null where id = p_user;
    delete from public.blocked_emails where email = v_email;
  end if;
end $$;

-- ---------- Supprimer un compte ---------------------------------------------
-- Les commandes sont conservées (copie figée des infos client) pour la comptabilité.
create or replace function public.admin_delete_user(p_user uuid, p_block_email boolean default false)
returns void language plpgsql security definer
set search_path = public, auth
as $$
declare v_email text;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_user = auth.uid() then raise exception 'CANNOT_CHANGE_SELF'; end if;
  select lower(email) into v_email from auth.users where id = p_user;
  if v_email is null then raise exception 'USER_NOT_FOUND'; end if;
  if p_block_email then
    insert into public.blocked_emails (email, reason, blocked_by) values (v_email, 'deleted', auth.uid())
    on conflict (email) do nothing;
  end if;
  delete from auth.users where id = p_user;
end $$;

-- ---------- Emails bloqués sans compte (après suppression) -----------------
create or replace function public.admin_list_blocked_emails()
returns setof public.blocked_emails language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return query select * from public.blocked_emails order by created_at desc;
end $$;

create or replace function public.admin_unblock_email(p_email text)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  delete from public.blocked_emails where email = lower(p_email);
end $$;

-- ---------- Droits ----------------------------------------------------------
revoke execute on function public.reject_blocked_email() from public, anon, authenticated;
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_set_role(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_set_banned(uuid, boolean, text) from public, anon;
revoke execute on function public.admin_delete_user(uuid, boolean) from public, anon;
revoke execute on function public.admin_list_blocked_emails() from public, anon;
revoke execute on function public.admin_unblock_email(text) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_set_banned(uuid, boolean, text) to authenticated;
grant execute on function public.admin_delete_user(uuid, boolean) to authenticated;
grant execute on function public.admin_list_blocked_emails() to authenticated;
grant execute on function public.admin_unblock_email(text) to authenticated;
