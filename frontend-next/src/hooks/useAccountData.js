import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { sendJson } from '../services/requestJson';

/**
 * Charge une donnée de l'espace client (GET) : { data, loading, error, notFound, reload }.
 * - 401 : la session a expiré pendant la visite -> on ferme l'état connecté et on renvoie vers /connexion, avec retour ici ensuite.
 * - 404 : donnée introuvable (ex. commande qui n'est pas la nôtre) : `notFound` permet d'afficher un message dédié.
 * `reload()` relit la donnée sans remettre l'écran de chargement (après l'ajout d'une adresse, par exemple).
 */
export function useAccountData(url) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [state, setState] = useState({ data: null, loading: true, error: '', notFound: false });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    sendJson(url, { method: 'GET', signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;

      if (result.status === 401) {
        logout();
        router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setState({
        data: result.ok ? result.data : null,
        loading: false,
        error: result.ok ? '' : result.message,
        notFound: result.status === 404,
      });
    });

    return () => controller.abort();
  }, [url, version, logout, router, pathname]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
