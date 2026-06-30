<?php

namespace App\Controllers;

use App\Models\AddressModel;
use App\Middlewares\AuthMiddleware;

class AddressController
{
    public function __construct(
        private AddressModel $addressModel = new AddressModel()
    ) {}

    /**
     * GET /api/addresses
     * Liste les adresses de l'utilisateur connecté.
     */
    public function index(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();

        $addresses = $this->addressModel->findByUserId($payload['id']);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data" => [
                "addresses" => $addresses
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/addresses
     * Crée une nouvelle adresse pour l'utilisateur connecté.
     */
    public function store(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();

        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        $errors = $this->validate($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Champs invalides.",
                "errors" => $errors
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $newId = $this->addressModel->create($payload['id'], $data);

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Adresse créée avec succès.",
            "data" => [
                "id" => $newId
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * PUT /api/addresses/{id}
     * Met à jour une adresse existante, appartenant obligatoirement à l'utilisateur connecté.
     */
    public function update(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();

        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        $errors = $this->validate($data);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Champs invalides.",
                "errors" => $errors
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $updated = $this->addressModel->update($id, $payload['id'], $data);

        if (!$updated) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Adresse introuvable",
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Adresse mise à jour avec succès."
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * DELETE /api/addresses/{id}
     */
    public function destroy(int $id): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();

        try {
            $deleted = $this->addressModel->delete($id, $payload['id']);

            if (!$deleted) {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Adresse introuvable."], JSON_UNESCAPED_UNICODE);
                return;
            }

            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Adresse supprimée avec succès."], JSON_UNESCAPED_UNICODE);
        } catch (\PDOException $e) {
            // Code 1451 = violation de clé étrangère (l'adresse est encore référencée ailleurs)
            if ($e->errorInfo[1] === 1451) {
                http_response_code(409);
                echo json_encode([
                    "success" => false,
                    "message" => "Cette adresse est liée à une commande existante et ne peut pas être supprimée."
                ], JSON_UNESCAPED_UNICODE);
                return;
            }
            throw $e;
        }
    }
    /**
     * Validation minimale des champs obligatoires d'une adresse.
     * Privée : c'est un détail d'implémentation interne, partagé entre store() et update().
     */
    private function validate(?array $data): array
    {
        $errors = [];
        $requiredFields = [
            'recipient_first_name',
            'recipient_last_name',
            'street',
            'postal_code',
            'city',
            'phone'
        ];

        if (!is_array($data)) {
            return ['Format de données invalide. JSON attendu.'];
        }

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $errors[] = "Le champ '$field' est obligatoire.";
            }
        }

        return $errors;
    }
}
