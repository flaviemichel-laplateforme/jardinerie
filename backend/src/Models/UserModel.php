<?php

namespace App\Models;

use App\Core\Database;
use App\Core\PasswordPolicy;
use App\Core\SecurityLog;

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
     * Ce qu'il faut savoir d'un compte pour décider si une session est encore valable (voir SessionGuard) :
     * une seule requête, légère, exécutée à chaque appel authentifié.
     */
    public function findSessionUser(int $id): array|false
    {
        $db = Database::getConnection();

        $sql = "SELECT id, role, token_version, anonymized_at FROM users WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * Le compte tel qu'on peut le montrer au front-end : sans empreinte du mot de passe ni données internes de session.
     */
    public static function withoutSecrets(array $user): array
    {
        unset($user['password'], $user['token_version'], $user['anonymized_at']);

        return $user;
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
     * Met à jour le mot de passe, et ferme toutes les sessions ouvertes (token_version + 1) : un jeton volé
     * ne doit pas survivre au changement de mot de passe.
     */
    public function updatePassword(int $id, string $newPassword): void
    {
        $db = Database::getConnection();
        $sql = "UPDATE users SET password = :password, token_version = token_version + 1 WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':password' => PasswordPolicy::hash($newPassword),
            ':id' => $id
        ]);
    }

    /**
     * Recalcule le haché du MÊME mot de passe avec le coût actuel (voir PasswordPolicy::needsRehash).
     * Contrairement à updatePassword, les sessions ouvertes ne sont pas fermées : le mot de passe n'a pas changé.
     */
    public function rehashPassword(int $id, string $password): void
    {
        $db = Database::getConnection();
        $db->prepare("UPDATE users SET password = :password WHERE id = :id")
           ->execute([':password' => PasswordPolicy::hash($password), ':id' => $id]);
    }

    /**
     * Anonymise les données personnelles d'un utilisateur (droit à l'oubli RGPD).
     * On ne supprime pas la ligne pour préserver l'historique des commandes —
     * les données comptables doivent rester traçables.
     */
    public function anonymize(int $id): bool
    {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            // L'adresse d'origine, avant qu'elle ne soit remplacée : sert à retrouver les tentatives de connexion du journal
            $oldEmail = $db->prepare("SELECT email FROM users WHERE id = :id");
            $oldEmail->execute([':id' => $id]);
            $emailBefore = $oldEmail->fetchColumn();

            $sql = "UPDATE users SET
                first_name       = 'Compte',
                last_name        = 'Supprimé',
                email            = CONCAT('anonymized_', :id_email, '@deleted.local'),
                password         = '',
                gdpr_consent_key = NULL,
                email_verified_at = NULL,
                anonymized_at    = NOW(),
                token_version    = token_version + 1
            WHERE id = :id";

            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':id_email' => $id,
                ':id'       => $id,
            ]);



            $db->prepare("DELETE FROM addresses WHERE user_id = :id")->execute([':id' => $id]);

            // Droit à l'oubli : l'IP et l'agent du journal de sécurité disparaissent aussi
            (new \App\Models\SecurityEventModel())->scrubUser($id, $emailBefore ? SecurityLog::hashEmail($emailBefore) : null);

            $db->commit();
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }


    /**
     * Applique une nouvelle adresse déjà confirmée par son propriétaire : elle devient l'adresse vérifiée du compte,
     * et les sessions ouvertes sont fermées.
     * Retourne false si l'adresse a été prise entre-temps par un autre compte.
     */
    public function changeEmail(int $id, string $newEmail): bool
    {
        $db = Database::getConnection();

        try {
            $sql = "UPDATE users SET email = :email, email_verified_at = NOW(), token_version = token_version + 1 WHERE id = :id";
            $db->prepare($sql)->execute([':email' => $newEmail, ':id' => $id]);

            return true;
        } catch (\PDOException $e) {
            if (($e->errorInfo[1] ?? null) === 1062) { // valeur en double sur l'index unique des adresses
                return false;
            }
            throw $e;
        }
    }

    /**
     * Marque l'email d'un utilisateur comme vérifié.
     */
    public function markEmailVerified(int $id): void
    {
        $db = Database::getConnection();
        $sql = "UPDATE users SET email_verified_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);
    }
}
