# GCA sneakers 👟

Boutique en ligne de chaussures (Homme, Femme, Enfant). Stack : React (Vite) + Tailwind + Framer Motion + i18next, avec Supabase pour la base, l'authentification et le stockage. Le paiement se finalise sur WhatsApp.

> État : **étape 1/10 terminée** (base de données + logo). Le front arrive à l'étape 2.

## 1. Créer le projet Supabase (gratuit)

1. Créer un compte sur https://supabase.com, puis **New project** (région la plus proche : `eu-west`/Paris pour l'Afrique de l'Ouest).
2. Ouvrir **SQL Editor** et exécuter, **dans l'ordre**, le contenu de :
   1. `supabase/migrations/001_schema.sql`
   2. `supabase/migrations/002_functions.sql`
   3. `supabase/migrations/003_rls.sql`
   4. `supabase/migrations/004_storage.sql`
   5. `supabase/seed.sql` (données de démo, facultatif)
3. **Désactiver la confirmation email** : *Authentication → Sign In / Providers → Email* → décocher **Confirm email**.
4. Récupérer l'URL et la clé **anon / publishable** dans *Project Settings → API* (pour le `.env` de l'étape 2).
   ⚠️ Ne jamais mettre la clé `service_role` dans le front.

## 2. Passer un utilisateur en admin (manuellement)

Le site ne permet **jamais** de devenir admin. Après l'inscription de la personne sur le site, dans le **SQL Editor** :

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'email@exemple.com');
```

Pour retirer les droits : même requête avec `role = 'client'`.

## 3. Ce que fait la base (résumé sécurité)

| Élément | Règle |
|---|---|
| RLS | Activée sur toutes les tables |
| Catalogue | Lecture publique (produits actifs seulement), écriture admin |
| Profils | Chacun voit et modifie le sien (nom, WhatsApp, adresse). La colonne `role` n'est pas modifiable depuis le site |
| Commandes | Créées uniquement via `create_order()`, qui **recalcule les prix côté serveur**. Chaque client ne voit que les siennes |
| Statuts | Changés uniquement via `admin_set_order_status()` : le stock est retiré au passage en *paid* et remis si la commande est annulée |
| Photos | Un produit ne peut être activé qu'avec ses 4 photos |
| Storage | Lecture publique, upload admin uniquement (jpg/png/webp 5 Mo, .glb 15 Mo, mp4 50 Mo) |
| Anti-abus | 5 commandes en attente maximum par client et par 24 h |

## 4. Pointures

Les pointures ne sont pas fixées à l'avance : quand tu ajoutes une chaussure, tu saisis **chaque pointure et le nombre de paires disponibles** (ex. 39 → 4 paires, 40 → 6 paires, 42.5 → 2 paires). Le questionnaire « Trouvez votre paire » ne propose que les pointures réellement en stock.

## 5. Direction artistique

Couleurs : **vert, orange or et blanc** (aperçu : `docs/palette.png`).

| Rôle | Couleur | Hex | Règle d'usage |
|---|---|---|---|
| Primaire | Vert GCA | `#0B6E4F` | Boutons, titres, liens. Texte blanc dessus (contraste 6.3:1) |
| Accent | Orange or | `#F2A20C` | Boutons d'action, badges promo, logo. **Toujours avec un texte vert nuit dessus** (7.3:1), jamais de petit texte or sur blanc |
| Accent texte | Orange foncé | `#B45F06` | Prix promo et liens orange sur fond blanc (4.6:1) |
| Fond | Blanc | `#FFFFFF` | Fond principal |
| Fond alterné | Ivoire | `#FFF9EC` | Sections alternées, cartes |
| Texte | Vert nuit | `#0E2A1F` | Texte courant, pied de page (fond) |

Polices : **Lexend** (titres, proche du logo) + **Inter** (texte).

## 6. Logo

Fichiers dans `public/logo/` : `gca-logo.svg` (couleur, fond blanc), `gca-logo-white.svg` (fond vert ou foncé), `gca-logo-mono.svg`, `gca-icon.svg` (favicon et avatar des réseaux). Aperçu : `docs/logo-preview.png`. Régénération : `scripts/build-logo.mjs`.
