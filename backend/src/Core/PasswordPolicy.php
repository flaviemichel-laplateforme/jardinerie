<?php

namespace App\Core;

class PasswordPolicy
{
    /**
     * Vérifie qu'un mot de passe respecte la politique de sécurité.
     * @return string|null Message d'erreur si invalide, null si le mot de passe est valide.
     */
    public static function validate(string $password): ?string
    {
        if (strlen($password) < 8) {
            return "Le mot de passe doit contenir au moins 8 caractères.";
        }
        if (!preg_match('/[A-Z]/', $password)) {
            return "Le mot de passe doit contenir au moins une majuscule.";
        }
        if (!preg_match('/[a-z]/', $password)) {
            return "Le mot de passe doit contenir au moins une minuscule.";
        }
        if (!preg_match('/[0-9]/', $password)) {
            return "Le mot de passe doit contenir au moins un chiffre.";
        }
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return "Le mot de passe doit contenir au moins un caractère spécial.";
        }
        return null;
    }
}
