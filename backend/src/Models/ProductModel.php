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

            // 2. Filtre textuel multi-colonnes automatisé (Approche dynamique et évolutive)
            if (!empty($filters['search'])) {
                // Étape 1 : Définition de la liste des colonnes cibles pour la recherche
                $columnsToSearch = [
                    'p.name',              // Nom commercial
                    'pl.common_name',      // Nom commun
                    'pl.latin_name',       // Nom latin
                    'p.description',       // Description du produit
                    'pl.genus',            // Genre botanique
                    'pl.species'           // Espèce botanique
                ];

                $subConditions = [];
                $searchTerm = '%' . $filters['search'] . '%';

                // Étape 2 : Génération automatique des marqueurs SQL et du binding PDO
                foreach ($columnsToSearch as $index => $column) {
                    $paramName = 'search_' . $index; // Génère : search_0, search_1, search_2...

                    // Construit la clause SQL pour cette colonne : "p.name LIKE :search_0"
                    $subConditions[] = "$column LIKE :$paramName";

                    // Injecte la valeur dans le tableau de paramètres PDO
                    $params[$paramName] = $searchTerm;
                }

                // Étape 3 : Assemblage des clauses avec un opérateur "OR" et ajout aux conditions principales
                // Résultat généré : "(p.name LIKE :search_0 OR pl.common_name LIKE :search_1 OR ...)"
                $conditions[] = "(" . implode(' OR ', $subConditions) . ")";
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

            // 4. Filtre par Besoin en eau 
            if (!empty($filters['water'])) {
                $waterReqs = explode(',', $filters['water']);
                $expPlaceholders = [];

                foreach ($waterReqs as $index => $water) {
                    $paramName = 'water' . $index;
                    $waterPlaceholders[] = ':' . $paramName;
                    $params[$paramName] = $water;
                }

                $conditions[] = "pl.water_requirement IN (" . implode(',', $expPlaceholders) . ")";
            }


            //Filtre par prix maximum
            if (isset($filters['price_max'])) {
                $conditions[] = "p.price_tax_incl <= :price_max";
                $params['price_max'] = $filters['price_max'];
            }




            // Filtre par Critères (Dépolluante, etc.) avec optimisation EXISTS
            if (!empty($filters['criteria'])) {
                $critIds = explode(',', $filters['criteria']);
                $critPlaceholders = [];
                foreach ($critIds as $index => $id) {
                    $paramName = 'crit' . $index;
                    $critPlaceholders[] = ':' . $paramName;
                    $params[$paramName] = (int) $id;
                }
                // La requête vérifie s'il existe au moins une ligne dans la table de liaison
                // qui correspond à la plante actuelle ET aux critères demandés.
                $conditions[] = "EXISTS (
                    SELECT 1 FROM plant_criterion pc 
                    WHERE pc.plant_id = pl.id 
                    AND pc.criterion_id IN (" . implode(',', $critPlaceholders) . ")
                )";
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
