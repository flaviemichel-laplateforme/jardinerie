import { BASE_URL } from './apiClient';

const ORDERS_ENDPOINT = `${BASE_URL}/api/me/orders`;

export const orderService = {
  buildListUrl() {
    return ORDERS_ENDPOINT;
  },
  buildDetailUrl(id) {
    return `${ORDERS_ENDPOINT}/${id}`;
  },
};