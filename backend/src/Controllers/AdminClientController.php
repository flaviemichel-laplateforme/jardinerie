<?php

namespace App\Controllers;

use App\Services\AdminClientService;
use App\Middlewares\AdminMiddleware;

class AdminClientController
{
    public function __construct(
        private AdminClientService $service = new AdminClientService()
    ) {}

    /**
     * GET /api/admin/clients
     */
    public function index(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $search = $_GET['search'] ?? null;
        $role   = $_GET['role'] ?? 'tous';
        $page   = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit  = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;

        $result = $this->service->getClients($search, $role, $page, $limit);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * GET /api/admin/clients/{id}
     */
    public function show(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $result = $this->service->getClientDetails($id);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * PATCH /api/admin/clients/{id}/role
     */
    public function updateRole(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AdminMiddleware::authenticate();

        $data = json_decode(file_get_contents("php://input"), true);
        $role = $data['role'] ?? null;

        $result = $this->service->updateRole($id, $role, (int) $payload['id']);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/admin/clients/{id}/anonymize
     */
    public function anonymize(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $result = $this->service->anonymizeClient($id);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/admin/clients/{id}/password-reset
     */
    public function sendPasswordReset(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $result = $this->service->sendPasswordResetLink($id);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
