import { BASE_URL } from './apiClient';

const ADDRESSES_ENDPOINT = `${BASE_URL}/api/addresses`;

export const addressService = {
  /** Liste les adresses de l'utilisateur connecté */
  buildListUrl() {
    return ADDRESSES_ENDPOINT;
  },

  /** Création d'une nouvelle adresse */
  buildCreateUrl() {
    return ADDRESSES_ENDPOINT;
  },

  /** Modification d'une adresse existante */
  buildUpdateUrl(id) {
    return `${ADDRESSES_ENDPOINT}/${id}`;
  },

 /** Suppression d'une adresse */
 buildDeleteUrl(id) {
   return `${ADDRESSES_ENDPOINT}/${id}`;
 },
};