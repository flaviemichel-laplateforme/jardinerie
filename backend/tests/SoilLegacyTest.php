<?php

namespace Tests;

use App\Core\CatalogNamePolicy;
use App\Core\SoilLegacy;
use PHPUnit\Framework\TestCase;

/**
 * Correspondance anciens critères « Sol … » <-> nature et pH du sol (écriture double jusqu'à la bascule),
 * et règle des noms du classement.
 */
class SoilLegacyTest extends TestCase
{
    public function testLesSeptAnciensCriteresSontReconnus(): void
    {
        $this->assertCount(7, SoilLegacy::criterionNames());
        $this->assertTrue(SoilLegacy::isLegacyCriterion('Sol humifère'));
        $this->assertFalse(SoilLegacy::isLegacyCriterion('Comestible'));
        $this->assertFalse(SoilLegacy::isLegacyCriterion('sol humifère'), 'correspondance exacte, comme en base');
    }

    public function testSolsVersAnciensCriteres(): void
    {
        $this->assertSame(['Sol argileux', 'Sol acide'], SoilLegacy::criteriaFor(['Argileux'], ['Acide']));
        $this->assertSame([], SoilLegacy::criteriaFor(['Renommé par l\'admin'], []), 'une valeur renommée n\'a plus d\'ancien critère');
    }

    public function testCalcaireEtAlcalinDonnentUnSeulAncienCritere(): void
    {
        $this->assertSame(['Sol calcaire'], SoilLegacy::criteriaFor(['Calcaire'], ['Alcalin']));
    }

    public function testAnciensCriteresVersSols(): void
    {
        $this->assertSame(
            ['types' => ['Sableux', 'Calcaire'], 'ph' => ['Neutre', 'Alcalin']],
            SoilLegacy::soilsFrom(['Sol sableux', 'Sol calcaire', 'Sol neutre', 'Comestible'])
        );
        $this->assertSame(['types' => [], 'ph' => []], SoilLegacy::soilsFrom([]));
    }

    public function testLAllerRetourEstStable(): void
    {
        // Ce que l'ancien admin enverrait après relecture redonne les mêmes sols
        $soils = ['types' => ['Argileux', 'Drainé'], 'ph' => ['Acide']];

        $this->assertSame($soils, SoilLegacy::soilsFrom(SoilLegacy::criteriaFor($soils['types'], $soils['ph'])));
    }

    // ------------------------------------------------------------------ noms du classement

    public function testUnNomDuClassementEstUnTexteDeUnACentCaracteres(): void
    {
        $this->assertNull(CatalogNamePolicy::validate('Bulbes'));
        $this->assertNull(CatalogNamePolicy::validate(str_repeat('é', 100)), 'les accents comptent pour un caractère');
        $this->assertNotNull(CatalogNamePolicy::validate(str_repeat('a', 101)));
        $this->assertNotNull(CatalogNamePolicy::validate('   '));
        $this->assertNotNull(CatalogNamePolicy::validate(null));
        $this->assertNotNull(CatalogNamePolicy::validate(42));
        $this->assertNotNull(CatalogNamePolicy::validate(['Bulbes']));
    }

    public function testLeNomEstNettoye(): void
    {
        $this->assertSame('Plantes vertes', CatalogNamePolicy::clean("  Plantes \t\n  vertes "));
    }
}
