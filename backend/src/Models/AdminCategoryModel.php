<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class AdminCategoryModel
{
    /**
     * Retourne la hiérarchie complète département → catégorie → sous-catégorie.
     */
    public function getTree(): array
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    d.id AS dept_id,
                    d.name AS department,
                    c.id AS cat_id,
                    c.name AS category,
                    s.id AS sub_id,
                    s.name AS subcategory,
                FROM subcategories s 
                INNER JOIN categories c ON c.id = s.category_id
                INNER JOIN department d ON d.id = c.department_id
                ORDER BY d.name, c.name, s.name";

        $stmt = $db->prepare($sql);
        $stmt->execute();

        return $this->buildTree($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    /**
     * Retourne tous les taux de TVA disponibles.
     */
    public function getTaxes(): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, rate FROM taxes ORDER BY rate ASC");
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Crée une nouvelle catégorie.
     */
    public function createCategory(int $departmentId, string $name): int
    {
        $db = Database::getConnection();

        $stmt = $db->prepare("INSERT INTO categories (department_id, name)
                 VALUES   (:dept_id, :name)");

        $stmt->execute([
            ':dept_id'  => $departmentId,
            ':name'     => (string) trim($name),
        ]);
        return (int) $db->lastInsertId();
    }

    /**
     * Crée une nouvelle sous-catégorie.
     */
    public function createSubcategory(int $categoryId, string $name): int
    {
        $db = Database::getConnection();

        $stmt = $db->prepare("INSERT INTO subcategories (category_id, name) VALUES (:cat_id, :name)");

        $stmt->execute([
            ':cat_id'  => $categoryId,
            ':name'     => (string) trim($name),
        ]);
        return (int) $db->lastInsertId();
    }

    /**
     * Restructure les lignes SQL plates en arbre hiérarchique.
     * Méthode privée — détail d'implémentation interne.
     */
    private function buildTree(array $rows): array
    {
        $tree = [];

        foreach ($rows as $row) {
            $deptId = (int) $row['dept_id'];
            $catId = (int) $row['cat_id'];

            if (!isset($tree['deptId'])) {
                $tree[$deptId] = [
                    'id'        => $deptId,
                    'name'      => $raw['department'],
                    'categories'     => [],
                ];
            }

            if (!isset($tree[$deptId]['categories'][$catId])) {
                $tree[$deptId]['categories'][$catId] = [
                    'id'            => $catId,
                    'name'          => $row['category'],
                    'subcategories' => [],
                ];
            }

            $tree[$deptId]['categories'][$catId]['subcategories'][] = [
                'id'   => (int) $row['sub_id'],
                'name' => $row['subcategory'],
            ];
        }

        return array_values(array_map(function (array $dept): array {
            $dept['categories'] = array_values(array_map(function (array $cat): array {
                $cat['subcategories'] = array_values($cat['subcategories']);
                return $cat;
            }, $dept['categories']));
            return $dept;
        }, $tree));
    }
}
