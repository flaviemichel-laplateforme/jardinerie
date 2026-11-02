import { NextResponse } from 'next/server';
import { productService } from './services/productService';
import { productPath } from './utils/productUrl';

/**
 * Passe par ici : (1) les appels à l'API relayés vers PHP, (2) les anciennes adresses de fiche produit.
 * Fait ici, AVANT l'affichage ou le relais : une décision prise pendant l'affichage arrive trop tard pour changer la réponse.
 */
export async function proxy(request) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return forwardToApi(request);
  }

  return redirectOldProductUrl(request);
}

/**
 * Appels à l'API (/api/*), relayés vers PHP par next.config.mjs : on y ajoute un en-tête secret.
 *
 * Pourquoi : pour limiter les tentatives de connexion par IP, PHP doit connaître l'IP du visiteur. Derrière le relais, il ne voit
 * que celle du relais ; Vercel met l'IP du visiteur dans X-Forwarded-For. Mais n'importe qui peut aussi appeler PHP directement
 * avec un X-Forwarded-For inventé. PHP ne croit donc cet en-tête que si la requête porte le secret partagé : seul ce relais
 * le connaît, et un visiteur ne peut pas le poser (celui qu'il enverrait est écrasé ici).
 * Sans la variable PROXY_SHARED_SECRET (développement local), rien n'est ajouté : PHP utilise alors l'adresse de la connexion.
 */
function forwardToApi(request) {
  const headers = new Headers(request.headers);
  headers.delete('x-proxy-secret');

  const secret = process.env.PROXY_SHARED_SECRET;
  if (secret) {
    headers.set('x-proxy-secret', secret);
  }

  return NextResponse.next({ request: { headers } });
}

/**
 * Anciennes adresses de fiche produit (/produit/12, celles de l'ancien site et des liens déjà partagés) :
 * redirection définitive (308) vers la nouvelle adresse lisible (/produit/12-pilea-peperomioides).
 * Une redirection décidée pendant l'affichage de la page arrive trop tard, et les robots sans JavaScript ne la suivraient pas.
 */
async function redirectOldProductUrl(request) {
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

// Les appels à l'API, et uniquement les adresses /produit/<nombre> : les autres pages ne passent pas par ici
export const config = {
  matcher: ['/produit/:id(\\d+)', '/api/:path*'],
};
