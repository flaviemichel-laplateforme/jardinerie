<?php

namespace App\Controllers;

use App\Core\ApiResponse;
use App\Core\RateLimiter;
use App\Core\SecurityLog;
use App\Core\UploadUnavailableException;
use App\Services\AdminUploadService;
use App\Middlewares\AdminMiddleware;

class AdminUploadController
{
    /** 60 images par heure et par administrateur : largement assez pour saisir un catalogue, pas pour remplir le disque */
    private const MAX_PER_HOUR = 60;

    private RateLimiter $limiter;

    public function __construct(
        private AdminUploadService $uploadService = new AdminUploadService(),
        ?RateLimiter $limiter = null
    ) {
        $this->limiter = $limiter ?? RateLimiter::fromEnvironment();
    }

    /**
     * POST /api/admin/upload (multipart/form-data, fichier sous la clé « image »)
     * Reçoit un fichier image, le valide, le ré-encode et le stocke.
     */
    public function store(): void
    {
        $payload = AdminMiddleware::authenticate();

        if (empty($_FILES['image'])) {
            $this->respond(400, 'Aucun fichier reçu. Envoyez le fichier sous la clé "image".');
            return;
        }

        $state = $this->limiter->attempt('admin_upload', (string) $payload['id'], self::MAX_PER_HOUR, 3600);
        if (!$state['allowed']) {
            if ($state['justBlocked']) {
                SecurityLog::record(SecurityLog::RATE_LIMITED, (int) $payload['id'], null, ['action' => 'admin_upload']);
            }
            ApiResponse::tooManyRequests($state['retryAfter']);
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
            // Fichier refusé (taille, format, dimensions) : le message est destiné à l'administrateur
            $this->respond(400, $e->getMessage());
        } catch (UploadUnavailableException $e) {
            error_log('AdminUploadController : ' . $e->getMessage());
            $this->respond(503, $e->getMessage());
        } catch (\RuntimeException $e) {
            // Erreur technique : écriture disque impossible
            error_log('AdminUploadController : ' . $e->getMessage());
            $this->respond(500, $e->getMessage());
        }
    }

    private function respond(int $code, string $message): void
    {
        http_response_code($code);
        echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    }
}
