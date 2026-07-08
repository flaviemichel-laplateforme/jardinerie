import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ requireAdmin = false }) {
  // On récupère les infos depuis AuthContext
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation(); // Permet de savoir quelle URL l'utilisateur essayait de visiter

  
  // Si l'application est encore en train de vérifier le JWT dans les cookies...
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner message="Vérification de vos accès..." />
      </div>
    );
  }

  // Authentification (L'utilisateur est-il connecté ?)
  if (!isAuthenticated) {
    // Il n'est pas connecté. On le renvoie vers la page de connexion.
    // On utilise state={{ from: location }} pour mémoriser l'URL qu'il voulait voir !
    // "replace" efface l'historique pour éviter qu'il revienne ici en cliquant sur "Précédent".
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Autorisation (Si la route exige d'être Admin, l'est-il ?)
  if (requireAdmin && user?.role !== 'admin') {
    // C'est un client classique qui essaie d'aller sur /admin. On le renvoie chez lui.
    return <Navigate to="/compte" replace />;
  }

    // Succès ! <Outlet /> dit à React Router d'afficher les composants enfants définis dans App.jsx
  return <Outlet />;
}