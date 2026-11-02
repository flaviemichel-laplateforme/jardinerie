<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\ClientIp;
use App\Core\SecurityLog;
use App\Models\SecurityEventModel;

class ClientIpSecurityLogTest extends TestCase
{
    private const SECRET = 'un-secret-de-relais-assez-long-0123456789abcdef';

    private array $savedEnv = [];

    protected function setUp(): void
    {
        foreach (['SECURITY_LOG_DISABLED', 'APP_ENV', 'PROXY_SHARED_SECRET'] as $key) {
            $this->savedEnv[$key] = $_ENV[$key] ?? null;
        }
    }

    protected function tearDown(): void
    {
        SecurityLog::useModel(null);
        unset($_SERVER['HTTP_USER_AGENT'], $_SERVER['HTTP_X_PROXY_SECRET'], $_SERVER['HTTP_X_FORWARDED_FOR'], $_SERVER['REMOTE_ADDR']);
        foreach ($this->savedEnv as $key => $value) {
            $value === null ? $this->forget($key) : $_ENV[$key] = $value;
        }
    }

    private function forget(string $key): void
    {
        unset($_ENV[$key]);
    }

    // ------------------------------------------------------------------ ClientIp

    public function testSansSecretOnUtiliseLAdresseDeLaConnexion(): void
    {
        $server = ['REMOTE_ADDR' => '198.51.100.20', 'HTTP_X_FORWARDED_FOR' => '203.0.113.7'];

        $this->assertSame('198.51.100.20', ClientIp::resolve($server, null));
        $this->assertSame('198.51.100.20', ClientIp::resolve($server, ''));
    }

    public function testUnXForwardedForInventeEstIgnoreSansLeBonSecret(): void
    {
        // Un visiteur qui appelle PHP directement ne doit pas pouvoir choisir l'IP sous laquelle il est limité
        $spoofed = ['REMOTE_ADDR' => '198.51.100.20', 'HTTP_X_FORWARDED_FOR' => '203.0.113.7'];

        $this->assertSame('198.51.100.20', ClientIp::resolve($spoofed, self::SECRET));
        $this->assertSame('198.51.100.20', ClientIp::resolve($spoofed + ['HTTP_X_PROXY_SECRET' => 'faux-secret'], self::SECRET));
    }

    public function testAvecLeBonSecretOnCroitLePremierXForwardedFor(): void
    {
        $server = ['REMOTE_ADDR' => '198.51.100.20', 'HTTP_X_PROXY_SECRET' => self::SECRET, 'HTTP_X_FORWARDED_FOR' => '203.0.113.7, 10.0.0.1'];

        $this->assertSame('203.0.113.7', ClientIp::resolve($server, self::SECRET));
        $this->assertTrue(ClientIp::isFromTrustedProxy($server, self::SECRET));
    }

    public function testLesAdressesIpv6SontAcceptees(): void
    {
        $server = ['REMOTE_ADDR' => '198.51.100.20', 'HTTP_X_PROXY_SECRET' => self::SECRET, 'HTTP_X_FORWARDED_FOR' => '2001:db8::7'];

        $this->assertSame('2001:db8::7', ClientIp::resolve($server, self::SECRET));
    }

    public function testUneValeurQuiNEstPasUneIpEstIgnoree(): void
    {
        $server = ['REMOTE_ADDR' => '198.51.100.20', 'HTTP_X_PROXY_SECRET' => self::SECRET];

        foreach (['pas-une-ip', '', '999.1.1.1', "203.0.113.7'; DROP TABLE users;--"] as $bad) {
            $this->assertSame('198.51.100.20', ClientIp::resolve($server + ['HTTP_X_FORWARDED_FOR' => $bad], self::SECRET), $bad);
        }
    }

    public function testSansAucuneAdresseValideOnRepondInconnue(): void
    {
        $this->assertSame('inconnue', ClientIp::resolve([], null));
        $this->assertSame('inconnue', ClientIp::resolve(['REMOTE_ADDR' => 'n-importe-quoi'], null));
    }

    // ---------------------------------------------------------------- SecurityLog

    public function testLEmailEstTouJoursHacheJamaisEnClair(): void
    {
        $hash = SecurityLog::hashEmail(' Camille@Example.COM ');

        $this->assertSame(hash('sha256', 'camille@example.com'), $hash);
        $this->assertStringNotContainsString('camille', $hash);
    }

    public function testLEvenementEnregistreContientIpAgentEtEmailHache(): void
    {
        $_ENV['SECURITY_LOG_DISABLED'] = 'false';
        $_ENV['APP_ENV'] = 'development';
        unset($_ENV['PROXY_SHARED_SECRET']);
        $_SERVER['REMOTE_ADDR'] = '198.51.100.20';
        $_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (test)';

        $model = $this->createMock(SecurityEventModel::class);
        $model->expects($this->once())->method('insert')->with([
            'user_id'    => 7,
            'email_hash' => hash('sha256', 'camille@example.com'),
            'event'      => 'login_failed',
            'ip'         => '198.51.100.20',
            'user_agent' => 'Mozilla/5.0 (test)',
            'details'    => '{"proxy_trusted":false}',
        ]);
        SecurityLog::useModel($model);

        SecurityLog::record(SecurityLog::LOGIN_FAILED, 7, 'Camille@example.com', ['proxy_trusted' => false]);
    }

    public function testUneErreurDEcritureNeCassePasLaRequete(): void
    {
        $_ENV['SECURITY_LOG_DISABLED'] = 'false';
        $_ENV['APP_ENV'] = 'development';

        $model = $this->createStub(SecurityEventModel::class);
        $model->method('insert')->willThrowException(new \RuntimeException('table absente'));
        SecurityLog::useModel($model);

        SecurityLog::record(SecurityLog::LOGIN_SUCCESS, 7);

        $this->addToAssertionCount(1); // l'erreur est seulement notée dans le journal du serveur
    }

    public function testLeJournalPeutEtreCoupeHorsProductionMaisJamaisEnProduction(): void
    {
        $_ENV['SECURITY_LOG_DISABLED'] = 'true';

        $_ENV['APP_ENV'] = 'development';
        $silent = $this->createMock(SecurityEventModel::class);
        $silent->expects($this->never())->method('insert');
        SecurityLog::useModel($silent);
        SecurityLog::record(SecurityLog::LOGIN_SUCCESS, 7);

        $_ENV['APP_ENV'] = 'production';
        $active = $this->createMock(SecurityEventModel::class);
        $active->expects($this->once())->method('insert');
        SecurityLog::useModel($active);
        SecurityLog::record(SecurityLog::LOGIN_SUCCESS, 7);
    }

    public function testLAgentEstTronqueEtLesDetailsTropLongsSontSignales(): void
    {
        $this->assertSame(255, mb_strlen(SecurityLog::userAgent(str_repeat('a', 400))));
        $this->assertNull(SecurityLog::userAgent(''));
        $this->assertNull(SecurityLog::userAgent(null));

        $this->assertNull(SecurityLog::encodeDetails([]));
        $this->assertSame('{"a":1}', SecurityLog::encodeDetails(['a' => 1]));
        // Un JSON coupé en plein milieu serait illisible : on préfère signaler qu'il était trop long
        $this->assertSame('{"tronque":true}', SecurityLog::encodeDetails(['texte' => str_repeat('x', 2000)]));
    }
}
