import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { CATALOG_MODES, PRODUCTS_PER_PAGE, normalizeFilters } from '../../constants/catalogModes';
import Skeleton from '../ui/Skeleton';
import CatalogView from './CatalogView';

/**
 * 1re page d'un catalogue, calculée sur le SERVEUR : le HTML envoyé à Google contient déjà les produits.
 * Mise en cache par rayon et par jeu de filtres, rafraîchie au plus toutes les minutes.
 */
async function getFirstPage(mode, filters) {
  'use cache';
  cacheLife('minutes');

  const params = new URLSearchParams(filters);
  params.set('page', '1');
  params.set('limit', String(PRODUCTS_PER_PAGE));

  try {
    const response = await fetch(CATALOG_MODES[mode].buildUrl(params));
    const result = await response.json();
    if (!response.ok || !result.success) {
      return { key: filters, items: [], hasMore: false, total: 0, error: result.message ?? 'Impossible de charger le catalogue.' };
    }
    return {
      key: filters,
      items: result.data,
      hasMore: result.pagination?.has_next ?? false,
      total: result.pagination?.total_items ?? result.data.length,
      error: null,
    };
  } catch {
    return { key: filters, items: [], hasMore: false, total: 0, error: 'Le catalogue est momentanément indisponible.' };
  }
}

/** Lit les filtres de l'adresse (connus seulement au moment de la visite), puis affiche le catalogue. */
async function CatalogResults({ mode, searchParams }) {
  const filters = normalizeFilters(await searchParams);
  const initial = await getFirstPage(mode, filters);

  return <CatalogView mode={mode} initial={initial} />;
}

/** Affiché pendant le calcul de la 1re page (même gabarit que le catalogue, pour éviter un saut de mise en page). */
function CatalogSkeleton({ mode }) {
  return (
    <div className="mx-auto max-w-[2400px] px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12" aria-busy="true">
      <div className="mb-10 border-b border-jardinerie-primary/20 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">{CATALOG_MODES[mode].title}</h1>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:ml-[18rem]">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

/**
 * Page de catalogue commune (utilisée par app/produits, app/vegetaux, app/jardinage).
 * Les filtres viennent de l'adresse : ils ne sont connus qu'à la visite, d'où le <Suspense> (exigé par Next.js).
 */
export default function CatalogPage({ mode, searchParams }) {
  return (
    <Suspense fallback={<CatalogSkeleton mode={mode} />}>
      <CatalogResults mode={mode} searchParams={searchParams} />
    </Suspense>
  );
}
