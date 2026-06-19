import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './contexts/CartContext.jsx' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. On enveloppe l'application entière pour que le panier soit accessible partout */}
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>,
)