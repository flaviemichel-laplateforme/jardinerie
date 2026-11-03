<?php

namespace Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * API admin des commandes : liste, détail, changement de statut. Décrit le comportement ACTUEL (toute transition de statut
 * est acceptée, sans effet sur le stock ni remboursement) : N4-api-commandes le remplacera par des règles de transition.
 */
#[Group('integration')]
class AdminOrderApiTest extends AdminApiTestCase
{
    private static int $productId;
    private static int $userId;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        self::$productId = self::createProduct(['name' => 'ZZ commande']);
        self::$userId    = self::createUser('customer', 'Cliente')['id'];
    }

    private function statusOf(int $orderId): string
    {
        $stmt = self::$db->prepare('SELECT status FROM orders WHERE id = ?');
        $stmt->execute([$orderId]);

        return (string) $stmt->fetchColumn();
    }

    // ------------------------------------------------------------------ liste

    public function testLaListeRenvoieLesCommandesAvecLeNomDuClientEtLaPagination(): void
    {
        $id = self::createOrder(self::$userId, self::$productId, 'paid');

        $response = self::$admin->get('/admin/orders?limit=100');
        $this->assertSame(200, $response['status']);

        $data = $response['body']['data'];
        $byId = array_column($data['items'], null, 'id');
        $this->assertArrayHasKey($id, $byId);
        $this->assertSame('Cliente', $byId[$id]['customer_first_name']);
        $this->assertSame('paid', $byId[$id]['status']);

        foreach (['current_page', 'per_page', 'total_items', 'total_pages', 'has_next', 'has_prev'] as $key) {
            $this->assertArrayHasKey($key, $data['pagination']);
        }
        $this->assertSame(1, $data['pagination']['current_page']);
        $this->assertSame(100, $data['pagination']['per_page']);
    }

    public function testLeFiltreDeStatutNeRenvoieQueCeStatut(): void
    {
        self::createOrder(self::$userId, self::$productId, 'shipped');

        $items = self::$admin->get('/admin/orders?status=shipped&limit=100')['body']['data']['items'];

        $this->assertNotEmpty($items);
        foreach ($items as $item) {
            $this->assertSame('shipped', $item['status']);
        }
    }

    public function testUnStatutInconnuEnFiltreEquivautATous(): void
    {
        $all     = self::$admin->get('/admin/orders?status=all')['body']['data']['pagination']['total_items'];
        $unknown = self::$admin->get('/admin/orders?status=nimportequoi')['body']['data']['pagination']['total_items'];

        $this->assertSame($all, $unknown);
    }

    public function testLaPaginationEstBornee(): void
    {
        $this->assertSame(100, self::$admin->get('/admin/orders?limit=5000')['body']['data']['pagination']['per_page']);
        $this->assertSame(1, self::$admin->get('/admin/orders?limit=0')['body']['data']['pagination']['per_page']);
        $this->assertSame(1, self::$admin->get('/admin/orders?page=-4')['body']['data']['pagination']['current_page']);
    }

    public function testLesCommandesSontTrieesDeLaPlusRecenteALaPlusAncienne(): void
    {
        $old = self::createOrder(self::$userId, self::$productId, 'paid', '20.00', '4.90', '2020-01-01 10:00:00');
        $new = self::createOrder(self::$userId, self::$productId, 'paid', '20.00', '4.90', '2030-01-01 10:00:00');

        $ids = array_column(self::$admin->get('/admin/orders?limit=100')['body']['data']['items'], 'id');

        $this->assertLessThan(array_search($old, $ids) === false ? PHP_INT_MAX : array_search($old, $ids), array_search($new, $ids));
    }

    // ------------------------------------------------------------------ détail

    public function testLeDetailContientLeClientLesAdressesEtLesArticles(): void
    {
        $id = self::createOrder(self::$userId, self::$productId, 'paid');

        $response = self::$admin->get("/admin/orders/$id");
        $this->assertSame(200, $response['status']);

        $order = $response['body']['data']['order'];
        $this->assertSame('Facturation de test', $order['billing_address_text']);
        $this->assertSame('Livraison de test', $order['shipping_address_text']);
        $this->assertStringEndsWith('@example.invalid', $order['customer_email']);
        $this->assertNotNull($order['delivery_method']);

        $items = $response['body']['data']['items'];
        $this->assertCount(1, $items);
        $this->assertEquals(self::$productId, $items[0]['product_id']);
        $this->assertEquals(2, $items[0]['quantity']);
        $this->assertSame('ZZ commande', $items[0]['product_name']);
    }

    public function testUneCommandeInconnueRepond404(): void
    {
        $this->assertSame(404, self::$admin->get('/admin/orders/999999999')['status']);
    }

    // ------------------------------------------------------------------ statut

    /** @return array<string, array{0:string}> */
    public static function statuses(): array
    {
        return ['en attente' => ['pending'], 'payée' => ['paid'], 'expédiée' => ['shipped'], 'livrée' => ['delivered'], 'annulée' => ['cancelled']];
    }

    #[DataProvider('statuses')]
    public function testChaqueStatutValideEstAccepte(string $status): void
    {
        $id = self::createOrder(self::$userId, self::$productId, 'pending');

        $response = self::$admin->patch("/admin/orders/$id/status", ['status' => $status]);

        $this->assertSame(200, $response['status'], $response['raw']);
        $this->assertSame($status, $this->statusOf($id));
    }

    /** @return array<string, array{0:array<string,mixed>}> */
    public static function invalidBodies(): array
    {
        return [
            'statut inconnu'      => [['status' => 'perdue']],
            'statut « all »'      => [['status' => 'all']],
            'statut vide'         => [['status' => '']],
            'statut absent'       => [[]],
        ];
    }

    /** @param array<string,mixed> $body */
    #[DataProvider('invalidBodies')]
    public function testUnStatutInvalideEstRefuseSansToucherLaCommande(array $body): void
    {
        $id = self::createOrder(self::$userId, self::$productId, 'paid');

        $response = self::$admin->patch("/admin/orders/$id/status", $body);

        $this->assertSame(400, $response['status'], $response['raw']);
        $this->assertSame('paid', $this->statusOf($id));
    }

    public function testDefautActuelUnStatutNonTextuelProvoqueUneErreurInterne(): void
    {
        // DÉFAUT ACTUEL, à corriger en N4-api-commandes (attendu : 400) : un tableau à la place du texte fait échouer le typage du service.
        // L'erreur est bien rattrapée (message générique, aucun détail technique) et la commande n'est pas modifiée.
        $id = self::createOrder(self::$userId, self::$productId, 'paid');

        $response = self::$admin->patch("/admin/orders/$id/status", ['status' => ['paid']]);

        $this->assertSame(500, $response['status']);
        $this->assertSame('Erreur interne du serveur.', $response['body']['message']);
        $this->assertSame('paid', $this->statusOf($id));
    }

    public function testChangerLeStatutDUneCommandeInconnueRepond404(): void
    {
        $this->assertSame(404, self::$admin->patch('/admin/orders/999999999/status', ['status' => 'paid'])['status']);
    }

    public function testComportementActuelToutesLesTransitionsSontPermisesSansEffetSurLeStock(): void
    {
        // À remplacer en N4-api-commandes : aujourd'hui une commande livrée peut redevenir « en attente », et l'annuler ne remet rien en stock.
        $productId = self::createProduct(['stock_quantity' => 10]);
        $id = self::createOrder(self::$userId, $productId, 'delivered');

        $this->assertSame(200, self::$admin->patch("/admin/orders/$id/status", ['status' => 'pending'])['status']);
        $this->assertSame(200, self::$admin->patch("/admin/orders/$id/status", ['status' => 'cancelled'])['status']);

        $stmt = self::$db->prepare('SELECT stock_quantity FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $this->assertEquals(10, $stmt->fetchColumn(), 'le stock n\'est pas modifié par un changement de statut');
    }
}
