import { Suspense } from 'react';
import OrderDetail from '../../../../components/account/OrderDetail';
import Spinner from '../../../../components/ui/Spinner';

export const metadata = { title: 'Détail de la commande' };

// Le composant lit l'identifiant dans l'adresse (useParams) : Next.js demande de l'entourer de Suspense.
export default function Page() {
  return (
    <Suspense fallback={<Spinner message="Chargement..." />}>
      <OrderDetail />
    </Suspense>
  );
}
