<?php

namespace App\Models;

use App\Core\Database;
use PDO;
use Exception;

class DepartmentModel {
    /**
     * Récupère la liste de tous les rayons.
     */
    public funtion findAll(): array {
        try {
            $db = Database::getConnection();
            $stmt = $db->query("SELECT id, name FROM departments");

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Erreur lors de la récupérations des rayons: " . $e->getMessage());
        }
    }
}