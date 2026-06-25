<?php

namespace App\Controllers;

use App\Services\FilterService;

class FilterController
{
    public function __construct(
        private FilterService $filterService = new FilterService()
    ) {}

    public function index(): void
    {
        header('content-type: application/json; charset=utf-8');

        // 1. On récupère le paramètre type depuis l'URL de React (ex: ?type=vegetaux)
        $type = $_GET['type'] ?? null;

        // 2. On interroge le service avec ce filtre
        $result = $this->filterService->getFiltersConfiguration($type);

        // 3. En cas d'erreur serveur ou SQL
        if (!$result['success']) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'status' => 500,
                'error' => $result['message']
            ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            return;
        }

        // 4. En cas de succès parfait
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'status' => 200,
            'data' => $result["data"]
        ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
}
