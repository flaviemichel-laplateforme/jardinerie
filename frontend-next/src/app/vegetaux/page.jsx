import CatalogPage from '../../components/catalog/CatalogPage';

// Les variantes filtrées (?categories=…) pointent vers l'adresse sans filtre : Google n'indexe qu'une page par rayon.
export const metadata = {
  title: 'Nos végétaux',
  description: "Plantes d'intérieur, d'extérieur, vivaces et aromatiques : trouvez la plante adaptée à votre lumière, à votre arrosage et à votre budget.",
  alternates: { canonical: '/vegetaux' },
};

export default function Page({ searchParams }) {
  return <CatalogPage mode="vegetaux" searchParams={searchParams} />;
}
