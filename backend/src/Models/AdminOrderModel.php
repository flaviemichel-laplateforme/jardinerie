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
                    o.id,
                    o.order_reference,
                    o.total_amount_tax_incl,
                    o.status,
                    o.order_date,
                    u.first_name AS customer_first_name,
                    u.last_name  AS customer_last_name
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id";

        if ($status && $status !== 'all') {
            $sql .= " WHERE o.status = :status";
        }

        // Critère d'acceptation : Tri par date décroissante (les plus récentes d'abord)
        $sql .= " ORDER BY o.order_date DESC LIMIT :limit OFFSET :offset";

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

    /**
     * Vérifie qu'une commande existe et récupère son statut actuel
     */
    public function findById(int $id): array
    {
        $db = Database::getConnection();

        $sql = "SELECT 
                    id,
                    order_reference,
                    status
                    FROM orders
                    WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $order = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $order ?: null;
    }

    /**
     * Met à jour le statut d'une commande
     */
    public function updateStatus(int $id, string $status): bool
    {
        $db = Database::getConnection();

        $sql = "UPDATE orders SET status = :status WHERE id = :id";

        $stmt = $db->prepare($sql);

        return $stmt->execute(['status' => $status, 'id' => $id]);
    }

    /**
     * Récupère le détail complet d'une commande (infos client, adresse, méthodes).
     */
    public function getById(int $id): ?array
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    o.id,
                    o.order_reference,
                    o.order_date,
                    o.total_amount_tax_incl,
                    o.shipping_cost_tax_incl,
                    o.status,
                    o.shipping_address_text,
                    o.billing_address_text,
                    dm.name AS delivery_method,
                    pm.name AS payment_method,
                    u.first_name AS customer_first_name,
                    u.last_name  AS customer_last_name,
                    u.email      AS customer_email
                FROM orders o
                LEFT JOIN delivery_methods dm ON dm.id = o.delivery_method_id
                LEFT JOIN payment_methods pm  ON pm.id = o.payment_method_id
                LEFT JOIN users u             ON u.id = o.user_id
                WHERE o.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $order = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $order ?: null;
    }

    /**
     * Récupère les articles d'une commande.
     */
    public function getItemsByOrderId(int $orderId): array
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    oi.product_id,
                    oi.quantity,
                    oi.unit_price_tax_incl,
                    p.name AS product_name,
                    p.main_image_url
                FROM order_items oi
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = :order_id";

        $stmt = $db->prepare($sql);
        $stmt->execute(['order_id' => $orderId]);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
