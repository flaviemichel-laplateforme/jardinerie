<?php

namespace App\Core;

use App\Models\SecurityEventModel;

/**
 * Journal de sécurité : garde la trace des événements sensibles (échecs de connexion, changements de mot de passe,
 * blocages…) pour repérer une attaque et reconstituer ce qui s'est passé.
 *
 * Règles :
 *  - une adresse e-mail n'est JAMAIS écrite en clair, seulement son empreinte SHA-256 ;
 *  - une erreur d'écriture ne doit jamais casser la requête en cours : elle est notée dans le journal du serveur, c'est tout ;
 *  - conservation 12 mois, purge automatique (une écriture sur cent) ; l'IP et l'agent sont effacés à l'anonymisation du compte.
 */
class SecurityLog
{
    public const LOGIN_SUCCESS = 'login_success';
    public const LOGIN_FAILED = 'login_failed';
    public const LOGIN_LOCKED = 'login_locked';
    public const RATE_LIMITED = 'rate_limited';
    public const PASSWORD_CHANGED = 'password_changed';
    public const PASSWORD_RESET_REQUESTED = 'password_reset_requested';
    public const PASSWORD_RESET_DONE = 'password_reset_done';
    public const EMAIL_VERIFIED = 'email_verified';
    public const EMAIL_CHANGE_REQUESTED = 'email_change_requested';
    public const EMAIL_CHANGED = 'email_changed';
    public const ROLE_CHANGED = 'role_changed';
    public const ACCOUNT_ANONYMIZED = 'account_anonymized';
    public const TURNSTILE_FAILED = 'turnstile_failed';

    private const MAX_USER_AGENT_LENGTH = 255;
    private const MAX_DETAILS_LENGTH = 1000;

    private static ?SecurityEventModel $model = null;

    /** Pour les tests : remplace le modèle réel par un faux. */
    public static function useModel(?SecurityEventModel $model): void
    {
        self::$model = $model;
    }

    /**
     * @param string|null $email Adresse concernée (si le compte est inconnu, ou pour retrouver une tentative) : enregistrée hachée
     * @param array<string, scalar|null> $details Précisions courtes (jamais de mot de passe, de jeton ni d'e-mail)
     */
    public static function record(string $event, ?int $userId = null, ?string $email = null, array $details = []): void
    {
        if (self::isDisabled()) {
            return;
        }

        try {
            $model = self::$model ??= new SecurityEventModel();

            $model->insert([
                'user_id'    => $userId,
                'email_hash' => $email !== null && $email !== '' ? self::hashEmail($email) : null,
                'event'      => $event,
                'ip'         => ClientIp::current(),
                'user_agent' => self::userAgent($_SERVER['HTTP_USER_AGENT'] ?? null),
                'details'    => self::encodeDetails($details),
            ]);

            // Nettoyage des événements de plus de 12 mois : une fois sur cent, sans tâche planifiée
            if (random_int(1, 100) === 1) {
                $model->purgeExpired();
            }
        } catch (\Throwable $e) {
            error_log('Journal de sécurité indisponible : ' . $e->getMessage());
        }
    }

    /** Empreinte d'une adresse e-mail : la même adresse donne toujours la même empreinte, mais l'adresse ne s'en déduit pas. */
    public static function hashEmail(string $email): string
    {
        return hash('sha256', strtolower(trim($email)));
    }

    public static function userAgent(?string $userAgent): ?string
    {
        if ($userAgent === null || $userAgent === '') {
            return null;
        }

        return mb_substr($userAgent, 0, self::MAX_USER_AGENT_LENGTH);
    }

    /** @param array<string, scalar|null> $details */
    public static function encodeDetails(array $details): ?string
    {
        if ($details === []) {
            return null;
        }

        $json = json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            return null;
        }

        // Un JSON coupé en plein milieu serait illisible : mieux vaut signaler qu'il était trop long
        return mb_strlen($json) > self::MAX_DETAILS_LENGTH ? json_encode(['tronque' => true]) : $json;
    }

    /** Hors production, SECURITY_LOG_DISABLED=true coupe le journal (les tests ne doivent pas remplir la base). */
    private static function isDisabled(): bool
    {
        $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';

        return !$isProduction && filter_var($_ENV['SECURITY_LOG_DISABLED'] ?? false, FILTER_VALIDATE_BOOLEAN);
    }
}
