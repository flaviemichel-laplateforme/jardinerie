import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import BackToTop from '../ui/BackToTop';
import AnnouncementBar from './AnnouncementBar';

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();

  // 1. Détection des espaces privés (Admin et Compte client)
  const isPrivateSpace = location.pathname.startsWith('/admin') || location.pathname.startsWith('/compte');
  
  // 2. Détection spécifique de l'espace d'administration
  const isAdminSpace = location.pathname.startsWith('/admin');
  
  // 3. Pages catalogue et fiche produit : sur mobile, une barre collée en bas de l'écran occupe cet espace
  // (barre de filtre, barre d'achat). Le bouton "Retour en haut" et les notifications doivent se placer au-dessus.
  // La barre d'achat de la fiche produit (~110 px) est plus haute que la barre de filtre du catalogue (~60 px).
  const isCatalogPage = ['/produits', '/vegetaux', '/jardinage'].includes(location.pathname);
  const isProductPage = location.pathname.startsWith('/produit/');
  const backToTopBottomClass = isProductPage ? 'bottom-32 lg:bottom-6' : isCatalogPage ? 'bottom-24 lg:bottom-6' : 'bottom-6';
  const toastBottomClass = isProductPage ? '!bottom-32 lg:!bottom-5' : isCatalogPage ? '!bottom-24 lg:!bottom-5' : '';

  // Données fictives pour le profil (en attendant le système d'authentification)
  const userRole = isAdminSpace ? 'admin' : 'customer';
  const userName = user?.first_name ?? 'Invité';

  return (
    <div className="flex flex-col min-h-screen overflow-x-clip bg-white font-sans">
      {/* Gère la position de défilement à chaque navigation :
          - nouvelle page (clic sur un lien) : on repart en haut, sinon une carte cliquée en bas du
            catalogue ouvrirait la fiche produit en bas ;
          - retour en arrière (bouton Retour, flèche du navigateur) : on retrouve la position quittée. */}
      <ScrollRestoration />
      <Toaster
        position="bottom-right"
        // "!" (important) pour primer sur le style en ligne que react-hot-toast pose sur son conteneur
        containerClassName={toastBottomClass}
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
      {/* Bandeau d'information (livraison offerte), absent de l'espace d'administration */}
      {!isAdminSpace && <AnnouncementBar />}

      {/* L'en-tête reste présent pour la navigation globale */}
      <Header />
      
      <div className="flex flex-grow">
        {/* La barre latérale s'affiche sur les espaces privés (Admin et Client) :
            barre fixe en bas (mobile), rail d'icônes (tablette), sidebar complète (desktop) */}
        {isPrivateSpace && <Sidebar userRole={userRole} userName={userName} />}

        {/* Zone de contenu principal (Outlet) */}
        <main className={`min-w-0 flex-grow p-6 md:p-8 bg-jardinerie-bg/10 ${isPrivateSpace ? 'pb-24 md:pb-8' : ''}`}>
          <BackToTop bottomClass={backToTopBottomClass} />
          <Outlet />
        </main>
      </div>

      {/* 3. Condition moderne : Le footer s'affiche UNIQUEMENT si on n'est PAS dans l'administration */}
      {/* Sur la fiche produit (mobile), la barre d'achat reste collée en bas : on prolonge le bandeau vert du pied de
          page pour que son dernier texte ne passe pas dessous. */}
      {!isAdminSpace && (
        <div className={isProductPage ? 'bg-jardinerie-primary pb-28 lg:pb-0' : ''}>
          <Footer />
        </div>
      )}
    </div>
  );
}