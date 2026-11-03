<?php

namespace App\Models;

use App\Core\Database;
use App\Core\ProductPolicy;

class AdminProductModel
{
    /** Champs facultatifs de products : un champ laissé vide est enregistré NULL (jamais ''). */
    private const PRODUCT_OPTIONAL_FIELDS = ['sku', 'packaging_type', 'pot_diameter_cm', 'volume_l', 'weight_g', 'main_image_url', 'secondary_image_url'];

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

    public function __construct(
        private SoilModel $soils = new SoilModel(),
        private StockMovementModel $movements = new StockMovementModel()
    ) {}

    /**
     * Liste tous les produits avec leur classement et leur stock.
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
                    p.purchase_price_excl_tax,
                    p.stock_quantity,
                    p.main_image_url,
                    p.is_active,
                    t.rate     AS tax_rate,
                    s.id       AS subcategory_id,
                    s.name     AS subcategory_name,
                    c.id       AS category_id,
                    c.name     AS category_name,
                    d.id       AS department_id,
                    d.name     AS department_name
                FROM products p
                INNER JOIN subcategories s ON s.id = p.subcategory_id
                INNER JOIN categories c    ON c.id = s.category_id
                INNER JOIN departments d   ON d.id = c.department_id
                LEFT JOIN taxes t          ON t.id = p.tax_id
                ORDER BY p.id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Détail complet d'un produit avec ses données botaniques si existantes.
     * La fiche botanique est renvoyée « à plat » (mêmes clés que les colonnes), ses listes sous criteria_ids, soil_type_ids, soil_ph_ids.
     * criteria_ids contient aussi les anciens critères « Sol … » : l'ancien admin en a besoin jusqu'à la bascule.
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
                    p.purchase_price_excl_tax,
                    p.stock_quantity,
                    p.main_image_url,
                    p.secondary_image_url,
                    p.is_active,
                    p.sku,
                    p.packaging_type,
                    p.pot_diameter_cm,
                    p.volume_l,
                    p.weight_g,
                    t.rate AS tax_rate,
                    s.category_id,
                    c.department_id,
                    d.has_plant_sheet,
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
                LEFT JOIN taxes t ON t.id = p.tax_id
                LEFT JOIN subcategories s ON s.id = p.subcategory_id
                LEFT JOIN categories c ON c.id = s.category_id
                LEFT JOIN departments d ON d.id = c.department_id
                WHERE p.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        $product = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$product) {
            return false;
        }

        $product['criteria_ids']  = [];
        $product['soil_type_ids'] = [];
        $product['soil_ph_ids']   = [];

        if ($product['plant_id']) {
            $plantId  = (int) $product['plant_id'];
            $critStmt = $db->prepare("SELECT criterion_id FROM plant_criterion WHERE plant_id = :plant_id ORDER BY criterion_id");
            $critStmt->execute([':plant_id' => $plantId]);
            $product['criteria_ids']  = array_map('intval', $critStmt->fetchAll(\PDO::FETCH_COLUMN));
            $product['soil_type_ids'] = $this->soils->idsForPlant('type', $plantId);
            $product['soil_ph_ids']   = $this->soils->idsForPlant('ph', $plantId);
        }

        return $product;
    }

    /**
     * Crée un produit et optionnellement ses données botaniques.
     * Utilise une transaction pour garantir l'atomicité.
     * Un stock initial est historisé (mouvement « inventory », auteur $adminId).
     */
    public function create(array $data, ?int $adminId = null): int
    {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $sql = "INSERT INTO products
                        (subcategory_id, tax_id, name, description,
                         price_tax_incl, purchase_price_tax_incl, purchase_price_excl_tax,
                         stock_quantity, main_image_url, secondary_image_url, is_active,
                         sku, packaging_type, pot_diameter_cm, volume_l, weight_g)
                    VALUES
                        (:subcategory_id, :tax_id, :name, :description,
                         :price_tax_incl, :purchase_legacy, :purchase_excl_tax,
                         :stock_quantity, :main_image_url, :secondary_image_url, :is_active,
                         :sku, :packaging_type, :pot_diameter_cm, :volume_l, :weight_g)";

            $purchase = $this->purchasePrice($data);

            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':subcategory_id'      => (int) $data['subcategory_id'],
                ':tax_id'              => (int) $data['tax_id'],
                ':name'                => (string) trim($data['name']),
                ':description'         => isset($data['description']) ? (string) trim($data['description']) : null,
                ':price_tax_incl'      => (float) $data['price_tax_incl'],
                ':purchase_legacy'     => $purchase,
                ':purchase_excl_tax'   => $purchase,
                ':stock_quantity'      => (int) ($data['stock_quantity'] ?? 0),
                ':main_image_url'      => $this->optional($data['main_image_url'] ?? null),
                ':secondary_image_url' => $this->optional($data['secondary_image_url'] ?? null),
                ':is_active'           => isset($data['is_active']) ? (int) $data['is_active'] : 1,
                ':sku'                 => $this->optional($data['sku'] ?? null),
                ':packaging_type'      => $this->optional($data['packaging_type'] ?? null),
                ':pot_diameter_cm'     => $this->optionalInt($data['pot_diameter_cm'] ?? null),
                ':volume_l'            => $this->optionalFloat($data['volume_l'] ?? null),
                ':weight_g'            => $this->optionalInt($data['weight_g'] ?? null),
            ]);
            $productId = (int) $db->lastInsertId();

            $stock = (int) ($data['stock_quantity'] ?? 0);
            if ($stock > 0) {
                $this->movements->record($db, $productId, 'inventory', $stock, $stock, $adminId, 'Stock initial');
            }

            if (!empty($data['plant']) && is_array($data['plant'])) {
                $this->savePlant($db, $productId, $data['plant']);
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
     * « plant » : objet = la fiche est réécrite EN ENTIER (clé absente -> vidée) ; null = la fiche est supprimée ; absent = inchangée.
     * Un stock modifié ici (ancien admin : champ du formulaire) est historisé comme un inventaire ; le nouvel admin passe par
     * POST /api/admin/products/{id}/stock.
     */
    public function update(int $id, array $data, ?int $adminId = null): void
    {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            // Stock laissé vide : inchangé (la colonne est un entier, '' n'a pas de sens)
            if (array_key_exists('stock_quantity', $data) && ($data['stock_quantity'] === null || $data['stock_quantity'] === '')) {
                unset($data['stock_quantity']);
            }

            // Stock avant modification, ligne verrouillée : l'écart enregistré est exact même si une vente arrive en même temps
            $stockBefore = array_key_exists('stock_quantity', $data) ? $this->movements->lockStock($db, $id) : null;

            // Construction dynamique du SET — seuls les champs présents sont modifiés
            $allowed = [
                'subcategory_id',
                'tax_id',
                'name',
                'description',
                'price_tax_incl',
                'stock_quantity',
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

            // Prix d'achat HT : nouveau nom ou ancien nom (ancien admin), écrit dans les deux colonnes jusqu'à la bascule
            if (array_key_exists('purchase_price_excl_tax', $data) || array_key_exists('purchase_price_tax_incl', $data)) {
                $sets[] = 'purchase_price_excl_tax = :purchase_excl_tax';
                $sets[] = 'purchase_price_tax_incl = :purchase_legacy';
                $params[':purchase_excl_tax'] = $params[':purchase_legacy'] = $this->purchasePrice($data);
            }

            // Une requête qui ne contient que la fiche botanique est valable : on ne touche alors pas à products
            if ($sets !== []) {
                $db->prepare("UPDATE products SET " . implode(', ', $sets) . " WHERE id = :id")->execute($params);
            }

            if ($stockBefore !== null) {
                $stockAfter = (int) $data['stock_quantity'];
                if ($stockAfter !== $stockBefore) {
                    $this->movements->record($db, $id, 'inventory', $stockAfter - $stockBefore, $stockAfter, $adminId, 'Modifié depuis la fiche produit');
                }
            }

            if (array_key_exists('plant', $data)) {
                if ($data['plant'] === null) {
                    // Les liens (critères, sols) partent avec la plante (ON DELETE CASCADE)
                    $db->prepare("DELETE FROM plants WHERE product_id = :pid")->execute([':pid' => $id]);
                } elseif (is_array($data['plant']) && $data['plant'] !== []) {
                    $this->savePlant($db, $id, $data['plant']);
                }
            }

            $db->commit();
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

    // ------------------------------------------------------------------ vérifications pour le service

    /** Le rayon de cette sous-catégorie accepte-t-il une fiche botanique ? null si la sous-catégorie n'existe pas. */
    public function subcategoryAllowsPlantSheet(int $subcategoryId): ?bool
    {
        $stmt = Database::getConnection()->prepare(
            "SELECT d.has_plant_sheet FROM subcategories s
             INNER JOIN categories c  ON c.id = s.category_id
             INNER JOIN departments d ON d.id = c.department_id
             WHERE s.id = :id"
        );
        $stmt->execute([':id' => $subcategoryId]);
        $flag = $stmt->fetchColumn();

        return $flag === false ? null : (bool) $flag;
    }

    public function taxExists(int $taxId): bool
    {
        $stmt = Database::getConnection()->prepare("SELECT COUNT(*) FROM taxes WHERE id = :id");
        $stmt->execute([':id' => $taxId]);

        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * @param int[] $ids
     * @return int[] identifiants de critères inconnus
     */
    public function unknownCriteria(array $ids): array
    {
        if ($ids === []) {
            return [];
        }
        $known = Database::getConnection()->query("SELECT id FROM criteria")->fetchAll(\PDO::FETCH_COLUMN);

        return array_values(array_diff($ids, array_map('intval', $known)));
    }

    /** Une image est-elle encore utilisée par un produit (actif ou non) ? Avant de supprimer son fichier. */
    public function isImageUsed(string $url): bool
    {
        $stmt = Database::getConnection()->prepare("SELECT COUNT(*) FROM products WHERE main_image_url = :a OR secondary_image_url = :b");
        $stmt->execute([':a' => $url, ':b' => $url]);

        return (int) $stmt->fetchColumn() > 0;
    }

    // ------------------------------------------------------------------ fiche botanique

    /** INSERT ou UPDATE de la fiche (selon qu'elle existe déjà), puis ses critères et ses sols. */
    private function savePlant(\PDO $db, int $productId, array $plant): void
    {
        $check = $db->prepare("SELECT id FROM plants WHERE product_id = :pid LIMIT 1");
        $check->execute([':pid' => $productId]);
        $existing = $check->fetchColumn();

        $db->prepare($existing ? $this->plantUpdateSql() : $this->plantInsertSql())->execute($this->plantParams($productId, $plant));

        $plantId = $existing ? (int) $existing : (int) $db->lastInsertId();

        // Sols absents de la requête (ancien admin) : null, ils sont alors déduits des anciens critères « Sol … »
        $this->soils->syncPlant(
            $db,
            $plantId,
            ProductPolicy::idList($plant, 'criteria'),
            array_key_exists('soil_type_ids', $plant) ? ProductPolicy::idList($plant, 'soil_type_ids') : null,
            array_key_exists('soil_ph_ids', $plant) ? ProductPolicy::idList($plant, 'soil_ph_ids') : null
        );
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

    // ------------------------------------------------------------------ valeurs

    /** Prix d'achat HT : nouveau nom (purchase_price_excl_tax) prioritaire, sinon ancien nom envoyé par l'ancien admin. */
    private function purchasePrice(array $data): ?float
    {
        $value = array_key_exists('purchase_price_excl_tax', $data) ? $data['purchase_price_excl_tax'] : ($data['purchase_price_tax_incl'] ?? null);

        return $this->optionalFloat($value);
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

        return $value === null ? null : round((float) $value, 2);
    }
}
