// Limites métier d'un produit saisi dans l'administration.
// Plus strictes que celles de la base de données (nom : 255 caractères, prix : 99 999 999,99) : elles protègent d'une
// faute de frappe (un zéro en trop). À garder alignées avec backend/src/Core/ProductPolicy.php, qui reste la
// référence : le formulaire n'est qu'une aide à la saisie, l'API refuse de toute façon les valeurs hors limites.

export const PRODUCT_LIMITS = {
  NAME_MAX_LENGTH: 100,
  PRICE_MIN: 0.01,
  PRICE_MAX: 9999.99,
  STOCK_MAX: 9999,
};
