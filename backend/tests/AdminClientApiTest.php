<?php

namespace Tests;

use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;
use Tests\Support\ApiClient;

/**
 * API admin des clients : liste, recherche, détail, changement de rôle, anonymisation (droit à l'oubli).
 * L'envoi du lien de réinitialisation n'est testé ici que pour le 404 (le cas réussi enverrait un vrai e-mail par Brevo) :
 * le reste est couvert sans réseau dans AdminClientServiceTest.
 */
#[Group('integration')]
class AdminClientApiTest extends AdminApiTestCase
{
    private function addAddress(int $userId): void
    {
        self::$db->prepare("INSERT INTO addresses (user_id,recipient_first_name,recipient_last_name,street,postal_code,city,country) VALUES (?, 'Zz', 'Tadm', '1 rue des Tests', '75001', 'Paris', 'France')")
            ->execute([$userId]);
    }

    private function user(int $id): array
    {
        $stmt = self::$db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);

        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    private function eventCount(string $event, int $actorId): int
    {
        $stmt = self::$db->prepare('SELECT COUNT(*) FROM security_events WHERE event = ? AND user_id = ?');
        $stmt->execute([$event, $actorId]);

        return (int) $stmt->fetchColumn();
    }

    // ------------------------------------------------------------------ liste

    public function testLaRechercheTrouveParEmailEtRenvoieLeNombreDeCommandes(): void
    {
        $user = self::createUser('customer', 'Rechercheuse');
        self::createOrder($user['id'], self::createProduct());

        $response = self::$admin->get('/admin/clients?search=' . urlencode($user['email']));
        $this->assertSame(200, $response['status']);

        $items = $response['body']['data']['items'];
        $this->assertCount(1, $items);
        $this->assertSame('Rechercheuse', $items[0]['first_name']);
        $this->assertEquals(1, $items[0]['total_orders']);
        $this->assertArrayNotHasKey('password', $items[0], 'le mot de passe haché n\'est jamais renvoyé');
        $this->assertSame(1, $response['body']['data']['pagination']['total_items']);
    }

    public function testLaRechercheTrouveParPrenom(): void
    {
        $name = 'Zzprenom' . bin2hex(random_bytes(3));
        self::createUser('customer', $name);

        $items = self::$admin->get('/admin/clients?search=' . $name)['body']['data']['items'];

        $this->assertCount(1, $items);
    }

    public function testLeFiltreDeRoleNeRenvoieQueCeRole(): void
    {
        $items = self::$admin->get('/admin/clients?role=admin&limit=100&search=' . self::$prefix)['body']['data']['items'];

        $this->assertNotEmpty($items);
        foreach ($items as $item) {
            $this->assertSame('admin', $item['role']);
        }
    }

    public function testLesCaracteresJokersDeLaRechercheNeProvoquentPasDErreur(): void
    {
        foreach (['%', '_', "'", '"', '\\', "' OR 1=1 --"] as $search) {
            $this->assertSame(200, self::$admin->get('/admin/clients?search=' . urlencode($search))['status'], $search);
        }
    }

    // ------------------------------------------------------------------ détail

    public function testLeDetailContientLesAdressesEtLesCommandes(): void
    {
        $user = self::createUser();
        $this->addAddress($user['id']);
        self::createOrder($user['id'], self::createProduct());

        $response = self::$admin->get("/admin/clients/{$user['id']}");
        $this->assertSame(200, $response['status']);

        $data = $response['body']['data'];
        $this->assertSame($user['email'], $data['client']['email']);
        $this->assertArrayNotHasKey('password', $data['client']);
        $this->assertCount(1, $data['addresses']);
        $this->assertCount(1, $data['orders']);
    }

    public function testUnClientInconnuRepond404(): void
    {
        $this->assertSame(404, self::$admin->get('/admin/clients/999999999')['status']);
        $this->assertSame(404, self::$admin->patch('/admin/clients/999999999/role', ['role' => 'admin'])['status']);
        $this->assertSame(404, self::$admin->post('/admin/clients/999999999/anonymize')['status']);
        $this->assertSame(404, self::$admin->post('/admin/clients/999999999/password-reset')['status']);
    }

    // ------------------------------------------------------------------ rôle

    public function testPromouvoirUnClientEstJournaliseAuNomDeLAdministrateur(): void
    {
        $user   = self::createUser();
        $before = $this->eventCount('role_changed', self::$adminUser['id']);

        $response = self::$admin->patch("/admin/clients/{$user['id']}/role", ['role' => 'admin']);

        $this->assertSame(200, $response['status'], $response['raw']);
        $this->assertSame('admin', $this->user($user['id'])['role']);
        $this->assertSame($before + 1, $this->eventCount('role_changed', self::$adminUser['id']));
    }

    public function testUnRoleInconnuEstRefuse(): void
    {
        $user = self::createUser();

        foreach (['superadmin', '', 'ADMIN'] as $role) {
            $this->assertSame(400, self::$admin->patch("/admin/clients/{$user['id']}/role", ['role' => $role])['status'], $role);
        }
        $this->assertSame(400, self::$admin->patch("/admin/clients/{$user['id']}/role", [])['status']);
        $this->assertSame('customer', $this->user($user['id'])['role']);
    }

    public function testUnAdministrateurNePeutPasChangerSonPropreRole(): void
    {
        $response = self::$admin->patch('/admin/clients/' . self::$adminUser['id'] . '/role', ['role' => 'customer']);

        $this->assertSame(403, $response['status']);
        $this->assertSame('Vous ne pouvez pas modifier votre propre rôle.', $response['body']['message']);
        $this->assertSame('admin', $this->user(self::$adminUser['id'])['role']);
    }

    // ------------------------------------------------------------------ anonymisation

    public function testLAnonymisationEffaceLIdentiteEtLesAdressesMaisGardeLesCommandes(): void
    {
        $user = self::createUser('customer', 'Oubliee');
        $this->addAddress($user['id']);
        $orderId = self::createOrder($user['id'], self::createProduct());

        $response = self::$admin->post("/admin/clients/{$user['id']}/anonymize");
        $this->assertSame(200, $response['status'], $response['raw']);

        $row = $this->user($user['id']);
        $this->assertSame('Compte', $row['first_name']);
        $this->assertSame('Supprimé', $row['last_name']);
        $this->assertSame("anonymized_{$user['id']}@deleted.local", $row['email']);
        $this->assertSame('', $row['password']);
        $this->assertNotNull($row['anonymized_at']);

        $addresses = self::$db->prepare('SELECT COUNT(*) FROM addresses WHERE user_id = ?');
        $addresses->execute([$user['id']]);
        $this->assertSame(0, (int) $addresses->fetchColumn(), 'les adresses sont supprimées');

        $order = self::$db->prepare('SELECT user_id FROM orders WHERE id = ?');
        $order->execute([$orderId]);
        $this->assertEquals($user['id'], $order->fetchColumn(), 'la commande reste (obligation comptable), rattachée au compte anonyme');
    }

    public function testLAnonymisationFermeLaSessionOuverteEtEmpecheDeSeReconnecter(): void
    {
        $user    = self::createUser();
        $session = new ApiClient();
        $this->assertSame(200, $session->login($user['email'], self::PASSWORD));
        $this->assertSame(200, $session->get('/me')['status']);

        self::$admin->post("/admin/clients/{$user['id']}/anonymize");

        $this->assertSame(401, $session->get('/me')['status'], 'l\'ancienne session ne fonctionne plus');
        $this->assertNotSame(200, (new ApiClient())->login($user['email'], self::PASSWORD), 'plus de connexion possible');
    }

    public function testLAnonymisationEffaceLeJournalDuCompteMaisPasCeluiDeLAdministrateur(): void
    {
        $user = self::createUser();
        (new ApiClient())->login($user['email'], self::PASSWORD); // crée un événement « login_success » avec IP et navigateur
        $before = $this->eventCount('account_anonymized', self::$adminUser['id']);

        self::$admin->post("/admin/clients/{$user['id']}/anonymize");

        $stmt = self::$db->prepare('SELECT COUNT(*) FROM security_events WHERE user_id = ? AND (ip IS NOT NULL OR user_agent IS NOT NULL)');
        $stmt->execute([$user['id']]);
        $this->assertSame(0, (int) $stmt->fetchColumn(), 'plus d\'IP ni de navigateur rattachés au compte anonymisé');
        $this->assertSame($before + 1, $this->eventCount('account_anonymized', self::$adminUser['id']));
    }

    public function testUnAdministrateurNePeutPasSAnonymiserLuiMeme(): void
    {
        $response = self::$admin->post('/admin/clients/' . self::$adminUser['id'] . '/anonymize');

        $this->assertSame(403, $response['status']);
        $this->assertSame(self::$adminUser['email'], $this->user(self::$adminUser['id'])['email']);
    }
}
