# Frontend Next.js (en cours de migration)

Nouvelle version du site, construite à côté de l'ancienne (`../frontend`, React + Vite) qui reste en ligne tant que la migration
n'est pas terminée. Objectif : un vrai référencement (SEO) — le serveur envoie des pages complètes, avec un titre et une description
propres à chaque page, au lieu d'une page vide remplie par JavaScript.

État : **étapes 1 et 2 terminées**. Mise en page commune, accueil, catalogues (`/produits`, `/vegetaux`, `/jardinage`), fiche
produit, pages légales, contact, page 404, page d'erreur, sitemap, **comptes** (connexion, inscription, mot de passe oublié,
liens des e-mails, espace client) et en-têtes de sécurité. Les liens vers les pages pas encore portées (panier, admin)
mènent temporairement à la page 404.

### Comptes : ce qu'il faut savoir
- **Pages publiques** : `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/verifier-email`,
  `/confirmer-changement-email`. Les trois chemins « avec jeton » sont ceux écrits dans les e-mails envoyés par l'API
  (paramètre `?token=`) : ne pas les renommer sans changer `AuthService` côté PHP.
- **Liens d'e-mail** : le jeton est lu, **effacé de la barre d'adresse**, puis envoyé en POST (`TokenConfirmation`). Un robot qui ouvre
  le lien (antivirus, aperçu) ne le consomme donc pas.
- **Après la connexion** : `?redirect=/chemin` ramène à la page demandée, mais seulement un chemin **du site** (`utils/safeRedirect.js`),
  sinon un lien piégé renverrait vers un faux site.
- **Contrôle anti-robots (Cloudflare Turnstile)** : composant `TurnstileWidget` + hook `useTurnstile`, sur l'inscription et « mot de passe oublié »
  (toujours) et sur la connexion (seulement quand l'API le demande après plusieurs échecs : réponse 403 avec `captcha_required`).
  Un jeton ne sert qu'une fois : après un envoi refusé, `reset()` relance le contrôle. Sans `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, rien ne s'affiche
  ni ne s'envoie. Clé de test locale (réussit toujours) : `1x00000000000000000000AA`. La clé SECRÈTE ne va jamais ici, seulement dans le `.env` de l'API.
- **Trop de tentatives** : l'API répond 429 avec `retry_after` ; les formulaires affichent le délai et bloquent le bouton (`useFormRequest`).
- **Espace client** (`/compte/*`) : `RequireAuth` renvoie vers la connexion sans session ; la vraie protection reste côté API (401).
  Changer le **mot de passe** ferme toutes les sessions (y compris celle en cours) : l'écran renvoie vers `/connexion`.
  Changer l'**adresse e-mail** demande le mot de passe actuel et ne s'applique qu'après le clic sur le lien envoyé à la nouvelle adresse.
- **Adresse de l'API** : un composant du navigateur doit construire lui-même ses adresses (`authService`, `accountService`). Une page
  serveur qui lui passerait l'adresse ferait appeler l'adresse INTERNE de l'API (`http://localhost:8000`), en contournant le relais.

### Fiche produit : ce qu'il faut savoir
- **Adresse** : `/produit/12-monstera-deliciosa` (identifiant + nom). Seul l'identifiant compte : un nom erroné affiche quand
  même la fiche, avec l'adresse canonique pour Google. Les anciennes adresses (`/produit/12`) sont redirigées en 308 par
  `src/proxy.js`, **avant** l'affichage : une redirection décidée pendant l'affichage arrive trop tard pour les robots.
- **Données** : lues sur le serveur et mises en cache une minute (`services/productData.js`). Le stock, lui, est vérifié en
  temps réel dans le navigateur (`ProductBuyBox`) : il peut avoir bougé depuis la mise en cache.
- **Générée au build** (`generateStaticParams`) pour les produits existants ; un produit ajouté ensuite est généré à sa première visite.
- **Fiche botanique** (`ProductBotanicalSheet`) : caractéristiques, calendrier de floraison et de récolte, conseils d'entretien et
  critères. Chaque partie n'apparaît que si elle est renseignée dans l'administration.
- **Référencement** : titre, description et image de partage propres au produit, données structurées `Product` (prix,
  disponibilité) et `sitemap.xml` listant toutes les fiches.

### Catalogue : ce qui a changé par rapport à l'ancienne version
- La **1re page** (12 produits) est calculée par le serveur, pour chaque jeu de filtres (`components/catalog/CatalogPage.jsx`) :
  elle est dans le HTML. Le navigateur ne charge que les pages suivantes, au défilement.
- Les trois anciennes pages de rayon sont remplacées par une seule vue (`CatalogView.jsx`) et un fichier de réglages
  (`constants/catalogModes.js`).
- **Bouton Retour** : Next.js garde lui-même les 3 dernières pages visitées, avec leur état et leur position de défilement.
  La mémoire maison de l'ancienne version a donc disparu. Sur un nouveau clic (menu), la liste repart de zéro (`bfcacheId`).

## Lancer en local

Prérequis : l'API tourne (`docker compose up -d` à la racine, voir le README principal) et Node.js 20 ou plus.

```
cd frontend-next
cp .env.example .env.local
npm install
npm run dev
```

Le site est alors accessible sur `http://localhost:3000`.

> Si `npm install` n'installe que 22 paquets et que `npm run lint` répond « eslint n'est pas reconnu », la variable d'environnement
> `NODE_ENV` vaut `production` sur votre poste : npm ignore alors les outils de développement. Utilisez `npm install --include=dev`.
>
> Si Node affiche « Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections insecure »,
> la vérification des certificats HTTPS est désactivée : aucun besoin sur ce projet, retirez cette variable de votre environnement.

## Variables d'environnement (`.env.local`, jamais versionné)

| Variable                        | Rôle                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `API_INTERNAL_URL`              | Adresse de l'API PHP, utilisée par le serveur Next.js (rendu des pages et relais de `/api`)   |
| `NEXT_PUBLIC_ASSET_BASE_URL`    | Adresse d'où le navigateur charge les images des produits (servies par l'API)                 |
| `NEXT_PUBLIC_SITE_URL`          | Adresse publique du site (liens canoniques, partage sur les réseaux)                          |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Clé publique Stripe (tunnel de paiement, étape 3)                                             |
| `SITE_INDEXABLE`                | `false` tant que l'ancien site est en ligne ; `true` seulement à la bascule (voir ci-dessous) |
| `PROXY_SHARED_SECRET`           | Secret partagé avec l'API : le relais l'ajoute aux appels `/api` pour que PHP connaisse l'IP réelle |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`| Clé publique Cloudflare Turnstile (contrôle anti-robots) ; vide = pas de contrôle affiché      |
| `CSP_REPORT_ONLY`               | `true` : la politique de sécurité du contenu signale au lieu de bloquer (filet de sécurité)   |

## En-têtes de sécurité

Posés sur toutes les pages par `next.config.mjs` : politique de sécurité du contenu (**CSP**), `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy` et `Strict-Transport-Security` (production seulement).

- **CSP** : le navigateur ne charge que le site lui-même, plus les images de l'API (`NEXT_PUBLIC_ASSET_BASE_URL`). `'unsafe-inline'` reste
  nécessaire pour les scripts et styles en ligne de Next.js (les pages prérendues ne peuvent pas recevoir de nonce).
- **Services externes déjà autorisés** : Cloudflare Turnstile (`challenges.cloudflare.com`, script et cadre).
- **Ajouter un service externe** (Stripe, par exemple) : compléter la CSP dans `next.config.mjs`, sinon le navigateur le bloque.
- **Page cassée après un changement ?** Mettre `CSP_REPORT_ONLY=true` sur Vercel et redéployer : les infractions s'affichent dans la
  console du navigateur (« Refused to … ») sans rien bloquer. Corriger, puis retirer la variable.
- **Vérifier** : `npm run build && npm run start`, ouvrir les pages, console du navigateur sans message « Refused ».

## Référencement pendant la migration

Les deux sites ont le même contenu. Si Google indexait les deux, il les verrait comme du **contenu dupliqué**, ce qui peut pénaliser le vrai
site. Tant que `SITE_INDEXABLE` ne vaut pas `true`, ce site envoie donc une balise `noindex` sur chaque page et un `robots.txt` qui
interdit tout. À la bascule : `SITE_INDEXABLE=true` sur Vercel, puis **redéployer** (le `robots.txt` est calculé au moment du build).

## Comment le site parle à l'API

- **Pages rendues sur le serveur** : Next.js appelle directement l'API (`API_INTERNAL_URL`). Les résultats sont gardés en cache et
  rafraîchis au plus toutes les minutes (`'use cache'` + `cacheLife`).
- **Navigateur** : il appelle `/api/...` sur le site lui-même. Next.js relaie la requête vers l'API PHP (`rewrites` dans
  `next.config.mjs`). Ainsi, le cookie de session est posé pour le domaine du site : ce n'est plus un cookie « tiers »,
  que certains navigateurs bloquent.
- **Images** : chargées directement depuis l'API (`NEXT_PUBLIC_ASSET_BASE_URL`), le relais ne concerne que `/api`.

## À savoir pour la suite

- `AuthContext` n'affiche plus d'écran d'attente pendant la vérification de la session (contrairement à l'ancienne version) : il
  expose `loading`. Sinon, Google recevrait un spinner à la place de la page. Les pages réservées (espace client, tunnel
  d'achat, admin) afficheront leur propre spinner tant que `loading` vaut `true`.
- Les polices viennent de `next/font` (Lato n'existe qu'en graisses 100, 300, 400, 700 et 900).
- Les pages qui appellent l'API au moment du build exigent que l'API soit joignable depuis Vercel.

## Commandes

| Commande        | Effet                                      |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Serveur de développement (port 3000)       |
| `npm run build` | Build de production                        |
| `npm run lint`  | Vérification du code avec ESLint           |
