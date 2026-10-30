<?php

namespace App\Core;

/**
 * Adresse IP du visiteur.
 *
 * Derrière le relais Next.js (Vercel), PHP voit l'adresse du relais, pas celle du visiteur : toute limitation par IP bloquerait
 * tout le monde d'un coup, ou personne. Vercel écrase X-Forwarded-For avec l'IP publique du visiteur ; mais n'importe qui peut
 * aussi appeler PHP directement avec un X-Forwarded-For inventé. On ne croit donc cet en-tête que si la requête prouve qu'elle
 * vient du relais, en portant le secret partagé (PROXY_SHARED_SECRET) que le proxy.js de Next.js ajoute : un visiteur ne peut
 * pas le poser, le relais l'écrase.
 */
class ClientIp
{
    /** IP du visiteur, d'après les variables du serveur et le secret partagé attendu. */
    public static function resolve(array $server, ?string $sharedSecret): string
    {
        if (self::isFromTrustedProxy($server, $sharedSecret)) {
            // « 203.0.113.7, 10.0.0.1 » : la première adresse est celle du visiteur, les suivantes sont des relais
            $first = trim(explode(',', (string) ($server['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
            if (filter_var($first, FILTER_VALIDATE_IP) !== false) {
                return $first;
            }
        }

        $remote = (string) ($server['REMOTE_ADDR'] ?? '');

        return filter_var($remote, FILTER_VALIDATE_IP) !== false ? $remote : 'inconnue';
    }

    /** La requête porte-t-elle le bon secret de relais ? */
    public static function isFromTrustedProxy(array $server, ?string $sharedSecret): bool
    {
        if ($sharedSecret === null || $sharedSecret === '') {
            return false;
        }

        return hash_equals($sharedSecret, (string) ($server['HTTP_X_PROXY_SECRET'] ?? ''));
    }

    /** IP de la requête en cours. */
    public static function current(): string
    {
        return self::resolve($_SERVER, $_ENV['PROXY_SHARED_SECRET'] ?? null);
    }
}
