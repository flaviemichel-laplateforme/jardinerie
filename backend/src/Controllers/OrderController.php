<?php

namespace App\Controllers;

use App\Models\OrderModel;
use App\Middlewares\AuthMiddleware;

class OrderController
{
    public function __construct(
        private OrderModel $orderModel = new OrderModel()
    ) {}

    /**
     * GET /api/me/orders
     */
    public function index(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();
        $orders  = $this->orderModel->findByUserId($payload['id']);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => ["orders" => $orders]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * GET /api/me/orders/{id}
     */
    public function show(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();
        $order   = $this->orderModel->findByIdAndUserId($id, $payload['id']);

        if (!$order) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Commande introuvable."
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => ["order" => $order]
        ], JSON_UNESCAPED_UNICODE);
    }
}
