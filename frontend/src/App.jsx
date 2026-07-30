import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute'; 

import Catalog from './pages/public/Catalog';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/public/Cart';
import Register from './pages/public/Register';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Vegetaux from './pages/public/Vegetaux';
import Jardinage from './pages/public/Jardinage';
import CheckoutDelivery from './pages/public/CheckoutDelivery';
import CheckoutPayment from './pages/public/CheckoutPayment';
import CheckoutConfirmation from './pages/public/CheckoutConfirmation';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail';
import CustomerAddresses from './pages/customer/CustomerAddresses';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerRgpd from './pages/customer/CustomerRgpd';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCatalog      from './pages/admin/AdminCatalog';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import MentionsLegales from './pages/public/MentionsLegales';
import Cgv from './pages/public/Cgv';
import PolitiqueConfidentialite from './pages/public/PolitiqueConfidentialite';
import AdminClients from './pages/admin/AdminClients';
import ResetPassword from './pages/public/ResetPassword';
import ForgotPassword from './pages/public/ForgotPassword';
import VerifyEmail from './pages/public/VerifyEmail';


// ==========================================
// 2. CONFIGURATION DU ROUTEUR (SITEMAP)
// ==========================================

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />, // Le Layout global (Header, Footer, Sidebar admin)
    children: [
      
      // 🔵 ZONE PUBLIQUE (Accès libre)
      { index: true, element: <Home /> },
      { path: 'produits', element: <Catalog /> },
      { path: 'vegetaux', element: <Vegetaux /> },
      { path: 'produit/:id', element: <ProductDetail /> },
      { path: 'jardinage', element: <Jardinage /> },

      // ⚫ PAGES LÉGALES (Accès libre)
      { path: 'mentions-legales', element: <MentionsLegales /> },
      { path: 'cgv', element: <Cgv /> },
      { path: 'politique-confidentialite', element: <PolitiqueConfidentialite /> },

      // 🟠 AUTHENTIFICATION (Accès libre)
      { path: 'connexion', element: <Login /> },
      { path: 'inscription', element: <Register /> },
      { path: 'mot-de-passe-oublie', element: <ForgotPassword /> },
      { path: 'reinitialiser-mot-de-passe', element: <ResetPassword /> },
      { path: 'verifier-email', element: <VerifyEmail /> },

      
      // 🟢 TUNNEL D'ACHAT (🛡️ PROTÉGÉ)
      { path: 'panier', element: <Cart /> },
      {
        path: 'commande',
        element:  <ProtectedRoute />,
        children: [
          { path: 'livraison', element: <CheckoutDelivery /> },
          { path: 'paiement', element: <CheckoutPayment /> },
          { path: 'confirmation', element: <CheckoutConfirmation /> },
        ]
      },

      // 🟠 ESPACE CLIENT (🛡️ PROTÉGÉ)
      {
        path: 'compte',
        element: <ProtectedRoute />, 
        children: [
          { index: true, element: <CustomerDashboard /> }, // Correspond à /compte
          { path: 'commandes', element: <CustomerOrders /> },
          { path: 'adresses', element: <CustomerAddresses /> },
          { path: 'commandes/:id', element: <CustomerOrderDetail /> },
          { path: 'parametres', element: <CustomerProfile /> },
          { path: 'rgpd', element: <CustomerRgpd /> },
        ]
      },

      // ⚪ ESPACE ADMINISTRATEUR (🛡️ HAUTEMENT PROTÉGÉ)
      {
        path: 'admin',
        element: <ProtectedRoute requireAdmin={true} />, 
        children: [
          { index: true, element: <AdminDashboard /> }, // Correspond à /admin
          { path: 'catalogue', element: <AdminCatalog /> },
          { path: 'catalogue/nouveau',      element: <AdminProductForm /> },
          { path: 'catalogue/:id/modifier', element: <AdminProductForm /> },
          { path: 'commandes', element: <AdminOrders /> },
          { path: 'clients', element: <AdminClients /> },
          { path: 'profil', element: <CustomerProfile /> },
        ]
      },
    ],
  },
]);

// ==========================================
// 3. EXPORT DU COMPOSANT PRINCIPAL
// ==========================================

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      
      {/* Configuration globale du Toaster */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#333333',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '12px',
          },
        }} 
      />
    </>
  );
}