import { getAllProducts } from '../services/productData';
import { productPath } from '../utils/productUrl';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jardinerie.vercel.app';

// Pages fixes du site, avec leur importance relative (indication pour les moteurs de recherche)
const STATIC_PAGES = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/produits', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/vegetaux', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/jardinage', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/cgv', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/mentions-legales', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/politique-confidentialite', changeFrequency: 'yearly', priority: 0.2 },
];

/**
 * Génère /sitemap.xml : la liste des pages à proposer à Google, dont toutes les fiches produit (adresses canoniques).
 * Pas de date de modification : l'API ne la fournit pas, et une date inventée tromperait les moteurs de recherche.
 * Référencé par robots.txt une fois SITE_INDEXABLE=true.
 */
export default async function sitemap() {
  const products = await getAllProducts();

  return [
    ...STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({ url: `${SITE_URL}${path}`, changeFrequency, priority })),
    ...products.map((product) => ({
      url: `${SITE_URL}${productPath(product)}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ];
}
