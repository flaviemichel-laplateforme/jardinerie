<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\Input;
use App\Core\SessionCookie;

class SessionCookieInputTest extends TestCase
{
    private array $savedEnv = [];

    protected function setUp(): void
    {
        foreach (['APP_ENV', 'COOKIE_SAMESITE'] as $key) {
            $this->savedEnv[$key] = $_ENV[$key] ?? null;
            unset($_ENV[$key]);
        }
    }

    protected function tearDown(): void
    {
        foreach ($this->savedEnv as $key => $value) {
            if ($value === null) {
                unset($_ENV[$key]);
            } else {
                $_ENV[$key] = $value;
            }
        }
    }

    // ------------------------------------------------------------ Cookie de session

    public function testEnDeveloppementLeCookieEstLaxSansSecure(): void
    {
        $options = SessionCookie::options(123);

        $this->assertSame('Lax', $options['samesite']);
        $this->assertFalse($options['secure']);
        $this->assertTrue($options['httponly']);
        $this->assertSame(123, $options['expires']);
    }

    public function testEnProductionLeCookieEstNoneEtSecureParDefaut(): void
    {
        $_ENV['APP_ENV'] = 'production';

        $options = SessionCookie::options(1);

        $this->assertSame('None', $options['samesite']);
        $this->assertTrue($options['secure']);
    }

    public function testLaBasculeVersLaxSeFaitParLeEnv(): void
    {
        $_ENV['APP_ENV'] = 'production';
        $_ENV['COOKIE_SAMESITE'] = 'lax';

        $options = SessionCookie::options(1);

        $this->assertSame('Lax', $options['samesite']);
        $this->assertTrue($options['secure']); // toujours Secure en production
    }

    public function testSameSiteNoneImposeSecureMemeEnDeveloppement(): void
    {
        $_ENV['COOKIE_SAMESITE'] = 'None';

        $this->assertTrue(SessionCookie::options(1)['secure']);
    }

    public function testUneValeurSameSiteInconnueRetombeSurLeDefaut(): void
    {
        $_ENV['COOKIE_SAMESITE'] = 'n-importe-quoi';

        $this->assertSame('Lax', SessionCookie::sameSite());
    }

    // ---------------------------------------------------------------- Lecture des entrées

    public function testUnChampQuiNEstPasDuTexteEstRefuse(): void
    {
        $data = ['a' => ['tableau'], 'b' => 12, 'c' => null, 'd' => true];

        foreach (['a', 'b', 'c', 'd', 'absent'] as $key) {
            $this->assertNull(Input::string($data, $key), $key);
        }
    }

    public function testLeTexteEstNettoyeSaufPourUnMotDePasse(): void
    {
        $data = ['name' => '  Camille  ', 'password' => '  secret  '];

        $this->assertSame('Camille', Input::string($data, 'name'));
        $this->assertSame('  secret  ', Input::string($data, 'password', 200, trim: false));
    }

    public function testUnTexteTropLongEstRefuseEnCaracteres(): void
    {
        $this->assertNull(Input::string(['n' => str_repeat('a', 101)], 'n', 100));
        $this->assertNotNull(Input::string(['n' => str_repeat('é', 100)], 'n', 100)); // 100 caractères, 200 octets
    }

    public function testLEmailEstNormaliseEnMinuscules(): void
    {
        $this->assertSame('camille@example.com', Input::email(['email' => ' Camille@Example.COM ']));
    }

    public function testUnEmailInvalideEstRefuse(): void
    {
        foreach (['pas-un-email', 'a@', '@b.fr', ['a@b.fr'], 5, str_repeat('a', 250) . '@b.fr'] as $value) {
            $this->assertNull(Input::email(['email' => $value]), json_encode($value));
        }
    }
}
