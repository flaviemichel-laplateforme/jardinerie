<?php

namespace App\Controllers;

use App\Services\AuthService;

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

        // 1. GESTION DES MÉTHODES HTTP EN PRIORITÉ
        // Gestion de la requête de pré-vérification du navigateur (Preflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Méthode non autorisée, POST requis."]);
            return;
        }

        // 2. LECTURE ET DÉCODAGE DU JSON (Une seule fois)
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);

        // 3. SÉCURITÉ : Vérification du format
        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Format de données invalide. JSON attendu."]);
            return;
        }

        // 4. VALIDATION DE SURFACE (Champs obligatoires)
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

        // 5. APPEL AU SERVICE (Logique métier)
        $result = $this->authService->register($data);

        // 6. GESTION DE L'ÉCHEC (Ex: email déjà pris)
        if (!$result['success']) {
            http_response_code($result['code']);
            echo json_encode([
                "success" => false,
                "message" => $result['message']
            ]);
            return;
        }

        // 7. SUCCÈS : Configuration et envoi du Cookie HttpOnly
        $cookieOptions = [
            'expires' => time() + (3600 * 24 * 7), // Expire dans 7 jours
            'path' => '/',
            'domain' => 'localhost',
            'secure' => false, // À passer à true en production (HTTPS)
            'httponly' => true, // Le bouclier anti-XSS
            'samesite' => 'Lax'
        ];

        setcookie('jardinerie_session', $result['data']['sessionToken'], $cookieOptions);

        // 8. RÉPONSE JSON FINALE AU FRONT-END
        http_response_code($result['code']); // Code 201 Created
        echo json_encode([
            "success" => true,
            "message" => "Compte créé avec succès.",
            "data" => [
                "user" => $result['data']['user']
            ]
        ]);
    }
}
