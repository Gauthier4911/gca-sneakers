-- =============================================================================
-- Snika — 001 : schéma (ENUM, tables, contraintes, index)
-- =============================================================================
-- Monnaie : FCFA (pas de centimes) → numeric(12,0).
-- Pointures : saisies librement par l'admin pour chaque produit (EU, ex. 42 ou 42.5).

create extension if not exists pgcrypto;

-- ---------- ENUM ------------------------------------------------------------
create type public.user_role        as enum ('client', 'admin');
create type public.gender_type      as enum ('men', 'women', 'kids');
create type public.order_status     as enum ('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled');
create type public.fulfillment_type as enum ('delivery', 'pickup');
create type public.shoe_type        as enum ('sneakers', 'city', 'sport', 'boots', 'sandals', 'formal', 'school', 'slippers');
create type public.usage_type       as enum ('daily', 'work', 'sport', 'ceremony', 'hiking');

-- ---------- PROFILES --------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  whatsapp    text check (whatsapp ~ '^\+?[0-9 ]{8,20}$'),
  address     text check (char_length(address) <= 500),
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- CATEGORIES ------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_fr     text not null check (char_length(name_fr) between 1 and 80),
  name_en     text not null check (char_length(name_en) between 1 and 80),
  image_url   text check (char_length(image_url) <= 1000),
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- PRODUCTS --------------------------------------------------------
-- color / material : clés fixes (traduites côté front via i18n) pour que le
-- questionnaire puisse filtrer proprement.
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid references public.categories (id) on delete set null,
  gender          public.gender_type not null,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_fr         text not null check (char_length(name_fr) between 1 and 150),
  name_en         text not null check (char_length(name_en) between 1 and 150),
  description_fr  text not null default '' check (char_length(description_fr) <= 5000),
  description_en  text not null default '' check (char_length(description_en) <= 5000),
  shoe_type       public.shoe_type not null,
  usages          public.usage_type[] not null default '{}',
  color           text check (color in ('black','white','grey','beige','brown','blue','red','pink','green','yellow','orange','purple','multi')),
  material        text check (material in ('leather','synthetic','canvas','suede','mesh','textile','rubber')),
  price           numeric(12,0) not null check (price > 0),
  promo_price     numeric(12,0) check (promo_price is null or (promo_price > 0 and promo_price < price)),
  model_3d_url    text check (char_length(model_3d_url) <= 1000),
  is_featured     boolean not null default false,
  is_active       boolean not null default false,  -- activable seulement avec 4 photos
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_gender_active_idx on public.products (gender, is_active);
create index products_featured_idx on public.products (is_featured) where is_featured;

-- ---------- PRODUCT IMAGES (exactement 4 par produit actif) -----------------
create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null check (char_length(url) between 1 and 1000),
  alt_fr      text check (char_length(alt_fr) <= 200),
  alt_en      text check (char_length(alt_en) <= 200),
  position    smallint not null check (position between 1 and 4),
  unique (product_id, position)
);

-- ---------- VARIANTS (pointure + stock) -------------------------------------
create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size        numeric(4,1) not null check (size between 10 and 60 and size * 2 = trunc(size * 2)),
  stock       int not null default 0 check (stock >= 0),
  unique (product_id, size)
);
create index variants_product_idx on public.product_variants (product_id);

-- ---------- ORDERS ----------------------------------------------------------
create sequence public.order_number_seq;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique
                    default ('SN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  user_id           uuid references public.profiles (id) on delete set null,
  status            public.order_status not null default 'pending',
  fulfillment       public.fulfillment_type not null,
  subtotal          numeric(12,0) not null check (subtotal >= 0),
  discount          numeric(12,0) not null default 0 check (discount >= 0),
  delivery_fee      numeric(12,0) not null default 0 check (delivery_fee >= 0),
  total             numeric(12,0) not null check (total >= 0),
  customer_snapshot jsonb not null,
  locale            text not null default 'fr' check (locale in ('fr', 'en')),
  stock_applied     boolean not null default false,  -- évite un double décrément
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (total = subtotal - discount + delivery_fee)
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,          -- copie figée au moment de la commande
  size          numeric(4,1) not null,
  quantity      int not null check (quantity between 1 and 99),
  unit_price    numeric(12,0) not null check (unit_price >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- ---------- SETTINGS (clé / valeur) -----------------------------------------
create table public.settings (
  key         text primary key check (key ~ '^[a-z][a-z0-9_]{1,60}$'),
  value       jsonb not null,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ---------- CARTS (panier synchronisé entre appareils) ----------------------
create table public.carts (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  items       jsonb not null default '[]'::jsonb
              check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50),
  updated_at  timestamptz not null default now()
);
