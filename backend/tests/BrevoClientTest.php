<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\BrevoClient;
use RuntimeException;

/**
 * Seule la validation de la configuration est testée ici : elle échoue AVANT tout appel réseau.
 * L'appel HTTP lui-même n'est pas testé automatiquement (il enverrait un vrai e-mail) ; il est vérifié à la main.
 */
class BrevoClientTest extends TestCase
{
    public function testCleVideLeveUneException(): void
    {
        $client = new BrevoClient('');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('BREVO_API_KEY');

        $client->send(['subject' => 'test']);
    }

    public function testCleFaiteDEspacesLeveUneException(): void
    {
        $client = new BrevoClient("   \n ");

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('BREVO_API_KEY');

        $client->send(['subject' => 'test']);
    }
}
