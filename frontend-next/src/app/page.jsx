import { cacheLife } from 'next/cache';
import { productService } from '../services/productService';
import HeroBanner from '../components/ui/HeroBanner';
import SplitSection from '../components/catalog/SplitSection';
import ProductRow from '../components/catalog/ProductRow';

// Catégorie "Aromatiques"
const AROMATIC_CATEGORY_ID = '7';

export const metadata = {
  alternates: { canonical: '/' },
};

/**
 * Produits de l'accueil, récupérés sur le SERVEUR et mis en cache (rafraîchis au plus toutes les minutes).
 * Si l'API est injoignable (par exemple pendant le build), la page s'affiche quand même, sans ces rangées.
 */
async function getProducts(params) {
  'use cache';
  cacheLife('minutes');

  try {
    const response = await fetch(productService.buildCatalogUrl(new URLSearchParams(params)));
    const result = await response.json();
    return response.ok && result.success ? result.data : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  // Les deux appels partent en même temps
  const [products, aromaticProducts] = await Promise.all([
    getProducts({ limit: '10' }),
    getProducts({ categories: AROMATIC_CATEGORY_ID, limit: '5' }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Le titre principal de la page, lu par Google et par les lecteurs d'écran (la bannière n'est qu'une image) */}
      <h1 className="sr-only">La Jardinerie : végétaux et articles de jardinage en ligne</h1>

      <HeroBanner
        altText="Promotion du moment"
        buttonText="Voir les offres du moment"
        buttonLink="/vegetaux"
      />

      <div className="mx-auto mt-8 max-w-[1600px] px-4 sm:px-6">
        <hr className="border-gray-200" />
      </div>

      {/* SECTIONS DE PRODUITS */}
      <div className="mx-auto max-w-[1600px] px-4 pb-20 sm:px-6">
        {products.length >= 1 && (
          <>
            <ProductRow title="Sélection du moment !" products={products.slice(0, 5)} />
            <ProductRow title="Nouveauté !" products={products.slice(5, 10)} />
          </>
        )}
        <ProductRow title="Sélection aromatique !" products={aromaticProducts} />
        {products.length >= 1 && (
          <div className="mx-auto mt-8 max-w-[1600px] px-4 sm:px-6">
            <hr className="border-gray-200" />
          </div>
        )}
      </div>

      {/* SECTION EXPERTISE */}
      <SplitSection
        buttonText="Nous contacter pour un conseil"
        buttonLink="/contact"
      />
    </div>
  );
}
