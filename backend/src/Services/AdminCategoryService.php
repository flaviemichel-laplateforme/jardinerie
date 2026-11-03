<?php

namespace App\Services;

use App\Core\CatalogNamePolicy;
use App\Core\ProductPolicy;
use App\Core\SecurityLog;
use App\Models\AdminCategoryModel;

/**
 * Classement du catalogue : rayons, catégories, sous-catégories.
 *
 * Règles : nom de 1 à 100 caractères, unique dans son parent (sans tenir compte des majuscules) ; suppression refusée tant
 * que l'élément contient quelque chose (sous-catégories, produits même désactivés) ; fiche botanique désactivable sur un rayon
 * seulement s'il n'en contient aucune. Résultat : ['success', 'code', 'message', 'data'?].
 */
class AdminCategoryService
{
    public function __construct(
        private AdminCategoryModel $model = new AdminCategoryModel()
    ) {}

    public function getTree(): array
    {
        try {
            return $this->ok(200, null, ['tree' => $this->model->getTree()]);
        } catch (\Exception $e) {
            error_log("AdminCategoryService::getTree : " . $e->getMessage());
            return $this->fail(500, 'Impossible de charger les catégories.');
        }
    }

    public function getTaxes(): array
    {
        try {
            return $this->ok(200, null, ['taxes' => $this->model->getTaxes()]);
        } catch (\Exception $e) {
            error_log("AdminCategoryService::getTaxes : " . $e->getMessage());
            return $this->fail(500, 'Impossible de charger les taux de TVA.');
        }
    }

    // ------------------------------------------------------------------ création

    public function createCategory(mixed $departmentId, mixed $name): array
    {
        if (!ProductPolicy::isPositiveId($departmentId) || !$this->model->findDepartment((int) $departmentId)) {
            return $this->fail(400, "Ce rayon n'existe pas.");
        }
        if (($error = CatalogNamePolicy::validate($name)) !== null) {
            return $this->fail(400, $error);
        }

        $name = CatalogNamePolicy::clean($name);
        if ($this->model->categoryNameTaken((int) $departmentId, $name)) {
            return $this->fail(409, 'Une catégorie porte déjà ce nom dans ce rayon.');
        }

        return $this->ok(201, 'Catégorie créée avec succès.', ['id' => $this->model->createCategory((int) $departmentId, $name)]);
    }

    public function createSubcategory(mixed $categoryId, mixed $name): array
    {
        if (!ProductPolicy::isPositiveId($categoryId) || !$this->model->findCategory((int) $categoryId)) {
            return $this->fail(400, "Cette catégorie n'existe pas.");
        }
        if (($error = CatalogNamePolicy::validate($name)) !== null) {
            return $this->fail(400, $error);
        }

        $name = CatalogNamePolicy::clean($name);
        if ($this->model->subcategoryNameTaken((int) $categoryId, $name)) {
            return $this->fail(409, 'Une sous-catégorie porte déjà ce nom dans cette catégorie.');
        }

        return $this->ok(201, 'Sous-catégorie créée avec succès.', ['id' => $this->model->createSubcategory((int) $categoryId, $name)]);
    }

    // ------------------------------------------------------------------ modification

    /** @param array<string, mixed> $data name et/ou has_plant_sheet */
    public function updateDepartment(int $id, array $data): array
    {
        $department = $this->model->findDepartment($id);
        if (!$department) {
            return $this->fail(404, 'Rayon introuvable.');
        }

        $changes = [];

        if (array_key_exists('name', $data)) {
            if (($error = CatalogNamePolicy::validate($data['name'])) !== null) {
                return $this->fail(400, $error);
            }
            $changes['name'] = CatalogNamePolicy::clean($data['name']);
            if ($this->model->departmentNameTaken($changes['name'], $id)) {
                return $this->fail(409, 'Un rayon porte déjà ce nom.');
            }
        }

        if (array_key_exists('has_plant_sheet', $data)) {
            if (!is_bool($data['has_plant_sheet'])) {
                return $this->fail(400, '« has_plant_sheet » doit valoir true ou false.');
            }
            $sheets = $this->model->countPlantSheets($id);
            if (!$data['has_plant_sheet'] && $sheets > 0) {
                return $this->fail(409, "Ce rayon contient $sheets fiche(s) botanique(s) : supprimez-les ou déplacez ces produits d'abord.");
            }
            $changes['has_plant_sheet'] = $data['has_plant_sheet'];
        }

        if ($changes === []) {
            return $this->fail(400, 'Aucune modification fournie.');
        }

        $this->model->updateDepartment($id, $changes);

        return $this->ok(200, 'Rayon mis à jour.');
    }

    public function renameCategory(int $id, mixed $name): array
    {
        $category = $this->model->findCategory($id);
        if (!$category) {
            return $this->fail(404, 'Catégorie introuvable.');
        }
        if (($error = CatalogNamePolicy::validate($name)) !== null) {
            return $this->fail(400, $error);
        }

        $name = CatalogNamePolicy::clean($name);
        if ($this->model->categoryNameTaken((int) $category['department_id'], $name, $id)) {
            return $this->fail(409, 'Une catégorie porte déjà ce nom dans ce rayon.');
        }

        $this->model->renameCategory($id, $name);

        return $this->ok(200, 'Catégorie renommée.');
    }

    public function renameSubcategory(int $id, mixed $name): array
    {
        $subcategory = $this->model->findSubcategory($id);
        if (!$subcategory) {
            return $this->fail(404, 'Sous-catégorie introuvable.');
        }
        if (($error = CatalogNamePolicy::validate($name)) !== null) {
            return $this->fail(400, $error);
        }

        $name = CatalogNamePolicy::clean($name);
        if ($this->model->subcategoryNameTaken((int) $subcategory['category_id'], $name, $id)) {
            return $this->fail(409, 'Une sous-catégorie porte déjà ce nom dans cette catégorie.');
        }

        $this->model->renameSubcategory($id, $name);

        return $this->ok(200, 'Sous-catégorie renommée.');
    }

    // ------------------------------------------------------------------ suppression (seulement si vide)

    public function deleteCategory(int $id, int $adminId): array
    {
        $category = $this->model->findCategory($id);
        if (!$category) {
            return $this->fail(404, 'Catégorie introuvable.');
        }

        $count = $this->model->countSubcategories($id);
        if ($count > 0) {
            return $this->fail(409, "Cette catégorie contient $count sous-catégorie(s) : supprimez-les ou déplacez-les d'abord.", ['subcategory_count' => $count]);
        }

        $this->model->deleteCategory($id);
        SecurityLog::record(SecurityLog::CATEGORY_DELETED, $adminId, null, ['type' => 'category', 'id' => $id, 'name' => $category['name']]);

        return $this->ok(200, 'Catégorie supprimée.');
    }

    public function deleteSubcategory(int $id, int $adminId): array
    {
        $subcategory = $this->model->findSubcategory($id);
        if (!$subcategory) {
            return $this->fail(404, 'Sous-catégorie introuvable.');
        }

        $count = $this->model->countProducts($id);
        if ($count > 0) {
            return $this->fail(409, "Cette sous-catégorie contient $count produit(s), même désactivé(s) : déplacez-les d'abord.", ['product_count' => $count]);
        }

        $this->model->deleteSubcategory($id);
        SecurityLog::record(SecurityLog::CATEGORY_DELETED, $adminId, null, ['type' => 'subcategory', 'id' => $id, 'name' => $subcategory['name']]);

        return $this->ok(200, 'Sous-catégorie supprimée.');
    }

    // ------------------------------------------------------------------ réponses

    private function ok(int $code, ?string $message, ?array $data = null): array
    {
        return array_filter(['success' => true, 'code' => $code, 'message' => $message, 'data' => $data], fn($value) => $value !== null);
    }

    private function fail(int $code, string $message, ?array $data = null): array
    {
        return array_filter(['success' => false, 'code' => $code, 'message' => $message, 'data' => $data], fn($value) => $value !== null);
    }
}
