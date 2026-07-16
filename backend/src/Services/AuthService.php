<?php

namespace App\Services;

use App\Models\UserModel;

class AuthService
{
    public function __construct(
        private UserModel $userModel = new UserModel(),
        private \App\Models\AccountTokenModel $tokenModel = new \App\Models\AccountTokenModel(),
        private EmailService $emailService = new EmailService()
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

            // 1. Règle métier : le consentement RGPD (CGV + politique de confidentialité) est-il donné ?
            if (empty($data['gdpr_consent'])) {
                return [
                    'success' => false,
                    'code' => 400,
                    'message' => "Vous devez accepter les CGV et la politique de confidentialité."
                ];
            }

            // 2. Hachage du mot de passe
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

            // Horodatage du consentement : sert de preuve RGPD (date exacte), pas juste un booléen
            $consentTimestamp = date('Y-m-d H:i:s');

            // 3. Appel au modèle pour l'insertion
            $userId = $this->userModel->create(
                $data['last_name'],
                $data['first_name'],
                $data['email'],
                $hashedPassword,
                $consentTimestamp
            );

            // 4. Génère un jeton de vérification et envoie l'email
            $token = $this->tokenModel->create($userId, 'email_verification', 1440);

            $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
            $verifyUrl   = "{$frontendUrl}/verifier-email?token={$token}";

            $this->emailService->sendVerificationEmail($data['email'], $data['first_name'], $verifyUrl);

            return [
                'success' => true,
                'code'    => 201,
                'message' => "Compte créé avec succès. Vérifiez votre boîte mail pour activer votre compte."
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'code' => 500,
                'message' => "Erreur interne technique."
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

        if (!$user['email_verified_at']) {
            return [
                'success' => false,
                'code'  => 403,
                'message'   => "Veuillez vérifier votre adresse email aveant de vous connecter. Un email de vérification vous a été envoyé à l'inscription."
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

    /**
     * Vérifie un jeton de réinitialisation et enregistre le nouveau mot de passe.
     */
    public function resetPassword(string $token, string $newPassword): array
    {
        $tokenData = $this->tokenModel->findValidToken($token, 'password_reset');

        if (!$tokenData) {
            return [
                'success' => false,
                'code'    => 400,
                'message' => "Ce lien de réinitialisation est invalide ou a expiré."
            ];
        }

        if (strlen($newPassword) < 8) {
            return [
                'success' => false,
                'code'    => 400,
                'message' => "Le mot de passe doit contenir au moins 8 caractères."
            ];
        }

        try {
            $this->userModel->updatePassword($tokenData['user_id'], $newPassword);
            $this->tokenModel->markAsUsed($token);

            return [
                'success' => true,
                'code'    => 200,
                'message' => "Votre mot de passe a été réinitialisé avec succès."
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AuthService::resetPassword : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible de réinitialiser le mot de passe."
            ];
        }
    }

    /**
     * Vérifie un jeton de vérification et active le compte.
     */
    public function verifyEmail(string $token): array
    {
        $tokenData = $this->tokenModel->findValidToken($token, 'email_verification');

        if (!$tokenData) {
            return [
                'success' => false,
                'code'    => 400,
                'message' => "Ce lien de vérification est invalide ou a expiré."
            ];
        }

        try {
            $this->userModel->markEmailVerified($tokenData['user_id']);
            $this->tokenModel->markAsUsed($token);

            return [
                'success' => true,
                'code'    => 200,
                'message' => "Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter."
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AuthService::verifyEmail : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible de vérifier l'email."
            ];
        }
    }
}
