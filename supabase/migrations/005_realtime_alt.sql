-- =============================================================================
-- GCA sneakers — 005 : stock en temps réel + textes alternatifs des photos
-- =============================================================================
-- Realtime : la fiche produit reçoit les changements de stock instantanément
-- (Supabase Realtime applique la RLS : seuls les produits actifs sont diffusés).
alter publication supabase_realtime add table public.product_variants;

-- Textes alternatifs descriptifs (SEO + accessibilité) pour les photos de démo
update public.product_images i
set alt_fr = p.name_fr || ' — vue ' || i.position,
    alt_en = p.name_en || ' — view ' || i.position
from public.products p
where p.id = i.product_id and (i.alt_fr like 'Vue %' or i.alt_fr is null);
