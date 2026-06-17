<?php

namespace App\Models;

use App\Core\Database;
use PDO;
use Exception;

class ProductModel
{
    /**
     * Récupère les produits actifs avec leurs catégories et détails botaniques.
     * Applique dynamiquement les filtres de recherche, catégories et expositions.
     */
    public function findWithFilters(array $filters = []): array
    {
        try {
            $db = Database::getConnection();

            // 1. Requête SQL moderne avec INNER JOIN pour l'arborescence
            // et LEFT JOIN pour inclure les données botaniques sans exclure les outils
            $sql = "SELECT 
                        p.id, 
                        p.name AS product_name, 
                        p.price_tax_incl, 
                        p.stock_quantity, 
                        p.main_image_url,
                        s.name AS subcategory_name,
                        c.id AS category_id,
                        c.name AS category_name,
                        d.name AS department_name,
                        pl.sun_exposure
                    FROM products p
                    INNER JOIN subcategories s ON p.subcategory_id = s.id
                    INNER JOIN categories c ON s.category_id = c.id
                    INNER JOIN departments d ON c.department_id = d.id
                    LEFT JOIN plants pl ON p.id = pl.product_id
                    WHERE p.is_active = 1";

            $conditions = [];
            $params = [];

            // 2. Filtre textuel (Recherche sur le nom commercial, commun ou latin)
            if (!empty($filters['search'])) {
                $conditions[] = "(p.name LIKE :search OR pl.common_name LIKE :search OR pl.latin_name LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }

            // 3. Filtre par Catégories (Création dynamique des paramètres PDO pour la clause IN)
            if (!empty($filters['categories'])) {
                $catIds = explode(',', $filters['categories']);
                $catPlaceholders = [];

                foreach ($catIds as $index => $id) {
                    $paramName = 'cat' . $index;
                    $catPlaceholders[] = ':' . $paramName;
                    $params[$paramName] = (int) $id;
                }

                $conditions[] = "c.id IN (" . implode(',', $catPlaceholders) . ")";
            }

            // 4. Filtre par Exposition au soleil
            if (!empty($filters['expositions'])) {
                $exposures = explode(',', $filters['expositions']);
                $expPlaceholders = [];

                foreach ($exposures as $index => $exp) {
                    $paramName = 'exp' . $index;
                    $expPlaceholders[] = ':' . $paramName;
                    $params[$paramName] = $exp;
                }

                $conditions[] = "pl.sun_exposure IN (" . implode(',', $expPlaceholders) . ")";
            }

            // 5. Assemblage final de la requête si des conditions existent
            if (!empty($conditions)) {
                $sql .= " AND " . implode(" AND ", $conditions);
            }

            // Ajout d'un tri par défaut pour la cohérence de l'affichage
            $sql .= " ORDER BY p.name ASC";

            // 6. Exécution sécurisée
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Erreur lors de la récupération du catalogue : " . $e->getMessage());
        }
    }
}
