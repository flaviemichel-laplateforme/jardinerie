<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\ApiResponse;
use App\Core\InMemoryRateLimitStore;
use App\Core\LoginThrottle;
use App\Core\RateLimiter;
use App\Core\RateLimitStore;

class RateLimitTest extends TestCase
{
    private int $now = 1000;

    private function limiter(?RateLimitStore $store = null): RateLimiter
    {
        return new RateLimiter($store ?? new InMemoryRateLimitStore(fn(): int => $this->now));
    }

    // ------------------------------------------------------- attempt() : chaque tentative compte

    public function testLesTentativesSontPermisesJusquAuSeuil(): void
    {
        $limiter = $this->limiter();

        for ($i = 1; $i <= 3; $i++) {
            $this->assertTrue($limiter->attempt('register_ip', '203.0.113.7', 3, 3600)['allowed'], "tentative $i");
        }

        $fourth = $limiter->attempt('register_ip', '203.0.113.7', 3, 3600);
        $this->assertFalse($fourth['allowed']);
        $this->assertSame(3600, $fourth['retryAfter']);
    }

    public function testLeBlocageNEstSignaleQuUneFoisParFenetre(): void
    {
        // Sans cela, une attaque qui insiste remplirait le journal de sécurité d'une ligne par requête refusée
        $limiter = $this->limiter();
        $flags = [];
        for ($i = 1; $i <= 6; $i++) {
            $flags[] = $limiter->attempt('reset_request_email', 'a@example.com', 3, 3600)['justBlocked'];
        }

        $this->assertSame([false, false, false, true, false, false], $flags);
    }

    public function testLaFenetreSeReferme(): void
    {
        $limiter = $this->limiter();
        $limiter->attempt('x', 'v', 1, 600);
        $this->assertFalse($limiter->attempt('x', 'v', 1, 600)['allowed']);

        $this->now += 600; // la fenêtre de 10 minutes est terminée

        $this->assertTrue($limiter->attempt('x', 'v', 1, 600)['allowed']);
    }

    public function testLeTempsRestantDiminueAvecLHorloge(): void
    {
        $limiter = $this->limiter();
        $limiter->attempt('x', 'v', 1, 600);
        $limiter->attempt('x', 'v', 1, 600);

        $this->now += 240;

        $this->assertSame(360, $limiter->attempt('x', 'v', 1, 600)['retryAfter']);
    }

    public function testLesCompteursSontIndependantsParActionEtParValeur(): void
    {
        $limiter = $this->limiter();
        $limiter->attempt('register_ip', '203.0.113.7', 1, 3600);

        $this->assertFalse($limiter->attempt('register_ip', '203.0.113.7', 1, 3600)['allowed']);
        $this->assertTrue($limiter->attempt('register_ip', '203.0.113.8', 1, 3600)['allowed'], 'une autre IP');
        $this->assertTrue($limiter->attempt('reset_request_ip', '203.0.113.7', 1, 3600)['allowed'], 'une autre action');
    }

    public function testLaCleIgnoreLesMajusculesEtLesEspaces(): void
    {
        $limiter = $this->limiter();
        $limiter->attempt('reset_request_email', 'Camille@Example.com', 1, 3600);

        $this->assertFalse($limiter->attempt('reset_request_email', ' camille@example.com ', 1, 3600)['allowed']);
    }

    public function testLaCleDuCompteurNeContientNiAdresseNiIp(): void
    {
        $bucket = RateLimiter::bucket('login_pair', 'camille@example.com|203.0.113.7');

        $this->assertSame(64, strlen($bucket));
        $this->assertStringNotContainsString('camille', $bucket);
        $this->assertStringNotContainsString('203.0.113', $bucket);
    }

    // -------------------------------------------- check() / fail() / clear() : seuls les échecs comptent

    public function testSeulsLesEchecsComptent(): void
    {
        $limiter = $this->limiter();

        $this->assertFalse($limiter->check('password_change_user', '7', 3, 900)['blocked']);
        $limiter->fail('password_change_user', '7', 3, 900);
        $limiter->fail('password_change_user', '7', 3, 900);
        $this->assertFalse($limiter->check('password_change_user', '7', 3, 900)['blocked'], '2 échecs sur 3 : pas encore bloqué');

        $third = $limiter->fail('password_change_user', '7', 3, 900);
        $this->assertTrue($third['locked']);
        $this->assertTrue($third['justLocked']);
        $this->assertTrue($limiter->check('password_change_user', '7', 3, 900)['blocked']);
        $this->assertFalse($limiter->fail('password_change_user', '7', 3, 900)['justLocked'], 'les échecs suivants ne sont pas « le premier »');
    }

    public function testCheckNeCompteRien(): void
    {
        $limiter = $this->limiter();
        for ($i = 0; $i < 10; $i++) {
            $limiter->check('login_pair', 'a|b', 5, 900);
        }

        $this->assertFalse($limiter->check('login_pair', 'a|b', 5, 900)['blocked']);
    }

    public function testUneReussiteRemetLeCompteurAZero(): void
    {
        $limiter = $this->limiter();
        for ($i = 0; $i < 4; $i++) {
            $limiter->fail('login_pair', 'a|b', 5, 900);
        }

        $limiter->clear('login_pair', 'a|b');

        $this->assertFalse($limiter->fail('login_pair', 'a|b', 5, 900)['locked'], 'repart de 1 échec, pas de 5');
    }

    // ------------------------------------------------------------ Pannes et mode désactivé

    public function testSiLeMagasinPlanteLesRequetesPassent(): void
    {
        // La limitation ne doit jamais empêcher de se connecter : en cas de panne (table absente, base injoignable), on laisse passer
        $broken = new class implements RateLimitStore {
            public function hit(string $bucket, int $windowSeconds): array { throw new \RuntimeException('base injoignable'); }
            public function peek(string $bucket, int $windowSeconds): array { throw new \RuntimeException('base injoignable'); }
            public function clear(string $bucket): void { throw new \RuntimeException('base injoignable'); }
            public function purge(): void { throw new \RuntimeException('base injoignable'); }
        };
        $limiter = $this->limiter($broken);

        $this->assertTrue($limiter->attempt('x', 'v', 1, 60)['allowed']);
        $this->assertFalse($limiter->check('x', 'v', 1, 60)['blocked']);
        $this->assertFalse($limiter->fail('x', 'v', 1, 60)['locked']);
        $limiter->clear('x', 'v');
        $this->addToAssertionCount(1); // aucune exception ne sort
    }

    public function testUnLimiteurDesactiveLaissePasserEtNeCompteRien(): void
    {
        $limiter = new RateLimiter(new InMemoryRateLimitStore(fn(): int => $this->now), false);

        for ($i = 0; $i < 20; $i++) {
            $this->assertTrue($limiter->attempt('x', 'v', 1, 60)['allowed']);
        }
    }

    public function testLaDesactivationNEstPasPriseEnCompteEnProduction(): void
    {
        $saved = [$_ENV['APP_ENV'] ?? null, $_ENV['RATE_LIMIT_DISABLED'] ?? null];
        try {
            $_ENV['RATE_LIMIT_DISABLED'] = 'true';

            $_ENV['APP_ENV'] = 'development';
            $this->assertFalse(RateLimiter::fromEnvironment()->isEnabled());

            // Une variable oubliée dans le .env de production ne doit jamais couper la protection
            $_ENV['APP_ENV'] = 'production';
            $this->assertTrue(RateLimiter::fromEnvironment()->isEnabled());
        } finally {
            foreach (['APP_ENV', 'RATE_LIMIT_DISABLED'] as $i => $key) {
                $saved[$i] === null ? $this->unsetEnv($key) : $_ENV[$key] = $saved[$i];
            }
        }
    }

    private function unsetEnv(string $key): void
    {
        unset($_ENV[$key]);
    }

    // ------------------------------------------------------------------ Règle de connexion

    public function testLaConnexionEstBloqueeApresCinqEchecsDuMemeCouple(): void
    {
        $throttle = new LoginThrottle($this->limiter());

        for ($i = 1; $i <= 4; $i++) {
            $this->assertFalse($throttle->recordFailure('a@example.com', '203.0.113.7')['locked'], "échec $i");
        }
        $this->assertFalse($throttle->check('a@example.com', '203.0.113.7')['blocked']);

        $fifth = $throttle->recordFailure('a@example.com', '203.0.113.7');
        $this->assertTrue($fifth['locked']);
        $this->assertTrue($fifth['justLocked']);

        $check = $throttle->check('a@example.com', '203.0.113.7');
        $this->assertTrue($check['blocked']);
        $this->assertSame(LoginThrottle::WINDOW_SECONDS, $check['retryAfter']);
    }

    public function testUnAutreCompteOuUneAutreIpNEstPasBloqueParLeCouple(): void
    {
        $throttle = new LoginThrottle($this->limiter());
        for ($i = 0; $i < 5; $i++) {
            $throttle->recordFailure('a@example.com', '203.0.113.7');
        }

        $this->assertFalse($throttle->check('b@example.com', '203.0.113.7')['blocked'], 'autre compte, même IP');
        $this->assertFalse($throttle->check('a@example.com', '203.0.113.8')['blocked'], 'même compte, autre IP');
    }

    public function testLeCompteurParAdressePlafonneUneAttaqueQuiChangeDIp(): void
    {
        // 20 échecs sur la même adresse, chacun depuis une IP différente : aucun couple n'atteint 5, mais l'adresse est freinée
        $throttle = new LoginThrottle($this->limiter());
        for ($i = 1; $i <= 20; $i++) {
            $throttle->recordFailure('victime@example.com', "203.0.113.$i");
        }

        $this->assertTrue($throttle->check('victime@example.com', '198.51.100.99')['blocked']);
        $this->assertFalse($throttle->check('autre@example.com', '198.51.100.99')['blocked']);
    }

    public function testLeCompteurParIpEmpecheDeBalayerDesComptes(): void
    {
        $throttle = new LoginThrottle($this->limiter());
        for ($i = 1; $i <= 30; $i++) {
            $throttle->recordFailure("compte$i@example.com", '203.0.113.7');
        }

        $this->assertTrue($throttle->check('nouveau@example.com', '203.0.113.7')['blocked']);
        $this->assertFalse($throttle->check('nouveau@example.com', '203.0.113.8')['blocked']);
    }

    public function testUneConnexionReussieRemetLeCoupleAZero(): void
    {
        $throttle = new LoginThrottle($this->limiter());
        for ($i = 0; $i < 4; $i++) {
            $throttle->recordFailure('a@example.com', '203.0.113.7');
        }

        $throttle->recordSuccess('a@example.com', '203.0.113.7');

        $this->assertFalse($throttle->recordFailure('a@example.com', '203.0.113.7')['locked']);
    }

    public function testLeBlocageSeLeveAvecLeTemps(): void
    {
        $throttle = new LoginThrottle($this->limiter());
        for ($i = 0; $i < 5; $i++) {
            $throttle->recordFailure('a@example.com', '203.0.113.7');
        }
        $this->assertTrue($throttle->check('a@example.com', '203.0.113.7')['blocked']);

        $this->now += LoginThrottle::WINDOW_SECONDS;

        $this->assertFalse($throttle->check('a@example.com', '203.0.113.7')['blocked']);
    }

    // --------------------------------------------------------------------- Réponse 429

    public function testLeMessageDAttenteArrondiAuDessus(): void
    {
        $this->assertSame('Trop de tentatives. Réessayez dans 1 minute.', ApiResponse::waitMessage(1));
        $this->assertSame('Trop de tentatives. Réessayez dans 1 minute.', ApiResponse::waitMessage(60));
        $this->assertSame('Trop de tentatives. Réessayez dans 2 minutes.', ApiResponse::waitMessage(61));
        $this->assertSame('Trop de tentatives. Réessayez dans 15 minutes.', ApiResponse::waitMessage(900));
    }

    public function testLaReponse429PorteLeCodeEtLeTempsDAttente(): void
    {
        ob_start();
        ApiResponse::tooManyRequests(840);
        $body = json_decode((string) ob_get_clean(), true);

        $this->assertSame(429, http_response_code());
        $this->assertFalse($body['success']);
        $this->assertSame(840, $body['retry_after']);
        $this->assertSame('Trop de tentatives. Réessayez dans 14 minutes.', $body['message']);
    }
}
