<?php

namespace App\Core;

class NamePolicy
{
    /**
     * Vérifie qu'un nom/prénom ne contient que des lettres (accents compris) et des tirets.
     * @return string|null Message d'erreur si invalide, null si valide.
     */
    public static function validate(string $name): ?string
    {

        if (!preg_match("/^[a-zA-ZÀ-ÿ' -]+$/u", trim($name))) {
            return "Le nom et prenom ne doit contenir que des lettres et des tirets (pas de chiffres ni de caractères spéciaux).";
        }
        return null;
    }
}
