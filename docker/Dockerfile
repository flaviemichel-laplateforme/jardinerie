# Utilisation de l'image officielle PHP 8.2 avec le serveur Apache
FROM php:8.2-apache

# Installation des extensions PHP nécessaires
RUN docker-php-ext-install pdo pdo_mysql

# Installation de curl (nécessaire pour Resend SDK et Composer)
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Installation de Composer (gestionnaire de paquets PHP)
# On copie directement depuis l'image officielle Composer — la méthode recommandée
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Activation du module de réécriture d'URL (indispensable pour AltoRouter)
RUN a2enmod rewrite

# Sécurité : On force Apache à pointer uniquement sur le dossier /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf