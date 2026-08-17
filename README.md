# Jardinerie — E-commerce

Plateforme e-commerce dédiée à la vente de végétaux et d'articles de jardinage, développée dans le cadre du Titre Professionnel Développeur Web et Web Mobile (DWWM).

## Stack technique

- **Front-end** : React (Vite), Tailwind CSS
- **Back-end** : PHP natif orienté objet (MVC), AltoRouter
- **Base de données** : MySQL, via PDO
- **Paiement** : Stripe
- **Emails transactionnels** : Resend
- **Environnement** : Docker (API + MySQL + phpMyAdmin)

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (v18 ou supérieur) et npm, pour le front-end
- Git

## Installation en local

### 1. Cloner le dépôt

```
git clone <url-du-depot>
cd jardinerie-ecommerce
```

### 2. Créer les secrets Docker

Ces fichiers contiennent les mots de passe MySQL et ne sont jamais versionnés :

```
mkdir secrets
echo "votre_mot_de_passe" > secrets/db_password.txt
echo "votre_mot_de_passe_root" > secrets/db_root_password.txt
```

### 3. Configurer les variables d'environnement

Trois fichiers `.env` sont nécessaires, chacun à copier depuis son modèle `.env.example` correspondant, puis à compléter :

| Fichier | Rôle |
|---|---|
| `.env` (racine) | Lu par `docker compose` pour configurer les conteneurs (ports, nom de la base) |
| `backend/.env` | Lu par l'API PHP (connexion base de données, clé JWT, clés Stripe et Resend) |
| `frontend/.env` | Lu par Vite (URL de l'API, clé publique Stripe) |

```
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Complétez ensuite chaque fichier avec vos propres valeurs (ports, identifiants de base de données, clés API Stripe/Resend).

### 4. Lancer le Back-end (Docker)

```
docker compose up -d
```

Cette commande démarre trois conteneurs :
- l'API PHP (Apache), accessible sur le port défini par `API_PORT`
- la base de données MySQL
- phpMyAdmin, accessible sur `http://localhost:8080`

### 5. Lancer le Front-end

```
cd frontend
npm install
npm run dev
```

L'application est alors accessible sur `http://localhost:5173`.

## Tests automatisés (back-end)

```
docker compose exec api vendor/bin/phpunit
```

Pour générer un rapport de couverture de code, consultable ensuite via `backend/coverage/index.html` :

```
docker compose exec api vendor/bin/phpunit --coverage-html coverage
```

## Déploiement

L'application est déployée en production sur deux infrastructures distinctes : le Front-end sur Vercel (intégration continue), le Back-end et la base de données sur un serveur Plesk (transfert manuel).

### Front-end (Vercel)

Le dépôt GitHub est connecté à Vercel. Chaque push sur la branche `main` déclenche automatiquement un build (`npm run build`) et une mise en production, sans intervention manuelle.

Variables d'environnement à configurer dans le tableau de bord Vercel (Project Settings → Environment Variables) :

| Variable | Rôle |
|---|---|
| `VITE_API_BASE_URL` | URL du Back-end en production (ex : `https://api.mondomaine.fr`) |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe |

Le fichier `frontend/vercel.json` configure une redirection de toutes les routes vers `index.html` :

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Cette règle est indispensable pour une Single Page Application : sans elle, toute URL profonde demandée directement (rafraîchissement de page, lien partagé, retour de redirection Stripe après paiement) renvoie une erreur 404, faute de fichier correspondant côté serveur.

### Back-end (Plesk)

Le Back-end n'est pas connecté à un système de déploiement continu. Les fichiers sont transférés manuellement via **FileZilla** (client FTP/SFTP), un choix cohérent avec un hébergement mutualisé sans Docker.

1. Connexion au serveur via FileZilla, avec les identifiants FTP fournis par Plesk.
2. Transfert de l'arborescence `backend/` (contrôleurs, services, modèles, dossier `vendor/`) vers `httpdocs/` sur le serveur.
3. Configuration de la racine du document (Document Root) sur `backend/public/`, pour n'exposer publiquement que le point d'entrée de l'API.
4. Création du fichier `.env` de production directement sur le serveur (jamais versionné), avec les valeurs réelles de :

```
APP_ENV=production
DB_HOST=...
DB_PORT=3306
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
FRONTEND_URL=https://mondomaine.vercel.app
```

5. Import de la base de données via phpMyAdmin (intégré à Plesk) : d'abord le script de structure, puis le script de données.
6. Activation d'un certificat SSL (Let's Encrypt) sur le domaine, avec redirection automatique HTTP → HTTPS.
7. Configuration d'un webhook Stripe pointant vers `https://<domaine-back-end>/api/webhooks/stripe`, écoutant l'événement `payment_intent.succeeded` — indispensable, car c'est ce webhook (et non la page de confirmation) qui déclenche la création de la commande en base de données.

### Différences entre environnement local et production

| Aspect | Local (Docker) | Production (Plesk) |
|---|---|---|
| Mot de passe base de données | Secret Docker (`secrets/db_password.txt`) | Variable `DB_PASSWORD` dans le `.env` |
| Cookie de session | `SameSite=Lax`, `Secure=false` (même domaine, HTTP) | `SameSite=None`, `Secure=true` (domaines différents, HTTPS obligatoire) |

`Database.php` et `AuthController.php` détectent automatiquement l'environnement (via `APP_ENV`) pour appliquer la configuration adaptée, sans nécessiter de code différent entre les deux contextes.
