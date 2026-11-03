<?php

namespace App\Controllers;

use App\Middlewares\AdminMiddleware;
use App\Services\AdminSoilService;

/**
 * Nature du sol (/api/admin/soil-types) et pH du sol (/api/admin/soil-ph) : une route par liste, la liste n'est jamais lue dans l'URL.
 */
class AdminSoilController
{
    public function __construct(
        private AdminSoilService $service = new AdminSoilService()
    ) {}

    /** GET /api/admin/soils : les deux listes, avec le nombre de plantes qui utilisent chaque valeur */
    public function index(): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->all());
    }

    public function createType(): void
    {
        $this->create('type');
    }

    public function createPh(): void
    {
        $this->create('ph');
    }

    public function renameType(int $id): void
    {
        $this->rename('type', $id);
    }

    public function renamePh(int $id): void
    {
        $this->rename('ph', $id);
    }

    public function deleteType(int $id): void
    {
        $this->delete('type', $id);
    }

    public function deletePh(int $id): void
    {
        $this->delete('ph', $id);
    }

    private function create(string $kind): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->create($kind, $this->body()['name'] ?? null));
    }

    private function rename(string $kind, int $id): void
    {
        AdminMiddleware::authenticate();
        $this->respond($this->service->rename($kind, $id, $this->body()['name'] ?? null));
    }

    private function delete(string $kind, int $id): void
    {
        $payload = AdminMiddleware::authenticate();
        $this->respond($this->service->delete($kind, $id, (int) $payload['id']));
    }

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
