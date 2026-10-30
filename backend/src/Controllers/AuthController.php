<?php

namespace App\Controllers;

use App\Core\ApiResponse;
use App\Core\ClientIp;
use App\Core\Input;
use App\Core\LoginThrottle;
use App\Core\RateLimiter;
use App\Core\SecurityLog;
use App\Core\SessionCookie;
use App\Services\AuthService;
use App\Middlewares\AuthMiddleware;

class AuthController
{
    private const HOUR = 3600;

    private RateLimiter $limiter;
    private LoginThrottle $loginThrottle;

    public function __construct(
        private AuthService $authService = new AuthService(),
        ?RateLimiter $limiter = null
    ) {
        $this->limiter = $limiter ?? RateLimiter::fromEnvironment();
        $this->loginThrottle = new LoginThrottle($this->limiter);
    }

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

        // Chaque inscription envoie un e-mail : sans limite, on pourrait inonder une boîte mail (ou vider le quota Brevo)
        if ($this->tooMany('register_ip', ClientIp::current(), 5, self::HOUR) || $this->tooMany('register_email', $email, 3, self::HOUR)) {
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

        $email = strtolower($email);
        $ip    = ClientIp::current();

        // Trop d'échecs récents : on refuse AVANT de vérifier le mot de passe, même s'il est bon
        // (sinon l'attaquant saurait encore, pendant le blocage, quand il tombe juste).
        $throttle = $this->loginThrottle->check($email, $ip);
        if ($throttle['blocked']) {
            ApiResponse::tooManyRequests($throttle['retryAfter']);
            return;
        }

        // Appel au service pour vérifier les identifiants et générer le JWT
        $result = $this->authService->login($email, $password);

        if (!$result['success']) {
            // Seul un mot de passe refusé (401) est un échec. Un 403 « e-mail non vérifié » veut dire que le mot de passe était bon.
            if ($result['code'] === 401) {
                $failure = $this->loginThrottle->recordFailure($email, $ip);

                SecurityLog::record(SecurityLog::LOGIN_FAILED, null, $email, [
                    // Pour vérifier en production que l'IP du visiteur arrive bien jusqu'ici à travers le relais Next.js
                    'remote_addr'     => $_SERVER['REMOTE_ADDR'] ?? null,
                    'x_forwarded_for' => isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? mb_substr($_SERVER['HTTP_X_FORWARDED_FOR'], 0, 120) : null,
                    'proxy_trusted'   => ClientIp::isFromTrustedProxy($_SERVER, $_ENV['PROXY_SHARED_SECRET'] ?? null),
                ]);

                if ($failure['justLocked']) {
                    SecurityLog::record(SecurityLog::LOGIN_LOCKED, null, $email);
                }
            }

            $this->respond($result['code'], $result['message']);
            return;
        }

        $this->loginThrottle->recordSuccess($email, $ip);
        SecurityLog::record(SecurityLog::LOGIN_SUCCESS, (int) $result['data']['user']['id']);

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

        $email = strtolower($email);

        // Chaque demande envoie un e-mail à l'adresse visée : le compteur par adresse protège son propriétaire (et le quota Brevo),
        // le compteur par IP empêche de balayer de nombreuses adresses. Le compte est le même que l'adresse existe ou non.
        if ($this->tooMany('reset_request_email', $email, 3, self::HOUR) || $this->tooMany('reset_request_ip', ClientIp::current(), 10, self::HOUR)) {
            return;
        }

        SecurityLog::record(SecurityLog::PASSWORD_RESET_REQUESTED, null, $email);

        $result = $this->authService->requestPasswordReset($email);

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

        if ($this->tooMany('reset_password_ip', ClientIp::current(), 10, self::HOUR)) {
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

        if ($this->tooManyLinkAttempts()) {
            return;
        }

        $result = $this->authService->verifyEmail($token);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Vérification d'e-mail par POST (jeton dans le corps) : une requête GET ne devrait jamais modifier de données
     * (les outils de sécurité des messageries ouvrent les liens et consommeraient le jeton). Le GET ci-dessus
     * reste en place pour l'ancien site, jusqu'à la bascule.
     */
    public function verifyEmailByPost(): void
    {
        $token = Input::string(Input::json() ?? [], 'token', 128);

        if (empty($token)) {
            $this->respond(400, "Le jeton de vérification est manquant.");
            return;
        }

        if ($this->tooManyLinkAttempts()) {
            return;
        }

        $result = $this->authService->verifyEmail($token);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/auth/confirm-email-change : le propriétaire de la nouvelle adresse a ouvert le lien reçu par e-mail.
     */
    public function confirmEmailChange(): void
    {
        $token = Input::string(Input::json() ?? [], 'token', 128);

        if (empty($token)) {
            $this->respond(400, "Le jeton de confirmation est manquant.");
            return;
        }

        if ($this->tooManyLinkAttempts()) {
            return;
        }

        $result = $this->authService->confirmEmailChange($token);

        http_response_code($result['code']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Compte une tentative et, si la limite est dépassée, répond 429 (renvoie alors true : l'appelant doit s'arrêter).
     * Le blocage n'est journalisé qu'une fois par fenêtre, pas à chaque requête refusée : une attaque ne doit pas remplir le journal.
     */
    private function tooMany(string $action, string $value, int $max, int $windowSeconds): bool
    {
        $state = $this->limiter->attempt($action, $value, $max, $windowSeconds);

        if ($state['allowed']) {
            return false;
        }

        if ($state['justBlocked']) {
            SecurityLog::record(SecurityLog::RATE_LIMITED, null, null, ['action' => $action]);
        }

        ApiResponse::tooManyRequests($state['retryAfter']);

        return true;
    }

    /** Liens reçus par e-mail (vérification, changement d'adresse) : 20 essais par heure et par IP suffisent à un humain, pas à un robot qui devine. */
    private function tooManyLinkAttempts(): bool
    {
        return $this->tooMany('link_ip', ClientIp::current(), 20, self::HOUR);
    }

    private function respond(int $code, string $message): void
    {
        http_response_code($code);
        echo json_encode(["success" => false, "message" => $message], JSON_UNESCAPED_UNICODE);
    }
}
