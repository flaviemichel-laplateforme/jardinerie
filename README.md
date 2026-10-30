# Jardinerie — E-commerce

Plateforme e-commerce dédiée à la vente de végétaux et d'articles de jardinage, développée dans le cadre du Titre Professionnel Développeur Web et Web Mobile (DWWM).

## Liens

| Ressource                              | URL                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Application en ligne (Front-end)       | https://jardinerie.vercel.app                                          |
| API (Back-end, production)             | https://flavie-michel.students-laplateforme.io/jardinerie/api/products |
| Collection Postman (documentation API) | https://documenter.getpostman.com/view/52030770/2sBYApzZC4             |

## Stack technique

- **Front-end** : React (Vite), Tailwind CSS
- **Back-end** : PHP natif orienté objet (MVC), AltoRouter
- **Base de données** : MySQL, via PDO
- **Paiement** : Stripe
- **Emails transactionnels** : Brevo (API, appelée en cURL natif, sans SDK)
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

| Fichier         | Rôle                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| `.env` (racine) | Lu par `docker compose` pour configurer les conteneurs (ports, nom de la base) |
| `backend/.env`  | Lu par l'API PHP (connexion base de données, clé JWT, clés Stripe et Brevo)    |
| `frontend/.env` | Lu par Vite (URL de l'API, clé publique Stripe)                                |

```
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Complétez ensuite chaque fichier avec vos propres valeurs (ports, identifiants de base de données, clés API Stripe/Brevo).

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

> **Migration en cours :** une nouvelle version du front-end en Next.js (meilleur référencement) est construite dans `frontend-next/`,
> à côté de celle-ci. Voir `frontend-next/README.md`. L'application ci-dessus reste celle déployée en production.

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

| Variable                 | Rôle                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `VITE_API_BASE_URL`      | URL du Back-end en production (ex : `https://api.mondomaine.fr`) |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe                                              |

Le fichier `frontend/vercel.json` configure une redirection de toutes les routes vers `index.html` :

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
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
ALLOWED_ORIGINS=https://jardinerie.vercel.app,https://jardinerie-next.vercel.app
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
BREVO_API_KEY=...
MAIL_FROM_EMAIL=...
MAIL_FROM_NAME="La Jardinerie"
MAIL_TAG=jardinerie
FRONTEND_URL=https://mondomaine.vercel.app
```

**`JWT_SECRET`** signe les jetons de connexion : quiconque la connaît peut se faire passer pour n'importe quel utilisateur, administrateur compris. Elle doit faire **32 caractères au minimum**, être propre à la production (jamais la valeur d'exemple de `.env.example`, qui est publique : l'API refuse de démarrer avec elle en production) et rester secrète. Génération : `php -r "echo bin2hex(random_bytes(32));"`. La changer déconnecte tous les utilisateurs, sans autre conséquence.

**`ALLOWED_ORIGINS`** liste les sites autorisés à appeler l'API avec le cookie de session (séparés par des virgules, sans `/` final). Un site absent de la liste ne reçoit aucun en-tête CORS et ses requêtes qui modifient des données sont refusées (403). À mettre à jour pour tout nouveau domaine.

**`COOKIE_SAMESITE`** (facultatif) : `None` par défaut en production, car l'ancien front-end est sur un autre domaine. À passer à `Lax` quand le navigateur ne parle plus qu'au site (relais Next.js) : le cookie ne part alors plus lors d'une requête POST venue d'un autre site.

Une valeur contenant un espace (comme `MAIL_FROM_NAME`) doit être **entre guillemets** : sans eux, tout le fichier `.env` devient illisible et l'API ne démarre plus.

`MAIL_FROM_EMAIL` doit être un expéditeur **vérifié** dans Brevo (Paramètres, Expéditeurs, domaine, IP). Si une de ces variables est absente, les e-mails ne partent pas (l'erreur est journalisée), mais les commandes et les comptes restent créés.

5. Import de la base de données via phpMyAdmin (intégré à Plesk) : d'abord le script de structure, puis le script de données.
6. Activation d'un certificat SSL (Let's Encrypt) sur le domaine, avec redirection automatique HTTP → HTTPS.
7. Configuration d'un webhook Stripe pointant vers `https://<domaine-back-end>/api/webhooks/stripe`, écoutant l'événement `payment_intent.succeeded` — indispensable, car c'est ce webhook (et non la page de confirmation) qui déclenche la création de la commande en base de données.

### Version de PHP

| Environnement | Version | Remarque |
|---|---|---|
| Docker (local) | **8.5** (`PHP_VERSION` dans `docker-compose.yml` ou en variable d'environnement) | Les tests (PHPUnit 12) exigent PHP 8.3 minimum |
| Production (Plesk étudiant) | **8.1** | Plus supportée par php.net (plus de correctifs de sécurité) ; l'hébergement ne permet pas de la changer |

Tant que la production reste en PHP 8.1, le code ne doit utiliser aucune nouveauté de PHP 8.2 ou plus récent (classes `readonly`, constantes typées, `json_validate`…) : il passerait les tests en local mais ferait planter le site une fois déployé. **Avant chaque déploiement**, lancer le contrôle qui lit tout le backend avec PHP 8.1 :

```
MSYS_NO_PATHCONV=1 sh scripts/verifier-php81.sh
```

Un changement d'hébergement vers un serveur en PHP 8.3 ou plus récent est à prévoir. Calendrier officiel : https://www.php.net/supported-versions.php

### Migrations de la base de données

Les changements de structure sont dans `database/migrations/` (un fichier par lot, daté). Pour la production, **dans cet ordre** : sauvegarde de la base (phpMyAdmin → Exporter), exécution **une seule fois** du fichier de migration (onglet SQL ; retirer la ligne `USE` si le nom de la base diffère), **puis** envoi des fichiers PHP du lot par FileZilla. Le code d'un lot qui modifie la base ne doit jamais être envoyé avant sa migration : il demanderait des colonnes qui n'existent pas encore. Les migrations sont additives (elles ne suppriment rien), donc l'ancien code continue de fonctionner entre la migration et l'envoi des fichiers.

### Sécurité de l'API

- **Requêtes qui modifient des données** (POST, PUT, PATCH, DELETE) : l'en-tête `Origin` doit être un site autorisé et le corps doit être du JSON (`RequestGuard`), ce qui bloque le CSRF même avec un cookie `SameSite=None`. Exceptions : le webhook Stripe (signé) et l'envoi d'image (multipart, origine contrôlée).
- **Jetons de connexion** (`JwtHelper`) : algorithme `HS256` imposé, émetteur, date d'émission et expiration obligatoires, secret d'au moins 32 caractères.
- **Mots de passe** (`PasswordPolicy`) : 8 à 72 caractères, majuscule, minuscule, chiffre et symbole, refus des mots de passe courants (même déguisés : `P@ssw0rd!`) et de ceux qui contiennent l'adresse e-mail ; bcrypt coût 12, recalculé automatiquement à la connexion pour les anciens comptes.
- **Erreurs** : une erreur imprévue renvoie un JSON générique ; le détail reste dans le journal du serveur. Les routes `/api/test*` n'existent qu'en développement.
- **Entrées** : tout champ doit être du texte de longueur raisonnable (`Input`) ; les adresses e-mail sont normalisées en minuscules.
- **Sessions révocables** (`SessionGuard`, `AuthMiddleware`) : à chaque requête, le jeton est confronté au compte en base. Le rôle vient de la base, et la « version de session » (`users.token_version`) est incrémentée à chaque changement de mot de passe, de rôle ou d'adresse et à l'anonymisation : tous les jetons émis avant deviennent inutilisables, même s'ils sont signés et non expirés.
- **Jetons de vérification et de réinitialisation** (`AccountTokenModel`) : stockés sous forme d'empreinte SHA-256 (la valeur en clair n'existe que dans l'e-mail), un nouveau lien annule les précédents, un lien utilisé annule tous ceux de même usage.
- **Pas d'énumération de comptes** : la connexion prend le même temps que le compte existe ou non, l'inscription et « mot de passe oublié » répondent la même chose dans les deux cas (le propriétaire d'une adresse déjà inscrite est prévenu par e-mail). Les e-mails partent après la réponse (`DeferredWork`), donc la durée de la réponse ne dépend pas de leur envoi.
- **Changement d'adresse e-mail** : le mot de passe actuel est exigé, un lien de confirmation part vers la **nouvelle** adresse, l'ancienne est prévenue, et l'adresse ne change qu'après le clic (les sessions sont alors fermées).
- **E-mails de sécurité** : alerte à chaque changement de mot de passe ou d'adresse.
- **Limitation des tentatives** (`RateLimiter`, `LoginThrottle`, table `rate_limits`) : connexion bloquée après 5 échecs en 15 min pour un même e-mail depuis une même IP (20 par e-mail et 30 par IP au total), même avec le bon mot de passe ; réponse `429` avec `Retry-After`. Inscription, « mot de passe oublié », réinitialisation, liens de vérification, changement de mot de passe et d'adresse ont aussi leurs plafonds. Un succès remet le compteur à zéro. Si la base est indisponible, la limitation s'ouvre (elle n'empêche jamais de se connecter). `RATE_LIMIT_DISABLED=true` n'est lu qu'**hors production** (tests locaux).
- **IP réelle du visiteur** (`ClientIp`) : derrière le relais Next.js, PHP ne voit que l'IP du relais. `X-Forwarded-For` n'est donc crue que si la requête porte `X-Proxy-Secret` égal à `PROXY_SHARED_SECRET`, ajouté par `frontend-next/src/proxy.js` (celui que enverrait un navigateur est écrasé). Même valeur dans le `.env` de l'API et dans les variables serveur de Vercel ; absente en local, l'adresse de la connexion est utilisée.
- **Journal de sécurité** (`SecurityLog`, table `security_events`) : connexions réussies, échouées et bloquées, changements de mot de passe, d'adresse et de rôle, anonymisations, blocages de limitation. L'e-mail y est **haché** (jamais en clair), IP et navigateur sont conservés 12 mois (purge automatique) et effacés à l'anonymisation du compte. Consultation par un administrateur : `GET /api/admin/security-events` (filtres `event`, `user_id`, `email`, `from`, `to` ; pagination `page` / `limit`).

### Différences entre environnement local et production

| Aspect                       | Local (Docker)                                      | Production (Plesk)                                                      |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Mot de passe base de données | Secret Docker (`secrets/db_password.txt`)           | Variable `DB_PASSWORD` dans le `.env`                                   |
| Cookie de session            | `SameSite=Lax`, `Secure=false` (même domaine, HTTP) | `SameSite=None`, `Secure=true` (domaines différents, HTTPS obligatoire) |

`Database.php` et `AuthController.php` détectent automatiquement l'environnement (via `APP_ENV`) pour appliquer la configuration adaptée, sans nécessiter de code différent entre les deux contextes.

### E-mails transactionnels (Brevo)

Les e-mails de confirmation de commande, de réinitialisation du mot de passe et de vérification d'adresse partent via l'API Brevo (`src/Core/BrevoClient.php` et `src/Services/EmailService.php`). Points à connaître :

- **Aucun nom de domaine dédié** : l'expéditeur est une adresse personnelle vérifiée dans Brevo. Brevo signe les messages avec sa propre clé DKIM : ils peuvent plus facilement être classés en courrier indésirable. Une mise en production réelle demanderait un domaine authentifié (enregistrements DNS Brevo, DKIM et DMARC) ; il suffirait alors de changer `MAIL_FROM_EMAIL` dans le `.env`, sans modifier le code.
- **Quota** : 300 e-mails par jour sur la formule gratuite, partagés entre tous les sites rattachés au compte Brevo.
- **Clé API** : elle expire après 90 jours d'inactivité. Envoyer un e-mail de test avant une démonstration, et en générer une nouvelle si besoin.

