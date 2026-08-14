<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Core\JwtHelper;
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
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Format de données invalide. JSON attendu."]);
            return;
        }

        // Nettoyage des espaces avant/après — un champ rempli uniquement d'espaces
        // ne doit pas être considéré comme valide.
        $data['first_name'] = trim($data['first_name'] ?? '');
        $data['last_name']  = trim($data['last_name'] ?? '');
        $data['email']      = trim($data['email'] ?? '');

        if (
            empty($data['first_name']) ||
            empty($data['last_name']) ||
            empty($data['email']) ||
            empty($data['password'])
        ) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Tous les champs sont obligatoires."
            ]);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Adresse email invalide."
            ]);
            return;
        }

        $result = $this->authService->register($data);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }


    /**
     * Point d'entrée pour la connexion (POST /api/auth/login)
     */
    public function login(): void
    {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        if (empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "L'adresse email et le mot de passe sont requis."
            ]);
            return;
        }

        // Appel au service pour vérifier les identifiants et générer le JWT
        $result = $this->authService->login($data['email'], $data['password']);

        if (!$result['success']) {
            http_response_code($result['code']);
            echo json_encode([
                "success" => false,
                "message" => $result['message']
            ]);
            return;
        }

        // Sécurisation JWT dans le cookie HttpOnly
        // En production, Front-end et Back-end sont sur des domaines différents (cross-site) :
        // le cookie doit être SameSite=None + Secure pour être accepté par le navigateur.
        $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';
        $cookieOptions = [
            'expires' => time() + 86400, // Expire dans 24h
            'path' => '/',
            'secure' => $isProduction,
            'httponly' => true,
            'samesite' => $isProduction ? 'None' : 'Lax'
        ];

        setcookie('jardinerie_session', $result['data']['token'], $cookieOptions);

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
            http_response_code($result['code']);
            echo json_encode(["success" => false, "message" => $result['message']]);
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
        $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';
        setcookie('jardinerie_session', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => $isProduction,
            'httponly' => true,
            'samesite' => $isProduction ? 'None' : 'Lax'
        ]);

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
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "L'adresse email est obligatoire."
            ]);
            return;
        }

        $result = $this->authService->requestPasswordReset($data['email']);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point d'entrée pour la réinitialisation du mot de passe (POST /api/auth/reset-password)
     */
    public function resetPassword(): void
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['token']) || empty($data['new_password'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Le jeton et le nouveau mot de passe sont obligatoires."
            ]);
            return;
        }

        $result = $this->authService->resetPassword($data['token'], $data['new_password']);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point d'entrée pour la vérification d'email (GET /api/auth/verify-email?token=...)
     */
    public function verifyEmail(): void
    {
        $token = $_GET['token'] ?? null;

        if (empty($token)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Le jeton de vérification est manquant."
            ]);
            return;
        }

        $result = $this->authService->verifyEmail($token);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }
}
