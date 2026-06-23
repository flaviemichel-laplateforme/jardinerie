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
     * Enregistre un nouvel utilisateur en base de données
     * * @return int L'ID du nouvel utilisateur inséré
     */
    public function create(string $lastName, string $firstName, string $email, string $hashedPassword): int
    {
        $db = Database::getConnection();

        $sql = "INSERT INTO users (first_name, last_name, email, password, role)
                VALUES (:first_name, :last_name, :email, :password, 'customer')";
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
