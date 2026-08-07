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
