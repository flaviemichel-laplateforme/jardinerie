<?php

namespace App\Models;

use App\Core\Database;
use App\Core\ShippingPolicy;

class CartItemModel
{
    // Limites d'un panier. 20 lignes de 99 unités : la liste des articles (metadata Stripe, 500 caractères au maximum)
    // reste au-dessous de cette limite, et personne n'achète 100 exemplaires d'un même produit sur un site de particuliers.
    public const MAX_LINES = 20;
    public const MAX_QUANTITY = 99;

    /**
     * Vérifie la FORME d'un panier envoyé par le navigateur et fusionne les doublons (deux lignes du même produit en font une).
     *
     * @return array{lines: array<int,int>|null, error: string|null} lines : [id du produit => quantité]
     */
    public static function normalize(mixed $items): array
    {
        if (!is_array($items) || $items === []) {
            return ['lines' => null, 'error' => 'Le panier est vide.'];
        }

        if (!array_is_list($items) || count($items) > self::MAX_LINES) {
            return ['lines' => null, 'error' => 'Le panier ne peut pas contenir plus de ' . self::MAX_LINES . ' articles différents.'];
        }

        $lines = [];
        foreach ($items as $item) {
            $productId = is_array($item) ? filter_var($item['product_id'] ?? null, FILTER_VALIDATE_INT) : false;
            $quantity  = is_array($item) ? filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT) : false;

            if ($productId === false || $quantity === false || $productId < 1 || $quantity < 1) {
                return ['lines' => null, 'error' => 'Panier invalide.'];
            }

            $lines[$productId] = ($lines[$productId] ?? 0) + $quantity;

            if ($lines[$productId] > self::MAX_QUANTITY) {
                return ['lines' => null, 'error' => 'Quantité maximale : ' . self::MAX_QUANTITY . ' par article.'];
            }
        }

        return ['lines' => $lines, 'error' => null];
    }

    /**
     * Examine un panier d'après la base de données : prix, stock et TVA viennent de la base, JAMAIS du navigateur.
     * Contrairement à un simple calcul, il dit CE QUI NE VA PAS (au lieu de l'ajuster en silence : le client paierait autre chose
     * que ce qu'il croit acheter).
     *
     * @param array<int,int> $lines [id du produit => quantité demandée] (voir normalize())
     * @return array{
     *   items: array<int, array{product_id:int, name:string, unit_price:float, tax_rate:float, quantity:int, requested_quantity:int, stock_quantity:int, line_total:float}>,
     *   total: float, total_cents: int,
     *   problems: array<int, array{product_id:int, reason:string, requested:int, available:int}>
     * } problems : reason = « unavailable » (produit retiré ou inconnu), « out_of_stock » ou « insufficient_stock » (items contient alors
     *   la quantité réellement disponible)
     */
    public function inspect(array $lines): array
    {
        if ($lines === []) {
            return ['items' => [], 'total' => 0.0, 'total_cents' => 0, 'problems' => []];
        }

        $db = Database::getConnection();

        $params = [];
        $placeholders = [];
        foreach (array_keys($lines) as $index => $productId) {
            $placeholders[] = ':id' . $index;
            $params['id' . $index] = (int) $productId;
        }

        $sql = "SELECT p.id, p.name AS product_name, p.price_tax_incl, p.stock_quantity, t.rate AS tax_rate
                FROM products p
                LEFT JOIN taxes t ON p.tax_id = t.id
                WHERE p.id IN (" . implode(',', $placeholders) . ") AND p.is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Indexation par id : accès direct à chaque produit, sans reparcourir la liste à chaque ligne
        $productsById = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $product) {
            $productsById[(int) $product['id']] = $product;
        }

        $items = [];
        $problems = [];
        $totalCents = 0;

        foreach ($lines as $productId => $requested) {
            $productId = (int) $productId;
            $requested = (int) $requested;

            if (!isset($productsById[$productId])) {
                $problems[] = ['product_id' => $productId, 'reason' => 'unavailable', 'requested' => $requested, 'available' => 0];
                continue;
            }

            $product = $productsById[$productId];
            $stock   = max(0, (int) $product['stock_quantity']);

            if ($stock === 0) {
                $problems[] = ['product_id' => $productId, 'reason' => 'out_of_stock', 'requested' => $requested, 'available' => 0];
                continue;
            }

            // Sécurité métier : ne jamais facturer plus que le stock réel. On le signale, on ne le cache pas.
            $quantity = min($requested, $stock);
            if ($quantity < $requested) {
                $problems[] = ['product_id' => $productId, 'reason' => 'insufficient_stock', 'requested' => $requested, 'available' => $stock];
            }

            $unitCents = ShippingPolicy::toCents((float) $product['price_tax_incl']);
            $lineCents = $unitCents * $quantity;

            $items[] = [
                'product_id'         => $productId,
                'name'               => $product['product_name'],
                'unit_price'         => $unitCents / 100,
                'tax_rate'           => (float) $product['tax_rate'],
                'quantity'           => $quantity,
                'requested_quantity' => $requested,
                'stock_quantity'     => $stock,
                'line_total'         => $lineCents / 100,
            ];

            $totalCents += $lineCents;
        }

        return ['items' => $items, 'total' => $totalCents / 100, 'total_cents' => $totalCents, 'problems' => $problems];
    }

    /**
     * Calcul « tolérant » d'un panier (quantités ramenées au stock, produits retirés ignorés). Réservé au webhook Stripe : le client
     * a DÉJÀ payé, on crée la commande avec ce qui est disponible plutôt que de la perdre. Pour un panier qu'on s'apprête à
     * faire payer, utiliser inspect() et refuser en cas de problème.
     *
     * @param array $items Tableau de ['product_id' => int, 'quantity' => int]
     */
    public function calculateCart(array $items): array
    {
        $lines = [];
        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity  = (int) ($item['quantity'] ?? 0);

            if ($productId > 0 && $quantity > 0) {
                $lines[$productId] = ($lines[$productId] ?? 0) + $quantity;
            }
        }

        $cart = $this->inspect($lines);

        return ['items' => $cart['items'], 'total' => $cart['total'], 'total_cents' => $cart['total_cents']];
    }
}
