#!/bin/sh
# Vérifie que le code du backend reste lisible par PHP 8.1, la version du serveur de production (Plesk).
#
# Pourquoi : les tests (PHPUnit 12) exigent PHP 8.3 minimum, donc le Docker local est plus récent que la production.
# Un code qui utilise une nouveauté de PHP 8.2 ou 8.3 (classe readonly, constante typée, json_validate…) passerait les tests
# en local mais ferait planter le site une fois envoyé sur Plesk. Ce contrôle l'attrape AVANT le déploiement.
#
# Usage (depuis la racine du projet, Docker Desktop lancé) :  sh scripts/verifier-php81.sh
# Sous Git Bash (Windows) :  MSYS_NO_PATHCONV=1 sh scripts/verifier-php81.sh

set -eu

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)/backend"
# Sous Windows/Git Bash, Docker veut un chemin de la forme C:/...
if command -v cygpath >/dev/null 2>&1; then
    BACKEND_DIR="$(cygpath -m "$BACKEND_DIR")"
fi

docker run --rm -v "$BACKEND_DIR:/app:ro" -w /app php:8.1-cli sh -c '
    total=0; errors=0
    for file in $(find src public -name "*.php"); do
        total=$((total + 1))
        if ! output=$(php -l "$file" 2>&1); then
            errors=$((errors + 1))
            echo "$output"
        fi
    done
    echo "$total fichiers contrôlés avec PHP $(php -r "echo PHP_VERSION;"), $errors erreur(s)"
    [ "$errors" -eq 0 ]
'
