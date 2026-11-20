# GCA sneakers 👟

Boutique en ligne de chaussures (Homme, Femme, Enfant) : catalogue, questionnaire « Trouvez votre paire », panier avec promo, commande finalisée sur **WhatsApp**, espace admin complet. Site bilingue **FR / EN**.

**Stack** : React 18 (Vite) · Tailwind CSS · Framer Motion · React Router · i18next · react-helmet-async · zod · Supabase (Auth, Postgres, Storage, Realtime, RLS) · hébergement Vercel.

---

## 1. Lancer le site en local

```bash
npm install
cp .env.example .env      # puis remplir les 3 variables (voir §3)
npm run dev               # http://localhost:5173
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (`dist/`) + pages SEO pré-générées + `sitemap.xml` + `robots.txt` |
| `npm run preview` | Tester le build localement |
| `npm run logo` | Régénérer les fichiers du logo |
| `npm run demo-images` | Régénérer les illustrations de démo |

## 2. Configurer Supabase

1. Créer un projet sur https://supabase.com (région conseillée : `eu-west-3` Paris).
2. **SQL Editor** → exécuter dans l'ordre :
   `supabase/migrations/001_schema.sql` → `002_functions.sql` → `003_rls.sql` → `004_storage.sql` → `005_realtime_alt.sql`, puis `supabase/seed.sql` (données de démo, facultatif).
3. **Désactiver la confirmation email** : *Authentication → Sign In / Providers → Email* → décocher **Confirm email**.
4. **Limites anti-abus** (recommandé) : *Authentication → Rate Limits* (laisser les valeurs par défaut ou les baisser).
5. *Project Settings → API Keys* : copier l'**URL** et la clé **publishable / anon** dans `.env`.
   ⚠️ **Jamais** la clé `service_role` / `secret` dans le site.

> Le projet de production existe déjà : `gca-sneakers` (organisation Sourcia, région Paris).

## 3. Variables d'environnement

| Variable | Exemple | Rôle |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` | Clé **publique** (protégée par la RLS) |
| `VITE_SITE_URL` | `https://gca-sneakers.vercel.app` | Adresse publique du site (sitemap, partage, canonical) |

## 4. Passer un utilisateur en admin (manuellement)

Le site ne permet **jamais** de devenir admin. La personne crée d'abord un compte sur le site, puis dans le **SQL Editor** de Supabase :

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'email@exemple.com');
```

Pour retirer les droits : même requête avec `role = 'client'`. L'espace admin est ensuite accessible sur **`/admin`** (lien aussi dans « Mon compte »).

## 5. Ce que peut faire l'admin (`/admin`)

- **Tableau de bord** : chiffre d'affaires (commandes payées, expédiées ou livrées), commandes de la période, ventes par jour, meilleures ventes, stock faible, commandes par statut.
- **Commandes** : filtres par statut, recherche, détail, bouton « Contacter sur WhatsApp », changement de statut `pending → confirmed → paid → shipped → delivered` ou `cancelled`. Le **stock est retiré automatiquement au passage en « Payée »** et remis si la commande est annulée après paiement.
- **Produits** : création et modification, **4 photos** (converties en WebP 1200 px), modèle 3D `.glb` facultatif, pointures et stock (avec ajout d'une plage, ex. 36 → 45), prix promo, coup de cœur, visible ou masqué.
- **Catégories** : création, modification, ordre, suppression.
- **Paramètres** : numéro WhatsApp de la boutique, adresse de l'entrepôt, horaires, frais de livraison, devise, promo (nombre d'articles et %), lien de la vidéo (YouTube ou TikTok), photos de l'entrepôt, liens TikTok, Instagram, Facebook et WhatsApp.

## 6. Parcours client

1. Panier **sans compte** (enregistré dans le navigateur, puis synchronisé avec le compte à la connexion).
2. Promo automatique : **-X % dès N articles**, avec l'indicateur « Plus que 2 articles… ».
3. « Commander » → connexion ou inscription (le panier est conservé) → choix **livraison** (frais) ou **retrait à l'entrepôt** (gratuit) → récapitulatif.
4. La commande est **enregistrée par le serveur**, qui **recalcule les prix**. WhatsApp s'ouvre ensuite avec le message pré-rempli (n° de commande, articles, pointures, total, mode de réception, adresse, client), puis un écran de confirmation s'affiche.

## 7. Sécurité

| Élément | Règle |
|---|---|
| RLS | Activée sur **toutes** les tables, admin vérifié par la fonction SQL `is_admin()` |
| Catalogue | Lecture publique des produits actifs ; écriture admin uniquement |
| Profils | Chacun voit et modifie le sien (nom, WhatsApp, adresse) ; la colonne `role` ne peut pas être modifiée depuis le site |
| Commandes | Créées uniquement par `create_order()` (prix recalculés côté serveur, stock vérifié, 5 commandes en attente max par 24 h) ; chaque client ne voit que les siennes |
| Statuts | Uniquement via `admin_set_order_status()` (transitions contrôlées, stock transactionnel) |
| Storage | Lecture publique, envoi par l'admin uniquement ; jpg/png/webp 5 Mo, glb 15 Mo, mp4 50 Mo |
| Navigateur | Clé publique seulement ; seul le jeton Supabase est stocké (plus le panier, sans donnée personnelle) |
| En-têtes | CSP, X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy (`vercel.json`) |
| Formulaires | Validation zod côté client, contraintes CHECK côté base, champ piège anti-robots, messages d'erreur non révélateurs |

## 8. SEO et performance

- URLs traduites (`/fr/boutique` ↔ `/en/shop`), balises `hreflang`, canonical, Open Graph, Twitter, JSON-LD (Organization, Product, BreadcrumbList, ShoeStore).
- `npm run build` **pré-génère une page HTML par URL** (accueil, boutique, catégories, produits, FR et EN) pour les aperçus de liens WhatsApp et Facebook, ainsi que `sitemap.xml` et `robots.txt`.
- Code découpé par page, module 3D et vidéo chargés à la demande, images en lazy loading et WebP, polices en `display=swap`.

## 9. Photos, 360° et 3D

- **4 photos obligatoires** par chaussure. Conseil : même cadrage (profil droit, profil gauche, trois-quarts, détail), fond uni, format carré.
- **Vue 360°** automatique : le client fait glisser la souris ou le doigt pour faire tourner la chaussure à travers ses photos.
- **Vraie 3D (facultatif)** : un fichier `.glb` active le bouton « Voir en 3D » (rotation, zoom). Pour le créer : appli **Polycam** ou **Luma AI** (scan au téléphone), export GLB **sans compression Draco**, moins de 15 Mo.

## 10. Déploiement sur Vercel (gratuit)

1. https://vercel.com/new → importer le dépôt GitHub `gca-sneakers` (framework détecté : **Vite**).
2. Ajouter les 3 variables du §3 (avec `VITE_SITE_URL` = l'adresse finale).
3. Deploy. Adresse gratuite : `https://gca-sneakers.vercel.app`.
4. **Nom de domaine** (facultatif, ~10–15 €/an chez un registrar) : *Project → Settings → Domains*, puis mettre à jour `VITE_SITE_URL` et redéployer. Le HTTPS est automatique.
5. Dans Supabase, *Authentication → URL Configuration* → **Site URL** = l'adresse du site.

## 11. Direction artistique

| Rôle | Couleur | Hex |
|---|---|---|
| Fond fort | Vert forêt | `#053B2C` |
| Primaire | Émeraude | `#047857` |
| Accent | Menthe vive | `#34D399` |
| Action | Or soleil → Orange mangue (dégradé signature) | `#FFB800` → `#FF7A00` |
| Texte orange | Ambre | `#B45309` |
| Fonds | Crème / Blanc | `#FFF8E7` / `#FFFFFF` |

Polices : **Lexend** (titres) et **Inter** (texte). Logo : `public/logo/` (couleur, blanc, mono, icône). Règle : jamais de texte or ou orange sur fond blanc (illisible) ; on utilise l'ambre à la place.
