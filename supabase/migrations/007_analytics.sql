-- =============================================================================
-- GCA sneakers — 007 : statistiques de visite (respectueuses de la vie privée)
-- =============================================================================
-- Aucune adresse IP ni cookie : un identifiant aléatoire anonyme est généré
-- dans le navigateur (localStorage) pour compter les visiteurs uniques.
-- Les visites ne sont lisibles que par un admin, via admin_analytics().

create table public.page_views (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  path        text not null check (char_length(path) between 1 and 300),
  lang        text check (lang in ('fr', 'en')),
  referrer    text check (char_length(referrer) <= 200),   -- domaine uniquement
  visitor_id  uuid not null,
  device      text check (device in ('mobile', 'tablet', 'desktop'))
);
create index page_views_created_idx on public.page_views (created_at desc);
create index page_views_visitor_idx on public.page_views (visitor_id, path, created_at desc);

alter table public.page_views enable row level security;   -- aucune politique : accès direct interdit
revoke all on public.page_views from anon, authenticated;

-- Enregistre une page vue (dédoublonnée : même visiteur + même page = 1 vue / 30 min)
create or replace function public.track_view(
  p_path text, p_lang text, p_referrer text, p_visitor uuid, p_device text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_visitor is null or p_path is null or p_path !~ '^/' or char_length(p_path) > 300 or p_path like '/admin%' then
    return;
  end if;
  if exists (select 1 from public.page_views
             where visitor_id = p_visitor and path = p_path and created_at > now() - interval '30 minutes') then
    return;
  end if;
  insert into public.page_views (path, lang, referrer, visitor_id, device)
  values (
    p_path,
    case when p_lang in ('fr', 'en') then p_lang end,
    nullif(left(lower(regexp_replace(coalesce(p_referrer, ''), '[^a-zA-Z0-9.\-]', '', 'g')), 200), ''),
    p_visitor,
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device end
  );
end $$;

revoke execute on function public.track_view(text, text, text, uuid, text) from public;
grant execute on function public.track_view(text, text, text, uuid, text) to anon, authenticated;

-- Statistiques pour le tableau de bord admin
create or replace function public.admin_analytics(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  with pv as (select * from public.page_views where created_at between p_from and p_to)
  select jsonb_build_object(
    'visitors',       (select count(distinct visitor_id) from pv),
    'views',          (select count(*) from pv),
    'online_now',     (select count(distinct visitor_id) from public.page_views where created_at > now() - interval '5 minutes'),
    'visitors_today', (select count(distinct visitor_id) from public.page_views where created_at >= date_trunc('day', now())),
    'by_day',         (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'visitors', vi, 'views', vw) order by d), '[]')
                       from (select date_trunc('day', created_at)::date d, count(distinct visitor_id) vi, count(*) vw from pv group by 1) x),
    'top_pages',      (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', n) order by n desc), '[]')
                       from (select path, count(*) n from pv group by path order by n desc limit 10) x),
    'referrers',      (select coalesce(jsonb_agg(jsonb_build_object('source', s, 'visitors', n) order by n desc), '[]')
                       from (select coalesce(referrer, '') s, count(distinct visitor_id) n from pv group by 1 order by n desc limit 8) x),
    'devices',        (select coalesce(jsonb_object_agg(coalesce(device, 'desktop'), n), '{}')
                       from (select device, count(distinct visitor_id) n from pv group by device) x),
    'langs',          (select coalesce(jsonb_object_agg(coalesce(lang, 'fr'), n), '{}')
                       from (select lang, count(distinct visitor_id) n from pv group by lang) x)
  ) into v;
  return v;
end $$;

revoke execute on function public.admin_analytics(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_analytics(timestamptz, timestamptz) to authenticated;

-- Nouveaux paramètres éditables depuis l'admin (logo, textes du site)
insert into public.settings (key, value, is_public) values
  ('logo_url', '""', true),
  ('logo_light_url', '""', true),
  ('content', '{"fr": {}, "en": {}}', true)
on conflict (key) do nothing;

-- Le logo peut être une image PNG/WebP/JPG (bucket site-media déjà autorisé)
