<?php

namespace App\Core;

/**
 * La règle de limitation de la connexion : trois compteurs d'ÉCHECS, tous sur 15 minutes.
 *
 *  - (e-mail + IP), 5 échecs : celui qui se trompe de mot de passe est freiné vite, sans gêner les autres ;
 *  - e-mail seul, 20 échecs : plafonne un attaquant qui change d'IP pour viser un même compte, tout en laissant le vrai
 *    propriétaire se connecter depuis chez lui tant que l'attaque reste sous ce seuil ;
 *  - IP seule, 30 échecs : un seul poste ne peut pas balayer des dizaines de comptes.
 * Une connexion réussie remet à zéro le compteur (e-mail + IP) : une faute de frappe d'hier ne compte plus.
 */
class LoginThrottle
{
    public const WINDOW_SECONDS = 900;
    public const PAIR_MAX = 5;
    public const EMAIL_MAX = 20;
    public const IP_MAX = 30;

    // Avant le blocage, un contrôle anti-robots (Turnstile) : un humain qui se trompe 2 fois ne le voit jamais, un robot qui
    // enchaîne les essais le rencontre bien avant d'atteindre les seuils de blocage ci-dessus.
    public const CAPTCHA_PAIR = 3;
    public const CAPTCHA_EMAIL = 10;
    public const CAPTCHA_IP = 10;

    public function __construct(private RateLimiter $limiter) {}

    /**
     * Faut-il exiger le contrôle anti-robots avant de vérifier le mot de passe ? (ne compte rien)
     * Oui dès que les échecs récents atteignent le seuil pour cet e-mail depuis cette IP, pour cet e-mail seul (attaquant qui
     * change d'IP) ou pour cette IP seule (poste qui balaie plusieurs comptes).
     */
    public function captchaRequired(string $email, string $ip): bool
    {
        $thresholds = [
            ['login_pair', "$email|$ip", self::CAPTCHA_PAIR],
            ['login_email', $email, self::CAPTCHA_EMAIL],
            ['login_ip', $ip, self::CAPTCHA_IP],
        ];

        foreach ($thresholds as [$action, $value, $max]) {
            if ($this->limiter->check($action, $value, $max, self::WINDOW_SECONDS)['blocked']) {
                return true;
            }
        }

        return false;
    }

    /**
     * À appeler AVANT de vérifier le mot de passe.
     * @return array{blocked:bool, retryAfter:int}
     */
    public function check(string $email, string $ip): array
    {
        $blocked = false;
        $retryAfter = 0;

        foreach ($this->rules($email, $ip) as [$action, $value, $max]) {
            $state = $this->limiter->check($action, $value, $max, self::WINDOW_SECONDS);
            if ($state['blocked']) {
                $blocked = true;
                $retryAfter = max($retryAfter, $state['retryAfter']);
            }
        }

        return ['blocked' => $blocked, 'retryAfter' => $retryAfter];
    }

    /**
     * À appeler après un mot de passe refusé.
     * @return array{locked:bool, justLocked:bool, retryAfter:int} justLocked : cet échec fait atteindre un seuil (pour ne journaliser le blocage qu'une fois)
     */
    public function recordFailure(string $email, string $ip): array
    {
        $locked = false;
        $justLocked = false;
        $retryAfter = 0;

        foreach ($this->rules($email, $ip) as [$action, $value, $max]) {
            $state = $this->limiter->fail($action, $value, $max, self::WINDOW_SECONDS);
            $locked = $locked || $state['locked'];
            $justLocked = $justLocked || $state['justLocked'];
            $retryAfter = max($retryAfter, $state['retryAfter']);
        }

        return ['locked' => $locked, 'justLocked' => $justLocked, 'retryAfter' => $retryAfter];
    }

    /** À appeler après une connexion réussie. */
    public function recordSuccess(string $email, string $ip): void
    {
        $this->limiter->clear('login_pair', "$email|$ip");
    }

    /** @return array<int, array{0:string, 1:string, 2:int}> [action, valeur, seuil] */
    private function rules(string $email, string $ip): array
    {
        return [
            ['login_pair', "$email|$ip", self::PAIR_MAX],
            ['login_email', $email, self::EMAIL_MAX],
            ['login_ip', $ip, self::IP_MAX],
        ];
    }
}
