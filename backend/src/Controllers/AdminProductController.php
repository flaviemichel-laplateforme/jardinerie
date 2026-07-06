<?php

namespace App\Controllers;

use App\Models\AdminProductModel;
use App\Middlewares\AdminMiddleware;

class AdminProductController
{
    public function __construct(
        private AdminProductModel $model = new AdminProductModel()
    ) {}

    /**
     * GET /api/admin/products
     */
    public function index(): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $products = $this->model->findAll();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data'    => ['products' => $products]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * GET /api/admin/products/{id}
     */
    public function show(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $product = $this->model->findById($id);

        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Produit introuvable.'], JSON_UNESCAPED_UNICODE);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data'    => ['product' => $product]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/admin/products
     */
    public function store(): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $data   = json_decode(file_get_contents("php://input"), true);
        $errors = $this->validate($data);

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $errors
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $id = $this->model->create($data);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Produit créé avec succès.',
            'data'    => ['id' => $id]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * PATCH /api/admin/products/{id}
     */
    public function update(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        // Vérifier que le produit existe
        if (!$this->model->findById($id)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Produit introuvable.'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data) || empty($data)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Aucune donnée fournie.'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->model->update($id, $data);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Produit mis à jour avec succès.'
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * DELETE /api/admin/products/{id}
     * Suppression logique (soft delete) — is_active = 0
     */
    public function destroy(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $deleted = $this->model->softDelete($id);

        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Produit introuvable.'], JSON_UNESCAPED_UNICODE);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Produit désactivé avec succès.'
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Validation des champs obligatoires à la création.
     */
    private function validate(?array $data): array
    {
        $errors = [];

        if (!is_array($data)) {
            return ['Format JSON invalide.'];
        }

        $required = ['subcategory_id', 'tax_id', 'name', 'price_tax_incl'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $errors[] = "Le champ '$field' est obligatoire.";
            }
        }

        if (!empty($data['price_tax_incl']) && !is_numeric($data['price_tax_incl'])) {
            $errors[] = "Le prix doit être un nombre.";
        }

        if (!empty($data['stock_quantity']) && !is_int($data['stock_quantity'])) {
            $errors[] = "Le stock doit être un entier.";
        }

        return $errors;
    }
}
