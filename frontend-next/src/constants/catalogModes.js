import { productService } from '../services/productService';

// Les trois catalogues (/produits, /vegetaux, /jardinage) partagent la même page : seuls changent le titre,
// le libellé du compteur et l'adresse de l'API. Avant, c'étaient trois fichiers presque identiques.
export const CATALOG_MODES = {
  global: {
    path: '/produits',
    title: 'Tous nos produits',
    countLabel: (n) => `${n} résultat${n > 1 ? 's' : ''}`,
    buildUrl: (params) => productService.buildCatalogUrl(params),
  },
  vegetaux: {
    path: '/vegetaux',
    title: 'Nos végétaux',
    countLabel: (n) => `${n} ${n > 1 ? 'Végétaux' : 'Végétal'}`,
    buildUrl: (params) => productService.buildVegetauxUrl(params),
  },
  jardinage: {
    path: '/jardinage',
    title: 'Jardinage',
    countLabel: (n) => `${n} Produit${n > 1 ? 's' : ''}`,
    buildUrl: (params) => productService.buildJardinageUrl(params),
  },
};

export const PRODUCTS_PER_PAGE = 12;

// Seuls ces paramètres d'adresse sont des filtres. Les autres (ex. ?utm_source=…) sont ignorés : sinon chaque variante
// d'adresse créerait sa propre entrée dans le cache du serveur.
const FILTER_KEYS = ['search', 'categories', 'subcategories', 'expositions', 'water', 'criteria', 'price_min', 'price_max'];

/** Filtres actifs, dans un ordre fixe : la même sélection donne toujours la même chaîne (clé de cache, de liste…). */
export function normalizeFilters(params) {
  const source = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  const normalized = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = source.get(key);
    if (value) normalized.set(key, value);
  }
  return normalized.toString();
}
