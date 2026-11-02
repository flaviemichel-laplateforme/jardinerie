// Règle de livraison : offerte à partir de FREE_SHIPPING_THRESHOLD, sinon SHIPPING_COST.
// La SOURCE DE VÉRITÉ est l'API (ShippingPolicy, renvoyée par POST /api/cart/summary) : le panier et le paiement affichent ce qu'elle
// calcule. Ces valeurs ne servent que de REPLI (API injoignable, ou message d'information sur une fiche produit avant tout calcul).

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_COST = 7.90;

// 12.1 -> "12,10 €"
export const formatEuro = (amount) => `${amount.toFixed(2).replace('.', ',')} €`;
