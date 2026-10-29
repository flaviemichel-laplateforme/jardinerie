// Génère /robots.txt. Il est calculé au moment du build : après avoir changé SITE_INDEXABLE sur Vercel, il faut redéployer.
// Tant que ce site n'a pas remplacé l'ancien, tout est interdit aux moteurs de recherche (voir aussi la balise robots de layout.jsx).
export default function robots() {
  if (process.env.SITE_INDEXABLE !== 'true') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jardinerie.vercel.app';

  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/compte'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
