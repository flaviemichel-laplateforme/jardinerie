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

        // 1. Extraction et nettoyage rigoureux des filtres
        $filters = [];

        // Filtre de recherche textuelle
        if (isset($_GET['search']) && trim($_GET['search']) !== '') {
            $filters['search'] = htmlspecialchars(trim($_GET['search']));
        }

        // Filtre par catégories (ex: "1,2,4")
        if (isset($_GET['categories']) && trim($_GET['categories']) !== '') {
            $filters['categories'] = htmlspecialchars(trim($_GET['categories']));
        }

        // Filtre par exposition (ex: "Sun,Partial Shade")
        if (isset($_GET['expositions']) && trim($_GET['expositions']) !== '') {
            $filters['expositions'] = htmlspecialchars(trim($_GET['expositions']));
        }
        // Filtre par exposition (ex: "Sun,Partial Shade")
        if (isset($_GET['water']) && trim($_GET['water']) !== '') {
            $filters['water'] = htmlspecialchars(trim($_GET['water']));
        }
        // Filtre par critères (ex: "id 2: Facile d'entretien, id 3 : Animaux-friendly (Non toxique) ")
        if (isset($_GET['criteria']) && trim($_GET['criteria']) !== '') {
            $filters['criteria'] = htmlspecialchars(trim($_GET['criteria']));
        }

        //Filtre par Prix minimun
        // On utilise is_numeric pour s'assurer qu'on reçoit bien un chiffre)
        if (isset($_GET['price_min']) && is_numeric($_GET['price_min'])) {
            // On force le typage en nombre à virgule flottante (float) par sécurité
            $filters['price_min'] = (float) $_GET['price_min'];
        }

        //Filtre par Prix maximum
        // On utilise is_numeric pour s'assurer qu'on reçoit bien un chiffre)
        if (isset($_GET['price_max']) && is_numeric($_GET['price_max'])) {
            // On force le typage en nombre à virgule flottante (float) par sécurité
            $filters['price_max'] = (float) $_GET['price_max'];
        }




        // 2. Appel à la couche métier (Service)
        $result = $this->productService->getCatalog($filters);

        // 3. Gestion de l'échec (intercepté et géré par le Service)
        if (!$result['success']) {
            http_response_code(500); // 500 = Internal Server Error
            echo json_encode([
                'status' => 500,
                'error' => $result['message']
            ], JSON_UNESCAPED_UNICODE);
            return;
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

    /**
     * Endpoint : GET /api/products/{id}
     */
    public function show(int $id): void
    {
        header('content-type: application/json; charset utf-8');

        // On appelle le service
        $result = $this->productService->getProductDetails($id);

        //On applique le code HTTP décidé par le service
        $code = $result['code'] ?? 500;
        http_response_code($code);

        // On formate la réponse JSON selon le statut
        if (!$result['success']) {
            echo json_encode([
                'status' => $code,
                'error' => $result['message']
            ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            return;
        }

        echo json_encode([
            'status' => $code,
            'data' => $result['data']
        ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Endpoint : GET /api/products/{id}
     */
    public function checkAvailability(int $id): void
    {
        header('Content-type: application/json; charset=utf-8');

        $response = $this->productService->checkAvailability($id);

        http_response_code($response['code']);

        unset($response['code']);

        echo json_encode($response);
    }
}
