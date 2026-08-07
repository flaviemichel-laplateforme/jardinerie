<?php

namespace App\Models;

use App\Core\Database;

class FilterModel
{
    /**
     * Récupère la configuration des filtres.
     * @param string|null $type Optionnel : 'vegetaux', 'jardinage', etc.
     */
    public function getAllFilters(?string $type = null): array
    {
        $db = Database::getConnection();

        // 1. REQUÊTE DYNAMIQUE POUR LES CATÉGORIES (Ultra-rapide grâce à l'ID direct)
        $catSql = "SELECT id, name AS label FROM categories";

        if ($type === 'vegetaux') {
            // ID 1 = Végétaux
            $catSql .= " WHERE department_id = 1";
        } elseif ($type === 'jardinage') {
            // ID 2 = Jardinage & Entretien
            $catSql .= " WHERE department_id = 2";
        }

        $catSql .= " ORDER BY name ASC";

        // Exécution de la requête des catégories
        $stmtCat = $db->query($catSql);
        $categories = $stmtCat->fetchAll(\PDO::FETCH_ASSOC);

        // 2. REQUÊTES FIXES POUR LA BOTANIQUE ET LES CRITÈRES
        // Le rendu conditionnel de FilterSidebar.jsx s'occupera de masquer ces infos
        // lorsque l'utilisateur se trouvera sur la page Jardinage.
        $criteria = $db->query("SELECT id, name AS label FROM criteria ORDER BY name ASC")->fetchAll(\PDO::FETCH_ASSOC);
        $expositions = $db->query("SELECT DISTINCT sun_exposure AS id, sun_exposure AS label FROM plants WHERE sun_exposure IS NOT NULL")->fetchAll(\PDO::FETCH_ASSOC);
        $water = $db->query("SELECT DISTINCT water_requirement AS id, water_requirement AS label FROM plants WHERE water_requirement IS NOT NULL")->fetchAll(\PDO::FETCH_ASSOC);

        return [
            'categories' => $categories,
            'criteria' => $criteria,
            'expositions' => $expositions,
            'water' => $water
        ];
    }
}
