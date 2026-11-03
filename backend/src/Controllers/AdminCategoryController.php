<?php

namespace App\Controllers;

use App\Services\AdminCategoryService;
use App\Middlewares\AdminMiddleware;

class AdminCategoryController
{
    public function __construct(
        private AdminCategoryService $service = new AdminCategoryService()
    ) {}

    /** GET /api/admin/categories : arbre complet, catégories vides comprises */
    public function tree(): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->getTree());
    }

    /** GET /api/admin/taxes */
    public function taxes(): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->getTaxes());
    }

    /** POST /api/admin/categories {department_id, name} */
    public function createCategory(): void
    {
        AdminMiddleware::authenticate();
        $data = $this->body();
        $this->respond($this->service->createCategory($data['department_id'] ?? null, $data['name'] ?? null));
    }

    /** POST /api/admin/subcategories {category_id, name} */
    public function createSubcategory(): void
    {
        AdminMiddleware::authenticate();
        $data = $this->body();
        $this->respond($this->service->createSubcategory($data['category_id'] ?? null, $data['name'] ?? null));
    }

    /** PATCH /api/admin/departments/{id} {name?, has_plant_sheet?} */
    public function updateDepartment(int $id): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->updateDepartment($id, $this->body()));
    }

    /** PATCH /api/admin/categories/{id} {name} */
    public function renameCategory(int $id): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->renameCategory($id, $this->body()['name'] ?? null));
    }

    /** PATCH /api/admin/subcategories/{id} {name} */
    public function renameSubcategory(int $id): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->renameSubcategory($id, $this->body()['name'] ?? null));
    }

    /** DELETE /api/admin/categories/{id} : refusé (409) tant qu'elle contient des sous-catégories */
    public function deleteCategory(int $id): void
    {
        $payload = AdminMiddleware::authenticate();
        $this->respond($this->service->deleteCategory($id, (int) $payload['id']));
    }

    /** DELETE /api/admin/subcategories/{id} : refusé (409) tant qu'elle contient des produits */
    public function deleteSubcategory(int $id): void
    {
        $payload = AdminMiddleware::authenticate();
        $this->respond($this->service->deleteSubcategory($id, (int) $payload['id']));
    }

    /** @return array<string, mixed> corps JSON, ou [] s'il est absent ou invalide */
    private function body(): array
    {
        $data = json_decode(file_get_contents("php://input"), true);

        return is_array($data) ? $data : [];
    }

    private function respond(array $result): void
    {
        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
