<?php

namespace App\Models;

use App\Core\Database;

class AddressModel
{

    /**
     * Liste toutes les adresses appartenant à un utilisateur donné.
     */
    public function findByUserId(int $userId): array
    {

        $db = Database::getConnection();

        $sql = "SELECT id, recipient_first_name, recipient_last_name, street, postal_code, country, phone 
                FROM addresses 
                WHERE user_id = :user_id
                ORDER BY id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Crée une nouvelle adresse pour un utilisateur.
     */
    public function create(int $userId, array $data): int
    {
        $db = Database::getConnection();

        $sql = "INSERT INTO addresses
                    (user_id, recipient_first_name, recipient_last_name, street, postal_code, city, country, phone)
                VALUES
                    (:user_id, :first_name, :last_name, :street, :postal_code, :city, :country, :phone)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':first_name' => $data['recipient_first_name'],
            ':last_name' => $data['recipient_last_name'],
            ':street' => $data['street'],
            ':postal_code' => $data['postal_code'],
            ':city' => $data['city'],
            ':country' => $data['country'] ?? 'France',
            ':phone' => $data['phone'],
        ]);

        return (int) $db->lastInsertId();
    }

    /**
     * Met à jour une adresse existante.
     * SÉCURITÉ : la condition "AND user_id = :user_id" empêche un utilisateur
     * de modifier l'adresse d'un autre, même en devinant son id (protection IDOR).
     */
    public function update(int $id, int $userId, array $data): bool
    {
        $db = Database::getConnection();

        // 1. Vérifie l'existence et la propriété, indépendamment du fait que
        //    les valeurs envoyées soient identiques aux valeurs actuelles ou non.
        $checkSql = "SELECT id FROM addresses WHERE id = :id AND user_id = :user_id";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':id' => $id, ':user_id' => $userId]);

        if (!$checkStmt->fetch(\PDO::FETCH_ASSOC)) {
            return false; // L'adresse n'existe pas, ou appartient à un autre utilisateur.
        }

        // 2. L'adresse est confirmée : on applique la mise à jour en toute sécurité.
        $sql = "UPDATE addresses SET
                recipient_first_name = :first_name,
                recipient_last_name  = :last_name,
                street      = :street,
                postal_code = :postal_code,
                city        = :city,
                country     = :country,
                phone       = :phone
            WHERE id = :id AND user_id = :user_id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':first_name' => $data['recipient_first_name'],
            ':last_name'  => $data['recipient_last_name'],
            ':street'     => $data['street'],
            ':postal_code' => $data['postal_code'],
            ':city'       => $data['city'],
            ':country'    => $data['country'] ?? 'France',
            ':phone'      => $data['phone'],
            ':id'         => $id,
            ':user_id'    => $userId,
        ]);

        // L'étape 1 a déjà confirmé l'existence et la propriété : on renvoie
        // systématiquement true ici, sans dépendre du comportement de rowCount().
        return true;
    }
}
