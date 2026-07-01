import { BASE_URL } from './apiClient';

export const checkoutService = {
    buildPaymentIntentUrl() {
        return `${BASE_URL}/api/checkout/payment-intent`;
    },
};