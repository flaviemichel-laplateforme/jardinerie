<?php

namespace App\Core;

class PasswordPolicy
{
    // bcrypt ignore silencieusement tout ce qui dépasse 72 octets : on refuse plutôt que de laisser croire qu'un mot de passe
    // plus long est entièrement pris en compte (et un texte démesuré ne doit pas pouvoir être envoyé à l'algorithme de hachage).
    public const MAX_BYTES = 72;
    public const BCRYPT_COST = 12;

    // Mots de passe parmi les plus utilisés. Comparés sans chiffres, symboles ni majuscules : « Password123! » est refusé
    // même s'il respecte les règles de composition, car c'est l'un des tout premiers essayés par un attaquant.
    // Sans dépendre de la langue du serveur (iconv le fait mal selon les réglages) : accents français courants
    private const ACCENTS = [
        'à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'î' => 'i', 'ï' => 'i',
        'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c', 'ÿ' => 'y', 'œ' => 'oe',
        'À' => 'A', 'Â' => 'A', 'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E', 'Î' => 'I', 'Ï' => 'I', 'Ô' => 'O',
        'Ù' => 'U', 'Û' => 'U', 'Ü' => 'U', 'Ç' => 'C',
    ];

    private const COMMON_BASES = [
        'password', 'passw', 'motdepasse', 'monmotdepasse', 'azerty', 'azertyuiop', 'qwerty', 'qwertz', 'qwertyuiop', 'abcdef',
        'abcdefgh', 'abcd', 'administrator', 'admin', 'administrateur', 'root', 'user', 'utilisateur', 'test', 'testtest',
        'welcome', 'bienvenue', 'bonjour', 'salut', 'coucou', 'soleil', 'jardin', 'jardinerie', 'jardinier', 'fleur', 'fleurs',
        'plante', 'plantes', 'iloveyou', 'tiamo', 'jetaime', 'letmein', 'monkey', 'dragon', 'master', 'shadow', 'sunshine',
        'princess', 'football', 'baseball', 'superman', 'batman', 'trustno', 'starwars', 'pokemon', 'naruto', 'doudou',
        'chocolat', 'marseille', 'paris', 'loulou', 'chouchou', 'liverpool', 'mercedes', 'ferrari',
        'secret', 'secure', 'login', 'default', 'changeme', 'changezmoi', 'temp', 'guest', 'invite', 'demo', 'exemple',
        'example', 'hello', 'freedom', 'whatever', 'qazwsx', 'zxcvbn', 'zxcvbnm', 'asdfgh', 'asdfghjkl', 'azertyui',
        'minecraft', 'nicolas', 'thomas', 'camille', 'julien', 'maxime', 'alexandre', 'lauren', 'jessica', 'amour',
    ];

    /**
     * Vérifie qu'un mot de passe respecte la politique de sécurité.
     *
     * @param string|null $email Adresse du compte : un mot de passe qui contient le début de l'adresse est refusé.
     * @return string|null Message d'erreur si invalide, null si le mot de passe est valide.
     */
    public static function validate(string $password, ?string $email = null): ?string
    {
        if (strlen($password) < 8) {
            return "Le mot de passe doit contenir au moins 8 caractères.";
        }

        if (strlen($password) > self::MAX_BYTES) {
            return "Le mot de passe ne doit pas dépasser " . self::MAX_BYTES . " caractères.";
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

        foreach (self::letterBases($password) as $base) {
            if (in_array($base, self::COMMON_BASES, true)) {
                return "Ce mot de passe est trop courant : choisissez-en un moins facile à deviner.";
            }
        }

        if ($email !== null && self::containsEmailName($password, $email)) {
            return "Le mot de passe ne doit pas contenir votre adresse email.";
        }

        return null;
    }

    /** Hachage commun à l'inscription, à la réinitialisation et au changement de mot de passe. */
    public static function hash(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => self::BCRYPT_COST]);
    }

    /** Un haché créé avec un coût plus faible (anciens comptes) doit être recalculé à la prochaine connexion réussie. */
    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => self::BCRYPT_COST]);
    }

    /**
     * Les deux formes sous lesquelles un mot de passe courant se cache, ramenées à leurs seules lettres minuscules :
     *  - « Azerty123! » -> « azerty » (chiffres et symboles ajoutés à la fin ou au milieu) ;
     *  - « P@ssw0rd! » -> « password » (lettres remplacées par des chiffres ou des symboles : @ 0 3 $ 5…).
     *
     * @return string[]
     */
    private static function letterBases(string $password): array
    {
        $plain = strtr($password, self::ACCENTS);
        $leet  = strtr($plain, ['@' => 'a', '4' => 'a', '0' => 'o', '3' => 'e', '$' => 's', '5' => 's', '7' => 't']);

        return array_values(array_unique([self::lettersOnly($plain), self::lettersOnly($leet)]));
    }

    private static function lettersOnly(string $text): string
    {
        return strtolower(preg_replace('/[^a-z]/i', '', $text));
    }

    private static function containsEmailName(string $password, string $email): bool
    {
        $name = strtolower(strstr($email, '@', true) ?: '');

        return strlen($name) >= 4 && str_contains(strtolower($password), $name);
    }
}
