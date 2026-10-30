<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\JwtHelper;
use RuntimeException;

class JwtHelperTest extends TestCase
{
    private const SECRET = 'un-secret-de-test-assez-long-0123456789';

    private string $savedEnv;

    protected function setUp(): void
    {
        $this->savedEnv = $_ENV['APP_ENV'] ?? 'development';
        $_ENV['APP_ENV'] = 'development';
    }

    protected function tearDown(): void
    {
        $_ENV['APP_ENV'] = $this->savedEnv;
    }

    private static function base64Url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /** Fabrique un jeton à la main : permet de tester des jetons que generate() ne produirait jamais. */
    private function forge(array $header, array $payload, string $secret = self::SECRET): string
    {
        $head = self::base64Url(json_encode($header));
        $body = self::base64Url(json_encode($payload));
        $sig  = self::base64Url(hash_hmac('sha256', "$head.$body", $secret, true));

        return "$head.$body.$sig";
    }

    private function validPayload(array $override = []): array
    {
        return array_merge(['id' => 7, 'role' => 'customer', 'iss' => JwtHelper::ISSUER, 'iat' => time(), 'exp' => time() + 3600], $override);
    }

    public function testUnJetonGenereEstVerifiable(): void
    {
        $token   = JwtHelper::generate(['id' => 7, 'role' => 'customer'], self::SECRET, 3600);
        $payload = JwtHelper::verify($token, self::SECRET);

        $this->assertSame(7, $payload['id']);
        $this->assertSame('customer', $payload['role']);
        $this->assertSame(JwtHelper::ISSUER, $payload['iss']);
    }

    public function testUnMauvaisSecretEstRefuse(): void
    {
        $token = JwtHelper::generate(['id' => 7], self::SECRET);

        $this->assertNull(JwtHelper::verify($token, 'un-autre-secret-assez-long-0123456789-abc'));
    }

    public function testUnJetonFalsifieEstRefuse(): void
    {
        // Même signature, mais la charge utile a été modifiée pour passer administrateur
        [$head, , $sig] = explode('.', JwtHelper::generate(['id' => 7, 'role' => 'customer'], self::SECRET));
        $tampered = $head . '.' . self::base64Url(json_encode($this->validPayload(['role' => 'admin']))) . '.' . $sig;

        $this->assertNull(JwtHelper::verify($tampered, self::SECRET));
    }

    public function testAlgNoneEstRefuse(): void
    {
        $head = self::base64Url(json_encode(['typ' => 'JWT', 'alg' => 'none']));
        $body = self::base64Url(json_encode($this->validPayload(['role' => 'admin'])));

        $this->assertNull(JwtHelper::verify("$head.$body.", self::SECRET));
        $this->assertNull(JwtHelper::verify("$head.$body", self::SECRET));
    }

    public function testUnAutreAlgorithmeAnnonceEstRefuseMemeBienSigne(): void
    {
        $token = $this->forge(['typ' => 'JWT', 'alg' => 'RS256'], $this->validPayload());

        $this->assertNull(JwtHelper::verify($token, self::SECRET));
    }

    public function testUnJetonExpireEstRefuse(): void
    {
        $token = $this->forge(['typ' => 'JWT', 'alg' => 'HS256'], $this->validPayload(['iat' => time() - 7200, 'exp' => time() - 3600]));

        $this->assertNull(JwtHelper::verify($token, self::SECRET));
    }

    public function testUnJetonSansExpirationEstRefuse(): void
    {
        $payload = $this->validPayload();
        unset($payload['exp']);

        $this->assertNull(JwtHelper::verify($this->forge(['typ' => 'JWT', 'alg' => 'HS256'], $payload), self::SECRET));
    }

    public function testUnJetonEmisDansLeFuturEstRefuse(): void
    {
        $token = $this->forge(['typ' => 'JWT', 'alg' => 'HS256'], $this->validPayload(['iat' => time() + 3600]));

        $this->assertNull(JwtHelper::verify($token, self::SECRET));
    }

    public function testUnJetonDUnAutreEmetteurEstRefuse(): void
    {
        $token = $this->forge(['typ' => 'JWT', 'alg' => 'HS256'], $this->validPayload(['iss' => 'un-autre-site']));

        $this->assertNull(JwtHelper::verify($token, self::SECRET));
    }

    public function testDesJetonsMalFormesSontRefuses(): void
    {
        foreach (['', 'abc', 'a.b', 'a.b.c.d', '..', 'a.b.c'] as $garbage) {
            $this->assertNull(JwtHelper::verify($garbage, self::SECRET), $garbage);
        }
    }

    public function testUnSecretCourtEstRefuse(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('JWT_SECRET trop court');

        JwtHelper::generate(['id' => 1], 'trop-court');
    }

    public function testLeSecretDExemplePublieEstRefuseEnProduction(): void
    {
        $_ENV['APP_ENV'] = 'production';

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('valeur d\'exemple');

        JwtHelper::generate(['id' => 1], 'Key_Jardinerie_Secret_Key_2026_Super_Secure!*');
    }

    public function testLeSecretDExempleResteUtilisableEnDeveloppement(): void
    {
        $token = JwtHelper::generate(['id' => 1], 'Key_Jardinerie_Secret_Key_2026_Super_Secure!*');

        $this->assertNotNull(JwtHelper::verify($token, 'Key_Jardinerie_Secret_Key_2026_Super_Secure!*'));
    }
}
