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

*À compléter après la mise en production.*
