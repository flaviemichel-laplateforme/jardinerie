<?php

namespace App\Controllers;

use App\Models\AdminProductModel;
use App\Middlewares\AdminMiddleware;
use App\Services\AdminProductService;

class AdminProductController
{
    public function __construct(
        private AdminProductModel $model = new AdminProductModel(),
        private AdminProductService $service = new AdminProductService()
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
            $this->respond(['code' => 400, 'message' => 'Données invalides.', 'errors' => ['Format JSON invalide.']]);
            return;
        }

        $this->respond($this->service->create($data));
    }

    /**
     * PATCH /api/admin/products/{id}
     * Seuls les champs envoyés sont vérifiés et modifiés.
     */
    public function update(int $id): void
    {
        AdminMiddleware::authenticate();

        $data = json_decode(file_get_contents("php://input"), true);

        $this->respond($this->service->update($id, is_array($data) ? $data : []));
    }

    /**
     * DELETE /api/admin/products/{id}
     * Suppression logique (soft delete) — is_active = 0
     */
    public function destroy(int $id): void
    {
        AdminMiddleware::authenticate();

        // Existence vérifiée à part : désactiver un produit déjà désactivé ne change aucune ligne, ce n'est pas pour autant un 404
        if (!$this->model->findById($id)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Produit introuvable.'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->model->softDelete($id);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Produit désactivé avec succès.'
        ], JSON_UNESCAPED_UNICODE);
    }

    /** Réponse JSON d'après le résultat du service (success déduit du code). */
    private function respond(array $result): void
    {
        $code = $result['code'];
        unset($result['code']);

        http_response_code($code);
        echo json_encode(['success' => $code < 400, ...$result], JSON_UNESCAPED_UNICODE);
    }
}
