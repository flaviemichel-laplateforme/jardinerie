<?php

namespace App\Services;

use App\Core\ProductPolicy;
use App\Models\AdminProductModel;
use App\Models\SoilModel;

/**
 * Création et modification d'un produit depuis l'admin.
 *
 * ProductPolicy vérifie la FORME des données (sans base de données) ; ce service vérifie ce qui demande la base :
 * références existantes (sous-catégorie, TVA, critères, sols), fiche botanique autorisée par le rayon, image réellement déposée.
 * Il supprime aussi du disque une image remplacée qu'aucun produit n'utilise plus.
 *
 * Résultat : ['code' => 2xx|400|404|409, 'message' => ..., 'errors' => [...] (400), 'data' => [...] (201)]
 */
class AdminProductService
{
    private const PUBLIC_DIR = __DIR__ . '/../../public/';

    public function __construct(
        private AdminProductModel $model = new AdminProductModel(),
        private SoilModel $soils = new SoilModel()
    ) {}

    /** @param int|null $adminId auteur, pour l'historique du stock */
    public function create(array $data, ?int $adminId = null): array
    {
        $data   = $this->trimName($data);
        $errors = ProductPolicy::validate($data, true);
        if ($errors === []) {
            $errors = $this->checkReferences($data, null);
        }
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            $id = $this->model->create($data, $adminId);
        } catch (\PDOException $e) {
            return $this->duplicateSkuOr($e);
        }

        return ['code' => 201, 'message' => 'Produit créé avec succès.', 'data' => ['id' => $id]];
    }

    public function update(int $id, array $data, ?int $adminId = null): array
    {
        $current = $this->model->findById($id);
        if (!$current) {
            return ['code' => 404, 'message' => 'Produit introuvable.'];
        }

        if ($data === []) {
            return ['code' => 400, 'message' => 'Aucune donnée fournie.'];
        }

        $data   = $this->trimName($data);
        $errors = ProductPolicy::validate($data, false, $current);
        if ($errors === []) {
            $errors = $this->checkReferences($data, $current);
        }
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            $this->model->update($id, $data, $adminId);
        } catch (\PDOException $e) {
            return $this->duplicateSkuOr($e);
        }

        $this->deleteReplacedImages($data, $current);

        return ['code' => 200, 'message' => 'Produit mis à jour avec succès.'];
    }

    /**
     * Vérifications qui demandent la base (une fois la forme validée).
     * @param array|null $current produit enregistré (modification) ou null (création)
     * @return string[]
     */
    private function checkReferences(array $data, ?array $current): array
    {
        $errors = [];

        if (array_key_exists('tax_id', $data) && !$this->model->taxExists((int) $data['tax_id'])) {
            $errors[] = "Ce taux de TVA n'existe pas.";
        }

        $subcategoryId = array_key_exists('subcategory_id', $data) ? (int) $data['subcategory_id'] : (int) ($current['subcategory_id'] ?? 0);
        $allowsSheet   = $this->model->subcategoryAllowsPlantSheet($subcategoryId);

        if ($allowsSheet === null) {
            $errors[] = "Cette sous-catégorie n'existe pas.";
        } else {
            $plant      = $data['plant'] ?? null;
            $sendsSheet = is_array($plant) && $plant !== [];
            $dropsSheet = array_key_exists('plant', $data) && $plant === null;

            if ($sendsSheet && !$allowsSheet) {
                $errors[] = "Le rayon de cette sous-catégorie n'a pas de fiche botanique.";
            } elseif (!$allowsSheet && !empty($current['plant_id']) && !$dropsSheet) {
                $errors[] = "Ce produit a une fiche botanique, que ce rayon n'accepte pas : supprimez-la pour le déplacer ici.";
            }

            if ($sendsSheet) {
                $errors = array_merge($errors, $this->checkSheetLists($plant));
            }
        }

        foreach (ProductPolicy::IMAGE_FIELDS as $field => $label) {
            $url = isset($data[$field]) && is_string($data[$field]) ? trim($data[$field]) : '';
            if ($url !== '' && $url !== ($current[$field] ?? null) && !is_file(self::PUBLIC_DIR . $url)) {
                $errors[] = "$label est introuvable : envoyez-la à nouveau.";
            }
        }

        return $errors;
    }

    /** @return string[] */
    private function checkSheetLists(array $plant): array
    {
        $errors = [];

        if ($this->model->unknownCriteria(ProductPolicy::idList($plant, 'criteria')) !== []) {
            $errors[] = "Un des critères choisis n'existe pas.";
        }
        if ($this->soils->unknownIds('type', ProductPolicy::idList($plant, 'soil_type_ids')) !== []) {
            $errors[] = "Une des natures de sol choisies n'existe pas.";
        }
        if ($this->soils->unknownIds('ph', ProductPolicy::idList($plant, 'soil_ph_ids')) !== []) {
            $errors[] = "Un des pH de sol choisis n'existe pas.";
        }

        return $errors;
    }

    /**
     * Image remplacée ou retirée : son fichier est supprimé s'il a été déposé par l'admin et qu'aucun produit ne l'utilise plus.
     * Sans conséquence en cas d'échec (le fichier reste simplement sur le disque).
     */
    private function deleteReplacedImages(array $data, array $current): void
    {
        foreach (array_keys(ProductPolicy::IMAGE_FIELDS) as $field) {
            $old = $current[$field] ?? null;
            if (!array_key_exists($field, $data) || !is_string($old) || $old === '') {
                continue;
            }

            $new = is_string($data[$field]) ? trim($data[$field]) : null;
            if ($new === $old || !preg_match(ProductPolicy::IMAGE_URL_PATTERN, $old) || $this->model->isImageUsed($old)) {
                continue;
            }

            $path = self::PUBLIC_DIR . $old;
            if (is_file($path) && !@unlink($path)) {
                error_log("AdminProductService : image remplacée non supprimée ($old)");
            }
        }
    }

    private function trimName(array $data): array
    {
        if (isset($data['name']) && is_string($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        return $data;
    }

    /** @param string[] $errors */
    private function invalid(array $errors): array
    {
        return ['code' => 400, 'message' => 'Données invalides.', 'errors' => $errors];
    }

    /** Erreur MySQL 1062 (valeur en double) sur l'index unique de la référence ; toute autre erreur remonte. */
    private function duplicateSkuOr(\PDOException $e): array
    {
        if (($e->errorInfo[1] ?? null) === 1062 && str_contains($e->getMessage(), 'sku_UNIQUE')) {
            return ['code' => 409, 'message' => 'Cette référence (SKU) est déjà utilisée par un autre produit.'];
        }

        throw $e;
    }
}
