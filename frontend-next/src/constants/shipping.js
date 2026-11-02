// Source unique pour la règle de livraison côté front : offerte à partir de FREE_SHIPPING_THRESHOLD,
// sinon SHIPPING_COST. Partagée entre le panier, le paiement et les messages d'information.
// Attention : le back-end applique la même règle de son côté (CheckoutController, OrderModel).

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_COST = 7.90;

// 12.1 -> "12,10 €"
export const formatEuro = (amount) => `${amount.toFixed(2).replace('.', ',')} €`;
