# Frontend Next.js (en cours de migration)

Nouvelle version du site, construite à côté de l'ancienne (`../frontend`, React + Vite) qui reste en ligne tant que la migration
n'est pas terminée. Objectif : un vrai référencement (SEO) — le serveur envoie des pages complètes, avec un titre et une description
propres à chaque page, au lieu d'une page vide remplie par JavaScript.

État : **étape 1 en cours**. Mise en page commune, accueil, catalogues (`/produits`, `/vegetaux`, `/jardinage`), pages
légales, contact, page 404 et page d'erreur. La fiche produit arrive dans la PR suivante. Les liens vers les pages pas
encore portées (fiche produit, panier, connexion, compte…) mènent temporairement à la page 404.

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
