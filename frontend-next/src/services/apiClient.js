// Où envoyer les appels à l'API PHP ?
// - Dans le navigateur : adresse relative ("/api/..."). C'est Next.js qui relaie vers l'API (voir "rewrites" dans
//   next.config.mjs) : le navigateur ne parle qu'au site, donc le cookie de session reste un cookie « première partie ».
// - Sur le serveur Next.js (rendu des pages) : adresse réelle de l'API, car il n'y a pas de navigateur pour relayer.
export const BASE_URL =
    typeof window === 'undefined'
        ? process.env.API_INTERNAL_URL || 'http://localhost:8000'
        : '';

// Les images sont servies directement par l'API PHP (le relais ne concerne que "/api").
// Variable NEXT_PUBLIC_ : même valeur sur le serveur et dans le navigateur, sinon le HTML ne correspondrait pas.
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL || 'http://localhost:8000';

export function buildRequestOptions({ method = 'GET', body, headers = {}, signal } = {}) {
    const options = {
        method,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...headers,
        },
        ...(signal && { signal }),
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return options;
}

export function resolveAssetUrl(path) {
  if (path.startsWith('http')) return path;
  return `${ASSET_BASE_URL}/${path.replace(/^\//, '')}`;
}
