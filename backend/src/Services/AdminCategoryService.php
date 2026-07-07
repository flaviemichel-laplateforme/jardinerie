<?php

namespace App\Services;

use App\Models\AdminCategoryModel;

class AdminCategoryService
{
    public function __construct(
        private AdminCategoryModel $model = new AdminCategoryModel()
    ) {}

    public function getTree(): array
    {
        try {
            return [
                'success' => true,
                'code'    => 200,
                'data'    => ['tree' => $this->model->getTree()],
            ];
        } catch (\Exception $e) {
            error_log("AdminCategoryService::getTree : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => 'Impossible de charger les catégories.',
            ];
        }
    }

    public function getTaxes(): array
    {
        try {
            return [
                'success' => true,
                'code'    => 200,
                'data'    => ['taxes' => $this->model->getTaxes()],
            ];
        } catch (\Exception $e) {
            error_log("AdminCategoryService::getTaxes : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => 'Impossible de charger les taux de TVA.',
            ];
        }
    }

    public function createCategory(int $departmentId, string $name): array
    {
        if (empty(trim($name))) {
            return ['success' => false, 'code' => 400, 'message' => 'Le nom est obligatoire.'];
        }

        try {
            $id = $this->model->createCategory($departmentId, $name);
            return [
                'success' => true,
                'code'    => 201,
                'message' => 'Catégorie créée avec succès.',
                'data'    => ['id' => $id],
            ];
        } catch (\Exception $e) {
            error_log("AdminCategoryService::createCategory : " . $e->getMessage());
            return ['success' => false, 'code' => 500, 'message' => 'Erreur lors de la création.'];
        }
    }

    public function createSubcategory(int $categoryId, string $name): array
    {
        if (empty(trim($name))) {
            return ['success' => false, 'code' => 400, 'message' => 'Le nom est obligatoire.'];
        }

        try {
            $id = $this->model->createSubcategory($categoryId, $name);
            return [
                'success' => true,
                'code'    => 201,
                'message' => 'Sous-catégorie créée avec succès.',
                'data'    => ['id' => $id],
            ];
        } catch (\Exception $e) {
            error_log("AdminCategoryService::createSubcategory : " . $e->getMessage());
            return ['success' => false, 'code' => 500, 'message' => 'Erreur lors de la création.'];
        }
    }
}
