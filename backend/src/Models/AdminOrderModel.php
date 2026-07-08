<?php

namespace App\Models;

use App\Core\Database;

class AdminOrderModel
{
    /**
     * Compte le nombre total de commandes selon un statut donné.
     * Nécessaire pour calculer le nombre total de pages.
     */
    public function countOrders(?string $status): int
    {
        $db = Database::getConnection();

        $sql = "SELECT COUNT(id) FROM orders";

        // Si un statut spécifique est demandé et qu'il ne s'agit pas du mot-clé virtuel 'all'
        if ($status && $status !== 'all') {
            $sql .= " WHERE status = :status";
            $stmt = $db->prepare($sql);
            $stmt->execute(['status' => $status]);
        } else {
            // Pas de filtre, on compte l'intégralité de la table
            $stmt = $db->query($sql);
        }

        return (int) $stmt->fetchColumn();
    }

    /**
     * Récupère un segment précis (une page) de commandes.
     * @param string|null $status Filtrage par statut
     * @param int $limit Nombre d'éléments à récupérer (LIMIT)
     * @param int $offset Nombre d'éléments à sauter (OFFSET)
     */
    public function getOrdersPaginated(?string $status, int $limit, int $offset): array
    {
        $db = Database::getConnection();

        $sql = "SELECT 
                    id, 
                    order_reference, 
                    total_amount_tax_incl, 
                    status, 
                    order_date
                FROM orders";

        if ($status && $status !== 'all') {
            $sql .= " WHERE status = :status";
        }

        // Critère d'acceptation : Tri par date décroissante (les plus récentes d'abord)
        $sql .= " ORDER BY order_date DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);

        if ($status && $status !== 'all') {
            $stmt->bindValue(':status', $status, \PDO::PARAM_STR);
        }

        // Sécurisation et forçage du type entier pour les clauses restrictives MySQL
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);

        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
