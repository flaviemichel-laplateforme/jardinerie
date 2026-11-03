<?php

namespace Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * API admin des produits : création, lecture, modification partielle, désactivation, et toutes les limites de ProductPolicy
 * vérifiées « de bout en bout » (requête HTTP, base de données). Ces tests décrivent le comportement ACTUEL : ils servent de filet de
 * sécurité avant les évolutions de l'API (prix HT, sols, rayons, upload).
 */
#[Group('integration')]
class AdminProductApiTest extends AdminApiTestCase
{
    private static int $subcategoryId;
    private static int $taxId;
    /** @var int[] */
    private static array $criteriaIds;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        self::$subcategoryId = (int) self::$db->query('SELECT subcategory_id FROM products ORDER BY id LIMIT 1')->fetchColumn();
        self::$taxId         = (int) self::$db->query('SELECT id FROM taxes ORDER BY id LIMIT 1')->fetchColumn();
        self::$criteriaIds   = array_map('intval', self::$db->query('SELECT id FROM criteria ORDER BY id LIMIT 3')->fetchAll(\PDO::FETCH_COLUMN));
    }

    /** Charge utile valide minimale (création). */
    private function payload(array $override = []): array
    {
        return array_merge([
            'subcategory_id' => self::$subcategoryId,
            'tax_id'         => self::$taxId,
            'name'           => 'ZZ produit API',
            'price_tax_incl' => 12.5,
            'sku'            => strtoupper(self::$prefix . '-' . bin2hex(random_bytes(3))),
        ], $override);
    }

    private function create(array $override = []): int
    {
        $response = self::$admin->post('/admin/products', $this->payload($override));
        $this->assertSame(201, $response['status'], $response['raw']);

        return (int) $response['body']['data']['id'];
    }

    // ------------------------------------------------------------------ lecture

    public function testLaListeContientLesProduitsActifsEtInactifsAvecLeurCategorie(): void
    {
        $active   = self::createProduct(['name' => 'ZZ actif']);
        $inactive = self::createProduct(['name' => 'ZZ inactif', 'is_active' => 0]);

        $response = self::$admin->get('/admin/products');
        $this->assertSame(200, $response['status']);

        $byId = array_column($response['body']['data']['products'], null, 'id');
        $this->assertArrayHasKey($active, $byId);
        $this->assertArrayHasKey($inactive, $byId, 'un produit désactivé reste listé dans l\'admin');
        $this->assertEquals(0, $byId[$inactive]['is_active']);

        foreach (['id', 'name', 'sku', 'price_tax_incl', 'purchase_price_tax_incl', 'stock_quantity', 'main_image_url', 'is_active', 'subcategory_name', 'category_name'] as $key) {
            $this->assertArrayHasKey($key, $byId[$active], "champ « $key »");
        }
    }

    public function testLaListeEstTrieeDuPlusRecentAuPlusAncien(): void
    {
        $ids = array_column(self::$admin->get('/admin/products')['body']['data']['products'], 'id');
        $sorted = $ids;
        rsort($sorted);

        $this->assertSame($sorted, $ids);
    }

    public function testLeDetailRenvoieTousLesChampsDuProduit(): void
    {
        $id = self::createProduct(['name' => 'ZZ détail']);

        $response = self::$admin->get("/admin/products/$id");
        $this->assertSame(200, $response['status']);

        $product = $response['body']['data']['product'];
        foreach (['subcategory_id', 'tax_id', 'category_id', 'department_id', 'description', 'main_image_url', 'secondary_image_url', 'sku',
                  'packaging_type', 'pot_diameter_cm', 'volume_l', 'weight_g', 'plant_id'] as $key) {
            $this->assertArrayHasKey($key, $product, "champ « $key »");
        }
        $this->assertNull($product['plant_id'], 'sans fiche botanique');
    }

    public function testUnProduitInconnuRepond404(): void
    {
        $this->assertSame(404, self::$admin->get('/admin/products/999999999')['status']);
        $this->assertSame(404, self::$admin->patch('/admin/products/999999999', ['name' => 'x'])['status']);
        $this->assertSame(404, self::$admin->delete('/admin/products/999999999')['status']);
    }

    // ------------------------------------------------------------------ création

    public function testCreationMinimaleEtRelecture(): void
    {
        $id = $this->create(['name' => '  ZZ avec espaces  ', 'stock_quantity' => 7, 'description' => 'Une description']);

        $product = self::$admin->get("/admin/products/$id")['body']['data']['product'];
        $this->assertSame('ZZ avec espaces', $product['name'], 'les espaces autour du nom sont retirés');
        $this->assertEquals(7, $product['stock_quantity']);
        $this->assertSame('Une description', $product['description']);
        $this->assertEquals(1, $product['is_active'], 'actif par défaut');
        $this->assertEquals(12.5, (float) $product['price_tax_incl']);
    }

    public function testUneReferenceVideDevientNulle(): void
    {
        $id = $this->create(['sku' => '']);

        $this->assertNull(self::$admin->get("/admin/products/$id")['body']['data']['product']['sku']);
    }

    public function testUneReferenceEnDoubleRepond409(): void
    {
        $sku = strtoupper(self::$prefix . '-DOUBLON');
        $this->create(['sku' => $sku]);

        $second = self::$admin->post('/admin/products', $this->payload(['sku' => $sku]));

        $this->assertSame(409, $second['status']);
        $this->assertStringContainsString('SKU', $second['body']['message']);
    }

    public function testUnCorpsQuiNEstPasDuJsonRepond400(): void
    {
        $response = self::$admin->request('POST', '/admin/products', null, null, ['Content-Type: application/json'], 'ceci n\'est pas du json');

        $this->assertSame(400, $response['status']);
        $this->assertSame(['Format JSON invalide.'], $response['body']['errors']);
    }

    /** @return array<string, array{0:array<string,mixed>}> */
    public static function invalidProducts(): array
    {
        $tooLong = str_repeat('a', 2001);

        return [
            'nom absent'                      => [['name' => '']],
            'nom de 101 caractères'           => [['name' => str_repeat('a', 101)]],
            'prix nul'                        => [['price_tax_incl' => 0]],
            'prix trop élevé'                 => [['price_tax_incl' => 10000]],
            'prix négatif'                    => [['price_tax_incl' => -1]],
            'prix d\'achat trop élevé'        => [['purchase_price_tax_incl' => 10000]],
            'stock négatif'                   => [['stock_quantity' => -1]],
            'stock trop élevé'                => [['stock_quantity' => 10000]],
            'stock décimal'                   => [['stock_quantity' => 1.5]],
            'référence avec espace'           => [['sku' => 'AB CD']],
            'référence trop longue'           => [['sku' => str_repeat('A', 51)]],
            'conditionnement inconnu'         => [['packaging_type' => 'Cageot']],
            'diamètre de pot nul'             => [['pot_diameter_cm' => 0]],
            'diamètre de pot trop grand'      => [['pot_diameter_cm' => 201]],
            'volume nul'                      => [['volume_l' => 0]],
            'volume trop grand'               => [['volume_l' => 1001]],
            'poids nul'                       => [['weight_g' => 0]],
            'poids trop grand'                => [['weight_g' => 100001]],
            'feuillage inconnu'               => [['plant' => ['foliage' => 'Bleu']]],
            'sécheresse inconnue'             => [['plant' => ['drought_tolerance' => 'Extreme']]],
            'difficulté inconnue'             => [['plant' => ['difficulty' => 'Impossible']]],
            'hauteur trop grande'             => [['plant' => ['height_max_cm' => 3001]]],
            'rusticité trop basse'            => [['plant' => ['hardiness_min_c' => -61]]],
            'rusticité trop haute'            => [['plant' => ['hardiness_min_c' => 41]]],
            'floraison sans fin'              => [['plant' => ['bloom_start_month' => 4]]],
            'mois de floraison hors limites'  => [['plant' => ['bloom_start_month' => 0, 'bloom_end_month' => 5]]],
            'récolte sans début'              => [['plant' => ['harvest_end_month' => 9]]],
            'famille trop longue'             => [['plant' => ['family' => str_repeat('a', 101)]]],
            'conseil de taille trop long'     => [['plant' => ['care_pruning' => $tooLong]]],
            'conseil de rempotage trop long'  => [['plant' => ['care_repotting' => $tooLong]]],
            'conseil parasites trop long'     => [['plant' => ['care_pests_diseases' => $tooLong]]],
        ];
    }

    /** @param array<string,mixed> $override */
    #[DataProvider('invalidProducts')]
    public function testUnProduitInvalideEstRefuseAvecLaListeDesErreurs(array $override): void
    {
        $response = self::$admin->post('/admin/products', $this->payload($override));

        $this->assertSame(400, $response['status'], $response['raw']);
        $this->assertSame('Données invalides.', $response['body']['message']);
        $this->assertNotEmpty($response['body']['errors']);
    }

    public function testLesChampsObligatoiresManquantsSontSignales(): void
    {
        $response = self::$admin->post('/admin/products', ['name' => 'ZZ incomplet']);

        $this->assertSame(400, $response['status']);
        $this->assertNotEmpty($response['body']['errors']);
    }

    public function testUneFloraisonQuiChevauchelAnneeEstAcceptee(): void
    {
        // Novembre -> février : la période passe par le 1er janvier
        $id = $this->create(['plant' => ['bloom_start_month' => 11, 'bloom_end_month' => 2]]);

        $product = self::$admin->get("/admin/products/$id")['body']['data']['product'];
        $this->assertEquals(11, $product['bloom_start_month']);
        $this->assertEquals(2, $product['bloom_end_month']);
    }

    // ------------------------------------------------------------------ modification

    public function testUneModificationPartielleNeToucheQueLesChampsEnvoyes(): void
    {
        $id = $this->create(['name' => 'ZZ avant', 'stock_quantity' => 5, 'description' => 'Garde-moi']);

        $response = self::$admin->patch("/admin/products/$id", ['name' => 'ZZ après']);
        $this->assertSame(200, $response['status'], $response['raw']);

        $product = self::$admin->get("/admin/products/$id")['body']['data']['product'];
        $this->assertSame('ZZ après', $product['name']);
        $this->assertEquals(5, $product['stock_quantity']);
        $this->assertSame('Garde-moi', $product['description']);
    }

    public function testUnCorpsVideEstRefuseALaModification(): void
    {
        $id = $this->create();

        $response = self::$admin->patch("/admin/products/$id", []);

        $this->assertSame(400, $response['status']);
        $this->assertSame('Aucune donnée fournie.', $response['body']['message']);
    }

    public function testLaModificationEstValideeAussi(): void
    {
        $id = $this->create();

        $this->assertSame(400, self::$admin->patch("/admin/products/$id", ['price_tax_incl' => 99999])['status']);
        $this->assertSame(400, self::$admin->patch("/admin/products/$id", ['plant' => ['foliage' => 'Bleu']])['status']);
    }

    public function testUneReferenceDejaPriseParUnAutreProduitRepond409ALaModification(): void
    {
        $first  = strtoupper(self::$prefix . '-PREMIER');
        $this->create(['sku' => $first]);
        $id = $this->create();

        $this->assertSame(409, self::$admin->patch("/admin/products/$id", ['sku' => $first])['status']);
    }

    public function testLaFicheBotaniqueSeLitAPlatEtSEcritEnObjetAvecSesCriteres(): void
    {
        $id = $this->create();

        $write = self::$admin->patch("/admin/products/$id", ['name' => 'ZZ fiche', 'plant' => [
            'family'              => 'Lamiaceae',
            'foliage'             => 'Evergreen',
            'difficulty'          => 'Beginner',
            'height_max_cm'       => 60,
            'hardiness_min_c'     => -15,
            'bloom_start_month'   => 6,
            'bloom_end_month'     => 8,
            'care_pruning'        => 'Taillez court après la floraison.',
            'criteria'            => [self::$criteriaIds[0], self::$criteriaIds[1]],
        ]]);
        $this->assertSame(200, $write['status'], $write['raw']);

        // Lecture : champs « à plat » (pas de sous-objet plant), critères sous « criteria_ids »
        $product = self::$admin->get("/admin/products/$id")['body']['data']['product'];
        $this->assertNotNull($product['plant_id']);
        $this->assertSame('Lamiaceae', $product['family']);
        $this->assertSame('Evergreen', $product['foliage']);
        $this->assertEquals(-15, $product['hardiness_min_c']);
        $this->assertEquals(6, $product['bloom_start_month']);
        $this->assertEqualsCanonicalizing([self::$criteriaIds[0], self::$criteriaIds[1]], array_map('intval', $product['criteria_ids']));
        $this->assertArrayNotHasKey('plant', $product);
    }

    public function testUneModificationDeLaFicheRemplaceTousLesChampsBotaniquesEtLesCriteres(): void
    {
        // Comportement ACTUEL à connaître : la fiche est réécrite en entier. Une clé absente repasse à NULL, et les critères sont remplacés.
        $id = $this->create();
        self::$admin->patch("/admin/products/$id", ['name' => 'ZZ fiche 1', 'plant' => ['family' => 'Rosaceae', 'height_max_cm' => 200, 'criteria' => [self::$criteriaIds[0]]]]);

        self::$admin->patch("/admin/products/$id", ['name' => 'ZZ fiche 2', 'plant' => ['family' => 'Lamiaceae', 'criteria' => [self::$criteriaIds[1], self::$criteriaIds[2]]]]);

        $product = self::$admin->get("/admin/products/$id")['body']['data']['product'];
        $this->assertSame('Lamiaceae', $product['family']);
        $this->assertNull($product['height_max_cm'], 'clé absente = valeur effacée');
        $this->assertEqualsCanonicalizing([self::$criteriaIds[1], self::$criteriaIds[2]], array_map('intval', $product['criteria_ids']));
    }

    public function testUneModificationQuiNeContientQueLaFicheNEstPasEnregistree(): void
    {
        // DÉFAUT ACTUEL, caractérisé ici pour être corrigé (N4-api-catalogue) : sans aucun champ « produit » dans la requête,
        // le modèle sort avant d'écrire la fiche, et l'API répond pourtant 200.
        $id = $this->create();

        $response = self::$admin->patch("/admin/products/$id", ['plant' => ['family' => 'Rosaceae']]);

        $this->assertSame(200, $response['status']);
        $this->assertNull(self::$admin->get("/admin/products/$id")['body']['data']['product']['plant_id']);
    }

    public function testLaFicheBotaniqueSeCreeAvecLeProduit(): void
    {
        $id = $this->create(['plant' => ['family' => 'Poaceae', 'drought_tolerance' => 'High', 'criteria' => [self::$criteriaIds[0]]]]);

        $product = self::$admin->get("/admin/products/$id")['body']['data']['product'];
        $this->assertSame('Poaceae', $product['family']);
        $this->assertSame('High', $product['drought_tolerance']);
        $this->assertSame([self::$criteriaIds[0]], array_map('intval', $product['criteria_ids']));
    }

    // ------------------------------------------------------------------ désactivation

    public function testLaSuppressionDésactiveLeProduitSansLeSupprimer(): void
    {
        $id = $this->create();

        $response = self::$admin->delete("/admin/products/$id");
        $this->assertSame(200, $response['status']);

        $product = self::$admin->get("/admin/products/$id")['body']['data']['product'];
        $this->assertEquals(0, $product['is_active']);

        // Et il disparaît du catalogue public
        $public = (new \Tests\Support\ApiClient())->get("/products/$id");
        $this->assertNotSame(200, $public['status'], 'un produit désactivé n\'est plus visible dans le catalogue public');
    }

    public function testUnProduitDesactiveSeReactiveParModification(): void
    {
        $id = $this->create();
        self::$admin->delete("/admin/products/$id");

        $this->assertSame(200, self::$admin->patch("/admin/products/$id", ['is_active' => 1])['status']);

        $this->assertEquals(1, self::$admin->get("/admin/products/$id")['body']['data']['product']['is_active']);
    }
}
