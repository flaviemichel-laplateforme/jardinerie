import { useSearchParams } from 'react-router-dom';
import { useInfiniteProducts } from '../../hooks/useInfiniteProducts';
import { productService } from '../../services/productService';

import Spinner from '../../components/ui/Spinner';
import ProductCard from '../../components/catalog/ProductCard';
import FilterSidebar from '../../components/catalog/FilterSidebar';

export default function Jardinage() {

  const [searchParams, setSearchParams] = useSearchParams();
  const { items: products, loading, hasMore, total, error, sentinelRef } =
    useInfiniteProducts(searchParams, productService.buildJardinageUrl, 12);

  // Lecture des paramètres depuis l'URL du navigateur
  const searchQuery = searchParams.get('search') || '';
  const activeCategories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];

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
          {searchQuery ? `Résultats pour "${searchQuery}"` : "Jardinage"}
        </h1>
        {products.length > 0 && (
          <span className="text-sm font-medium text-jardinerie-text/60">
            {total} Produit{total > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row xl:gap-10">

        {/* LA BARRE DE FILTRES : Protégée, elle ne se démontera plus au chargement */}
        <FilterSidebar
          activeCategories={activeCategories}
          activePrice={activePrice}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          mode="jardinage"
        />

        <main className="relative min-h-[400px] min-w-0 flex-1">

          {/* GESTION DES ÉTATS PROPREMENT DANS LE MAIN */}
          {loading && products.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center pt-20">
              <Spinner message="Recherche des produits de jardinage en cours..." />
            </div>
          ) : error && products.length === 0 ? (
            <div className="py-20 text-center font-medium text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
              <p className="text-lg font-medium text-jardinerie-text">Aucun produit ne correspond à vos filtres.</p>
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
