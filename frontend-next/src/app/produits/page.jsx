import CatalogPage from '../../components/catalog/CatalogPage';

// Les variantes filtrées (?categories=…) pointent vers l'adresse sans filtre : Google n'indexe qu'une page par rayon.
export const metadata = {
  title: 'Tous nos produits',
  description: "Tout le catalogue de La Jardinerie : plantes d'intérieur et d'extérieur, aromatiques, outils et terreaux, avec filtres par exposition, arrosage et prix.",
  alternates: { canonical: '/produits' },
};

export default function Page({ searchParams }) {
  return <CatalogPage mode="global" searchParams={searchParams} />;
}
