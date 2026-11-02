<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\CorsPolicy;
use App\Core\RequestGuard;

class RequestGuardTest extends TestCase
{
    private const ALLOWED = ['https://jardinerie-next.vercel.app', 'https://jardinerie.vercel.app'];

    private function check(string $method, string $path, array $headers = [], bool $hasBody = true): ?array
    {
        return RequestGuard::check($method, $path, $headers, self::ALLOWED, $hasBody);
    }

    public function testLesLecturesNeSontJamaisBloquees(): void
    {
        foreach (['GET', 'HEAD', 'OPTIONS'] as $method) {
            $this->assertNull($this->check($method, '/api/me', ['origin' => 'https://evil.example']), $method);
        }
    }

    public function testUnPostJsonDUneOrigineConnueEstAccepte(): void
    {
        $this->assertNull($this->check('POST', '/api/auth/login', ['origin' => 'https://jardinerie-next.vercel.app', 'content-type' => 'application/json']));
        $this->assertNull($this->check('POST', '/api/auth/login', ['origin' => 'https://jardinerie.vercel.app', 'content-type' => 'application/json; charset=UTF-8']));
    }

    public function testUnPostDUnSiteEtrangerEstRefuse(): void
    {
        $refusal = $this->check('POST', '/api/admin/clients/5/anonymize', ['origin' => 'https://evil.example', 'content-type' => 'application/json']);

        $this->assertSame(403, $refusal['code']);
    }

    public function testLAttaqueCsrfEnTextPlainEstRefusee(): void
    {
        // Un formulaire piégé peut envoyer du « text/plain » sans pré-vérification CORS : le cookie part, PHP lirait le corps.
        $refusal = $this->check('POST', '/api/addresses', ['origin' => 'https://jardinerie-next.vercel.app', 'content-type' => 'text/plain']);

        $this->assertSame(415, $refusal['code']);
    }

    public function testUnFormulaireClassiqueEstRefuse(): void
    {
        $refusal = $this->check('POST', '/api/addresses', ['content-type' => 'application/x-www-form-urlencoded']);

        $this->assertSame(415, $refusal['code']);
    }

    public function testSecFetchSiteCrossSiteSansOriginEstRefuse(): void
    {
        $refusal = $this->check('POST', '/api/auth/logout', ['sec-fetch-site' => 'cross-site'], false);

        $this->assertSame(403, $refusal['code']);
    }

    public function testSecFetchSiteSameOriginSansOriginEstAccepte(): void
    {
        $this->assertNull($this->check('POST', '/api/auth/logout', ['sec-fetch-site' => 'same-origin'], false));
    }

    public function testUnAppelSansEnTeteDeNavigateurEstAccepte(): void
    {
        // curl, appel de serveur à serveur : pas de navigateur, donc pas de CSRF
        $this->assertNull($this->check('POST', '/api/auth/login', ['content-type' => 'application/json']));
    }

    public function testUneRequeteSansCorpsNExigePasDeContentType(): void
    {
        $this->assertNull($this->check('DELETE', '/api/addresses/3', ['origin' => 'https://jardinerie-next.vercel.app'], false));
    }

    public function testLeWebhookStripeEstExempte(): void
    {
        $this->assertNull($this->check('POST', '/api/webhooks/stripe', ['content-type' => 'text/plain']));
        $this->assertNull($this->check('POST', '/jardinerie/api/webhooks/stripe', ['content-type' => 'application/json']));
    }

    public function testLEnvoiDImageAttendDuMultipartEtVerifieLOrigine(): void
    {
        $this->assertNull($this->check('POST', '/api/admin/upload', ['origin' => 'https://jardinerie.vercel.app', 'content-type' => 'multipart/form-data; boundary=xyz']));
        $this->assertSame(415, $this->check('POST', '/api/admin/upload', ['origin' => 'https://jardinerie.vercel.app', 'content-type' => 'application/json'])['code']);
        $this->assertSame(403, $this->check('POST', '/api/admin/upload', ['origin' => 'https://evil.example', 'content-type' => 'multipart/form-data'])['code']);
    }

    public function testUneAdresseDePrevisualisationVercelEstAcceptee(): void
    {
        $preview = 'https://jardinerie-next-hkeoc2sbh-michels-projects-37882444.vercel.app';

        $this->assertNull($this->check('POST', '/api/auth/login', ['origin' => $preview, 'content-type' => 'application/json']));
    }

    // --------------------------------------------------------------- CorsPolicy

    public function testSansConfigurationOnGardeLesAdressesDuProjet(): void
    {
        $this->assertSame(CorsPolicy::DEFAULT_ORIGINS, CorsPolicy::allowedOrigins(null));
        $this->assertSame(CorsPolicy::DEFAULT_ORIGINS, CorsPolicy::allowedOrigins('  , ,'));
    }

    public function testLaListeDuEnvEstLueEtNettoyee(): void
    {
        $origins = CorsPolicy::allowedOrigins(' https://a.example/ , https://b.example ');

        $this->assertSame(['https://a.example', 'https://b.example'], $origins);
    }

    public function testDesFaussesPrevisualisationsSontRefusees(): void
    {
        foreach ([
            'https://jardinerie-next-abc-michels-projects-37882444.vercel.app.evil.example',
            'https://jardinerie-next-abc-autre-compte-111.vercel.app',
            'http://jardinerie-next-abc-michels-projects-37882444.vercel.app',
            'https://evil.example',
            '',
        ] as $origin) {
            $this->assertFalse(CorsPolicy::isAllowed($origin, self::ALLOWED), $origin);
        }
    }
}
