<?php

namespace App\Core;

class JwtHelper
{
    public const ISSUER = 'jardinerie';
    public const MIN_SECRET_LENGTH = 32;

    // Valeur d'exemple publiée dans .env.example (donc dans le dépôt Git, lisible par tous) : jamais acceptée en production.
    private const PUBLISHED_EXAMPLE_SECRET = 'Key_Jardinerie_Secret_Key_2026_Super_Secure!*';

    // Tolérance entre l'horloge du serveur qui signe et celle qui vérifie (secondes)
    private const CLOCK_SKEW = 60;

    /**
     * Génère un token JWT signé
     */
    public static function generate(array $payload, string $secret, int $expirationSeconds = 86400): string
    {
        self::assertStrongSecret($secret);

        // 1. En-tête (Header)
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        // 2. Charge utile (Payload) - émetteur, date d'émission et expiration
        $payload['iss'] = self::ISSUER;
        $payload['iat'] = time();
        $payload['exp'] = time() + $expirationSeconds;
        $payloadJson = json_encode($payload);

        // Encodage en Base64Url (Format standard JWT)
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payloadJson);

        // 3. Signature sécurisée avec HMAC SHA256
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        // On assemble les 3 parties
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Vérifie la validité et la signature d'un token JWT.
     * Renvoie la charge utile, ou null pour tout jeton falsifié, mal formé, d'un autre émetteur, expiré ou daté du futur.
     */
    public static function verify(string $jwt, string $secret): ?array
    {
        self::assertStrongSecret($secret);

        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        // Recalcul de la signature pour vérifier qu'elle n'a pas été falsifiée
        $validSignature = hash_hmac('sha256', $header . "." . $payload, $secret, true);
        $base64UrlValidSignature = self::base64UrlEncode($validSignature);

        if (!hash_equals($base64UrlValidSignature, $signature)) {
            return null; // Signature invalide
        }

        // L'algorithme annoncé doit être celui qu'on utilise vraiment (protection contre les jetons « alg: none » ou « alg: RS256 »)
        $decodedHeader = json_decode(self::base64UrlDecode($header), true);
        if (!is_array($decodedHeader) || ($decodedHeader['alg'] ?? null) !== 'HS256') {
            return null;
        }

        // Décodage du payload
        $decodedPayload = json_decode(self::base64UrlDecode($payload), true);
        if (!is_array($decodedPayload)) {
            return null;
        }

        // Émetteur, date d'émission et expiration sont obligatoires
        if (($decodedPayload['iss'] ?? null) !== self::ISSUER) {
            return null;
        }
        if (!is_int($decodedPayload['iat'] ?? null) || !is_int($decodedPayload['exp'] ?? null)) {
            return null;
        }
        if ($decodedPayload['exp'] < time() || $decodedPayload['iat'] > time() + self::CLOCK_SKEW) {
            return null; // Token expiré, ou émis dans le futur
        }

        return $decodedPayload;
    }

    /**
     * Un secret court ou connu rend les jetons falsifiables : mieux vaut un site qui refuse de démarrer qu'un site vulnérable.
     * @throws \RuntimeException
     */
    private static function assertStrongSecret(string $secret): void
    {
        if (strlen($secret) < self::MIN_SECRET_LENGTH) {
            throw new \RuntimeException('JWT_SECRET trop court : ' . self::MIN_SECRET_LENGTH . ' caractères minimum.');
        }

        if (($_ENV['APP_ENV'] ?? 'development') === 'production' && hash_equals(self::PUBLISHED_EXAMPLE_SECRET, $secret)) {
            throw new \RuntimeException('JWT_SECRET est la valeur d\'exemple publiée dans le dépôt : générez-en une nouvelle.');
        }
    }

    // --- Fonctions utilitaires d'encodage JWT ---
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}
