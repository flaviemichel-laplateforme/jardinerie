<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Core\JwtHelper;

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

        if (!$result['success']) {
            http_response_code($result['code']);
            echo json_encode([
                "success" => false,
                "message" => $result['message']
            ]);
            return;
        }

        $cookieOptions = [
            'expires' => time() + (3600 * 24 * 7),
            'path' => '/',
            'domain' => 'localhost',
            'secure' => false, // Passer à true en HTTPS
            'httponly' => true,
            'samesite' => 'Lax'
        ];

        setcookie('jardinerie_session', $result['data']['sessionToken'], $cookieOptions);

        http_response_code($result['code']);
        echo json_encode([
            "success" => true,
            "message" => "Compte créé avec succès.",
            "data" => [
                "user" => $result['data']['user']
            ]
        ]);
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

            // CORRECTION ICI : On renvoie TOUT le contenu de $result (y compris notre bloc 'debug')
            echo json_encode($result);

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

    /**
     * Point d'entrée pour vérifier la session active (GET /api/auth/me)
     */
    public function me(): void
    {
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Méthode non autorisée, GET requis."]);
            return;
        }

        // 1. Vérification de la présence du cookie
        $token = $_COOKIE['jardinerie_session'] ?? null;

        if (!$token) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Non authentifié."]);
            return;
        }

        // 2. Vérification et décodage du JWT via le JwtHelper
        $secret = $_ENV['JWT_SECRET'] ?? 'default_secret';
        $payload = JwtHelper::verify($token, $secret);

        if (!$payload) {
            // Token invalide ou expiré, on supprime le cookie corrompu
            setcookie('jardinerie_session', '', time() - 3600, '/');
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Session invalide ou expirée."]);
            return;
        }

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
}
