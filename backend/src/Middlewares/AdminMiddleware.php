<?php

namespace App\Middlewares;

class AdminMiddleware
{
    /**
     * Vérifie que la requête d'un utilisateur authentifié
     * avec le rôle 'admin'
     * 
     * Délègue la vérification JWT à AuthMiddleware pour ne pas dupliquer 
     * la logique de lecture du cookie de décodage
     * 
     * @return array Le payload JWT décodé (id, role, exp)
     */
    public static function authenticate(): array
    {
        // réutilisa AuthMiddleware pour la vérification du JWT
        // Si le cookie est absent ou invalide -> 401 automatique
        $payload = AuthMiddleware::authenticate();

        //Vérifie le rôle en plus de l'authentification
        if ($payload['role'] !== 'admin') {
            header("Content-type: application/json; charset=UTF-8");
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Accès refusé . Droits administrateur requis.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        return $payload;
    }
}
