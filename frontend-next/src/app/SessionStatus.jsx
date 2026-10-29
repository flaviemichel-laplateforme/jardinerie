'use client';

import { useAuth } from '../contexts/AuthContext';

// Page d'essai (étape 0b) : montre ce que l'API répond sur /api/auth/me à travers le relais Next.js.
export default function SessionStatus() {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <p className="rounded-lg bg-jardinerie-sand/40 p-3 text-sm text-jardinerie-text" data-testid="session-status">
      Session : {loading ? 'vérification…' : isAuthenticated ? `connecté en tant que ${user.email ?? 'utilisateur'}` : 'non connecté'}
    </p>
  );
}
