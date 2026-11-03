<?php

namespace Tests;

use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;
use Tests\Support\ApiClient;

/**
 * API admin du tableau de bord : chiffre d'affaires (KPI), alertes de stock, journal de sécurité.
 * Les autres données de la base locale comptent aussi dans ces chiffres : les tests mesurent donc des ÉCARTS (avant / après).
 */
#[Group('integration')]
class AdminDashboardApiTest extends AdminApiTestCase
{
    // ------------------------------------------------------------------ KPI

    public function testLaPeriodeInconnueRetombeSurLeMois(): void
    {
        foreach (['day', 'week', 'month'] as $range) {
            $this->assertSame($range, self::$admin->get("/admin/kpis/sales?range=$range")['body']['data']['range']);
        }
        $this->assertSame('month', self::$admin->get('/admin/kpis/sales?range=year')['body']['data']['range']);
        $this->assertSame('month', self::$admin->get('/admin/kpis/sales')['body']['data']['range']);
    }

    public function testLeChiffreDAffairesDuJourComptePortInclusEtExclutLesCommandesAnnulees(): void
    {
        $productId = self::createProduct();
        $before    = self::$admin->get('/admin/kpis/sales?range=day')['body']['data'];

        self::createOrder(self::$customerUser['id'], $productId, 'paid', '20.00', '4.90');
        self::createOrder(self::$customerUser['id'], $productId, 'cancelled', '100.00', '0.00');
        // Comportement ACTUEL : une commande « en attente » compte aussi (seules les annulées sont exclues)
        self::createOrder(self::$customerUser['id'], $productId, 'pending', '10.00', '0.00');

        $after = self::$admin->get('/admin/kpis/sales?range=day')['body']['data'];

        $this->assertEqualsWithDelta(34.90, $after['total_sales'] - $before['total_sales'], 0.001, 'articles + livraison, sans l\'annulée');
        $this->assertSame(2, $after['total_orders'] - $before['total_orders']);
        $this->assertIsFloat($after['breakdown'][0]['total']);
        $this->assertMatchesRegularExpression('/^\d{2}:00$/', $after['breakdown'][0]['label'], 'par heure sur la journée');
    }

    public function testUneCommandeHorsPeriodeNeCompteDansLaSemaineQueSiElleAMoinsDe7Jours(): void
    {
        $productId = self::createProduct();
        $before    = self::$admin->get('/admin/kpis/sales?range=week')['body']['data']['total_sales'];

        self::createOrder(self::$customerUser['id'], $productId, 'paid', '50.00', '0.00', date('Y-m-d H:i:s', strtotime('-10 days')));
        self::createOrder(self::$customerUser['id'], $productId, 'paid', '7.00', '0.00', date('Y-m-d H:i:s', strtotime('-3 days')));

        $after = self::$admin->get('/admin/kpis/sales?range=week')['body']['data']['total_sales'];

        $this->assertEqualsWithDelta(7.00, $after - $before, 0.001);
    }

    // ------------------------------------------------------------------ stock

    public function testLesAlertesListentLesProduitsActifsSousLeSeuil(): void
    {
        $low      = self::createProduct(['stock_quantity' => 0, 'name' => 'ZZ rupture']);
        $enough   = self::createProduct(['stock_quantity' => 50]);
        $inactive = self::createProduct(['stock_quantity' => 0, 'is_active' => 0]);

        $data = self::$admin->get('/admin/stock/alerts?threshold=3')['body']['data'];
        $ids  = array_column($data['items'], 'id');

        $this->assertSame(3, $data['threshold_applied']);
        $this->assertContains($low, $ids);
        $this->assertNotContains($enough, $ids);
        $this->assertNotContains($inactive, $ids, 'un produit désactivé ne déclenche pas d\'alerte');
        $this->assertSame(count($data['items']), $data['alerts_count']);

        $quantities = array_map('intval', array_column($data['items'], 'stock_quantity'));
        $sorted = $quantities;
        sort($sorted);
        $this->assertSame($sorted, $quantities, 'du plus urgent au moins urgent');
    }

    public function testLeSeuilEstBorneEtVautCinqParDefaut(): void
    {
        $this->assertSame(5, self::$admin->get('/admin/stock/alerts')['body']['data']['threshold_applied']);
        $this->assertSame(5, self::$admin->get('/admin/stock/alerts?threshold=abc')['body']['data']['threshold_applied']);
        $this->assertSame(0, self::$admin->get('/admin/stock/alerts?threshold=-8')['body']['data']['threshold_applied']);
        $this->assertSame(100, self::$admin->get('/admin/stock/alerts?threshold=99999')['body']['data']['threshold_applied']);
    }

    // ------------------------------------------------------------------ journal de sécurité

    public function testLeJournalSeFiltreParEmailSansJamaisLeRenvoyerEnClair(): void
    {
        // Un échec de connexion est journalisé par l'adresse hachée (le compte peut ne pas exister) ; une réussite, par l'identifiant du compte
        $user = self::createUser();
        (new ApiClient())->login($user['email'], 'mauvais-mot-de-passe');

        $response = self::$admin->get('/admin/security-events?email=' . urlencode(strtoupper($user['email'])));
        $this->assertSame(200, $response['status']);

        $items = $response['body']['data']['items'];
        $this->assertCount(1, $items, 'l\'adresse est normalisée (majuscules) avant hachage');
        $this->assertSame('login_failed', $items[0]['event']);
        $this->assertStringNotContainsString($user['email'], $response['raw'], 'aucune adresse e-mail en clair');
    }

    public function testLeJournalSeFiltreParTypeEtUtilisateurDuPlusRecentAuPlusAncien(): void
    {
        $user = self::createUser();
        (new ApiClient())->login($user['email'], self::PASSWORD);
        (new ApiClient())->login($user['email'], self::PASSWORD);

        $data = self::$admin->get("/admin/security-events?event=login_success&user_id={$user['id']}")['body']['data'];

        $this->assertSame(2, $data['pagination']['total_items']);
        foreach ($data['items'] as $item) {
            $this->assertSame('login_success', $item['event']);
        }
        $this->assertGreaterThanOrEqual($data['items'][1]['created_at'], $data['items'][0]['created_at']);
    }

    public function testLeFiltreDeDatesIncluetouteLaJourneeDeFin(): void
    {
        $user = self::createUser();
        (new ApiClient())->login($user['email'], self::PASSWORD);
        $today = self::$db->query('SELECT CURDATE()')->fetchColumn();

        $included = self::$admin->get("/admin/security-events?user_id={$user['id']}&from=$today&to=$today")['body']['data'];
        $excluded = self::$admin->get("/admin/security-events?user_id={$user['id']}&to=2000-01-01")['body']['data'];

        $this->assertSame(1, $included['pagination']['total_items']);
        $this->assertSame(0, $excluded['pagination']['total_items']);
    }

    public function testLesFiltresInvalidesSontRefuses(): void
    {
        foreach (['event=LOGIN', 'event=a;b', 'user_id=abc', 'user_id=-1', 'from=2026-13-01', 'to=hier', 'from=2026-02-30'] as $query) {
            $this->assertSame(400, self::$admin->get("/admin/security-events?$query")['status'], $query);
        }
    }

    public function testLaPaginationDuJournalEstBornee(): void
    {
        $this->assertSame(50, self::$admin->get('/admin/security-events')['body']['data']['pagination']['per_page']);
        $this->assertSame(200, self::$admin->get('/admin/security-events?limit=100000')['body']['data']['pagination']['per_page']);
        $this->assertSame(1, self::$admin->get('/admin/security-events?limit=0')['body']['data']['pagination']['per_page']);
    }
}
