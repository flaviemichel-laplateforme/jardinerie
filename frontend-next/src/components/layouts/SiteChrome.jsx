'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';
import BackToTop from '../ui/BackToTop';

/**
 * Habillage commun à toutes les pages (remplace MainLayout de l'ancienne version) : bandeau, en-tête, pied de page,
 * notifications et bouton « Retour en haut ». La gestion du défilement (ScrollRestoration) n'est plus nécessaire :
 * Next.js remonte en haut à chaque nouvelle page et retrouve la position lors d'un retour en arrière.
 * La barre latérale des espaces privés (compte, admin) arrivera avec les étapes 2 et 4.
 */
export default function SiteChrome({ children }) {
  const pathname = usePathname();

  const isAdminSpace = pathname.startsWith('/admin');
  const isPrivateSpace = isAdminSpace || pathname.startsWith('/compte');

  // Pages catalogue et fiche produit : sur mobile, une barre collée en bas de l'écran occupe cet espace
  // (barre de filtre, barre d'achat). Le bouton "Retour en haut" et les notifications doivent se placer au-dessus.
  // La barre d'achat de la fiche produit (~110 px) est plus haute que la barre de filtre du catalogue (~60 px).
  const isCatalogPage = ['/produits', '/vegetaux', '/jardinage'].includes(pathname);
  const isProductPage = pathname.startsWith('/produit/');
  const backToTopBottomClass = isProductPage
    ? 'bottom-32 lg:bottom-6'
    : isCatalogPage
      ? 'bottom-24 lg:bottom-6'
      : isPrivateSpace
        ? 'bottom-24 md:bottom-6'
        : 'bottom-6';
  const toastBottomClass = isProductPage
    ? '!bottom-32 lg:!bottom-5'
    : isCatalogPage
      ? '!bottom-24 lg:!bottom-5'
      : isPrivateSpace
        ? '!bottom-24 md:!bottom-5'
        : '';

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white font-sans">
      <Toaster
        position="bottom-right"
        // "!" (important) pour primer sur le style en ligne que react-hot-toast pose sur son conteneur
        containerClassName={toastBottomClass}
        toastOptions={{
          duration: 4000,
          className: 'border border-jardinerie-primary bg-jardinerie-bg text-jardinerie-text shadow-lg',
          success: { iconTheme: { primary: '#027148', secondary: '#EDF0E2' } },
          error: { iconTheme: { primary: '#E63946', secondary: '#EDF0E2' } },
        }}
      />
      {/* Bandeau d'information (livraison offerte), absent de l'espace d'administration */}
      {!isAdminSpace && <AnnouncementBar />}

      <Header />

      <main className="min-w-0 flex-grow bg-jardinerie-bg/10 p-6 md:p-8">
        <BackToTop bottomClass={backToTopBottomClass} />
        {children}
      </main>

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
