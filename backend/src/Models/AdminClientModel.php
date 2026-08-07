<?php

namespace App\Models;

use App\Core\Database;

class AdminClientModel
{
    /**
     * Compte le nombre de clients correspondant à la recherche et au filtre de rôle.
     */
    public function countClients(?string $search, ?string $role): int
    {
        $db = Database::getConnection();

        $sql = "SELECT COUNT(id) FROM users WHERE 1=1";
        $params = [];

        if ($search) {
            $sql .= " AND (first_name LIKE :search_1 OR last_name LIKE :search_2 OR email LIKE :search_3)";
            $like = "%$search%";
            $params['search_1'] = $like;
            $params['search_2'] = $like;
            $params['search_3'] = $like;
        }

        if ($role && $role !== 'tous') {
            $sql .= " AND role = :role";
            $params['role'] = $role;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Récupère une page de clients, avec le nombre total de commandes de chacun.
     */
    public function getClientsPaginated(?string $search, ?string $role, int $limit, int $offset): array
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    u.id, u.first_name, u.last_name, u.email, u.role, u.registration_date,
                    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS total_orders
                FROM users u
                WHERE 1=1";
        $params = [];

        if ($search) {
            $sql .= " AND (u.first_name LIKE :search_1 OR u.last_name LIKE :search_2 OR u.email LIKE :search_3)";
            $like = "%$search%";
            $params['search_1'] = $like;
            $params['search_2'] = $like;
            $params['search_3'] = $like;
        }

        if ($role && $role !== 'tous') {
            $sql .= " AND u.role = :role";
            $params['role'] = $role;
        }

        $sql .= " ORDER BY u.registration_date DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue('limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Récupère l'identité de base d'un client (pour la modale de détail).
     */
    public function getById(int $id): ?array
    {
        $db = Database::getConnection();

        $sql = "SELECT id, first_name, last_name, email, role, registration_date
                FROM users WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    /**
     * Compte le nombre total d'administrateurs (protection du dernier admin).
     */
    public function countAdmins(): int
    {
        $db = Database::getConnection();

        $sql = "SELECT COUNT(id) FROM users WHERE role = 'admin'";
        $stmt = $db->query($sql);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Modifie le rôle d'un utilisateur.
     */
    public function updateRole(int $id, string $role): bool
    {
        $db = Database::getConnection();

        $sql = "UPDATE users SET role = :role WHERE id = :id";
        $stmt = $db->prepare($sql);

        return $stmt->execute(['role' => $role, 'id' => $id]);
    }
}
