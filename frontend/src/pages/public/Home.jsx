import { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { productService } from '../../services/productService';
import HeroBanner from '../../components/ui/HeroBanner';
import SplitSection from '../../components/catalog/SplitSection'; 
import ProductRow from '../../components/catalog/ProductRow'; 
import Spinner from '../../components/ui/Spinner';

// Catégorie "Aromatiques" (voir database/seed.sql)
const AROMATIC_CATEGORY_ID = '7';

export default function Home() {
  const { data: products, loading, error, request } = useApi();
  const { data: aromaticProducts, request: requestAromatic } = useApi();

  useEffect(() => {
    const fetchHomeProducts = async () => {
      await request(productService.buildHomeUrl());
    };
    fetchHomeProducts();
  }, [request]);

  useEffect(() => {
    const fetchAromaticProducts = async () => {
      const params = new URLSearchParams({ categories: AROMATIC_CATEGORY_ID, limit: '5' });
      await requestAromatic(productService.buildCatalogUrl(params));
    };
    fetchAromaticProducts();
  }, [requestAromatic]);

  return (
    <main className="min-h-screen bg-white">
      
      {/* HERO BANNER */}
      <HeroBanner 
        altText="Promotion du moment"
        buttonText="Voir les offres du moment"
        buttonLink="/vegetaux"
      />

      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <hr className="border-gray-200" />
      </div>

      
      {/* SECTIONS DE PRODUITS */}
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {loading && <Spinner message="Préparation de votre jardin..." />}
        {error && <p className="mt-8 text-center text-red-500">{error}</p>}

        {products && products.length >= 1 && (
          <>
            <ProductRow title="Sélection du moment !" products={products.slice(0,5)} />
            <ProductRow title="Nouveauté !" products={products.slice(5, 10)} />
          </>
        )}

        <ProductRow title="Sélection aromatique !" products={aromaticProducts ?? []} />

        {products && products.length >= 1 && (
          <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
            <hr className="border-gray-200" />
          </div>
        )}
      </div>

      

      {/* SECTION EXPERTISE */}
      <SplitSection />

    </main>
  );
}