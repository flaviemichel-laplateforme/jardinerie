import { BASE_URL } from './apiClient';

const PRODUCTS_ENDPOINT = `${BASE_URL}/api/products`;

/**
 * Fonction interne (non exportée) : ajoute la query string
 * uniquement si des paramètres existent.
 */
function buildProductsUrl(params = new URLSearchParams()) {
  const queryString = params.toString();
  return `${PRODUCTS_ENDPOINT}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Fonction interne : construit l'URL d'un rayon (vegetaux, jardinage, etc.)
 * en injectant la règle métier "type" dans les filtres déjà présents.
 */
function buildRayonUrl(searchParams, type) {
  const params = new URLSearchParams(searchParams);
  params.set('type', type);
  return buildProductsUrl(params);
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
    return buildRayonUrl(searchParams, 'jardinage');
  },

  /** Rayon Végétaux : mêmes filtres + règle métier type=vegetaux */
  buildVegetauxUrl(searchParams) {
    return buildRayonUrl(searchParams, 'vegetaux');
  },

  /** Fiche produit unique */
  buildProductDetailUrl(id) {
    return `${PRODUCTS_ENDPOINT}/${id}`;
  },

  /** Vérification du stock en temps réel */
  buildAvailabilityUrl(id) {
    return `${PRODUCTS_ENDPOINT}/${id}/availability`;
  },
};