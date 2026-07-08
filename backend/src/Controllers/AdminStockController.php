<?php

namespace App\Controllers;

use App\Services\ProductService;
use App\Middlewares\AdminMiddleware;

class AdminStockController
{
    public function __construct(
        private ProductService $service = new ProductService()
    ) {}

    /**
     * Point d'entrée pour GET /api/admin/stock/alerts
     */
    public function getAlerts(): void
    {
        // 1. Gestion des entêtes HTTP et des CORS
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        // 2. Sécurité : Vérification du jeton Administrateur
        AdminMiddleware::authenticate();

        // 3. Extraction et nettoyage du paramètre URL (?threshold=X)
        $requestedThreshold = isset($_GET['threshold']) && is_numeric($_GET['threshold'])
            ? (int) $_GET['threshold']
            : null;

        // 4. Appel de la logique métier
        $result = $this->service->getLowStockAlerts($requestedThreshold);

        // 5. Renvoi de la réponse JSON au client
        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
