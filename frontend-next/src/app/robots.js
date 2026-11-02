// Génère /robots.txt. Il est calculé au moment du build : après avoir changé SITE_INDEXABLE sur Vercel, il faut redéployer.
// Tant que ce site n'a pas remplacé l'ancien, tout est interdit aux moteurs de recherche (voir aussi la balise robots de layout.jsx).
export default function robots() {
  if (process.env.SITE_INDEXABLE !== 'true') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jardinerie.vercel.app';

  return {
    // Espace privé et pages de compte : sans intérêt pour un moteur de recherche (les pages portent aussi une balise noindex)
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/compte',
        '/connexion',
        '/inscription',
        '/mot-de-passe-oublie',
        '/reinitialiser-mot-de-passe',
        '/verifier-email',
        '/confirmer-changement-email',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
