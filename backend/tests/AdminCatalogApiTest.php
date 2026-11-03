<?php

namespace Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * API admin du classement : arbre rayon > catégorie > sous-catégorie, taux de TVA, création, renommage, suppression contrôlée,
 * drapeau « fiche botanique » des rayons.
 */
#[Group('integration')]
class AdminCatalogApiTest extends AdminApiTestCase
{
    private static int $plantDepartmentId;
    private static int $otherDepartmentId;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        self::$plantDepartmentId = (int) self::$db->query('SELECT id FROM departments WHERE has_plant_sheet = 1 ORDER BY id LIMIT 1')->fetchColumn();
        self::$otherDepartmentId = (int) self::$db->query('SELECT id FROM departments WHERE has_plant_sheet = 0 ORDER BY id LIMIT 1')->fetchColumn();
    }

    public static function tearDownAfterClass(): void
    {
        // Produits d'abord (ils dépendent des sous-catégories), puis le classement créé ici, repéré par son préfixe
        parent::tearDownAfterClass();

        $like = 'ZZ ' . self::$prefix . '%';
        self::$db->prepare('DELETE s FROM subcategories s INNER JOIN categories c ON c.id = s.category_id WHERE c.name LIKE ?')->execute([$like]);
        self::$db->prepare('DELETE FROM subcategories WHERE name LIKE ?')->execute([$like]);
        self::$db->prepare('DELETE FROM categories WHERE name LIKE ?')->execute([$like]);
    }

    private function label(string $suffix): string
    {
        return 'ZZ ' . self::$prefix . ' ' . $suffix;
    }

    private function newCategory(string $suffix, ?int $departmentId = null): int
    {
        $response = self::$admin->post('/admin/categories', ['department_id' => $departmentId ?? self::$plantDepartmentId, 'name' => $this->label($suffix)]);
        $this->assertSame(201, $response['status'], $response['raw']);

        return (int) $response['body']['data']['id'];
    }

    private function newSubcategory(int $categoryId, string $suffix): int
    {
        $response = self::$admin->post('/admin/subcategories', ['category_id' => $categoryId, 'name' => $this->label($suffix)]);
        $this->assertSame(201, $response['status'], $response['raw']);

        return (int) $response['body']['data']['id'];
    }

    /** @return array<int, array> rayons de l'arbre, par identifiant */
    private function tree(): array
    {
        return array_column(self::$admin->get('/admin/categories')['body']['data']['tree'], null, 'id');
    }

    private function findCategory(int $categoryId): ?array
    {
        foreach ($this->tree() as $department) {
            foreach ($department['categories'] as $category) {
                if ($category['id'] === $categoryId) {
                    return $category + ['department_id' => $department['id']];
                }
            }
        }

        return null;
    }

    // ------------------------------------------------------------------ lecture

    public function testLArbreEstHierarchiseAvecLesComptesEtLeDrapeauDesRayons(): void
    {
        $tree = self::$admin->get('/admin/categories')['body']['data']['tree'];
        $this->assertIsList($tree, 'une liste (pas un objet indexé par identifiant)');

        $byId = array_column($tree, null, 'id');
        $this->assertTrue($byId[self::$plantDepartmentId]['has_plant_sheet']);
        $this->assertFalse($byId[self::$otherDepartmentId]['has_plant_sheet']);

        $subcategories = array_merge(...array_column($byId[self::$plantDepartmentId]['categories'], 'subcategories'));
        $this->assertNotEmpty($subcategories);
        $this->assertIsInt($byId[self::$plantDepartmentId]['categories'][0]['id']);
        $this->assertIsInt($subcategories[0]['id']);
        $this->assertIsInt($subcategories[0]['product_count']);
    }

    public function testUneCategorieVideApparaitDansLArbre(): void
    {
        // Corrigé en N4-api-catalogue : avant, l'arbre partait des sous-catégories et masquait les catégories vides
        $id = $this->newCategory('Vide');

        $category = $this->findCategory($id);
        $this->assertNotNull($category);
        $this->assertSame([], $category['subcategories']);
    }

    public function testLeNombreDeProduitsComprendLesProduitsDesactives(): void
    {
        $sub = $this->newSubcategory($this->newCategory('Comptes'), 'Comptes sous');
        self::createProduct(['subcategory_id' => $sub]);
        self::createProduct(['subcategory_id' => $sub, 'is_active' => 0]);

        $this->assertSame(2, $this->findCategory((int) self::$db->query("SELECT category_id FROM subcategories WHERE id = $sub")->fetchColumn())['subcategories'][0]['product_count']);
    }

    public function testLesTauxDeTvaSontTriesParTaux(): void
    {
        $rates = array_map('floatval', array_column(self::$admin->get('/admin/taxes')['body']['data']['taxes'], 'rate'));
        $sorted = $rates;
        sort($sorted);

        $this->assertNotEmpty($rates);
        $this->assertSame($sorted, $rates);
    }

    // ------------------------------------------------------------------ création

    public function testCreerUneCategoriePuisUneSousCategorie(): void
    {
        $category = self::$admin->post('/admin/categories', ['department_id' => self::$plantDepartmentId, 'name' => '  ' . $this->label('Bulbes') . '   ']);
        $this->assertSame(201, $category['status'], $category['raw']);
        $categoryId = (int) $category['body']['data']['id'];

        $subId = $this->newSubcategory($categoryId, 'Tulipes');

        $found = $this->findCategory($categoryId);
        $this->assertSame(self::$plantDepartmentId, $found['department_id']);
        $this->assertSame($this->label('Bulbes'), $found['name'], 'espaces retirés');
        $this->assertSame($subId, $found['subcategories'][0]['id']);
    }

    public function testLesEspacesMultiplesSontReduits(): void
    {
        $response = self::$admin->post('/admin/categories', ['department_id' => self::$plantDepartmentId, 'name' => 'ZZ ' . self::$prefix . '   Deux    espaces']);

        $this->assertSame('ZZ ' . self::$prefix . ' Deux espaces', $this->findCategory((int) $response['body']['data']['id'])['name']);
    }

    public function testUnNomDejaPrisDansLeMemeParentEstRefuseSansTenirCompteDesMajuscules(): void
    {
        $this->newCategory('Doublon');

        $response = self::$admin->post('/admin/categories', ['department_id' => self::$plantDepartmentId, 'name' => strtoupper($this->label('Doublon'))]);

        $this->assertSame(409, $response['status']);
        $this->assertSame('Une catégorie porte déjà ce nom dans ce rayon.', $response['body']['message']);
    }

    public function testLeMemeNomEstPermisDansUnAutreParent(): void
    {
        $this->newCategory('Partage', self::$plantDepartmentId);

        $this->assertSame(201, self::$admin->post('/admin/categories', ['department_id' => self::$otherDepartmentId, 'name' => $this->label('Partage')])['status']);
    }

    public function testUneSousCategorieEnDoubleEstRefusee(): void
    {
        $category = $this->newCategory('Parent doublon');
        $this->newSubcategory($category, 'Sous doublon');

        $this->assertSame(409, self::$admin->post('/admin/subcategories', ['category_id' => $category, 'name' => $this->label('Sous doublon')])['status']);
    }

    /** @return array<string, array{0:string, 1:array<string,mixed>}> */
    public static function invalidCreations(): array
    {
        $long = str_repeat('a', 101);

        return [
            'catégorie sans rayon'            => ['/admin/categories', ['name' => 'ZZ x']],
            'catégorie sans nom'              => ['/admin/categories', ['department_id' => 1]],
            'catégorie au nom vide'           => ['/admin/categories', ['department_id' => 1, 'name' => '   ']],
            'catégorie au nom trop long'      => ['/admin/categories', ['department_id' => 1, 'name' => $long]],
            'catégorie au nom non textuel'    => ['/admin/categories', ['department_id' => 1, 'name' => ['x']]],
            'catégorie d\'un rayon inconnu'   => ['/admin/categories', ['department_id' => 999999999, 'name' => 'ZZ x']],
            'rayon non numérique'             => ['/admin/categories', ['department_id' => 'abc', 'name' => 'ZZ x']],
            'sous-catégorie sans parent'      => ['/admin/subcategories', ['name' => 'ZZ x']],
            'sous-catégorie sans nom'         => ['/admin/subcategories', ['category_id' => 1]],
            'sous-catégorie au nom trop long' => ['/admin/subcategories', ['category_id' => 1, 'name' => $long]],
            'catégorie parente inconnue'      => ['/admin/subcategories', ['category_id' => 999999999, 'name' => 'ZZ x']],
        ];
    }

    /** @param array<string,mixed> $body */
    #[DataProvider('invalidCreations')]
    public function testUneCreationInvalideEstRefuseeAvecUnMessageClair(string $path, array $body): void
    {
        $response = self::$admin->post($path, $body);

        $this->assertSame(400, $response['status'], $response['raw']);
        $this->assertNotEmpty($response['body']['message']);
        $this->assertStringNotContainsString('SQLSTATE', $response['raw']);
    }

    // ------------------------------------------------------------------ renommage

    public function testRenommerUneCategorieEtUneSousCategorie(): void
    {
        $category = $this->newCategory('Ancien nom');
        $sub      = $this->newSubcategory($category, 'Ancienne sous');

        $this->assertSame(200, self::$admin->patch("/admin/categories/$category", ['name' => $this->label('Nouveau nom')])['status']);
        $this->assertSame(200, self::$admin->patch("/admin/subcategories/$sub", ['name' => $this->label('Nouvelle sous')])['status']);

        $found = $this->findCategory($category);
        $this->assertSame($this->label('Nouveau nom'), $found['name']);
        $this->assertSame($this->label('Nouvelle sous'), $found['subcategories'][0]['name']);
    }

    public function testRenommerAvecLeMemeNomEnChangeantLesMajusculesEstPermis(): void
    {
        $category = $this->newCategory('casse');

        $this->assertSame(200, self::$admin->patch("/admin/categories/$category", ['name' => 'ZZ ' . self::$prefix . ' Casse'])['status']);
    }

    public function testRenommerVersUnNomDejaPrisEstRefuse(): void
    {
        $this->newCategory('Pris');
        $other = $this->newCategory('Libre');

        $this->assertSame(409, self::$admin->patch("/admin/categories/$other", ['name' => $this->label('pris')])['status']);
        $this->assertSame(400, self::$admin->patch("/admin/categories/$other", ['name' => ''])['status']);
        $this->assertSame(404, self::$admin->patch('/admin/categories/999999999', ['name' => 'x'])['status']);
        $this->assertSame(404, self::$admin->patch('/admin/subcategories/999999999', ['name' => 'x'])['status']);
    }

    // ------------------------------------------------------------------ suppression

    public function testUneCategorieQuiContientDesSousCategoriesNePeutPasEtreSupprimee(): void
    {
        $category = $this->newCategory('Pleine');
        $this->newSubcategory($category, 'Dedans');

        $response = self::$admin->delete("/admin/categories/$category");

        $this->assertSame(409, $response['status']);
        $this->assertSame(1, $response['body']['data']['subcategory_count']);
        $this->assertNotNull($this->findCategory($category));
    }

    public function testUneSousCategorieQuiContientUnProduitMemeDesactiveNePeutPasEtreSupprimee(): void
    {
        $sub = $this->newSubcategory($this->newCategory('Avec produit'), 'Avec produit sous');
        self::createProduct(['subcategory_id' => $sub, 'is_active' => 0]);

        $response = self::$admin->delete("/admin/subcategories/$sub");

        $this->assertSame(409, $response['status']);
        $this->assertSame(1, $response['body']['data']['product_count']);
    }

    public function testSupprimerUnElementVideEstJournalise(): void
    {
        $category = $this->newCategory('A supprimer');
        $sub      = $this->newSubcategory($category, 'A supprimer sous');

        $this->assertSame(200, self::$admin->delete("/admin/subcategories/$sub")['status']);
        $this->assertSame(200, self::$admin->delete("/admin/categories/$category")['status']);
        $this->assertNull($this->findCategory($category));

        $stmt = self::$db->prepare("SELECT details FROM security_events WHERE event = 'category_deleted' AND user_id = ? ORDER BY id");
        $stmt->execute([self::$adminUser['id']]);
        $types = array_column(array_map(fn($json) => json_decode($json, true), $stmt->fetchAll(\PDO::FETCH_COLUMN)), 'type');
        $this->assertSame(['subcategory', 'category'], array_slice($types, -2));
    }

    public function testSupprimerUnElementInconnuRepond404(): void
    {
        $this->assertSame(404, self::$admin->delete('/admin/categories/999999999')['status']);
        $this->assertSame(404, self::$admin->delete('/admin/subcategories/999999999')['status']);
    }

    // ------------------------------------------------------------------ rayons

    public function testOnNePeutPasRetirerLaFicheBotaniqueDUnRayonQuiEnContient(): void
    {
        $response = self::$admin->patch('/admin/departments/' . self::$plantDepartmentId, ['has_plant_sheet' => false]);

        $this->assertSame(409, $response['status']);
        $this->assertTrue($this->tree()[self::$plantDepartmentId]['has_plant_sheet']);
    }

    public function testActiverPuisRetirerLaFicheBotaniqueDUnRayonSansFiche(): void
    {
        try {
            $this->assertSame(200, self::$admin->patch('/admin/departments/' . self::$otherDepartmentId, ['has_plant_sheet' => true])['status']);
            $this->assertTrue($this->tree()[self::$otherDepartmentId]['has_plant_sheet']);

            $this->assertSame(200, self::$admin->patch('/admin/departments/' . self::$otherDepartmentId, ['has_plant_sheet' => false])['status']);
            $this->assertFalse($this->tree()[self::$otherDepartmentId]['has_plant_sheet']);
        } finally {
            self::$db->prepare('UPDATE departments SET has_plant_sheet = 0 WHERE id = ?')->execute([self::$otherDepartmentId]);
        }
    }

    public function testLesModificationsDeRayonInvalidesSontRefusees(): void
    {
        $id = self::$otherDepartmentId;

        $this->assertSame(400, self::$admin->patch("/admin/departments/$id", ['has_plant_sheet' => 'oui'])['status']);
        $this->assertSame(400, self::$admin->patch("/admin/departments/$id", ['has_plant_sheet' => 1])['status'], 'un booléen JSON, pas un nombre');
        $this->assertSame(400, self::$admin->patch("/admin/departments/$id", [])['status']);
        $this->assertSame(400, self::$admin->patch("/admin/departments/$id", ['name' => ''])['status']);
        $this->assertSame(404, self::$admin->patch('/admin/departments/999999999', ['has_plant_sheet' => true])['status']);

        $other = self::$db->query('SELECT name FROM departments WHERE id = ' . self::$plantDepartmentId)->fetchColumn();
        $this->assertSame(409, self::$admin->patch("/admin/departments/$id", ['name' => mb_strtoupper($other)])['status']);
    }
}
