<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Middlewares\AuthMiddleware;
use App\Core\PasswordPolicy;
use App\Core\NamePolicy;
use App\Core\Input;
use App\Core\SessionCookie;

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
        $payload = AuthMiddleware::authenticate();
        $data = Input::json() ?? [];

        $firstName = Input::string($data, 'first_name', 100);
        $lastName  = Input::string($data, 'last_name', 100);

        if (empty($firstName) || empty($lastName) || empty($data['email'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Les champs Prénom, nom, email sont obligatoires.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $email = Input::email($data);
        if ($email === null) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Adresse email invalide.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        foreach ([$firstName, $lastName] as $name) {
            $nameError = NamePolicy::validate($name);
            if ($nameError) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $nameError], JSON_UNESCAPED_UNICODE);
                return;
            }
        }

        $updated = $this->userModel->update($payload['id'], $firstName, $lastName, $email);

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
        $payload = AuthMiddleware::authenticate();
        $data = Input::json() ?? [];

        $currentPassword = Input::string($data, 'current_password', 200, trim: false);
        $newPassword     = Input::string($data, 'new_password', 200, trim: false);
        $confirmPassword = Input::string($data, 'confirm_new_password', 200, trim: false);

        if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Mot de passe actuel et nouveau mot de passe requis'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $user = $this->userModel->findById($payload['id']);

        $passwordError = PasswordPolicy::validate($newPassword, $user['email'] ?? null);
        if ($passwordError) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $passwordError
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($confirmPassword !== $newPassword) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Le nouveau mot de passe et confirmation nouveau mot de passe doivent être identiques'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!$user || !password_verify($currentPassword, $user['password'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->userModel->updatePassword($payload['id'], $newPassword);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès.'
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * GET api/me/dashboard
     * Données agrégées pour le tableau de bord client.
     */
    public function dashboard(): void
    {
        $payload = AuthMiddleware::authenticate();
        $user = $this->userModel->findById($payload['id']);

        if (!$user) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Utilisateur introuvalbe.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $orderModel = new \App\Models\OrderModel();
        $dashboardData = $orderModel->getDashboardData($payload['id']);

        unset($user['password']);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'user' => $user,
                'total_orders' => $dashboardData['total_orders'],
                'last_order' => $dashboardData['last_order'],
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * DELETE /api/me
     * Anonymise les données personnelles (droit à l'oubli RGPD).
     * Déconnecte l'utilisateur après l'opération.
     * Le front doit envoyer { "confirm": true } pour éviter toute suppression accidentelle.
     */
    public function delete(): void
    {
        $payload  = AuthMiddleware::authenticate();
        $rawInput = file_get_contents("php://input");
        $data     = json_decode($rawInput, true);

        // Double protection : confirmation explicite obligatoire
        if (empty($data['confirm']) || $data['confirm'] !== true) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Confirmation requise pour supprimer le compte.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $anonymized = $this->userModel->anonymize($payload['id']);

        if (!$anonymized) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la suppression du compte.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        // Supprimer le cookie de session côté serveur
        SessionCookie::clear();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Votre compte a été supprimé. Vos données personnelles ont été effacées conformément au RGPD.'
        ], JSON_UNESCAPED_UNICODE);
    }
}
