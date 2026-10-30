import { NextResponse } from 'next/server';
import { productService } from './services/productService';
import { productPath } from './utils/productUrl';

/**
 * Anciennes adresses de fiche produit (/produit/12, celles de l'ancien site et des liens déjà partagés) :
 * redirection définitive (308) vers la nouvelle adresse lisible (/produit/12-pilea-peperomioides).
 *
 * Fait ici, AVANT l'affichage de la page : une redirection décidée pendant l'affichage arrive trop tard pour changer
 * la réponse (la page est déjà en cours d'envoi), et les robots sans JavaScript ne la suivraient pas.
 */
export async function proxy(request) {
  const id = request.nextUrl.pathname.split('/').pop();

  try {
    const response = await fetch(productService.buildProductDetailUrl(id));
    if (response.ok) {
      const { data } = await response.json();
      if (data) return NextResponse.redirect(new URL(productPath(data), request.url), 308);
    }
  } catch {
    // API injoignable : on laisse passer, la page affichera l'erreur ou la 404
  }

  return NextResponse.next();
}

// Uniquement les adresses /produit/<nombre> : les autres pages ne passent pas par ici
export const config = {
  matcher: '/produit/:id(\\d+)',
};
