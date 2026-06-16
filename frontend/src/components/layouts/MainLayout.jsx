import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const location = useLocation();
  
  // 1. Détection des espaces privés (Admin et Compte client)
  const isPrivateSpace = location.pathname.startsWith('/admin') || location.pathname.startsWith('/account');
  
  // 2. Détection spécifique de l'espace d'administration
  const isAdminSpace = location.pathname.startsWith('/admin');
  
  // Données fictives pour le profil (en attendant le système d'authentification)
  const userRole = isAdminSpace ? 'admin' : 'client';
  const userName = isAdminSpace ? 'Admin' : 'Flavie';

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* L'en-tête reste présent pour la navigation globale */}
      <Header />
      
      <div className="flex flex-grow">
        {/* La barre latérale s'affiche sur les espaces privés (Admin et Client) */}
        {isPrivateSpace && <Sidebar userRole={userRole} userName={userName} />}
        
        {/* Zone de contenu principal (Outlet) */}
        <main className="flex-grow p-6 md:p-8 bg-jardinerie-bg/10">
          <Outlet />
        </main>
      </div>

      {/* 3. Condition moderne : Le footer s'affiche UNIQUEMENT si on n'est PAS dans l'administration */}
      {!isAdminSpace && <Footer />}
    </div>
  );
}