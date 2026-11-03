<?php

namespace Tests\Support;

/**
 * Client HTTP minimal pour tester l'API locale (le serveur Apache du conteneur) avec un cookie de session, comme le ferait un navigateur.
 * Chaque instance = une « personne connectée » (ou non) : le cookie reçu à la connexion est renvoyé aux requêtes suivantes.
 */
final class ApiClient
{
    public ?string $cookie = null;

    public function __construct(private string $base = 'http://localhost/api') {}

    public function login(string $email, string $password): int
    {
        return $this->post('/auth/login', ['email' => $email, 'password' => $password])['status'];
    }

    /**
     * @param array<string, mixed>|null $json      corps JSON
     * @param array<string, mixed>|null $multipart champs de formulaire (CURLFile pour un fichier)
     * @param string[]                  $headers   en-têtes supplémentaires
     * @return array{status:int, body:array, raw:string, headers:array<string,string>}
     */
    public function request(string $method, string $path, ?array $json = null, ?array $multipart = null, array $headers = [], ?string $rawBody = null): array
    {
        $ch = curl_init($this->base . $path);
        $sent = ['Accept: application/json'];

        if ($json !== null) {
            $sent[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json));
        } elseif ($multipart !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $multipart); // curl ajoute lui-même le type « multipart/form-data » et sa frontière
        } elseif ($rawBody !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $rawBody);
        }

        if ($this->cookie !== null) {
            $sent[] = 'Cookie: jardinerie_session=' . $this->cookie;
        }

        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => true,
            CURLOPT_HTTPHEADER     => array_merge($sent, $headers),
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response   = (string) curl_exec($ch);
        $status     = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);

        $rawHeaders = substr($response, 0, $headerSize);
        $raw        = substr($response, $headerSize);

        $received = [];
        foreach (explode("\r\n", $rawHeaders) as $line) {
            if (!str_contains($line, ':')) {
                continue;
            }
            [$name, $value] = explode(':', $line, 2);
            $received[strtolower(trim($name))] = trim($value);

            // Cookie de session posé (connexion) ou effacé (déconnexion, session refusée)
            if (strtolower(trim($name)) === 'set-cookie' && preg_match('/^jardinerie_session=([^;]*)/i', trim($value), $m)) {
                $this->cookie = ($m[1] === '' || $m[1] === 'deleted') ? null : $m[1];
            }
        }

        return ['status' => $status, 'body' => json_decode($raw, true) ?? [], 'raw' => $raw, 'headers' => $received];
    }

    public function get(string $path): array
    {
        return $this->request('GET', $path);
    }

    public function post(string $path, array $json = []): array
    {
        return $this->request('POST', $path, $json);
    }

    public function patch(string $path, array $json = []): array
    {
        return $this->request('PATCH', $path, $json);
    }

    public function delete(string $path): array
    {
        return $this->request('DELETE', $path);
    }
}
