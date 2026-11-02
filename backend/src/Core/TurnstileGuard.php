<?php

namespace App\Core;

/**
 * Décide si une requête passe le contrôle anti-robots (Cloudflare Turnstile).
 *
 * Sans TURNSTILE_SECRET dans le .env, le contrôle est DÉSACTIVÉ et tout passe : on peut déployer le code avant d'activer,
 * et l'ancien site (qui ne sait pas envoyer de jeton) continue de fonctionner jusqu'à la bascule.
 *
 * Résultat de verify() : ['ok' => bool, 'reason' => ...] avec reason =
 *  - 'disabled'    : contrôle non activé, la requête passe ;
 *  - 'passed'      : jeton valide ;
 *  - 'missing'     : aucun jeton envoyé (le visiteur n'a pas encore résolu le contrôle) ;
 *  - 'invalid'     : jeton refusé par Cloudflare (faux, expiré ou déjà utilisé) ;
 *  - 'unreachable' : Cloudflare ne répond pas. On REFUSE alors : ce contrôle protège des actions qui envoient des e-mails ou
 *                    qui devinent des mots de passe, mieux vaut un « réessayez » qu'une porte ouverte.
 */
class TurnstileGuard
{
    // Un jeton Turnstile fait moins de 2048 caractères (limite documentée par Cloudflare) : au-delà, inutile de le lui envoyer
    private const MAX_TOKEN_LENGTH = 2048;

    public function __construct(private ?TurnstileClient $client = null) {}

    /** Garde réelle : active seulement si TURNSTILE_SECRET est renseigné. */
    public static function fromEnvironment(): self
    {
        $secret = trim($_ENV['TURNSTILE_SECRET'] ?? '');

        return new self($secret === '' ? null : new TurnstileClient($secret));
    }

    public function isEnabled(): bool
    {
        return $this->client !== null;
    }

    /** @return array{ok:bool, reason:string} */
    public function verify(?string $token, ?string $ip = null): array
    {
        if ($this->client === null) {
            return ['ok' => true, 'reason' => 'disabled'];
        }

        if ($token === null || trim($token) === '') {
            return ['ok' => false, 'reason' => 'missing'];
        }

        if (strlen($token) > self::MAX_TOKEN_LENGTH) {
            return ['ok' => false, 'reason' => 'invalid'];
        }

        try {
            $valid = $this->client->verify($token, $ip);
        } catch (\Throwable $e) {
            error_log('Turnstile indisponible (requête refusée) : ' . $e->getMessage());

            return ['ok' => false, 'reason' => 'unreachable'];
        }

        return $valid ? ['ok' => true, 'reason' => 'passed'] : ['ok' => false, 'reason' => 'invalid'];
    }
}
