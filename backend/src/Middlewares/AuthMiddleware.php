<?php

namespace App\Middlewares;

use App\Core\JwtHelper;

class AuthMiddleware
{
    /**
     * Vérifie que la requête provient d'un utilisateur authentifié.
     * Si la session est valide, renvoie le payload décodé (id, role, exp).
     * Si elle est invalide, envoie directement une réponse 401 JSON et arrête l'exécution.
     */
    public static function authenticate(): array
    {
        $token = $_COOKIE['jardinerie_session'] ?? null;

        if (!$token) {
            self::reject('Non authentifié.');
        }

        $secret = $_ENV['JWT_SECRET'] ?? 'default_secret';
        $payload = jwtHelper::verify($token, $secret);

        if (!$payload) {
            setcookie('jardinerie_session', '', time() - 3600, '/');
            self::reject('Session invalide ou expirée.');
        }

        return $payload;
    }

    private static function reject(string $message): never
    {
        header("Content-type: application/json; charset=UTF-8");
        http_response_code(401);
        echo json_encode(["success" => false, "message" => $message]);
        exit;
    }
}
