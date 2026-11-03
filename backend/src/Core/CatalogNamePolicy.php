<?php

namespace App\Core;

/**
 * Nom d'un élément du classement (rayon, catégorie, sous-catégorie, nature ou pH du sol) : texte de 1 à 100 caractères.
 * L'unicité (dans le même parent, sans tenir compte des majuscules) est vérifiée en base par le service.
 */
final class CatalogNamePolicy
{
    public const MAX_LENGTH = 100;

    /** @return string|null Message d'erreur, ou null si le nom est valide */
    public static function validate(mixed $name): ?string
    {
        if (!is_string($name) || trim($name) === '') {
            return 'Le nom est obligatoire.';
        }

        if (mb_strlen(self::clean($name)) > self::MAX_LENGTH) {
            return 'Le nom ne peut pas dépasser ' . self::MAX_LENGTH . ' caractères.';
        }

        return null;
    }

    /** Espaces retirés autour, et espaces multiples réduits à un seul (« Plantes   vertes » = « Plantes vertes »). */
    public static function clean(string $name): string
    {
        return preg_replace('/\s+/u', ' ', trim($name)) ?? trim($name);
    }
}
