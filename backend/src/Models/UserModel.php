<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class UserModel
{
    /**
     * Cherche un utilisateur par email
     * Retourne l'ID de l'utilisateur s'il existe, sinon null.
     */
    public function getUserByEmail(string $email): ?int
    {
        $db = Database::getConnection();

        $sql = ("SELECT id FROM users WHERE email = :email LIMIT 1");

        $stmt = $db->prepare($sql);
        $stmt->execute([':email' => $email]);

        $result = $stmt->fetchColumn();

        return $result !== false ? (int)$result : null;
    }


    /**
     * Enregistre un nouvel utilisateur en base de données
     * * @return int L'ID du nouvel utilisateur inséré
     */
    public function create(string $lastName, string $firstName, string $email, string $hashedPassword): int
    {
        $db = Database::getConnection();

        $sql = "INSERT INTO users (first_name, last_name, email, password, role)
                VALUES (:first_name, :last_name, :email, :password, 'customer'";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':email' => $email,
            ':password' => $hashedPassword
        ]);

        return (int)$db->lastInsertId();
    }
}
