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
        Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);
    }

    /**
     * Crée une intention de paiement avec Idempotence
     */
    public function createPaymentIntent(float $totalAmount, int $userId, array $cartItems = []): array
    {
        $amountInCents = (int) round($totalAmount * 100);

        $cartHash = md5(json_encode($cartItems));
        $idempotencyKey = "pi_user_{$userId}_amount_{$amountInCents}_{$cartHash}";

        $paymentIntent = PaymentIntent::create([
            'amount'   => $amountInCents,
            'currency' => 'eur',
            'metadata' => [
                'cart_hash' => $cartHash,
                'user_id'   => $userId,
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
