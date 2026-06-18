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
        // Filtre par critères (ex: "id 2: Facile d'entretien, id 3 : Animaux-friendly (Non toxique) ")
        if (isset($_GET['criteria']) && trim($_GET['criteria']) !== '') {
            $filters['criteria'] = htmlspecialchars(trim($_GET['criteria']));
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
}
