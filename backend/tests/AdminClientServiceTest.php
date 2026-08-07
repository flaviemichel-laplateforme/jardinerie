<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Services\AdminClientService;
use App\Models\AdminClientModel;

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
}
