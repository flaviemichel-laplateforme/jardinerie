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

        $result = $this->filterService->getFiltersConfiguration();

        if (!$result['success']) {
            http_response_code(500);
            echo json_encode([
                'status' => 500,
                'error' => $result['message']
            ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        }

        echo json_encode([
            'status' => 200,
            'data' => $result["data"]
        ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
}
