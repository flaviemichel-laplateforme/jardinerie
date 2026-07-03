<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Middlewares\AuthMiddleware;

class UserController
{
    public function __construct(
        private Usermodel $userModel = new UserModel()
    ) {}

    /**
     * GET /api/me
     * Retourne le profil de l'utilisateur connecté
     */
    public function show(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();
        $user = $this->userModel->findById($payload['id']);

        if (!$user) {
            http_response_code(404);
            echo json_encode(
                ['success' => false, 'message' => 'Utilisateur introuvable'],
                JSON_UNESCAPED_UNICODE
            );
            return;
        }

        // On ne renvoie jamais le mot de passe
        unset($user['password']);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => ['user' => $user]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * PUT /api/me/profile
     * Met à jour les informations du profil (prénom, nom, email).
     */
    public function update(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Les champs Prénom, non, email sont obligatoires.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Adresse email invalide.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $updated = $this->userModel->update(
            $payload['id'],
            $data['first_name'],
            $data['last_name'],
            $data['email']
        );

        if (!$updated) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Cet email est déjà utilisé par un autre compte.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Profil mis à jour avec succès!'
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * PUT api/me/password
     * Change le mot de passe de l'utilisateur connecté
     */
    public function updatePassword(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $payload = AuthMiddleware::authenticate();
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        if (empty($data['current_password']) || empty($data['new_password']) || empty($data['confirm_new_password'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Mot de passe actuel et nouveau mot de passe requis'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (strlen($data['new_password']) < 8) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Le mot de passe doit contenir au moins 8 caractères minimum'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($data['confirm_new_password'] !== $data['new_password']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Le nouveau mot de passe et confirmation nouveau mot de passe doivent être identiques'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $user = $this->userModel->findById($payload['id']);

        if (!$user || !password_verify($data['current_password'], $user['password'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->userModel->updatePassword($payload['id'], $data['new_password']);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès.'
        ], JSON_UNESCAPED_UNICODE);
    }
}
