<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class DepartmentModel
{
    /**
     * Récupère la liste total des rayons
     */
    public function findAll(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT id, name FROM departments");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
