<?php

namespace App\Services;

use App\Models\UserModel;

class AuthService
{
    public function __construct(

        private UserModel $userModel = new UserModel()
    ) {}
    /**
     * Traite l'inscription d'un utilisateur.
     * Retourne un tableau structuré (Pattern Result).
     */
    public function register(array $data): array
    {
        try {

            // 1. Règle métier : L'email existe-t-il déjà ?
            $existingUser = $this->userModel->getUserByEmail($data['email']);

            if ($existingUser) {
                return [
                    'success' => false,
                    'code' => 409, //Conflit
                    'message' => "Cette adresse email est déja utilisée."
                ];
            }

            // Hachage du mot de passe
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

            // 3. Persistance via le Modèle
            $userId = $this->userModel->create(
                $data['first_name'],
                $data['last_name'],
                $data['email'],
                $hashedPassword
            );

            // 4. Génération du token de session
            $sessionToken = bin2hex(random_bytes(64));

            return [
                'succes' => true,
                'code' => 201,
                'data' => [
                    'userId' => $userId,
                    'sessionToken' => $sessionToken,
                    'user' => [
                        'id' => $userId,
                        'first_name' => $data['first_name'],
                        'email' => $data['email']
                    ]
                ]
            ];
        } catch (\Exception $e) {
            // 1. On loggue l'erreur technique "brute" pour le développeur (dans les logs du serveur)
            error_log("Erreur critique dans AuthService (register) : " . $e->getMessage());

            // 2. On retourne un message "doux" pour ne pas exposer la base de données au Front-end
            return [
                'success' => false,
                'code' => 500,
                'message' => "Une erreur interne est survenue lors de la création du compte."
            ];
        }
    }
}
