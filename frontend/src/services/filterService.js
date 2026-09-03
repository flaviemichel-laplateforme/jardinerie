import { BASE_URL } from './apiClient';

export const filterService = {
  /**
   * Construit l'URL pour récupérer les filtres disponibles
   * (catégories, sous-catégories, expositions, besoins en eau) selon le rayon affiché.
   * @param {string} mode - 'vegetaux' | 'jardinage' | 'global'
   * @param {string[]} activeCategories - IDs des catégories actuellement cochées
   */
  buildFiltersUrl(mode = 'global', activeCategories = []) {
    const params = new URLSearchParams();
    if (mode !== 'global') params.set('type', mode);
    if (activeCategories.length > 0) params.set('categories', activeCategories.join(','));

    const query = params.toString();
    return `${BASE_URL}/api/filters${query ? `?${query}` : ''}`;
  },
};