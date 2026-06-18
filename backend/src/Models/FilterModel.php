<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class FilterModel
{

    public function getAllFilters(): array
    {
        $db = Database::getConnection();

        $categories = $db->query("SELECT id, name AS label FROM categories ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
        $criteria = $db->query("SELECT id, name AS label FROM criteria ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
        $expositions = $db->query("SELECT DISTINCT sun_exposure AS id, sun_exposure AS label FROM plants WHERE sun_exposure IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC);
        $water = $db->query("SELECT DISTINCT water_requirement AS id, water_requirement AS label FROM plants WHERE water_requirement IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC);
        return [
            'categories' => $categories,
            'criteria' => $criteria,
            'expositions' => $expositions,
            'water' => $water
        ];
    }
}
