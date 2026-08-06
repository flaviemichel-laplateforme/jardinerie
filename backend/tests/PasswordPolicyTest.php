<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\PasswordPolicy;

class PasswordPolicyTest extends TestCase
{
    public function testMotDePasseValide(): void
    {
        $resultat =  PasswordPolicy::validate("motDePasseATester1*");

        $this->assertNull($resultat);
    }

    public function testMotDePasseTropCourt(): void
    {
        $resultat = PasswordPolicy::validate("azer");


        $this->assertStringContainsString('8 caractères', $resultat);
    }

    public function testMotDePasseSansMajuscule(): void
    {
        $resultat = PasswordPolicy::validate("azerty123*");

        $this->assertEquals("Le mot de passe doit contenir au moins une majuscule.", $resultat);
    }
}
