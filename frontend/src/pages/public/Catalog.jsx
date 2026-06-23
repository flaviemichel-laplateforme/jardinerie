import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Spinner from '../../components/ui/Spinner';
import ProductCard from '../../components/catalog/ProductCard';
import FilterSidebar from '../../components/catalog/FilterSidebar';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products, loading, error, request } = useApi();

  // Lecture des paramètres depuis l'URL au chargement et à chaque modification
  const searchQuery = searchParams.get('search') || '';
  const activeCategories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
  const activeExpositions = searchParams.get('expositions') ? searchParams.get('expositions').split(',') : [];
  const activeWater = searchParams.get('water') ? searchParams.get('water').split(',') : [];
  const activePrice = {
    min: searchParams.get('price_min') || '',
    max: searchParams.get('price_max') || ''
  };

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchProducts = async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      // searchParams.toString() formate parfaitement l'URL (ex: search=ficus&categories=1)
      const queryString = searchParams.toString();
      const url = `${baseUrl}/api/products${queryString ? `?${queryString}` : ''}`;

      await request(url, { signal: controller.signal });
    };

    fetchProducts();

    return () => controller.abort();
  }, [searchParams, request]); // Relance l'API à chaque modification de l'URL

  // Fonction pour mettre à jour l'URL sans recharger la page
  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams); // Copie des paramètres actuels
    
    if (newFilters.categories && newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    } else {
      params.delete('categories');
    }

    if (newFilters.expositions && newFilters.expositions.length > 0) {
      params.set('expositions', newFilters.expositions.join(','));
    } else {
      params.delete('expositions');
    }

    if (newFilters.water && newFilters.water.length > 0) {
      params.set('water', newFilters.water.join(','));
    } else {
      params.delete('water');
    }

    if (newFilters.price && (newFilters.price.min !== '' || newFilters.price.max !== '')) {
      if (newFilters.price.min !== '') params.set('price_min', newFilters.price.min);
      else params.delete('price_min');

      if (newFilters.price.max !== '') params.set('price_max', newFilters.price.max);
      else params.delete('price_max');
    } else {
      params.delete('price_min');
      params.delete('price_max');
    }

    setSearchParams(params); // Met à jour l'URL
  };

  const resetFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery); // On conserve juste la barre de recherche
    setSearchParams(params);
  };

  // --- RENDUS CONDITIONNELS ---
  
  // CRITÈRE D'ACCEPTATION : Affichage d'un état de chargement
  if (loading && !products) {
    return <Spinner message="Recherche des végétaux en cours..." />;
  }

  if (error) {
    return <div className="py-20 text-center font-medium text-red-500">{error}</div>;
  }

  // --- RENDU PRINCIPAL ---
  
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      
      <div className="mb-10 flex items-center justify-between border-b border-jardinerie-primary/20 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
          {searchQuery ? `Résultats pour "${searchQuery}"` : "Nos Végétaux & Produits"}
        </h1>
        {products && (
          <span className="text-sm font-medium text-jardinerie-text/60">
            {products.length} résultat{products.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row">
        
        <FilterSidebar 
          activeCategories={activeCategories}
          activeExpositions={activeExpositions}
          activeWater={activeWater}
          activePrice={activePrice}
          onFilterChange={updateFilters} 
          onReset={resetFilters}
        />

        <main className="flex-1 relative">
          {/* Overlay de chargement subtil pendant le filtrage */}
          {loading && products && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl transition-all"></div>
          )}

          {!products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
              <p className="text-lg font-medium text-jardinerie-text">Aucun végétal ne correspond à vos filtres.</p>
              <button 
                onClick={resetFilters}
                className="mt-4 text-jardinerie-primary underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
        
      </div>
    </div>
  );
}