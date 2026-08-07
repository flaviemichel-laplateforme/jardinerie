<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Services\AuthService;
use App\Models\UserModel;

class AuthServiceTest extends TestCase
{
    public function testInscriptionRefuseeSiEmailDejaUtilise(): void
    {
        $fauxUserModel = $this->createStub(UserModel::class);
        $fauxUserModel->method('getUserByEmail')->willReturn(['id' => 1, 'email' => 'existe@deja.com']);

        $service = new AuthService(userModel: $fauxUserModel);

        $donnees = [
            'first_name' => 'Test',
            'last_name'  => 'Nom',
            'email'      => 'existe@deja.com',
            'password'   => 'MotDePasse123*',
        ];

        $resultat = $service->register($donnees);


        $this->assertFalse($resultat['success']);
        $this->assertEquals(409, $resultat['code']);
    }

    public function testInscriptionRefuseeSiConsentementNonCoche(): void
    {
        $fauxUserModel = $this->createStub(UserModel::class);
        $fauxUserModel->method('getUserByEmail')->willReturn(false);

        $service = new AuthService(userModel: $fauxUserModel);

        $donnees = [
            'first_name' => 'Test',
            'last_name'  => 'Nom',
            'email'      => 'nouveau@demail.com',
            'password'   => 'MotDePasse123*',
            'gdpr_consent' => false,
        ];

        $resultat = $service->register($donnees);

        $this->assertFalse($resultat['success']);
        $this->assertEquals(400, $resultat['code']);
    }

    public function testInscriptionRefuseeSiPrenomManquant(): void
    {
        $fauxUserModel = $this->createStub(UserModel::class);
        $fauxUserModel->method('getUserByEmail')->willReturn(false);

        $service = new AuthService(userModel: $fauxUserModel);

        $donnees = [
            'first_name' => '',
            'last_name'  => 'Nom',
            'email'      => 'nouveau@demail.com',
            'password'   => 'MotDePasse123*',
            'gdpr_consent' => true,
        ];

        $resultat = $service->register($donnees);

        $this->assertFalse($resultat['success']);
        $this->assertEquals(400, $resultat['code']);
    }

    public function testInscriptionRefuseeSiNomManquant(): void
    {
        $fauxUserModel = $this->createStub(UserModel::class);
        $fauxUserModel->method('getUserByEmail')->willReturn(false);

        $service = new AuthService(userModel: $fauxUserModel);

        $donnees = [
            'first_name' => 'Flavie',
            'last_name'  => '',
            'email'      => 'nouveau@demail.com',
            'password'   => 'MotDePasse123*',
            'gdpr_consent' => true,
        ];

        $resultat = $service->register($donnees);

        $this->assertFalse($resultat['success']);
        $this->assertEquals(400, $resultat['code']);
    }

    public function testInscriptionRefuseeSiMotDePasseManquant(): void
    {
        $fauxUserModel = $this->createStub(UserModel::class);
        $fauxUserModel->method('getUserByEmail')->willReturn(false);

        $service = new AuthService(userModel: $fauxUserModel);

        $donnees = [
            'first_name' => 'Flavie',
            'last_name'  => 'Michel',
            'email'      => 'nouveau@demail.com',
            'password'   => '',
            'gdpr_consent' => true,
        ];

        $resultat = $service->register($donnees);

        $this->assertFalse($resultat['success']);
        $this->assertEquals(400, $resultat['code']);
    }

    public function testInscriptionReussie(): void
    {
        $fauxUserModel = $this->createStub(UserModel::class);
        $fauxUserModel->method('getUserByEmail')->willReturn(false);
        $fauxUserModel->method('create')->willReturn(42);

        $fauxTokenModel = $this->createStub(\App\Models\AccountTokenModel::class);
        $fauxTokenModel->method('create')->willReturn('un-faux-jeton');

        $fauxEmailService = $this->createStub(\App\Services\EmailService::class);
        $fauxEmailService->method('sendVerificationEmail')->willReturn(true);

        $service = new AuthService(
            userModel: $fauxUserModel,
            tokenModel: $fauxTokenModel,
            emailService: $fauxEmailService
        );

        $donnees = [
            'first_name'   => 'Flavie',
            'last_name'    => 'Michel',
            'email'        => 'nouveau@demail.com',
            'password'     => 'MotDePasse123*',
            'gdpr_consent' => true,
        ];

        $resultat = $service->register($donnees);

        $this->assertTrue($resultat['success']);
        $this->assertEquals(201, $resultat['code']);
    }
}
