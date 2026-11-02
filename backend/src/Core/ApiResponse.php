<?php

namespace App\Core;

/** Réponses d'API partagées par les contrôleurs. */
class ApiResponse
{
    /**
     * Refus « trop de tentatives » : code 429 et en-tête Retry-After (secondes), que les navigateurs et les outils comprennent.
     * La limitation se décide dans les contrôleurs : les services ignorent le HTTP.
     */
    public static function tooManyRequests(int $retryAfterSeconds): void
    {
        $retryAfterSeconds = max(1, $retryAfterSeconds);

        http_response_code(429);
        header('Retry-After: ' . $retryAfterSeconds);

        echo json_encode([
            'success'     => false,
            'code'        => 429,
            'message'     => self::waitMessage($retryAfterSeconds),
            'retry_after' => $retryAfterSeconds,
        ], JSON_UNESCAPED_UNICODE);
    }

    /** « Trop de tentatives. Réessayez dans 12 minutes. » (jamais « 0 minute » : on arrondit au-dessus) */
    public static function waitMessage(int $retryAfterSeconds): string
    {
        $minutes = max(1, (int) ceil($retryAfterSeconds / 60));

        return "Trop de tentatives. Réessayez dans $minutes minute" . ($minutes > 1 ? 's' : '') . '.';
    }
}
