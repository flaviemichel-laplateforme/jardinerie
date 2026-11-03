<?php

namespace App\Services;

use App\Core\Database;
use App\Core\DateFilter;
use App\Core\ProductPolicy;
use App\Core\SecurityLog;
use App\Models\StockMovementModel;

/**
 * Ajustements de stock par un administrateur, et historique des mouvements.
 *
 *  restock   : réception de marchandise, quantité AJOUTÉE (1 à 9 999)
 *  loss      : casse, perte, quantité RETIRÉE (1 à 9 999) ; refusée si le stock deviendrait négatif
 *  inventory : comptage, le stock est FIXÉ à la quantité donnée (0 à 9 999) ; l'écart est enregistré
 *
 * Résultat : ['success', 'code', 'message', 'data'?].
 */
class AdminStockService
{
    public const ADJUSTMENT_TYPES = ['restock', 'loss', 'inventory'];
    public const NOTE_MAX_LENGTH = 255;

    private const DEFAULT_LIMIT = 50;
    private const MAX_LIMIT = 200;

    public function __construct(
        private StockMovementModel $movements = new StockMovementModel()
    ) {}

    public function adjust(int $productId, mixed $type, mixed $quantity, mixed $note, int $adminId): array
    {
        if (!is_string($type) || !in_array($type, self::ADJUSTMENT_TYPES, true)) {
            return $this->fail(400, 'Type d\'ajustement invalide. Valeurs autorisées : ' . implode(', ', self::ADJUSTMENT_TYPES) . '.');
        }

        $min = $type === 'inventory' ? 0 : 1;
        $amount = is_bool($quantity) ? false : filter_var($quantity, FILTER_VALIDATE_INT);
        if ($amount === false || $amount < $min || $amount > ProductPolicy::STOCK_MAX) {
            return $this->fail(400, "La quantité doit être un nombre entier compris entre $min et " . ProductPolicy::STOCK_MAX . '.');
        }

        if ($note !== null && !is_string($note)) {
            return $this->fail(400, 'La note doit être du texte.');
        }
        $note = $note === null || trim($note) === '' ? null : trim($note);
        if ($note !== null && mb_strlen($note) > self::NOTE_MAX_LENGTH) {
            return $this->fail(400, 'La note ne peut pas dépasser ' . self::NOTE_MAX_LENGTH . ' caractères.');
        }

        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            // Ligne du produit verrouillée : un ajustement simultané attend la fin de celui-ci, puis part du stock à jour
            $current = $this->movements->lockStock($db, $productId);
            if ($current === null) {
                $db->rollBack();
                return $this->fail(404, 'Produit introuvable.');
            }

            $after = match ($type) {
                'restock'   => $current + $amount,
                'loss'      => $current - $amount,
                'inventory' => $amount,
            };

            if ($after < 0) {
                $db->rollBack();
                return $this->fail(409, "Stock insuffisant : il reste $current article(s), impossible d'en retirer $amount.", ['stock_quantity' => $current]);
            }
            if ($after > ProductPolicy::STOCK_MAX) {
                $db->rollBack();
                return $this->fail(409, 'Le stock ne peut pas dépasser ' . ProductPolicy::STOCK_MAX . " (actuellement $current).", ['stock_quantity' => $current]);
            }

            $db->prepare('UPDATE products SET stock_quantity = :stock WHERE id = :id')->execute([':stock' => $after, ':id' => $productId]);
            $movementId = $this->movements->record($db, $productId, $type, $after - $current, $after, $adminId, $note);

            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }

        SecurityLog::record(SecurityLog::STOCK_ADJUSTED, $adminId, null, [
            'product_id' => $productId, 'type' => $type, 'quantity' => $after - $current, 'stock_after' => $after,
        ]);

        return [
            'success' => true,
            'code'    => 200,
            'message' => 'Stock mis à jour.',
            'data'    => ['stock_quantity' => $after, 'movement' => $this->movements->find($movementId)],
        ];
    }

    /** @param array<string, mixed> $query paramètres de l'URL : product_id, type, from, to, page, limit */
    public function movements(array $query): array
    {
        $filters = [];

        $productId = $query['product_id'] ?? null;
        if (is_string($productId) && $productId !== '') {
            if (!ProductPolicy::isPositiveId($productId)) {
                return $this->fail(400, 'Filtre « product_id » invalide.');
            }
            $filters['product_id'] = (int) $productId;
        }

        $type = $query['type'] ?? null;
        if (is_string($type) && $type !== '') {
            if (!in_array($type, StockMovementModel::TYPES, true)) {
                return $this->fail(400, 'Filtre « type » invalide.');
            }
            $filters['type'] = $type;
        }

        $dates = DateFilter::fromQuery($query);
        if ($dates['error'] !== null) {
            return $this->fail(400, $dates['error']);
        }
        $filters += $dates['filters'];

        $page   = max(1, (int) ($query['page'] ?? 1));
        $limit  = max(1, min(self::MAX_LIMIT, (int) ($query['limit'] ?? self::DEFAULT_LIMIT)));
        $total  = $this->movements->count($filters);
        $pages  = $total > 0 ? (int) ceil($total / $limit) : 1;

        return [
            'success' => true,
            'code'    => 200,
            'data'    => [
                'items'      => $this->movements->list($filters, $limit, ($page - 1) * $limit),
                'pagination' => [
                    'current_page' => $page,
                    'per_page'     => $limit,
                    'total_items'  => $total,
                    'total_pages'  => $pages,
                    'has_next'     => $page < $pages,
                    'has_prev'     => $page > 1,
                ],
            ],
        ];
    }

    private function fail(int $code, string $message, ?array $data = null): array
    {
        return array_filter(['success' => false, 'code' => $code, 'message' => $message, 'data' => $data], fn($value) => $value !== null);
    }
}
