<?php

namespace App\Core;

/**
 * Le cookie de session (le jeton de connexion). Un seul endroit pour le poser et l'effacer : avant, quatre copies
 * n'avaient pas les mêmes attributs, et un cookie effacé avec d'autres attributs que ceux de sa création peut rester dans le navigateur.
 *
 * SameSite :
 *  - « None » : le cookie part aussi depuis un autre site. Indispensable tant que l'ancien front-end (autre domaine) appelle
 *    directement l'API ; impose Secure. C'est aussi ce qui rend le CSRF possible (voir RequestGuard).
 *  - « Lax » : le cookie ne part pas lors d'une requête POST venue d'un autre site. C'est le bon réglage une fois que le
 *    navigateur ne parle plus qu'au site (relais Next.js) : à activer à la bascule avec COOKIE_SAMESITE=Lax.
 */
class SessionCookie
{
    public const NAME = 'jardinerie_session';
    private const VALID_SAME_SITE = ['None', 'Lax', 'Strict'];

    public static function sameSite(): string
    {
        $configured = ucfirst(strtolower((string) ($_ENV['COOKIE_SAMESITE'] ?? '')));
        if (in_array($configured, self::VALID_SAME_SITE, true)) {
            return $configured;
        }

        return self::isProduction() ? 'None' : 'Lax';
    }

    /** @return array{expires:int, path:string, secure:bool, httponly:bool, samesite:string} */
    public static function options(int $expires): array
    {
        $sameSite = self::sameSite();

        return [
            'expires'  => $expires,
            'path'     => '/',
            // Les navigateurs refusent un cookie SameSite=None qui n'est pas Secure
            'secure'   => self::isProduction() || $sameSite === 'None',
            'httponly' => true,
            'samesite' => $sameSite,
        ];
    }

    public static function set(string $token, int $lifetimeSeconds = 86400): void
    {
        setcookie(self::NAME, $token, self::options(time() + $lifetimeSeconds));
    }

    public static function clear(): void
    {
        setcookie(self::NAME, '', self::options(time() - 3600));
    }

    private static function isProduction(): bool
    {
        return ($_ENV['APP_ENV'] ?? 'development') === 'production';
    }
}
