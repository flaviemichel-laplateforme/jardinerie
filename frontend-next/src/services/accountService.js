import { BASE_URL } from './apiClient';

// Routes de l'espace client (toutes demandent une session ouverte)
const ME_ENDPOINT = `${BASE_URL}/api/me`;
const ADDRESSES_ENDPOINT = `${BASE_URL}/api/addresses`;

export const accountService = {
  buildDashboardUrl() {
    return `${ME_ENDPOINT}/dashboard`;
  },

  buildProfileUrl() {
    return `${ME_ENDPOINT}/profile`;
  },

  buildPasswordUrl() {
    return `${ME_ENDPOINT}/password`;
  },

  // Suppression du compte (anonymisation, droit à l'oubli)
  buildDeleteAccountUrl() {
    return ME_ENDPOINT;
  },

  buildOrdersUrl() {
    return `${ME_ENDPOINT}/orders`;
  },

  buildOrderUrl(id) {
    return `${ME_ENDPOINT}/orders/${encodeURIComponent(id)}`;
  },

  buildAddressesUrl() {
    return ADDRESSES_ENDPOINT;
  },

  buildAddressUrl(id) {
    return `${ADDRESSES_ENDPOINT}/${encodeURIComponent(id)}`;
  },
};
