<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class AdminProductModel
{
    /**
     * Liste tous les produits avec leur catégorie et stock.
     * Inclut les produits inactifs (is_active = 0) — contrairement au catalogue public.
     */
    public function findAll(): array
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    p.id,
                    p.name,
                    p.price_tax_incl,
                    p.purchase_price_tax_incl,
                    p.stock_quantity,
                    p.main_image_url,
                    p.is_active,
                    s.name AS subcategory_name,
                    c.name AS category_name
                FROM products p
                INNER JOIN subcategories s ON s.id = p.subcategory_id
                INNER JOIN categories c    ON c.id = s.category_id
                ORDER BY p.id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Détail complet d'un produit avec ses données botaniques si existantes.
     */
    public function findById(int $id): array|false
    {
        $db = Database::getConnection();

        $sql = "SELECT
                    p.id,
                    p.subcategory_id,
                    p.tax_id,
                    p.name,
                    p.description,
                    p.price_tax_incl,
                    p.purchase_price_tax_incl,
                    p.stock_quantity,
                    p.main_image_url,
                    p.secondary_image_url,
                    p.is_active,
                    pl.id          AS plant_id,
                    pl.common_name,
                    pl.latin_name,
                    pl.genus,
                    pl.species,
                    pl.sun_exposure,
                    pl.water_requirement
                FROM products p
                LEFT JOIN plants pl ON pl.product_id = p.id
                WHERE p.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Crée un produit et optionnellement ses données botaniques.
     * Utilise une transaction pour garantir l'atomicité.
     */
    public function create(array $data): int
    {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $sql = "INSERT INTO products
                        (subcategory_id, tax_id, name, description,
                         price_tax_incl, purchase_price_tax_incl,
                         stock_quantity, main_image_url, secondary_image_url, is_active)
                    VALUES
                        (:subcategory_id, :tax_id, :name, :description,
                         :price_tax_incl, :purchase_price_tax_incl,
                         :stock_quantity, :main_image_url, :secondary_image_url, :is_active)";

            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':subcategory_id'          => (int) $data['subcategory_id'],
                ':tax_id'                  => (int) $data['tax_id'],
                ':name'                    => (string) trim($data['name']),
                ':description'             => isset($data['description']) ? (string) trim($data['description']) : null,
                ':price_tax_incl'          => (float) $data['price_tax_incl'],
                ':purchase_price_tax_incl' => isset($data['purchase_price_tax_incl']) ? (float) $data['purchase_price_tax_incl'] : null,
                null,
                ':stock_quantity'          => (int) ($data['stock_quantity']    ?? 0),
                ':main_image_url'          =>  isset($data['main_image_url']) ? (string) trim($data['main_image_url']) : null,
                ':secondary_image_url'     =>  isset($data['secondary_image_url']) ? (string) trim($data['secondary_image_url']) : null,
                ':is_active'               => (int) ($data['is_active']) ?? 1,
            ]);

            $productId = (int) $db->lastInsertId();

            // Si des données botaniques sont fournies → insérer dans plants
            if (!empty($data['plant'])) {
                $this->insertPlant($db, $productId, $data['plant']);
            }

            $db->commit();
            return $productId;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Met à jour un produit existant.
     * PATCH sémantique : seuls les champs envoyés sont mis à jour.
     */
    public function update(int $id, array $data): bool
    {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            // Construction dynamique du SET — seuls les champs présents sont modifiés
            $allowed = [
                'subcategory_id',
                'tax_id',
                'name',
                'description',
                'price_tax_incl',
                'purchase_price_tax_incl',
                'stock_quantity',
                'main_image_url',
                'secondary_image_url',
                'is_active'
            ];

            $sets   = [];
            $params = [':id' => $id];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    $sets[]         = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }

            if (empty($sets)) {
                $db->rollBack();
                return false; // Rien à modifier
            }

            $sql = "UPDATE products SET " . implode(', ', $sets) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Mettre à jour les données botaniques si fournies
            if (!empty($data['plant'])) {
                $this->upsertPlant($db, $id, $data['plant']);
            }

            $db->commit();
            return true;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Suppression logique : désactive le produit sans le supprimer physiquement.
     * Préserve l'intégrité des commandes passées qui référencent ce produit.
     */
    public function softDelete(int $id): bool
    {
        $db  = Database::getConnection();
        $sql = "UPDATE products SET is_active = 0 WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Insère les données botaniques d'un nouveau produit.
     */
    private function insertPlant(\PDO $db, int $productId, array $plant): void
    {
        $sql = "INSERT INTO plants
                    (product_id, common_name, latin_name, genus,
                     species, sun_exposure, water_requirement)
                VALUES
                    (:product_id, :common_name, :latin_name, :genus,
                     :species, :sun_exposure, :water_requirement)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':product_id'       => (int) $productId,
            ':common_name'      => isset($plant['common_name']) ? (string) trim($plant['common_name']) : null,
            ':latin_name'       => isset($plant['latin_name']) ? (string) trim($plant['latin_name']) : null,
            ':genus'            => isset($plant['genus']) ? (string) trim($plant['genus']) : null,
            ':species'          => isset($plant['species']) ? (string) trim($plant['species']) : null,
            ':sun_exposure'     => isset($plant['sun_exposure']) ? (string) $plant['sun_exposure'] : null,
            ':water_requirement' => isset($plant['water_requirement']) ? (string) $plant['water_requirement'] : null,
        ]);
    }

    /**
     * INSERT ou UPDATE des données botaniques (selon si la ligne existe déjà).
     */
    private function upsertPlant(\PDO $db, int $productId, array $plant): void
    {
        $check = $db->prepare("SELECT id FROM plants WHERE product_id = :pid LIMIT 1");
        $check->execute([':pid' => $productId]);

        if ($check->fetch()) {
            $sql = "UPDATE plants SET
                        common_name       = :common_name,
                        latin_name        = :latin_name,
                        genus             = :genus,
                        species           = :species,
                        sun_exposure      = :sun_exposure,
                        water_requirement = :water_requirement
                    WHERE product_id = :product_id";
        } else {
            $sql = "INSERT INTO plants
                        (product_id, common_name, latin_name, genus,
                         species, sun_exposure, water_requirement)
                    VALUES
                        (:product_id, :common_name, :latin_name, :genus,
                         :species, :sun_exposure, :water_requirement)";
        }

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':product_id'        => (int) $productId,
            ':common_name'       => isset($plant['common_name']) ? (string) trim($plant['common_name']) : null,
            ':latin_name'        => isset($plant['latin_name']) ? (string) trim($plant['latin_name']) : null,
            ':genus'             => isset($plant['genus']) ? (string) trim($plant['genus']) : null,
            ':species'           => isset($plant['species']) ? (string) trim($plant['species']) : null,
            ':sun_exposure'      => isset($plant['sun_exposure']) ? (string) $plant["sun_exposure"] : null,
            ':water_requirement' => isset($plant['water_requirement']) ? (string) $plant['water_requirement'] : null,
        ]);
    }
}
