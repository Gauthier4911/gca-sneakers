# GCA sneakers 👟

Boutique en ligne de chaussures (Homme, Femme, Enfant). Stack : React (Vite) + Tailwind + Framer Motion + i18next, avec Supabase pour la base, l'authentification et le stockage. Le paiement se finalise sur WhatsApp.

> État : **étape 2/10 terminée** (base de données, logo, structure du site, page d'accueil).

## Lancer le site en local

```bash
npm install
cp .env.example .env   # puis remplir l'URL et la clé publique Supabase
npm run dev            # http://localhost:5173
```

`npm run build` produit la version de production dans `dist/` (c'est ce que Vercel exécute).

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

Couleurs : **vert, orange or et blanc**, avec un dégradé signature or → orange (aperçu : `docs/palette.png`).

| Rôle | Nom | Hex | Usage (contraste vérifié AA) |
|---|---|---|---|
| Fond fort | Vert forêt | `#053B2C` | Hero, pied de page, titres. Texte blanc (12.6:1) ou or (7.3:1) dessus |
| Primaire | Émeraude | `#047857` | Boutons secondaires, liens, logo. Texte blanc (5.5:1) |
| Accent | Menthe vive | `#34D399` | Petits accents sur fond forêt (6.6:1) |
| Action | Or soleil | `#FFB800` | Boutons « Ajouter au panier », badges. Texte forêt (7.3:1) |
| Promo | Orange mangue | `#FF7A00` | Fin du dégradé signature, promos. Texte forêt (4.8:1) |
| Texte orange | Ambre | `#B45309` | Prix promo sur fond blanc (5.0:1) |
| Fond doux | Crème | `#FFF8E7` | Sections alternées |
| Fond | Blanc | `#FFFFFF` | Fond principal |

Règle d'or : **jamais de texte or ou orange sur fond blanc** (illisible). On utilise l'ambre à la place.

Polices : **Lexend** (titres, proche du logo) + **Inter** (texte).

## 6. Logo

Fichiers dans `public/logo/` : `gca-logo.svg` (couleur, fond blanc), `gca-logo-white.svg` (fond vert ou foncé), `gca-logo-mono.svg`, `gca-icon.svg` (favicon et avatar des réseaux, sur fond vert forêt). Aperçu : `docs/logo-preview.png`. Régénération : `scripts/build-logo.mjs`.
