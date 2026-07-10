<?php

namespace App\Models;

use App\Core\Database;

class UserModel
{
    /**
     * Cherche un utilisateur par email
     * Retourne les données de l'utilisateur s'il existe, sinon false.
     */
    public function getUserByEmail(string $email): array|false
    {
        $db = Database::getConnection();

        $sql = "SELECT * FROM users WHERE email = :email LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute([':email' => $email]);

        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * Cherche un utilisateur par id
     * Retourne les données de l'utilisateur s'il existe, sinon false.
     */
    public function findById(int $id): array|false
    {
        $db = Database::getConnection();

        $sql = "SELECT * FROM users WHERE id = :id LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }


    /**
     * Enregistre un nouvel utilisateur en base de données
     * * @return int L'ID du nouvel utilisateur inséré
     */
    public function create(string $lastName, string $firstName, string $email, string $hashedPassword, string $consentTimesTamp): int
    {
        $db = Database::getConnection();

        $sql = "INSERT INTO users (first_name, last_name, email, password, role, gdpr_consent_key)
                VALUES (:first_name, :last_name, :email, :password, 'customer', :gdpr_consent_key)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':email' => $email,
            ':password' => $hashedPassword,
            ':gdpr_consent_key' => $consentTimesTamp
        ]);

        return (int)$db->lastInsertId();
    }

    /**
     * Mise à jour du profil utilisateur
     * Retourne false si l'email est déjà pris par un autre compte.
     */
    public function update(int $id, string $firstName, string $lastName, string $email): bool
    {
        $db = Database::getConnection();

        // Vérifier que l'email n'est pas déjà utilisé par quelqu'un d'autre
        $checkSql = "SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':email' => $email, ':id' => $id]);

        if ($checkStmt->fetch(\PDO::FETCH_ASSOC)) {
            return false; // Email déjà pris
        }

        $sql = "UPDATE users SET first_name = :first_name, last_name = :last_name, email = :email WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':first_name' => $firstName,
            ':last_name'  => $lastName,
            ':email'      => $email,
            ':id'         => $id,
        ]);

        return true;
    }
    /**
     * Met à jour le mot de passe
     */
    public function updatePassword(int $id, string $newPassword): void
    {
        $db = Database::getConnection();
        $sql = "UPDATE users SET password = :password WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':password' => password_hash($newPassword, PASSWORD_BCRYPT),
            ':id' => $id
        ]);
    }

    /**
     * Anonymise les données personnelles d'un utilisateur (droit à l'oubli RGPD).
     * On ne supprime pas la ligne pour préserver l'historique des commandes —
     * les données comptables doivent rester traçables.
     */
    public function anonymize(int $id): bool
    {
        $db = Database::getConnection();

        $sql = "UPDATE users SET
                first_name       = 'Compte',
                last_name        = 'Supprimé',
                email            = CONCAT('anonymized_', :id_email, '@deleted.local'),
                password         = '',
                gdpr_consent_key = NULL
            WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id_email' => $id,
            ':id'       => $id,
        ]);

        return $stmt->rowCount() > 0;
    }
}
