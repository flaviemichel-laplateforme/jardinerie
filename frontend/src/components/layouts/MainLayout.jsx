import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import BackToTop from '../ui/BackToTop';

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();

  // 1. Détection des espaces privés (Admin et Compte client)
  const isPrivateSpace = location.pathname.startsWith('/admin') || location.pathname.startsWith('/compte');
  
  // 2. Détection spécifique de l'espace d'administration
  const isAdminSpace = location.pathname.startsWith('/admin');
  
  // 3. Pages catalogue : sur mobile, la barre de filtre collée en bas de l'écran occupe cet espace.
  // Le bouton "Retour en haut" et les notifications doivent se placer au-dessus d'elle.
  const hasFilterBar = ['/produits', '/vegetaux', '/jardinage'].includes(location.pathname);

  // Données fictives pour le profil (en attendant le système d'authentification)
  const userRole = isAdminSpace ? 'admin' : 'customer';
  const userName = user?.first_name ?? 'Invité';

  // Sans ça, React Router conserve la position de défilement d'une page à l'autre :
  // en cliquant sur une carte produit en bas de catalogue, on arrivait en bas de la fiche produit.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen overflow-x-clip bg-white font-sans">
      <Toaster
        position="bottom-right"
        // "!" (important) pour primer sur le style en ligne que react-hot-toast pose sur son conteneur
        containerClassName={hasFilterBar ? '!bottom-24 lg:!bottom-5' : ''}
        toastOptions={{
          duration: 4000,
          className:
            'border border-jardinerie-primary bg-jardinerie-bg text-jardinerie-text shadow-lg',
          success: {
            iconTheme: { primary: '#027148', secondary: '#EDF0E2' },
          },
          error: {
            iconTheme: { primary: '#E63946', secondary: '#EDF0E2' },
          },
        }}
      />
      {/* L'en-tête reste présent pour la navigation globale */}
      <Header />
      
      <div className="flex flex-grow">
        {/* La barre latérale s'affiche sur les espaces privés (Admin et Client) :
            barre fixe en bas (mobile), rail d'icônes (tablette), sidebar complète (desktop) */}
        {isPrivateSpace && <Sidebar userRole={userRole} userName={userName} />}

        {/* Zone de contenu principal (Outlet) */}
        <main className={`min-w-0 flex-grow p-6 md:p-8 bg-jardinerie-bg/10 ${isPrivateSpace ? 'pb-24 md:pb-8' : ''}`}>
          <BackToTop raised={hasFilterBar} />
          <Outlet />
        </main>
      </div>

      {/* 3. Condition moderne : Le footer s'affiche UNIQUEMENT si on n'est PAS dans l'administration */}
      {!isAdminSpace && <Footer />}
    </div>
  );
}