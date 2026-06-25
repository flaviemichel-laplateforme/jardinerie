<?php

namespace App\Controllers;

use App\Services\PaymentService;
// use App\Services\CartService; // (Supposé)
// use App\Services\OrderService; // (Supposé)

class CheckoutController
{
    public function __construct(
        private PaymentService $paymentService = new PaymentService()
        // private CartService $cartService = new CartService(),
        // private OrderService $orderService = new OrderService()
    ) {}

    /**
     * POST /api/checkout/payment-intent
     */
    public function createIntent(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            // 1. Récupérer l'utilisateur (via session ou JWT)
            $userId = $_SESSION['user_id'] ?? 1; // Exemple

            // 2. RÈGLE D'OR : Recalculer le total CÔTÉ SERVEUR !
            // Ne faites jamais confiance au montant envoyé par le front-end.
            // $cart = $this->cartService->getCartByUserId($userId);
            $cartId = 123; // Exemple
            $totalAmount = 45.90; // Exemple recalculé en BDD

            // 3. Appel du service de paiement
            $result = $this->paymentService->createPaymentIntent($cartId, $totalAmount, $userId);

            http_response_code(200);
            echo json_encode([
                'status' => 200,
                'data' => $result
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 500,
                'error' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * POST /api/webhooks/stripe
     */
    public function handleWebhook(): void
    {
        // Les webhooks n'ont pas besoin d'être au format classique
        $payload = @file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

        try {
            // 1. Vérification de la signature (Le garde du corps)
            $event = $this->paymentService->verifyWebhookSignature($payload, $sigHeader);

            // 2. Traitement de l'événement sécurisé
            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent = $event->data->object;

                $cartId = $paymentIntent->metadata->cart_id;
                $stripePaymentId = $paymentIntent->id; // Ex: pi_3O...

                // 3. Créer la commande en BDD et marquer comme payée
                // $this->orderService->createPaidOrder($cartId, $stripePaymentId);
            }

            // Stripe exige une réponse rapide (Code 200) pour savoir qu'on a bien reçu l'info
            http_response_code(200);
            echo json_encode(['status' => 'success']);
        } catch (\Exception $e) {
            // Si la signature est fausse, on renvoie une erreur 400
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
