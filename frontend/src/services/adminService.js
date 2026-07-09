import { BASE_URL } from './apiClient';

const ADMIN_ENDPOINT = `${BASE_URL}/api/admin`;

export const adminService = {
  // --- Constructeurs d'URL historiques ---
  buildProductsUrl:      ()   => `${ADMIN_ENDPOINT}/products`,
  buildProductUrl:       (id) => `${ADMIN_ENDPOINT}/products/${id}`,
  buildCategoriesUrl:    ()   => `${ADMIN_ENDPOINT}/categories`,
  buildSubcategoriesUrl: ()   => `${ADMIN_ENDPOINT}/subcategories`,
  buildTaxesUrl:         ()   => `${ADMIN_ENDPOINT}/taxes`,
  buildUploadUrl:        ()   => `${ADMIN_ENDPOINT}/upload`,

  // --- Nouvelles méthodes d'exécution métier (Dashboard) ---

  /**
   * Récupère les indicateurs du Chiffre d'Affaires
   * @param {string} range 'day', 'week', ou 'month'
   */
  getSalesKpi: async (range = 'month') => {
    try {
      const response = await fetch(`${ADMIN_ENDPOINT}/kpis/sales?range=${range}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include' // Transmission sécurisée du cookie de session PHP
      });
      return await response.json();
    } catch (error) {
      console.error("Erreur de communication avec le endpoint Sales API");
      throw error;
    }
  },

  /**
   * Récupère la liste des commandes filtrée par statut
   * @param {string} status 'pending', 'paid', etc.
   */
  getOrdersByStatus: async (status = 'pending') => {
    try {
      const response = await fetch(`${ADMIN_ENDPOINT}/orders?status=${status}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error("Erreur de communication avec le endpoint Orders API");
      throw error;
    }
  },

  /**
   * Récupère les alertes de stock faible
   */
  getStockAlerts: async (threshold = null) => {
    try {
      const url = threshold 
        ? `${ADMIN_ENDPOINT}/stock/alerts?threshold=${threshold}`
        : `${ADMIN_ENDPOINT}/stock/alerts`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error("Erreur de communication avec le endpoint Stock API");
      throw error;
    }
  }
};