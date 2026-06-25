import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layouts/MainLayout';
import Catalog from './pages/public/Catalog';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/public/Cart';
import Register from './pages/public/Register';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Vegetaux from './pages/public/Vegetaux';
import Jardinage from './pages/public/Jardinage';


// ==========================================
// 1. PLACEHOLDERS (Composants temporaires)
// ==========================================

// --- ZONE BLEUE : Public ---
// const Home = () => <div className="p-10 text-center">Accueil Jardinerie</div>;
// const Jardinage = () => <div className="p-10 text-center">Rayon Jardinage</div>;

// --- ZONE ORANGE : Authentification & Espace Client ---
// const Login = () => <div className="p-10 text-center">Page de Connexion</div>;

const CustomerDashboard = () => <div className="p-10 text-center">Mon Profil (Tableau de bord client)</div>;
const CustomerOrders = () => <div className="p-10 text-center">Mes Commandes</div>;
const CustomerTickets = () => <div className="p-10 text-center">Mes Tickets (SAV)</div>;
const CustomerSettings = () => <div className="p-10 text-center">Infos et Mot de passe</div>;

// --- ZONE VERTE : Tunnel d'achat ---

const CheckoutDelivery = () => <div className="p-10 text-center">Étape 1 : Livraison</div>;
const CheckoutPayment = () => <div className="p-10 text-center">Étape 2 : Paiement</div>;
const CheckoutConfirmation = () => <div className="p-10 text-center">Confirmation de commande</div>;

// --- ZONE GRISE : Administration ---
const AdminDashboard = () => <div className="p-10 text-center">Dashboard et Alertes Stocks</div>;
const AdminCatalog = () => <div className="p-10 text-center">Gestion du Catalogue</div>;
const AdminOrders = () => <div className="p-10 text-center">Gestion des Commandes Clients</div>;


// ==========================================
// 2. CONFIGURATION DU ROUTEUR (SITEMAP)
// ==========================================

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />, // Le Layout global (Header, Footer, Sidebar admin)
    children: [
      
      // 🔵 ZONE PUBLIQUE
      { index: true, element: <Home /> },
      { path: 'produits', element: <Catalog /> },
      { path: 'vegetaux', element: <Vegetaux /> },
      { path: 'produit/:id', element: <ProductDetail /> }, // :id = URL dynamique pour la fiche produit
      { path: 'jardinage', element: <Jardinage /> },
      
      // 🟠 AUTHENTIFICATION
      { path: 'connexion', element: <Login /> },
      { path: 'inscription', element: <Register /> },
      
      // 🟢 TUNNEL D'ACHAT
      { path: 'panier', element: <Cart /> },
      {
        path: 'commande',
        children: [
          { path: 'livraison', element: <CheckoutDelivery /> },
          { path: 'paiement', element: <CheckoutPayment /> },
          { path: 'confirmation', element: <CheckoutConfirmation /> },
        ]
      },

      // 🟠 ESPACE CLIENT
      {
        path: 'compte',
        children: [
          { index: true, element: <CustomerDashboard /> }, // Correspond à /compte
          { path: 'commandes', element: <CustomerOrders /> }, // /compte/commandes
          { path: 'tickets', element: <CustomerTickets /> },
          { path: 'parametres', element: <CustomerSettings /> },
        ]
      },

      // ⚪ ESPACE ADMINISTRATEUR
      {
        path: 'admin',
        children: [
          { index: true, element: <AdminDashboard /> }, // Correspond à /admin
          { path: 'catalogue', element: <AdminCatalog /> }, // /admin/catalogue
          { path: 'commandes', element: <AdminOrders /> },
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
          duration: 4000, // Le toast restera visible 4 secondes
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