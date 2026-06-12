# Utilisation de l'image officielle PHP 8.2 avec le serveur Apache
FROM php:8.2-apache

# Installation de l'extension PDO MySQL (indispensable pour votre base de données)
RUN docker-php-ext-install pdo pdo_mysql

# Activation du module de réécriture d'URL (indispensable pour AltoRouter)
RUN a2enmod rewrite

# Sécurité : On force Apache à pointer uniquement sur le dossier /public
# Cela protège votre dossier /src qui contient tout votre code métier
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf