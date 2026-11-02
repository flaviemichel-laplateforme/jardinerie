import { Suspense } from 'react';
import RequireAuth from '../../components/account/RequireAuth';
import AccountShell from '../../components/account/AccountShell';
import Spinner from '../../components/ui/Spinner';

// Tout l'espace client : jamais dans les moteurs de recherche, et réservé aux personnes connectées.
export const metadata = {
  robots: { index: false, follow: false },
};

// Suspense : la garde et la navigation lisent l'adresse de la page (usePathname), connue seulement à la requête pour les
// pages à identifiant (/compte/commandes/12). Tant qu'elle arrive, on affiche l'écran d'attente.
export default function CompteLayout({ children }) {
  return (
    <Suspense fallback={<Spinner message="Chargement de votre espace..." />}>
      <RequireAuth>
        <AccountShell>{children}</AccountShell>
      </RequireAuth>
    </Suspense>
  );
}
