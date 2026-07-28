<?php

namespace App\Controllers;

use App\Services\AdminKpiService;
use App\Middlewares\AdminMiddleware;

class AdminKpiController
{
    public function __construct(
        private AdminKpiService $service = new AdminKpiService()
    ) {}

    /**
     * Poit d'entrée pour GET /api/admin/kpis/sales
     */
    public function sales(): void
    {
        // Sécurisation (Le visiteur est-il bien Admin ?)
        AdminMiddleware::authenticate();

        // Extraction des paramètres URL
        $range = $_GET['range'] ?? null;

        // Appel à la logique métier
        $result = $this->service->getSalesData($range);

        // Renvoi la réponse formatée
        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
