import { cacheLife } from 'next/cache';
import { productService } from '../services/productService';
import SessionStatus from './SessionStatus';

// Données récupérées sur le SERVEUR, mises en cache (rafraîchies au plus toutes les minutes) : le HTML envoyé à Google contient déjà les produits.
// La page est construite pendant le build : si l'API est injoignable (par exemple API_INTERNAL_URL oubliée sur Vercel),
// on affiche un message au lieu de faire échouer tout le déploiement.
async function getProducts() {
  'use cache';
  cacheLife('minutes');

  try {
    const response = await fetch(productService.buildHomeUrl());
    if (!response.ok) {
      return { products: [], error: `L'API des produits a répondu ${response.status}.` };
    }
    const json = await response.json();
    return { products: json.data ?? [], error: null };
  } catch {
    return { products: [], error: "L'API des produits est injoignable." };
  }
}

// Page d'essai de l'étape 0 : exclue de la validation « navigation instantanée » (elle sera remplacée à l'étape 1).
export const instant = false;

export default async function HomePage() {
  const { products, error } = await getProducts();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-jardinerie-primary">La Jardinerie — page d&apos;essai Next.js</h1>
      <SessionStatus />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section>
        <h2 className="mb-2 text-lg font-bold text-jardinerie-text">{products.length} produits (rendus côté serveur)</h2>
        <ul className="list-inside list-disc text-sm text-gray-700">
          {products.map((product) => (
            <li key={product.id}>{product.product_name ?? product.name}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
