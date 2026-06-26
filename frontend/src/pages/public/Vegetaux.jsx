import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Spinner from '../../components/ui/Spinner';
import ProductCard from '../../components/catalog/ProductCard';
import FilterSidebar from '../../components/catalog/FilterSidebar'; 

export default function Vegetaux() {

  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products, loading, error, request } = useApi();

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
      
      const currentParams = new URLSearchParams(searchParams);
      currentParams.set('type', 'vegetaux');
      
      const queryString = currentParams.toString();
      const url = `${baseUrl}/api/products?${queryString}`;

      await request(url, { signal: controller.signal }, false);
    };

    fetchProducts();

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams); 
    
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

    setSearchParams(params); 
  };

  const resetFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery); 
    setSearchParams(params);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      
      <div className="mb-10 flex items-center justify-between border-b border-jardinerie-primary/20 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
          {searchQuery ? `Résultats pour "${searchQuery}"` : "Nos végétaux"}
        </h1>
        {products && (
          <span className="text-sm font-medium text-jardinerie-text/60">
            {products.length} {products.length > 1 ? 'Végétaux' : 'Végétal'}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row">
        
        {/* La Sidebar reste affichée en permanence, elle n'est plus jamais détruite */}
        <FilterSidebar 
          activeCategories={activeCategories}
          activeExpositions={activeExpositions}
          activeWater={activeWater}
          activePrice={activePrice}
          onFilterChange={updateFilters} 
          onReset={resetFilters}
          mode="vegetaux" 
        />

        <main className="flex-1 relative min-h-[400px]">
          
          {/* ========================================== */}
          {/* GESTION DES ÉTATS DIRECTEMENT DANS LE MAIN */}
          {/* ========================================== */}
          
          {loading && !products ? (
            // 1er cas : Chargement initial
            <div className="flex h-full w-full items-center justify-center pt-20">
              <Spinner message="Recherche des végétaux en cours..." />
            </div>
          ) : error ? (
            // 2ème cas : Erreur du serveur
            <div className="py-20 text-center font-medium text-red-500">{error}</div>
          ) : !products || products.length === 0 ? (
            // 3ème cas : Succès mais aucun résultat
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
            // 4ème cas : Affichage des produits avec overlay si un filtre est cliqué
            <>
              {loading && (
                <div className="absolute inset-0 z-10 rounded-2xl bg-white/50 backdrop-blur-[1px] transition-all"></div>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}