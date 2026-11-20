-- =============================================================================
-- GCA sneakers — données de démonstration (à exécuter APRÈS les migrations)
-- =============================================================================
-- Les images /demo/*.svg sont des illustrations livrées dans /public/demo.
-- Remplace-les par tes vraies photos depuis l'admin.

-- ---------- Paramètres ------------------------------------------------------
insert into public.settings (key, value, is_public) values
  ('store_name',        '"GCA sneakers"', true),
  ('currency',          '"FCFA"', true),
  ('whatsapp_number',   '"2250700000000"', true),   -- format international sans "+"
  ('warehouse_address', '"Entrepôt GCA sneakers — à compléter dans l''admin"', true),
  ('delivery_fee',      '1500', true),
  ('promo_threshold',   '5', true),
  ('promo_percent',     '10', true),
  ('low_stock_threshold','3', false),
  ('video_url',         '""', true),                -- lien YouTube / TikTok
  ('social_links',      '{"tiktok":"","facebook":"","instagram":"","whatsapp":""}', true),
  ('contact_email',     '""', true)
on conflict (key) do nothing;

-- ---------- Catégories ------------------------------------------------------
insert into public.categories (slug, name_fr, name_en, image_url, position) values
  ('sneakers',     'Sneakers',              'Sneakers',            '/demo/cat-sneakers.svg', 1),
  ('sport',        'Sport',                 'Sport',               '/demo/cat-sport.svg',    2),
  ('ville-habille','Ville & Habillé',       'City & Dress',        '/demo/cat-city.svg',     3),
  ('sandales',     'Sandales & Claquettes', 'Sandals & Slides',    '/demo/cat-sandals.svg',  4),
  ('bottes',       'Bottes & Bottines',     'Boots',               '/demo/cat-boots.svg',    5),
  ('ecole',        'École',                 'School',              '/demo/cat-school.svg',   6)
on conflict (slug) do nothing;

-- ---------- Produits (créés inactifs, puis activés après les 4 photos) -------
with data (cat, gender, slug, name_fr, name_en, desc_fr, desc_en, shoe_type, usages, color, material, price, promo, featured, sizes) as (
  values
  ('sneakers','men','gca-air-street-noir','Air Street Noir','Air Street Black',
   'Sneaker urbaine légère, semelle amortissante, parfaite au quotidien.','Lightweight urban sneaker with a cushioned sole, perfect for everyday wear.',
   'sneakers','{daily,work}','black','mesh', 45000, 39000, true, '{39,40,41,42,43,44,45}'),
  ('sneakers','men','gca-retro-blanc','Rétro Court Blanc','Retro Court White',
   'Le classique blanc en cuir, style rétro et finitions soignées.','The white leather classic with a retro vibe and clean finishes.',
   'sneakers','{daily}','white','leather', 55000, null, true, '{40,41,42,43,44}'),
  ('sport','men','gca-run-pro-bleu','Run Pro Bleu','Run Pro Blue',
   'Chaussure de running respirante avec bon maintien.','Breathable running shoe with great support.',
   'sport','{sport}','blue','mesh', 62000, null, false, '{40,41,42,43,44,45,46}'),
  ('ville-habille','men','gca-derby-cognac','Derby Cognac','Cognac Derby',
   'Derby en cuir véritable pour le bureau et les cérémonies.','Genuine leather derby for the office and ceremonies.',
   'formal','{work,ceremony}','brown','leather', 85000, 72000, true, '{40,41,42,43,44}'),
  ('bottes','men','gca-trek-boot','Trek Boot','Trek Boot',
   'Bottine robuste à crampons pour la randonnée.','Rugged lugged boot made for hiking.',
   'boots','{hiking,daily}','brown','suede', 98000, null, false, '{41,42,43,44,45}'),
  ('sneakers','women','gca-cloud-rose','Cloud Rose','Cloud Pink',
   'Sneaker plateforme ultra-confortable, coloris rose poudré.','Ultra-comfy platform sneaker in powder pink.',
   'sneakers','{daily}','pink','synthetic', 42000, 35000, true, '{36,37,38,39,40,41}'),
  ('ville-habille','women','gca-escarpin-nuit','Escarpin Nuit','Midnight Pump',
   'Escarpin bleu nuit, talon 7 cm, élégant pour toutes les occasions.','Midnight blue pump with a 7 cm heel, elegant for any occasion.',
   'formal','{ceremony,work}','blue','suede', 68000, null, true, '{36,37,38,39,40}'),
  ('sandales','women','gca-sandale-sun','Sandale Sun','Sun Sandal',
   'Sandale à brides dorée, légère pour l''été.','Light golden strappy sandal for summer.',
   'sandals','{daily,ceremony}','yellow','leather', 28000, null, false, '{36,37,38,39,40,41}'),
  ('sport','women','gca-fit-flow','Fit Flow','Fit Flow',
   'Chaussure de training souple pour la salle et la course.','Flexible training shoe for the gym and running.',
   'sport','{sport,daily}','white','mesh', 58000, 49000, false, '{36,37,38,39,40}'),
  ('ecole','kids','gca-kids-school','School Kid Noir','School Kid Black',
   'Chaussure d''école solide à scratch, facile à enfiler.','Sturdy school shoe with hook-and-loop strap, easy on.',
   'school','{daily}','black','leather', 22000, null, true, '{28,29,30,31,32,33,34,35}'),
  ('sneakers','kids','gca-kids-light','Kids Light Multi','Kids Light Multi',
   'Basket colorée et légère pour jouer toute la journée.','Colourful, lightweight sneaker to play all day.',
   'sneakers','{daily,sport}','multi','synthetic', 25000, 19000, true, '{24,25,26,27,28,29,30}'),
  ('sandales','kids','gca-kids-splash','Kids Splash','Kids Splash',
   'Sandale enfant résistante à l''eau, semelle antidérapante.','Water-friendly kids sandal with a non-slip sole.',
   'sandals','{daily}','blue','rubber', 15000, null, false, '{22,23,24,25,26,27,28}')
), ins as (
  insert into public.products (category_id, gender, slug, name_fr, name_en, description_fr, description_en,
                               shoe_type, usages, color, material, price, promo_price, is_featured, is_active)
  select c.id, d.gender::public.gender_type, d.slug, d.name_fr, d.name_en, d.desc_fr, d.desc_en,
         d.shoe_type::public.shoe_type, d.usages::public.usage_type[], d.color, d.material,
         d.price, d.promo, d.featured, false
  from data d join public.categories c on c.slug = d.cat
  on conflict (slug) do nothing
  returning id, slug
), imgs as (
  insert into public.product_images (product_id, url, alt_fr, alt_en, position)
  select ins.id, '/demo/' || ins.slug || '-' || n || '.svg',
         'Vue ' || n || ' de la chaussure', 'Shoe view ' || n, n
  from ins, generate_series(1, 4) n
  returning product_id
)
insert into public.product_variants (product_id, size, stock)
select ins.id, s::numeric, 2 + floor(random() * 10)::int
from ins join data d on d.slug = ins.slug, unnest(d.sizes::text[]) s;

-- Activation (le trigger vérifie la présence des 4 photos)
update public.products set is_active = true
where slug like 'gca-%' and not is_active;
