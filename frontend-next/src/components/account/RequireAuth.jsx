'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

/**
 * Garde de l'espace client : tant que la session n'est pas vérifiée on affiche un spinner, et sans session on renvoie vers
 * /connexion en retenant la page demandée (?redirect=). C'est un confort d'affichage : la vraie protection est côté API,
 * qui refuse (401) toute requête sans session valide.
 */
export default function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading || !isAuthenticated) {
    return <Spinner message="Chargement de votre espace..." />;
  }

  return children;
}
