<?php

namespace Tests;

use App\Models\OrderModel;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * Stock : ajustements par l'admin (réception, perte, inventaire), historique des mouvements, et historisation de TOUS les
 * changements de stock (création, modification depuis la fiche, vente).
 */
#[Group('integration')]
class AdminStockApiTest extends AdminApiTestCase
{
    private function stockOf(int $productId): int
    {
        $stmt = self::$db->prepare('SELECT stock_quantity FROM products WHERE id = ?');
        $stmt->execute([$productId]);

        return (int) $stmt->fetchColumn();
    }

    /** @return list<array> mouvements du produit, du plus récent au plus ancien */
    private function movements(int $productId, string $extra = ''): array
    {
        $response = self::$admin->get("/admin/stock/movements?product_id=$productId$extra");
        $this->assertSame(200, $response['status'], $response['raw']);

        return $response['body']['data']['items'];
    }

    private function adjust(int $productId, array $body): array
    {
        return self::$admin->post("/admin/products/$productId/stock", $body);
    }

    // ------------------------------------------------------------------ ajustements

    public function testUneReceptionAjouteAuStockEtEstHistorisee(): void
    {
        $id = self::createProduct(['stock_quantity' => 4]);

        $response = $this->adjust($id, ['type' => 'restock', 'quantity' => 6, 'note' => '  Livraison fournisseur  ']);

        $this->assertSame(200, $response['status'], $response['raw']);
        $this->assertSame(10, $response['body']['data']['stock_quantity']);
        $this->assertSame(10, $this->stockOf($id));

        $movement = $response['body']['data']['movement'];
        $this->assertSame('restock', $movement['type']);
        $this->assertSame(6, $movement['quantity']);
        $this->assertSame(10, $movement['stock_after']);
        $this->assertSame('Livraison fournisseur', $movement['note']);
        $this->assertSame(self::$adminUser['id'], $movement['user_id']);
        $this->assertSame('Zz', $movement['user_first_name']);
    }

    public function testUnePerteRetireDuStock(): void
    {
        $id = self::createProduct(['stock_quantity' => 10]);

        $response = $this->adjust($id, ['type' => 'loss', 'quantity' => 3, 'note' => 'Pots cassés']);

        $this->assertSame(7, $response['body']['data']['stock_quantity']);
        $this->assertSame(-3, $response['body']['data']['movement']['quantity'], 'variation négative');
    }

    public function testUnePerteSuperieureAuStockEstRefuseeSansRienModifier(): void
    {
        $id = self::createProduct(['stock_quantity' => 2]);

        $response = $this->adjust($id, ['type' => 'loss', 'quantity' => 3]);

        $this->assertSame(409, $response['status']);
        $this->assertSame(2, $response['body']['data']['stock_quantity']);
        $this->assertSame(2, $this->stockOf($id));
        $this->assertSame([], $this->movements($id));
    }

    public function testUnInventaireFixeLeStockEtEnregistreLEcart(): void
    {
        $id = self::createProduct(['stock_quantity' => 12]);

        $down = $this->adjust($id, ['type' => 'inventory', 'quantity' => 9]);
        $zero = $this->adjust($id, ['type' => 'inventory', 'quantity' => 0]);
        $same = $this->adjust($id, ['type' => 'inventory', 'quantity' => 0]);

        $this->assertSame(-3, $down['body']['data']['movement']['quantity']);
        $this->assertSame(-9, $zero['body']['data']['movement']['quantity']);
        $this->assertSame(0, $same['body']['data']['movement']['quantity'], 'un comptage sans écart est aussi une information');
        $this->assertSame(0, $this->stockOf($id));
    }

    public function testLeStockNePeutPasDepasserLePlafond(): void
    {
        $id = self::createProduct(['stock_quantity' => 9990]);

        $this->assertSame(409, $this->adjust($id, ['type' => 'restock', 'quantity' => 10])['status']);
        $this->assertSame(9990, $this->stockOf($id));
    }

    /** @return array<string, array{0:array<string,mixed>}> */
    public static function invalidAdjustments(): array
    {
        return [
            'type absent'               => [['quantity' => 1]],
            'type inconnu'              => [['type' => 'sale', 'quantity' => 1]],
            'type non textuel'          => [['type' => ['restock'], 'quantity' => 1]],
            'quantité absente'          => [['type' => 'restock']],
            'réception de zéro'         => [['type' => 'restock', 'quantity' => 0]],
            'perte négative'            => [['type' => 'loss', 'quantity' => -2]],
            'inventaire négatif'        => [['type' => 'inventory', 'quantity' => -1]],
            'quantité décimale'         => [['type' => 'restock', 'quantity' => 1.5]],
            'quantité textuelle'        => [['type' => 'restock', 'quantity' => 'dix']],
            'quantité booléenne'        => [['type' => 'restock', 'quantity' => true]],
            'quantité trop grande'      => [['type' => 'inventory', 'quantity' => 10000]],
            'note non textuelle'        => [['type' => 'restock', 'quantity' => 1, 'note' => ['x']]],
            'note trop longue'          => [['type' => 'restock', 'quantity' => 1, 'note' => str_repeat('a', 256)]],
        ];
    }

    /** @param array<string,mixed> $body */
    #[DataProvider('invalidAdjustments')]
    public function testUnAjustementInvalideEstRefuse(array $body): void
    {
        $id = self::createProduct(['stock_quantity' => 5]);

        $response = $this->adjust($id, $body);

        $this->assertSame(400, $response['status'], $response['raw']);
        $this->assertSame(5, $this->stockOf($id));
    }

    public function testUnProduitInconnuRepond404(): void
    {
        $this->assertSame(404, $this->adjust(999999999, ['type' => 'restock', 'quantity' => 1])['status']);
    }

    public function testLAjustementEstJournalise(): void
    {
        $id = self::createProduct(['stock_quantity' => 1]);

        $this->adjust($id, ['type' => 'restock', 'quantity' => 2]);

        $stmt = self::$db->prepare("SELECT details FROM security_events WHERE event = 'stock_adjusted' AND user_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([self::$adminUser['id']]);
        $this->assertSame(['product_id' => $id, 'type' => 'restock', 'quantity' => 2, 'stock_after' => 3], json_decode((string) $stmt->fetchColumn(), true));
    }

    public function testDesAjustementsSimultanesSAppliquentTous(): void
    {
        // 12 réceptions de 1 envoyées EN MÊME TEMPS : sans verrou, certaines liraient le même stock et l'une écraserait l'autre
        $id = self::createProduct(['stock_quantity' => 0]);
        $count = 12;

        $multi = curl_multi_init();
        $handles = [];
        for ($i = 0; $i < $count; $i++) {
            $ch = curl_init("http://localhost/api/admin/products/$id/stock");
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode(['type' => 'restock', 'quantity' => 1]),
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Cookie: jardinerie_session=' . self::$admin->cookie],
                CURLOPT_RETURNTRANSFER => true,
            ]);
            curl_multi_add_handle($multi, $ch);
            $handles[] = $ch;
        }
        do {
            curl_multi_exec($multi, $running);
            curl_multi_select($multi);
        } while ($running > 0);

        $statuses = array_map(fn($ch) => curl_getinfo($ch, CURLINFO_RESPONSE_CODE), $handles);
        foreach ($handles as $ch) {
            curl_multi_remove_handle($multi, $ch);
        }
        curl_multi_close($multi);

        $this->assertSame(array_fill(0, $count, 200), $statuses);
        $this->assertSame($count, $this->stockOf($id));

        $after = array_column($this->movements($id), 'stock_after');
        sort($after);
        $this->assertSame(range(1, $count), $after, 'chaque mouvement a vu le stock à jour (1, 2, … 12)');
    }

    // ------------------------------------------------------------------ tous les changements sont historisés

    public function testLaCreationDUnProduitAvecStockEstHistorisee(): void
    {
        $response = self::$admin->post('/admin/products', [
            'subcategory_id' => (int) self::$db->query('SELECT subcategory_id FROM products ORDER BY id LIMIT 1')->fetchColumn(),
            'tax_id'         => (int) self::$db->query('SELECT id FROM taxes LIMIT 1')->fetchColumn(),
            'name'           => 'ZZ stock initial',
            'price_tax_incl' => 9.9,
            'stock_quantity' => 15,
            'sku'            => strtoupper(self::$prefix . '-INIT'),
        ]);
        $id = (int) $response['body']['data']['id'];

        $movements = $this->movements($id);
        $this->assertCount(1, $movements);
        $this->assertSame(['inventory', 15, 15, 'Stock initial', self::$adminUser['id']], [
            $movements[0]['type'], $movements[0]['quantity'], $movements[0]['stock_after'], $movements[0]['note'], $movements[0]['user_id'],
        ]);
    }

    public function testModifierLeStockDepuisLaFicheEstHistoriseCommeUnInventaire(): void
    {
        // Chemin de l'ancien admin : le stock est un champ du formulaire produit
        $id = self::createProduct(['stock_quantity' => 8]);

        self::$admin->patch("/admin/products/$id", ['stock_quantity' => 5, 'name' => 'ZZ fiche stock']);
        self::$admin->patch("/admin/products/$id", ['stock_quantity' => 5, 'name' => 'ZZ fiche stock 2']);  // inchangé : pas de mouvement
        self::$admin->patch("/admin/products/$id", ['stock_quantity' => '', 'name' => 'ZZ fiche stock 3']); // vide : inchangé

        $movements = $this->movements($id);
        $this->assertCount(1, $movements);
        $this->assertSame(-3, $movements[0]['quantity']);
        $this->assertSame('Modifié depuis la fiche produit', $movements[0]['note']);
        $this->assertSame(5, $this->stockOf($id));
    }

    public function testUneVenteEstHistoriseeAvecSaCommande(): void
    {
        $id = self::createProduct(['stock_quantity' => 5, 'price_tax_incl' => '10.00']);
        $intent = 'pi_ZZ' . strtoupper(bin2hex(random_bytes(6)));

        $orderId = (new OrderModel())->createFromPayment(self::$customerUser['id'], [
            'items' => [['product_id' => $id, 'quantity' => 2, 'unit_price' => 10.0]],
            'total' => 20.0,
        ], $intent);

        $this->assertSame(3, $this->stockOf($id));
        $movement = $this->movements($id)[0];
        $this->assertSame('sale', $movement['type']);
        $this->assertSame(-2, $movement['quantity']);
        $this->assertSame(3, $movement['stock_after']);
        $this->assertSame($orderId, $movement['order_id']);
        $this->assertSame(OrderModel::referenceFor($intent), $movement['order_reference']);
        $this->assertNull($movement['user_id'], 'une vente n\'a pas d\'auteur administrateur');
    }

    public function testUneVenteSuperieureAuStockLeRameneAZeroEtEnregistreLEcartReel(): void
    {
        // Le paiement est déjà encaissé : la commande est créée, le stock ne devient pas négatif
        $id = self::createProduct(['stock_quantity' => 1]);

        (new OrderModel())->createFromPayment(self::$customerUser['id'], [
            'items' => [['product_id' => $id, 'quantity' => 3, 'unit_price' => 10.0]],
            'total' => 30.0,
        ], 'pi_ZZ' . strtoupper(bin2hex(random_bytes(6))));

        $this->assertSame(0, $this->stockOf($id));
        $this->assertSame(-1, $this->movements($id)[0]['quantity']);
    }

    // ------------------------------------------------------------------ historique

    public function testLHistoriqueSeFiltreParTypeEtParDate(): void
    {
        $id = self::createProduct(['stock_quantity' => 10]);
        $this->adjust($id, ['type' => 'restock', 'quantity' => 1]);
        $this->adjust($id, ['type' => 'loss', 'quantity' => 1]);
        $this->adjust($id, ['type' => 'restock', 'quantity' => 1]);
        $today = self::$db->query('SELECT CURDATE()')->fetchColumn();

        $restocks = $this->movements($id, '&type=restock');
        $this->assertCount(2, $restocks);
        $this->assertSame(['restock', 'restock'], array_column($restocks, 'type'));
        $this->assertCount(3, $this->movements($id, "&from=$today&to=$today"));
        $this->assertCount(0, $this->movements($id, '&to=2000-01-01'));

        $ids = array_column($this->movements($id), 'id');
        $sorted = $ids;
        rsort($sorted);
        $this->assertSame($sorted, $ids, 'du plus récent au plus ancien');
    }

    public function testLaPaginationDeLHistoriqueEstBornee(): void
    {
        $this->assertSame(50, self::$admin->get('/admin/stock/movements')['body']['data']['pagination']['per_page']);
        $this->assertSame(200, self::$admin->get('/admin/stock/movements?limit=99999')['body']['data']['pagination']['per_page']);
        $this->assertSame(1, self::$admin->get('/admin/stock/movements?limit=0')['body']['data']['pagination']['per_page']);
    }

    public function testLesFiltresInvalidesDeLHistoriqueSontRefuses(): void
    {
        foreach (['type=vol', 'product_id=abc', 'product_id=-3', 'from=2026-02-30', 'to=demain'] as $query) {
            $this->assertSame(400, self::$admin->get("/admin/stock/movements?$query")['status'], $query);
        }
    }
}
