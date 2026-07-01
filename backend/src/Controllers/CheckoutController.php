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

            $result = $this->paymentService->createPaymentIntent(
                $cart['total'],
                $userId,
                $cart['items'],
                (int) ($data['shipping_address_id'] ?? 0),
                (int) ($data['billing_address_id'] ?? 0)
            );

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
            $event = $this->paymentService->verifyWebhookSignature($payload, $sigHeader);

            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent   = $event->data->object;
                $paymentIntentId = $paymentIntent->id;
                $userId          = isset($paymentIntent->metadata->user_id)
                    ? (int) $paymentIntent->metadata->user_id
                    : null;
                $itemsJson       = $paymentIntent->metadata->items ?? '[]';
                $shippingId      = (int) ($paymentIntent->metadata->shipping_address_id ?? 0);
                $billingId       = (int) ($paymentIntent->metadata->billing_address_id ?? 0);

                if (!$userId) {
                    http_response_code(200);
                    echo json_encode(['status' => 'skipped_no_metadata']);
                    return;
                }

                if ($this->orderModel->existsByPaymentIntent($paymentIntentId)) {
                    http_response_code(200);
                    echo json_encode(['status' => 'already_processed']);
                    return;
                }

                $rawItems = json_decode($itemsJson, true) ?? [];
                $items = array_map(fn($i) => [
                    'product_id' => $i['pid'],
                    'quantity'   => $i['qty'],
                ], $rawItems);

                $cart = empty($items)
                    ? ['items' => [], 'total' => $paymentIntent->amount / 100]
                    : $this->cartItemModel->calculateCart($items);

                $this->orderModel->createFromPayment($userId, $cart, $paymentIntentId, $shippingId, $billingId);
            }

            http_response_code(200);
            echo json_encode(['status' => 'success']);
        } catch (\Exception $e) {
            error_log("WEBHOOK ERROR: " . $e->getMessage() . " | " . $e->getTraceAsString());
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
