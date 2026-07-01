<?php

namespace App\Controllers;

use App\Services\PaymentService;
use App\Models\CartItemModel;
use App\Middlewares\AuthMiddleware;

class CheckoutController
{
    public function __construct(
        private PaymentService $paymentService = new PaymentService(),
        private CartItemModel $cartItemModel = new CartItemModel()
    ) {}

    /**
     * POST /api/checkout/payment-intent
     */
    public function createIntent(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        try {
            // 1. Authentification obligatoire
            $payload = AuthMiddleware::authenticate();
            $userId = $payload['id'];

            // 2. Lecture du panier envoyé par React
            $rawInput = file_get_contents("php://input");
            $data = json_decode($rawInput, true);
            $items = $data['items'] ?? [];

            if (empty($items)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Le panier est vide.'], JSON_UNESCAPED_UNICODE);
                return;
            }

            // 3. RÈGLE D'OR : Recalcul intégral côté serveur
            $cart = $this->cartItemModel->calculateCart($items);

            if ($cart['total'] <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Panier invalide.'], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Appel du service de paiement avec le total VÉRIFIÉ
            $result = $this->paymentService->createPaymentIntent($cart['total'], $userId, $cart['items']);

            http_response_code(200);
            echo json_encode([
                'status' => 200,
                'data' => [
                    'paymentIntent' => $result,
                    'cart' => $cart,
                ]
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
