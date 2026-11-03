<?php

namespace Tests;

use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * API admin du catalogue : arbre rayon > catégorie > sous-catégorie, taux de TVA, création de catégories et sous-catégories.
 * Décrit le comportement ACTUEL ; N4-api-catalogue ajoutera renommage, suppression contrôlée et unicité des noms.
 */
#[Group('integration')]
class AdminCatalogApiTest extends AdminApiTestCase
{
    private static int $departmentId;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        self::$departmentId = (int) self::$db->query('SELECT id FROM departments ORDER BY id LIMIT 1')->fetchColumn();
    }

    public static function tearDownAfterClass(): void
    {
        // Les catégories créées ici portent le préfixe de la classe
        $like = 'ZZ ' . self::$prefix . '%';
        self::$db->prepare('DELETE s FROM subcategories s INNER JOIN categories c ON c.id = s.category_id WHERE c.name LIKE ?')->execute([$like]);
        self::$db->prepare('DELETE FROM subcategories WHERE name LIKE ?')->execute([$like]);
        self::$db->prepare('DELETE FROM categories WHERE name LIKE ?')->execute([$like]);

        parent::tearDownAfterClass();
    }

    private function label(string $suffix): string
    {
        return 'ZZ ' . self::$prefix . ' ' . $suffix;
    }

    /** La sous-catégorie (et son parent) trouvés dans l'arbre, ou null. */
    private function findInTree(int $subcategoryId): ?array
    {
        foreach (self::$admin->get('/admin/categories')['body']['data']['tree'] as $department) {
            foreach ($department['categories'] as $category) {
                foreach ($category['subcategories'] as $subcategory) {
                    if ($subcategory['id'] === $subcategoryId) {
                        return ['department' => $department, 'category' => $category, 'subcategory' => $subcategory];
                    }
                }
            }
        }

        return null;
    }

    private function categoryInTree(int $categoryId): bool
    {
        foreach (self::$admin->get('/admin/categories')['body']['data']['tree'] as $department) {
            if (in_array($categoryId, array_column($department['categories'], 'id'), true)) {
                return true;
            }
        }

        return false;
    }

    // ------------------------------------------------------------------ lecture

    public function testLArbreEstHierarchiseAvecDesIdentifiantsEntiers(): void
    {
        $response = self::$admin->get('/admin/categories');
        $this->assertSame(200, $response['status']);

        $tree = $response['body']['data']['tree'];
        $this->assertNotEmpty($tree);
        $this->assertIsList($tree, 'une liste (pas un objet indexé par identifiant)');

        $department = $tree[0];
        $this->assertIsInt($department['id']);
        $this->assertIsString($department['name']);
        $this->assertIsList($department['categories']);
        $this->assertIsInt($department['categories'][0]['id']);
        $this->assertIsList($department['categories'][0]['subcategories']);
        $this->assertIsInt($department['categories'][0]['subcategories'][0]['id']);
    }

    public function testLesTauxDeTvaSontTriesParTaux(): void
    {
        $response = self::$admin->get('/admin/taxes');
        $this->assertSame(200, $response['status']);

        $rates = array_map('floatval', array_column($response['body']['data']['taxes'], 'rate'));
        $this->assertNotEmpty($rates);
        $sorted = $rates;
        sort($sorted);
        $this->assertSame($sorted, $rates);
    }

    // ------------------------------------------------------------------ création

    public function testCreerUneCategoriePuisUneSousCategorieLesFaitApparaitreDansLArbre(): void
    {
        $category = self::$admin->post('/admin/categories', ['department_id' => self::$departmentId, 'name' => '  ' . $this->label('Bulbes') . '  ']);
        $this->assertSame(201, $category['status'], $category['raw']);
        $categoryId = (int) $category['body']['data']['id'];

        $sub = self::$admin->post('/admin/subcategories', ['category_id' => $categoryId, 'name' => $this->label('Tulipes')]);
        $this->assertSame(201, $sub['status'], $sub['raw']);

        $found = $this->findInTree((int) $sub['body']['data']['id']);
        $this->assertNotNull($found);
        $this->assertSame(self::$departmentId, $found['department']['id']);
        $this->assertSame($this->label('Bulbes'), $found['category']['name'], 'espaces retirés');
        $this->assertSame($this->label('Tulipes'), $found['subcategory']['name']);
    }

    public function testDefautActuelUneCategorieSansSousCategorieNApparaitPasDansLArbre(): void
    {
        // DÉFAUT ACTUEL, à corriger en N4-api-catalogue : l'arbre part des sous-catégories (jointure interne),
        // une catégorie vide est donc invisible dans l'admin.
        $id = (int) self::$admin->post('/admin/categories', ['department_id' => self::$departmentId, 'name' => $this->label('Vide')])['body']['data']['id'];

        $this->assertFalse($this->categoryInTree($id));
    }

    public function testDefautActuelUnNomEnDoubleEstAccepte(): void
    {
        // DÉFAUT ACTUEL, à corriger en N4-api-catalogue (attendu : 409)
        $body = ['department_id' => self::$departmentId, 'name' => $this->label('Doublon')];

        $this->assertSame(201, self::$admin->post('/admin/categories', $body)['status']);
        $this->assertSame(201, self::$admin->post('/admin/categories', $body)['status']);
    }

    public function testLesChampsObligatoiresSontVerifies(): void
    {
        $this->assertSame(400, self::$admin->post('/admin/categories', ['name' => $this->label('x')])['status']);
        $this->assertSame(400, self::$admin->post('/admin/categories', ['department_id' => self::$departmentId])['status']);
        $this->assertSame(400, self::$admin->post('/admin/categories', ['department_id' => self::$departmentId, 'name' => ''])['status']);
        $this->assertSame(400, self::$admin->post('/admin/categories', ['department_id' => self::$departmentId, 'name' => '   '])['status']);
        $this->assertSame(400, self::$admin->post('/admin/subcategories', ['name' => $this->label('x')])['status']);
        $this->assertSame(400, self::$admin->post('/admin/subcategories', ['category_id' => 1])['status']);
    }

    public function testUnParentInconnuEstRefuseSansDetailTechnique(): void
    {
        // La clé étrangère refuse l'insertion : réponse 500 générique (N4-api-catalogue : 400 « rayon introuvable »)
        $response = self::$admin->post('/admin/categories', ['department_id' => 999999999, 'name' => $this->label('Orpheline')]);

        $this->assertSame(500, $response['status']);
        $this->assertSame('Erreur lors de la création.', $response['body']['message']);
        $this->assertStringNotContainsString('SQLSTATE', $response['raw']);
    }
}
