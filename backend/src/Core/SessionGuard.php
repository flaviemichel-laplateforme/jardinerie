<?php

namespace App\Core;

/**
 * Décide si un jeton de connexion, même correctement signé, ouvre encore une session.
 *
 * Un jeton signé reste valable 24 h tout seul : changer son mot de passe, retirer ses droits à un administrateur ou
 * supprimer un compte n'y changerait rien. On le confronte donc à l'état du compte dans la base :
 *  - le compte doit exister et ne pas être anonymisé ;
 *  - la « version de session » du jeton doit être celle du compte (incrémentée à chaque changement de mot de passe,
 *    de rôle ou d'adresse, et à l'anonymisation : tous les jetons émis avant deviennent inutilisables) ;
 *  - le rôle vient de la base, pas du jeton : une rétrogradation prend effet immédiatement.
 * Un jeton émis avant l'existence de ce mécanisme n'a pas de version : lu comme 0, comme un compte jamais révoqué.
 */
class SessionGuard
{
    /**
     * @param array $payload Charge utile du jeton (déjà vérifiée par JwtHelper)
     * @param array|null $user Compte tel que renvoyé par UserModel::findSessionUser(), ou null s'il n'existe pas
     * @return array{id:int, role:string}|null La session, ou null si elle est refusée
     */
    public static function validate(array $payload, ?array $user): ?array
    {
        if ($user === null || ($user['anonymized_at'] ?? null) !== null) {
            return null;
        }

        if ((int) ($payload['id'] ?? 0) !== (int) $user['id']) {
            return null;
        }

        if ((int) ($payload['tv'] ?? 0) !== (int) $user['token_version']) {
            return null;
        }

        return ['id' => (int) $user['id'], 'role' => (string) ($user['role'] ?? 'customer')];
    }
}
