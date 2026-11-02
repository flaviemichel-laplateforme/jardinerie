import { cacheLife } from 'next/cache';
import { productService } from './productService';

// Données produit lues par le SERVEUR (fiche produit, sitemap). Résultats mis en cache, rafraîchis au plus toutes
// les minutes : la fiche, ses métadonnées (titre, description) et le sitemap partagent le même appel à l'API.

/**
 * Un produit, ou null s'il n'existe pas (ou plus).
 * Une panne de l'API lève une erreur : la page d'erreur s'affiche, au lieu d'une fausse page 404.
 */
export async function getProduct(id) {
  'use cache';
  cacheLife('minutes');

  const response = await fetch(productService.buildProductDetailUrl(id));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`L'API a répondu ${response.status} pour le produit ${id}`);

  const result = await response.json();
  return result.data ?? null;
}

/** Tous les produits actifs (sans pagination). Liste vide si l'API est injoignable, par exemple pendant un build. */
export async function getAllProducts() {
  'use cache';
  cacheLife('minutes');

  try {
    const response = await fetch(productService.buildCatalogUrl(new URLSearchParams()));
    const result = await response.json();
    return response.ok && result.success ? result.data : [];
  } catch {
    return [];
  }
}
