import { useSearchParams } from 'react-router-dom';
import { useInfiniteProducts } from '../../hooks/useInfiniteProducts';
import Spinner from '../../components/ui/Spinner';
import ProductCard from '../../components/catalog/ProductCard';
import FilterSidebar from '../../components/catalog/FilterSidebar';
import { productService } from '../../services/productService';

export default function Vegetaux() {

  const [searchParams, setSearchParams] = useSearchParams();
  const { items: products, loading, hasMore, total, error, sentinelRef } =
    useInfiniteProducts(searchParams, productService.buildVegetauxUrl, 12);

  const searchQuery = searchParams.get('search') || '';
  const activeCategories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
  const activeExpositions = searchParams.get('expositions') ? searchParams.get('expositions').split(',') : [];
  const activeWater = searchParams.get('water') ? searchParams.get('water').split(',') : [];
  const activeCriteria = searchParams.get('criteria') ? searchParams.get('criteria').split(',') : [];
  const activePrice = {
    min: searchParams.get('price_min') || '',
    max: searchParams.get('price_max') || ''
  };

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

    if (newFilters.criteria && newFilters.criteria.length > 0) {
      params.set('criteria', newFilters.criteria.join(','));
    } else {
      params.delete('criteria');
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
    <div className="mx-auto max-w-[1880px] px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      
      <div className="mb-10 flex items-center justify-between border-b border-jardinerie-primary/20 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
          {searchQuery ? `Résultats pour "${searchQuery}"` : "Nos végétaux"}
        </h1>
        {products.length > 0 && (
          <span className="text-sm font-medium text-jardinerie-text/60">
            {total} {total > 1 ? 'Végétaux' : 'Végétal'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row xl:gap-10">
        
        <FilterSidebar 
          activeCategories={activeCategories}
          activeExpositions={activeExpositions}
          activeWater={activeWater}
          activeCriteria={activeCriteria}
          activePrice={activePrice}
          onFilterChange={updateFilters} 
          onReset={resetFilters}
          mode="vegetaux" 
        />

        <main className="relative min-h-[400px] min-w-0 flex-1">
          
          {loading && products.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center pt-20">
              <Spinner message="Recherche des végétaux en cours..." />
            </div>
          ) : error && products.length === 0 ? (
            <div className="py-20 text-center font-medium text-red-500">{error}</div>
          ) : products.length === 0 ? (
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
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Sentinelle : déclenche le chargement de la page suivante quand elle devient visible */}
              {hasMore && (
                <div ref={sentinelRef} className="flex flex-col items-center gap-2 py-8">
                  {loading && <Spinner message="Chargement des produits suivants..." />}
                  {error && !loading && <p className="text-sm text-red-500">{error}</p>}
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}