import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { productService } from '../services/productService';

// Mémoire de la session : produits déjà chargés pour chaque catalogue (adresse + filtres).
// Quand on revient en arrière depuis une fiche produit, on reprend cette liste au lieu de repartir de la
// page 1 : sans elle, la page serait trop courte pour retrouver la position de défilement quittée.
// Elle vit en mémoire du module : elle disparaît au rechargement de la page (F5), ce qui est voulu.
const listCache = new Map();
const MAX_CACHED_LISTS = 10;

/**
 * Gère le chargement par lots d'un catalogue paginé, déclenché par le scroll.
 *
 * @param {URLSearchParams} searchParams - Filtres actuels (recherche, catégories...)
 * @param {(params: URLSearchParams) => string} buildUrl - Construit l'URL finale pour une page donnée
 * @param {number} limit - Nombre de produits par page
 */
export function useInfiniteProducts(searchParams, buildUrl, limit = 12) {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const filtersKey = searchParams.toString();
  const cacheKey = `${pathname}?${filtersKey}`;

  // On ne reprend la liste mémorisée que sur un retour en arrière ('POP'). Une nouvelle visite
  // (clic dans le menu) repart d'une liste fraîche, pour ne pas afficher des stocks périmés.
  const [restored] = useState(() => (navigationType === 'POP' ? listCache.get(cacheKey) ?? null : null));

  const [items, setItems] = useState(restored?.items ?? []);
  const [page, setPage] = useState(restored?.page ?? 1);
  const [hasMore, setHasMore] = useState(restored?.hasMore ?? true);
  const [total, setTotal] = useState(restored?.total ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clé des filtres pour lesquels `items` est à jour : évite de recharger la page 1 juste après une restauration,
  // et d'enregistrer d'anciens produits sous la clé de nouveaux filtres pendant un changement de filtre.
  const loadedKey = useRef(restored ? filtersKey : null);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '200px',
    threshold: 0,
  });

  // Mémorise la liste affichée (produits, page, suite disponible) pour un éventuel retour en arrière
  useEffect(() => {
    if (loadedKey.current !== filtersKey || items.length === 0) return;

    listCache.delete(cacheKey); // réinsère en dernier : les plus anciennes sont supprimées en premier
    listCache.set(cacheKey, { items, page, hasMore, total });
    if (listCache.size > MAX_CACHED_LISTS) listCache.delete(listCache.keys().next().value);
  }, [cacheKey, filtersKey, items, page, hasMore, total]);

  // Les filtres ont changé (ou premier montage) : on repart de la page 1
  useEffect(() => {
    // Liste déjà restaurée depuis la mémoire pour ces filtres : rien à recharger
    if (loadedKey.current === filtersKey) return;

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      setPage(1);
      setLoading(true);

      const params = new URLSearchParams(searchParams);
      params.set('page', 1);
      params.set('limit', limit);

      productService.fetchPage(buildUrl(params)).then((result) => {
        if (cancelled) return;
        if (result.success) {
          loadedKey.current = filtersKey;
          setItems(result.data);
          setHasMore(result.pagination?.has_next ?? false);
          setTotal(result.pagination?.total_items ?? result.data.length);
          setError(null);
        } else {
          setError(result.message ?? "Impossible de charger le catalogue.");
        }
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setError("Impossible de charger le catalogue.");
        setLoading(false);
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // La sentinelle devient visible : on charge la page suivante
  useEffect(() => {
    if (!inView || !hasMore || loading) return;

    let cancelled = false;
    const nextPage = page + 1;

    const timeoutId = setTimeout(() => {
      setLoading(true);

      const params = new URLSearchParams(searchParams);
      params.set('page', nextPage);
      params.set('limit', limit);

      productService.fetchPage(buildUrl(params)).then((result) => {
        if (cancelled) return;
        if (result.success) {
          setItems((prev) => [...prev, ...result.data]);
          setHasMore(result.pagination?.has_next ?? false);
          setPage(nextPage);
          setError(null);
        } else {
          setError(result.message ?? "Impossible de charger la suite du catalogue.");
        }
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setError("Impossible de charger la suite du catalogue.");
        setLoading(false);
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return { items, loading, hasMore, total, error, sentinelRef };
}
