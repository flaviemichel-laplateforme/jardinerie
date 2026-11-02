import Spinner from '../ui/Spinner';

/** Écran d'attente pendant le chargement d'une donnée de l'espace client. */
export function LoadingState({ message = 'Chargement...' }) {
  return <Spinner message={message} />;
}

/** Message d'erreur quand une donnée n'a pas pu être chargée (message du serveur, ou texte de repli). */
export function ErrorState({ message }) {
  return (
    <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
      {message || 'Une erreur est survenue lors du chargement.'}
    </div>
  );
}
