import { useSearchParams } from 'react-router-dom';

export function useCatalogFilters() {
    const [searchParams, setSearchParams] = useSearchParams();

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

     return {
    searchParams,
    searchQuery,
    activeCategories,
    activeCriteria,
    activeExpositions,
    activePrice,
    activeWater,
  updateFilters,
  resetFilters,

    };

}