import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. On enveloppe l'application entière pour que le panier soit accessible partout */}
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)