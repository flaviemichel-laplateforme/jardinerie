<?php

namespace App\Core;

/**
 * Protection contre le CSRF (une page piégée qui fait agir ton navigateur sur le site à ton insu).
 *
 * Le cookie de session part automatiquement avec toute requête vers l'API, même lancée depuis un autre site. Pour qu'une
 * requête qui MODIFIE des données soit acceptée, on exige donc :
 *  1. une origine connue : l'en-tête Origin (ou, à défaut, Sec-Fetch-Site) ne doit pas venir d'un site étranger ;
 *  2. un corps au format JSON : un formulaire piégé ne peut envoyer que du texte ou des champs de formulaire, jamais application/json
 *     sans déclencher une pré-vérification CORS que le site étranger échoue (voir CorsPolicy).
 * Les appels sans Origin ni Sec-Fetch-Site (curl, serveur à serveur, Stripe) ne sont pas des attaques de navigateur : ils passent.
 */
class RequestGuard
{
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    // Appelé par les serveurs de Stripe : authentifié par sa signature, sans Origin
    private const SIGNED_WEBHOOK = '/api/webhooks/stripe';
    // Envoi d'image (multipart) : l'origine reste contrôlée, mais le corps n'est pas du JSON
    private const MULTIPART_ROUTES = ['/api/admin/upload'];

    /**
     * @param array<string,string> $headers En-têtes utiles, clés en minuscules : origin, sec-fetch-site, content-type
     * @param string[] $allowedOrigins
     * @return array{code:int, message:string}|null Refus à renvoyer, ou null si la requête est acceptée
     */
    public static function check(string $method, string $path, array $headers, array $allowedOrigins, bool $hasBody): ?array
    {
        if (in_array(strtoupper($method), self::SAFE_METHODS, true) || str_ends_with($path, self::SIGNED_WEBHOOK)) {
            return null;
        }

        $origin = $headers['origin'] ?? '';
        if ($origin !== '') {
            if (!CorsPolicy::isAllowed($origin, $allowedOrigins)) {
                return ['code' => 403, 'message' => 'Origine non autorisée.'];
            }
        } elseif (($headers['sec-fetch-site'] ?? '') === 'cross-site') {
            return ['code' => 403, 'message' => 'Origine non autorisée.'];
        }

        if (!$hasBody) {
            return null;
        }

        $contentType = strtolower($headers['content-type'] ?? '');
        $expected = self::isMultipartRoute($path) ? 'multipart/form-data' : 'application/json';
        if (!str_starts_with($contentType, $expected)) {
            return ['code' => 415, 'message' => "Format de requête non pris en charge ($expected attendu)."];
        }

        return null;
    }

    private static function isMultipartRoute(string $path): bool
    {
        foreach (self::MULTIPART_ROUTES as $route) {
            if (str_ends_with($path, $route)) {
                return true;
            }
        }

        return false;
    }
}
