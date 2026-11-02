'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';

// Les contextes utilisent l'état React et le navigateur : ils doivent être des composants client.
// CheckoutProvider sera ajouté avec le tunnel d'achat (étape 3).
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
