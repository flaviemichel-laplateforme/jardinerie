import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { productService } from '../services/productService';

/** État de départ : la 1re page envoyée par le serveur. */
const fromServer = (initial) => ({ items: initial.items, page: 1, hasMore: initial.hasMore, total: initial.total });

/**
 * Gère le chargement par lots d'un catalogue paginé, déclenché par le scroll.
 *
 * Différences avec l'ancienne version (Vite) :
 * - la 1re page n'est plus chargée par le navigateur, elle arrive du serveur (dans le HTML, donc visible par Google) ;
 *   le navigateur ne charge que les pages suivantes ;
 * - plus de mémoire maison pour le bouton Retour : Next.js garde lui-même les 3 dernières pages visitées, masquées,
 *   avec leur état et leur position de défilement (voir CatalogView pour la remise à zéro sur un nouveau clic).
 *
 * @param {{ key: string, items: object[], hasMore: boolean, total: number, error: string|null }} initial
 *        1re page calculée par le serveur ; `key` = filtres qui l'ont produite
 * @param {(params: URLSearchParams) => string} buildUrl - Construit l'URL finale pour une page donnée
 * @param {number} limit - Nombre de produits par page
 */
export function useInfiniteProducts(initial, buildUrl, limit = 12) {
  const [list, setList] = useState(() => fromServer(initial));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initial.error);

  // Les filtres ont changé : le serveur a renvoyé une nouvelle 1re page, on repart de celle-ci.
  // (Mise à jour pendant le rendu plutôt que dans un effet : évite d'afficher un instant l'ancienne liste.)
  const [currentKey, setCurrentKey] = useState(initial.key);
  if (initial.key !== currentKey) {
    setCurrentKey(initial.key);
    setList(fromServer(initial));
    setError(initial.error);
  }

  // Filtres de la requête en cours : une réponse arrivée après un changement de filtres est ignorée.
  const requestKey = useRef(initial.key);
  useEffect(() => {
    requestKey.current = initial.key;
  }, [initial.key]);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '200px',
    threshold: 0,
  });

  // La sentinelle devient visible : on charge la page suivante
  useEffect(() => {
    if (!inView || !list.hasMore || loading) return;

    const key = initial.key;
    const nextPage = list.page + 1;
    const params = new URLSearchParams(key);
    params.set('page', nextPage);
    params.set('limit', limit);

    // Une requête lancée va jusqu'au bout, même si la sentinelle sort de l'écran entre-temps : l'abandonner laisserait
    // `loading` bloqué à true et plus aucune page ne se chargerait. Seul un changement de filtres fait ignorer la réponse.
    const timeoutId = setTimeout(() => {
      setLoading(true);

      productService.fetchPage(buildUrl(params)).then((result) => {
        setLoading(false);
        if (requestKey.current !== key) return;
        if (result.success) {
          setList((prev) => ({
            items: [...prev.items, ...result.data],
            page: nextPage,
            hasMore: result.pagination?.has_next ?? false,
            total: prev.total,
          }));
          setError(null);
        } else {
          setError(result.message ?? "Impossible de charger la suite du catalogue.");
        }
      }).catch(() => {
        setLoading(false);
        if (requestKey.current !== key) return;
        setError("Impossible de charger la suite du catalogue.");
      });
    }, 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return { items: list.items, loading, hasMore: list.hasMore, total: list.total, error, sentinelRef };
}
