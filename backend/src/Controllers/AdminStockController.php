<?php

namespace App\Controllers;

use App\Services\AdminStockService;
use App\Services\ProductService;
use App\Middlewares\AdminMiddleware;

class AdminStockController
{
    public function __construct(
        private ProductService $service = new ProductService(),
        private AdminStockService $stock = new AdminStockService()
    ) {}

    /**
     * Point d'entrée pour GET /api/admin/stock/alerts
     */
    public function getAlerts(): void
    {
        // 2. Sécurité : Vérification du jeton Administrateur
        AdminMiddleware::authenticate();

        // 3. Extraction et nettoyage du paramètre URL (?threshold=X)
        $requestedThreshold = isset($_GET['threshold']) && is_numeric($_GET['threshold'])
            ? (int) $_GET['threshold']
            : null;

        // 4. Appel de la logique métier
        $result = $this->service->getLowStockAlerts($requestedThreshold);

        // 5. Renvoi de la réponse JSON au client
        $this->respond($result);
    }

    /**
     * POST /api/admin/products/{id}/stock  {type: restock|loss|inventory, quantity, note?}
     */
    public function adjust(int $id): void
    {
        $payload = AdminMiddleware::authenticate();

        $data = json_decode(file_get_contents('php://input'), true);
        $data = is_array($data) ? $data : [];

        $this->respond($this->stock->adjust($id, $data['type'] ?? null, $data['quantity'] ?? null, $data['note'] ?? null, (int) $payload['id']));
    }

    /**
     * GET /api/admin/stock/movements  (filtres product_id, type, from, to ; pagination page, limit)
     */
    public function movements(): void
    {
        AdminMiddleware::authenticate();

        $this->respond($this->stock->movements($_GET));
    }

    private function respond(array $result): void
    {
        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
