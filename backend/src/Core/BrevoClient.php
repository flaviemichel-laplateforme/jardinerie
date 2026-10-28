<?php

namespace App\Core;

use RuntimeException;

/**
 * Client minimal de l'API Brevo pour l'envoi d'e-mails transactionnels.
 *
 * Volontairement en cURL natif, sans SDK : le back-end est déployé à la main (FileZilla), chaque dépendance
 * ajoutée à vendor/ serait un dossier de plus à transférer.
 *
 * Ce client ne journalise jamais ni la clé API ni le contenu du message (adresses et noms : données personnelles).
 * Les messages d'erreur qu'il lève ne contiennent que le code HTTP et le message renvoyé par Brevo.
 */
class BrevoClient
{
    private const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

    // Délais courts : l'e-mail de confirmation de commande part pendant le webhook Stripe, qui ne doit pas attendre.
    private const CONNECT_TIMEOUT_SECONDS = 4;
    private const TIMEOUT_SECONDS = 8;

    private string $apiKey;

    /** @param string|null $apiKey Clé API. Par défaut : BREVO_API_KEY du .env (lue ici, pas à l'envoi, pour les tests) */
    public function __construct(?string $apiKey = null)
    {
        $this->apiKey = trim($apiKey ?? ($_ENV['BREVO_API_KEY'] ?? ''));
    }

    /**
     * Envoie un e-mail transactionnel.
     *
     * @param array $payload Corps de la requête Brevo (sender, to, subject, htmlContent, tags...)
     * @throws RuntimeException Si la clé est absente, si Brevo est injoignable ou s'il refuse l'envoi
     */
    public function send(array $payload): void
    {
        if ($this->apiKey === '') {
            throw new RuntimeException("BREVO_API_KEY n'est pas configurée.");
        }

        $curl = curl_init(self::ENDPOINT);
        curl_setopt_array($curl, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            CURLOPT_HTTPHEADER     => [
                'accept: application/json',
                'content-type: application/json',
                'api-key: ' . $this->apiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT_SECONDS,
            CURLOPT_TIMEOUT        => self::TIMEOUT_SECONDS,
        ]);

        $response  = curl_exec($curl);
        $status    = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $curlError = curl_error($curl);

        if ($response === false) {
            throw new RuntimeException("Brevo injoignable : $curlError");
        }

        if ($status < 200 || $status >= 300) {
            $message = json_decode((string) $response, true)['message'] ?? 'réponse inattendue';
            throw new RuntimeException("Brevo a refusé l'envoi (HTTP $status) : $message");
        }
    }
}
