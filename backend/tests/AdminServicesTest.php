<?php

namespace Tests;

use App\Models\AdminCategoryModel;
use App\Models\AdminKpiModel;
use App\Models\AdminOrderModel;
use App\Services\AdminCategoryService;
use App\Services\AdminKpiService;
use App\Services\AdminOrderService;
use PHPUnit\Framework\TestCase;

/**
 * Règles des services admin (commandes, KPI, catégories) vérifiées avec de faux modèles : sans base de données, en quelques millisecondes.
 */
class AdminServicesTest extends TestCase
{

    // ------------------------------------------------------------------ commandes

    public function testLaPaginationDesCommandesEstCalculeeEtBornee(): void
    {
        $model = $this->createMock(AdminOrderModel::class);
        $model->method('countOrders')->willReturn(45);
        // page 3 de 20 -> on saute 40 commandes
        $model->expects($this->once())->method('getOrdersPaginated')->with('paid', 20, 40)->willReturn([]);

        $pagination = (new AdminOrderService($model))->getOrders('paid', 3, 20)['data']['pagination'];

        $this->assertSame(['current_page' => 3, 'per_page' => 20, 'total_items' => 45, 'total_pages' => 3, 'has_next' => false, 'has_prev' => true], $pagination);
    }

    public function testSansCommandeIlYAQuandMemeUnePage(): void
    {
        $model = $this->createStub(AdminOrderModel::class);
        $model->method('countOrders')->willReturn(0);
        $model->method('getOrdersPaginated')->willReturn([]);

        $this->assertSame(1, (new AdminOrderService($model))->getOrders(null)['data']['pagination']['total_pages']);
    }

    public function testUnFiltreDeStatutInconnuDevientTous(): void
    {
        $model = $this->createMock(AdminOrderModel::class);
        $model->expects($this->once())->method('countOrders')->with('all')->willReturn(0);
        $model->method('getOrdersPaginated')->willReturn([]);

        (new AdminOrderService($model))->getOrders("paid' OR 1=1 --");
    }

    public function testUnStatutInvalideNEstJamaisEcrit(): void
    {
        $model = $this->createMock(AdminOrderModel::class);
        $model->expects($this->never())->method('updateStatus');

        $this->assertSame(400, (new AdminOrderService($model))->updateStatus(1, 'refunded')['code']);
    }

    public function testUneCommandeInconnueNEstPasModifiee(): void
    {
        $model = $this->createMock(AdminOrderModel::class);
        $model->method('findById')->willReturn(null);
        $model->expects($this->never())->method('updateStatus');

        $this->assertSame(404, (new AdminOrderService($model))->updateStatus(1, 'paid')['code']);
    }

    public function testUneErreurDeBaseALaMiseAJourDonneUne500Generique(): void
    {
        $model = $this->createStub(AdminOrderModel::class);
        $model->method('findById')->willReturn(['id' => 1, 'status' => 'paid']);
        $model->method('updateStatus')->willThrowException(new \PDOException('SQLSTATE secret'));

        $result = (new AdminOrderService($model))->updateStatus(1, 'shipped');

        $this->assertSame(500, $result['code']);
        $this->assertStringNotContainsString('SQLSTATE', $result['message']);
    }

    // ------------------------------------------------------------------ KPI

    public function testLesTotauxDesVentesSontAdditionnesEtArrondisAuCentime(): void
    {
        $model = $this->createStub(AdminKpiModel::class);
        $model->method('getSalesBreakdown')->willReturn([
            ['label' => '2026-11-01', 'total' => '10.10', 'order_count' => '1'],
            ['label' => '2026-11-02', 'total' => '20.20', 'order_count' => '2'],
        ]);

        $data = (new AdminKpiService($model))->getSalesData('week')['data'];

        $this->assertSame(30.3, $data['total_sales'], '10,10 + 20,20 sans erreur d\'arrondi des nombres à virgule');
        $this->assertSame(3, $data['total_orders']);
        $this->assertSame(10.1, $data['breakdown'][0]['total'], 'converti en nombre');
    }

    public function testUnePeriodeInconnueEstRemplaceeParLeMoisAvantLaRequete(): void
    {
        $model = $this->createMock(AdminKpiModel::class);
        $model->expects($this->once())->method('getSalesBreakdown')->with('month')->willReturn([]);

        $data = (new AdminKpiService($model))->getSalesData('; DROP TABLE orders')['data'];

        $this->assertSame(0.0, $data['total_sales']);
    }

    // ------------------------------------------------------------------ catégories

    public function testUnNomDeCategorieVideEstRefuseSansEcrire(): void
    {
        $model = $this->createMock(AdminCategoryModel::class);
        $model->method('findDepartment')->willReturn(['id' => 1, 'name' => 'Végétaux', 'has_plant_sheet' => 1]);
        $model->method('findCategory')->willReturn(['id' => 1, 'department_id' => 1, 'name' => 'Plantes']);
        $model->expects($this->never())->method('createCategory');
        $model->expects($this->never())->method('createSubcategory');

        $service = new AdminCategoryService($model);
        $this->assertSame('Le nom est obligatoire.', $service->createCategory(1, '   ')['message']);
        $this->assertSame('Le nom est obligatoire.', $service->createSubcategory(1, '')['message']);
    }

    public function testLaCreationRenvoieLIdentifiant(): void
    {
        $model = $this->createStub(AdminCategoryModel::class);
        $model->method('findDepartment')->willReturn(['id' => 1, 'name' => 'Végétaux', 'has_plant_sheet' => 1]);
        $model->method('categoryNameTaken')->willReturn(false);
        $model->method('createCategory')->willReturn(42);

        $result = (new AdminCategoryService($model))->createCategory(1, 'Bulbes');

        $this->assertSame(201, $result['code']);
        $this->assertSame(42, $result['data']['id']);
    }

    public function testLeNomEnregistreEstNettoye(): void
    {
        $model = $this->createMock(AdminCategoryModel::class);
        $model->method('findDepartment')->willReturn(['id' => 1, 'name' => 'Végétaux', 'has_plant_sheet' => 1]);
        $model->method('categoryNameTaken')->willReturn(false);
        $model->expects($this->once())->method('createCategory')->with(1, 'Plantes vertes')->willReturn(7);

        (new AdminCategoryService($model))->createCategory('1', "  Plantes \t  vertes ");
    }

    public function testUnRayonInconnuEstRefuseAvantLEcriture(): void
    {
        $model = $this->createMock(AdminCategoryModel::class);
        $model->method('findDepartment')->willReturn(null);
        $model->expects($this->never())->method('createCategory');

        $this->assertSame(400, (new AdminCategoryService($model))->createCategory(99, 'Bulbes')['code']);
        $this->assertSame(400, (new AdminCategoryService($model))->createCategory(true, 'Bulbes')['code'], 'un booléen n\'est pas un identifiant');
    }

    public function testLesErreursDeLectureDuCatalogueDonnentUne500Generique(): void
    {
        $model = $this->createStub(AdminCategoryModel::class);
        $model->method('getTree')->willThrowException(new \PDOException('SQLSTATE secret'));
        $model->method('getTaxes')->willThrowException(new \PDOException('SQLSTATE secret'));

        $service = new AdminCategoryService($model);
        $this->assertSame(500, $service->getTree()['code']);
        $this->assertSame(500, $service->getTaxes()['code']);
    }
}
