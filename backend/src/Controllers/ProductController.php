<?php

namespace App\Controllers;

use App\Services\ProductService;

class ProductController
{

    public function __construct(
        private ProductService $productService = new ProductService()
    ) {}

    /**
     * Endpoint : GET /api/products
     */
    public function index(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // 1. Extraction et nettoyage des filtres potentiels (ex: ?search=orchidée)
        $filters = [];
        if (isset($_GET['search']) && trim($_GET['search']) !== '') {
            $filters['search'] = htmlspecialchars(trim($_GET['search']));
        }

        // 2. Appel au service
        $result = $this->productService->getCatalog($filters);

        // 3. Gestion de l'échec (intercepté et géré par le Service)
        if (!$result['success']) {
            http_response_code(500); // 500 = Internal Server Error
            echo json_encode([
                'status' => 500,
                'error' => $result['message']
            ], JSON_UNESCAPED_UNICODE);
            return; // On stoppe l'exécution ici
        }

        // 4. Gestion du succès
        $products = $result['data'] ?? [];

        http_response_code(200); // 200 = OK
        echo json_encode([
            'status' => 200,
            'results' => count($products),
            'data' => $products
        ], JSON_UNESCAPED_UNICODE);
        return;
    }
}
