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

    public function testMotDePasseSansChiffre(): void
    {
        $resultat = PasswordPolicy::validate("Azertydd**cA");

        $this->assertEquals("Le mot de passe doit contenir au moins un chiffre.", $resultat);
    }

    public function testMotDePasseSansCaracteresSpecial(): void
    {
        $resultat = PasswordPolicy::validate("AAAAGGGggg444");
        $this->assertEquals("Le mot de passe doit contenir au moins un caractère spécial.", $resultat);
    }

    public function testMotDePasseTropLong(): void
    {
        // bcrypt ignorerait silencieusement tout ce qui dépasse 72 octets
        $resultat = PasswordPolicy::validate(str_repeat('Aa1!', 19)); // 76 octets

        $this->assertStringContainsString('72 caractères', $resultat);
    }

    public function testMotDePasseDeLaLongueurMaximaleEstAccepte(): void
    {
        $this->assertNull(PasswordPolicy::validate(str_repeat('Xq7#', 18))); // 72 octets
    }

    public function testMotsDePasseCourantsRefusesMemeAvecChiffresEtSymboles(): void
    {
        foreach (['Password123!', 'Azerty123*', 'MotDePasse2024!', 'Jardinerie1!', 'Qwerty!123', 'P@ssw0rd!!'] as $password) {
            $resultat = PasswordPolicy::validate($password);

            $this->assertStringContainsString('trop courant', (string) $resultat, $password);
        }
    }

    public function testLaComparaisonIgnoreLesMajusculesEtLesAccents(): void
    {
        $this->assertStringContainsString('trop courant', (string) PasswordPolicy::validate('Bienvenue-2026!'));
        $this->assertStringContainsString('trop courant', (string) PasswordPolicy::validate('Bienvenüe9!'));
        $this->assertStringContainsString('trop courant', (string) PasswordPolicy::validate('Jardinerie-2026!'));
    }

    public function testLesLettresRemplaceesParDesChiffresNeContournentPasLaListe(): void
    {
        foreach (['P@ssw0rd!!', 'P4$$w0rd99', 'M0td3p4sse!1'] as $password) {
            $this->assertStringContainsString('trop courant', (string) PasswordPolicy::validate($password), $password);
        }
    }

    public function testUnMotDePasseNonCourantAvecLesMemesMotsEstAccepte(): void
    {
        $this->assertNull(PasswordPolicy::validate('Mon-Chat-Aime-Les-Jardins-7!'));
    }

    public function testMotDePasseContenantLAdresseEmailRefuse(): void
    {
        $resultat = PasswordPolicy::validate('Zx9!camille.dupont', 'camille.dupont@example.com');

        $this->assertStringContainsString('adresse email', $resultat);
    }

    public function testUnNomCourtDansLEmailNEstPasUnMotif(): void
    {
        // « al » est trop court pour que sa présence dans le mot de passe soit significative
        $this->assertNull(PasswordPolicy::validate('Zx9!alpaga-Rouge', 'al@example.com'));
    }

    public function testLeHachageUtiliseLeCoutActuelEtSeVerifie(): void
    {
        $hash = PasswordPolicy::hash('Rz7!vTq92#mK');

        $this->assertTrue(password_verify('Rz7!vTq92#mK', $hash));
        $this->assertSame(PasswordPolicy::BCRYPT_COST, password_get_info($hash)['options']['cost']);
        $this->assertFalse(PasswordPolicy::needsRehash($hash));
    }

    public function testUnAncienHachageDeCoutFaibleDoitEtreRecalcule(): void
    {
        $old = password_hash('Rz7!vTq92#mK', PASSWORD_BCRYPT, ['cost' => 10]);

        $this->assertTrue(PasswordPolicy::needsRehash($old));
    }
}
