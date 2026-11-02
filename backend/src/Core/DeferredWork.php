<?php

namespace App\Core;

/**
 * Travail à faire APRÈS avoir répondu au visiteur : l'envoi des e-mails (un appel réseau vers Brevo, 0,3 à 8 secondes).
 *
 * Deux raisons :
 *  - la réponse ne doit pas dépendre de ce que le serveur a eu à faire. Sinon, « mot de passe oublié » est plus lent pour une
 *    adresse qui existe (un e-mail part) que pour une adresse inconnue (rien ne part) : la durée de la réponse révèle quelles
 *    adresses ont un compte, même quand le message affiché est identique ;
 *  - le visiteur n'attend plus Brevo.
 *
 * Hors serveur web (tests PHPUnit, scripts), le travail s'exécute tout de suite : rien à simuler.
 */
class DeferredWork
{
    private static bool $enabled = false;

    /** @var callable[] */
    private static array $queue = [];

    /** À appeler une fois, au tout début de index.php : la réponse est alors mise en tampon. */
    public static function enable(): void
    {
        self::$enabled = true;
        ob_start();
    }

    public static function run(callable $work): void
    {
        if (!self::$enabled) {
            self::execute($work);
            return;
        }

        self::$queue[] = $work;
    }

    /** À appeler à la toute fin de index.php : envoie la réponse, puis exécute le travail en attente. */
    public static function finish(): void
    {
        if (!self::$enabled) {
            return;
        }

        if (self::$queue === []) {
            return; // rien à différer : fin normale de la requête
        }

        // Le visiteur doit pouvoir considérer la réponse comme terminée alors que le script continue
        ignore_user_abort(true);
        if (!headers_sent()) {
            header('Content-Length: ' . ob_get_length());
            header('Connection: close');
        }
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        flush();
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        }

        foreach (self::$queue as $work) {
            self::execute($work);
        }
        self::$queue = [];
    }

    private static function execute(callable $work): void
    {
        try {
            $work();
        } catch (\Throwable $e) {
            // La réponse est déjà partie : on ne peut que le noter dans le journal
            error_log('Travail différé en échec : ' . get_class($e) . ' : ' . $e->getMessage());
        }
    }
}
