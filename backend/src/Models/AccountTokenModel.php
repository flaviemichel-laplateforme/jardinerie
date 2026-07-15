<?php

namespace App\Models;

use App\Core\Database;

class AccountTokenModel
{
    /**
     * Génère un nouveau jeton sécurisé pour un utilisateur, et l'enregistre en base.
     * Retourne le jeton en clair (à insérer dans le lien envoyé par email).
     */
    public function create(int $userId, string $purpose, int $validityMinutes = 60): string
    {
        $db = Database::getConnection();

        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + ($validityMinutes * 60));

        $sql = "INSERT INTO account_tokens (user_id, token, purpose, expires_at)
                VALUES (:user_id, :token, :purpose, :expires_at)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'user_id'   => $userId,
            'token'     => $token,
            'purpose'   => $purpose,
            'expires_at' => $expiresAt,
        ]);

        return $token;
    }

    /**
     * Vérifie qu'un jeton existe, correspond bien à l'usage attendu,
     * n'a pas expiré, et n'a pas déjà été utilisé.
     */
    public function findValidToken(string $token, string $purpose): ?array
    {
        $db = Database::getConnection();

        $sql = "SELECT id, user_id, expires_at, used_at
                FROM account_tokens
                WHERE token = :token
                  AND purpose = :purpose
                  AND used_at IS NULL
                  AND expires_at > NOW()
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['token' => $token, 'purpose' => $purpose]);

        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Marque un jeton comme consommé, pour empêcher toute réutilisation.
     */
    public function markAsUsed(string $token): bool
    {
        $db = Database::getConnection();

        $sql = "UPDATE account_tokens SET used_at = NOW() WHERE token = :token";
        $stmt = $db->prepare($sql);

        return $stmt->execute(['token' => $token]);
    }
}
