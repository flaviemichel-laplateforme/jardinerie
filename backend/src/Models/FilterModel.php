<?php

namespace App\Models;

use App\Core\Database;
use App\Core\SoilLegacy;

class FilterModel
{
    /**
     * Récupère la configuration des filtres.
     * @param string|null $type Optionnel : 'vegetaux', 'jardinage', etc.
     * @param string|null $categoryIds Optionnel : liste d'IDs de catégories cochées, séparés par des virgules (ex: "1,3")
     * @param bool $v2 Nouveau site : la nature et le pH du sol ont leurs propres listes (soil_types, soil_ph), et les anciens
     *                 critères « Sol … » sont retirés de criteria. Sans v2 (ancien site), la réponse ne change pas.
     */
    public function getAllFilters(?string $type = null, ?string $categoryIds = null, bool $v2 = false): array
    {
        $db = Database::getConnection();

        // 1. Catégories du rayon demandé : « végétaux » = rayons avec fiche botanique, « jardinage » = les autres (réglé dans l'admin)
        $catSql = "SELECT id, name AS label FROM categories";

        if ($type === 'vegetaux') {
            $catSql .= " WHERE department_id IN (SELECT id FROM departments WHERE has_plant_sheet = 1)";
        } elseif ($type === 'jardinage') {
            $catSql .= " WHERE department_id IN (SELECT id FROM departments WHERE has_plant_sheet = 0)";
        }

        $catSql .= " ORDER BY name ASC";

        // Exécution de la requête des catégories
        $stmtCat = $db->prepare($catSql);
        $stmtCat->execute();
        $categories = $stmtCat->fetchAll(\PDO::FETCH_ASSOC);

        // Sous-catégories : uniquement si au moins une catégorie est cochée,
        // via une requête préparée (les IDs viennent du client, jamais concaténés directement dans le SQL).
        $subcategories = [];
        if ($categoryIds) {
            $ids = array_values(array_filter(array_map('intval', explode(',', $categoryIds))));

            if (!empty($ids)) {
                $placeholders = [];
                $params = [];
                foreach ($ids as $index => $id) {
                    $paramName = 'cat' . $index;
                    $placeholders[] = ':' . $paramName;
                    $params[$paramName] = $id;
                }

                $subSql = "SELECT id, category_id, name AS label FROM subcategories
                           WHERE category_id IN (" . implode(',', $placeholders) . ")
                           ORDER BY name ASC";

                $stmtSub = $db->prepare($subSql);
                $stmtSub->execute($params);
                $subcategories = $stmtSub->fetchAll(\PDO::FETCH_ASSOC);
            }
        }

        // 2. REQUÊTES FIXES POUR LA BOTANIQUE ET LES CRITÈRES
        // Le rendu conditionnel de FilterSidebar.jsx s'occupera de masquer ces infos
        // lorsque l'utilisateur se trouvera sur la page Jardinage.
        $stmtCriteria = $db->prepare("SELECT id, name AS label FROM criteria ORDER BY name ASC");
        $stmtCriteria->execute();
        $criteria = $stmtCriteria->fetchAll(\PDO::FETCH_ASSOC);

        if ($v2) {
            $criteria = array_values(array_filter($criteria, fn(array $row) => !SoilLegacy::isLegacyCriterion($row['label'])));
        }

        $stmtExpositions = $db->prepare("SELECT DISTINCT sun_exposure AS id, sun_exposure AS label FROM plants WHERE sun_exposure IS NOT NULL");
        $stmtExpositions->execute();
        $expositions = $stmtExpositions->fetchAll(\PDO::FETCH_ASSOC);

        $stmtWater = $db->prepare("SELECT DISTINCT water_requirement AS id, water_requirement AS label FROM plants WHERE water_requirement IS NOT NULL");
        $stmtWater->execute();
        $water = $stmtWater->fetchAll(\PDO::FETCH_ASSOC);

        $filters = [
            'categories' => $categories,
            'subcategories' => $subcategories,
            'criteria' => $criteria,
            'expositions' => $expositions,
            'water' => $water
        ];

        if ($v2) {
            foreach (['soil_types' => 'soil_types', 'soil_ph' => 'soil_ph'] as $key => $table) {
                $filters[$key] = $db->query("SELECT id, name AS label FROM $table ORDER BY name ASC")->fetchAll(\PDO::FETCH_ASSOC);
            }
        }

        return $filters;
    }
}
