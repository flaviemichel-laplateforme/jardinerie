<?php

namespace App\Controllers;

use App\Services\PaymentService;
use App\Models\CartItemModel;
use App\Models\OrderModel;
use App\Middlewares\AuthMiddleware;

class CheckoutController
{
    public function __construct(
        private PaymentService $paymentService = new PaymentService(),
        private CartItemModel $cartItemModel = new CartItemModel(),
        private OrderModel $orderModel = new OrderModel()
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
            $payload = AuthMiddleware::authenticate();
            $userId = $payload['id'];

            $rawInput = file_get_contents("php://input");
            $data = json_decode($rawInput, true);
            $items = $data['items'] ?? [];

            if (empty($items)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Le panier est vide.'], JSON_UNESCAPED_UNICODE);
                return;
            }

            $cart = $this->cartItemModel->calculateCart($items);

            if ($cart['total'] <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Panier invalide.'], JSON_UNESCAPED_UNICODE);
                return;
            }

            $result = $this->paymentService->createPaymentIntent($cart['total'], $userId, $cart['items']);

            http_response_code(200);
            echo json_encode([
                'status' => 200,
                'data' => [
                    'paymentIntent' => $result,
                    'cart'          => $cart,
                ]
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 500, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * POST /api/webhooks/stripe
     */
    public function handleWebhook(): void
    {
        $payload   = @file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

        try {
            // 1. Vérification cryptographique — seul Stripe peut signer ce payload
            $event = $this->paymentService->verifyWebhookSignature($payload, $sigHeader);

            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent   = $event->data->object;
                $paymentIntentId = $paymentIntent->id;
                $userId          = (int) $paymentIntent->metadata->user_id;
                $itemsJson       = $paymentIntent->metadata->items ?? '[]';

                // 2. Protection idempotence — Stripe peut envoyer le même webhook 2x
                if ($this->orderModel->existsByPaymentIntent($paymentIntentId)) {
                    http_response_code(200);
                    echo json_encode(['status' => 'already_processed']);
                    return;
                }

                // 3. Reconstruction du panier depuis les métadonnées Stripe
                $rawItems = json_decode($itemsJson, true) ?? [];

                // Les clés courtes 'pid'/'qty' ont été utilisées pour rester
                // sous la limite de 500 caractères des métadonnées Stripe
                $items = array_map(fn($i) => [
                    'product_id' => $i['pid'],
                    'quantity'   => $i['qty'],
                ], $rawItems);

                // 4. Recalcul intégral côté serveur (même logique que createIntent)
                $cart = empty($items)
                    ? ['items' => [], 'total' => $paymentIntent->amount / 100]
                    : $this->cartItemModel->calculateCart($items);

                // 5. Création de la commande en base (transaction SQL atomique)
                $this->orderModel->createFromPayment($userId, $cart, $paymentIntentId);
            }

            // Stripe exige une réponse 200 rapide
            http_response_code(200);
            echo json_encode(['status' => 'success']);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
