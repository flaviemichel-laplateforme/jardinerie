'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { canGoBackInSite } from '../../utils/navigationHistory';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary';

/**
 * Bouton « Retour » de la fiche produit : revient à la page d'où l'on vient (catalogue avec ses filtres, accueil…),
 * ou, si la fiche a été ouverte directement, renvoie vers le catalogue du produit (`fallbackHref`).
 * - variant "desktop" : bouton libellé, à partir de md ;
 * - variant "mobile" : bouton rond posé sur la galerie, sous md.
 */
export default function BackButton({ fallbackHref, variant }) {
  const router = useRouter();

  const handleBack = () => {
    if (canGoBackInSite()) router.back();
    else router.push(fallbackHref);
  };

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={handleBack}
        aria-label="Retour"
        className={`absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-jardinerie-text shadow-md md:hidden ${focusRing}`}
      >
        <ArrowLeft size={20} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`mb-4 hidden items-center gap-2 rounded-full border border-jardinerie-primary px-4 py-2 text-sm font-bold text-jardinerie-text transition-colors hover:bg-jardinerie-primary hover:text-white focus-visible:ring-offset-2 md:inline-flex ${focusRing}`}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Retour
    </button>
  );
}
