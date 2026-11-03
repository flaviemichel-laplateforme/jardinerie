<?php

namespace Tests;

use PHPUnit\Framework\Attributes\Group;
use Tests\Support\AdminApiTestCase;

/**
 * API admin des listes « nature du sol » et « pH du sol » : lecture, ajout, renommage, suppression refusée tant qu'une plante l'utilise.
 */
#[Group('integration')]
class AdminSoilApiTest extends AdminApiTestCase
{
    public static function tearDownAfterClass(): void
    {
        parent::tearDownAfterClass();

        foreach (['soil_types', 'soil_ph'] as $table) {
            self::$db->prepare("DELETE FROM $table WHERE name LIKE ?")->execute(['ZZ ' . self::$prefix . '%']);
        }
    }

    private function label(string $suffix): string
    {
        return 'ZZ ' . self::$prefix . ' ' . $suffix;
    }

    /** @return array<int, array> éléments de la liste, par identifiant */
    private function items(string $key): array
    {
        return array_column(self::$admin->get('/admin/soils')['body']['data'][$key], null, 'id');
    }

    public function testLesDeuxListesSontRenvoyeesAvecLeNombreDePlantes(): void
    {
        $data = self::$admin->get('/admin/soils')['body']['data'];

        $this->assertContains('Argileux', array_column($data['soil_types'], 'name'));
        $this->assertContains('Alcalin', array_column($data['soil_ph'], 'name'));
        $this->assertIsInt($data['soil_types'][0]['plant_count']);
    }

    public function testAjouterRenommerSupprimerUneNatureDeSol(): void
    {
        $created = self::$admin->post('/admin/soil-types', ['name' => '  ' . $this->label('Limoneux') . ' ']);
        $this->assertSame(201, $created['status'], $created['raw']);
        $id = (int) $created['body']['data']['id'];
        $this->assertSame($this->label('Limoneux'), $this->items('soil_types')[$id]['name']);

        $this->assertSame(200, self::$admin->patch("/admin/soil-types/$id", ['name' => $this->label('Limoneux frais')])['status']);
        $this->assertSame($this->label('Limoneux frais'), $this->items('soil_types')[$id]['name']);

        $this->assertSame(200, self::$admin->delete("/admin/soil-types/$id")['status']);
        $this->assertArrayNotHasKey($id, $this->items('soil_types'));
    }

    public function testLesDeuxListesSontIndependantes(): void
    {
        $name = $this->label('Commun');

        $this->assertSame(201, self::$admin->post('/admin/soil-types', ['name' => $name])['status']);
        $this->assertSame(201, self::$admin->post('/admin/soil-ph', ['name' => $name])['status'], 'même nom permis dans l\'autre liste');
        $this->assertSame(409, self::$admin->post('/admin/soil-ph', ['name' => strtolower($name)])['status'], 'mais pas deux fois dans la même');
    }

    public function testUneValeurUtiliseeParUnePlanteNePeutPasEtreSupprimee(): void
    {
        $id = (int) self::$admin->post('/admin/soil-ph', ['name' => $this->label('Très acide')])['body']['data']['id'];
        $product = self::$admin->post('/admin/products', [
            'subcategory_id' => (int) self::$db->query('SELECT s.id FROM subcategories s JOIN categories c ON c.id = s.category_id JOIN departments d ON d.id = c.department_id WHERE d.has_plant_sheet = 1 LIMIT 1')->fetchColumn(),
            'tax_id'         => (int) self::$db->query('SELECT id FROM taxes LIMIT 1')->fetchColumn(),
            'name'           => 'ZZ sol utilisé',
            'price_tax_incl' => 5,
            'sku'            => strtoupper(self::$prefix . '-SOL'),
            'plant'          => ['soil_ph_ids' => [$id]],
        ]);
        $this->assertSame(201, $product['status'], $product['raw']);

        $response = self::$admin->delete("/admin/soil-ph/$id");

        $this->assertSame(409, $response['status']);
        $this->assertSame(1, $response['body']['data']['plant_count']);
        $this->assertSame(1, $this->items('soil_ph')[$id]['plant_count']);
    }

    public function testLesRequetesInvalidesSontRefusees(): void
    {
        $this->assertSame(400, self::$admin->post('/admin/soil-types', ['name' => ''])['status']);
        $this->assertSame(400, self::$admin->post('/admin/soil-types', ['name' => str_repeat('a', 101)])['status']);
        $this->assertSame(400, self::$admin->post('/admin/soil-types', [])['status']);
        $this->assertSame(409, self::$admin->post('/admin/soil-types', ['name' => 'argileux'])['status'], 'existe déjà (Argileux)');
        $this->assertSame(404, self::$admin->patch('/admin/soil-types/999999999', ['name' => 'x'])['status']);
        $this->assertSame(404, self::$admin->delete('/admin/soil-ph/999999999')['status']);
    }

    public function testLaSuppressionEstJournalisee(): void
    {
        $id = (int) self::$admin->post('/admin/soil-types', ['name' => $this->label('Éphémère')])['body']['data']['id'];

        self::$admin->delete("/admin/soil-types/$id");

        $stmt = self::$db->prepare("SELECT details FROM security_events WHERE event = 'category_deleted' AND user_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([self::$adminUser['id']]);
        $details = json_decode((string) $stmt->fetchColumn(), true);
        $this->assertSame(['type' => 'soil_type', 'id' => $id, 'name' => $this->label('Éphémère')], $details);
    }
}
