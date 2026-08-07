<?php

namespace App\Models;

use App\Core\Database;


class CartItemModel
{
    /**
     * Recalcule un panier à partir des SEULS product_id et quantités envoyés
     * par le client. Tous les prix et stocks proviennent exclusivement de la
     * base de données — jamais du front-end.
     *
     * @param array $items Tableau de ['product_id' => int, 'quantity' => int]
     */
    public function calculateCart(array $items): array
    {
        if (empty($items)) {
            return ['items' => [], 'total' => 0.0];
        }

        $db = Database::getConnection();

        // Construction dynamique d'un IN (:id0, :id1, ...) — même technique
        // que le filtre par catégories dans ProductModel::findWithFilters().
        $ids = array_column($items, 'product_id');
        $placeholders = [];
        $params = [];
        foreach ($ids as $index => $id) {
            $paramName = 'id' . $index;
            $placeholders[] = ':' . $paramName;
            $params[$paramName] = (int) $id;
        }

        $sql = "SELECT p.id, p.name AS product_name, p.price_tax_incl, p.stock_quantity, t.rate AS tax_rate
                FROM products p
                LEFT JOIN taxes t ON p.tax_id = t.id
                WHERE p.id IN (" . implode(',', $placeholders) . ") AND p.is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Indexation par id : transforme la liste en "dictionnaire" pour un
        // accès direct, plutôt que de reparcourir le tableau à chaque article.
        $productsById = [];
        foreach ($products as $product) {
            $productsById[$product['id']] = $product;
        }

        $cartItems = [];
        $total = 0.0;

        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $quantity = (int) $item['quantity'];

            if (!isset($productsById[$productId])) {
                continue; // produit inexistant ou désactivé : ignoré
            }

            $product = $productsById[$productId];

            // Sécurité métier : ne jamais facturer plus que le stock réel disponible.
            $safeQuantity = min($quantity, (int) $product['stock_quantity']);

            $lineTotal = $product['price_tax_incl'] * $safeQuantity;

            $cartItems[] = [
                'product_id' => $productId,
                'name'       => $product['product_name'],
                'unit_price' => (float) $product['price_tax_incl'],
                'tax_rate'   => (float) $product['tax_rate'],
                'quantity'   => $safeQuantity,
                'line_total' => round($lineTotal, 2),
            ];

            $total += $lineTotal;
        }

        return [
            'items' => $cartItems,
            'total' => round($total, 2),
        ];
    }
}
