<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class OrderModel
{
    /**
     * Crée une commande complète en base de données.
     * Utilise une transaction SQL pour garantir l'atomicité :
     * soit tout est inséré (orders + order_items), soit rien ne l'est.
     *
     * @param int    $userId
     * @param array  $cart         Résultat de CartItemModel::calculateCart()
     * @param string $paymentIntentId  Identifiant Stripe (pi_3xxx...)
     */
    public function createFromPayment(int $userId, array $cart, string $paymentIntentId, int $shippingAddressId = 0, int $billingAddressId = 0): int
    {
        $db = Database::getConnection();
        $addressModel = new \App\Models\AddressModel();

        $shippingText = $shippingAddressId ? $addressModel->getAddressText($shippingAddressId) : '';
        $billingText  = $billingAddressId  ? $addressModel->getAddressText($billingAddressId)  : $shippingText;

        $db->beginTransaction();

        try {
            $orderSql = "INSERT INTO orders (
                        user_id,
                        payment_method_id,
                        delivery_method_id,
                        shipping_address_id,
                        billing_address_id,
                        shipping_address_text,
                        billing_address_text,
                        order_reference,
                        total_amount_tax_incl,
                        shipping_cost_tax_incl,
                        status
                     ) VALUES (
                        :user_id,
                        :payment_method_id,
                        :delivery_method_id,
                        :shipping_address_id,
                        :billing_address_id,
                        :shipping_address_text,
                        :billing_address_text,
                        :order_reference,
                        :total,
                        :shipping,
                        'paid'
                     )";

            $orderStmt = $db->prepare($orderSql);
            $orderStmt->execute([
                ':user_id'               => $userId,
                ':payment_method_id'     => 1,    // Carte Bancaire (Stripe)
                ':delivery_method_id'    => 2,    // Colissimo Standard
                ':shipping_address_id'   => $shippingAddressId ?: null,
                ':billing_address_id'    => $billingAddressId ?: null,
                ':shipping_address_text' => $shippingText,
                ':billing_address_text'  => $billingText,
                ':order_reference'       => 'REF-' . strtoupper(substr($paymentIntentId, 3, 12)),
                ':total'                 => $cart['total'],
                ':shipping'              => $cart['total'] >= 50 ? 0.00 : 7.90,
            ]);

            $orderId = (int) $db->lastInsertId();

            $itemSql = "INSERT INTO order_items (order_id, product_id, quantity, unit_price_tax_incl)
                    VALUES (:order_id, :product_id, :quantity, :unit_price)";
            $itemStmt = $db->prepare($itemSql);

            // Décrémentation atomique du stock : le calcul se fait dans la requête SQL
            // (stock_quantity - X) pour éviter toute race condition entre deux commandes
            // concurrentes sur le même produit. GREATEST empêche un stock négatif.
            $stockSql = "UPDATE products SET stock_quantity = GREATEST(stock_quantity - :quantity, 0) WHERE id = :product_id";
            $stockStmt = $db->prepare($stockSql);

            foreach ($cart['items'] as $item) {
                $itemStmt->execute([
                    ':order_id'   => $orderId,
                    ':product_id' => $item['product_id'],
                    ':quantity'   => $item['quantity'],
                    ':unit_price' => $item['unit_price'],
                ]);

                $stockStmt->execute([
                    ':quantity'   => $item['quantity'],
                    ':product_id' => $item['product_id'],
                ]);
            }

            $db->commit();
            return $orderId;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
    /**
     * Vérifie si une commande existe déjà pour ce Payment Intent.
     * Permet d'éviter de créer deux commandes si Stripe envoie le webhook deux fois.
     */
    public function existsByPaymentIntent(string $paymentIntentId): bool
    {
        $db = Database::getConnection();
        $orderRef = 'REF-' . strtoupper(substr($paymentIntentId, 3, 12));

        $sql = "SELECT id FROM orders WHERE order_reference = :ref LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':ref' => $orderRef]);

        return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Liste toutes les commandes d'un utilisateur.
     * Protection IDOR : filtre toujours par user_id.
     */
    public function findByUserId(int $userId): array
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
                    COUNT(oi.id) AS items_count
                FROM orders o
                LEFT JOIN order_items oi ON oi.order_id = o.id
                WHERE o.user_id = :user_id
                GROUP BY o.id
                ORDER BY o.order_date DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère une commande avec ses articles.
     * Protection IDOR : vérifie que la commande appartient à l'utilisateur.
     */
    public function findByIdAndUserId(int $orderId, int $userId): array|false
    {
        $db = Database::getConnection();

        // 1. La commande (avec protection IDOR dans le WHERE)
        $orderSql = "SELECT
                        o.id,
                        o.order_reference,
                        o.order_date,
                        o.total_amount_tax_incl,
                        o.shipping_cost_tax_incl,
                        o.status,
                        o.shipping_address_text,
                        o.billing_address_text,
                        dm.name AS delivery_method,
                        pm.name AS payment_method
                    FROM orders o
                    LEFT JOIN delivery_methods dm ON dm.id = o.delivery_method_id
                    LEFT JOIN payment_methods pm  ON pm.id = o.payment_method_id
                    WHERE o.id = :id AND o.user_id = :user_id
                    LIMIT 1";

        $orderStmt = $db->prepare($orderSql);
        $orderStmt->execute([':id' => $orderId, ':user_id' => $userId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            return false;
        }

        // 2. Les articles de cette commande
        $itemsSql = "SELECT
                        oi.product_id,
                        oi.quantity,
                        oi.unit_price_tax_incl,
                        p.name AS product_name,
                        p.main_image_url
                    FROM order_items oi
                    LEFT JOIN products p ON p.id = oi.product_id
                    WHERE oi.order_id = :order_id";

        $itemsStmt = $db->prepare($itemsSql);
        $itemsStmt->execute([':order_id' => $orderId]);
        $order['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        return $order;
    }

    /**
     * Récupère les doonées agrégées pour le tableau de bord client.
     * Une seule requête plutôt que plusieurs appels séparés.
     */
    public function getDashboardData(int $userId): array
    {
        $db = Database::getConnection();

        //Nombre total de commandeq
        $countSql = "SELECT COUNT(*) FROM orders WHERE user_id = :user_id";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute([':user_id' => $userId]);
        $totalOrders = (int) $countStmt->fetchColumn();

        //dernière commande
        $lastSql = "SELECT
                        id, 
                        order_reference,
                        order_date,
                        total_amount_tax_incl,
                        shipping_cost_tax_incl,
                        status
                    FROM orders
                    WHERE user_id = :user_id
                    ORDER BY order_date DESC
                    LIMIT 1";
        $lastStmt = $db->prepare($lastSql);
        $lastStmt->execute([
            ':user_id' => $userId
        ]);
        $lastOrder = $lastStmt->fetch(\PDO::FETCH_ASSOC);

        return [
            'total_orders' => $totalOrders,
            'last_order' => $lastOrder ?: null,
        ];
    }
}
