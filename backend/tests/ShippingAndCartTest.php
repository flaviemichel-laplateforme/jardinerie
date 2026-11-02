<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Core\ShippingPolicy;
use App\Models\CartItemModel;

class ShippingAndCartTest extends TestCase
{
    // ------------------------------------------------------------------ ShippingPolicy

    public function testLaLivraisonCoute790SousLeSeuil(): void
    {
        $this->assertSame(790, ShippingPolicy::costCents(1));
        $this->assertSame(790, ShippingPolicy::costCents(2500));
        $this->assertSame(790, ShippingPolicy::costCents(4999)); // 49,99 € : encore payante
    }

    public function testLaLivraisonEstOfferteDes50Euros(): void
    {
        $this->assertSame(0, ShippingPolicy::costCents(5000)); // 50,00 € pile : offerte
        $this->assertSame(0, ShippingPolicy::costCents(5001));
        $this->assertSame(0, ShippingPolicy::costCents(120000));
    }

    public function testUnPanierVideNeCoutePasDeLivraison(): void
    {
        $this->assertSame(0, ShippingPolicy::costCents(0));
        $this->assertSame(0, ShippingPolicy::costCents(-100));
    }

    public function testLeSeuilNeSeTrompePasSurLesDecimaux(): void
    {
        // 0,1 + 0,2 ≠ 0,3 en nombres décimaux : le seuil et les montants se calculent donc en centimes entiers
        $this->assertSame(790, ShippingPolicy::cost(49.99) > 0 ? 790 : 0);
        $this->assertSame(0.0, ShippingPolicy::cost(50.0));
        $this->assertSame(7.9, ShippingPolicy::cost(49.99));
        $this->assertSame(7.9, ShippingPolicy::cost(0.1 + 0.2));
        $this->assertSame(0.0, ShippingPolicy::cost(24.99 + 25.01)); // somme décimale qui vaut 50 à un epsilon près
    }

    public function testLesEurosSontConvertisEnCentimesSansErreurDArrondi(): void
    {
        $this->assertSame(1999, ShippingPolicy::toCents(19.99));
        $this->assertSame(1010, ShippingPolicy::toCents(10.10));
        $this->assertSame(5789, ShippingPolicy::toCents(49.99 + 7.90));
        $this->assertSame(29, ShippingPolicy::toCents(0.29)); // 0.29 * 100 = 28.999999… sans arrondi
    }

    // ------------------------------------------------------------------ CartItemModel::normalize

    public function testUnPanierValideEstAccepte(): void
    {
        $result = CartItemModel::normalize([['product_id' => 3, 'quantity' => 2], ['product_id' => 7, 'quantity' => 1]]);

        $this->assertNull($result['error']);
        $this->assertSame([3 => 2, 7 => 1], $result['lines']);
    }

    public function testLesDoublonsSontFusionnes(): void
    {
        // Deux lignes du même produit ne doivent pas permettre de dépasser le stock en les comptant séparément
        $result = CartItemModel::normalize([['product_id' => 3, 'quantity' => 2], ['product_id' => 3, 'quantity' => 5]]);

        $this->assertSame([3 => 7], $result['lines']);
    }

    public function testLesNombresEnTexteSontAcceptesMaisPasLesAutresValeurs(): void
    {
        $this->assertSame([4 => 2], CartItemModel::normalize([['product_id' => '4', 'quantity' => '2']])['lines']);

        foreach ([
            [['product_id' => 'abc', 'quantity' => 1]],
            [['product_id' => 3, 'quantity' => 1.5]],
            [['product_id' => 3, 'quantity' => 0]],
            [['product_id' => 3, 'quantity' => -2]],
            [['product_id' => 0, 'quantity' => 1]],
            [['product_id' => 3]],
            [['quantity' => 1]],
            ['pas-une-ligne'],
            [null],
        ] as $bad) {
            $this->assertNotNull(CartItemModel::normalize($bad)['error'], json_encode($bad));
        }
    }

    public function testUnPanierVideOuQuiNEstPasUneListeEstRefuse(): void
    {
        $this->assertSame('Le panier est vide.', CartItemModel::normalize([])['error']);
        $this->assertSame('Le panier est vide.', CartItemModel::normalize(null)['error']);
        $this->assertSame('Le panier est vide.', CartItemModel::normalize('texte')['error']);
        $this->assertNotNull(CartItemModel::normalize(['a' => ['product_id' => 3, 'quantity' => 1]])['error'], 'un objet n\'est pas une liste');
    }

    public function testLesPlafondsDuPanierSontAppliques(): void
    {
        $twenty = array_map(fn($i) => ['product_id' => $i, 'quantity' => 1], range(1, CartItemModel::MAX_LINES));
        $this->assertNull(CartItemModel::normalize($twenty)['error'], '20 lignes : accepté');

        $twentyOne = array_map(fn($i) => ['product_id' => $i, 'quantity' => 1], range(1, CartItemModel::MAX_LINES + 1));
        $this->assertNotNull(CartItemModel::normalize($twentyOne)['error'], '21 lignes : refusé');

        $this->assertNull(CartItemModel::normalize([['product_id' => 1, 'quantity' => 99]])['error']);
        $this->assertNotNull(CartItemModel::normalize([['product_id' => 1, 'quantity' => 100]])['error']);
        // Le plafond s'applique APRÈS fusion des doublons
        $this->assertNotNull(CartItemModel::normalize([['product_id' => 1, 'quantity' => 60], ['product_id' => 1, 'quantity' => 60]])['error']);
    }

    public function testLaListeDesArticlesDeStripeResteSousLaLimiteDe500Caracteres(): void
    {
        // metadata.items = [{"pid":1234,"qty":99}, ...] : Stripe refuse une valeur de plus de 500 caractères
        $lines = array_map(fn($i) => ['pid' => 9000 + $i, 'qty' => CartItemModel::MAX_QUANTITY], range(1, CartItemModel::MAX_LINES));

        $this->assertLessThan(500, strlen(json_encode($lines)));
    }
}
