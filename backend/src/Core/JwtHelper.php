<?php

namespace App\Core;

class JwtHelper
{
    /**
     * Génère un token JWT signé
     */
    public static function generate(array $payload, string $secret, int $expirationSeconds = 86400): string
    {
        // 1. En-tête (Header)
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        // 2. Charge utile (Payload) - On ajoute l'expiration
        $payload['iat'] = time(); // Issued At
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
     * Vérifie la validité et la signature d'un token JWT
     */
    public static function verify(string $jwt, string $secret): ?array
    {
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

        // Décodage du payload
        $decodedPayload = json_decode(self::base64UrlDecode($payload), true);

        // Vérification de l'expiration
        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return null; // Token expiré
        }

        return $decodedPayload;
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
