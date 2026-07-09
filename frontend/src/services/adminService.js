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

  // --- Constructeurs d'URL (Dashboard) — utilisés avec le hook useApi ---
  buildSalesKpiUrl: (range = 'month') => `${ADMIN_ENDPOINT}/kpis/sales?range=${range}`,
  buildOrdersByStatusUrl: (status = 'pending') => `${ADMIN_ENDPOINT}/orders?status=${status}`,
  buildStockAlertsUrl: (threshold = null) => threshold
    ? `${ADMIN_ENDPOINT}/stock/alerts?threshold=${threshold}`
    : `${ADMIN_ENDPOINT}/stock/alerts`,
};