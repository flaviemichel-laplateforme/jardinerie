'use client';

import { useRouter } from 'next/navigation';
import { useInfiniteProducts } from '../../hooks/useInfiniteProducts';
import { useCatalogFilters } from '../../hooks/useCatalogFilters';
import { CATALOG_MODES, PRODUCTS_PER_PAGE } from '../../constants/catalogModes';
import Spinner from '../ui/Spinner';
import ProductCard from './ProductCard';
import FilterSidebar from './FilterSidebar';

const EMPTY_MESSAGES = {
  global: 'Aucun produit ne correspond à vos filtres.',
  vegetaux: 'Aucun végétal ne correspond à vos filtres.',
  jardinage: 'Aucun produit ne correspond à vos filtres.',
};

/**
 * Page de catalogue commune à /produits, /vegetaux et /jardinage (remplace les trois anciennes pages).
 * @param {'global'|'vegetaux'|'jardinage'} mode
 * @param {object} initial - 1re page calculée par le serveur (voir CatalogPage.jsx)
 */
export default function CatalogView(props) {
  // Next.js garde les pages quittées en mémoire, avec leur état : au bouton Retour, on retrouve la liste déjà chargée
  // et la position de défilement. Mais sur un NOUVEAU clic (menu, lien), on veut une liste fraîche, comme avant, pour
  // ne pas afficher des stocks périmés. bfcacheId change à chaque nouvelle navigation et reste le même au Retour :
  // utilisé comme clé, il remet le catalogue à zéro dans le premier cas seulement.
  const { bfcacheId } = useRouter();
  return <CatalogContent key={bfcacheId} {...props} />;
}

function CatalogContent({ mode, initial }) {
  const config = CATALOG_MODES[mode];
  const {
    searchQuery,
    activeCategories,
    activeSubcategories,
    activeCriteria,
    activeExpositions,
    activePrice,
    activeWater,
    isPending,
    updateFilters,
    resetFilters,
  } = useCatalogFilters();

  const { items: products, loading, hasMore, total, error, sentinelRef } =
    useInfiniteProducts(initial, config.buildUrl, PRODUCTS_PER_PAGE);

  return (
    <div className="mx-auto max-w-[2400px] px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">

      <div className="mb-10 flex items-center justify-between border-b border-jardinerie-primary/20 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
          {searchQuery ? `Résultats pour "${searchQuery}"` : config.title}
        </h1>
        {products.length > 0 && (
          <span className="text-sm font-medium text-jardinerie-text/60">
            {config.countLabel(total)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row xl:gap-10">

        <FilterSidebar
          activeCategories={activeCategories}
          activeSubcategories={activeSubcategories}
          activeExpositions={activeExpositions}
          activeWater={activeWater}
          activeCriteria={activeCriteria}
          activePrice={activePrice}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          resultCount={total}
          mode={mode}
        />

        {/* Pendant qu'un nouveau filtre se charge, la liste précédente reste visible mais atténuée */}
        <section
          aria-label="Produits"
          aria-busy={isPending}
          className={`relative min-h-[400px] min-w-0 flex-1 transition-opacity ${isPending ? 'opacity-50' : ''}`}
        >
          {error && products.length === 0 ? (
            <div className="py-20 text-center font-medium text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
              <p className="text-lg font-medium text-jardinerie-text">{EMPTY_MESSAGES[mode]}</p>
              <button
                type="button"
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
        </section>
      </div>
    </div>
  );
}
