<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\DeferredWork;
use App\Core\JwtHelper;
use App\Core\SessionGuard;
use App\Models\AccountTokenModel;
use App\Models\UserModel;
use App\Services\AuthService;
use App\Services\EmailService;

class SessionSecurityTest extends TestCase
{
    private const PASSWORD = 'Rz7!vTq92#mK';

    private array $savedEnv = [];

    protected function setUp(): void
    {
        foreach (['JWT_SECRET', 'FRONTEND_URL', 'APP_ENV'] as $key) {
            $this->savedEnv[$key] = $_ENV[$key] ?? null;
        }
        $_ENV['JWT_SECRET']   = 'un-secret-de-test-assez-long-0123456789';
        $_ENV['FRONTEND_URL'] = 'https://site.test';
        $_ENV['APP_ENV']      = 'development';
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

    private function account(array $override = []): array
    {
        return array_merge([
            'id'                => 7,
            'first_name'        => 'Camille',
            'email'             => 'camille@example.com',
            'password'          => password_hash(self::PASSWORD, PASSWORD_BCRYPT, ['cost' => 12]),
            'role'              => 'customer',
            'email_verified_at' => '2026-01-01 10:00:00',
            'token_version'     => 3,
            'anonymized_at'     => null,
        ], $override);
    }

    // ------------------------------------------------------------------ SessionGuard

    public function testUneSessionAJourEstAcceptee(): void
    {
        $session = SessionGuard::validate(['id' => 7, 'tv' => 3], ['id' => 7, 'role' => 'customer', 'token_version' => 3, 'anonymized_at' => null]);

        $this->assertSame(['id' => 7, 'role' => 'customer'], $session);
    }

    public function testUnJetonDUneAncienneVersionEstRefuse(): void
    {
        // Mot de passe changé depuis : la version du compte est passée de 3 à 4
        $this->assertNull(SessionGuard::validate(['id' => 7, 'tv' => 3], ['id' => 7, 'role' => 'customer', 'token_version' => 4, 'anonymized_at' => null]));
    }

    public function testUnJetonSansVersionEstLuCommeZero(): void
    {
        // Jeton émis avant l'existence des versions : valable tant que le compte n'a jamais été révoqué
        $user = ['id' => 7, 'role' => 'customer', 'token_version' => 0, 'anonymized_at' => null];

        $this->assertNotNull(SessionGuard::validate(['id' => 7], $user));
        $this->assertNull(SessionGuard::validate(['id' => 7], ['token_version' => 1] + $user));
    }

    public function testLeRoleVientDeLaBaseEtPasDuJeton(): void
    {
        // Le jeton annonce « admin », mais l'administrateur a été rétrogradé : l'accès admin est refusé tout de suite
        $session = SessionGuard::validate(['id' => 7, 'tv' => 0, 'role' => 'admin'], ['id' => 7, 'role' => 'customer', 'token_version' => 0, 'anonymized_at' => null]);

        $this->assertSame('customer', $session['role']);
    }

    public function testUnCompteInexistantOuAnonymiseEstRefuse(): void
    {
        $this->assertNull(SessionGuard::validate(['id' => 7, 'tv' => 0], null));
        $this->assertNull(SessionGuard::validate(['id' => 7, 'tv' => 0], ['id' => 7, 'role' => 'customer', 'token_version' => 0, 'anonymized_at' => '2026-10-01 00:00:00']));
    }

    public function testUnJetonDUnAutreCompteEstRefuse(): void
    {
        $this->assertNull(SessionGuard::validate(['id' => 8, 'tv' => 0], ['id' => 7, 'role' => 'customer', 'token_version' => 0, 'anonymized_at' => null]));
    }

    // ------------------------------------------------------------------ Connexion

    public function testLaConnexionEmetUnJetonPortantLaVersionDeSession(): void
    {
        $users = $this->createStub(UserModel::class);
        $users->method('getUserByEmail')->willReturn($this->account());

        $result = (new AuthService(userModel: $users))->login('camille@example.com', self::PASSWORD);

        $this->assertTrue($result['success']);
        $payload = JwtHelper::verify($result['data']['token'], $_ENV['JWT_SECRET']);
        $this->assertSame(3, $payload['tv']);
        $this->assertSame(7, $payload['id']);
    }

    public function testLaReponseDeConnexionNeContientAucuneDonneeInterne(): void
    {
        $users = $this->createStub(UserModel::class);
        $users->method('getUserByEmail')->willReturn($this->account());

        $user = (new AuthService(userModel: $users))->login('camille@example.com', self::PASSWORD)['data']['user'];

        foreach (['password', 'token_version', 'anonymized_at'] as $secret) {
            $this->assertArrayNotHasKey($secret, $user, $secret);
        }
    }

    public function testCompteInconnuMauvaisMotDePasseEtCompteAnonymiseDonnentLaMemeReponse(): void
    {
        $unknown = $this->createStub(UserModel::class);
        $unknown->method('getUserByEmail')->willReturn(false);
        $wrong = $this->createStub(UserModel::class);
        $wrong->method('getUserByEmail')->willReturn($this->account());
        $anonymized = $this->createStub(UserModel::class);
        $anonymized->method('getUserByEmail')->willReturn($this->account(['password' => '', 'anonymized_at' => '2026-10-01 00:00:00']));

        $responses = [
            (new AuthService(userModel: $unknown))->login('inconnu@example.com', self::PASSWORD),
            (new AuthService(userModel: $wrong))->login('camille@example.com', 'mauvais-mot-de-passe-1!A'),
            (new AuthService(userModel: $anonymized))->login('camille@example.com', self::PASSWORD),
        ];

        foreach ($responses as $response) {
            $this->assertSame(['success' => false, 'code' => 401, 'message' => 'Identifiants incorrects.'], $response);
        }
    }

    public function testLeRecalculDuHacheNeFermePasLesSessionsOuvertes(): void
    {
        $users = $this->createMock(UserModel::class);
        $users->method('getUserByEmail')->willReturn($this->account(['password' => password_hash(self::PASSWORD, PASSWORD_BCRYPT, ['cost' => 10])]));
        $users->expects($this->once())->method('rehashPassword')->with(7, self::PASSWORD);
        $users->expects($this->never())->method('updatePassword');

        $result = (new AuthService(userModel: $users))->login('camille@example.com', self::PASSWORD);

        $this->assertSame(3, JwtHelper::verify($result['data']['token'], $_ENV['JWT_SECRET'])['tv']); // version inchangée
    }

    // ------------------------------------------------------------------ Réinitialisation du mot de passe

    public function testLaReinitialisationFermeLesSessionsAnnuleLesLiensEtPrevient(): void
    {
        $tokens = $this->createMock(AccountTokenModel::class);
        $tokens->method('findValidToken')->willReturn(['id' => 1, 'user_id' => 7]);
        $tokens->expects($this->once())->method('invalidateAll')->with(7, 'password_reset');

        $users = $this->createMock(UserModel::class);
        $users->method('findById')->willReturn($this->account());
        $users->expects($this->once())->method('updatePassword')->with(7, 'Nouveau-Mdp-8!x');

        $emails = $this->createMock(EmailService::class);
        $emails->expects($this->once())->method('sendPasswordChangedNotice')->with('camille@example.com', 'Camille', 'https://site.test/mot-de-passe-oublie');

        $result = (new AuthService($users, $tokens, $emails))->resetPassword('un-jeton', 'Nouveau-Mdp-8!x');

        $this->assertTrue($result['success']);
    }

    public function testLaReinitialisationRefuseUnMotDePasseContenantLEmail(): void
    {
        $tokens = $this->createStub(AccountTokenModel::class);
        $tokens->method('findValidToken')->willReturn(['id' => 1, 'user_id' => 7]);
        $users = $this->createMock(UserModel::class);
        $users->method('findById')->willReturn($this->account());
        $users->expects($this->never())->method('updatePassword');

        $result = (new AuthService($users, $tokens))->resetPassword('un-jeton', 'Zx9!camille@example');

        $this->assertSame(400, $result['code']);
    }

    public function testUnLienDeReinitialisationPourUnCompteAnonymiseEstInvalide(): void
    {
        $tokens = $this->createStub(AccountTokenModel::class);
        $tokens->method('findValidToken')->willReturn(['id' => 1, 'user_id' => 7]);
        $users = $this->createStub(UserModel::class);
        $users->method('findById')->willReturn($this->account(['anonymized_at' => '2026-10-01 00:00:00']));

        $this->assertSame(400, (new AuthService($users, $tokens))->resetPassword('un-jeton', 'Nouveau-Mdp-8!x')['code']);
    }

    public function testDemandeDeReinitialisationMemeReponseQueLAdresseExisteOuNon(): void
    {
        $known = $this->createStub(UserModel::class);
        $known->method('getUserByEmail')->willReturn($this->account());
        $tokens = $this->createStub(AccountTokenModel::class);
        $tokens->method('create')->willReturn('jeton');
        $unknown = $this->createStub(UserModel::class);
        $unknown->method('getUserByEmail')->willReturn(false);

        $this->assertSame(
            (new AuthService($unknown))->requestPasswordReset('inconnu@example.com'),
            (new AuthService($known, $tokens, $this->createStub(EmailService::class)))->requestPasswordReset('camille@example.com')
        );
    }

    // ------------------------------------------------------------------ Changement d'adresse e-mail

    public function testChangerDAdresseExigeLeBonMotDePasse(): void
    {
        $users = $this->createStub(UserModel::class);
        $users->method('findById')->willReturn($this->account());
        $tokens = $this->createMock(AccountTokenModel::class);
        $tokens->expects($this->never())->method('create');

        $result = (new AuthService($users, $tokens))->requestEmailChange(7, 'nouvelle@example.com', 'mauvais-mot-de-passe-1!A');

        $this->assertSame(401, $result['code']);
    }

    public function testChangerDAdresseEnvoieLeLienALaNouvelleAdresseEtPrevientLAncienne(): void
    {
        $users = $this->createStub(UserModel::class);
        $users->method('findById')->willReturn($this->account());
        $users->method('getUserByEmail')->willReturn(false);

        $tokens = $this->createMock(AccountTokenModel::class);
        $tokens->expects($this->once())->method('create')->with(7, 'email_change', 60, 'nouvelle@example.com')->willReturn('le-jeton');

        $emails = $this->createMock(EmailService::class);
        $emails->expects($this->once())->method('sendEmailChangeVerification')
            ->with('nouvelle@example.com', 'Camille', 'https://site.test/confirmer-changement-email?token=le-jeton');
        $emails->expects($this->once())->method('sendEmailChangeAlert')
            ->with('camille@example.com', 'Camille', 'n***@example.com', 'https://site.test/mot-de-passe-oublie');

        $result = (new AuthService($users, $tokens, $emails))->requestEmailChange(7, 'nouvelle@example.com', self::PASSWORD);

        $this->assertTrue($result['success']);
    }

    public function testChangerPourUneAdresseDejaPriseRepondCommePourUneAdresseLibre(): void
    {
        $free = $this->createStub(UserModel::class);
        $free->method('findById')->willReturn($this->account());
        $free->method('getUserByEmail')->willReturn(false);
        $tokens = $this->createStub(AccountTokenModel::class);
        $tokens->method('create')->willReturn('jeton');

        $taken = $this->createStub(UserModel::class);
        $taken->method('findById')->willReturn($this->account());
        $taken->method('getUserByEmail')->willReturn(['id' => 99]);
        $neverCreated = $this->createMock(AccountTokenModel::class);
        $neverCreated->expects($this->never())->method('create');

        $this->assertSame(
            (new AuthService($free, $tokens, $this->createStub(EmailService::class)))->requestEmailChange(7, 'libre@example.com', self::PASSWORD),
            (new AuthService($taken, $neverCreated))->requestEmailChange(7, 'prise@example.com', self::PASSWORD)
        );
    }

    public function testConfirmerLeChangementAppliqueLAdresseEtPrevientLAncienne(): void
    {
        $tokens = $this->createMock(AccountTokenModel::class);
        $tokens->method('findValidToken')->willReturn(['id' => 1, 'user_id' => 7, 'payload' => 'nouvelle@example.com']);
        $tokens->expects($this->once())->method('invalidateAll')->with(7, 'email_change');

        $users = $this->createMock(UserModel::class);
        $users->method('findById')->willReturn($this->account());
        $users->method('getUserByEmail')->willReturn(false);
        $users->expects($this->once())->method('changeEmail')->with(7, 'nouvelle@example.com')->willReturn(true);

        $emails = $this->createMock(EmailService::class);
        $emails->expects($this->once())->method('sendEmailChangedNotice')->with('camille@example.com', 'Camille', 'n***@example.com');

        $result = (new AuthService($users, $tokens, $emails))->confirmEmailChange('le-jeton');

        $this->assertTrue($result['success']);
    }

    public function testConfirmerRefuseUneAdressePriseEntreTemps(): void
    {
        $tokens = $this->createStub(AccountTokenModel::class);
        $tokens->method('findValidToken')->willReturn(['id' => 1, 'user_id' => 7, 'payload' => 'prise@example.com']);
        $users = $this->createMock(UserModel::class);
        $users->method('findById')->willReturn($this->account());
        $users->method('getUserByEmail')->willReturn(['id' => 99]);
        $users->expects($this->never())->method('changeEmail');

        $this->assertSame(409, (new AuthService($users, $tokens))->confirmEmailChange('le-jeton')['code']);
    }

    public function testUnJetonDeChangementInconnuEstRefuse(): void
    {
        $tokens = $this->createStub(AccountTokenModel::class);
        $tokens->method('findValidToken')->willReturn(null);

        $this->assertSame(400, (new AuthService(tokenModel: $tokens))->confirmEmailChange('nimporte-quoi')['code']);
    }

    // ------------------------------------------------------------------ Jetons, e-mails masqués, travail différé

    public function testLEmpreinteDUnJetonEstUnSha256NonReversible(): void
    {
        $hash = AccountTokenModel::hash('mon-jeton');

        $this->assertSame(hash('sha256', 'mon-jeton'), $hash);
        $this->assertSame(64, strlen($hash));
        $this->assertStringNotContainsString('mon-jeton', $hash);
    }

    public function testUneAdresseEstMasqueeSansRevelerLeNom(): void
    {
        $this->assertSame('c***@example.com', EmailService::maskEmail('camille.dupont@example.com'));
        $this->assertSame('***', EmailService::maskEmail('pas-une-adresse'));
        $this->assertSame('***', EmailService::maskEmail('@example.com'));
    }

    public function testLeTravailDiffereSExecuteToutDeSuiteHorsServeurWeb(): void
    {
        $ran = false;

        DeferredWork::run(function () use (&$ran): void {
            $ran = true;
        });

        $this->assertTrue($ran);
    }

    public function testUnTravailDiffereEnEchecNePropagePasLErreur(): void
    {
        DeferredWork::run(function (): void {
            throw new \RuntimeException('Brevo est en panne');
        });

        $this->addToAssertionCount(1); // aucune exception ne sort : l'e-mail raté est seulement journalisé
    }
}
