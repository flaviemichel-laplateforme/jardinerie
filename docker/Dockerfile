# Version de PHP : doit rester identique à celle du serveur de production (Plesk), pour que les tests locaux reflètent la réalité.
# Modifiable sans toucher à ce fichier : PHP_VERSION=8.4 docker compose build api
# Calendrier de support : https://www.php.net/supported-versions.php
ARG PHP_VERSION=8.5
FROM php:${PHP_VERSION}-apache

# Installation des extensions PHP nécessaires
RUN docker-php-ext-install pdo pdo_mysql

# Installation de GD (traitement d'images : redimensionnement/compression à l'upload)
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install gd \
    && rm -rf /var/lib/apt/lists/*

# Installation de Xdebug (débogueur pas-à-pas, utilisable depuis VS Code)
RUN pecl install xdebug && docker-php-ext-enable xdebug
COPY docker/xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini


# Installation de curl (utilisé par Composer ; l'extension PHP curl sert à l'API Brevo et à Stripe)
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*


# Installation de Composer (gestionnaire de paquets PHP)
# On copie directement depuis l'image officielle Composer — la méthode recommandée
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Activation du module de réécriture d'URL (indispensable pour AltoRouter)
RUN a2enmod rewrite

# Sécurité : On force Apache à pointer uniquement sur le dossier /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf