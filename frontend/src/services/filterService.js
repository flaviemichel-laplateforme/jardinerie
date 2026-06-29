import { BASE_URL } from './apiClient';

export const filterService = {
  /**
   * Construit l'URL pour récupérer les filtres disponibles
   * (catégories, expositions, besoins en eau) selon le rayon affiché.
   * @param {string} mode - 'vegetaux' | 'jardinage' | 'global'
   */
  buildFiltersUrl(mode = 'global') {
    return `${BASE_URL}/api/filters${mode !== 'global' ? `?type=${mode}` : ''}`;
  },
};