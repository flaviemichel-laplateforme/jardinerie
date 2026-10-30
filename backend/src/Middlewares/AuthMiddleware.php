<?php

namespace App\Middlewares;

use App\Core\JwtHelper;
use App\Core\SessionCookie;
use App\Core\SessionGuard;
use App\Models\UserModel;

class AuthMiddleware
{
    /**
     * Vérifie que la requête provient d'un utilisateur authentifié.
     * Si la session est valide, renvoie ['id' => ..., 'role' => ..., 'exp' => ...] ; l'identifiant et le rôle viennent
     * de la base de données, pas du jeton : une session fermée (mot de passe changé, rôle retiré, compte supprimé)
     * est refusée tout de suite, sans attendre l'expiration du jeton.
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

        $user = (new UserModel())->findSessionUser((int) ($payload['id'] ?? 0));
        $session = SessionGuard::validate($payload, $user ?: null);

        if ($session === null) {
            SessionCookie::clear();
            self::reject('Session invalide ou expirée.');
        }

        return $session + ['exp' => $payload['exp']];
    }

    private static function reject(string $message): never
    {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(401);
        echo json_encode(["success" => false, "message" => $message]);
        exit;
    }
}
