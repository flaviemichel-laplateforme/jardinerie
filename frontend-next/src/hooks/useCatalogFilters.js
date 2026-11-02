import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Un changement de filtre remplace la liste : on repart du haut des résultats, c'est le comportement attendu
// pour un nouveau jeu de résultats.
const scrollToResultsTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

export function useCatalogFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Les filtres sont dans l'adresse : en changer, c'est naviguer. Le serveur renvoie alors la 1re page filtrée.
  // isPending est vrai pendant ce temps, pour indiquer le chargement (la liste précédente reste affichée).
  const [isPending, startTransition] = useTransition();

  const searchQuery = searchParams.get('search') || '';
  const activeCategories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
  const activeSubcategories = searchParams.get('subcategories') ? searchParams.get('subcategories').split(',') : [];
  const activeExpositions = searchParams.get('expositions') ? searchParams.get('expositions').split(',') : [];
  const activeWater = searchParams.get('water') ? searchParams.get('water').split(',') : [];
  const activeCriteria = searchParams.get('criteria') ? searchParams.get('criteria').split(',') : [];
  const activePrice = {
    min: searchParams.get('price_min') || '',
    max: searchParams.get('price_max') || ''
  };

  const navigate = (params) => {
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
    scrollToResultsTop();
  };

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);

    for (const key of ['categories', 'subcategories', 'expositions', 'water', 'criteria']) {
      if (newFilters[key] && newFilters[key].length > 0) {
        params.set(key, newFilters[key].join(','));
      } else {
        params.delete(key);
      }
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

    navigate(params);
  };

  const resetFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    navigate(params);
  };

  return {
    searchParams,
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
  };
}
