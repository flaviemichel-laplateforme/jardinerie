<?php

namespace App\Models;

use App\Core\Database;

class AdminProductModel
{
    /** Champs facultatifs de products : un champ laissé vide est enregistré NULL (jamais ''). */
    private const PRODUCT_OPTIONAL_FIELDS = ['sku', 'packaging_type', 'pot_diameter_cm', 'volume_l', 'weight_g'];

    /** Colonnes de plants et leur type, dans l'ordre d'enregistrement. */
    private const PLANT_FIELDS = [
        'common_name'         => 'text',
        'latin_name'          => 'text',
        'genus'               => 'text',
        'species'             => 'text',
        'family'              => 'text',
        'cultivar'            => 'text',
        'sun_exposure'        => 'text',
        'water_requirement'   => 'text',
        'foliage'             => 'text',
        'drought_tolerance'   => 'text',
        'difficulty'          => 'text',
        'height_max_cm'       => 'int',
        'hardiness_min_c'     => 'int',
        'bloom_start_month'   => 'int',
        'bloom_end_month'     => 'int',
        'harvest_start_month' => 'int',
        'harvest_end_month'   => 'int',
        'care_pruning'        => 'text',
        'care_repotting'      => 'text',
        'care_pests_diseases' => 'text',
    ];

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
                    p.sku,
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

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
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
                    p.sku,
                    p.packaging_type,
                    p.pot_diameter_cm,
                    p.volume_l,
                    p.weight_g,
                    s.category_id,
                    c.department_id,
                    pl.id          AS plant_id,
                    pl.common_name,
                    pl.latin_name,
                    pl.genus,
                    pl.species,
                    pl.family,
                    pl.cultivar,
                    pl.sun_exposure,
                    pl.water_requirement,
                    pl.foliage,
                    pl.drought_tolerance,
                    pl.difficulty,
                    pl.height_max_cm,
                    pl.hardiness_min_c,
                    pl.bloom_start_month,
                    pl.bloom_end_month,
                    pl.harvest_start_month,
                    pl.harvest_end_month,
                    pl.care_pruning,
                    pl.care_repotting,
                    pl.care_pests_diseases
                FROM products p
                LEFT JOIN plants pl ON pl.product_id = p.id
                LEFT JOIN subcategories s ON s.id = p.subcategory_id
                LEFT JOIN categories c ON c.id = s.category_id
                WHERE p.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        $product = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($product && $product['plant_id']) {
            $critStmt = $db->prepare(
                "SELECT criterion_id FROM plant_criterion WHERE plant_id = :plant_id"
            );
            $critStmt->execute([':plant_id' => $product['plant_id']]);
            $product['criteria_ids'] = $critStmt->fetchAll(\PDO::FETCH_COLUMN);
        }

        return $product;
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
                         stock_quantity, main_image_url, secondary_image_url, is_active,
                         sku, packaging_type, pot_diameter_cm, volume_l, weight_g)
                    VALUES
                        (:subcategory_id, :tax_id, :name, :description,
                         :price_tax_incl, :purchase_price_tax_incl,
                         :stock_quantity, :main_image_url, :secondary_image_url, :is_active,
                         :sku, :packaging_type, :pot_diameter_cm, :volume_l, :weight_g)";

            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':subcategory_id'          => isset($data['subcategory_id']) ? (int) $data['subcategory_id'] : null,
                ':tax_id'                  => (int) $data['tax_id'],
                ':name'                    => (string) trim($data['name']),
                ':description'             => isset($data['description']) ? (string) trim($data['description']) : null,
                ':price_tax_incl'          => (float) $data['price_tax_incl'],
                ':purchase_price_tax_incl' => isset($data['purchase_price_tax_incl']) ? (float) $data['purchase_price_tax_incl'] : null,
                ':stock_quantity'          => (int) ($data['stock_quantity'] ?? 0),
                ':main_image_url'          => isset($data['main_image_url']) ? (string) trim($data['main_image_url']) : null,
                ':secondary_image_url'     => isset($data['secondary_image_url']) ? (string) trim($data['secondary_image_url']) : null,
                ':is_active'               => isset($data['is_active']) ? (int) $data['is_active'] : 1,
                ':sku'                     => $this->optional($data['sku'] ?? null),
                ':packaging_type'          => $this->optional($data['packaging_type'] ?? null),
                ':pot_diameter_cm'         => $this->optionalInt($data['pot_diameter_cm'] ?? null),
                ':volume_l'                => $this->optionalFloat($data['volume_l'] ?? null),
                ':weight_g'                => $this->optionalInt($data['weight_g'] ?? null),
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
                'is_active',
                ...self::PRODUCT_OPTIONAL_FIELDS,
            ];

            $sets   = [];
            $params = [':id' => $id];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    $sets[]         = "$field = :$field";
                    $params[":$field"] = in_array($field, self::PRODUCT_OPTIONAL_FIELDS, true)
                        ? $this->optional($data[$field])
                        : $data[$field];
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
        $stmt = $db->prepare($this->plantInsertSql());
        $stmt->execute($this->plantParams($productId, $plant));

        $plantId = (int) $db->lastInsertId();
        $this->syncPlantCriteria($db, $plantId, $plant['criteria'] ?? []);
    }

    /**
     * INSERT ou UPDATE des données botaniques (selon si la ligne existe déjà).
     */
    private function upsertPlant(\PDO $db, int $productId, array $plant): void
    {
        $check = $db->prepare("SELECT id FROM plants WHERE product_id = :pid LIMIT 1");
        $check->execute([':pid' => $productId]);
        $existing = $check->fetch(\PDO::FETCH_ASSOC);

        $sql = $existing ? $this->plantUpdateSql() : $this->plantInsertSql();

        $stmt = $db->prepare($sql);
        $stmt->execute($this->plantParams($productId, $plant));

        $plantId = $existing ? (int) $existing['id'] : (int) $db->lastInsertId();
        $this->syncPlantCriteria($db, $plantId, $plant['criteria'] ?? []);
    }

    private function plantInsertSql(): string
    {
        $fields = array_keys(self::PLANT_FIELDS);

        return "INSERT INTO plants (product_id, " . implode(', ', $fields) . ")
                VALUES (:product_id, :" . implode(', :', $fields) . ")";
    }

    private function plantUpdateSql(): string
    {
        $sets = array_map(fn(string $field) => "$field = :$field", array_keys(self::PLANT_FIELDS));

        return "UPDATE plants SET " . implode(', ', $sets) . " WHERE product_id = :product_id";
    }

    /** Valeurs à enregistrer : une valeur absente ou vide devient NULL. */
    private function plantParams(int $productId, array $plant): array
    {
        $params = [':product_id' => $productId];

        foreach (self::PLANT_FIELDS as $field => $type) {
            $value = $this->optional($plant[$field] ?? null);

            $params[":$field"] = match (true) {
                $value === null => null,
                $type === 'int' => (int) $value,
                default         => (string) $value,
            };
        }

        return $params;
    }

    /** Texte nettoyé ; vide → NULL (deux références '' violeraient l'unicité du SKU). */
    private function optional(mixed $value): mixed
    {
        if (is_string($value)) {
            $value = trim($value);
        }

        return $value === '' ? null : $value;
    }

    private function optionalInt(mixed $value): ?int
    {
        $value = $this->optional($value);

        return $value === null ? null : (int) $value;
    }

    private function optionalFloat(mixed $value): ?float
    {
        $value = $this->optional($value);

        return $value === null ? null : (float) $value;
    }

    /**
     * Remplace les critères associés à une plante : supprime les anciens liens,
     * puis recrée ceux envoyés par le formulaire (delete-then-insert, simple et sûr
     * aussi bien pour une création — rien à supprimer — que pour une modification).
     */
    private function syncPlantCriteria(\PDO $db, int $plantId, array $criteriaIds): void
    {
        $delete = $db->prepare("DELETE FROM plant_criterion WHERE plant_id = :plant_id");
        $delete->execute([':plant_id' => $plantId]);

        if (empty($criteriaIds)) {
            return;
        }

        $insert = $db->prepare(
            "INSERT INTO plant_criterion (plant_id, criterion_id) VALUES (:plant_id, :criterion_id)"
        );

        foreach ($criteriaIds as $criterionId) {
            $insert->execute([
                ':plant_id'     => $plantId,
                ':criterion_id' => (int) $criterionId,
            ]);
        }
    }
}
