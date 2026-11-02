import { Suspense } from 'react';
import TokenConfirmation from '../../components/auth/TokenConfirmation';
import Spinner from '../../components/ui/Spinner';

export const metadata = {
  title: "Vérification de l'adresse e-mail",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<Spinner message="" className="min-h-[300px]" />}>
      <TokenConfirmation
        action="verify-email"
        successTitle="Compte activé"
        successText="Votre adresse e-mail est confirmée : votre compte est maintenant actif."
      />
    </Suspense>
  );
}
