-- =============================================================================
-- GCA sneakers — 009 : correctif bannissement
-- =============================================================================
-- 'infinity' n'est pas lisible par Supabase Auth (erreur 500 à la connexion) :
-- on utilise une date très lointaine. (La migration 008 est déjà corrigée.)
update auth.users set banned_until = '2999-12-31 00:00:00+00' where banned_until = 'infinity';
