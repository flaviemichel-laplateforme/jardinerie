<?php

namespace App\Controllers;

use App\Services\DepartmentService;

class DepartmentController
{

    public function __construct(
        private DepartmentService $departmentService = new DepartmentService()
    ) {}

    public function index(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {

            $departments = $this->departmentService->getAllDepartments();

            http_response_code(200);
            echo json_encode([
                'status' => 200,
                'data' => $departments
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {

            http_response_code(500);
            echo json_encode([
                'status' => 500,
                'error' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
