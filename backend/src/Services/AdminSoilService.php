<?php

namespace App\Services;

use App\Core\CatalogNamePolicy;
use App\Core\SecurityLog;
use App\Models\SoilModel;

/**
 * Listes « nature du sol » ($kind = 'type') et « pH du sol » ($kind = 'ph') gérées depuis l'admin.
 * Mêmes règles que les catégories : nom de 1 à 100 caractères, unique dans sa liste, suppression refusée tant qu'une plante l'utilise.
 */
class AdminSoilService
{
    private const LABELS = [
        'type' => ['one' => 'Cette nature de sol', 'taken' => 'Une nature de sol porte déjà ce nom.', 'created' => 'Nature de sol ajoutée.', 'log' => 'soil_type'],
        'ph'   => ['one' => 'Ce pH de sol', 'taken' => 'Un pH de sol porte déjà ce nom.', 'created' => 'pH de sol ajouté.', 'log' => 'soil_ph'],
    ];

    public function __construct(
        private SoilModel $model = new SoilModel()
    ) {}

    public function all(): array
    {
        return ['success' => true, 'code' => 200, 'data' => ['soil_types' => $this->model->all('type'), 'soil_ph' => $this->model->all('ph')]];
    }

    public function create(string $kind, mixed $name): array
    {
        if (($error = CatalogNamePolicy::validate($name)) !== null) {
            return $this->fail(400, $error);
        }

        $name = CatalogNamePolicy::clean($name);
        if ($this->model->nameTaken($kind, $name)) {
            return $this->fail(409, self::LABELS[$kind]['taken']);
        }

        return ['success' => true, 'code' => 201, 'message' => self::LABELS[$kind]['created'], 'data' => ['id' => $this->model->create($kind, $name)]];
    }

    public function rename(string $kind, int $id, mixed $name): array
    {
        if (!$this->model->find($kind, $id)) {
            return $this->fail(404, self::LABELS[$kind]['one'] . ' est introuvable.');
        }
        if (($error = CatalogNamePolicy::validate($name)) !== null) {
            return $this->fail(400, $error);
        }

        $name = CatalogNamePolicy::clean($name);
        if ($this->model->nameTaken($kind, $name, $id)) {
            return $this->fail(409, self::LABELS[$kind]['taken']);
        }

        $this->model->rename($kind, $id, $name);

        return ['success' => true, 'code' => 200, 'message' => 'Nom modifié.'];
    }

    public function delete(string $kind, int $id, int $adminId): array
    {
        $item = $this->model->find($kind, $id);
        if (!$item) {
            return $this->fail(404, self::LABELS[$kind]['one'] . ' est introuvable.');
        }

        if ($item['plant_count'] > 0) {
            return ['success' => false, 'code' => 409, 'message' => self::LABELS[$kind]['one'] . " est utilisé par {$item['plant_count']} plante(s) : retirez-le de leur fiche d'abord.", 'data' => ['plant_count' => $item['plant_count']]];
        }

        $this->model->delete($kind, $id);
        SecurityLog::record(SecurityLog::CATEGORY_DELETED, $adminId, null, ['type' => self::LABELS[$kind]['log'], 'id' => $id, 'name' => $item['name']]);

        return ['success' => true, 'code' => 200, 'message' => 'Supprimé.'];
    }

    private function fail(int $code, string $message): array
    {
        return ['success' => false, 'code' => $code, 'message' => $message];
    }
}
