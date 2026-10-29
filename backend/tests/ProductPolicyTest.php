<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\ProductPolicy;

class ProductPolicyTest extends TestCase
{
    private function validProduct(array $override = []): array
    {
        return array_merge([
            'subcategory_id' => 3,
            'tax_id'         => 1,
            'name'           => 'Basilic Grand Vert',
            'price_tax_incl' => 4.90,
            'stock_quantity' => 25,
        ], $override);
    }

    // ---------------------------------------------------------------- Création

    public function testProduitValide(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(), true));
    }

    public function testChampsObligatoiresManquants(): void
    {
        $errors = ProductPolicy::validate([], true);

        $this->assertCount(4, $errors);
        $this->assertContains("Le champ 'name' est obligatoire.", $errors);
        $this->assertContains("Le champ 'price_tax_incl' est obligatoire.", $errors);
    }

    // --------------------------------------------------------------------- Nom

    public function testNomDeLaLongueurMaximaleEstAccepte(): void
    {
        $name = str_repeat('a', ProductPolicy::NAME_MAX_LENGTH);

        $this->assertSame([], ProductPolicy::validate($this->validProduct(['name' => $name]), true));
    }

    public function testNomTropLongEstRefuse(): void
    {
        $name   = str_repeat('a', ProductPolicy::NAME_MAX_LENGTH + 1);
        $errors = ProductPolicy::validate($this->validProduct(['name' => $name]), true);

        $this->assertSame(["Le nom ne peut pas dépasser 100 caractères."], $errors);
    }

    public function testLesAccentsComptentPourUnSeulCaractere(): void
    {
        // 100 « é » = 100 caractères (mais 200 octets : strlen() l'aurait refusé à tort)
        $name = str_repeat('é', ProductPolicy::NAME_MAX_LENGTH);

        $this->assertSame([], ProductPolicy::validate($this->validProduct(['name' => $name]), true));
    }

    public function testLesEspacesAutourDuNomNeComptentPas(): void
    {
        $name = '  ' . str_repeat('a', ProductPolicy::NAME_MAX_LENGTH) . '  ';

        $this->assertSame([], ProductPolicy::validate($this->validProduct(['name' => $name]), true));
    }

    public function testNomVideEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['name' => '   ']), true);

        $this->assertSame(["Le champ 'name' est obligatoire."], $errors);
    }

    // ------------------------------------------------------------- Prix de vente

    public function testPrixLimitesAcceptes(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['price_tax_incl' => 0.01]), true));
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['price_tax_incl' => 9999.99]), true));
    }

    public function testPrixNulEstRefuseAvecUnMessageClair(): void
    {
        // Avant : empty(0) le faisait passer pour « champ manquant ». Un 0 est une valeur, à refuser comme telle.
        $errors = ProductPolicy::validate($this->validProduct(['price_tax_incl' => 0]), true);

        $this->assertSame(["Le prix de vente doit être compris entre 0,01 € et 9 999,99 €."], $errors);
    }

    public function testPrixNegatifEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['price_tax_incl' => -5]), true);

        $this->assertCount(1, $errors);
        $this->assertStringContainsString('compris entre', $errors[0]);
    }

    public function testPrixTropEleveEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['price_tax_incl' => 10000]), true);

        $this->assertSame(["Le prix de vente doit être compris entre 0,01 € et 9 999,99 €."], $errors);
    }

    public function testPrixNonNumeriqueEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['price_tax_incl' => 'abc']), true);

        $this->assertSame(["Le prix de vente doit être un nombre."], $errors);
    }

    // ------------------------------------------------------------- Prix d'achat

    public function testPrixAchatFacultatif(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['purchase_price_tax_incl' => null]), true));
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['purchase_price_tax_incl' => 0]), true));
    }

    public function testPrixAchatNegatifOuTropEleveEstRefuse(): void
    {
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['purchase_price_tax_incl' => -1]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['purchase_price_tax_incl' => 10000]), true));
    }

    // -------------------------------------------------------------------- Stock

    public function testStockLimitesAcceptes(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['stock_quantity' => 0]), true));
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['stock_quantity' => 9999]), true));
    }

    public function testStockNegatifOuTropEleveEstRefuse(): void
    {
        $this->assertSame(["Le stock doit être compris entre 0 et 9 999."], ProductPolicy::validate($this->validProduct(['stock_quantity' => -1]), true));
        $this->assertSame(["Le stock doit être compris entre 0 et 9 999."], ProductPolicy::validate($this->validProduct(['stock_quantity' => 10000]), true));
    }

    public function testStockDecimalEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['stock_quantity' => 5.5]), true);

        $this->assertSame(["Le stock doit être un nombre entier."], $errors);
    }

    // ------------------------------------------------------------ Modification

    public function testModificationPartielleValide(): void
    {
        // Un PATCH qui ne change que le stock : les champs absents ne sont pas exigés
        $this->assertSame([], ProductPolicy::validate(['stock_quantity' => 12], false));
    }

    public function testModificationAvecDesValeursHorsLimitesEstRefusee(): void
    {
        // Avant, la modification n'était pas validée du tout
        $errors = ProductPolicy::validate([
            'name'           => str_repeat('a', 101),
            'price_tax_incl' => -3,
            'stock_quantity' => 100000,
        ], false);

        $this->assertCount(3, $errors);
    }

    public function testModificationNeRendPasLeNomOuLePrixVides(): void
    {
        $errors = ProductPolicy::validate(['name' => '', 'price_tax_incl' => ''], false);

        $this->assertSame(["Le nom ne peut pas être vide.", "Le prix de vente ne peut pas être vide."], $errors);
    }

    // ------------------------------------------------- Référence, conditionnement, poids

    public function testChampsLogistiquesFacultatifsPeuventEtreVidesOuAbsents(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(), true));
        $this->assertSame([], ProductPolicy::validate($this->validProduct([
            'sku' => '', 'packaging_type' => '', 'pot_diameter_cm' => '', 'volume_l' => null, 'weight_g' => '',
        ]), true));
    }

    public function testChampsLogistiquesValides(): void
    {
        $data = $this->validProduct([
            'sku' => 'JAR-0042', 'packaging_type' => 'Pot', 'pot_diameter_cm' => 17, 'volume_l' => '2.5', 'weight_g' => 1500,
        ]);

        $this->assertSame([], ProductPolicy::validate($data, true));
    }

    public function testSkuAvecEspaceOuCaractereInterditEstRefuse(): void
    {
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['sku' => 'JAR 0042']), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['sku' => "JAR-<script>"]), true));
    }

    public function testSkuTropLongEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['sku' => str_repeat('A', ProductPolicy::SKU_MAX_LENGTH + 1)]), true);

        $this->assertSame(["La référence (SKU) ne peut pas dépasser 50 caractères."], $errors);
    }

    public function testConditionnementHorsListeEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['packaging_type' => 'Carton']), true);

        $this->assertSame(["Le type de conditionnement n'est pas une valeur autorisée."], $errors);
    }

    public function testDimensionsEtPoidsHorsLimitesSontRefuses(): void
    {
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['pot_diameter_cm' => 0]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['pot_diameter_cm' => 201]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['pot_diameter_cm' => 12.5]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['volume_l' => 0]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['volume_l' => 1001]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['volume_l' => 'beaucoup']), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['weight_g' => -5]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['weight_g' => ProductPolicy::WEIGHT_MAX_G + 1]), true));
    }

    public function testUnBooleenNEstPasUnNombre(): void
    {
        // filter_var(true, FILTER_VALIDATE_INT) donnerait 1 : on le refuse explicitement
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['weight_g' => true]), true));
    }

    // ---------------------------------------------------------------- Fiche botanique

    private function validPlant(array $override = []): array
    {
        return array_merge([
            'common_name'         => 'Lavande',
            'family'              => 'Lamiaceae',
            'foliage'             => 'Evergreen',
            'drought_tolerance'   => 'High',
            'difficulty'          => 'Beginner',
            'height_max_cm'       => 60,
            'hardiness_min_c'     => -15,
            'bloom_start_month'   => 6,
            'bloom_end_month'     => 8,
            'harvest_start_month' => 7,
            'harvest_end_month'   => 8,
            'care_pruning'        => 'Taillez court après la floraison.',
        ], $override);
    }

    public function testFicheBotaniqueValide(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant()]), true));
    }

    public function testFicheBotaniqueVideOuAbsenteEstAcceptee(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['plant' => []]), true));
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['plant' => null]), true));
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant([
            'family' => '', 'foliage' => '', 'height_max_cm' => '', 'bloom_start_month' => '', 'bloom_end_month' => '',
        ])]), true));
    }

    public function testFicheBotaniqueQuiNEstPasUnTableauEstRefusee(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['plant' => 'lavande']), true);

        $this->assertSame(["Les données botaniques sont invalides."], $errors);
    }

    public function testValeursBotaniquesHorsListeSontRefusees(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant([
            'foliage' => 'Fleuri', 'drought_tolerance' => 'Extrême', 'difficulty' => 'Facile',
        ])]), true);

        $this->assertCount(3, $errors);
    }

    public function testMoisHorsLimitesSontRefuses(): void
    {
        foreach ([0, 13, -1, 'mars'] as $month) {
            $errors = ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant(['bloom_start_month' => $month])]), true);
            $this->assertSame(["La période de floraison : les mois doivent être compris entre 1 (janvier) et 12 (décembre)."], $errors, (string) $month);
        }
    }

    public function testUnSeulMoisRenseigneEstRefuse(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant(['harvest_end_month' => ''])]), true);

        $this->assertSame(["La période de récolte : indiquez le mois de début et le mois de fin."], $errors);
    }

    public function testUnePeriodeSurDeuxAnneesEstAcceptee(): void
    {
        // Décembre → mars : le début est après la fin, c'est normal
        $plant = $this->validPlant(['bloom_start_month' => 12, 'bloom_end_month' => 3]);

        $this->assertSame([], ProductPolicy::validate($this->validProduct(['plant' => $plant]), true));
    }

    public function testHauteurEtRusticiteHorsLimitesSontRefusees(): void
    {
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant(['height_max_cm' => 0])]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant(['height_max_cm' => 3001])]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant(['hardiness_min_c' => -61])]), true));
        $this->assertCount(1, ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant(['hardiness_min_c' => 41])]), true));
    }

    public function testRusticiteNegativeEstAcceptee(): void
    {
        $this->assertSame([], ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant(['hardiness_min_c' => -60])]), true));
    }

    public function testTextesBotaniquesTropLongsSontRefuses(): void
    {
        $errors = ProductPolicy::validate($this->validProduct(['plant' => $this->validPlant([
            'family'         => str_repeat('a', ProductPolicy::SHORT_TEXT_MAX_LENGTH + 1),
            'care_repotting' => str_repeat('a', ProductPolicy::CARE_TEXT_MAX_LENGTH + 1),
        ])]), true);

        $this->assertSame([
            "La famille botanique ne peut pas dépasser 100 caractères.",
            "Le conseil de rempotage ne peut pas dépasser 2000 caractères.",
        ], $errors);
    }

    public function testLesAccentsDesTextesBotaniquesComptentPourUnCaractere(): void
    {
        $plant = $this->validPlant(['care_pruning' => str_repeat('é', ProductPolicy::CARE_TEXT_MAX_LENGTH)]);

        $this->assertSame([], ProductPolicy::validate($this->validProduct(['plant' => $plant]), true));
    }

    public function testModificationVerifieLesNouveauxChampsPresentsSeulement(): void
    {
        $this->assertSame([], ProductPolicy::validate(['weight_g' => 500], false));
        $this->assertCount(1, ProductPolicy::validate(['weight_g' => 0], false));
        $this->assertCount(1, ProductPolicy::validate(['plant' => ['difficulty' => 'Facile']], false));
    }
}
