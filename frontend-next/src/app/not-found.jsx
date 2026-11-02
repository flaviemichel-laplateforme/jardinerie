import Link from 'next/link';

// Affichée pour toute adresse inconnue, et quand une page appelle notFound() (ex. produit inexistant).
// Next.js renvoie alors le code HTTP 404 : Google sait que la page n'existe pas.
export const metadata = {
  title: 'Page introuvable',
};

const suggestions = [
  { href: '/vegetaux', label: 'Nos végétaux' },
  { href: '/jardinage', label: 'Jardinage' },
  { href: '/produits', label: 'Tous nos produits' },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-jardinerie-primary">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-bold text-jardinerie-text">Cette page n&apos;existe pas (ou plus)</h1>
      <p className="mt-4 text-gray-600">
        Le lien est peut-être erroné, ou le produit n&apos;est plus disponible. Voici où reprendre votre visite :
      </p>
      <ul className="mt-8 flex flex-wrap justify-center gap-3">
        {suggestions.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-block rounded-full border border-jardinerie-primary px-5 py-2 text-sm font-bold text-jardinerie-text transition-colors hover:bg-jardinerie-primary hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="mt-8 inline-block text-sm text-jardinerie-primary underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
