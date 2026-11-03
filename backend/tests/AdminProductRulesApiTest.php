<?php

namespace Tests;

use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;
use Tests\Support\ApiClient;

/**
 * Règles du catalogue ajoutées en N4-api-catalogue, vérifiées par l'API : prix d'achat HT, références existantes,
 * fiche botanique selon le rayon, adresses d'image, nature et pH du sol (avec l'écriture double des anciens critères
 * « Sol … », pour l'ancien site jusqu'à la bascule).
 */
#[Group('integration')]
class AdminProductRulesApiTest extends AdminApiTestCase
{
    private static int $plantSubcategoryId;
    private static int $otherSubcategoryId;
    private static int $taxId;
    /** @var array<string,int> nom => id */
    private static array $soilTypes;
    /** @var array<string,int> */
    private static array $soilPh;
    /** @var array<string,int> nom => id des anciens critères « Sol … » */
    private static array $legacy;
    private static int $ordinaryCriterionId;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        $db = self::$db;
        $subFor = fn(int $flag) => (int) $db->query(
            "SELECT s.id FROM subcategories s JOIN categories c ON c.id = s.category_id JOIN departments d ON d.id = c.department_id
             WHERE d.has_plant_sheet = $flag ORDER BY s.id LIMIT 1"
        )->fetchColumn();

        self::$plantSubcategoryId = $subFor(1);
        self::$otherSubcategoryId = $subFor(0);
        self::$taxId     = (int) $db->query('SELECT id FROM taxes ORDER BY id LIMIT 1')->fetchColumn();
        self::$soilTypes = array_map('intval', $db->query('SELECT name, id FROM soil_types')->fetchAll(\PDO::FETCH_KEY_PAIR));
        self::$soilPh    = array_map('intval', $db->query('SELECT name, id FROM soil_ph')->fetchAll(\PDO::FETCH_KEY_PAIR));
        self::$legacy    = array_map('intval', $db->query("SELECT name, id FROM criteria WHERE name LIKE 'Sol %'")->fetchAll(\PDO::FETCH_KEY_PAIR));
        self::$ordinaryCriterionId = (int) $db->query("SELECT id FROM criteria WHERE name NOT LIKE 'Sol %' ORDER BY id LIMIT 1")->fetchColumn();
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'subcategory_id' => self::$plantSubcategoryId,
            'tax_id'         => self::$taxId,
            'name'           => 'ZZ règles',
            'price_tax_incl' => 12.0,
            'sku'            => strtoupper(self::$prefix . '-' . bin2hex(random_bytes(3))),
        ], $override);
    }

    private function create(array $override = []): int
    {
        $response = self::$admin->post('/admin/products', $this->payload($override));
        $this->assertSame(201, $response['status'], $response['raw']);

        return (int) $response['body']['data']['id'];
    }

    private function product(int $id): array
    {
        return self::$admin->get("/admin/products/$id")['body']['data']['product'];
    }

    /** Envoie une vraie image par l'API et renvoie son adresse. */
    private function uploadImage(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'zzup');
        file_put_contents($path, self::pngBytes());
        try {
            $response = self::$admin->request('POST', '/admin/upload', null, ['image' => new \CURLFile($path, 'image/png', 'a.png')]);
        } finally {
            @unlink($path);
        }
        $this->assertSame(201, $response['status'], $response['raw']);
        self::trackFile($response['body']['data']['url']);

        return $response['body']['data']['url'];
    }

    // ------------------------------------------------------------------ prix d'achat HT

    public function testLePrixDAchatHtEstEnregistreDansLesDeuxColonnes(): void
    {
        $id = $this->create(['purchase_price_excl_tax' => 8.456]);

        $product = $this->product($id);
        $this->assertEquals(8.46, (float) $product['purchase_price_excl_tax'], 'arrondi au centime');
        $this->assertEquals(8.46, (float) $product['purchase_price_tax_incl'], 'ancienne colonne : même valeur HT (lue par l\'ancien admin)');
        $this->assertArrayHasKey('tax_rate', $product);
    }

    public function testLAncienAdminQuiEnvoieLAncienNomAlimenteAussiLePrixHt(): void
    {
        $id = $this->create();

        self::$admin->patch("/admin/products/$id", ['purchase_price_tax_incl' => 5]);

        $this->assertEquals(5.0, (float) $this->product($id)['purchase_price_excl_tax']);
    }

    public function testViderLePrixDAchatLeRetireDesDeuxColonnes(): void
    {
        $id = $this->create(['purchase_price_excl_tax' => 4]);

        self::$admin->patch("/admin/products/$id", ['purchase_price_excl_tax' => '']);

        $product = $this->product($id);
        $this->assertNull($product['purchase_price_excl_tax']);
        $this->assertNull($product['purchase_price_tax_incl']);
    }

    public function testLaListeRenvoieLePrixHtEtLeClassementComplet(): void
    {
        $id = $this->create(['purchase_price_excl_tax' => 3]);

        $row = array_column(self::$admin->get('/admin/products')['body']['data']['products'], null, 'id')[$id];
        foreach (['purchase_price_excl_tax', 'tax_rate', 'subcategory_id', 'category_id', 'department_id', 'department_name'] as $key) {
            $this->assertArrayHasKey($key, $row, $key);
        }
    }

    // ------------------------------------------------------------------ références

    public function testDesReferencesInconnuesSontRefuseesSansErreurInterne(): void
    {
        foreach ([
            ['tax_id' => 999999],
            ['subcategory_id' => 999999],
            ['plant' => ['criteria' => [999999]]],
            ['plant' => ['soil_type_ids' => [999999]]],
            ['plant' => ['soil_ph_ids' => [999999]]],
        ] as $override) {
            $response = self::$admin->post('/admin/products', $this->payload($override));
            $this->assertSame(400, $response['status'], json_encode($override) . ' ' . $response['raw']);
            $this->assertStringNotContainsString('SQLSTATE', $response['raw']);
        }

        $id = $this->create();
        $this->assertSame(400, self::$admin->patch("/admin/products/$id", ['tax_id' => 999999])['status']);
    }

    public function testDesactiverDeuxFoisNEstPasUneErreur(): void
    {
        $id = $this->create();

        $this->assertSame(200, self::$admin->delete("/admin/products/$id")['status']);
        $this->assertSame(200, self::$admin->delete("/admin/products/$id")['status'], 'avant : 404, car aucune ligne modifiée');
    }

    // ------------------------------------------------------------------ fiche botanique selon le rayon

    public function testLeDetailIndiqueSiLeRayonAccepteUneFiche(): void
    {
        $this->assertEquals(1, $this->product($this->create())['has_plant_sheet']);
        $this->assertEquals(0, $this->product($this->create(['subcategory_id' => self::$otherSubcategoryId]))['has_plant_sheet']);
    }

    public function testUneFicheEstRefuseeDansUnRayonSansFicheBotanique(): void
    {
        $response = self::$admin->post('/admin/products', $this->payload(['subcategory_id' => self::$otherSubcategoryId, 'plant' => ['family' => 'Rosaceae']]));

        $this->assertSame(400, $response['status']);
        $this->assertSame(["Le rayon de cette sous-catégorie n'a pas de fiche botanique."], $response['body']['errors']);
    }

    public function testDeplacerUnProduitAvecFicheVersUnRayonSansFicheDemandeDeLaSupprimer(): void
    {
        $id = $this->create(['plant' => ['family' => 'Rosaceae', 'criteria' => [self::$ordinaryCriterionId]]]);

        $this->assertSame(400, self::$admin->patch("/admin/products/$id", ['subcategory_id' => self::$otherSubcategoryId])['status']);

        $response = self::$admin->patch("/admin/products/$id", ['subcategory_id' => self::$otherSubcategoryId, 'plant' => null]);
        $this->assertSame(200, $response['status'], $response['raw']);

        $product = $this->product($id);
        $this->assertNull($product['plant_id'], 'fiche supprimée');
        $this->assertSame([], $product['criteria_ids'], 'ses liens partent avec elle');
        $this->assertEquals(self::$otherSubcategoryId, $product['subcategory_id']);
    }

    public function testSupprimerLaFicheDUnVegetal(): void
    {
        $id = $this->create(['plant' => ['family' => 'Rosaceae', 'soil_type_ids' => [self::$soilTypes['Argileux']]]]);

        $this->assertSame(200, self::$admin->patch("/admin/products/$id", ['plant' => null])['status']);

        $stmt = self::$db->prepare('SELECT COUNT(*) FROM plants WHERE product_id = ?');
        $stmt->execute([$id]);
        $this->assertSame(0, (int) $stmt->fetchColumn());
    }

    // ------------------------------------------------------------------ images

    public function testUneImageEnvoyeeParLAdminEstAcceptee(): void
    {
        $url = $this->uploadImage();

        $id = $this->create(['main_image_url' => $url]);

        $this->assertSame($url, $this->product($id)['main_image_url']);
    }

    public function testUneAdresseDImageExterneOuInventeeEstRefusee(): void
    {
        foreach (['https://pistage.example/pixel.gif', '../../index.php', 'uploads/products/product_' . str_repeat('a', 32) . '.webp'] as $url) {
            $response = self::$admin->post('/admin/products', $this->payload(['main_image_url' => $url]));
            $this->assertSame(400, $response['status'], $url);
        }
    }

    public function testUneImageAncienneFormuleInchangeeResteAcceptee(): void
    {
        $id = self::createProduct(['main_image_url' => 'https://ancien.example/plante.jpg']);

        $this->assertSame(200, self::$admin->patch("/admin/products/$id", ['main_image_url' => 'https://ancien.example/plante.jpg', 'name' => 'ZZ inchangée'])['status']);
        $this->assertSame(400, self::$admin->patch("/admin/products/$id", ['main_image_url' => 'https://ancien.example/autre.jpg'])['status']);
    }

    public function testUneImageRemplaceeEstSupprimeeDuDisqueSiPlusPersonneNeLUtilise(): void
    {
        $old = $this->uploadImage();
        $new = $this->uploadImage();
        $id  = $this->create(['main_image_url' => $old]);

        $this->assertSame(200, self::$admin->patch("/admin/products/$id", ['main_image_url' => $new])['status']);

        $this->assertFileDoesNotExist(__DIR__ . '/../public/' . $old);
        $this->assertFileExists(__DIR__ . '/../public/' . $new);
    }

    public function testUneImageRemplaceeMaisUtiliseeAilleursEstConservee(): void
    {
        $shared = $this->uploadImage();
        $first  = $this->create(['main_image_url' => $shared]);
        $this->create(['secondary_image_url' => $shared]);

        self::$admin->patch("/admin/products/$first", ['main_image_url' => '']);

        $this->assertFileExists(__DIR__ . '/../public/' . $shared);
        $this->assertNull($this->product($first)['main_image_url'], 'image retirée : NULL, jamais ""');
    }

    // ------------------------------------------------------------------ sols

    public function testLesSolsSEnregistrentEtTiennentAJourLesAnciensCriteres(): void
    {
        $id = $this->create(['plant' => [
            'criteria'      => [self::$ordinaryCriterionId],
            'soil_type_ids' => [self::$soilTypes['Argileux'], self::$soilTypes['Calcaire']],
            'soil_ph_ids'   => [self::$soilPh['Alcalin']],
        ]]);

        $product = $this->product($id);
        $this->assertEqualsCanonicalizing([self::$soilTypes['Argileux'], self::$soilTypes['Calcaire']], $product['soil_type_ids']);
        $this->assertSame([self::$soilPh['Alcalin']], $product['soil_ph_ids']);
        // Écriture double : critère ordinaire + « Sol argileux » + « Sol calcaire » (une seule fois pour Calcaire et Alcalin)
        $this->assertEqualsCanonicalizing(
            [self::$ordinaryCriterionId, self::$legacy['Sol argileux'], self::$legacy['Sol calcaire']],
            $product['criteria_ids']
        );
    }

    public function testLesAnciensCriteresDeSolRenvoyesParLeNouvelAdminSontRecalcules(): void
    {
        // Le nouvel admin relit criteria_ids (qui contient les anciens critères de sol), change les sols, et renvoie le tout
        $id = $this->create(['plant' => ['soil_type_ids' => [self::$soilTypes['Argileux']]]]);
        $sent = $this->product($id)['criteria_ids'];

        self::$admin->patch("/admin/products/$id", ['plant' => ['criteria' => $sent, 'soil_type_ids' => [self::$soilTypes['Sableux']], 'soil_ph_ids' => []]]);

        $product = $this->product($id);
        $this->assertSame([self::$soilTypes['Sableux']], $product['soil_type_ids']);
        $this->assertSame([self::$legacy['Sol sableux']], $product['criteria_ids'], 'l\'ancien « Sol argileux » est retiré');
    }

    public function testLAncienAdminQuiNeConnaitQueLesCriteresAlimenteLesNouvellesTables(): void
    {
        $id = $this->create(['plant' => ['criteria' => [self::$legacy['Sol humifère'], self::$legacy['Sol calcaire'], self::$ordinaryCriterionId]]]);

        $product = $this->product($id);
        $this->assertEqualsCanonicalizing([self::$soilTypes['Humifère'], self::$soilTypes['Calcaire']], $product['soil_type_ids']);
        $this->assertSame([self::$soilPh['Alcalin']], $product['soil_ph_ids'], '« Sol calcaire » donne aussi le pH alcalin');
    }

    // ------------------------------------------------------------------ site public

    public function testLaFicheEtLeCataloguePublicsExposentLesSols(): void
    {
        $id = $this->create(['plant' => [
            'criteria'      => [self::$ordinaryCriterionId],
            'soil_type_ids' => [self::$soilTypes['Drainé']],
            'soil_ph_ids'   => [self::$soilPh['Acide']],
        ]]);
        $public = new ApiClient();

        $v1 = $public->get("/products/$id")['body']['data'];
        $v2 = $public->get("/products/$id?v=2")['body']['data'];

        $this->assertSame([['id' => self::$soilTypes['Drainé'], 'label' => 'Drainé']], $v2['soil_types']);
        $this->assertSame([['id' => self::$soilPh['Acide'], 'label' => 'Acide']], $v2['soil_ph']);
        $this->assertCount(3, $v1['criteria'], 'ancien site : les anciens critères de sol restent visibles');
        $this->assertSame([self::$ordinaryCriterionId], array_column($v2['criteria'], 'id'), 'nouveau site : sans doublon des sols');

        $byType = array_column($public->get('/products?limit=200&soil_types=' . self::$soilTypes['Drainé'])['body']['data'], 'id');
        $byPh   = array_column($public->get('/products?limit=200&soil_ph=' . self::$soilPh['Acide'] . '&soil_types=' . self::$soilTypes['Drainé'])['body']['data'], 'id');
        $none   = array_column($public->get('/products?limit=200&soil_ph=' . self::$soilPh['Alcalin'] . '&soil_types=' . self::$soilTypes['Drainé'])['body']['data'], 'id');
        $legacy = array_column($public->get('/products?limit=200&criteria=' . self::$legacy['Sol drainé'])['body']['data'], 'id');

        $this->assertContains($id, $byType);
        $this->assertContains($id, $byPh, 'nature ET pH');
        $this->assertNotContains($id, $none);
        $this->assertContains($id, $legacy, 'ancien site : le filtre par ancien critère fonctionne toujours');
    }

    public function testLesFiltresPublicsV2SeparentLesSols(): void
    {
        $public = new ApiClient();

        $v1 = $public->get('/filters')['body']['data'];
        $v2 = $public->get('/filters?v=2')['body']['data'];

        $this->assertArrayNotHasKey('soil_types', $v1, 'ancien site : réponse inchangée');
        $this->assertContains('Sol argileux', array_column($v1['criteria'], 'label'));

        $this->assertNotContains('Sol argileux', array_column($v2['criteria'], 'label'));
        $this->assertContains('Argileux', array_column($v2['soil_types'], 'label'));
        $this->assertContains('Alcalin', array_column($v2['soil_ph'], 'label'));
    }

    public function testDesFiltresDeSolMalFormesSontIgnoresSansErreur(): void
    {
        foreach (['abc', '-1', '1;DROP TABLE products', '', ',,,', str_repeat('1,', 500)] as $value) {
            $this->assertSame(200, (new ApiClient())->get('/products?soil_types=' . urlencode($value))['status'], $value);
        }
    }

    public function testLeRayonDuCatalogueSuitLeDrapeauDeFicheBotanique(): void
    {
        $plantCategories = array_column((new ApiClient())->get('/filters?type=vegetaux')['body']['data']['categories'], 'id');
        $expected = array_map('intval', self::$db->query('SELECT c.id FROM categories c JOIN departments d ON d.id = c.department_id WHERE d.has_plant_sheet = 1')->fetchAll(\PDO::FETCH_COLUMN));

        $this->assertEqualsCanonicalizing($expected, array_map('intval', $plantCategories));
    }
}
