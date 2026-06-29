// src/pages/public/Home.jsx
import { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { productService } from '../../services/productService';
import HeroBanner from '../../components/ui/HeroBanner';
import SplitSection from '../../components/catalog/SplitSection'; 
import ProductRow from '../../components/catalog/ProductRow'; 
import Spinner from '../../components/ui/Spinner';

export default function Home() {
  const { data: products, loading, error, request } = useApi();

  useEffect(() => {
    const fetchHomeProducts = async () => {
      await request(productService.buildHomeUrl());
    };
    fetchHomeProducts();
  }, [request]);

  return (
    <main className="min-h-screen bg-white">
      
      {/* 1. HERO BANNER : Appel du composant avec ses paramètres (props) */}
      <HeroBanner 
        imageSrc="/src/assets/img/fond.png"
        altText="Promotion du moment"
        buttonText="Voir les offres du moment"
        buttonLink="/vegetaux"
      />

      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <hr className="border-gray-200" />
      </div>

      
      {/* 3. LES SECTIONS DE PRODUITS */}
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {loading && <Spinner message="Préparation de votre jardin..." />}
        {error && <p className="mt-8 text-center text-red-500">{error}</p>}

        {products && products.length >= 1 && (
          <>
            <ProductRow title="Sélection du moment !" products={products.slice(0, 3)} />
            <ProductRow title="Nouveauté !" products={products.slice(3, 6)} />
            <ProductRow title="Sélection aromatique !" products={products.slice(0, 3)} />
            
            <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <hr className="border-gray-200" />
      </div>
          </>
        )}
      </div>

      

      {/* 2. SECTION EXPERTISE */}
      <SplitSection />

    </main>
  );
}