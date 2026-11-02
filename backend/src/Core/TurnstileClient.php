<?php

namespace App\Core;

use RuntimeException;

/**
 * Client minimal de Cloudflare Turnstile (contrôle anti-robots) : demande à Cloudflare si le jeton que le navigateur vient de
 * recevoir est valide. En cURL natif, sans SDK, comme BrevoClient : le back-end est déployé à la main, chaque dépendance
 * serait un dossier de plus à transférer.
 *
 * Un jeton ne sert qu'une fois et expire au bout de 5 minutes : Cloudflare le refuse ensuite, c'est voulu.
 * La clé secrète n'est jamais écrite dans un message d'erreur ni dans le journal.
 */
class TurnstileClient
{
    private const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    // Délais courts : l'inscription et « mot de passe oublié » attendent cette réponse pour répondre au visiteur
    private const CONNECT_TIMEOUT_SECONDS = 3;
    private const TIMEOUT_SECONDS = 5;

    /** @var callable(string, array<string, string>): array{status:int, body:string} */
    private $transport;

    /**
     * @param string        $secret    Clé secrète (TURNSTILE_SECRET)
     * @param callable|null $transport Envoi HTTP, remplaçable dans les tests : fn(string $url, array $champs): array{status, body}
     */
    public function __construct(private string $secret, ?callable $transport = null)
    {
        $this->transport = $transport ?? [$this, 'post'];
    }

    /**
     * @return bool true si Cloudflare confirme que le jeton est valide
     * @throws RuntimeException Si Cloudflare est injoignable ou répond de façon inattendue (≠ jeton refusé)
     */
    public function verify(string $token, ?string $ip = null): bool
    {
        $fields = ['secret' => $this->secret, 'response' => $token];
        if ($ip !== null && filter_var($ip, FILTER_VALIDATE_IP) !== false) {
            $fields['remoteip'] = $ip;
        }

        $reply = ($this->transport)(self::ENDPOINT, $fields);

        // Cloudflare répond en JSON, même pour un jeton refusé (HTTP 200, success=false). Autre chose = panne, pas refus.
        $payload = json_decode($reply['body'], true);
        if ($reply['status'] !== 200 || !is_array($payload) || !array_key_exists('success', $payload)) {
            throw new RuntimeException("Turnstile a répondu de façon inattendue (HTTP {$reply['status']}).");
        }

        return $payload['success'] === true;
    }

    /** @return array{status:int, body:string} */
    private function post(string $url, array $fields): array
    {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($fields),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT_SECONDS,
            CURLOPT_TIMEOUT        => self::TIMEOUT_SECONDS,
        ]);

        $body      = curl_exec($curl);
        $status    = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $curlError = curl_error($curl);

        if ($body === false) {
            throw new RuntimeException("Turnstile injoignable : $curlError");
        }

        return ['status' => $status, 'body' => (string) $body];
    }
}
