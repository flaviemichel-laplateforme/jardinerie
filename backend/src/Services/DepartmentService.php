<?php

namespace App\Services;

use App\Models\DepartmentModel;


class DepartmentService
{
    public function __construct(
        private DepartmentModel $departmentModel = new DepartmentModel()
    ) {}

    public function getAllDepartments(): array
    {
        try {
            return $this->departmentModel->findAll();
        } catch (\Exception $e) {
            throw new \Exception("Erreur lors de la récupération des rayons: " . $e->getMessage());
        }
    }
}
