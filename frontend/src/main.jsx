import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CheckoutProvider } from './contexts/CheckoutContext.jsx';

createRoot(document.getElementById('root')).render(
  // Le StrictMode est retiré pour désactiver le double-rendu en développement
  <AuthProvider>
    <CartProvider>
      <CheckoutProvider>
        <App />
      </CheckoutProvider>
    </CartProvider>
  </AuthProvider>
);