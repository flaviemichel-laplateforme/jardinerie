<?php

namespace App\Services;

use App\Models\UserModel;

class AuthService
{
    public function __construct(
        private UserModel $userModel = new UserModel()
    ) {}

    public function register(array $data): array
    {
        try {
            // 1. Règle métier : L'email existe-t-il déjà ?
            $existingUser = $this->userModel->getUserByEmail($data['email']);
            if ($existingUser) {
                return [
                    'success' => false,
                    'code' => 409,
                    'message' => "Cette adresse email est déjà utilisée."
                ];
            }

            // 2. Hachage du mot de passe
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

            // 3. Appel au modèle pour l'insertion (Attention à l'ordre de vos paramètres !)
            $userId = $this->userModel->create(
                $data['last_name'],
                $data['first_name'],
                $data['email'],
                $hashedPassword
            );

            // 4. Génération d'un token de session
            $sessionToken = bin2hex(random_bytes(64));

            // 5. LE FAMEUX RETOUR STRUCTURÉ (Pattern Result attendu par le Contrôleur)
            return [
                'success' => true,
                'code' => 201,
                'data' => [
                    'sessionToken' => $sessionToken,
                    'user' => [
                        'id' => $userId,
                        'first_name' => $data['first_name'],
                        'last_name' => $data['last_name'],
                        'email' => $data['email']
                    ]
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'code' => 500,
                'message' => "Erreur interne technique." // Enlevez $e->getMessage() en prod
            ];
        }
    }

    /**
     * Logique de connexion et génération du JWT
     */
    public function login(string $email, string $password): array
    {
        // 1. Récupération de l'utilisateur par email (via votre UserModel)
        $user = $this->userModel->getUserByEmail($email);

        // 2. Vérification du mot de passe
        if (!$user || !password_verify($password, $user['password'])) {
            return [
                'success' => false,
                'code' => 401,
                'message' => 'Identifiants incorrects.'
            ];
        }

        // 3. Création du Payload pour le JWT
        $secret = $_ENV['JWT_SECRET'] ?? 'default_secret';
        $payload = [
            'id' => $user['id'],
            'role' => $user['role'] ?? 'customer'
        ];

        // Génération du JWT (expire dans 24h)
        $token = \App\Core\JwtHelper::generate($payload, $secret, 86400);

        // Suppression du mot de passe avant l'envoi au Front-end
        unset($user['password']);

        return [
            'success' => true,
            'code' => 200,
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ];
    }

    /**
     * Récupération sécurisée d'un utilisateur par son ID
     */
    public function getUserById(int $id): array
    {
        $user = $this->userModel->findById($id);

        if (!$user) {
            return [
                'success' => false,
                'code' => 404,
                'message' => 'Utilisateur introuvable.'
            ];
        }

        unset($user['password']);

        return [
            'success' => true,
            'code' => 200,
            'data' => [
                'user' => $user
            ]
        ];
    }
}
