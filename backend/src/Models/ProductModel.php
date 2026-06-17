<?php

namespace App\Models;

use App\Core\Database;
use PDO;
use Exception;

class ProductModel
{

    /**
     * Récupère les produits actifs avec leurs catégories grâce aux jointures SQL.
     */
    public function findWithFilters(array $filters = []): array
    {
        try {
            $db = Database::getConnection();

            // Requête SQL moderne avec INNER JOIN pour remonter l'arborescence complète
            $sql = "SELECT 
                        p.id, 
                        p.name AS product_name, 
                        p.price_tax_incl, 
                        p.stock_quantity, 
                        p.main_image_url,
                        s.name AS subcategory_name,
                        c.name AS category_name,
                        d.name AS department_name
                    FROM products p
                    INNER JOIN subcategories s ON p.subcategory_id = s.id
                    INNER JOIN categories c ON s.category_id = c.id
                    INNER JOIN departments d ON c.department_id = d.id
                    WHERE p.is_active = 1";

            $params = [];

            // Si un paramètre de recherche a été envoyé (recherche par nom de produit)
            if (!empty($filters['search'])) {
                // On précise p.name pour éviter l'ambiguïté avec s.name ou c.name
                $sql .= " AND p.name LIKE :search";
                $params['search'] = '%' . $filters['search'] . '%';
            }

            // Exécution sécurisée
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Erreur lors de la récupération du catalogue : " . $e->getMessage());
        }
    }
}
