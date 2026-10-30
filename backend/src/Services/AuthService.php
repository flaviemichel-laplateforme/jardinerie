<?php

namespace App\Services;

use App\Models\UserModel;
use App\Models\AccountTokenModel;
use App\Core\PasswordPolicy;
use App\Core\NamePolicy;
use App\Core\DeferredWork;

class AuthService
{
    // Haché bcrypt (coût 12) d'un mot de passe qui n'est celui de personne. Quand l'adresse saisie n'existe pas, on vérifie
    // quand même le mot de passe contre ce haché : la réponse prend le même temps que pour un vrai compte. Sans cela, un
    // visiteur pourrait mesurer la durée de la réponse pour savoir quelles adresses ont un compte.
    private const DUMMY_PASSWORD_HASH = '$2y$12$Ps.6ZjG.DQ1IfVb4fQXVGOHT.bAwRcrNFkuAJIN5bZrUWJQ.zAzi6';

    public function __construct(
        private UserModel $userModel = new UserModel(),
        private AccountTokenModel $tokenModel = new AccountTokenModel(),
        private EmailService $emailService = new EmailService()
    ) {}

    /** Adresse du site pour les liens envoyés par e-mail. */
    private function frontendUrl(): string
    {
        return rtrim($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173', '/');
    }

    public function register(array $data): array
    {
        // 1. Contrôles de forme : ils ne dépendent pas de l'existence d'un compte, ils peuvent donc être détaillés
        if (empty($data['gdpr_consent'])) {
            return [
                'success' => false,
                'code' => 400,
                'message' => "Vous devez accepter les CGV et la politique de confidentialité."
            ];
        }

        foreach ([$data['first_name'], $data['last_name']] as $name) {
            $nameError = NamePolicy::validate($name);
            if ($nameError) {
                return ['success' => false, 'code' => 400, 'message' => $nameError];
            }
        }

        $passwordError = PasswordPolicy::validate($data['password'], $data['email']);
        if ($passwordError) {
            return ['success' => false, 'code' => 400, 'message' => $passwordError];
        }

        // 2. La réponse est la même que l'adresse soit libre ou déjà prise : sinon le formulaire d'inscription servirait
        //    à vérifier si quelqu'un a un compte. C'est le propriétaire de l'adresse qui est informé, par e-mail.
        $response = [
            'success' => true,
            'code'    => 201,
            'message' => "Si cette adresse peut être utilisée, un e-mail de confirmation vient de lui être envoyé. Ouvrez-le pour activer votre compte."
        ];

        try {
            // Hachage dans tous les cas : le même travail est fait que l'adresse existe ou non
            $hashedPassword = PasswordPolicy::hash($data['password']);

            $existingUser = $this->userModel->getUserByEmail($data['email']);
            if ($existingUser) {
                $this->notifyAccountAlreadyExists($existingUser);
                return $response;
            }

            // Horodatage du consentement : sert de preuve RGPD (date exacte), pas juste un booléen
            $consentTimestamp = date('Y-m-d H:i:s');

            try {
                $userId = $this->userModel->create(
                    $data['last_name'],
                    $data['first_name'],
                    $data['email'],
                    $hashedPassword,
                    $consentTimestamp
                );
            } catch (\PDOException $e) {
                // Deux inscriptions simultanées avec la même adresse : la seconde tombe sur l'index unique
                if (($e->errorInfo[1] ?? null) === 1062) {
                    return $response;
                }
                throw $e;
            }

            // Jeton de vérification, puis e-mail (envoyé après la réponse)
            $token     = $this->tokenModel->create($userId, AccountTokenModel::PURPOSE_EMAIL_VERIFICATION, 1440);
            $verifyUrl = "{$this->frontendUrl()}/verifier-email?token={$token}";

            DeferredWork::run(fn() => $this->emailService->sendVerificationEmail($data['email'], $data['first_name'], $verifyUrl));

            return $response;
        } catch (\Exception $e) {
            error_log("Erreur dans AuthService::register : " . $e->getMessage());

            return [
                'success' => false,
                'code' => 500,
                'message' => "Erreur interne technique."
            ];
        }
    }

    /** Prévient le propriétaire d'un compte qu'on a tenté de s'inscrire avec son adresse. */
    private function notifyAccountAlreadyExists(array $user): void
    {
        $loginUrl = "{$this->frontendUrl()}/connexion";
        $resetUrl = "{$this->frontendUrl()}/mot-de-passe-oublie";

        DeferredWork::run(fn() => $this->emailService->sendAccountAlreadyExistsEmail($user['email'], $user['first_name'], $loginUrl, $resetUrl));
    }

    /**
     * Logique de connexion et génération du JWT
     */
    public function login(string $email, string $password): array
    {
        // 1. Récupération de l'utilisateur par email (via votre UserModel)
        $user = $this->userModel->getUserByEmail($email);

        // 2. Vérification du mot de passe — toujours effectuée, même si le compte n'existe pas (voir DUMMY_PASSWORD_HASH)
        $storedHash = is_array($user) && ($user['password'] ?? '') !== '' ? $user['password'] : self::DUMMY_PASSWORD_HASH;
        $passwordIsValid = password_verify($password, $storedHash);

        if (!$user || !$passwordIsValid || ($user['anonymized_at'] ?? null) !== null) {
            return [
                'success' => false,
                'code' => 401,
                'message' => 'Identifiants incorrects.'
            ];
        }

        // Les comptes créés avec un coût de hachage plus faible montent au coût actuel, sans rien demander à l'utilisateur
        if (PasswordPolicy::needsRehash($user['password'])) {
            $this->userModel->rehashPassword((int) $user['id'], $password);
        }

        if (!$user['email_verified_at']) {
            return [
                'success' => false,
                'code'  => 403,
                'message'   => "Veuillez vérifier votre adresse email avant de vous connecter. Un email de vérification vous a été envoyé à l'inscription."
            ];
        }

        // 3. Création du Payload pour le JWT : identifiant, rôle et version de session (voir SessionGuard)
        $secret = $_ENV['JWT_SECRET'] ?? throw new \RuntimeException('JWT_SECRET manquant dans les variables d\'environnement.');
        $payload = [
            'id' => (int) $user['id'],
            'role' => $user['role'] ?? 'customer',
            'tv' => (int) ($user['token_version'] ?? 0),
        ];

        // Génération du JWT (expire dans 24h)
        $token = \App\Core\JwtHelper::generate($payload, $secret, 86400);

        return [
            'success' => true,
            'code' => 200,
            'data' => [
                'user' => UserModel::withoutSecrets($user),
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

        return [
            'success' => true,
            'code' => 200,
            'data' => [
                'user' => UserModel::withoutSecrets($user)
            ]
        ];
    }

    /**
     * Demande l'envoi d'un lien de réinitialisation de mot de passe.
     * Répond toujours avec le même message générique, que l'email existe ou non
     * dans la base, pour ne jamais révéler quelles adresses sont enregistrées
     * (protection contre l'énumération d'utilisateurs). L'e-mail part après la réponse :
     * la durée de la réponse ne dépend donc pas non plus de l'existence du compte.
     */
    public function requestPasswordReset(string $email): array
    {
        $genericResponse = [
            'success' => true,
            'code'    => 200,
            'message' => "Si cette adresse email existe, un lien de réinitialisation vient de lui être envoyé."
        ];

        $user = $this->userModel->getUserByEmail($email);

        if (!$user || ($user['anonymized_at'] ?? null) !== null) {
            return $genericResponse;
        }

        try {
            $token = $this->tokenModel->create($user['id'], AccountTokenModel::PURPOSE_PASSWORD_RESET, 60);

            $resetUrl = "{$this->frontendUrl()}/reinitialiser-mot-de-passe?token={$token}";

            DeferredWork::run(fn() => $this->emailService->sendPasswordResetLink($user['email'], $user['first_name'], $resetUrl));
        } catch (\Exception $e) {
            error_log("Erreur dans AuthService::requestPasswordReset : " . $e->getMessage());
        }

        return $genericResponse;
    }

    /**
     * Vérifie un jeton de réinitialisation et enregistre le nouveau mot de passe.
     */
    public function resetPassword(string $token, string $newPassword): array
    {
        $tokenData = $this->tokenModel->findValidToken($token, AccountTokenModel::PURPOSE_PASSWORD_RESET);
        $user = $tokenData ? $this->userModel->findById((int) $tokenData['user_id']) : false;

        if (!$tokenData || !$user || ($user['anonymized_at'] ?? null) !== null) {
            return [
                'success' => false,
                'code'    => 400,
                'message' => "Ce lien de réinitialisation est invalide ou a expiré."
            ];
        }

        $passwordError = PasswordPolicy::validate($newPassword, $user['email']);
        if ($passwordError) {
            return [
                'success' => false,
                'code'    => 400,
                'message' => $passwordError,
            ];
        }

        try {
            // Ferme toutes les sessions ouvertes, puis annule ce lien et tous les autres demandés auparavant
            $this->userModel->updatePassword((int) $user['id'], $newPassword);
            $this->tokenModel->invalidateAll((int) $user['id'], AccountTokenModel::PURPOSE_PASSWORD_RESET);

            $secureUrl = "{$this->frontendUrl()}/mot-de-passe-oublie";
            DeferredWork::run(fn() => $this->emailService->sendPasswordChangedNotice($user['email'], $user['first_name'], $secureUrl));

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
        $tokenData = $this->tokenModel->findValidToken($token, AccountTokenModel::PURPOSE_EMAIL_VERIFICATION);

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

    /**
     * Première étape d'un changement d'adresse e-mail : le mot de passe actuel est exigé (une session volée ne suffit pas),
     * un lien de confirmation part vers la NOUVELLE adresse, et l'ancienne est prévenue. L'adresse du compte ne change pas
     * tant que ce lien n'a pas été ouvert (voir confirmEmailChange).
     *
     * @param string $newEmail Nouvelle adresse, déjà validée et en minuscules
     */
    public function requestEmailChange(int $userId, string $newEmail, string $currentPassword): array
    {
        $user = $this->userModel->findById($userId);

        if (!$user || !password_verify($currentPassword, $user['password'])) {
            return [
                'success' => false,
                'code'    => 401,
                'message' => 'Mot de passe actuel incorrect.'
            ];
        }

        // Même réponse que l'adresse soit libre ou non : un utilisateur connecté ne doit pas pouvoir tester quelles adresses ont un compte
        $response = [
            'success' => true,
            'code'    => 200,
            'message' => "Un e-mail de confirmation a été envoyé à la nouvelle adresse (si elle est disponible). L'adresse de votre compte ne changera qu'après confirmation."
        ];

        if (strtolower($user['email']) === $newEmail || $this->userModel->getUserByEmail($newEmail)) {
            return $response;
        }

        try {
            $token      = $this->tokenModel->create($userId, AccountTokenModel::PURPOSE_EMAIL_CHANGE, 60, $newEmail);
            $confirmUrl = "{$this->frontendUrl()}/confirmer-changement-email?token={$token}";
            $secureUrl  = "{$this->frontendUrl()}/mot-de-passe-oublie";
            $masked     = EmailService::maskEmail($newEmail);

            DeferredWork::run(fn() => $this->emailService->sendEmailChangeVerification($newEmail, $user['first_name'], $confirmUrl));
            DeferredWork::run(fn() => $this->emailService->sendEmailChangeAlert($user['email'], $user['first_name'], $masked, $secureUrl));
        } catch (\Exception $e) {
            error_log("Erreur dans AuthService::requestEmailChange : " . $e->getMessage());

            return ['success' => false, 'code' => 500, 'message' => "Impossible de demander le changement d'adresse."];
        }

        return $response;
    }

    /**
     * Seconde étape : le propriétaire de la nouvelle adresse a ouvert le lien reçu. L'adresse change, les sessions
     * ouvertes se ferment, et l'ancienne adresse est prévenue.
     */
    public function confirmEmailChange(string $token): array
    {
        $tokenData = $this->tokenModel->findValidToken($token, AccountTokenModel::PURPOSE_EMAIL_CHANGE);
        $user = $tokenData ? $this->userModel->findById((int) $tokenData['user_id']) : false;
        $newEmail = (string) ($tokenData['payload'] ?? '');

        if (!$tokenData || !$user || $newEmail === '' || ($user['anonymized_at'] ?? null) !== null) {
            return [
                'success' => false,
                'code'    => 400,
                'message' => "Ce lien de confirmation est invalide ou a expiré."
            ];
        }

        $unavailable = [
            'success' => false,
            'code'    => 409,
            'message' => "Cette adresse n'est plus disponible."
        ];

        $owner = $this->userModel->getUserByEmail($newEmail);
        if ($owner && (int) $owner['id'] !== (int) $user['id']) {
            return $unavailable;
        }

        try {
            if (!$this->userModel->changeEmail((int) $user['id'], $newEmail)) {
                return $unavailable;
            }

            $this->tokenModel->invalidateAll((int) $user['id'], AccountTokenModel::PURPOSE_EMAIL_CHANGE);

            DeferredWork::run(fn() => $this->emailService->sendEmailChangedNotice($user['email'], $user['first_name'], EmailService::maskEmail($newEmail)));

            return [
                'success' => true,
                'code'    => 200,
                'message' => "Votre adresse a été modifiée. Reconnectez-vous avec votre nouvelle adresse."
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AuthService::confirmEmailChange : " . $e->getMessage());

            return ['success' => false, 'code' => 500, 'message' => "Impossible de confirmer le changement d'adresse."];
        }
    }
}
