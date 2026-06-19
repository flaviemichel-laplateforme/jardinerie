<?php

namespace App\Services;

use App\Models\ProductModel;


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
            $products = $this->productModel->findWithFilters($filters);

            return [
                'success' => true,
                'data' => $products
            ];
        } catch (\Exception $e) {
            // 1. On loggue l'erreur technique "brute" pour le développeur (dans les logs du serveur)
            error_log("Erreur critique dans ProductService : " . $e->getMessage());

            // 2. On retourne un message "doux" pour ne pas exposer la base de données au Front-end
            return [
                'success' => false,
                'message' => "Le catalogue est momentanément indisponible suite à un problème technique."
            ];
        }
    }

    /**
     * Récupère les détails d'un produit spécifique.
     * Gère les erreurs métier (404) et techniques (500).
     */
    public function getProductDetails(int $id): array
    {
        try {
            // 1. Appel au Modèle (le magasinier)
            $product = $this->productModel->findById($id);

            // 2. Règle métier : Que faire si le produit n'existe pas ?
            if (!$product) {
                return [
                    'success' => false,
                    'code' => 404,
                    'message' => "Ce produit n'existe pas ou n'est plus disponible."
                ];
            }

            // 3. Succès : on renvoie les données
            return [
                'success' => true,
                'code' => 200,
                'data' => $product
            ];
        } catch (\Exception $e) {
            // 4. Crash technique
            error_log("Erreur critique dans ProductService (getProductDetails) pour l'ID {$id} : " . $e->getMessage());

            return [
                'success' => false,
                'code' => 500,
                'message' => "Impossible de récupérer les informations du produit pour le moment."
            ];
        }
    }

    /**
     * Function qui vérifie la disponibilité et calcule le statut du stock
     */
    public function checkAvailability(int $id): array
    {
        try {
            $stock = $this->productModel->getStockQuantity($id);

            // Si la méthode Model a renvoyé null (produit inexistant ou inactif)
            if ($stock === null) {

                return [
                    'success' => false,
                    'code' => 404,
                    'error' => "Produit introuvable."
                ];
            }

            $status = 'En stock';

            if ($stock <= 0) {
                $status = 'Indisponible';
            } elseif ($stock <= 5) {
                $status = 'Stock faible';
            }

            return [
                'success' => true,
                'code' => 200,
                'data' => [
                    'product_id' => $id,
                    'stock_quantity' => $stock,
                    'status' => $status
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'code' => 500,
                'error' => "Erreur lors de la vérification des stocks."
            ];
        }
    }
}
