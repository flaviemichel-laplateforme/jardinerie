<?php

namespace App\Core;

/**
 * Quelles origines (sites web) ont le droit d'appeler l'API avec le cookie de session ?
 *
 * La liste vient de ALLOWED_ORIGINS dans le .env (adresses séparées par des virgules). Sans cette variable, on garde les
 * adresses connues du projet : l'API continue de fonctionner, mais un nouveau domaine doit être ajouté explicitement.
 * Une origine absente de la liste ne reçoit AUCUN en-tête CORS : le navigateur bloque alors la lecture de la réponse.
 */
class CorsPolicy
{
    public const DEFAULT_ORIGINS = [
        'http://localhost:5173',          // ancien front-end (Vite), en développement
        'http://localhost:3000',          // nouveau front-end (Next.js), en développement
        'https://jardinerie.vercel.app',  // ancien front-end, en production
        'https://jardinerie-next.vercel.app', // nouveau front-end, en production
    ];

    // Les adresses de prévisualisation Vercel changent à chaque déploiement : un motif, limité à mon propre compte Vercel.
    private const PREVIEW_PATTERNS = [
        '#^https://jardinerie-git-[a-z0-9-]+-michels-projects-37882444\.vercel\.app$#',
        '#^https://jardinerie-next-[a-z0-9-]+-michels-projects-37882444\.vercel\.app$#',
    ];

    /** @return string[] */
    public static function allowedOrigins(?string $configured): array
    {
        $origins = array_values(array_filter(array_map(
            fn(string $origin) => rtrim(trim($origin), '/'),
            explode(',', (string) $configured)
        )));

        return $origins === [] ? self::DEFAULT_ORIGINS : $origins;
    }

    public static function isAllowed(string $origin, array $allowedOrigins): bool
    {
        if ($origin === '') {
            return false;
        }

        if (in_array($origin, $allowedOrigins, true)) {
            return true;
        }

        foreach (self::PREVIEW_PATTERNS as $pattern) {
            if (preg_match($pattern, $origin) === 1) {
                return true;
            }
        }

        return false;
    }
}
