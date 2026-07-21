import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { productService } from '../services/productService';

/**
 * Gère le chargement par lots d'un catalogue paginé, déclenché par le scroll.
 *
 * @param {URLSearchParams} searchParams - Filtres actuels (recherche, catégories...)
 * @param {(params: URLSearchParams) => string} buildUrl - Construit l'URL finale pour une page donnée
 * @param {number} limit - Nombre de produits par page
 */
export function useInfiniteProducts(searchParams, buildUrl, limit = 12) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '200px',
    threshold: 0,
  });

  const filtersKey = searchParams.toString();

  // Les filtres ont changé (ou premier montage) : on repart de la page 1
  useEffect(() => {
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
