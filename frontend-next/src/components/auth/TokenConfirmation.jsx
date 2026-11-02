'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { sendJson } from '../../services/requestJson';
import { authService } from '../../services/authService';
import AuthCard from './AuthCard';
import Spinner from '../ui/Spinner';

/**
 * Page ouverte depuis le lien d'un e-mail (vérification de l'adresse, confirmation d'un changement d'adresse).
 * Le jeton est lu dans l'adresse, EFFACÉ de la barre d'adresse, puis envoyé en POST : ouvrir le lien (même par un robot
 * d'e-mail qui prévisualise la page) ne suffit pas à l'utiliser, il faut que cette page tourne dans un navigateur.
 *
 * Props :
 * - action : quelle route de l'API valide le jeton ('verify-email' ou 'confirm-email-change')
 * - successTitle / successText : écran de réussite
 * - closeSession : le changement d'adresse ferme toutes les sessions côté API, on vide aussi l'état de la page
 *
 * On passe le NOM de l'action, pas l'adresse de l'API : la page serveur qui appelle ce composant connaîtrait l'adresse
 * INTERNE de l'API (http://localhost:8000...). Le navigateur doit au contraire appeler « /api/... », relayé par le site.
 */
const ENDPOINTS = {
  'verify-email': () => authService.buildVerifyEmailUrl(),
  'confirm-email-change': () => authService.buildConfirmEmailChangeUrl(),
};

export default function TokenConfirmation({ action, successTitle, successText, closeSession = false }) {
  const url = ENDPOINTS[action]();
  const searchParams = useSearchParams();
  const { logout } = useAuth();

  const [token] = useState(() => searchParams.get('token') ?? '');
  const [result, setResult] = useState(null); // null = en cours ; sinon { ok, message }
  const started = useRef(false);

  useEffect(() => {
    if (!token) return;
    window.history.replaceState(null, '', window.location.pathname);

    // Le mode strict de React lance les effets deux fois en développement : un jeton ne se valide qu'une fois, donc on garde un témoin.
    if (started.current) return;
    started.current = true;

    sendJson(url, { body: { token } }).then((response) => {
      setResult(response);
      if (response.ok && closeSession) logout();
    });
  }, [token, url, closeSession, logout]);

  if (!token) {
    return (
      <AuthCard title="Lien invalide">
        <p className="text-center text-sm text-gray-600">Ce lien est incomplet. Utilisez le lien reçu par e-mail.</p>
        <p className="mt-4 text-center text-sm">
          <Link href="/connexion" className="font-medium text-jardinerie-primary underline">Se connecter</Link>
        </p>
      </AuthCard>
    );
  }

  if (!result) {
    return (
      <AuthCard title="Vérification en cours">
        <Spinner message="Un instant..." className="min-h-[120px]" />
      </AuthCard>
    );
  }

  if (!result.ok) {
    return (
      <AuthCard title="Lien invalide ou expiré">
        <div className="space-y-4 text-center text-sm text-gray-600">
          <p role="alert">{result.message}</p>
          <Link href="/connexion" className="inline-block font-medium text-jardinerie-primary underline">
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={successTitle}>
      <div className="space-y-4 text-center text-sm text-gray-600">
        <p role="status">{successText}</p>
        <Link
          href="/connexion"
          className="inline-block rounded-full bg-jardinerie-primary px-6 py-2.5 font-bold text-white transition-all hover:bg-green-700"
        >
          Se connecter
        </Link>
      </div>
    </AuthCard>
  );
}
