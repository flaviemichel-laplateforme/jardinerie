import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Spinner from '../../components/ui/Spinner';
import ProductCard from '../../components/catalog/ProductCard';
import FilterSidebar from '../../components/catalog/FilterSidebar'; 

export default function Jardinage() {

  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products, loading, error, request } = useApi();

  // Lecture des paramètres depuis l'URL du navigateur
  const searchQuery = searchParams.get('search') || '';
  const activeCategories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
  
  const activePrice = {
    min: searchParams.get('price_min') || '',
    max: searchParams.get('price_max') || ''
  };

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchProducts = async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      // 1. On récupère les filtres tapés par l'utilisateur (categories, prix, etc.)
      const currentParams = new URLSearchParams(searchParams);
      
    
      // Ce paramètre est envoyé au Back-end, mais n'apparaît pas dans l'URL du navigateur de l'utilisateur !
      currentParams.set('type', 'jardinage');
      
      const queryString = currentParams.toString();
      const url = `${baseUrl}/api/products?${queryString}`;

      await request(url, { signal: controller.signal });
    };

    fetchProducts();

    return () => controller.abort();
  }, [searchParams, request]);

  // Fonction pour mettre à jour l'URL (inchangée, elle est parfaite)
  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams); 
    
    if (newFilters.categories && newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    } else {
      params.delete('categories');
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

  if (loading && !products) {
    return <Spinner message="Recherche des produits de jardinage en cours..." />;
  }

  if (error) {
    return <div className="py-20 text-center font-medium text-red-500">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      
      <div className="mb-10 flex items-center justify-between border-b border-jardinerie-primary/20 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
          {searchQuery ? `Résultats pour "${searchQuery}"` : "Nos produits de jardinage"}
        </h1>
        {products && (
          <span className="text-sm font-medium text-jardinerie-text/60">
            {products.length} Produit{products.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row">
        
        {/* LA BARRE DE FILTRES : Elle va devoir être adaptée pour n'afficher que les filtres "végétaux" */}
        <FilterSidebar 
          activeCategories={activeCategories}
                  activePrice={activePrice}
          onFilterChange={updateFilters} 
          onReset={resetFilters}
          
          mode="jardinage" 
        />

        <main className="flex-1 relative">
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