<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\InMemoryRateLimitStore;
use App\Core\LoginThrottle;
use App\Core\RateLimiter;
use App\Core\TurnstileClient;
use App\Core\TurnstileGuard;

class TurnstileTest extends TestCase
{
    private const SECRET = 'une-cle-secrete-de-test';

    private array $calls = [];
    private int $now = 1000;

    /** Faux envoi HTTP : renvoie la réponse voulue et garde la trace de ce qui a été envoyé à Cloudflare. */
    private function client(int $status, string $body): TurnstileClient
    {
        return new TurnstileClient(self::SECRET, function (string $url, array $fields) use ($status, $body): array {
            $this->calls[] = ['url' => $url, 'fields' => $fields];

            return ['status' => $status, 'body' => $body];
        });
    }

    private function guard(int $status = 200, string $body = '{"success":true}'): TurnstileGuard
    {
        return new TurnstileGuard($this->client($status, $body));
    }

    // ------------------------------------------------------------------ TurnstileClient

    public function testUnJetonValideEstAccepte(): void
    {
        $this->assertTrue($this->client(200, '{"success":true}')->verify('jeton', '203.0.113.7'));
    }

    public function testUnJetonRefuseParCloudflareEstRefuse(): void
    {
        // Cloudflare répond HTTP 200 avec success=false pour un jeton faux, expiré ou déjà utilisé
        $this->assertFalse($this->client(200, '{"success":false,"error-codes":["timeout-or-duplicate"]}')->verify('jeton'));
    }

    public function testLaCleSecreteLeJetonEtLIpSontEnvoyesACloudflare(): void
    {
        $this->client(200, '{"success":true}')->verify('mon-jeton', '203.0.113.7');

        $this->assertCount(1, $this->calls);
        $this->assertSame('https://challenges.cloudflare.com/turnstile/v0/siteverify', $this->calls[0]['url']);
        $this->assertSame(['secret' => self::SECRET, 'response' => 'mon-jeton', 'remoteip' => '203.0.113.7'], $this->calls[0]['fields']);
    }

    public function testUneIpInvalideNEstPasEnvoyee(): void
    {
        // « inconnue » est la valeur de repli quand l'IP du visiteur n'est pas connue : Cloudflare refuserait la requête
        $this->client(200, '{"success":true}')->verify('jeton', 'inconnue');

        $this->assertArrayNotHasKey('remoteip', $this->calls[0]['fields']);
    }

    public function testUneReponseInattendueEstUnePanneEtPasUnRefus(): void
    {
        foreach ([[500, 'oups'], [200, 'pas du json'], [200, '{"autre":1}'], [403, '{"success":true}']] as [$status, $body]) {
            try {
                $this->client($status, $body)->verify('jeton');
                $this->fail("Réponse HTTP $status « $body » : une exception était attendue");
            } catch (\RuntimeException $e) {
                $this->assertStringNotContainsString(self::SECRET, $e->getMessage());
            }
        }
    }

    // ------------------------------------------------------------------ TurnstileGuard

    public function testSansCleSecreteLeControleEstDesactiveEtToutPasse(): void
    {
        $guard = new TurnstileGuard(null);

        $this->assertFalse($guard->isEnabled());
        $this->assertSame(['ok' => true, 'reason' => 'disabled'], $guard->verify(null));
        $this->assertSame(['ok' => true, 'reason' => 'disabled'], $guard->verify('n-importe-quoi'));
    }

    public function testLaGardeNEstActiveQueAvecUneCleSecrete(): void
    {
        $saved = $_ENV['TURNSTILE_SECRET'] ?? null;

        try {
            $_ENV['TURNSTILE_SECRET'] = '';
            $this->assertFalse(TurnstileGuard::fromEnvironment()->isEnabled());

            $_ENV['TURNSTILE_SECRET'] = '   ';
            $this->assertFalse(TurnstileGuard::fromEnvironment()->isEnabled(), 'des espaces ne font pas une clé');

            $_ENV['TURNSTILE_SECRET'] = self::SECRET;
            $this->assertTrue(TurnstileGuard::fromEnvironment()->isEnabled());
        } finally {
            $saved === null ? $this->forget() : $_ENV['TURNSTILE_SECRET'] = $saved;
        }
    }

    private function forget(): void
    {
        unset($_ENV['TURNSTILE_SECRET']);
    }

    public function testSansJetonLaRequeteEstRefuseSansInterrogerCloudflare(): void
    {
        $guard = $this->guard();

        $this->assertSame('missing', $guard->verify(null)['reason']);
        $this->assertSame('missing', $guard->verify('')['reason']);
        $this->assertSame('missing', $guard->verify('   ')['reason']);
        $this->assertCount(0, $this->calls);
    }

    public function testUnJetonValidePasse(): void
    {
        $this->assertSame(['ok' => true, 'reason' => 'passed'], $this->guard()->verify('jeton', '203.0.113.7'));
    }

    public function testUnJetonRefuseNePassePas(): void
    {
        $result = $this->guard(200, '{"success":false}')->verify('jeton');

        $this->assertFalse($result['ok']);
        $this->assertSame('invalid', $result['reason']);
    }

    public function testUnJetonDemesureEstRefuseSansInterrogerCloudflare(): void
    {
        $result = $this->guard()->verify(str_repeat('a', 2049));

        $this->assertSame('invalid', $result['reason']);
        $this->assertCount(0, $this->calls);
    }

    public function testSiCloudflareNeRepondPasLaRequeteEstRefusee(): void
    {
        // Fermé par défaut : ce contrôle protège des actions qui envoient des e-mails ou devinent des mots de passe
        $result = $this->guard(500, 'panne')->verify('jeton');

        $this->assertFalse($result['ok']);
        $this->assertSame('unreachable', $result['reason']);
    }

    // ------------------------------------------------------------------ LoginThrottle::captchaRequired

    private function throttle(): LoginThrottle
    {
        return new LoginThrottle(new RateLimiter(new InMemoryRateLimitStore(fn(): int => $this->now)));
    }

    public function testLeControleNApparaitQueApresPlusieursEchecs(): void
    {
        $throttle = $this->throttle();
        $this->assertFalse($throttle->captchaRequired('a@example.com', '203.0.113.7'), 'aucun échec');

        $throttle->recordFailure('a@example.com', '203.0.113.7');
        $throttle->recordFailure('a@example.com', '203.0.113.7');
        $this->assertFalse($throttle->captchaRequired('a@example.com', '203.0.113.7'), 'deux fautes de frappe : jamais gêné');

        $throttle->recordFailure('a@example.com', '203.0.113.7');
        $this->assertTrue($throttle->captchaRequired('a@example.com', '203.0.113.7'), 'troisième échec');
        $this->assertFalse($throttle->captchaRequired('b@example.com', '203.0.113.7'), 'un autre compte, même IP : pas encore');
    }

    public function testUneConnexionReussieSupprimeLExigenceDuControle(): void
    {
        $throttle = $this->throttle();
        for ($i = 0; $i < 3; $i++) {
            $throttle->recordFailure('a@example.com', '203.0.113.7');
        }

        $throttle->recordSuccess('a@example.com', '203.0.113.7');

        $this->assertFalse($throttle->captchaRequired('a@example.com', '203.0.113.7'));
    }

    public function testUnAttaquantQuiChangeDIpEstQuandMemeRattrape(): void
    {
        // 10 échecs sur le même compte depuis 10 IP différentes : chaque couple (e-mail + IP) reste à 1, mais le compte, lui, est visé
        $throttle = $this->throttle();
        for ($i = 1; $i <= 10; $i++) {
            $throttle->recordFailure('victime@example.com', "203.0.113.$i");
        }

        $this->assertTrue($throttle->captchaRequired('victime@example.com', '198.51.100.99'));
    }

    public function testUnPosteQuiBalaieDesComptesEstRattrapeParSonIp(): void
    {
        $throttle = $this->throttle();
        for ($i = 1; $i <= 10; $i++) {
            $throttle->recordFailure("compte$i@example.com", '203.0.113.7');
        }

        $this->assertTrue($throttle->captchaRequired('nouveau@example.com', '203.0.113.7'));
    }

    public function testLExigenceDuControleExpireAvecLaFenetre(): void
    {
        $throttle = $this->throttle();
        for ($i = 0; $i < 3; $i++) {
            $throttle->recordFailure('a@example.com', '203.0.113.7');
        }

        $this->now += LoginThrottle::WINDOW_SECONDS + 1;

        $this->assertFalse($throttle->captchaRequired('a@example.com', '203.0.113.7'));
    }
}
