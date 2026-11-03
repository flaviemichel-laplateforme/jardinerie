<?php

namespace App\Services;

use App\Models\FilterModel;


class FilterService
{
    public function __construct(
        private FilterModel $filterModel = new FilterModel()
    ) {}

    public function getFiltersConfiguration(?string $type = null, ?string $categoryIds = null, bool $v2 = false): array
    {
        try {
            $filtersData = $this->filterModel->getAllFilters($type, $categoryIds, $v2);

            return [
                'success' => true,
                'data' => $filtersData
            ];
        } catch (\Exception $e) {
            error_log("Erreur FilterService : " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Impossible de charger la configuration des filtres."
            ];
        }
    }
}
