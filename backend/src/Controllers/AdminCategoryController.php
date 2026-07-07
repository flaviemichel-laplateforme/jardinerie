<?php

namespace App\Controllers;

use App\Services\AdminCategoryService;
use App\Middlewares\AdminMiddleware;

class AdminCategoryController
{
    public function __construct(
        private AdminCategoryService $service = new AdminCategoryService()
    ) {}

    public function tree(): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $result = $this->service->getTree();
        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    public function taxes(): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $result = $this->service->getTaxes();
        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    public function createCategory(): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['department_id']) || empty($data['name'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'department_id et name sont obligatoires.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->service->createCategory(
            (int) $data['department_id'],
            (string) trim($data['name'])
        );

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    public function createSubcategory(): void
    {
        header("Content-Type: application/json; charset=UTF-8");
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        AdminMiddleware::authenticate();

        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['category_id']) || empty($data['name'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'category_id et name sont obligatoires.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->service->createSubcategory(
            (int) $data['category_id'],
            (string) trim($data['name'])
        );

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
