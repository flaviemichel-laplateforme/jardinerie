<?php

namespace App\Controllers;

use App\Services\AdminOrderService;
use App\Middlewares\AdminMiddleware;

class AdminOrderController
{
    public function __construct(
        private AdminOrderService $service = new AdminOrderService()
    ) {}

    /**
     * Point de terminaison : GET /api/admin/orders
     */
    public function index(): void
    {
        // 2. Barrière de sécurité : L'utilisateur connecté possède-t-il le rôle 'admin' ?
        AdminMiddleware::authenticate();

        // 3. Extraction et conversion (cast) des variables d'URL
        $status = $_GET['status'] ?? 'all';
        $page   = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit  = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

        // 4. Appel de la logique métier du service
        $result = $this->service->getOrders($status, $page, $limit);

        // 5. Expédition de la réponse HTTP
        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point de terminaison : PATCH /api/admin/orders/{id}/status
     */
    public function updateStatus(int $id): void
    {
        AdminMiddleware::authenticate();

        // Lecture du corps de la requête PATCH (ex: {"status": "shipped"})
        $data   = json_decode(file_get_contents("php://input"), true);
        $status = $data['status'] ?? null;

        $result = $this->service->updateStatus($id, $status);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point de terminaison : GET /api/admin/orders/{id}
     */
    public function show(int $id): void
    {
        AdminMiddleware::authenticate();

        $result = $this->service->getOrderDetails($id);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
