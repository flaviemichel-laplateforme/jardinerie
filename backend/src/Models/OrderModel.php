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

            foreach ($cart['items'] as $item) {
                $itemStmt->execute([
                    ':order_id'   => $orderId,
                    ':product_id' => $item['product_id'],
                    ':quantity'   => $item['quantity'],
                    ':unit_price' => $item['unit_price'],
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
}
