import { BASE_URL } from './apiClient';

const ADMIN_ENDPOINT = `${BASE_URL}/api/admin`;

export const adminService = {
  // Produits
  buildProductsUrl:     ()   => `${ADMIN_ENDPOINT}/products`,
  buildProductUrl:      (id) => `${ADMIN_ENDPOINT}/products/${id}`,

  // Catégories & taxes
  buildCategoriesUrl:   ()   => `${ADMIN_ENDPOINT}/categories`,
  buildSubcategoriesUrl:()   => `${ADMIN_ENDPOINT}/subcategories`,
  buildTaxesUrl:        ()   => `${ADMIN_ENDPOINT}/taxes`,

  // Upload
  buildUploadUrl:       ()   => `${ADMIN_ENDPOINT}/upload`,
};