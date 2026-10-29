<?php

namespace App\Controllers;

use App\Core\ProductPolicy;
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
        AdminMiddleware::authenticate();

        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            $this->respondInvalid(['Format JSON invalide.']);
            return;
        }

        $data   = $this->trimName($data);
        $errors = ProductPolicy::validate($data, true);

        if (!empty($errors)) {
            $this->respondInvalid($errors);
            return;
        }

        try {
            $id = $this->model->create($data);
        } catch (\PDOException $e) {
            if ($this->isDuplicateSku($e)) {
                $this->respondDuplicateSku();
                return;
            }
            throw $e;
        }

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

        // Seuls les champs envoyés sont vérifiés (PATCH). Avant, la modification n'était pas validée du tout.
        $data   = $this->trimName($data);
        $errors = ProductPolicy::validate($data, false);

        if (!empty($errors)) {
            $this->respondInvalid($errors);
            return;
        }

        try {
            $this->model->update($id, $data);
        } catch (\PDOException $e) {
            if ($this->isDuplicateSku($e)) {
                $this->respondDuplicateSku();
                return;
            }
            throw $e;
        }

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

    /** Nettoie les espaces autour du nom : ils comptent dans la limite et n'ont aucun intérêt à être enregistrés. */
    private function trimName(array $data): array
    {
        if (isset($data['name']) && is_string($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        return $data;
    }

    /** Erreur MySQL 1062 (valeur en double) sur l'index unique de la référence. */
    private function isDuplicateSku(\PDOException $e): bool
    {
        return ($e->errorInfo[1] ?? null) === 1062 && str_contains($e->getMessage(), 'sku_UNIQUE');
    }

    private function respondDuplicateSku(): void
    {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Cette référence (SKU) est déjà utilisée par un autre produit.'
        ], JSON_UNESCAPED_UNICODE);
    }

    /** @param string[] $errors */
    private function respondInvalid(array $errors): void
    {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Données invalides.',
            'errors'  => $errors
        ], JSON_UNESCAPED_UNICODE);
    }
}
