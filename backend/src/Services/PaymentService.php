<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class PaymentService
{
    public function __construct()
    {
        // On initialise la clé secrète de Stripe (stockée dans votre .env)
        Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY'] ?? '');
    }

    /**
     * Crée une intention de paiement avec Idempotence.
     *
     * @param int $amountInCents Montant À DÉBITER, livraison comprise (voir ShippingPolicy)
     * @param int $lastOrderId   Dernière commande du client : une fois un achat passé, le même panier le même jour doit créer un
     *                           NOUVEAU paiement. Sans cela, la clé d'idempotence (valable 24 h chez Stripe) rendrait le paiement
     *                           déjà réussi, et le client ne pourrait plus payer.
     */
    public function createPaymentIntent(int $amountInCents, int $userId, array $cartItems = [], int $shippingAddressId = 0, int $billingAddressId = 0, int $lastOrderId = 0): array
    {
        $cartHash = md5(json_encode($cartItems));
        // « v2 » : les paramètres de l'intention ont changé (carte seulement) ; Stripe refuse de réutiliser une clé d'idempotence avec
        // d'autres paramètres, et une intention créée la veille avec l'ancienne clé ferait échouer le paiement d'un client qui revient.
        $idempotencyKey = "pi_v2_user_{$userId}_amount_{$amountInCents}_{$cartHash}_{$shippingAddressId}_{$billingAddressId}_after_{$lastOrderId}";

        $paymentIntent = PaymentIntent::create([
            'amount'   => $amountInCents,
            'currency' => 'eur',
            // Carte bancaire UNIQUEMENT : la commande est enregistrée avec le moyen de paiement « carte », et les moyens différés
            // (Klarna, Bancontact, virement...) renvoient un statut « en cours » que le tunnel ne sait pas encore traiter.
            // Sans cette ligne, Stripe propose tous les moyens activés sur le compte (PayPal, Klarna, Amazon Pay...).
            'payment_method_types' => ['card'],
            'metadata' => [
                'cart_hash' => $cartHash,
                'user_id'   => $userId,
                'shipping_address_id' => $shippingAddressId,
                'billing_address_id'  => $billingAddressId,
                'items'     => json_encode(array_map(fn($i) => [
                    'pid' => $i['product_id'],
                    'qty' => $i['quantity']
                ], $cartItems)),
            ]
        ], [
            'idempotency_key' => $idempotencyKey
        ]);

        return [
            'clientSecret' => $paymentIntent->client_secret
        ];
    }

    /** Relit un paiement chez Stripe (page de confirmation : on ne croit pas ce que dit l'adresse de la page). */
    public function retrievePaymentIntent(string $paymentIntentId): PaymentIntent
    {
        return PaymentIntent::retrieve($paymentIntentId);
    }

    /**
     * CRITÈRE 1 : Vérifie la signature du Webhook
     */
    public function verifyWebhookSignature(string $payload, string $sigHeader): \Stripe\Event
    {
        $endpointSecret = $_ENV['STRIPE_WEBHOOK_SECRET'];

        try {
            // Cette méthode officielle lève une exception si la signature est fausse
            return Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
        } catch (\UnexpectedValueException $e) {
            throw new \Exception("Payload invalide");
        } catch (SignatureVerificationException $e) {
            throw new \Exception("Signature Stripe invalide (Tentative de fraude)");
        }
    }
}
