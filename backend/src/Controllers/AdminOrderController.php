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
        // 1. En-têtes HTTP de base pour le format JSON
        header("Content-Type: application/json; charset=UTF-8");

        // Gestion sécurisée des requêtes de pré-vérification CORS (OPTIONS)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

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
}
