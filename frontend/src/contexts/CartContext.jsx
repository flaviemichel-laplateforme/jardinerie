import { createContext, useContext, useState, useEffect } from 'react';

// 1. Création du contexte
const CartContext = createContext();

// 2. Création du Provider (Fournisseur de données)
export function CartProvider({ children }) {
  // Initialisation paresseuse (Lazy initialization) : on lit le localStorage une seule fois au démarrage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('jardinerie_cart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Erreur de lecture du localStorage", error);
      return [];
    }
  });

  // Sauvegarde automatique dans le localStorage à chaque modification du panier
  useEffect(() => {
    localStorage.setItem('jardinerie_cart', JSON.stringify(cartItems));
  }, [cartItems]);

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

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};