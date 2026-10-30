<?php

namespace App\Core;

/**
 * Dernier filet de sécurité : une erreur qu'aucun contrôleur n'a attrapée ne doit jamais afficher de chemin de fichier,
 * de requête SQL ni de message technique au visiteur. Il reçoit une réponse JSON générique ; le détail va dans le journal du serveur.
 */
class ErrorHandler
{
    public static function register(): void
    {
        // Les erreurs vont dans le journal, jamais dans la réponse
        ini_set('display_errors', '0');
        ini_set('log_errors', '1');

        set_exception_handler([self::class, 'handleException']);
        register_shutdown_function([self::class, 'handleShutdown']);
    }

    public static function handleException(\Throwable $e): void
    {
        error_log(sprintf('Exception non attrapée %s : %s (%s:%d)', get_class($e), $e->getMessage(), $e->getFile(), $e->getLine()));
        self::respond();
    }

    /** Erreurs fatales (mémoire, erreur de syntaxe…) : elles ne passent pas par le gestionnaire d'exceptions. */
    public static function handleShutdown(): void
    {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
            error_log(sprintf('Erreur fatale : %s (%s:%d)', $error['message'], $error['file'], $error['line']));
            self::respond();
        }
    }

    private static function respond(): void
    {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
        }

        echo json_encode(['success' => false, 'message' => 'Erreur interne du serveur.'], JSON_UNESCAPED_UNICODE);
    }
}
