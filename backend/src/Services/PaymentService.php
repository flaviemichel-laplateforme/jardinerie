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
        // La chaîne de récupération ultime (Cherche dans les 3 emplacements possibles de PHP)
        $stripeKey = $_ENV['STRIPE_SECRET_KEY'] ?? $_SERVER['STRIPE_SECRET_KEY'] ?? getenv('STRIPE_SECRET_KEY') ?: null;

        if (!$stripeKey) {
            throw new \Exception("Clé Stripe introuvable dans le backend. Vérifiez le fichier backend/.env !");
        }

        Stripe::setApiKey($stripeKey);
    }

    /**
     * Crée une intention de paiement avec Idempotence
     */
    public function createPaymentIntent(int $cartId, float $totalAmount, int $userId): array
    {
        // Stripe attend des centimes (ex: 15.50€ -> 1550)
        $amountInCents = (int) round($totalAmount * 100);

        // CRITÈRE 2 : L'IDEMPOTENCE
        // On crée une clé unique basée sur le Panier et le Montant
        $idempotencyKey = "pi_cart_{$cartId}_amount_{$amountInCents}";

        $paymentIntent = PaymentIntent::create([
            'amount' => $amountInCents,
            'currency' => 'eur',
            'metadata' => [
                'cart_id' => $cartId,
                'user_id' => $userId
            ]
        ], [
            'idempotency_key' => $idempotencyKey // Stripe garantit le non-double paiement grâce à ceci
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
