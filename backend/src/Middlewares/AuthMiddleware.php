<?php

namespace App\Middlewares;

use App\Core\JwtHelper;
use App\Core\SessionCookie;

class AuthMiddleware
{
    /**
     * Vérifie que la requête provient d'un utilisateur authentifié.
     * Si la session est valide, renvoie le payload décodé (id, role, exp).
     * Si elle est invalide, envoie directement une réponse 401 JSON et arrête l'exécution.
     */
    public static function authenticate(): array
    {
        $token = $_COOKIE[SessionCookie::NAME] ?? null;

        if (!$token) {
            self::reject('Non authentifié.');
        }

        $secret = $_ENV['JWT_SECRET'] ?? throw new \RuntimeException('JWT_SECRET manquant dans les variables d\'environnement.');
        $payload = JwtHelper::verify($token, $secret);

        if (!$payload) {
            SessionCookie::clear();
            self::reject('Session invalide ou expirée.');
        }

        return $payload;
    }

    private static function reject(string $message): never
    {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(401);
        echo json_encode(["success" => false, "message" => $message]);
        exit;
    }
}
