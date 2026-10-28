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
}
