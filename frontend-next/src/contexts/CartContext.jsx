'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'jardinerie_cart';

// 1. Création du contexte
const CartContext = createContext();

// 2. Création du Provider (Fournisseur de données)
export function CartProvider({ children }) {
  // Différence avec l'ancienne version (Vite) : le panier démarre VIDE, même s'il y a quelque chose dans le localStorage.
  // La page est d'abord construite sur le serveur, qui n'a pas de localStorage : si le navigateur affichait tout de suite
  // « 3 articles » là où le serveur a écrit « 0 », React détecterait une différence (erreur d'hydratation).
  // On lit donc le localStorage juste après l'affichage, dans un useEffect.
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  useEffect(() => {
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      // Lecture unique d'un stockage extérieur à React, au montage : c'est l'usage prévu d'un effet.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localData) setCartItems(JSON.parse(localData));
    } catch (error) {
      console.error('Erreur de lecture du localStorage', error);
    }
    setIsCartLoaded(true);
  }, []);

  // Sauvegarde automatique à chaque modification, mais seulement APRÈS la lecture :
  // sinon le panier vide du premier affichage écraserait le panier enregistré.
  useEffect(() => {
    if (!isCartLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, isCartLoaded]);

  // --- ACTIONS DU PANIER ---

  // Ajouter un produit
  const addToCart = (product, quantity) => {
    setCartItems((prevItems) => {
      // On vérifie si le produit est déjà dans le panier
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // S'il existe, on additionne simplement la quantité (sans dépasser le stock max)
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_quantity) }
            : item
        );
      }

      // S'il n'existe pas, on l'ajoute au tableau avec les infos essentielles
      return [...prevItems, {
        id: product.id,
        name: product.product_name,
        price: parseFloat(product.price_tax_incl),
        tax_rate: parseFloat(product.rate || product.tax_rate || 20),
        image: product.main_image_url,
        stock_max: product.stock_quantity,
        quantity: quantity
      }];
    });
  };

  // Retirer un produit
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // Modifier la quantité d'un produit déjà dans le panier
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.min(newQuantity, item.stock_max) }
          : item
      )
    );
  };

  // Vider le panier
  const clearCart = () => setCartItems([]);

  // Calculs automatiques
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartLoaded,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

// 3. Création d'un Custom Hook pour utiliser le panier facilement partout
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};
