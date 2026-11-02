'use client'; // Les pages d'erreur sont forcément des composants client

import { useEffect } from 'react';
import Link from 'next/link';

// Affichée à la place d'une page qui a planté (API injoignable, réponse inattendue…), sans casser l'en-tête ni le pied de page.
// retry() relance le chargement des données de la page, puis l'affiche à nouveau.
export default function Error({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-jardinerie-text">Un problème est survenu</h1>
      <p className="mt-4 text-gray-600">
        La page n&apos;a pas pu être chargée. Il s&apos;agit sans doute d&apos;un souci passager : réessayez dans un instant.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-jardinerie-primary px-6 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-full border border-jardinerie-primary px-6 py-2 text-sm font-bold text-jardinerie-text transition-colors hover:bg-jardinerie-bg"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
