<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Middlewares\AuthMiddleware;
use App\Core\PasswordPolicy;
use App\Core\NamePolicy;
use App\Core\Input;
use App\Core\SessionCookie;
use App\Core\ApiResponse;
use App\Core\RateLimiter;
use App\Core\SecurityLog;
use App\Services\AuthService;

class UserController
{
    private RateLimiter $limiter;

    public function __construct(
        private UserModel $userModel = new UserModel(),
        private AuthService $authService = new AuthService(),
        ?RateLimiter $limiter = null
    ) {
        $this->limiter = $limiter ?? RateLimiter::fromEnvironment();
    }

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

        // On ne renvoie jamais le mot de passe ni les données internes de session
        $user = UserModel::withoutSecrets($user);

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

        $user = $this->userModel->findById($payload['id']);
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $message = 'Profil mis à jour avec succès!';

        // Changer d'adresse prend le contrôle du compte (« mot de passe oublié » part vers cette adresse) : le mot de passe
        // actuel est exigé, et l'adresse ne change qu'après confirmation depuis la nouvelle boîte mail. Les noms, eux,
        // se modifient librement. Le mot de passe est vérifié AVANT toute modification.
        if ($email !== strtolower($user['email'])) {
            $currentPassword = Input::string($data, 'current_password', 200, trim: false);

            if (empty($currentPassword)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => "Votre mot de passe actuel est requis pour changer d'adresse email."
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Cette route vérifie le mot de passe actuel : sans limite, une session volée permettrait de le deviner
            $attempt = $this->limiter->attempt('email_change_user', (string) $payload['id'], 5, 3600);
            if (!$attempt['allowed']) {
                if ($attempt['justBlocked']) {
                    SecurityLog::record(SecurityLog::RATE_LIMITED, (int) $payload['id'], null, ['action' => 'email_change_user']);
                }
                ApiResponse::tooManyRequests($attempt['retryAfter']);
                return;
            }

            $result = $this->authService->requestEmailChange((int) $payload['id'], $email, $currentPassword);

            if (!$result['success']) {
                http_response_code($result['code']);
                echo json_encode(['success' => false, 'message' => $result['message']], JSON_UNESCAPED_UNICODE);
                return;
            }

            $message = 'Profil mis à jour. ' . $result['message'];
        }

        // Les noms sont enregistrés avec l'adresse ACTUELLE : la nouvelle n'est appliquée qu'à la confirmation
        $this->userModel->update($payload['id'], $firstName, $lastName, $user['email']);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $message
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

        // Cette route vérifie le mot de passe actuel : sans limite, une session volée permettrait de le deviner
        $state = $this->limiter->check('password_change_user', (string) $payload['id'], 5, 900);
        if ($state['blocked']) {
            ApiResponse::tooManyRequests($state['retryAfter']);
            return;
        }

        if (!$user || !password_verify($currentPassword, $user['password'])) {
            $failure = $this->limiter->fail('password_change_user', (string) $payload['id'], 5, 900);
            if ($failure['justLocked']) {
                SecurityLog::record(SecurityLog::RATE_LIMITED, (int) $payload['id'], null, ['action' => 'password_change_user']);
            }

            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect.'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->userModel->updatePassword($payload['id'], $newPassword);
        $this->limiter->clear('password_change_user', (string) $payload['id']);
        SecurityLog::record(SecurityLog::PASSWORD_CHANGED, (int) $payload['id']);

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

        $user = UserModel::withoutSecrets($user);

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

        SecurityLog::record(SecurityLog::ACCOUNT_ANONYMIZED, (int) $payload['id']);
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
