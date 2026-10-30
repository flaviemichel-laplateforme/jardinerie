<?php

namespace App\Controllers;

use App\Core\Input;
use App\Core\SessionCookie;
use App\Services\AuthService;
use App\Middlewares\AuthMiddleware;

class AuthController
{
    public function __construct(
        private AuthService $authService = new AuthService()
    ) {}

    /**
     * Point d'entrée pour l'inscription (POST /api/auth/register)
     */
    public function register(): void
    {
        $data = Input::json();
        if ($data === null) {
            $this->respond(400, "Format de données invalide. JSON attendu.");
            return;
        }

        // Chaque champ doit être du texte (un tableau JSON ferait planter trim()). Nettoyage des espaces avant/après :
        // un champ rempli uniquement d'espaces ne doit pas être considéré comme valide. Pas de trim sur le mot de passe.
        $firstName = Input::string($data, 'first_name', 100);
        $lastName  = Input::string($data, 'last_name', 100);
        $password  = Input::string($data, 'password', 200, trim: false);

        if (empty($firstName) || empty($lastName) || empty($data['email']) || empty($password)) {
            $this->respond(400, "Tous les champs sont obligatoires.");
            return;
        }

        $email = Input::email($data);
        if ($email === null) {
            $this->respond(400, "Adresse email invalide.");
            return;
        }

        $result = $this->authService->register([
            'first_name'   => $firstName,
            'last_name'    => $lastName,
            'email'        => $email,
            'password'     => $password,
            'gdpr_consent' => $data['gdpr_consent'] ?? false,
        ]);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point d'entrée pour la connexion (POST /api/auth/login)
     */
    public function login(): void
    {
        $data = Input::json() ?? [];

        // L'adresse n'est pas validée ici (juste normalisée) : un format invalide ne doit pas se distinguer d'un compte inconnu.
        $email    = Input::string($data, 'email', 254);
        $password = Input::string($data, 'password', 200, trim: false);

        if (empty($email) || empty($password)) {
            $this->respond(400, "L'adresse email et le mot de passe sont requis.");
            return;
        }

        // Appel au service pour vérifier les identifiants et générer le JWT
        $result = $this->authService->login(strtolower($email), $password);

        if (!$result['success']) {
            $this->respond($result['code'], $result['message']);
            return;
        }

        // Sécurisation JWT dans le cookie HttpOnly (attributs : voir SessionCookie)
        SessionCookie::set($result['data']['token']);

        http_response_code($result['code']); // Code 200 OK
        echo json_encode([
            "success" => true,
            "message" => "Connexion réussie.",
            "data" => [
                "user" => $result['data']['user']
            ]
        ]);
    }

    public function me(): void
    {
        $payload = AuthMiddleware::authenticate();

        // 3. Récupération des données utilisateur fraîches via le service
        $result = $this->authService->getUserById($payload['id']);

        if (!$result['success']) {
            $this->respond($result['code'], $result['message']);
            return;
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data" => [
                "user" => $result['data']['user']
            ]
        ]);
    }

    /**
     * POST /api/auth/logout
     * Supprime le cookie de session côté serveur.
     */
    public function logout(): void
    {
        SessionCookie::clear();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Déconnexion réussie.'
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point d'entrée pour la demande de réinitialisation de mot de passe (POST /api/auth/request-password-reset)
     */
    public function requestPasswordReset(): void
    {
        $email = Input::string(Input::json() ?? [], 'email', 254);

        if (empty($email)) {
            $this->respond(400, "L'adresse email est obligatoire.");
            return;
        }

        $result = $this->authService->requestPasswordReset(strtolower($email));

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point d'entrée pour la réinitialisation du mot de passe (POST /api/auth/reset-password)
     */
    public function resetPassword(): void
    {
        $data        = Input::json() ?? [];
        $token       = Input::string($data, 'token', 128);
        $newPassword = Input::string($data, 'new_password', 200, trim: false);

        if (empty($token) || empty($newPassword)) {
            $this->respond(400, "Le jeton et le nouveau mot de passe sont obligatoires.");
            return;
        }

        $result = $this->authService->resetPassword($token, $newPassword);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point d'entrée pour la vérification d'email (GET /api/auth/verify-email?token=...)
     */
    public function verifyEmail(): void
    {
        $token = is_string($_GET['token'] ?? null) ? $_GET['token'] : '';

        if ($token === '' || strlen($token) > 128) {
            $this->respond(400, "Le jeton de vérification est manquant.");
            return;
        }

        $result = $this->authService->verifyEmail($token);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    private function respond(int $code, string $message): void
    {
        http_response_code($code);
        echo json_encode(["success" => false, "message" => $message], JSON_UNESCAPED_UNICODE);
    }
}
