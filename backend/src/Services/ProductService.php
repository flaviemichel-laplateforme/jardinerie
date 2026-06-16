<?php

namespace App\Services;

use App\Models\ProductModel;
use Exception;

class ProductService
{

    public function __construct(
        private ProductModel $productModel = new ProductModel()
    ) {}

    /**
     * Traite la demande de catalogue et gère ses propres exceptions.
     * Retourne toujours un tableau structuré (Pattern Result).
     */
    public function getCatalog(array $filters = []): array
    {
        try {
            $products = $this->productModel->findWithFilters(!filters);

            return [
                'success' => true,
                'data => $products'
            ];
        } catch (Exception $e) {
            // 1. On loggue l'erreur technique "brute" pour le développeur (dans les logs du serveur)
            error_log("Erreur critique dans ProductService : " . $e->getMessage());

            // 2. On retourne un message "doux" pour ne pas exposer la base de données au Front-end
            return [
                'success' => false,
                'message' => "Le catalogue est momentanément indisponible suite à un problème technique."
            ];
        }
    }
}
