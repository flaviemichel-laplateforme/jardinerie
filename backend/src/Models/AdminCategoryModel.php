<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class AdminCategoryModel
{
    /**
     * Hiérarchie complète rayon → catégorie → sous-catégorie, y compris les rayons et catégories VIDES
     * (jointures externes depuis les rayons), avec les comptes utiles à l'admin.
     */
    public function getTree(): array
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    d.id AS dept_id,
                    d.name AS department,
                    d.has_plant_sheet,
                    c.id AS cat_id,
                    c.name AS category,
                    s.id AS sub_id,
                    s.name AS subcategory,
                    (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id) AS product_count
                FROM departments d
                LEFT JOIN categories c    ON c.department_id = d.id
                LEFT JOIN subcategories s ON s.category_id = c.id
                ORDER BY d.name, c.name, s.name";

        $stmt = $db->prepare($sql);
        $stmt->execute();

        return $this->buildTree($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Retourne tous les taux de TVA disponibles.
     */
    public function getTaxes(): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, rate FROM taxes ORDER BY rate ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ------------------------------------------------------------------ lecture d'un élément

    /** @return array{id:int, name:string, has_plant_sheet:int}|null */
    public function findDepartment(int $id): ?array
    {
        return $this->fetchOne("SELECT id, name, has_plant_sheet FROM departments WHERE id = :id", $id);
    }

    /** @return array{id:int, department_id:int, name:string}|null */
    public function findCategory(int $id): ?array
    {
        return $this->fetchOne("SELECT id, department_id, name FROM categories WHERE id = :id", $id);
    }

    /** @return array{id:int, category_id:int, name:string}|null */
    public function findSubcategory(int $id): ?array
    {
        return $this->fetchOne("SELECT id, category_id, name FROM subcategories WHERE id = :id", $id);
    }

    // ------------------------------------------------------------------ unicité des noms (sans tenir compte des majuscules)

    public function departmentNameTaken(string $name, int $exceptId = 0): bool
    {
        return $this->count("SELECT COUNT(*) FROM departments WHERE LOWER(name) = LOWER(:name) AND id <> :except", [':name' => $name, ':except' => $exceptId]) > 0;
    }

    public function categoryNameTaken(int $departmentId, string $name, int $exceptId = 0): bool
    {
        return $this->count(
            "SELECT COUNT(*) FROM categories WHERE department_id = :parent AND LOWER(name) = LOWER(:name) AND id <> :except",
            [':parent' => $departmentId, ':name' => $name, ':except' => $exceptId]
        ) > 0;
    }

    public function subcategoryNameTaken(int $categoryId, string $name, int $exceptId = 0): bool
    {
        return $this->count(
            "SELECT COUNT(*) FROM subcategories WHERE category_id = :parent AND LOWER(name) = LOWER(:name) AND id <> :except",
            [':parent' => $categoryId, ':name' => $name, ':except' => $exceptId]
        ) > 0;
    }

    // ------------------------------------------------------------------ comptes (suppression refusée tant que l'élément sert)

    public function countSubcategories(int $categoryId): int
    {
        return $this->count("SELECT COUNT(*) FROM subcategories WHERE category_id = :id", [':id' => $categoryId]);
    }

    /** Produits de la sous-catégorie, actifs ou non (un produit désactivé reste lié aux commandes passées). */
    public function countProducts(int $subcategoryId): int
    {
        return $this->count("SELECT COUNT(*) FROM products WHERE subcategory_id = :id", [':id' => $subcategoryId]);
    }

    /** Fiches botaniques des produits de ce rayon. */
    public function countPlantSheets(int $departmentId): int
    {
        return $this->count(
            "SELECT COUNT(*) FROM plants pl
             INNER JOIN products p      ON p.id = pl.product_id
             INNER JOIN subcategories s ON s.id = p.subcategory_id
             INNER JOIN categories c    ON c.id = s.category_id
             WHERE c.department_id = :id",
            [':id' => $departmentId]
        );
    }

    // ------------------------------------------------------------------ écriture

    public function createCategory(int $departmentId, string $name): int
    {
        $db = Database::getConnection();
        $db->prepare("INSERT INTO categories (department_id, name) VALUES (:dept_id, :name)")
            ->execute([':dept_id' => $departmentId, ':name' => $name]);

        return (int) $db->lastInsertId();
    }

    public function createSubcategory(int $categoryId, string $name): int
    {
        $db = Database::getConnection();
        $db->prepare("INSERT INTO subcategories (category_id, name) VALUES (:cat_id, :name)")
            ->execute([':cat_id' => $categoryId, ':name' => $name]);

        return (int) $db->lastInsertId();
    }

    /** @param array{name?:string, has_plant_sheet?:bool} $changes */
    public function updateDepartment(int $id, array $changes): void
    {
        $sets   = [];
        $params = [':id' => $id];
        if (array_key_exists('name', $changes)) {
            $sets[] = 'name = :name';
            $params[':name'] = $changes['name'];
        }
        if (array_key_exists('has_plant_sheet', $changes)) {
            $sets[] = 'has_plant_sheet = :flag';
            $params[':flag'] = $changes['has_plant_sheet'] ? 1 : 0;
        }
        if ($sets !== []) {
            Database::getConnection()->prepare('UPDATE departments SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
        }
    }

    public function renameCategory(int $id, string $name): void
    {
        Database::getConnection()->prepare("UPDATE categories SET name = :name WHERE id = :id")->execute([':name' => $name, ':id' => $id]);
    }

    public function renameSubcategory(int $id, string $name): void
    {
        Database::getConnection()->prepare("UPDATE subcategories SET name = :name WHERE id = :id")->execute([':name' => $name, ':id' => $id]);
    }

    public function deleteCategory(int $id): void
    {
        Database::getConnection()->prepare("DELETE FROM categories WHERE id = :id")->execute([':id' => $id]);
    }

    public function deleteSubcategory(int $id): void
    {
        Database::getConnection()->prepare("DELETE FROM subcategories WHERE id = :id")->execute([':id' => $id]);
    }

    // ------------------------------------------------------------------ outils

    private function fetchOne(string $sql, int $id): ?array
    {
        $stmt = Database::getConnection()->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function count(string $sql, array $params): int
    {
        $stmt = Database::getConnection()->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Restructure les lignes SQL plates en arbre hiérarchique.
     * Avec les jointures externes, une catégorie sans sous-catégorie arrive avec sub_id NULL, un rayon vide avec cat_id NULL.
     */
    private function buildTree(array $rows): array
    {
        $tree = [];

        foreach ($rows as $row) {
            $deptId = (int) $row['dept_id'];

            if (!isset($tree[$deptId])) {
                $tree[$deptId] = [
                    'id'              => $deptId,
                    'name'            => $row['department'],
                    'has_plant_sheet' => (bool) $row['has_plant_sheet'],
                    'categories'      => [],
                ];
            }

            if ($row['cat_id'] === null) {
                continue;
            }
            $catId = (int) $row['cat_id'];

            if (!isset($tree[$deptId]['categories'][$catId])) {
                $tree[$deptId]['categories'][$catId] = [
                    'id'            => $catId,
                    'name'          => $row['category'],
                    'subcategories' => [],
                ];
            }

            if ($row['sub_id'] === null) {
                continue;
            }

            $tree[$deptId]['categories'][$catId]['subcategories'][] = [
                'id'            => (int) $row['sub_id'],
                'name'          => $row['subcategory'],
                'product_count' => (int) $row['product_count'],
            ];
        }

        return array_values(array_map(function (array $dept): array {
            $dept['categories'] = array_values($dept['categories']);
            return $dept;
        }, $tree));
    }
}
