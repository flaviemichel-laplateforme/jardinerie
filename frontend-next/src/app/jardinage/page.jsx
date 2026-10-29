import CatalogPage from '../../components/catalog/CatalogPage';

// Les variantes filtrées (?categories=…) pointent vers l'adresse sans filtre : Google n'indexe qu'une page par rayon.
export const metadata = {
  title: 'Jardinage',
  description: "Outils à main, terreaux et engrais pour entretenir votre jardin et vos plantes : sécateurs, bêches, arrosoirs, substrats et engrais naturels.",
  alternates: { canonical: '/jardinage' },
};

export default function Page({ searchParams }) {
  return <CatalogPage mode="jardinage" searchParams={searchParams} />;
}
