<?php

namespace App\Models;

use App\Core\Database;
use PDO;

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
                        pl.sun_exposure,
                        t.rate AS tax_rate
                    FROM products p
                    INNER JOIN subcategories s ON p.subcategory_id = s.id
                    INNER JOIN categories c ON s.category_id = c.id
                    INNER JOIN departments d ON c.department_id = d.id";

            if (isset($filters['type']) && $filters['type'] === 'vegetaux') {
                $sql .= " INNER JOIN plants pl ON p.id = pl.product_id";
            } else {
                $sql .= " LEFT JOIN plants pl ON p.id = pl.product_id";
            }

            $sql .= " LEFT JOIN taxes t ON p.tax_id = t.id
                      WHERE p.is_active = 1";

            $conditions = [];
            $params = [];

            if (isset($filters['type']) && $filters['type'] === 'jardinage') {
                $conditions[] = "pl.product_id IS NULL";
            }

            if (!empty($filters['search'])) {
                $columnsToSearch = [
                    'p.name',
                    'pl.common_name',
                    'pl.latin_name',
                    'p.description',
                    'pl.genus',
                    'pl.species'
                ];
                $subConditions = [];
                $searchTerm = '%' . $filters['search'] . '%';

                foreach ($columnsToSearch as $index => $column) {
                    $paramName = 'search_' . $index;
                    $subConditions[] = "$column LIKE :$paramName";
                    $params[$paramName] = $searchTerm;
                }
                $conditions[] = "(" . implode(' OR ', $subConditions) . ")";

                // Paramètre dédié au tri par pertinence (voir plus bas) :
                // un nom qui COMMENCE par le terme prime sur un simple "contient".
                $params['search_priority'] = $filters['search'] . '%';
            }

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

            if (!empty($filters['water'])) {
                $waterReqs = explode(',', $filters['water']);
                $waterPlaceholders = [];
                foreach ($waterReqs as $index => $water) {
                    $paramName = 'water' . $index;
                    $waterPlaceholders[] = ':' . $paramName;
                    $params[$paramName] = $water;
                }
                $conditions[] = "pl.water_requirement IN (" . implode(',', $waterPlaceholders) . ")";
            }

            if (isset($filters['price_min']) && $filters['price_min'] !== '') {
                $conditions[] = "p.price_tax_incl >= :price_min";
                $params['price_min'] = $filters['price_min'];
            }
            if (isset($filters['price_max']) && $filters['price_max'] !== '') {
                $conditions[] = "p.price_tax_incl <= :price_max";
                $params['price_max'] = $filters['price_max'];
            }

            if (!empty($filters['criteria'])) {
                $critIds = explode(',', $filters['criteria']);
                $critPlaceholders = [];
                foreach ($critIds as $index => $id) {
                    $paramName = 'crit' . $index;
                    $critPlaceholders[] = ':' . $paramName;
                    $params[$paramName] = (int) $id;
                }
                $conditions[] = "EXISTS (
                    SELECT 1 FROM plant_criterion pc 
                    WHERE pc.plant_id = pl.id 
                    AND pc.criterion_id IN (" . implode(',', $critPlaceholders) . ")
                )";
            }

            if (!empty($conditions)) {
                $sql .= " AND " . implode(" AND ", $conditions);
            }

            if (!empty($filters['search'])) {
                $sql .= " ORDER BY CASE WHEN p.name LIKE :search_priority THEN 0 ELSE 1 END ASC, p.name ASC";
            } else {
                $sql .= " ORDER BY p.name ASC";
            }

            if (isset($filters['limit']) && $filters['limit'] > 0) {
                $sql .= " LIMIT " . (int) $filters['limit'];
            }

            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            error_log("SQL Error in findWithFilters: " . $e->getMessage() . " | SQL: " . $sql);
            throw new \Exception("Erreur lors de la récupération du catalogue.");
        }
    }

    /**
     * Récupère un produit spécifique par son ID avec ses détails botaniques.
     */
    public function findById(int $id): ?array
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    p.id,
                    p.name AS product_name,
                    p.description,
                    p.price_tax_incl,
                    p.stock_quantity,
                    p.main_image_url,
                    pl.id AS plant_id,
                    pl.common_name,
                    pl.latin_name,
                    pl.genus,
                    pl.species,
                    pl.sun_exposure,
                    pl.water_requirement,
                    c.name AS category_name,
                    s.name AS subcategory_name,
                    t.rate AS tax_rate
                FROM products p
                LEFT JOIN plants pl ON p.id = pl.product_id
                LEFT JOIN subcategories s ON p.subcategory_id = s.id
                LEFT JOIN categories c ON s.category_id = c.id
                LEFT JOIN taxes t ON p.tax_id = t.id
                WHERE p.id = :id AND p.is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        return $product ?: null;
    }

    /**
     * Fonction de récupération du stock pour définir un status : en stock, stock faible, indisponible (épuisé)
     */
    public function getStockQuantity(int $id): ?int
    {
        $db = Database::getConnection();
        $sql = "SELECT stock_quantity FROM products WHERE id = :id AND is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetchColumn();

        return $result !== false ? (int) $result : null;
    }
}
