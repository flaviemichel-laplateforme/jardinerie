<?php

namespace App\Models;

use App\Core\Database;

class AccountTokenModel
{
    public const PURPOSE_PASSWORD_RESET = 'password_reset';
    public const PURPOSE_EMAIL_VERIFICATION = 'email_verification';
    public const PURPOSE_EMAIL_CHANGE = 'email_change';

    /**
     * Empreinte d'un jeton. C'est elle qui est enregistrée : la valeur en clair n'existe que dans l'e-mail envoyé.
     * Si la base fuit, les empreintes ne permettent pas de reconstituer un lien utilisable.
     * (SHA-256 suffit ici : le jeton est aléatoire sur 256 bits, il n'y a rien à deviner par force brute.)
     */
    public static function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Génère un nouveau jeton sécurisé pour un utilisateur, et l'enregistre en base (sous forme d'empreinte).
     * Retourne le jeton en clair (à insérer dans le lien envoyé par email).
     *
     * Les jetons non utilisés du même usage pour cet utilisateur sont annulés : seul le dernier lien demandé fonctionne.
     *
     * @param string|null $payload Donnée liée au jeton (la nouvelle adresse, pour un changement d'e-mail)
     */
    public function create(int $userId, string $purpose, int $validityMinutes = 60, ?string $payload = null): string
    {
        $db = Database::getConnection();

        $this->invalidateAll($userId, $purpose);

        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + ($validityMinutes * 60));

        $sql = "INSERT INTO account_tokens (user_id, token_hash, purpose, payload, expires_at)
                VALUES (:user_id, :token_hash, :purpose, :payload, :expires_at)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'user_id'    => $userId,
            'token_hash' => self::hash($token),
            'purpose'    => $purpose,
            'payload'    => $payload,
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

        $sql = "SELECT id, user_id, payload, expires_at, used_at
                FROM account_tokens
                WHERE token_hash = :token_hash
                  AND purpose = :purpose
                  AND used_at IS NULL
                  AND expires_at > NOW()
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['token_hash' => self::hash($token), 'purpose' => $purpose]);

        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Marque un jeton comme consommé, pour empêcher toute réutilisation.
     */
    public function markAsUsed(string $token): bool
    {
        $db = Database::getConnection();

        $sql = "UPDATE account_tokens SET used_at = NOW() WHERE token_hash = :token_hash";
        $stmt = $db->prepare($sql);

        return $stmt->execute(['token_hash' => self::hash($token)]);
    }

    /**
     * Annule tous les jetons encore valables d'un utilisateur pour un usage donné
     * (après une réinitialisation réussie, aucun autre lien demandé auparavant ne doit rester utilisable).
     */
    public function invalidateAll(int $userId, string $purpose): void
    {
        $db = Database::getConnection();

        $sql = "UPDATE account_tokens SET used_at = NOW()
                WHERE user_id = :user_id AND purpose = :purpose AND used_at IS NULL";
        $db->prepare($sql)->execute(['user_id' => $userId, 'purpose' => $purpose]);
    }
}
