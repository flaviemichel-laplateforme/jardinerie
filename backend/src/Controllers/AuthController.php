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
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Méthode non autorisée, POST requis."]);
            return;
        }

        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Format de données invalide. JSON attendu."]);
            return;
        }

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

        $result = $this->authService->register($data);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }


    /**
     * Point d'entrée pour la connexion (POST /api/auth/login)
     */
    public function login(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Méthode non autorisée, POST requis."]);
            return;
        }

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
        $cookieOptions = [
            'expires' => time() + 86400, // Expire dans 24h
            'path' => '/',
            'domain' => 'localhost',
            'secure' => false, // Passer à true en HTTPS
            'httponly' => true,
            'samesite' => 'Lax'
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
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['success' => false, "message" => "Méthode non autorisée, GET requis."]);
            return;
        }

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
        header('Content-Type: application/json; Charset-UTF-8');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        setcookie('jardinerie_session', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => 'localhost',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'LAX'
        ]);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Déconnexion réussie.'
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Point d'entrée pour la réinitialisation du mot de passe (POST /api/auth/reset-password)
     */
    public function resetPassword(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

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
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

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
