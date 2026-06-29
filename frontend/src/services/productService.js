import { BASE_URL } from './apiClient';

const PRODUCTS_ENDPOINT = `${BASE_URL}/api/products`;

/**
 * Fonction interne (non exportée — invisible depuis l'extérieur du fichier) :
 * ajoute la query string uniquement si des paramètres existent.
 */
function buildProductsUrl(params = new URLSearchParams()) {
  const queryString = params.toString();
  return `${PRODUCTS_ENDPOINT}${queryString ? `?${queryString}` : ''}`;
}

export const productService = {
  /** Page d'accueil : aucun filtre */
  buildHomeUrl() {
    return buildProductsUrl();
  },

  /** Catalogue global : tous les filtres présents dans l'URL */
  buildCatalogUrl(searchParams) {
    return buildProductsUrl(new URLSearchParams(searchParams));
  },

  /** Rayon Jardinage : mêmes filtres + règle métier type=jardinage */
  buildJardinageUrl(searchParams) {
    const params = new URLSearchParams(searchParams);
    params.set('type', 'jardinage');
    return buildProductsUrl(params);
  },
};