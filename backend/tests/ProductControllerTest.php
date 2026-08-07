<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Controllers\ProductController;
use App\Services\ProductService;

class ProductControllerTest extends TestCase
{
    public function testAfficheUnProduitExistant(): void
    {
        $fauxProductService = $this->createStub(ProductService::class);
        $fauxProductService->method('getProductDetails')->willReturn([
            'success' => true,
            'code'    => 200,
            'data'    => ['id' => 42, 'product_name' => 'Aloe Vera'],
        ]);

        $controller = new ProductController(productService: $fauxProductService);

        ob_start();
        $controller->show(42);
        $sortie = ob_get_clean();

        $resultat = json_decode($sortie, true);

        $this->assertEquals('Aloe Vera', $resultat['data']['product_name']);
        $this->assertEquals(200, $resultat['status']);
    }
}
