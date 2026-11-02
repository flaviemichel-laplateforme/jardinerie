// Adresse de l'API PHP (Docker en local, Plesk en production).
const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:8000';

// Les images des produits sont servies directement par l'API (voir resolveAssetUrl) : c'est la seule origine externe autorisée.
const assetOrigin = new URL(process.env.NEXT_PUBLIC_ASSET_BASE_URL || 'http://localhost:8000').origin;

const isProduction = process.env.NODE_ENV === 'production';

// Politique de sécurité du contenu (CSP) : liste ce que le navigateur a le droit de charger. Une faille qui injecterait un script
// venu d'ailleurs (XSS) serait alors bloquée.
// - 'unsafe-inline' pour les scripts : Next.js place de petits scripts dans chaque page, et les pages prérendues ne peuvent pas
//   recevoir de jeton à usage unique (nonce). Les scripts venus d'AUTRES sites restent bloqués.
// - 'unsafe-inline' pour les styles : les notifications (react-hot-toast) posent des styles en ligne.
// - 'unsafe-eval' seulement en développement : le rechargement à chaud de Next.js en a besoin.
// - Turnstile (contrôle anti-robots de Cloudflare) : son script et son cadre viennent de challenges.cloudflare.com.
// - Stripe sera ajouté ici avec le tunnel de paiement : js.stripe.com.
const turnstileOrigin = 'https://challenges.cloudflare.com';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstileOrigin}${isProduction ? '' : " 'unsafe-eval'"}`,
  `frame-src ${turnstileOrigin}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${assetOrigin}`,
  "font-src 'self'",
  `connect-src 'self'${isProduction ? '' : ' ws:'}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// CSP_REPORT_ONLY=true (variable Vercel) : le navigateur signale les infractions dans sa console au lieu de bloquer.
// Sert de filet de sécurité si une page se retrouvait cassée après un changement : on la remet en mode « bloquant » ensuite.
const cspHeaderName =
  process.env.CSP_REPORT_ONLY === 'true' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

const securityHeaders = [
  { key: cspHeaderName, value: contentSecurityPolicy },
  // Le navigateur ne « devine » pas le type d'un fichier : un envoi déguisé ne sera pas exécuté comme un script
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Le site ne peut pas être affiché dans une iframe d'un autre site (« clickjacking ») ; X-Frame-Options pour les vieux navigateurs
  { key: 'X-Frame-Options', value: 'DENY' },
  // Vers un autre site, on n'envoie que le nom de domaine, jamais l'adresse complète de la page
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Le site n'utilise ni caméra, ni micro, ni localisation : on les interdit
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Le navigateur ne charge ce site qu'en HTTPS pendant un an. Sans includeSubDomains ni preload : engagements à reconsidérer à l'achat du domaine.
  ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  // N'annonce plus « X-Powered-By: Next.js » : inutile de renseigner un attaquant sur la technologie utilisée
  poweredByHeader: false,

  // Année affichée dans le pied de page, figée au moment du build (elle change donc à chaque déploiement).
  // Next.js refuse `new Date()` pendant la construction des pages : la valeur serait figée sans qu'on le voie.
  env: {
    BUILD_YEAR: String(new Date().getFullYear()),
  },

  // Relais : tout ce que le navigateur envoie à "/api/..." est transmis à l'API PHP.
  // Le navigateur croit parler au site (même domaine) : le cookie de session n'est plus un cookie « tiers ».
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },

  // En-têtes de sécurité sur toutes les pages. Les réponses de l'API (relayées) ont les leurs, posées par PHP.
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
