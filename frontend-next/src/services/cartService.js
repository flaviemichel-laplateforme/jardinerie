import { BASE_URL } from './apiClient';

export const cartService = {
  // Résumé d'un panier d'après la base : prix, stock, TVA, livraison, total (route publique : le panier se remplit avant la connexion)
  buildSummaryUrl() {
    return `${BASE_URL}/api/cart/summary`;
  },
};
