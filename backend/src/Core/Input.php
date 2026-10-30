<?php

namespace App\Core;

/**
 * Lecture sûre des données reçues. Un champ JSON peut être un tableau ou un nombre : donné tel quel à trim() ou à password_verify(),
 * il provoquait une erreur PHP (réponse 500) au lieu d'un refus propre.
 */
class Input
{
    /** Corps de la requête décodé en tableau, ou null s'il est vide ou n'est pas du JSON valide. */
    public static function json(): ?array
    {
        $decoded = json_decode((string) file_get_contents('php://input'), true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Texte reçu, ou null si le champ est absent, n'est pas du texte, ou dépasse $max caractères.
     * $trim = false pour un mot de passe : les espaces en début ou en fin en font partie.
     */
    public static function string(array $data, string $key, int $max = 255, bool $trim = true): ?string
    {
        $value = $data[$key] ?? null;
        if (!is_string($value)) {
            return null;
        }

        $value = $trim ? trim($value) : $value;

        return mb_strlen($value) > $max ? null : $value;
    }

    /** Adresse e-mail en minuscules (la même adresse ne doit pas créer deux comptes), ou null si elle est invalide. */
    public static function email(array $data, string $key = 'email'): ?string
    {
        $email = self::string($data, $key, 254);
        if ($email === null) {
            return null;
        }

        $email = strtolower($email);

        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false ? $email : null;
    }
}
