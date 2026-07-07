<?php

namespace App\Controllers;

use App\Services\AdminUploadService;
use App\Middlewares\AdminMiddleware;

class AdminUploadController
{
    public function __construct(
        private AdminUploadService $uploadService = new AdminUploadService()
    ) {}

    /**
     * POST /api/admin/upload
     * Reçoit un fichier image, le valide et le stocke.
     */
    public function store(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        if (empty($_FILES['image'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Aucun fichier reçu. Envoyez le fichier sous la clé "image".'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $url = $this->uploadService->store($_FILES['image']);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Image uploadée avec succès.',
                'data'    => ['url' => $url]
            ], JSON_UNESCAPED_UNICODE);
        } catch (\InvalidArgumentException $e) {
            // Erreur métier : fichier invalide (taille, format)
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        } catch (\RuntimeException $e) {
            // Erreur technique : écriture disque impossible
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
