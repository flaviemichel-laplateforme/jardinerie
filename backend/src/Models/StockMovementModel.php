<?php

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Historique du stock : une ligne par changement (vente, réception, perte, inventaire), avec la variation signée,
 * le stock obtenu, l'auteur (administrateur) ou la commande à l'origine.
 *
 * Les écritures se font DANS la transaction de l'opération qui change le stock, après avoir verrouillé la ligne du produit
 * (lockStock) : deux opérations simultanées sur le même produit s'appliquent l'une après l'autre, sans perte.
 */
class StockMovementModel
{
    public const TYPES = ['sale', 'restock', 'loss', 'inventory'];

    /** Stock actuel du produit, ligne verrouillée jusqu'à la fin de la transaction ; null si le produit n'existe pas. */
    public function lockStock(PDO $db, int $productId): ?int
    {
        $stmt = $db->prepare('SELECT stock_quantity FROM products WHERE id = :id FOR UPDATE');
        $stmt->execute([':id' => $productId]);
        $stock = $stmt->fetchColumn();

        return $stock === false ? null : (int) $stock;
    }

    public function record(PDO $db, int $productId, string $type, int $delta, int $stockAfter, ?int $userId = null, ?string $note = null, ?int $orderId = null): int
    {
        $db->prepare(
            'INSERT INTO stock_movements (product_id, quantity, movement_type, stock_after, user_id, order_id, note)
             VALUES (:product_id, :quantity, :type, :stock_after, :user_id, :order_id, :note)'
        )->execute([
            ':product_id'  => $productId,
            ':quantity'    => $delta,
            ':type'        => $type,
            ':stock_after' => $stockAfter,
            ':user_id'     => $userId,
            ':order_id'    => $orderId,
            ':note'        => $note,
        ]);

        return (int) $db->lastInsertId();
    }

    /** @return array<string, mixed>|null mouvement avec le produit, l'auteur et la commande */
    public function find(int $id): ?array
    {
        $rows = $this->select('WHERE m.id = :id', [':id' => $id], 1, 0);

        return $rows[0] ?? null;
    }

    /**
     * @param array{product_id?:int, type?:string, from?:string, to?:string} $filters
     * @return list<array<string, mixed>> du plus récent au plus ancien
     */
    public function list(array $filters, int $limit, int $offset): array
    {
        [$where, $params] = $this->where($filters);

        return $this->select($where, $params, $limit, $offset);
    }

    public function count(array $filters): int
    {
        [$where, $params] = $this->where($filters);
        $stmt = Database::getConnection()->prepare("SELECT COUNT(*) FROM stock_movements m $where");
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /** @return array{0:string, 1:array<string, mixed>} */
    private function where(array $filters): array
    {
        $conditions = [];
        $params     = [];

        if (isset($filters['product_id'])) {
            $conditions[] = 'm.product_id = :product_id';
            $params[':product_id'] = $filters['product_id'];
        }
        if (isset($filters['type'])) {
            $conditions[] = 'm.movement_type = :type';
            $params[':type'] = $filters['type'];
        }
        if (isset($filters['from'])) {
            $conditions[] = 'm.movement_date >= :from';
            $params[':from'] = $filters['from'];
        }
        if (isset($filters['to'])) {
            $conditions[] = 'm.movement_date <= :to';
            $params[':to'] = $filters['to'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    private function select(string $where, array $params, int $limit, int $offset): array
    {
        $stmt = Database::getConnection()->prepare(
            "SELECT m.id, m.product_id, p.name AS product_name, p.sku, m.movement_type AS type, m.quantity, m.stock_after,
                    m.note, m.movement_date AS created_at, m.order_id, o.order_reference,
                    m.user_id, u.first_name AS user_first_name, u.last_name AS user_last_name
             FROM stock_movements m
             INNER JOIN products p ON p.id = m.product_id
             LEFT JOIN users u     ON u.id = m.user_id
             LEFT JOIN orders o    ON o.id = m.order_id
             $where
             ORDER BY m.id DESC
             LIMIT :limit OFFSET :offset"
        );
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(fn(array $row) => [
            ...$row,
            'id'          => (int) $row['id'],
            'product_id'  => (int) $row['product_id'],
            'quantity'    => (int) $row['quantity'],
            'stock_after' => $row['stock_after'] === null ? null : (int) $row['stock_after'],
            'order_id'    => $row['order_id'] === null ? null : (int) $row['order_id'],
            'user_id'     => $row['user_id'] === null ? null : (int) $row['user_id'],
        ], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}
