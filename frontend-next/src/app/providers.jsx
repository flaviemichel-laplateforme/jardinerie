'use client';

import { AuthProvider } from '../contexts/AuthContext';

// Les contextes utilisent l'état React et le navigateur : ils doivent être des composants client.
// CartProvider et CheckoutProvider seront ajoutés avec les étapes qui en ont besoin (en-tête, puis tunnel d'achat).
export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
