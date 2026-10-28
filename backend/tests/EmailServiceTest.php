<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\BrevoClient;
use App\Services\EmailService;
use RuntimeException;

/**
 * Le client Brevo est simulé : aucun e-mail n'est envoyé, aucun appel réseau n'est fait.
 */
class EmailServiceTest extends TestCase
{
    private const ENV_KEYS = ['MAIL_FROM_EMAIL', 'MAIL_FROM_NAME', 'MAIL_REPLY_TO', 'MAIL_TAG'];

    private array $savedEnv = [];

    protected function setUp(): void
    {
        foreach (self::ENV_KEYS as $key) {
            $this->savedEnv[$key] = $_ENV[$key] ?? null;
            unset($_ENV[$key]);
        }

        $_ENV['MAIL_FROM_EMAIL'] = 'expediteur@example.com';
        $_ENV['MAIL_TAG']        = 'jardinerie';
    }

    protected function tearDown(): void
    {
        foreach (self::ENV_KEYS as $key) {
            if ($this->savedEnv[$key] === null) {
                unset($_ENV[$key]);
            } else {
                $_ENV[$key] = $this->savedEnv[$key];
            }
        }
    }

    /** Un client simulé qui garde le message reçu dans $captured. */
    private function brevoCapturing(array &$captured): BrevoClient
    {
        $brevo = $this->createMock(BrevoClient::class);
        $brevo->expects($this->once())
            ->method('send')
            ->willReturnCallback(function (array $payload) use (&$captured): void {
                $captured = $payload;
            });

        return $brevo;
    }

    // ------------------------------------------------------ Vérification d'adresse

    public function testEmailDeVerification(): void
    {
        $payload = [];
        $service = new EmailService($this->brevoCapturing($payload));

        $sent = $service->sendVerificationEmail('camille@example.com', 'Camille', 'https://site.test/verifier?token=abc');

        $this->assertTrue($sent);
        $this->assertSame('expediteur@example.com', $payload['sender']['email']);
        $this->assertSame('La Jardinerie', $payload['sender']['name']);
        $this->assertSame([['email' => 'camille@example.com']], $payload['to']);
        $this->assertSame('Confirmez votre adresse email — La Jardinerie', $payload['subject']);
        $this->assertStringContainsString('https://site.test/verifier?token=abc', $payload['htmlContent']);
        $this->assertSame(['jardinerie'], $payload['tags']);
    }

    // ------------------------------------------------------------ Bouton des e-mails

    public function testLeBoutonResteUneSeulePastilleSurEcranEtroit(): void
    {
        // Un simple <a> avec du padding se découpe en morceaux quand son texte passe sur deux lignes.
        // Le bouton doit être une cellule de tableau (fond et arrondi) contenant un lien inline-block.
        foreach (['sendVerificationEmail' => 'https://site.test/v', 'sendPasswordResetLink' => 'https://site.test/r'] as $method => $url) {
            $payload = [];
            $service = new EmailService($this->brevoCapturing($payload));
            $service->$method('a@example.com', 'A', $url);

            $html = $payload['htmlContent'];
            $this->assertStringContainsString("role='presentation'", $html, $method);
            $this->assertStringContainsString("bgcolor='#027148'", $html, $method);
            $this->assertStringContainsString('display: inline-block', $html, $method);
            $this->assertStringContainsString("href='$url'", $html, $method);
        }
    }

    public function testLeLienDeSecoursEstAffichePourLesDeuxEmailsAvecBouton(): void
    {
        foreach (['sendVerificationEmail' => 'https://site.test/v?token=abc', 'sendPasswordResetLink' => 'https://site.test/r?token=xyz'] as $method => $url) {
            $payload = [];
            $service = new EmailService($this->brevoCapturing($payload));
            $service->$method('a@example.com', 'A', $url);

            $html = $payload['htmlContent'];
            $this->assertStringContainsString('Si le bouton ne fonctionne pas', $html, $method);
            // L'adresse apparaît trois fois : dans le bouton, puis dans le lien de secours (cible et texte visible)
            $this->assertSame(3, substr_count($html, $url), $method);
            // Une longue adresse ne doit pas déborder de l'écran sur mobile
            $this->assertStringContainsString('word-break: break-all', $html, $method);
        }
    }

    public function testLUrlDuBoutonEstEchappeeDansLAttribut(): void
    {
        $payload = [];
        $service = new EmailService($this->brevoCapturing($payload));

        $service->sendVerificationEmail('a@example.com', 'A', "https://site.test/v?token=abc&x=1'><script>");

        $this->assertStringContainsString('token=abc&amp;x=1&#039;&gt;&lt;script&gt;', $payload['htmlContent']);
        $this->assertStringNotContainsString('<script>', $payload['htmlContent']);
    }

    // ------------------------------------------------ Réinitialisation du mot de passe

    public function testEmailDeReinitialisationDuMotDePasse(): void
    {
        $payload = [];
        $service = new EmailService($this->brevoCapturing($payload));

        $sent = $service->sendPasswordResetLink('camille@example.com', 'Camille', 'https://site.test/reset?token=xyz');

        $this->assertTrue($sent);
        $this->assertSame('Réinitialisation de votre mot de passe — La Jardinerie', $payload['subject']);
        $this->assertStringContainsString('https://site.test/reset?token=xyz', $payload['htmlContent']);
    }

    // ------------------------------------------------------ Confirmation de commande

    public function testEmailDeConfirmationDeCommande(): void
    {
        $payload = [];
        $service = new EmailService($this->brevoCapturing($payload));

        $items = [
            ['name' => 'Basilic Grand Vert', 'quantity' => 2, 'unit_price' => 4.9, 'line_total' => 9.8],
        ];

        $sent = $service->sendOrderConfirmation('camille@example.com', 'Camille', 'CMD-2026-0042', $items, 9.8, 7.9);

        $this->assertTrue($sent);
        $this->assertSame('Confirmation de commande CMD-2026-0042 — La Jardinerie', $payload['subject']);
        $this->assertStringContainsString('CMD-2026-0042', $payload['htmlContent']);
        $this->assertStringContainsString('Basilic Grand Vert', $payload['htmlContent']);
        $this->assertStringContainsString('17,70', $payload['htmlContent']); // 9,80 + 7,90 de livraison
    }

    // -------------------------------------------------------------- Configuration

    public function testNomEtAdresseDeReponseParDefautOuPersonnalises(): void
    {
        $payload = [];
        $service = new EmailService($this->brevoCapturing($payload));
        $service->sendVerificationEmail('a@example.com', 'A', 'https://site.test/v');

        // Par défaut : on répond à l'expéditeur
        $this->assertSame(['email' => 'expediteur@example.com'], $payload['replyTo']);

        $_ENV['MAIL_FROM_NAME'] = 'Autre Site';
        $_ENV['MAIL_REPLY_TO']  = 'contact@example.com';
        $payload = [];
        $service = new EmailService($this->brevoCapturing($payload));
        $service->sendVerificationEmail('a@example.com', 'A', 'https://site.test/v');

        $this->assertSame('Autre Site', $payload['sender']['name']);
        $this->assertSame(['email' => 'contact@example.com'], $payload['replyTo']);
    }

    public function testSansEtiquetteLeChampTagsEstAbsent(): void
    {
        unset($_ENV['MAIL_TAG']);
        $payload = [];
        $service = new EmailService($this->brevoCapturing($payload));

        $service->sendVerificationEmail('a@example.com', 'A', 'https://site.test/v');

        $this->assertArrayNotHasKey('tags', $payload);
    }

    public function testSansExpediteurConfigureOnNEnvoieRienEtOnRenvoieFalse(): void
    {
        unset($_ENV['MAIL_FROM_EMAIL']);
        $brevo = $this->createMock(BrevoClient::class);
        $brevo->expects($this->never())->method('send');
        $service = new EmailService($brevo);

        $this->assertFalse($service->sendVerificationEmail('a@example.com', 'A', 'https://site.test/v'));
    }

    // ------------------------------------------------------------------ Échecs

    public function testUnEchecDEnvoiNeSePropagePasEtRenvoieFalse(): void
    {
        $brevo = $this->createStub(BrevoClient::class);
        $brevo->method('send')->willThrowException(new RuntimeException('Brevo a refusé l\'envoi (HTTP 401) : Key not found'));
        $service = new EmailService($brevo);

        // Une commande ou un compte déjà créé ne doit jamais échouer à cause d'un e-mail
        $this->assertFalse($service->sendVerificationEmail('a@example.com', 'A', 'https://site.test/v'));
        $this->assertFalse($service->sendPasswordResetLink('a@example.com', 'A', 'https://site.test/r'));
        $this->assertFalse($service->sendOrderConfirmation('a@example.com', 'A', 'CMD-1', [], 10.0, 0.0));
    }
}
