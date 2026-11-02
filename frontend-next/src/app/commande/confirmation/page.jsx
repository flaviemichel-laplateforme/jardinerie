import { Suspense } from 'react';
import ConfirmationStatus from '../../../components/checkout/ConfirmationStatus';
import Spinner from '../../../components/ui/Spinner';

export const metadata = { title: 'Confirmation de commande' };

// Le composant lit l'adresse de la page (?payment_intent=…) avec useSearchParams : Next.js demande de l'entourer de Suspense.
export default function Page() {
  return (
    <Suspense fallback={<Spinner message="Chargement..." />}>
      <ConfirmationStatus />
    </Suspense>
  );
}
