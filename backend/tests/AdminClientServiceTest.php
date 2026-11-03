<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Services\AdminClientService;
use App\Models\AdminClientModel;
use App\Models\AccountTokenModel;
use App\Models\UserModel;
use App\Services\EmailService;

class AdminClientServiceTest extends TestCase
{
    // CAS 1 : Le cas nominal, tout doit bien se passer
    public function testUpdateRoldeReussitPourUnAutreClient(): void
    {
        $fauxModel = $this->createStub(AdminClientModel::class);

        // On programme les réponses du faux modèle : 
        $fauxModel->method('getById')->willReturn(['id' => 5, 'role' => 'customer']);
        $fauxModel->method('countAdmins')->willReturn(2);

        $service = new AdminClientService($fauxModel);

        // L'admin connecté (id1) modifie le client cible 'id 5)
        $resultat = $service->updateRole(5, 'admin', 1);

        $this->assertTrue($resultat['success']);
        $this->assertEquals(200, $resultat['code']);
    }

    // Cas 2 : un admin ne doit jamais pouvoir modifier son propre rôle
    public function testUpdateRoleRefuseAutoModification(): void
    {
        $fauxModele = $this->createStub(AdminClientModel::class);
        $fauxModele->method('getById')->willReturn(['id' => 1, 'role' => 'admin']);

        $service = new AdminClientService($fauxModele);

        // L'admin connecté (id 1) essaie de modifier SON PROPRE compte (id 1 aussi)
        $resultat = $service->updateRole(1, 'customer', 1);

        $this->assertFalse($resultat['success']);
        $this->assertEquals(403, $resultat['code']);
    }

    // Cas 3 : impossible de rétrograder le tout dernier administrateur
    public function testUpdateRoleRefuseDernierAdmin(): void
    {
        $fauxModele = $this->createStub(AdminClientModel::class);
        $fauxModele->method('getById')->willReturn(['id' => 5, 'role' => 'admin']);
        $fauxModele->method('countAdmins')->willReturn(1);

        $service = new AdminClientService($fauxModele);
        // L'admin connecté (id 1) essaie de modifier le dernier administrateur
        $resultat = $service->updateRole(5, 'customer', 1);

        $this->assertFalse($resultat['success']);
        $this->assertEquals(403, $resultat['code']);
    }

    // Cas 4 : on ne peut pas non plus anonymiser le dernier administrateur (sinon plus personne ne gère la boutique)
    public function testAnonymisationRefuseeSurLeDernierAdmin(): void
    {
        $fauxModele = $this->createStub(AdminClientModel::class);
        $fauxModele->method('getById')->willReturn(['id' => 5, 'role' => 'admin']);
        $fauxModele->method('countAdmins')->willReturn(1);

        // Le modèle utilisateur ne doit jamais être appelé
        $users = $this->createMock(UserModel::class);
        $users->expects($this->never())->method('anonymize');

        $resultat = (new AdminClientService($fauxModele, userModel: $users))->anonymizeClient(5, 1);

        $this->assertSame(403, $resultat['code']);
        $this->assertSame("Impossible d'anonymiser le dernier administrateur.", $resultat['message']);
    }

    public function testAnonymisationRefuseeSurSonPropreCompte(): void
    {
        $fauxModele = $this->createStub(AdminClientModel::class);
        $fauxModele->method('getById')->willReturn(['id' => 1, 'role' => 'admin']);
        $fauxModele->method('countAdmins')->willReturn(3);

        $users = $this->createMock(UserModel::class);
        $users->expects($this->never())->method('anonymize');

        $this->assertSame(403, (new AdminClientService($fauxModele, userModel: $users))->anonymizeClient(1, 1)['code']);
    }

    public function testRoleInvalideRefuseAvantToutAccesALaBase(): void
    {
        $model = $this->createMock(AdminClientModel::class);
        $model->expects($this->never())->method('getById');

        $this->assertSame(400, (new AdminClientService($model))->updateRole(5, 'superadmin', 1)['code']);
        $this->assertSame(400, (new AdminClientService($model))->updateRole(5, null, 1)['code']);
    }

    public function testLienDeReinitialisationValableUneHeureVersLeSiteConfigure(): void
    {
        $fauxModele = $this->createStub(AdminClientModel::class);
        $fauxModele->method('getById')->willReturn(['id' => 5, 'email' => 'cliente@example.invalid', 'first_name' => 'Rose']);

        $tokens = $this->createMock(AccountTokenModel::class);
        $tokens->expects($this->once())->method('create')->with(5, 'password_reset', 60)->willReturn('jeton123');

        $mails = $this->createMock(EmailService::class);
        $mails->expects($this->once())->method('sendPasswordResetLink')
            ->with('cliente@example.invalid', 'Rose', 'https://boutique.example/reinitialiser-mot-de-passe?token=jeton123')
            ->willReturn(true);

        $previous = $_ENV['FRONTEND_URL'] ?? null;
        $_ENV['FRONTEND_URL'] = 'https://boutique.example';
        try {
            $resultat = (new AdminClientService($fauxModele, tokenModel: $tokens, emailService: $mails))->sendPasswordResetLink(5);
        } finally {
            if ($previous === null) {
                unset($_ENV['FRONTEND_URL']);
            } else {
                $_ENV['FRONTEND_URL'] = $previous;
            }
        }

        $this->assertSame(200, $resultat['code']);
    }

    public function testDefautActuelLEchecDEnvoiDuMailEstAnnonceCommeUnSucces(): void
    {
        // DÉFAUT ACTUEL : sendPasswordResetLink() renvoie false quand Brevo refuse, mais le service ne le vérifie pas
        // et répond « envoyé ». À corriger avec l'admin (N4-d) : l'administrateur doit savoir que le client n'a rien reçu.
        $fauxModele = $this->createStub(AdminClientModel::class);
        $fauxModele->method('getById')->willReturn(['id' => 5, 'email' => 'cliente@example.invalid', 'first_name' => 'Rose']);
        $tokens = $this->createStub(AccountTokenModel::class);
        $tokens->method('create')->willReturn('jeton123');
        $mails = $this->createStub(EmailService::class);
        $mails->method('sendPasswordResetLink')->willReturn(false);

        $resultat = (new AdminClientService($fauxModele, tokenModel: $tokens, emailService: $mails))->sendPasswordResetLink(5);

        $this->assertSame(200, $resultat['code']);
    }

    public function testUneErreurTechniqueNeDevoilePasSonDetail(): void
    {
        $fauxModele = $this->createStub(AdminClientModel::class);
        $fauxModele->method('countClients')->willThrowException(new \PDOException('SQLSTATE[HY000] secret'));

        $resultat = (new AdminClientService($fauxModele))->getClients(null, null);

        $this->assertSame(500, $resultat['code']);
        $this->assertStringNotContainsString('SQLSTATE', $resultat['message']);
    }
}
