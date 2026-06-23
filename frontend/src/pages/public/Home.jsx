import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi'; 
import ProductRow from '../../components/catalog/ProductRow';
import Spinner from '../../components/ui/Spinner';
import SplitSection from '../../components/home/SplitSection';


export default function Home() {
  const { data: products, loading, error, request } = useApi();

  // Leçon d'architecture : Au montage de la page, on va chercher quelques produits
  useEffect(() => {
    const fetchHomeProducts = async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      // On récupère le catalogue complet pour l'exemple
      await request(`${baseUrl}/api/products`);
    };

    fetchHomeProducts();
  }, [request]);

  return (
    <main className="min-h-screen bg-white">
      
      {/* 1. HERO BANNER (La grande bannière du haut) */}
      <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* Conteneur avec un ratio pour simuler la zone grise de votre maquette */}
        <div className="relative flex h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-[20px] bg-gray-100 md:h-[400px]">
          
          {/* L'image de fond (à remplacer par votre vraie image) */}
          <img 
            src="/src/assets/img/fond.png" 
            alt="Promotion du moment" 
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-jardinerie-text/20"></div> {/* Voile pour la lisibilité */}

          {/* Le contenu du Hero (Bouton centré en bas comme sur le wireframe) */}
          <div className="absolute bottom-8 z-10">
            <Link 
              to="/vegetaux" 
              className="rounded-full bg-black/50 px-8 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-jardinerie-primary hover:scale-105"
            >
              Voir les offres du moment
            </Link>
          </div>
        </div>
      </div>

      {/* Barre de séparation subtile comme sur le wireframe */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <hr className="border-gray-200" />
      </div>

      {/* 2. LES SECTIONS DE PRODUITS */}
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        
        {/* Gestion du chargement */}
        {loading && <Spinner message="Préparation de votre jardin..." />}
        {error && <p className="mt-8 text-center text-red-500">{error}</p>}

        {/* DÉMONSTRATION DU "DRY" (Don't Repeat Yourself) :
          On appelle 3 fois le même composant 'ProductRow', en lui passant 
          simplement un titre différent et un "morceau" (slice) différent du tableau de produits !
        */}
        {products && products.length >= 1 && (
          <>
            <ProductRow 
              title="Sélection du moment !" 
              products={products.slice(0, 3)} 
            />
            
            <ProductRow 
              title="Nouveauté !" 
              products={products.slice(3, 6)} 
            />
            
            <ProductRow 
              title="Selection aromatique !" 
              products={products.slice(6, 9)} 
            />
          </>
          
        )}
            {/* Barre de séparation subtile comme sur le wireframe */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <hr className="border-gray-200" />
      </div>

      </div>

       <SplitSection />
       
    </main>
  );
}