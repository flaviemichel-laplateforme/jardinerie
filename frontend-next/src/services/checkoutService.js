import { BASE_URL } from './apiClient';

// Clé PUBLIQUE de Stripe (pk_test_… ou pk_live_…) : visible dans le code de la page, ce n'est pas un secret. La clé secrète (sk_…) ne
// vit que dans le .env de l'API. Une valeur qui ne commence pas par « pk_ » (modèle du .env.example non rempli) est traitée comme absente.
const RAW_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';
export const STRIPE_PUBLIC_KEY = /^pk_(test|live)_[A-Za-z0-9]+$/.test(RAW_PUBLIC_KEY) ? RAW_PUBLIC_KEY : '';

export const checkoutService = {
  // Crée l'intention de paiement (montant calculé par l'API : articles + livraison)
  buildPaymentIntentUrl() {
    return `${BASE_URL}/api/checkout/payment-intent`;
  },

  // État d'un paiement, relu chez Stripe par l'API : on ne croit pas ce que dit l'adresse de la page
  buildConfirmationUrl(paymentIntentId) {
    return `${BASE_URL}/api/checkout/confirmation?payment_intent=${encodeURIComponent(paymentIntentId)}`;
  },
};
